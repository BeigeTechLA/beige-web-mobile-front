/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import {
  CreditCard,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Map,
  Icon,
  Info,
  ShieldCheck,
  FileImage,
  RefreshCw,
  Package,
  Phone,
  CheckCircle2,
  X,
  Video,
  Camera,
} from "lucide-react";
import {
  weddingEditTypes,
  musicEditTypes,
  commercialEditTypes,
  tvSeriesEditTypes,
  podcastEditTypes,
  shortFilmEditTypes,
  movieEditTypes,
  corporateEventEditTypes,
  privateEventEditTypes,
  socialContentEditTypes,
  weddingPhotoEditTypes,
  corporateEventPhotoEditTypes,
  privateEventPhotoEditTypes,
  musicPhotoEditTypes,
  commercialPhotoEditTypes,
  socialContentPhotoEditTypes,
  brandProductPhotoEditTypes,
  peopleTeamsPhotoEditTypes,
  behindScenesPhotoEditTypes,
  videoShootTypes,
  photoShootTypes,
  hybridShootTypes,
} from "@/app/data/shootData";
import { useCalculateQuoteFromCreatorsMutation } from "@/lib/redux/features/pricing/pricingApi";
import { newshootTypes } from "@/app/data/shootData";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { pushToDataLayer } from "@/lib/gtm";
import { useAuth } from "@/lib/hooks/useAuth";
import { buildEditTypeCounts } from "./utils";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void; // New prop
  isSubmitting?: boolean;
}

