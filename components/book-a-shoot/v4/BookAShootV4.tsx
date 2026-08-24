"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";

import LeaveConfirmationModal from "./components/LeaveConfirmationModal";
import GuidedBookingCard from "./components/GuidedBookingCard";
import AskingServices from "./components/AskingServices";
import EditsNeeded, { EditsConfig } from "./components/EditsNeeded";
import AskingOccasion from "./components/AskingOccassion";
import ScheduleShoot from "./components/ScheduleShoot";
import ShootDetails, { ShootDetailsData } from "./components/ShootDetails";
import MatchMakerStep, { TeamSelectionData } from "./components/MatchMaker";
import CreativeTeam from "./components/CreativeTeam";
import ChooseCreativePartner from "./components/ChooseCreativePartner";
import AddOnsStep from "./components/AddOnsStep";
import ShootSummaryStep, { ShootSummaryData } from "./components/ShootSummary";
import ConfirmAndPay, { PricingBreakdown } from "./components/ConfirmAndPay";
import BookingConfirmed from "./components/BookingConfirmed";

import type { Creator } from "@/lib/types";
import {
  useCreateGuestBookingV4Mutation,
  useUpdateGuestBookingV4Mutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import {
  useCalculateQuoteV4Mutation,
  useSaveQuoteV4Mutation,
} from "@/lib/redux/features/pricing/pricingApi";
import { useTrackEarlyInterestV4Mutation } from "@/lib/redux/features/sales/salesApi";
import { useAuth } from "@/lib/hooks/useAuth";
import { pushToDataLayer } from "@/lib/gtm";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { parseDate } from "@/src/components/landing/lib/utils";

export interface ScheduleData {
  dateOption: "have-date" | "confirm-later";
  bookingType: "single_day" | "multi_day" | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  startDate?: string | null;
  endDate?: string | null;
  bookingDays?: {
    date: string;
    startTime?: string;
    endTime?: string;
  }[];
  location: string;
  locationDetails?: any;
}

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager",
};

const SERVICE_TO_CONTENT_TYPE: Record<string, string> = {
  photography: "photographer",
  videography: "videographer",
  editing: "editing",
  studios: "studio",
  livestream: "videographer",
};

const ADD_ON_SLUGS: Record<string, string> = {
  additional_camera: "equip-additional-camera",
  teleprompter: "equip-teleprompter",
  drone: "equip-drone-non-corporate",
  lavalier_mics: "equip-lav-mic",
  green_screen: "studio-green-screen",
  backdrop: "studio-backdrop",
  additional_lights: "equip-additional-lights",
  next_day_editing: "post-next-day",
  expedited_editing: "post-expedited",
};

const toUtcIsoIfValid = (value?: string | null) => {
  if (!value) return value;
  const date = parseDate(value);
  return date && !isNaN(date.getTime()) ? date.toISOString() : value;
};

const calculateHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 0;
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    const diff = endDate.getTime() - startDate.getTime();
    return diff > 0 ? Math.round((diff / (1000 * 60 * 60)) * 100) / 100 : 0;
  }

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const diffMinutes = eh * 60 + em - (sh * 60 + sm);
  return diffMinutes > 0 ? Math.round((diffMinutes / 60) * 100) / 100 : 0;
};

const extractCoordinates = (details: any) => ({
  latitude: details?.coordinates?.lat ?? details?.lat ?? details?.center?.[1],
  longitude: details?.coordinates?.lng ?? details?.lng ?? details?.center?.[0],
});

