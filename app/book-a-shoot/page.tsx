"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/src/components/landing/Navbar"
import { Footer } from "@/src/components/landing/Footer"
import { Step6Loading } from "@/src/components/booking/v2"
import { StepProgressTracker } from "@/components/book-a-shoot/StepProgressTracker";

import { Step1ProjectDetails } from "@/components/book-a-shoot/Step1ProjectDetails";
import { Step2MoreDetails } from "@/components/book-a-shoot/Step2MoreDetails";
// import Step3DateTime from "@/src/components/book-a-shoot/Step3DateTime";
// import Step4Review from "@/src/components/book-a-shoot/Step4Review";

import { ArrowLeft } from "lucide-react";

const MY_STEPS = [
  { label: "Project Details" },
  { label: "More Details" },
  { label: "Date & Time" },
  { label: "Review & Match" },
];

export type BookingData = {
  serviceType: "shoot_edit" | "shoot_raw" | "edit_files" | null;
  contentType: ("videographer" | "photographer" | "cinematographer" | "all")[]; shootType: string;
  editType: string;
  shootName: string;
  guestEmail: string;
  crewSize: string;
  referenceLink: string;
  specialNote: string;
  budgetMin: number;
  budgetMax: number;
  startDate: string;
  endDate: string;
  location: string;
  needStudio: boolean;
  studio: string;
  studioTimeDuration: number;
  wantsAddons: "yes" | "no"| null;
  addons: Record<string, number>;
};

const initialData: BookingData = {
  serviceType: null,
  contentType: [],
  shootType: "",
  editType: "",
  shootName: "",
  guestEmail: "",
  crewSize: "",
  referenceLink: "",
  specialNote: "",
  budgetMin: 100,
  budgetMax: 15000,
  startDate: "",
  endDate: "",
  location: "",
  needStudio: false,
  studio: "",
  studioTimeDuration: 0,
  wantsAddons: null,
  addons: {}
};

export default function InvestorPage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false)
  const [activeStep, setActiveStep] = useState(1) // Start at step 1
  const [formData, setFormData] = useState<BookingData>(initialData);

  // Helper to update specific fields in formData
  const updateData = (newData: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, MY_STEPS.length));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const backHome = () => { router.push(`/`); }

  const handleFindCreative = () => {
    setIsSearching(true);
    // Simulate API call or matching logic
    setTimeout(() => {
      // Logic after "searching" is done
      console.log("Form Submitted:", formData);
    }, 3000);
  };

  // Logic to determine which component to show
  const renderStep = () => {
    const props = {
      data: formData,
      updateData: updateData,
      onNext: activeStep === MY_STEPS.length ? handleFindCreative : nextStep,
      onBack: prevStep,
    };

    switch (activeStep) {
      case 1:
        return <Step1ProjectDetails {...props} />;
      case 2:
        return <Step2MoreDetails {...props} />;
      case 3:
        return <div className="text-white">Step 3 Component Here</div>;
      // return <Step3DateTime {...props} />;
      case 4:
        return <div className="text-white">Step 4 Component Here</div>;
      // return <Step4Review {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      {isSearching ? (
        <Step6Loading />
      ) : (
        <>
          <Navbar />
          <main className="relative pt-24 lg:pt-44 pb-16 min-h-screen flex flex-col items-center">
            <div className="w-full container z-20 px-4 md:px-6">
              <button
                onClick={activeStep === 1 ? backHome : prevStep}
                className={`flex items-center text-sm lg:text-lg transition-colors text-white/70 hover:text-white`}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center">
              <StepProgressTracker
                steps={MY_STEPS}
                currentStep={activeStep}
              />
              <div className="w-full max-w-4xl lg:max-w-5xl min-h-[400px]">
                {renderStep()}
              </div>
            </div>
          </main>
        </>
      )}
      <Footer />
    </div>
  )
}