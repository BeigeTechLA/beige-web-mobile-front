"use client";

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { useCreateGuestBookingMutation, useUpdateGuestBookingMutation } from "@/lib/redux/features/booking/guestBookingApi";
import { useSaveQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";

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
import { buildEditTypeCounts } from "../v3/utils";
import type { SelectedItem } from "@/lib/api/pricing";

type LocationDetails = Record<string, unknown> | null;
type PhoneableContact = { fullName: string; phoneNumber: string };

const ITEM_IDS = {
  videographer: 11,
  photographer: 10,
  cinematographer: 12,
  additionalCamera: 50,
  productionAssistant: 45,
  soundEngineer: 46,
  director: 47,
  gaffer: 48,
} as const;

const isValidPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

const calculateDayHours = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) return 0;
  return Math.round((diff / 60) * 100) / 100;
};

const getLocalTimePart = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toTimeString().slice(0, 5);
};

const getScheduleDurationHours = (scheduleData: ScheduleData | null) => {
  if (!scheduleData) return 0;

  if (scheduleData.bookingType === "multi_day" && scheduleData.bookingDays?.length) {
    return scheduleData.bookingDays.reduce((sum, day) => sum + calculateDayHours(day.startTime, day.endTime), 0);
  }

  if (!scheduleData.startDate || !scheduleData.endDate) return 0;
  const start = new Date(scheduleData.startDate);
  const end = new Date(scheduleData.endDate);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diffMs <= 0) return 0;
  return Math.max(1, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
};

const getSelectedContentTypes = (selectedServices: string[]) => selectedServices.map(
  (service) => SERVICE_TO_CONTENT_TYPE[service] || service
);

const buildCrewRoleCounts = (selectedContentTypes: string[], creativeTeam: Record<string, number>) => {
  const roleCounts: Record<string, number> = {};

  if (creativeTeam.videographer > 0 || selectedContentTypes.includes("videographer")) {
    roleCounts.videographer = Math.max(1, creativeTeam.videographer || 0);
  }
  if (creativeTeam.photographer > 0 || selectedContentTypes.includes("photographer")) {
    roleCounts.photographer = Math.max(1, creativeTeam.photographer || 0);
  }
  if (selectedContentTypes.includes("editing")) {
    roleCounts.editor = 1;
  }
  if (creativeTeam.cinematographer > 0) {
    roleCounts.cinematographer = creativeTeam.cinematographer;
  }

  return roleCounts;
};

export interface ScheduleData {
  dateOption: "have-date" | "confirm-later";
  bookingType: "single_day" | "multi_day" | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  locationDetails?: LocationDetails;
  bookingDays?: {
    date: string;
    startTime?: string;
    endTime?: string;
  }[];
  startDate?: string;
  endDate?: string;
}

const SERVICE_TO_CONTENT_TYPE: Record<string, string> = {
  photography: "photographer",
  videography: "videographer",
  editing: "editing",
  studios: "studio",
  livestream: "livestream",
};

