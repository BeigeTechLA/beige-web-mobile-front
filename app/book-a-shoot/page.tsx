"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Step6Loading } from "@/src/components/booking/v2";
import { StepProgressTracker } from "@/components/book-a-shoot/StepProgressTracker";

import { Step1ProjectDetails } from "@/components/book-a-shoot/Step1ProjectDetails";
import { Step2MoreDetails } from "@/components/book-a-shoot/Step2MoreDetails";
import { Step3DateTime } from "@/components/book-a-shoot/Step3DateTime";
import { Step4Review } from "@/components/book-a-shoot/Step4Review";

import { ArrowLeft } from "lucide-react";
import { useCreateGuestBookingMutation } from "@/lib/redux/features/booking/guestBookingApi";
import { useSaveQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";
import {
  selectQuote,
  selectSelectedItems,
  selectShootHours,
} from "@/lib/redux/features/pricing/pricingSlice";
import type { QuoteCalculation } from "@/lib/api/pricing";

const MY_STEPS = [
  { label: "Project Details" },
  { label: "More Details" },
  { label: "Date & Time" },
  { label: "Review & Match" },
];

export type BookingData = {
  serviceType: "shoot_edit" | "shoot_raw" | "edit_files" | null;
  contentType: ("videographer" | "photographer" | "cinematographer" | "all")[];
  shootType: string;
  editType: string;
  shootName: string;
  guestEmail: string;
  crewSize: string;
  referenceLink: string;
  specialNote: string;
  budgetMin: number;
  budgetMax: number;
  // Quote related fields
  quoteId: number | null;
  quoteTotal: number;
  calculatedQuote: QuoteCalculation | null;
  selectedServices: Array<{ item_id: number; quantity: number }>;
  // Date & Location
  startDate: string;
  endDate: string;
  location: string;
  needStudio: boolean;
  studio: string;
  studioTimeDuration: number;
  // Add-ons
  wantsAddons: "yes" | "no" | null;
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
  quoteId: null,
  quoteTotal: 0,
  calculatedQuote: null,
  selectedServices: [],
  startDate: "",
  endDate: "",
  location: "",
  needStudio: false,
  studio: "",
  studioTimeDuration: 3,
  wantsAddons: null,
  addons: {},
};

export default function BookAShootPage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<BookingData>(initialData);

  // Redux state for pricing
  const quote = useSelector(selectQuote);
  const selectedItems = useSelector(selectSelectedItems);
  const shootHours = useSelector(selectShootHours);

  // API mutations
  const [createGuestBooking, { isLoading: isCreatingBooking }] =
    useCreateGuestBookingMutation();
  const [saveQuote, { isLoading: isSavingQuote }] = useSaveQuoteMutation();

  // Helper to update specific fields in formData
  const updateData = (newData: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () =>
    setActiveStep((prev) => Math.min(prev + 1, MY_STEPS.length));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));
  const backHome = () => {
    router.push(`/`);
  };

  // Calculate duration in hours from start and end dates
  const calculateDurationHours = (): number => {
    if (!formData.startDate || !formData.endDate)
      return formData.studioTimeDuration || shootHours || 3;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    return hours;
  };

  const handleFindCreative = async () => {
    // Validate email
    if (!formData.guestEmail || !formData.guestEmail.includes("@")) {
      toast.error("Email Required", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSearching(true);

    try {
      // Step 1: Save the quote if we have selected items
      let savedQuoteId: number | null = null;

      if (selectedItems.length > 0 && quote) {
        try {
          const savedQuote = await saveQuote({
            items: selectedItems,
            shootHours: calculateDurationHours(),
            eventType: formData.shootType,
            guestEmail: formData.guestEmail,
            notes: formData.specialNote || undefined,
          }).unwrap();

          savedQuoteId = savedQuote.quote_id;
          console.log("Quote saved:", savedQuoteId);
        } catch (quoteError) {
          console.error("Failed to save quote:", quoteError);
        }
      }

      // Step 2: Create the guest booking
      const bookingData = {
        order_name: formData.shootName || `${formData.shootType} Shoot`,
        guest_email: formData.guestEmail,
        project_type: formData.serviceType,
        content_type: formData.contentType.join(","),
        shoot_type: formData.shootType,
        edit_type: formData.editType,
        description: formData.specialNote,
        event_type: formData.shootType,
        start_date_time: formData.startDate,
        duration_hours: calculateDurationHours(),
        end_time: formData.endDate,
        budget_min: quote?.total || formData.budgetMin,
        budget_max: quote?.total || formData.budgetMax,
        crew_size: formData.crewSize,
        location: formData.location,
        skills_needed: formData.contentType.join(","),
        equipments_needed:
          selectedItems.length > 0 ? JSON.stringify(selectedItems) : undefined,
        is_draft: false,
        quote_id: savedQuoteId || undefined,
      };

      const bookingResult = await createGuestBooking(bookingData).unwrap();

      console.log("Booking created:", bookingResult);
      console.log("🔍 DEBUG: Form data for search:", {
        contentType: formData.contentType,
        shootType: formData.shootType,
        location: formData.location,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        quoteTotal: quote?.total,
      });

      toast.success("Booking Created!", {
        description: "We're now finding the best creators for your project.",
      });

      // Step 3: Navigate to search results with booking context
      const searchParams = new URLSearchParams({
        booking_id: String(bookingResult.booking_id),
        content_types: formData.contentType.join(","), // FIX: Pass role types for filtering
        location: formData.location || "",
        min_budget: String(formData.budgetMin || 0),
        max_budget: String(quote?.total || formData.budgetMax),
      });

      console.log("🔍 DEBUG: Search URL params:", searchParams.toString());
      console.log("🔍 DEBUG: Full search URL:", `/search-results?${searchParams.toString()}`);

      setTimeout(() => {
        router.push(`/search-results?${searchParams.toString()}`);
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creating booking:", error);
      setIsSearching(false);
      toast.error("Booking Failed", {
        description:
          (error as { message?: string })?.message || "Please try again.",
      });
    }
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
        return <Step3DateTime {...props} />;
      case 4:
        return (
          <Step4Review
            {...props}
            isSubmitting={isCreatingBooking || isSavingQuote}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {isSearching ? (
        <Step6Loading />
      ) : (
        <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
          <Navbar />
          <main className="relative pt-24 lg:pt-44 pb-16 min-h-screen flex flex-col items-center">
            <div className="w-full container z-20 px-4 md:px-6">
              <button
                onClick={activeStep === 1 ? backHome : prevStep}
                className="flex items-center text-sm lg:text-lg transition-colors text-white/70 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center">
              <StepProgressTracker steps={MY_STEPS} currentStep={activeStep} />
              <div className="w-full max-w-4xl lg:max-w-5xl min-h-[400px]">
                {renderStep()}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )}
    </>
  );
}
