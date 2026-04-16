"use client";

import React, { useState, useEffect } from "react";
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

export type CrewBreakdown = {
  videographer: number;
  photographer: number;
  cinematographer: number;
};

export type BookingData = {
  serviceType: "shoot_edit" | "shoot_raw" | "edit_files" | null;
  contentType: ("videographer" | "photographer" | "cinematographer" | "all")[];
  shootType: string;
  editType: string[];
  shootName: string;
  guestEmail: string;
  crewSize: number;
  crewBreakdown: CrewBreakdown;
  referenceLink: string;
  specialNote: string;
  budgetMin: number;
  budgetMax: number;
  quoteId: number | null;
  quoteTotal: number;
  calculatedQuote: QuoteCalculation | null;
  selectedServices: Array<{ item_id: number; quantity: number }>;
  startDate: string;
  endDate: string;
  location: string;
  needStudio: boolean;
  studio: string;
  studioTimeDuration: number;
  wantsAddons: "yes" | "no" | null;
  addons: Record<string, number>;
};

const initialData: BookingData = {
  serviceType: null,
  contentType: [],
  shootType: "",
  editType: [],
  shootName: "",
  guestEmail: "",
  crewSize: 1,
  crewBreakdown: { videographer: 0, photographer: 0, cinematographer: 0 },
  referenceLink: "",
  specialNote: "",
  budgetMin: 100,
  budgetMax: 20000,
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

export const BookAShootV2 = () => {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<BookingData>(initialData);

  const quote = useSelector(selectQuote);
  const selectedItems = useSelector(selectSelectedItems);
  const shootHours = useSelector(selectShootHours);

  const [createGuestBooking, { isLoading: isCreatingBooking }] =
    useCreateGuestBookingMutation();
  const [saveQuote, { isLoading: isSavingQuote }] = useSaveQuoteMutation();

  const updateData = (newData: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () =>
    setActiveStep((prev) => Math.min(prev + 1, MY_STEPS.length));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  const backHome = () => {
    const storedUser = localStorage.getItem("revure_user");

    if (storedUser) {
      router.push("/affiliate/dashboard");
    } else {
      router.push("/");
    }
  };

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
    if (!formData.guestEmail || !formData.guestEmail.includes("@")) {
      toast.error("Email Required", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSearching(true);

    try {
      let savedQuoteId: number | null = null;

      if (quote && quote.total > 0) {
        try {
          const CREW_ROLE_ITEMS = {
            videographer: 11,
            photographer: 10,
            cinematographer: 12
          };

          let quoteItems = [...selectedItems];

          if (quoteItems.length === 0) {
            if (formData.crewBreakdown.videographer > 0) {
              quoteItems.push({
                item_id: CREW_ROLE_ITEMS.videographer,
                quantity: formData.crewBreakdown.videographer
              });
            }
            if (formData.crewBreakdown.photographer > 0) {
              quoteItems.push({
                item_id: CREW_ROLE_ITEMS.photographer,
                quantity: formData.crewBreakdown.photographer
              });
            }
            if (formData.crewBreakdown.cinematographer > 0) {
              quoteItems.push({
                item_id: CREW_ROLE_ITEMS.cinematographer,
                quantity: formData.crewBreakdown.cinematographer
              });
            }
          }

          const savedQuote = await saveQuote({
            items: quoteItems,
            shootHours: calculateDurationHours(),
            eventType: formData.shootType,
            guestEmail: formData.guestEmail,
            notes: formData.specialNote || undefined,
            role_counts: {
              videographer: formData.crewBreakdown.videographer || 0,
              photographer: formData.crewBreakdown.photographer || 0,
              cinematographer: formData.crewBreakdown.cinematographer || 0,
            },
          }).unwrap();

          savedQuoteId = savedQuote.quote_id;
        } catch (quoteError) {
          console.error("Failed to save quote:", quoteError);
          toast.error("Failed to save pricing. Continuing with booking...");
        }
      }

      let userId: number | undefined = undefined;

      try {
        const storedUser = localStorage.getItem("revure_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.id) {
            userId = Number(parsedUser.id);
          }
        }
      } catch (err) {
        console.warn("Failed to parse revure_user from localStorage", err);
      }

      const bookingData = {
        ...(userId ? { user_id: userId } : {}),
        order_name: formData.shootName || `${formData.shootType} Shoot`,
        guest_email: formData.guestEmail,
        project_type: formData.serviceType,
        content_type: formData.contentType.join(","),
        shoot_type: formData.shootType,
        edit_type: formData.editType.join(","),
        description: formData.specialNote,
        event_type: formData.shootType,
        start_date_time: formData.startDate,
        duration_hours: calculateDurationHours(),
        end_time: formData.endDate,
        budget_min: quote?.total || formData.budgetMin,
        budget_max: quote?.total || formData.budgetMax,
        crew_size: String(formData.crewSize),
        location: formData.location,
        skills_needed: formData.contentType.join(","),
        equipments_needed:
          selectedItems.length > 0 ? JSON.stringify(selectedItems) : undefined,
        is_draft: false,
        quote_id: savedQuoteId || undefined,
      };

      const bookingResult = await createGuestBooking(bookingData).unwrap();

      toast.success("Booking Created!", {
        description: "We're now finding the best creators for your project.",
      });

      const searchParams = new URLSearchParams({
        booking_id: String(bookingResult.booking_id),
        content_types: formData.contentType.join(","),
        location: formData.location || "",
        min_budget: String(formData.budgetMin || 0),
        max_budget: String(quote?.total || formData.budgetMax),
      });

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

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
};
