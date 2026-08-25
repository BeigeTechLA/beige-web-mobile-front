"use client";

import React, { useState } from "react";
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

export interface ScheduleData {
  dateOption: "have-date" | "confirm-later";
  bookingType: "single_day" | "multi_day" | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  locationDetails?: any;
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

  const [bookingState, setBookingState] = useState<{
    email: string;
    bookingId?: number;
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
    bookingId: undefined,
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

  const selectedContentTypes = bookingState.selectedServices.map(
    (service) => SERVICE_TO_CONTENT_TYPE[service] || service
  );

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
  const handleEditsSubmitted = (editsConfig: EditsConfig, bookingId?: number) => {
    setBookingState((prev) => ({
      ...prev,
      editsConfig,
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
  const handleSummarySubmitted = (contactData: { fullName: string; phoneNumber: string }) => {
    setBookingState((prev) => ({ ...prev, contactInformation: contactData }));
    setInternalStep(11);
  };

  // Step 11 -> Step 12 (Pay -> Final Confirmation)
  const handleConfirmAndPay = () => {
    setInternalStep(12);
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
    const addOnsCount = Object.keys(bookingState.addOnsQuantities).length;
    const addOnsCost = bookingState.addOnsSubtotal;
    const baseServiceCost = 3000;
    const editingServiceCost = 500;
    const creativeRoleCost = 275;
    const totalAmount = baseServiceCost + editingServiceCost + creativeRoleCost + addOnsCost;

    return {
      serviceName: "Photography Services",
      baseServiceCost,
      editingServiceCost,
      creativeRoleTitle: "Photographer x1",
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
            bookingId={bookingState.bookingId}
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
