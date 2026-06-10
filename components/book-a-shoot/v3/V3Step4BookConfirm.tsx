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
  ShieldCheck,
  FileImage,
  RefreshCw,
  Package,
  Phone,
  CheckCircle2,
  X,
  Video,
  Camera,
  Scissors,
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
import { buildEditTypeCounts, getPhotoEditSummary, getTotalDurationHours } from "./utils";
import { getSelectedStudiosTotal, normalizeSelectedStudios } from "./studioData";
import { ServiceAgreementModal } from "@/components/common/ServiceAgreementModal";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}
const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";

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

const sanitizePhoneInput = (value: string) => value.replace(/[^\d+()\-\s]/g, "");

const getPhoneDigits = (value: string) => value.replace(/\D/g, "");

const isValidPhoneNumber = (value: string) => {
  const digitCount = getPhoneDigits(value).length;
  return digitCount >= 7 && digitCount <= 15;
};

const parseValidDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value?: string) => {
  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "d MMMM, yyyy") : "";
};
const formatSummaryDate = (value?: string) => formatDisplayDate(value) || "Date not set";

const formatDisplayTime = (value?: string) => {
  if (!value) return "";

  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const parsed = new Date();
      parsed.setHours(hours, minutes, 0, 0);
      return format(parsed, "h:mm a").toUpperCase();
    }
  }

  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "h:mm a").toUpperCase() : value;
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
  const isEditingOnly =
    data.contentType.length === 1 && data.contentType.includes("editing");
  const isStudioBooking = data.shootType === "studio";
  const selectedStudios = normalizeSelectedStudios(data);
  const primaryStudio = selectedStudios[0];
  const locationDisplayText = isStudioBooking
    ? DEFAULT_DISPLAY_ADDRESS
    : String(data.location || "").trim() || "Location not set";

  // UPDATED STATE FOR AGGREGATED ADDITIONAL PARTNERS
  const [pricingGroups, setPricingGroups] = useState<{
    shootCost: number;
    additionalCP: { totalCost: number; videoCount: number; photoCount: number };
    mandatoryAddons: Array<{ role: string; cost: number }>;
    editingFees: number;
    studioCost: number;
  }>({
    shootCost: 0,
    additionalCP: { totalCost: 0, videoCount: 0, photoCount: 0 },
    mandatoryAddons: [],
    editingFees: 0,
    studioCost: 0,
  });

  const bookingDays = data.bookingDays || [];
  const sortedBookingDays = bookingDays.slice().sort((a, b) => a.date.localeCompare(b.date));
  const isMultiDay = data.bookingType === "multi_day" && sortedBookingDays.length > 0;
  const firstDay = sortedBookingDays[0];
  const lastDay = sortedBookingDays[sortedBookingDays.length - 1];
  const allSameTime = isMultiDay && sortedBookingDays.every(
    (d) => d.startTime === firstDay?.startTime && d.endTime === firstDay?.endTime
  );
  const displayTimeText = isMultiDay
    ? allSameTime && firstDay?.startTime && firstDay?.endTime
      ? `${formatDisplayTime(firstDay.startTime)} - ${formatDisplayTime(firstDay.endTime)}`
      : "Multiple times"
    : isStudioBooking && primaryStudio?.startTime && primaryStudio?.endTime
      ? `${formatDisplayTime(primaryStudio.startTime)} - ${formatDisplayTime(primaryStudio.endTime)}`
    : isEditingOnly
      ? "Not required for editing-only projects"
      : data.startDate && data.endDate
        ? `${formatDisplayTime(data.startDate)} - ${formatDisplayTime(data.endDate)}`
        : "Time not set";
  const summaryDateText = isMultiDay
    ? `${sortedBookingDays.length} Days • ${formatSummaryDate(firstDay.date)} - ${formatSummaryDate(lastDay.date)}`
    : isStudioBooking && primaryStudio?.selectedDate
      ? formatSummaryDate(primaryStudio.selectedDate)
    : isEditingOnly && data.expectedDeliveryDate
      ? formatSummaryDate(data.expectedDeliveryDate)
      : data.startDate
        ? formatSummaryDate(data.startDate)
        : "Date not set";

  const [durationHours, setDurationHours] = useState<number>(0);
  const [acceptServiceAgreement, setAcceptServiceAgreement] = useState(true);
  const [isServiceAgreementOpen, setIsServiceAgreementOpen] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);
  const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
  const useContentHouseInclusivePricing =
    isStudioBooking && selectedStudios.length > 0;
  const photoEditCounts = buildEditTypeCounts(data.photoEditTypes);
  const photoEditSetCount = photoEditCounts.find((item) => item.slug === "edited_photos")?.quantity || 0;
  const photoEditSummary = getPhotoEditSummary({
    shootType: data.shootType,
    durationHours,
    selectedAddOnSets: photoEditSetCount,
  });
  const totalVideoEditsSelected = data.videoEditTypes.length;
  const editingSidebarRows = [
    (data.contentType.includes("photographer") || isEditingOnly) && photoEditSummary.includedCount > 0
      ? {
        label: "Photos Included",
        value: `${photoEditSummary.includedCount} Photos`,
        badge: "Free",
      }
      : null,
    photoEditSummary.extraCount > 0
      ? {
        label: `Extra Photo Units x${photoEditSetCount}`,
        value: `${photoEditSummary.extraCount} Photos`,
      }
      : null,
    totalVideoEditsSelected > 0
      ? {
        label: "Video Included",
        value: String(totalVideoEditsSelected).padStart(2, "0"),
      }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; badge?: string }>;
  const receiveSummaryText = [
    (data.contentType.includes("photographer") || isEditingOnly) && photoEditSummary.totalCount > 0
      ? `${photoEditSummary.totalCount} Photos`
      : null,
    totalVideoEditsSelected > 0 ? `${totalVideoEditsSelected} Videos Edits` : null,
  ].filter(Boolean).join(" + ");
  const totalEditsBadgeText = [
    (data.contentType.includes("photographer") || isEditingOnly) && photoEditSummary.totalCount > 0
      ? `${photoEditSummary.totalCount} Photos`
      : null,
    totalVideoEditsSelected > 0 ? `${totalVideoEditsSelected} Videos` : null,
  ].filter(Boolean).join(" + ");


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
    if (isStudioBooking && primaryStudio?.image) {
      return {
        title: primaryStudio.name || "Studio",
        details: "Studio shoot",
        image: primaryStudio.image,
      };
    }

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

    if (!isValidPhoneNumber(data.phone)) {
      toast.error("Please enter a valid phone number");
      setErrors((prev) => [...prev, "contactError"]);
      return;
    }

    if (!acceptServiceAgreement) {
      toast.error("Please accept the Service Agreement to continue.");
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
    setDurationHours(
      getTotalDurationHours(data.bookingType, data.startDate, data.endDate, data.bookingDays)
    );
  }, [data.startDate, data.endDate, data.bookingType, data.bookingDays]);

  // Calculate quote when component mounts or data changes
  useEffect(() => {
    const fetchQuote = async () => {
      // Check if we have duration
      if (!isEditingOnly && !useContentHouseInclusivePricing && durationHours === 0) {
        setQuoteTotal(null);
        setCrewBreakdown([]);
        return;
      }

      try {
        const toIsoIfValid = (value?: string | null) => {
          if (!value) return value;
          const d = new Date(value);
          return isNaN(d.getTime()) ? value : d.toISOString();
        };

        console.log("V3Step4BookConfirm - Sending to API:", {
          creator_ids: data.selectedCrewIds,
          selectedCrewCount: data.selectedCrewIds?.length || 0,
          shoot_hours: isEditingOnly ? 0 : durationHours,
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

        const quotePayload: any = {
          creator_ids: useContentHouseInclusivePricing ? [] : data.selectedCrewIds,
          role_counts: isEditingOnly
            ? { editor: 1 }
            : useContentHouseInclusivePricing
              ? {}
              : data.roleCounts,
          event_type: data.shootType || "general",
          video_edit_types: buildEditTypeCounts(data.videoEditTypes),
          photo_edit_types: buildEditTypeCounts(data.photoEditTypes),
          skip_discount: true,
          skip_margin: true,
          studio_total: selectedStudiosTotal || 0,
        };

        if (isEditingOnly) {
          quotePayload.content_type = "ai editing";
        } else {
          if (useContentHouseInclusivePricing) {
            // Backend validation requires shoot_hours > 0 for non-AI-editing flows.
            // Keep it at minimum valid value while excluding creator/role items.
            quotePayload.shoot_hours = 1;
          } else {
            quotePayload.shoot_hours = durationHours;
            quotePayload.shoot_start_date = firstBookingDate
              ? `${firstBookingDate}T00:00:00.000Z`
              : toIsoIfValid(data.startDate);
          }
        }

        const result = await calculateQuoteFromCreators(quotePayload).unwrap();

        console.log("V3Step4BookConfirm - API Result:", {
          total: result.total,
          creators: result.creators,
          lineItems: result.lineItems,
          shootHours: result.shootHours,
          durationHours,
        });

        // --- START CATEGORIZATION LOGIC ---
        let shootCostTotal = 0;
        let editFeesTotal = 0;
        let addVideoCount = 0;
        let addPhotoCount = 0;
        let addCPTotalCost = 0;
        let studioCostTotal = 0;
        const mandatoryAddonsList: Array<{ role: string; cost: number }> = [];

        if (result.lineItems && result.lineItems.length > 0) {
          result.lineItems.forEach((item: any) => {
            const name = item.item_name;
            const quantity = parseInt(item.quantity || 1);
            const lineTotal = parseFloat(item.line_total || 0);
            const unitPrice = lineTotal / quantity;
            const lowerName = String(name || "").toLowerCase();
            const isStudioItem =
              lowerName.includes("studio") ||
              lowerName.includes("resort") ||
              lowerName.includes("location platform");

            if (useContentHouseInclusivePricing) {
              if (item.category_slug === "editing") {
                editFeesTotal += lineTotal;
                return;
              }

              if (isStudioItem) {
                studioCostTotal += lineTotal;
              }
              return;
            }

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
            else if (isStudioItem) {
              studioCostTotal += lineTotal;
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

        const finalStudioCost = studioCostTotal > 0 ? studioCostTotal : selectedStudiosTotal;
        setQuoteTotal(result.total);

        setPricingGroups({
          shootCost: shootCostTotal,
          editingFees: editFeesTotal,
          additionalCP: {
            totalCost: addCPTotalCost,
            videoCount: addVideoCount,
            photoCount: addPhotoCount
          },
          mandatoryAddons: mandatoryAddonsList,
          studioCost: finalStudioCost,
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
    data.videoEditTypes,
    data.photoEditTypes,
    data.roleCounts,
    data.selectedStudios,
    data.selectedStudioIds,
    durationHours,
    isEditingOnly,
    useContentHouseInclusivePricing,
    calculateQuoteFromCreators,
    selectedStudiosTotal,
  ]);

  // Automatically clear the location error once data.location is truthy
  useEffect(() => {
    if (data.fullName && isValidPhoneNumber(data.phone) && errors.includes("contactError")) {
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
    if (isEditingOnly) {
      return <Scissors size={20} className="text-[#E8D1AB]" />;
    }
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
                  <div className={`flex gap-3 ${isMultiDay && !allSameTime ? "items-start" : "items-center"}`}>
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center shrink-0">
                      <Calendar size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {isMultiDay ? (
                        <>
                          <span className="text-[#A9A9A9] text-sm mb-1">
                            {sortedBookingDays.length} Days
                          </span>
                          {sortedBookingDays.map((day, idx) => (
                            
                            <span key={idx} className="text-white text-sm lg:text-base font-medium">
                            <span className="text-[#A9A9A9]">• </span>
                              {formatSummaryDate(day.date)}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-white text-base lg:text-lg font-medium capitalize">
                          {summaryDateText}
                        </span>
                      )}
                      
                    </div>
                  </div>
                </div>
                {!isEditingOnly && (
                <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5 h-fit">
                  <div className={`flex gap-3 ${isMultiDay && !allSameTime ? "items-start" : "items-center"}`}>
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center shrink-0">
                      <Clock size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {isMultiDay && !allSameTime ? (
                        <>
                          <span className="text-[#A9A9A9] text-sm mb-1">Per Day</span>
                          {sortedBookingDays.map((day, idx) => (
                            <span key={idx} className="text-white text-sm lg:text-base font-medium">
                              <span className="text-[#A9A9A9]">• </span>
                              {day.startTime && day.endTime
                                ? `${formatDisplayTime(day.startTime)} – ${formatDisplayTime(day.endTime)}`
                                : "Time not set"}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-white text-base lg:text-lg font-medium capitalize">
                          {displayTimeText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
                             
              {!isEditingOnly && (
              <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5 col-span-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                    <Map size={32} className="text-[#9D9595]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-white text-base lg:text-lg font-medium line-clamp-2">
                      {locationDisplayText}
                    </span>
                    <span className="text-sm text-[#A9A9A9]">Location</span>
                  </div>
                </div>
              </div>
            )}


              {/* Editing Services */}
              <div className="rounded-[16px] border border-white/5 bg-[#171717]">
                <div className="p-4 lg:p-[30px] border-b border-b-white/5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <h4 className="text-white text-base lg:text-xl font-medium capitalize tracking-wide">
                    Editing Services
                  </h4>
                  <p className="text-[#E8D1AB] text-sm lg:text-base italic font-medium">
                    {receiveSummaryText ? `You'll Receive ${receiveSummaryText}` : "No edits selected"}
                  </p>
                </div>
                <div className="p-4 lg:p-[30px] space-y-4">

                  {data.videoEditTypes.length > 0 && (
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

                  {(data.contentType.includes("photographer") || isEditingOnly) && data.photoEditTypes.length > 0 && (
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="text-white">Photo Edit</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-[#E8D5B533] w-fit text-[#E8D5B5] text-xs px-2 py-1 rounded-sm">
                          {isEditingOnly && photoEditSummary.includedCount === 0 
                            ? `${photoEditSummary.extraCount} Photos Added` 
                            : `Edited Photos ${photoEditSummary.includedCount} Included ${photoEditSummary.extraCount > 0 ? ` + ${photoEditSummary.extraCount} Added` : ""}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fallback if user selected "No" to edits for everything */}
                  {data.videoEditTypes.length === 0 && data.photoEditTypes.length === 0 && (
                    <span className="text-white/40 text-sm">No editing services selected.</span>
                  )}

                </div>
              </div>

              {selectedStudios.length > 0 && (
                <div className="rounded-[16px] border border-white/5 bg-[#171717]">
                  <div className="p-4 lg:p-[30px] border-b border-b-white/5">
                    <h4 className="text-white text-base lg:text-xl font-medium tracking-wide">
                      BEIGE Studios
                    </h4>
                  </div>
                  <div className="p-4 lg:p-[30px] space-y-3">
                    {selectedStudios.map((studio) => (
                      <div key={studio.studioId} className="rounded-xl border border-white/10 bg-[#101010] p-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-start">
                          <div className="relative w-full md:w-[180px] h-[120px] rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">
                            <Image
                              src={studio.image}
                              alt={studio.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-white font-medium truncate">{studio.name}</div>
                                <div className="text-xs text-[#A9A9A9] flex items-center gap-1 mt-1">
                                  <MapPin size={12} />
                                  <span className="truncate">{locationDisplayText}</span>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-[#E8D1AB] shrink-0">
                                {formatCurrency(studio.totalPrice || 0)}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3 flex-wrap">
                              <span className="px-2 py-1 border border-white/10 rounded-md text-[10px] text-white/60">
                                Natural light
                              </span>
                              <span className="px-2 py-1 border border-white/10 rounded-md text-[10px] text-white/60">
                                Product-friendly
                              </span>
                              <span className="px-2 py-1 rounded-md text-[10px] bg-[#E8D1AB1F] text-[#E8D1AB]">
                                {studio.pricingMode === "hourly"
                                  ? `${studio.quantity} billable hour${studio.quantity > 1 ? "s" : ""}`
                                  : `Duration: ${studio.nights || studio.quantity} Night${(studio.nights || studio.quantity) > 1 ? "s" : ""}`}
                              </span>
                              {studio.pricingLabel && (
                                <span className="px-2 py-1 rounded-md text-[10px] bg-white/5 text-white/60">
                                  {studio.pricingLabel}
                                </span>
                              )}
                              {studio.cleaningFee ? (
                                <span className="px-2 py-1 rounded-md text-[10px] bg-white/5 text-white/60">
                                  ${studio.cleaningFee.toLocaleString()} cleaning
                                </span>
                              ) : null}
                            </div>

                            <div className="text-xs text-[#A9A9A9] mt-3 flex items-center gap-2">
                              <Calendar size={13} />
                              <span>
                                {studio.pricingMode === "hourly"
                                  ? `${formatDisplayDate(studio.selectedDate)} | ${formatDisplayTime(studio.startTime)} - ${formatDisplayTime(studio.endTime)}`
                                  : firstDay?.date && lastDay?.date
                                    ? `${formatDisplayDate(firstDay.date)} - ${formatDisplayDate(lastDay.date)}`
                                    : data.startDate && data.endDate
                                      ? `${formatDisplayDate(data.startDate)} - ${formatDisplayDate(data.endDate)}`
                                      : "Date not set"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    onChange={(e) => updateData({ phone: sanitizePhoneInput(e.target.value) })}
                    inputMode="tel"
                    autoComplete="tel"
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
              <div className="flex gap-3 bg-[#2A2A2A] rounded-[10px] p-2 lg:p-4 items-center mt-2">
                <input type="checkbox" checked={acceptServiceAgreement} readOnly />
                <p className="text-sm text-[#999]">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setIsServiceAgreementOpen(true)}
                    className="text-[#E8D5B5] underline hover:text-[#f3e4cd]"
                  >
                    Service Agreement & Terms of Engagement
                  </button>
                  .
                </p>
              </div>

              <ServiceAgreementModal
                isOpen={isServiceAgreementOpen}
                initialChecked={acceptServiceAgreement}
                onClose={() => setIsServiceAgreementOpen(false)}
                onAccept={() => {
                  setAcceptServiceAgreement(true);
                  setIsServiceAgreementOpen(false);
                }}
              />
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
                      {!isEditingOnly && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Project Duration</span>
                        <span className="font-medium text-white">
                          {durationHours}{" "}
                          {durationHours === 1 ? "hour" : "hours"}
                        </span>
                      </div>
                        )}

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

                    {(editingSidebarRows.length > 0 || totalEditsBadgeText) && (
                      <div className="bg-[#101010] rounded-lg p-4 border border-white/5 space-y-3">
                        <div className="text-xs font-medium text-white/40 uppercase tracking-wide">
                          + Editing Services
                        </div>
                        <div className="space-y-2">
                          {editingSidebarRows.map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-start gap-3 text-white">
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span className="mt-0.5 rounded-[7px] bg-[#E8D1AB] px-2 py-[2px] text-[10px] font-semibold leading-none text-[#171717]">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-[#E8D1AB]">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                        {totalEditsBadgeText && (
                          <div className="flex items-center justify-between rounded-xl border border-[#4D402C] bg-[#1D1812] px-4 py-3 text-sm">
                            <span className="text-[#E8D1AB]/80">Total Edits</span>
                            <span className="font-semibold text-[#E8D1AB]">
                              {totalEditsBadgeText}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Pricing Breakdown - UPDATED CATEGORIZATION */}
                    {/* Detailed Pricing Breakdown */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Pricing Breakdown
                      </div>

                      {/* 1. SHOOT COST */}
                      {!isEditingOnly && !useContentHouseInclusivePricing && (
                      <div className="bg-[#101010] rounded-lg p-4 border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-white font-medium">Shoot Cost</div>
                          <div className="font-bold text-white">
                            {formatCurrency(pricingGroups.shootCost)}
                          </div>
                        </div>
                      </div>
                      )}

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

                      {pricingGroups.studioCost > 0 && (
                        <div className="bg-[#101010] rounded-lg p-4 border border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-white font-medium text-sm">BEIGE Studios</div>
                            <div className="font-bold text-white text-sm">
                              {formatCurrency(pricingGroups.studioCost)}
                            </div>
                          </div>
                          <div className="text-[11px] text-[#A9A9A9]">
                            {selectedStudios.length} selected
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