interface ShootTypeProps {
  title: string;
  details: string; // e.g. "Conferences, summits, company offsites"
  image: string;
  stats?: { label: string; value: string }[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const V3Step4BookConfirm: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  onConfirm,
  isSubmitting,
}) => {
  const { user, isAuthenticated } = useAuth()

  const [calculateQuoteFromCreators, { isLoading: isCalculating }] =
    useCalculateQuoteFromCreatorsMutation();
  const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
  const [crewBreakdown, setCrewBreakdown] = useState<
    Array<{ role: string; cost: number }>
  >([]);
  const [errors, setErrors] = useState<string[]>([])

  // Check if any editing services are selected
  const hasEditing = data.videoEditTypes.length > 0 || data.photoEditTypes.length > 0;

  // UPDATED STATE FOR AGGREGATED ADDITIONAL PARTNERS
  const [pricingGroups, setPricingGroups] = useState<{
    shootCost: number;
    additionalCP: { totalCost: number; videoCount: number; photoCount: number };
    mandatoryAddons: Array<{ role: string; cost: number }>;
    editingFees: number; // ADDED
  }>({
    shootCost: 0,
    additionalCP: { totalCost: 0, videoCount: 0, photoCount: 0 },
    mandatoryAddons: [],
    editingFees: 0, // INITIALIZED
  });

  const bookingDays = data.bookingDays || [];
  const sortedBookingDays = bookingDays.slice().sort((a, b) => a.date.localeCompare(b.date));
  const isMultiDay = data.bookingType === "multi_day" && sortedBookingDays.length > 0;
  const firstDay = sortedBookingDays[0];
  const lastDay = sortedBookingDays[sortedBookingDays.length - 1];
  const allSameTime = isMultiDay && sortedBookingDays.every(
    (d) => d.startTime === firstDay?.startTime && d.endTime === firstDay?.endTime
  );
  const displayDateText = isMultiDay
    ? `${sortedBookingDays.length} days • ${format(new Date(firstDay.date), "EEE, dd MMM yyyy")} - ${format(new Date(lastDay.date), "EEE, dd MMM yyyy")}`
    : data.startDate
      ? format(new Date(data.startDate), "EEEE, dd MMM yyyy")
      : "Date not set";
  const displayTimeText = isMultiDay
    ? allSameTime && firstDay?.startTime && firstDay?.endTime
      ? `${firstDay.startTime} - ${firstDay.endTime}`
      : "Multiple times"
    : data.startDate && data.endDate
      ? `${format(new Date(data.startDate), "h:mm a")} - ${format(new Date(data.endDate), "h:mm a")}`
      : "Time not set";

  const [durationHours, setDurationHours] = useState<number>(0);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showSalesPopup, setShowSalesPopup] = useState(false);


  const formatShootTypeLabel = (value: string) => {
    if (!value) return "Project";
    return value
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  };

  const isVideoContent = data.contentType.some((type) =>
    ["videographer", "cinematographer"].includes(type),
  );
  const isPhotoContent = data.contentType.includes("photographer");

  const shootTypeSource = isVideoContent && isPhotoContent
    ? hybridShootTypes
    : isPhotoContent
      ? photoShootTypes
      : isVideoContent
        ? videoShootTypes
        : newshootTypes;

  const shootInfo: ShootTypeProps = (() => {
    const fallbackPools = [
      ...newshootTypes,
      ...videoShootTypes,
      ...photoShootTypes,
      ...hybridShootTypes,
    ];

    const match =
      shootTypeSource.find((type) => type.key === data.shootType) ||
      fallbackPools.find((type) => type.key === data.shootType);

    if (match) return match;

    return {
      title: formatShootTypeLabel(data.shootType),
      details: "Shoot type",
      image: "/images/projects/interior.png",
    };
  })();

  const shootTypeTag = isVideoContent && isPhotoContent
    ? "#Photo + Video shoot type"
    : isPhotoContent
      ? "#Photo shoot type"
      : isVideoContent
        ? "#Video shoot type"
        : "#Shoot type";

  const handlePay = () => {
    if (!data.fullName || !data.phone) {
      toast.error("Please fill in your contact information");
      setErrors((prev) => [...prev, "contactError"]);
      return;
    }
    // Trigger submission
    onConfirm();
  };

  useEffect(() => {
    const formFields = {
      content_type: data.contentType.join(","),
      shoot_type: data.shootType,
      shoot_date_time: `${data.startDate} to ${data.endDate}`,
      edits_needed: data.editsNeeded,
      photo_edit_types: data.photoEditTypes.join(", "),
      video_edit_types: data.videoEditTypes.join(", "),
      additional_creative: data.addTeamMembers,
      shoot_location: data.location,
      additional_details: data.specialInstructions,
      supporting_url: data.referenceLinks,
      videographyCount: data?.videographyCount,
      photographyCount: data?.photographyCount,
      cp_ids: data?.selectedCrewIds,
    };

    // add GA event on initial page load
    pushToDataLayer("booking_payment_confirm_view", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_review_confirm",
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
      email: isAuthenticated ? user?.email : data.email,
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      duration_on_page: performance.now() / 1000,
      booking_id: data?.bookingId,
      booking_form_fields: formFields
    });
  }, [])

  // Calculate duration in hours
  useEffect(() => {
    if (data.bookingType === "multi_day" && data.bookingDays && data.bookingDays.length > 0) {
      const total = data.bookingDays.reduce((sum, d) => {
        if (!d.startTime || !d.endTime) return sum;
        const [sh, sm] = d.startTime.split(":").map(Number);
        const [eh, em] = d.endTime.split(":").map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return sum;
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const diff = endMinutes - startMinutes;
        if (diff <= 0) return sum;
        return sum + diff / 60;
      }, 0);
      setDurationHours(Math.max(1, Math.round(total)));
      return;
    }

    if (!data.startDate || !data.endDate) {
      setDurationHours(0);
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    setDurationHours(hours);
  }, [data.startDate, data.endDate, data.bookingType, data.bookingDays]);

  // Calculate quote when component mounts or data changes
  useEffect(() => {
    const fetchQuote = async () => {
      // Check if we have duration
      if (durationHours === 0) {
        setQuoteTotal(null);
        setCrewBreakdown([]);
        return;
      }

      try {
        console.log("V3Step4BookConfirm - Sending to API:", {
          creator_ids: data.selectedCrewIds,
          selectedCrewCount: data.selectedCrewIds?.length || 0,
          shoot_hours: durationHours,
          event_type: data.shootType,
          crewCount: data.crewCount,
          shoot_start_date: data.startDate, // Verification log
        });

        // Use the correct endpoint that handles multiple creators and mandatory fees
        // const result = await calculateQuoteFromCreators({
        //   creator_ids: data.selectedCrewIds,
        //   shoot_hours: durationHours,
        //   role_counts: data.roleCounts,
        //   event_type: data.shootType || "general",
        //   shoot_start_date: data.startDate, // <--- PASSING THE DATE FOR RUSH FEE CALCULATION
        //   skip_discount: true, // Remove hour-based discounts for V3
        //   skip_margin: true,   // Remove beige margin for V3
        // }).unwrap();

        const firstBookingDate = data.bookingType === "multi_day" && data.bookingDays && data.bookingDays.length > 0
          ? data.bookingDays.slice().sort((a, b) => a.date.localeCompare(b.date))[0]?.date
          : null;

        const result = await calculateQuoteFromCreators({
          creator_ids: data.selectedCrewIds,
          shoot_hours: durationHours,
          role_counts: data.roleCounts,
          event_type: data.shootType || "general",
          shoot_start_date: firstBookingDate ? `${firstBookingDate}T00:00:00.000Z` : data.startDate,
          video_edit_types: buildEditTypeCounts(data.videoEditTypes),
          photo_edit_types: buildEditTypeCounts(data.photoEditTypes),
          skip_discount: true,
          skip_margin: true,
        }).unwrap();

        console.log("V3Step4BookConfirm - API Result:", {
          total: result.total,
          creators: result.creators,
          lineItems: result.lineItems,
          shootHours: result.shootHours,
          durationHours,
        });

        // result.total now includes Pre-Production and Rush Fees from backend logic
        setQuoteTotal(result.total);

        // --- START CATEGORIZATION LOGIC ---
        let shootCostTotal = 0;
        let editFeesTotal = 0;
        let addVideoCount = 0;
        let addPhotoCount = 0;
        let addCPTotalCost = 0;
        const mandatoryAddonsList: Array<{ role: string; cost: number }> = [];

        if (result.lineItems && result.lineItems.length > 0) {
          result.lineItems.forEach((item: any) => {
            const name = item.item_name;
            const quantity = parseInt(item.quantity || 1);
            const lineTotal = parseFloat(item.line_total || 0);
            const unitPrice = lineTotal / quantity;

            // 1. Shoot Cost: Includes Pre-production, Rush Fees, and 1 unit of Video/Photo
            if (name.includes("Pre-Production") || name.toLowerCase().includes("rush")) {
              shootCostTotal += lineTotal;
            }
            if (item.category_slug === 'editing') {
              editFeesTotal += lineTotal;
            }

            else if (name === "Videographer" || name === "Photographer") {
              // Add first unit to Shoot Cost
              shootCostTotal += unitPrice;

              // If more than 1, aggregate the rest for "Additional Creative Partner Fees"
              if (quantity > 1) {
                const extraQty = quantity - 1;
                addCPTotalCost += unitPrice * extraQty;
                if (name === "Videographer") addVideoCount += extraQty;
                if (name === "Photographer") addPhotoCount += extraQty;
              }
            }
            // 2. Mandatory Add-ons: PA, Sound, Director, Gaffer or Equipment
            else if (item.is_mandatory) {
              mandatoryAddonsList.push({
                role: name,
                cost: lineTotal
              });
            }
            // 3. Fallback for other items (not Photo/Video but also not mandatory)
            else {
              // We'll treat other non-mandatory roles as additional CP fees as well
              addCPTotalCost += lineTotal;
            }
          });
        }

        setPricingGroups({
          shootCost: shootCostTotal,
          editingFees: editFeesTotal, // UPDATE THIS
          additionalCP: {
            totalCost: addCPTotalCost,
            videoCount: addVideoCount,
            photoCount: addPhotoCount
          },
          mandatoryAddons: mandatoryAddonsList
        });
        // --- END CATEGORIZATION LOGIC ---

        // Build crew breakdown from lineItems (has actual costs per role)
        if (result.lineItems && result.lineItems.length > 0) {
          const breakdown: Array<{ role: string; cost: number }> = [];

          result.lineItems.forEach((item: any) => {
            if (item.is_mandatory || item.hidden) return;

            const itemTotal = parseFloat(item.line_total || 0);
            const quantity = parseInt(item.quantity || 1);
            const costPerPerson = itemTotal / quantity;

            for (let i = 0; i < quantity; i++) {
              breakdown.push({
                role: item.item_name,
                cost: costPerPerson,
              });
            }
          });
          setCrewBreakdown(breakdown);
        }
      } catch (error) {
        console.error("Failed to calculate quote:", error);
        setQuoteTotal(null);
        setCrewBreakdown([]);
        toast.error("Failed to calculate pricing. Please try again.");
      }
    };

    fetchQuote();
  }, [
    data.selectedCrewIds,
    data.shootType,
    data.startDate,
    durationHours,
    calculateQuoteFromCreators,
  ]);

  // Automatically clear the location error once data.location is truthy
  useEffect(() => {
    if ((data.fullName || data.phone) && errors.includes("contactError")) {
      setErrors(prev => prev.filter(err => err !== "contactError"));
    }
  }, [data.fullName, data.phone, errors]);

  const displayContentType = data.contentType
    .map((type) => {
      const lower = type.toLowerCase();
      if (lower.includes("videographer")) return "Videography";
      if (lower.includes("photographer")) return "Photography";
      return type;
    })
    .join(" & ");

  // 2. Logic to determine the icon
  const ContentTypeIcon = () => {
    const types = data.contentType.map((t) => t.toLowerCase());
    if (types.some((t) => t.includes("video"))) {
      return <Video size={20} className="text-[#E8D1AB]" />;
    }
    return <Camera size={20} className="text-[#E8D1AB]" />;
  };

  const getVideoEditLabels = (keys: string[]) => {
    // Combine all video arrays into one for searching
    const allVideoOptions = [
      ...weddingEditTypes, ...musicEditTypes, ...commercialEditTypes,
      ...tvSeriesEditTypes, ...podcastEditTypes, ...shortFilmEditTypes,
      ...movieEditTypes, ...corporateEventEditTypes, ...privateEventEditTypes,
      ...socialContentEditTypes
    ];

    const counts = keys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([key, count]) => {
      const match = allVideoOptions.find(opt => opt.key === key);
      const label = match ? match.value : key;
      return count > 1 ? `${label} x${count}` : label;
    });
  };

  // Helper to get labels for Photo Edits
  const getPhotoEditLabels = (keys: string[]) => {
    // Combine all photo arrays into one for searching
    const allPhotoOptions = [
      ...weddingPhotoEditTypes, ...corporateEventPhotoEditTypes, ...privateEventPhotoEditTypes,
      ...musicPhotoEditTypes, ...commercialPhotoEditTypes, ...socialContentPhotoEditTypes,
      ...brandProductPhotoEditTypes, ...peopleTeamsPhotoEditTypes, ...behindScenesPhotoEditTypes
    ];

    const counts = keys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([key, count]) => {
      const match = allPhotoOptions.find(opt => opt.key === key);
      const label = match ? match.value : key;
      return count > 1 ? `${label} x${count}` : label;
    });
  };

  const handleConnectSales = () => {
    // add GA event on connect to sales click
    pushToDataLayer("booking_payment_confirm_sales", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_review_confirm",
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
      email: isAuthenticated ? user?.email : data.email,
      phone: isAuthenticated ? user?.phone_number : data.phone,
      duration_on_page: performance.now() / 1000,
      booking_id: data?.bookingId,
      booking_form_fields: {
        full_name: data.fullName,
        phone: data.phone,
      }
    })

    setShowSalesPopup(true)
  }

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
          Review & Confirm
        </h2>
        <p className="text-white/60">
          Review your project details and complete payment
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 lg:gap-8 pt-6 lg:pt-15 border-t border-white/10 bg-[#101010]">
        {/* Left Column: Summary & Contact */}
        <div className="flex-1 flex flex-col gap-4 lg:gap-8">
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-4 lg:p-7">
              <h4 className="text-base lg:text-lg font-medium text-white">
                Project Summary
              </h4>
            </div>

            {/* Project Summary */}
            <div className="p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 ">
              <div className="flex items-center gap-4 pb-4 lg:pb-8 border-b border-b-white/10">
                {/* Updated Icon Container */}
                <div className="w-12 h-12 bg-[#E8D5B51A] rounded-[12px] flex items-center justify-center border border-[#E8D1AB1A]">
                  <ContentTypeIcon />
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-[#999] capitalize tracking-wide mb-1">
                    Content Type
                  </div>
                  {/* Updated Text Display */}
                  <h3 className="text-base text-white capitalize whitespace-nowrap truncate">
                    {displayContentType}
                  </h3>
                </div>
              </div>

              <div className="rounded-[12px] overflow-hidden border border-white/10">
                <div className="p-4 flex gap-4 items-center">
                  <div className="w-[100px] h-[70px] lg:w-[209px] lg:h-[151px] bg-gradient-to-br from-[#E8D1AB]/20 to-[#E8D1AB]/5 rounded-lg flex items-center justify-center relative">
                    <Image
                      src={shootInfo.image || "/images/projects/interior.png"}
                      alt={"Sample shoot"}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-0 justify-between lg:items-center flex-1 min-w-0">
                    <div className="w-full min-w-0">
                      <div className="">
                        <h4 className="text-[#E8D1AB] text-base lg:text-lg font-bold capitalize">
                          {shootInfo.title}
                        </h4>
                        <span className="text-sm text-[#A9A9A9] capitalize">
                          {shootInfo.details}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-full bg-[#211F1C] border border-[#616161] w-fit shrink-0 py-2 px-4">
                      <p className="text-xs lg:text-sm text-center font-medium capitalize text-white/50 whitespace-nowrap">
                        {shootTypeTag}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                      <Calendar size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-base lg:text-lg font-medium capitalize">
                        {displayDateText}
                      </span>
                      <span className="text-sm text-[#A9A9A9]">Date</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                      <Clock size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-base lg:text-lg font-medium capitalize">
                        {displayTimeText}
                      </span>
                      <span className="text-sm text-[#A9A9A9]">Time</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5 col-span-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                    <Map size={32} className="text-[#9D9595]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-white text-base lg:text-lg font-medium line-clamp-2">
                      {data.location || "Location not set"}
                    </span>
                    <span className="text-sm text-[#A9A9A9]">Location</span>
                  </div>
                </div>
              </div>

              {/* Editing Services */}
              <div className="rounded-[16px] border border-white/5 bg-[#171717]">
                <div className="p-4 lg:p-[30px] border-b border-b-white/5">
                  <h4 className="text-white text-base lg:text-xl font-medium capitalize tracking-wide">
                    Editing Services
                  </h4>
                </div>
                <div className="p-4 lg:p-[30px] space-y-4">

                  {data.contentType.includes("videographer") && (
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="text-white">Video Edit</span>
                      <div className="flex flex-wrap gap-2">
                        {data.videoEditTypes.length > 0 ? (
                          getVideoEditLabels(data.videoEditTypes).map((label, i) => (
                            <span key={i} className="bg-[#E8D5B533] w-fit text-[#E8D5B5] text-xs px-2 py-1 rounded-sm">
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/40">Raw Footage Only (No Edits)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {data.contentType.includes("photographer") && (
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="text-white">Photo Edit</span>
                      <div className="flex flex-wrap gap-2">
                        {data.photoEditTypes.length > 0 ? (
                          getPhotoEditLabels(data.photoEditTypes).map((label, i) => (
                            <span key={i} className="bg-[#E8D5B533] w-fit text-[#E8D5B5] text-xs px-2 py-1 rounded-sm">
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/40">Raw Photos Only (No Edits)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback if user selected "No" to edits for everything */}
                  {!data.contentType.includes("videographer") && !data.contentType.includes("photographer") && (
                    <span className="text-white/40 text-sm">No editing services selected.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-4 lg:p-7">
              <h4 className={`text-base lg:text-lg font-medium ${errors.includes("contactError") ? "text-red-400" : "text-white"}`}>
                Contact Information
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 p-4 lg:gap-8">
              <div className="relative space-y-2">
                <Label
                  htmlFor="fullName"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Full Name*
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type={"text"}
                    value={data.fullName}
                    onChange={(e) => updateData({ fullName: e.target.value })}
                    className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
              <div className="relative space-y-2">
                <Label
                  htmlFor="phone"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Phone Number*
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type={"tel"}
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-4 lg:p-7">
              <h4 className="text-base lg:text-lg font-medium text-white">
                Payment Method
              </h4>
            </div>
            <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-4 lg:p-7">
              <div className="bg-[#E8D1AB] p-4 rounded-2xl text-black flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:h-[62px] lg:w-[62px] rounded-lg bg-[#101010] flex items-center justify-center">
                    <CreditCard size={32} className="text-[#E8D1AB]" />
                  </div>
                  <span className="font-medium">Credit / Debit Card</span>
                </div>
                <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                </div>
              </div>
              <div className="flex gap-3 bg-[#2A2A2A] rounded-[10px] p-2 lg:p-4 items-center">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <p className="text-sm text-[#999]">
                  By continuing to payment, you agree to our{" "}
                  <span className="text-[#E8D5B5]">Terms & Conditions</span>,{" "}
                  <span className="text-[#E8D5B5]">Cancellation Policy</span>,
                  and <span className="text-[#E8D5B5]">Privacy Policy</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary (Sticky) */}
        <div className="xl:w-[380px] shrink-0 ">
          <div className="border border-white/10 rounded-2xl ">
            <div className="bg-[#101010] p-4 lg:p-7 rounded-t-2xl">
              <h3 className="text-base lg:text-xl font-bold">
                Pricing Summary
              </h3>
            </div>
            <div className="bg-[#171717] text-white">
              <div className="p-4 lg:p-6 border-b border-b-white/10">

                {/* Package Offer section */}
                <div className="rounded-2xl border transition-all relative overflow-hidden bg-[#FEF5E5] text-[#171717]">
                  <div className="p-4">
                    <h4 className="text-sm font-bold">Package Offer</h4>
                  </div>
                  <div className="p-4 flex flex-col gap-3.5 border-t border-t-black/20 text-sm font-medium">
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="italic">Unlimited Usage Rights</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <FileImage size={20} />
                      </div>
                      <p className="italic">All Raw Content </p>
                    </div>

                    {/* Conditionally show Editing items */}
                    {hasEditing && (
                      <>
                        <div className="flex gap-3 items-center">
                          <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                            <Package size={20} />
                          </div>
                          <p className="italic">Include Edited Deliverable </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                            <RefreshCw size={20} />
                          </div>
                          <p className="italic">Up to 2 Sets of Revisions</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 border-b border-b-white/10">
                {isCalculating || quoteTotal === null ? (
                  <div className="flex items-center justify-center py-4 lg:py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-white/80" />
                    <span className="ml-3 text-white/80">
                      Preparing Your Package
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Duration & Crew Info */}
                    <div className="bg-[#101010] rounded-lg p-4 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Project Duration</span>
                        <span className="font-medium text-white">
                          {durationHours}{" "}
                          {durationHours === 1 ? "hour" : "hours"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">
                          Crew Members Selected
                        </span>
                        <span className="font-medium text-white">
                          {data.selectedCrewIds?.length || 0}{" "}
                          {(data.selectedCrewIds?.length || 0) === 1
                            ? "member"
                            : "members"}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Pricing Breakdown - UPDATED CATEGORIZATION */}
                    {/* Detailed Pricing Breakdown */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Pricing Breakdown
                      </div>

                      {/* 1. SHOOT COST */}
                      <div className="bg-[#101010] rounded-lg p-4 border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-white font-medium">Shoot Cost</div>
                          <div className="font-bold text-white">
                            {formatCurrency(pricingGroups.shootCost)}
                          </div>
                        </div>
                      </div>

                      {/* NEW: 2. EDITING SERVICES */}
                      {pricingGroups.editingFees > 0 && (
                        <div className="bg-[#101010] rounded-lg p-4 border border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-white font-medium text-sm">Editing Services</div>
                            <div className="font-bold text-white text-sm">
                              {formatCurrency(pricingGroups.editingFees)}
                            </div>
                          </div>
                          <div className="text-[11px] text-[#A9A9A9] flex flex-wrap gap-x-2">
                            {data.videoEditTypes.length > 0 && <span>• Video Editing</span>}
                            {data.photoEditTypes.length > 0 && <span>• Photo Editing</span>}
                          </div>
                        </div>
                      )}

                      {/* 3. ADDITIONAL CREATIVE PARTNER FEES */}
                      {pricingGroups.additionalCP.totalCost > 0 && (
                        <div className="bg-[#101010] rounded-lg p-4 border border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-white font-medium text-sm">
                              Additional Crew
                            </div>
                            <div className="font-bold text-white text-sm">
                              {formatCurrency(pricingGroups.additionalCP.totalCost)}
                            </div>
                          </div>
                          <div className="text-[11px] text-[#A9A9A9] space-y-0.5 mt-1">
                            {pricingGroups.additionalCP.videoCount > 0 && (
                              <div>videographer x {pricingGroups.additionalCP.videoCount}</div>
                            )}
                            {pricingGroups.additionalCP.photoCount > 0 && (
                              <div>photographer x {pricingGroups.additionalCP.photoCount}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-4" />

                    <div className="flex justify-between items-center text-base lg:text-lg font-bold">
                      <div className="text-sm font-medium text-[#E8D1AB]">
                        Total Amount
                      </div>
                      <div className="text-[#E8D1AB]">
                        {formatCurrency(quoteTotal)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 lg:p-6 border-b border-b-white/10">
                <Button
                  onClick={handlePay}
                  disabled={
                    isSubmitting || isCalculating || quoteTotal === null
                  }
                  className="w-full h-14 text-base lg:text-xl bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : isCalculating || quoteTotal === null ? (
                    "Calculating..."
                  ) : (
                    `Pay ${formatCurrency(quoteTotal)}`
                  )}
                </Button>

                <p
                  // onClick={() => setShowSalesPopup(true)}
                  onClick={handleConnectSales}
                  className="cursor-pointer text-center text-base font-medium mt-5 opacity-60 hover:opacity-100 transition flex items-center justify-center gap-1"
                >
                  <Phone size={24} /> Connect with Beige Team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex  gap-3 lg:gap-6 items-center">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
      </div>
      <AnimatePresence>
        {showSalesPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSalesPopup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#1A1A1A] border border-white/10 p-8 lg:p-12 rounded-[24px] max-w-lg w-full text-center shadow-2xl"
            >
              <button
                onClick={() => setShowSalesPopup(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="bg-[#E8D1AB]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-[#E8D1AB] w-10 h-10" />
              </div>

              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                Request Received
              </h3>

              <p className="text-white/60 text-lg leading-relaxed">
                Our Beige team will shortly reach out to you to finalize your creative
                requirements.
              </p>

              <Button
                onClick={() => setShowSalesPopup(false)}
                className="mt-8 w-full bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold h-14 rounded-xl"
              >
                Got it
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
