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

export interface ScheduleData {
  dateOption: "have-date" | "confirm-later";
  bookingType: "single" | "multiple" | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
}

export const BookAShootV4 = () => {
  const [internalStep, setInternalStep] = useState<number>(6);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  const [bookingState, setBookingState] = useState<{
    email: string;
    selectedServices: string[];
    editsConfig: EditsConfig;
    selectedOccasion: string;
    scheduleData: ScheduleData | null;
    shootDetailsData: ShootDetailsData | null;
    teamSelectionData: TeamSelectionData | null;
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
  });

  const [creativeTeam, setCreativeTeam] = useState<{ [key: string]: number }>({
    photographer: 0,
    videographer: 0,
  });

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
  };

  // Step 0 -> Step 1
  const handleEmailSubmitted = (email: string) => {
    setBookingState((prev) => ({ ...prev, email }));
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

  const handleBrowseStudios = () => {
    // Action handler for studio modal or redirection
    console.log("Browse studios clicked");
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
        return <div className="text-white py-12 text-center">Step 8: Confirmation</div>;
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
        <div className="w-full relative z-10 mx-auto">
          {renderStep()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookAShootV4;