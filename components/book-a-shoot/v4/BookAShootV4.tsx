"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import LeaveConfirmationModal from "./components/LeaveConfirmationModal";
import GuidedBookingCard from "./components/GuidedBookingCard";
import AskingServices from "./components/AskingServices";
import EditsNeeded, { EditsConfig } from "./components/EditsNeeded";
import AskingOccasion from "./components/AskingOccassion";

export const BookAShootV4 = () => {
  // Step 0: GuidedBookingCard, Step 1: AskingServices, Step 2: EditsNeeded, Step 3: AskingOccasion, etc.
  const [internalStep, setInternalStep] = useState<number>(0);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  const [bookingState, setBookingState] = useState<{
    email: string;
    selectedServices: string[];
    editsConfig: EditsConfig;
    selectedOccasion: string;
  }>({
    email: "",
    selectedServices: ["photography"],
    editsConfig: {
      needsEdits: true,
      editedPhotosSets: 1,
    },
    selectedOccasion: "corporate",
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
        return <div className="text-white py-12">/* Step 4: Schedule */</div>;
      case 5:
        return <div className="text-white py-12">/* Step 5: Confirmation */</div>;
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