export const BookAShootV4 = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [internalStep, setInternalStep] = useState<number>(0);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [quotePreview, setQuotePreview] = useState<any>(null);

  const [bookingState, setBookingState] = useState<{
    email: string;
    selectedServices: string[];
    editsConfig: EditsConfig;
    selectedOccasion: string;
    scheduleData: ScheduleData | null;
    shootDetailsData: ShootDetailsData | null;
    teamSelectionData: TeamSelectionData | null;
    addOnsQuantities: Record<string, number>;
    addOnsSubtotal: number;
    contactInformation: { fullName: string; phoneNumber: string } | null;
  }>({
    email: "",
    selectedServices: ["photography"],
    editsConfig: {
      needsEdits: true,
      editedPhotosSets: 1,
    },
    selectedOccasion: "corporate",
    scheduleData: null,
    shootDetailsData: null,
    teamSelectionData: null,
    addOnsQuantities: { additional_camera: 1 },
    addOnsSubtotal: 350,
    contactInformation: null,
  });

  const [creativeTeam, setCreativeTeam] = useState<{ [key: string]: number }>({
    photographer: 0,
    videographer: 0,
  });
  const [selectedCreatives, setSelectedCreatives] = useState<Creator[]>([]);
  const [letBeigeChoose, setLetBeigeChoose] = useState<boolean>(false);
  const [createGuestBookingV4, { isLoading: isCreatingBooking }] = useCreateGuestBookingV4Mutation();
  const [updateGuestBookingV4, { isLoading: isUpdatingBooking }] = useUpdateGuestBookingV4Mutation();
  const [calculateQuoteV4, { isLoading: isCalculatingQuote }] = useCalculateQuoteV4Mutation();
  const [saveQuoteV4, { isLoading: isSavingQuote }] = useSaveQuoteV4Mutation();
  const [trackEarlyInterestV4] = useTrackEarlyInterestV4Mutation();

  const isSubmitting = isCreatingBooking || isUpdatingBooking || isCalculatingQuote || isSavingQuote;

  const contentTypes = useMemo(
    () =>
      Array.from(
        new Set(
          bookingState.selectedServices
            .map((service) => SERVICE_TO_CONTENT_TYPE[service] || service)
            .filter(Boolean),
        ),
      ),
    [bookingState.selectedServices],
  );

  const shootType = useMemo(() => {
    if (bookingState.selectedOccasion === "studio" || bookingState.selectedServices.includes("studios")) {
      return "studio";
    }
    return bookingState.selectedOccasion || "general";
  }, [bookingState.selectedOccasion, bookingState.selectedServices]);

  const roleCounts = useMemo(() => {
    const counts = {
      photographer: Number(creativeTeam.photographer || 0),
      videographer: Number(creativeTeam.videographer || 0),
      cinematographer: Number(creativeTeam.cinematographer || 0),
    };

    const hasExplicitCount = Object.values(counts).some((count) => count > 0);
    if (!hasExplicitCount && !contentTypes.includes("editing")) {
      if (contentTypes.includes("photographer")) counts.photographer = 1;
      if (contentTypes.includes("videographer")) counts.videographer = 1;
    }

    return counts;
  }, [contentTypes, creativeTeam]);

  const selectedCrewIds = useMemo(
    () => selectedCreatives.map((creator) => creator.crew_member_id).filter(Boolean),
    [selectedCreatives],
  );

  const photoEditTypes = useMemo(() => {
    if (!bookingState.editsConfig.needsEdits || !bookingState.editsConfig.editedPhotosSets) return [];
    return [{ slug: "edit-extra-photos", quantity: bookingState.editsConfig.editedPhotosSets }];
  }, [bookingState.editsConfig]);

  const addOnItems = useMemo(
    () =>
      Object.entries(bookingState.addOnsQuantities)
        .map(([id, quantity]) => ({
          slug: ADD_ON_SLUGS[id],
          quantity: Number(quantity) || 0,
        }))
        .filter((item) => item.slug && item.quantity > 0),
    [bookingState.addOnsQuantities],
  );

  const shootHours = useMemo(() => {
    const schedule = bookingState.scheduleData;
    if (!schedule || schedule.dateOption === "confirm-later") return 0;

    if (schedule.bookingType === "multi_day" && schedule.bookingDays?.length) {
      return Math.max(
        1,
        Math.round(
          schedule.bookingDays.reduce(
            (sum, day) => sum + calculateHours(day.startTime, day.endTime),
            0,
          ) * 100,
        ) / 100,
      );
    }

    return Math.max(1, calculateHours(schedule.startDate, schedule.endDate));
  }, [bookingState.scheduleData]);

  const buildQuotePayload = () => {
    const isEditingOnly = contentTypes.length === 1 && contentTypes.includes("editing");
    const pricedShootHours = isEditingOnly ? 0 : Math.max(1, shootHours || 1);
    const firstBookingDate =
      bookingState.scheduleData?.bookingType === "multi_day" && bookingState.scheduleData.bookingDays?.length
        ? bookingState.scheduleData.bookingDays.slice().sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        : getLocalDatePart(bookingState.scheduleData?.startDate || "");

    return {
      creator_ids: selectedCrewIds,
      role_counts: roleCounts,
      shoot_hours: pricedShootHours,
      content_type: contentTypes.join(","),
      event_type: shootType,
      shoot_start_date: firstBookingDate ? `${firstBookingDate}T00:00:00.000Z` : undefined,
      video_edit_types: [],
      photo_edit_types: photoEditTypes,
      add_on_items: addOnItems,
      skip_discount: true,
      skip_margin: true,
    };
  };

  const calculatePricingPreview = async () => {
    const quote = await calculateQuoteV4(buildQuotePayload()).unwrap();
    setQuotePreview(quote);
    return quote;
  };

  const buildBookingPayload = (quoteId?: number | null) => {
    const schedule = bookingState.scheduleData;
    const contact = bookingState.contactInformation;
    const browserTimeZone = getBrowserTimeZone();
    const bookingDays = schedule?.bookingDays?.map((day) => ({
      date: day.date,
      start_time: day.startTime,
      end_time: day.endTime,
      duration_hours: calculateHours(day.startTime, day.endTime),
      time_zone: browserTimeZone,
    })) || [];
    const { latitude, longitude } = extractCoordinates(schedule?.locationDetails);

    return {
      order_name: `${shootType.toUpperCase()} Shoot - ${contact?.fullName || bookingState.email}`,
      guest_email: bookingState.email,
      content_type: contentTypes.length === 1 && contentTypes.includes("editing")
        ? "ai editing"
        : contentTypes.join(","),
      shoot_type: shootType,
      booking_type: schedule?.bookingType || "single_day",
      booking_days: schedule?.bookingType === "multi_day" ? bookingDays : [],
      start_date: getLocalDatePart(schedule?.startDate || "") || null,
      start_time: getLocalTimePart(schedule?.startDate || "") || null,
      end_time: getLocalTimePart(schedule?.endDate || "") || null,
      time_zone: browserTimeZone,
      duration_hours: shootHours,
      location: schedule?.location || "",
      location_latitude: latitude,
      location_longitude: longitude,
      quote_id: quoteId || null,
      full_name: contact?.fullName || "",
      phone: contact?.phoneNumber || "",
      edits_needed: bookingState.editsConfig.needsEdits,
      video_edit_types: [],
      photo_edit_types: photoEditTypes.flatMap((item) => Array(item.quantity).fill(item.slug)),
      crew_size: String(Object.values(roleCounts).reduce((sum, count) => sum + count, 0) || 1),
      matching_method: letBeigeChoose || bookingState.teamSelectionData?.teamOption === "best-match"
        ? "ai_matchmaker"
        : "manual",
      selected_crew_ids: selectedCrewIds,
      special_instructions: bookingState.shootDetailsData?.notes || undefined,
      reference_links: bookingState.shootDetailsData?.links || [],
      start_date_time: toUtcIsoIfValid(schedule?.startDate),
      end_date_time: toUtcIsoIfValid(schedule?.endDate),
      is_draft: false,
    };
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
  };

  // Step 0 -> Step 1
  const handleEmailSubmitted = async (email: string) => {
    setBookingState((prev) => ({ ...prev, email }));
    try {
      const result = await trackEarlyInterestV4({
        booking_id: draftBookingId,
        guest_email: email,
        user_id: user?.id,
        client_name: user?.name,
        content_type: contentTypes.join(",") || undefined,
      }).unwrap();

      if (result.data?.booking_id) {
        setDraftBookingId(result.data.booking_id);
      }
      if (result.data?.lead_id) {
        setLeadId(result.data.lead_id);
      }

      pushToDataLayer("generate_lead", {
        value: 0,
        currency: "USD",
        page_name: "Book-a-shoot Page V4",
        location_in_website: "book_a_shoot_v4_email",
        duration_on_page: performance.now() / 1000,
        user_id: user?.id || "Guest",
        user_type: user?.user_type_id ? USER_TYPE[user.user_type_id] : "Guest",
        booking_id: result.data?.booking_id,
        email,
      });
    } catch (error) {
      console.error("Failed to save v4 lead:", error);
      toast.error("Progress not saved, but you can continue.");
    }
    setInternalStep(1);
  };

  // Step 1 -> Step 2
  const handleServicesSelected = (services: string[]) => {
    setBookingState((prev) => ({ ...prev, selectedServices: services }));
    setInternalStep(2);
  };

  // Step 2 -> Step 3
  const handleEditsSubmitted = (editsConfig: EditsConfig) => {
    setBookingState((prev) => ({ ...prev, editsConfig }));
    setInternalStep(3);
  };

  // Step 3 -> Step 4
  const handleOccasionSelected = (selectedOccasion: string) => {
    setBookingState((prev) => ({ ...prev, selectedOccasion }));
    setInternalStep(4);
  };

  // Step 4 -> Step 5
  const handleScheduleSubmitted = (scheduleData: ScheduleData) => {
    setBookingState((prev) => ({ ...prev, scheduleData }));
    setInternalStep(5);
  };

  // Step 5 -> Step 6
  const handleDetailsSubmitted = (shootDetailsData: ShootDetailsData) => {
    setBookingState((prev) => ({ ...prev, shootDetailsData }));
    setInternalStep(6);
  };

  // Step 6 -> Step 7
  const handleTeamSelected = (teamSelectionData: TeamSelectionData) => {
    setBookingState((prev) => ({ ...prev, teamSelectionData }));
    setInternalStep(7);
  };

  // Step 7 -> Step 8
  const handleCreativeTeamSubmitted = (updatedTeam: { [key: string]: number }) => {
    setCreativeTeam(updatedTeam);
    setInternalStep(8);
  };

  // Step 8 -> Step 9
  const handleChooseCreativePartnerSubmitted = (creatives: Creator[], beigeChoice: boolean) => {
    setSelectedCreatives(creatives);
    setLetBeigeChoose(beigeChoice);
    setInternalStep(9);
  };

  // Step 9 -> Step 10
  const handleAddOnsSubmitted = (selectedAddOns: Record<string, number>, subtotal: number) => {
    setBookingState((prev) => ({
      ...prev,
      addOnsQuantities: selectedAddOns,
      addOnsSubtotal: subtotal,
    }));
    setInternalStep(10);
  };

  // Step 10 -> Step 11
  const handleSummarySubmitted = async (contactData: { fullName: string; phoneNumber: string }) => {
    setBookingState((prev) => ({ ...prev, contactInformation: contactData }));
    try {
      await calculatePricingPreview();
    } catch (error) {
      console.error("Failed to calculate v4 pricing:", error);
      toast.error("Could not calculate final price. Please review your selections and try again.");
      return;
    }
    setInternalStep(11);
  };

  // Step 11 -> Step 12 (Pay -> Final Confirmation)
  const handleConfirmAndPay = async () => {
    try {
      const quote = await saveQuoteV4({
        ...buildQuotePayload(),
        guestEmail: bookingState.email,
        bookingId: draftBookingId || undefined,
        notes: bookingState.shootDetailsData?.notes,
      }).unwrap();

      const finalBookingData = buildBookingPayload(quote.quote_id);
      const submissionResult = draftBookingId
        ? await updateGuestBookingV4({ id: draftBookingId, data: finalBookingData as any }).unwrap()
        : await createGuestBookingV4(finalBookingData as any).unwrap();

      pushToDataLayer("begin_checkout", {
        currency: "USD",
        value: quote.total || quotePreview?.total || 0,
        page_name: "Book-a-shoot Page V4",
        location_in_website: "book_a_shoot_v4_confirm_pay",
        email: isAuthenticated ? user?.email : bookingState.email,
        user_id: isAuthenticated ? user?.id : "Guest",
        user_type: isAuthenticated && user?.user_type_id ? USER_TYPE[user.user_type_id] : "Guest",
        full_name: bookingState.contactInformation?.fullName,
        phone: isAuthenticated ? user?.phone_number : bookingState.contactInformation?.phoneNumber,
        booking_id: submissionResult?.booking_id || draftBookingId,
        items: [{
          item_name: finalBookingData.order_name || "Shoot Booking",
          price: quote.total || quotePreview?.total || 0,
          quantity: 1,
        }],
      });

      toast.success("Booking Secured!", {
        description: "Redirecting to secure payment gateway...",
      });
      router.push(`/search-results/payment?shootId=${submissionResult.booking_id}`);
    } catch (error: any) {
      console.error("V4 booking submission failed:", error);
      toast.error("Submission Failed", {
        description: error?.data?.message || "Could not complete booking. Please check your connection.",
      });
    }
  };

  const handleEditStepByName = (stepName: string) => {
    switch (stepName) {
      case "project":
        setInternalStep(1);
        break;
      case "schedule":
        setInternalStep(4);
        break;
      case "editing":
        setInternalStep(2);
        break;
      case "addons":
        setInternalStep(9);
        break;
      default:
        break;
    }
  };

  const handleBrowseStudios = () => {
    console.log("Browse studios clicked");
  };

  // Dynamic pricing summary calculation
  const getPricingData = (): Partial<PricingBreakdown> => {
    const lineItems = quotePreview?.lineItems || quotePreview?.line_items || [];
    const visibleLines = Array.isArray(lineItems) ? lineItems.filter((item: any) => !item.hidden) : [];
    const editingServiceCost = visibleLines
      .filter((item: any) => item.category_slug === "editing")
      .reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);
    const addOnsCost = visibleLines
      .filter((item: any) => ["equipment-addons", "post-production", "studios"].includes(item.category_slug))
      .reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);
    const creativeLines = visibleLines.filter((item: any) =>
      ["photography", "videography", "cinematography"].includes(item.category_slug) ||
      ["Photographer", "Videographer", "Cinematographer"].some((name) =>
        String(item.item_name || "").includes(name),
      ),
    );
    const creativeRoleCost = creativeLines.reduce(
      (sum: number, item: any) => sum + Number(item.line_total || 0),
      0,
    );
    const baseServiceCost = Math.max(
      0,
      Number(quotePreview?.subtotal || 0) - editingServiceCost - addOnsCost - creativeRoleCost,
    );
    const totalAmount = Number(quotePreview?.total || 0);
    const addOnsCount = addOnItems.reduce((sum, item) => sum + item.quantity, 0);
    const creativeRoleTitle = Object.entries(roleCounts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => `${role.charAt(0).toUpperCase() + role.slice(1)} x${count}`)
      .join(", ") || "Creative Partner x1";

    return {
      serviceName: `${contentTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(" & ")} Services`,
      baseServiceCost,
      editingServiceCost,
      creativeRoleTitle,
      creativeRoleCost,
      addOnsCount,
      addOnsCost,
      totalAmount: totalAmount || baseServiceCost + editingServiceCost + creativeRoleCost + addOnsCost,
      depositAmount: Math.min(500, totalAmount || 500),
      photosIncluded: 100,
      extraPhotoUnitsText: `Extra Photo Units x${bookingState.editsConfig.editedPhotosSets || 0}`,
      extraPhotosCount: (bookingState.editsConfig.editedPhotosSets || 0) * 25,
      totalPhotosCount: 100 + (bookingState.editsConfig.editedPhotosSets || 0) * 25,
    };
  };

  const getSummaryData = (): ShootSummaryData => {
    const serviceName =
      bookingState.selectedServices.length > 0
        ? bookingState.selectedServices
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" & ")
        : "Photography";

    const occasionName = bookingState.selectedOccasion
      ? bookingState.selectedOccasion.charAt(0).toUpperCase() + bookingState.selectedOccasion.slice(1) + " Event"
      : "Corporate Event";

    const dateStr = bookingState.scheduleData?.date
      ? `Single Day - ${bookingState.scheduleData.date}`
      : "Single Day - 15/08/2026";

    const timeStr =
      bookingState.scheduleData?.startTime && bookingState.scheduleData?.endTime
        ? `${bookingState.scheduleData.startTime} - ${bookingState.scheduleData.endTime}`
        : "10:00 AM - 15:00 PM (5 Hour Duration)";

    const locationStr = bookingState.scheduleData?.location || "Woodland Hills, Woodland Hills, CA";

    const formattedAddOns = Object.entries(bookingState.addOnsQuantities).map(([key, qty]) => {
      const formattedTitle = key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return `${formattedTitle} x${qty}`;
    });

    return {
      project: {
        service: serviceName,
        occasion: occasionName,
        description: bookingState.shootDetailsData?.notes || "No description added",
      },
      schedule: {
        date: dateStr,
        startAndEndTime: timeStr,
        location: locationStr,
      },
      editingServices: {
        photoEditsLabel: `Edited Photos ${(bookingState.editsConfig.editedPhotosSets || 1) * 100} Included + 25 Added`,
        totalPhotos: `You'll Receive ${((bookingState.editsConfig.editedPhotosSets || 1) * 100) + 25} Photos`,
      },
      addOns: formattedAddOns.length > 0 ? formattedAddOns : ["Additional Camera x1"],
      includedServices: [
        "All Raw Images, Lighting & Insurance Provided",
        "Up to 45 Minutes Setup Time",
        "Digital Delivery",
      ],
    };
  };

  const renderStep = () => {
    switch (internalStep) {
      case 0:
        return (
          <GuidedBookingCard
            onContinue={handleEmailSubmitted}
            imageSrc="/images/misc/BookingFlow/GuidedBookingImg.png"
          />
        );
      case 1:
        return (
          <AskingServices
            onContinue={handleServicesSelected}
            onBack={() => setInternalStep(0)}
            initialSelected={bookingState.selectedServices}
          />
        );
      case 2:
        return (
          <EditsNeeded
            onContinue={handleEditsSubmitted}
            onBack={() => setInternalStep(1)}
            initialConfig={bookingState.editsConfig}
          />
        );
      case 3:
        return (
          <AskingOccasion
            onContinue={handleOccasionSelected}
            onBack={() => setInternalStep(2)}
            initialSelected={bookingState.selectedOccasion}
          />
        );
      case 4:
        return (
          <ScheduleShoot
            onContinue={handleScheduleSubmitted}
            onBack={() => setInternalStep(3)}
            onBrowseStudios={handleBrowseStudios}
          />
        );
      case 5:
        return (
          <ShootDetails
            onContinue={handleDetailsSubmitted}
            onBack={() => setInternalStep(4)}
            initialNotes={bookingState.shootDetailsData?.notes || ""}
            initialLinks={bookingState.shootDetailsData?.links || []}
          />
        );
      case 6:
        return (
          <MatchMakerStep
            onContinue={handleTeamSelected}
            onBack={() => setInternalStep(5)}
            initialOption={bookingState.teamSelectionData?.teamOption || "best-match"}
            packageTitle={`${
              bookingState.selectedOccasion.charAt(0).toUpperCase() +
              bookingState.selectedOccasion.slice(1)
            } - ${
              bookingState.selectedServices[0]?.charAt(0).toUpperCase() +
              bookingState.selectedServices[0]?.slice(1)
            }`}
          />
        );
      case 7:
        return (
          <CreativeTeam
            initialCounts={creativeTeam}
            onBack={() => setInternalStep(6)}
            onContinue={handleCreativeTeamSubmitted}
          />
        );
      case 8:
        return (
          <ChooseCreativePartner
            onBack={() => setInternalStep(7)}
            onContinue={handleChooseCreativePartnerSubmitted}
            requiredCount={Math.max(1, Object.values(roleCounts).reduce((sum, count) => sum + count, 0))}
            contentTypes={contentTypes}
            locationDetails={bookingState.scheduleData?.locationDetails}
          />
        );
      case 9:
        return (
          <AddOnsStep
            onBack={() => setInternalStep(8)}
            onContinue={handleAddOnsSubmitted}
            initialAddOns={bookingState.addOnsQuantities}
          />
        );
      case 10:
        return (
          <ShootSummaryStep
            onBack={() => setInternalStep(9)}
            onContinue={handleSummarySubmitted}
            onEditStep={handleEditStepByName}
            summaryData={getSummaryData()}
          />
        );
      case 11:
        return (
          <ConfirmAndPay
            onBack={() => setInternalStep(10)}
            onConfirmAndPay={handleConfirmAndPay}
            onConnectTeam={() => console.log("Connect with Beige Team clicked")}
            pricingData={getPricingData()}
            isSubmitting={isSubmitting}
          />
        );
      case 12:
        return <BookingConfirmed />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />

      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveModal(false)}
      />

      <main className="relative pt-24 lg:pt-32 pb-8 min-h-screen flex flex-col items-center justify-center w-full">
        <div className="w-full relative mx-auto">
          {renderStep()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookAShootV4;