export const BookAShootV4 = () => {
  const [internalStep, setInternalStep] = useState<number>(0);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [finalBookingTotal, setFinalBookingTotal] = useState<number | null>(null);
  const [finalBookingId, setFinalBookingId] = useState<number | undefined>(undefined);
  const [saveQuote] = useSaveQuoteMutation();
  const [createGuestBooking] = useCreateGuestBookingMutation();
  const [updateGuestBooking] = useUpdateGuestBookingMutation();

  const [bookingState, setBookingState] = useState<{
    email: string;
    bookingId?: number;
    selectedServices: string[];
    editsConfig: EditsConfig;
    videoEditTypes: string[];
    photoEditTypes: string[];
    expectedDeliveryDate?: string;
    selectedOccasion: string;
    scheduleData: ScheduleData | null;
    shootDetailsData: ShootDetailsData | null;
    teamSelectionData: TeamSelectionData | null;
    selectedCrewIds: number[];
    selectedCreatives: Creator[];
    letBeigeChoose: boolean;
    creativeTeam: Record<string, number>;
    addOnsQuantities: Record<string, number>;
    addOnsSubtotal: number;
    contactInformation: PhoneableContact | null;
  }>({
    email: "",
    bookingId: undefined,
    selectedServices: ["photography"],
    editsConfig: {
      needsEdits: true,
      editedPhotosSets: 1,
    },
    videoEditTypes: [],
    photoEditTypes: [],
    selectedOccasion: "corporate",
    scheduleData: null,
    shootDetailsData: null,
    teamSelectionData: null,
    selectedCrewIds: [],
    selectedCreatives: [],
    letBeigeChoose: false,
    creativeTeam: {
      photographer: 0,
      videographer: 0,
    },
    addOnsQuantities: { additional_camera: 1 },
    addOnsSubtotal: 350,
    contactInformation: null,
  });
  const selectedContentTypes = useMemo(
    () => getSelectedContentTypes(bookingState.selectedServices),
    [bookingState.selectedServices]
  );
  const summaryEditedPhotos = Math.max(1, bookingState.editsConfig.editedPhotosSets || 1);

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
  };

  // Step 0 -> Step 1
  const handleEmailSubmitted = (payload: { email: string; bookingId?: number }) => {
    setBookingState((prev) => ({
      ...prev,
      email: payload.email,
      bookingId: payload.bookingId,
    }));
    setInternalStep(1);
  };

  // Step 1 -> Step 2
  const handleServicesSelected = (services: string[]) => {
    setBookingState((prev) => ({
      ...prev,
      selectedServices: services,
      selectedOccasion: services.length > 0 ? prev.selectedOccasion : "",
      editsConfig: services.length > 0
        ? prev.editsConfig
        : { needsEdits: true, editedPhotosSets: 1 },
    }));
    setInternalStep(2);
  };

  // Step 2 -> Step 3
  const handleOccasionSelected = (selectedOccasion: string) => {
    setBookingState((prev) => ({ ...prev, selectedOccasion }));
    setInternalStep(3);
  };

  // Step 3 -> Step 4
  const handleEditsSubmitted = (
    editsConfig: EditsConfig & { videoEditTypes?: string[]; photoEditTypes?: string[]; expectedDeliveryDate?: string },
    bookingId?: number,
  ) => {
    setBookingState((prev) => ({
      ...prev,
      editsConfig,
      videoEditTypes: editsConfig.videoEditTypes || [],
      photoEditTypes: editsConfig.photoEditTypes || [],
      expectedDeliveryDate: editsConfig.expectedDeliveryDate,
      bookingId: bookingId ?? prev.bookingId,
    }));
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
    setBookingState((prev) => ({ ...prev, creativeTeam: updatedTeam }));
    setInternalStep(8);
  };

  // Step 8 -> Step 9
  const handleChooseCreativePartnerSubmitted = (creatives: Creator[], beigeChoice: boolean) => {
    setBookingState((prev) => ({
      ...prev,
      selectedCreatives: creatives,
      selectedCrewIds: creatives.map((creator) => creator.crew_member_id),
      letBeigeChoose: beigeChoice,
    }));
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
  const handleSummarySubmitted = (contactData: { fullName: string; phoneNumber: string }) => {
    setBookingState((prev) => ({ ...prev, contactInformation: contactData }));
    setInternalStep(11);
  };

  // Step 11 -> Step 12 (Pay -> Final Confirmation)
  const handleConfirmAndPay = useCallback(async () => {
    const contact = bookingState.contactInformation;
    if (!contact?.fullName?.trim()) {
      toast.error("Please fill in your contact information");
      return;
    }
    if (!isValidPhoneNumber(contact.phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const isEditingOnly = bookingState.selectedServices.length === 1 && bookingState.selectedServices.includes("editing");
      const selectedStudiosTotal = 0;
      const firstBookingDate = bookingState.scheduleData?.bookingType === "multi_day" && bookingState.scheduleData?.bookingDays?.length
        ? bookingState.scheduleData.bookingDays.slice().sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        : null;

      const roleCounts = buildCrewRoleCounts(selectedContentTypes, bookingState.creativeTeam);
      const quoteItems: SelectedItem[] = [];

      if (!isEditingOnly) {
        const videographerCount = Number(roleCounts.videographer || 0);
        const photographerCount = Number(roleCounts.photographer || 0);
        const cinematographerCount = Number(roleCounts.cinematographer || 0);

        if (videographerCount > 0) quoteItems.push({ item_id: ITEM_IDS.videographer, quantity: videographerCount });
        if (photographerCount > 0) quoteItems.push({ item_id: ITEM_IDS.photographer, quantity: photographerCount });
        if (cinematographerCount > 0) quoteItems.push({ item_id: ITEM_IDS.cinematographer, quantity: cinematographerCount });

        if (bookingState.selectedOccasion === "podcast") {
          quoteItems.push({ item_id: ITEM_IDS.additionalCamera, quantity: 2 });
        }

        if (bookingState.selectedOccasion === "short_film" || bookingState.selectedOccasion === "movie") {
          quoteItems.push({ item_id: ITEM_IDS.productionAssistant, quantity: 1 });
          quoteItems.push({ item_id: ITEM_IDS.soundEngineer, quantity: 1 });
          quoteItems.push({ item_id: ITEM_IDS.director, quantity: 1 });
          quoteItems.push({ item_id: ITEM_IDS.gaffer, quantity: 1 });
        }
      }

      let savedQuoteId: number | null = null;
      let savedQuoteTotal: number | null = null;

      if (quoteItems.length > 0 || isEditingOnly) {
        try {
        const savedQuote = await saveQuote({
            items: quoteItems,
            shootHours: isEditingOnly ? 0 : getScheduleDurationHours(bookingState.scheduleData),
            eventType: bookingState.selectedOccasion || "general",
            guestEmail: bookingState.email,
            notes: bookingState.shootDetailsData?.notes || undefined,
            shoot_start_date: firstBookingDate ? `${firstBookingDate}T00:00:00.000Z` : bookingState.scheduleData?.startDate || undefined,
            studio_total: selectedStudiosTotal,
            video_edit_types: buildEditTypeCounts(bookingState.videoEditTypes),
            photo_edit_types: buildEditTypeCounts(bookingState.photoEditTypes),
          }).unwrap();

          savedQuoteId = savedQuote.quote_id;
          savedQuoteTotal = savedQuote.total;
        } catch (quoteError) {
          console.error("Pricing Calculation Error:", quoteError);
          toast.error("Error calculating final price, but proceeding with booking...");
        }
      }

      const finalSpecialInstructions = bookingState.shootDetailsData?.notes || undefined;

      const finalBookingData = {
        order_name: `${bookingState.selectedOccasion.toUpperCase()} Shoot - ${contact.fullName}`,
        guest_email: bookingState.email,
        content_type: isEditingOnly ? "ai editing" : selectedContentTypes.join(","),
        shoot_type: bookingState.selectedOccasion,
        booking_type: bookingState.scheduleData?.bookingType || "single_day",
        booking_days: bookingState.scheduleData?.bookingDays?.map((day) => ({
          date: day.date,
          start_time: day.startTime,
          end_time: day.endTime,
          duration_hours: calculateDayHours(day.startTime, day.endTime),
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })) || [],
        start_date: bookingState.scheduleData?.date || bookingState.scheduleData?.startDate || "",
        start_time: bookingState.scheduleData?.bookingType === "multi_day"
          ? bookingState.scheduleData?.bookingDays?.[0]?.startTime || null
          : getLocalTimePart(bookingState.scheduleData?.startDate),
        end_time: bookingState.scheduleData?.bookingType === "multi_day"
          ? bookingState.scheduleData?.bookingDays?.[0]?.endTime || null
          : getLocalTimePart(bookingState.scheduleData?.endDate),
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        estimated_delivery_date: bookingState.expectedDeliveryDate || null,
        duration_hours: getScheduleDurationHours(bookingState.scheduleData),
        location: bookingState.scheduleData?.location || "",
        location_latitude:
          bookingState.scheduleData?.locationDetails && typeof bookingState.scheduleData.locationDetails === "object"
            ? (bookingState.scheduleData.locationDetails as { coordinates?: { lat?: number }; lat?: number; center?: [number, number] }).coordinates?.lat ??
              (bookingState.scheduleData.locationDetails as { lat?: number }).lat ??
              (bookingState.scheduleData.locationDetails as { center?: [number, number] }).center?.[1] ??
              undefined
            : undefined,
        location_longitude:
          bookingState.scheduleData?.locationDetails && typeof bookingState.scheduleData.locationDetails === "object"
            ? (bookingState.scheduleData.locationDetails as { coordinates?: { lng?: number }; lng?: number; center?: [number, number] }).coordinates?.lng ??
              (bookingState.scheduleData.locationDetails as { lng?: number }).lng ??
              (bookingState.scheduleData.locationDetails as { center?: [number, number] }).center?.[0] ??
              undefined
            : undefined,
        quote_id: savedQuoteId ?? undefined,
        full_name: contact.fullName,
        phone: contact.phoneNumber,
        edits_needed: bookingState.editsConfig.needsEdits,
        video_edit_types: bookingState.videoEditTypes,
        photo_edit_types: bookingState.photoEditTypes,
        crew_size: String(bookingState.creativeTeam.videographer || bookingState.creativeTeam.photographer || 1),
        matching_method: bookingState.teamSelectionData?.teamOption === "choose-own" ? "manual" : "ai_matchmaker",
        selected_crew_ids: bookingState.selectedCrewIds,
        special_instructions: finalSpecialInstructions,
        reference_links: bookingState.shootDetailsData?.links || [],
        start_date_time: bookingState.scheduleData?.startDate || undefined,
        end_date_time: bookingState.scheduleData?.endDate || undefined,
        is_draft: false,
      };

      const submissionResult = bookingState.bookingId
        ? await updateGuestBooking({ id: bookingState.bookingId, data: finalBookingData }).unwrap()
        : await createGuestBooking(finalBookingData).unwrap();

      setFinalBookingId(submissionResult.booking_id);
      setFinalBookingTotal(savedQuoteTotal);
      setInternalStep(12);
    } catch (error: unknown) {
      console.error("Final Booking Submission Failed:", error);
      const message = error instanceof Error ? error.message : "Could not complete booking. Please check your connection.";
      toast.error("Submission Failed", {
        description: message,
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  }, [bookingState, createGuestBooking, saveQuote, selectedContentTypes, updateGuestBooking]);

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
    const addOnsCount = Object.keys(bookingState.addOnsQuantities).length;
    const addOnsCost = bookingState.addOnsSubtotal;
    const baseServiceCost = 3000;
    const editingServiceCost = bookingState.editsConfig.needsEdits ? 500 : 0;
    const creativeRoleCost = Math.max(bookingState.creativeTeam.photographer, bookingState.creativeTeam.videographer) * 275 || 275;
    const totalAmount = baseServiceCost + editingServiceCost + creativeRoleCost + addOnsCost;

    return {
      serviceName: bookingState.selectedServices.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" & ") || "Photography Services",
      baseServiceCost,
      editingServiceCost,
      creativeRoleTitle: `${bookingState.creativeTeam.photographer > 0 ? `Photographer x${bookingState.creativeTeam.photographer}` : "Creative Partner x1"}`,
      creativeRoleCost,
      addOnsCount,
      addOnsCost,
      totalAmount,
      depositAmount: 500,
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

    const schedule = bookingState.scheduleData;
    const bookingDays = schedule?.bookingDays || [];
    const isMultiDay = schedule?.bookingType === "multi_day" && bookingDays.length > 0;

    const dateStr = schedule
      ? schedule.dateOption === "confirm-later"
        ? "Date to be confirmed"
        : isMultiDay
          ? `Multiple Days - ${bookingDays.length} Selected`
          : schedule.date
            ? `Single Day - ${schedule.date}`
            : "Single Day"
      : "Single Day - 15/08/2026";

    const timeStr = schedule
      ? schedule.dateOption === "confirm-later"
        ? "Time to be confirmed"
        : isMultiDay
          ? bookingDays.every((day) => day.startTime && day.endTime)
            ? bookingDays.length === 1
              ? `${bookingDays[0].startTime} - ${bookingDays[0].endTime}`
              : "Custom timings for selected days"
            : "Select time for each day"
          : schedule.startTime && schedule.endTime
            ? `${schedule.startTime} - ${schedule.endTime}`
            : "10:00 AM - 15:00 PM (5 Hour Duration)"
      : "10:00 AM - 15:00 PM (5 Hour Duration)";

    const locationStr = schedule?.location || "Woodland Hills, Woodland Hills, CA";

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
        photoEditsLabel: `Edited Photos ${summaryEditedPhotos * 100} Included + 25 Added`,
        totalPhotos: `You'll Receive ${(summaryEditedPhotos * 100) + 25} Photos`,
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
            imageSrc="/images/booking-studio.jpg"
          />
        );
      case 1:
        return (
          <AskingServices
            onContinue={handleServicesSelected}
            onBack={() => setInternalStep(0)}
            initialSelected={bookingState.selectedServices}
            email={bookingState.email}
          />
        );
      case 2:
        return (
          <AskingOccasion
            onContinue={handleOccasionSelected}
            onBack={() => setInternalStep(1)}
            initialSelected={bookingState.selectedOccasion}
            contentType={selectedContentTypes}
          />
        );

case 3:
  return (
    <EditsNeeded
      onContinue={handleEditsSubmitted}
      onBack={() => setInternalStep(2)}
      initialConfig={bookingState.editsConfig}
      contentType={selectedContentTypes}
      shootType={bookingState.selectedOccasion}
      email={bookingState.email}
      bookingId={bookingState.bookingId}
    />
  );
      case 4:
        return (
          <ScheduleShoot
            onContinue={handleScheduleSubmitted}
            onBack={() => setInternalStep(3)}
            onBrowseStudios={handleBrowseStudios}
            bookingId={bookingState.bookingId}
            email={bookingState.email}
            clientName={bookingState.contactInformation?.fullName || bookingState.email}
            selectedContentTypes={selectedContentTypes}
            shootType={bookingState.selectedOccasion}
            initialData={bookingState.scheduleData}
          />
        );
      case 5:
        return (
          <ShootDetails
            onContinue={handleDetailsSubmitted}
            onBack={() => setInternalStep(4)}
            initialNotes={bookingState.shootDetailsData?.notes || ""}
            initialLinks={bookingState.shootDetailsData?.links || []}
            bookingId={bookingState.bookingId}
            email={bookingState.email}
            clientName={bookingState.contactInformation?.fullName || bookingState.email}
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
            initialCounts={bookingState.creativeTeam}
            onBack={() => setInternalStep(6)}
            onContinue={handleCreativeTeamSubmitted}
          />
        );
      case 8:
        return (
          <ChooseCreativePartner
            onBack={() => setInternalStep(7)}
            onContinue={handleChooseCreativePartnerSubmitted}
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
            isSubmitting={isSubmittingBooking}
          />
        );
      case 12:
        return <BookingConfirmed totalAmount={finalBookingTotal ?? getPricingData().totalAmount} bookingId={finalBookingId} />;
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
