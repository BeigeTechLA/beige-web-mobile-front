"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { StepProgressTracker } from "@/components/book-a-shoot/StepProgressTracker";
import { ArrowLeft } from "lucide-react";
import {
  useCreateGuestBookingMutation,
  useUpdateGuestBookingMutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import { useSaveQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { useAuth } from "@/lib/hooks/useAuth";

import {
  BookingDataV3,
  initialDataV3,
  V3Step1ChooseService,
  V3Step2MoreDetails,
  V3Step3CrewMatching,
  V3LoadingFindingCreative,
  V3SelectDreamTeam,
  V3Step4BookConfirm,
} from "./index";

const V3_STEPS = [
  { label: "Choose Service" },
  { label: "Customized Details" },
  { label: "Book & Confirm" },
];

export const BookAShootV3 = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [internalStep, setInternalStep] = useState(1);
  const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
  const [leadTracked, setLeadTracked] = useState(false);
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);

  const [createGuestBooking, { isLoading: isBookingLoading }] =
    useCreateGuestBookingMutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] =
    useUpdateGuestBookingMutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteMutation();
  const [trackEarlyInterest] = useTrackEarlyInterestMutation();

  const isSubmitting = isBookingLoading || isQuoteLoading || isUpdatingBooking;

  // const updateData = (newData: Partial<BookingDataV3>) => {
  //   setFormData((prev) => ({ ...prev, ...newData }));
  // };

  const updateData = useCallback((newData: Partial<BookingDataV3>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Track early interest when logged-in user lands on the page
  useEffect(() => {
    const trackLoggedInUser = async () => {
      if (isAuthenticated && user?.email && !leadTracked) {
        try {
          const result = await trackEarlyInterest({
            guest_email: user.email,
            user_id: user.id,
            client_name: user.name,
          }).unwrap();

          setDraftBookingId(result.data.booking_id);
          setLeadId(result.data.lead_id);
          setLeadTracked(true);
          console.log("Lead tracked for logged-in user:", result.data);
        } catch (error) {
          console.error("Failed to track lead for logged-in user:", error);
          // Non-blocking error, continue with booking flow
        }
      }
    };

    trackLoggedInUser();
  }, [
    isAuthenticated,
    user?.email,
    user?.id,
    user?.name,
    leadTracked,
    trackEarlyInterest,
  ]);

  const nextStep = async () => {
    // Track lead when moving from step 1 to 2 (if not already tracked)
    if (internalStep === 1 && !leadTracked && formData.email) {
      try {
        const result = await trackEarlyInterest({
          guest_email: formData.email,
          user_id: user?.id,
          content_type: formData.contentType.join(","),
          shoot_type: formData.shootType,
        }).unwrap();

        setDraftBookingId(result.data.booking_id);
        setLeadId(result.data.lead_id);
        setLeadTracked(true);
        console.log("Lead tracked after step 1:", result.data);
      } catch (error) {
        console.error("Failed to track lead:", error);
        // Non-blocking error, continue with booking flow
      }
    }

    if (internalStep === 3) {
      // Step 3 -> Loading -> Crew Selection
      setInternalStep(4); // Loading
      setTimeout(() => {
        setInternalStep(5); // Crew Select
        setActiveStep(2);
      }, 2500);
    } else {
      const next = internalStep + 1;
      setInternalStep(next);

      if (next === 2) setActiveStep(2);
      if (next === 6) setActiveStep(3);
    }
  };

  const prevStep = () => {
    if (internalStep === 1) {
      router.back();
      return;
    }

    // From Dream Team selection, go back to Crew Matching
    if (internalStep === 5) {
      setInternalStep(3);
      setActiveStep(2);
      return;
    }

    // From Book & Confirm, go back to Dream Team selection
    if (internalStep === 6) {
      setInternalStep(5);
      setActiveStep(2);
      return;
    }

    const prev = internalStep - 1;
    setInternalStep(prev);

    if (prev === 1) setActiveStep(1);
    if (prev === 2) setActiveStep(2);
    if (prev === 3) setActiveStep(2);
  };

  const handleBookingSubmission = async () => {
    try {
      const calculateDurationHours = () => {
        if (!formData.startDate || !formData.endDate) return 3;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        return hours;
      };

      // 1. Save Quote
      let savedQuoteId: number | null = null;

      // Build items list based on content type
      const CREW_ROLE_ITEMS = {
        videographer: 11,
        photographer: 10,
        cinematographer: 12,
      };

      let quoteItems: Array<{ item_id: number; quantity: number }> = [];

      // Map selected content types to pricing items
      if (formData.contentType.includes("videographer")) {
        quoteItems.push({ item_id: CREW_ROLE_ITEMS.videographer, quantity: 1 });
      }
      if (formData.contentType.includes("photographer")) {
        quoteItems.push({ item_id: CREW_ROLE_ITEMS.photographer, quantity: 1 });
      }
      if (formData.contentType.includes("cinematographer")) {
        quoteItems.push({
          item_id: CREW_ROLE_ITEMS.cinematographer,
          quantity: 1,
        });
      }

      // Add editing if selected (assuming generic editing item for now, ID 13 is a guess/placeholder,
      // strictly we should check database but let's stick to known IDs or skip if unknown)
      // If "editing" is in contentType, we might want to charge for it.
      // For safety, let's only add what we know maps to the backend to ensure a valid quote.

      if (quoteItems.length > 0) {
        try {
          const savedQuote = await saveQuote({
            items: quoteItems,
            shootHours: calculateDurationHours(),
            eventType: formData.shootType || "general",
            guestEmail: formData.email,
            notes: formData.specialInstructions || undefined,
          }).unwrap();

          savedQuoteId = savedQuote.quote_id;
          console.log("V3 Quote saved:", savedQuoteId);
        } catch (quoteError) {
          console.error("Failed to save quote in V3:", quoteError);
          toast.error(
            "Failed to generate pricing quote. Proceeding with booking...",
          );
        }
      }

      // 2. Create or Update Booking
      const bookingData: any = {
        order_name: `${formData.shootType} Shoot - ${formData.fullName}`,
        guest_email: formData.email,
        project_type: null,
        content_type: formData.contentType.join(","),
        shoot_type: formData.shootType,
        start_date_time: formData.startDate,
        end_time: formData.endDate,
        duration_hours: calculateDurationHours(),
        location: formData.location,
        budget_min: formData.budgetMin,
        budget_max: formData.budgetMax,
        crew_size: String(
          formData.selectedCrewIds.length || quoteItems.length || 1,
        ),
        is_draft: false,
        quote_id: savedQuoteId, // Pass the created quote ID

        // New V3 fields
        full_name: formData.fullName,
        phone: formData.phone,
        edits_needed: formData.editsNeeded,
        video_edit_types: formData.videoEditTypes,
        photo_edit_types: formData.photoEditTypes,
        team_included: formData.teamIncluded,
        add_team_members: formData.addTeamMembers,
        special_instructions: formData.specialInstructions,
        reference_links: formData.referenceLinks,
        matching_method: formData.matchingMethod,
        selected_crew_ids: formData.selectedCrewIds,
      };

      let result;
      if (draftBookingId) {
        // Update existing draft booking
        result = await updateGuestBooking({
          id: draftBookingId,
          data: bookingData,
        }).unwrap();
        console.log("Updated draft booking:", draftBookingId);
      } else {
        // Create new booking (fallback if lead tracking failed)
        result = await createGuestBooking(bookingData).unwrap();
        console.log("Created new booking");
      }

      toast.success("Booking Created Successfully!", {
        description: "Redirecting to payment...",
      });

      // 3. Redirect to Payment Page
      const searchParams = new URLSearchParams({
        shootId: String(result.booking_id), // Payment page expects shootId
      });

      router.push(`/search-results/payment?${searchParams.toString()}`);
    } catch (error: any) {
      console.error("Booking failed:", error);
      toast.error("Booking Failed", {
        description:
          error?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [internalStep]);

  const renderStep = () => {
    const props = {
      data: formData,
      updateData,
      onNext: nextStep,
      onBack: prevStep,
    };

    switch (internalStep) {
      case 1:
        return <V3Step1ChooseService {...props} />;
      case 2:
        return <V3Step2MoreDetails {...props} />;
      case 3:
        return <V3Step3CrewMatching {...props} />;
      case 4:
        return <V3LoadingFindingCreative />;
      case 5:
        return (
          <V3SelectDreamTeam
            {...props}
            bookingId={draftBookingId || undefined}
          />
        );
      case 6:
        return (
          <V3Step4BookConfirm
            {...props}
            onConfirm={handleBookingSubmission}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />
      <main className="relative pt-24 lg:pt-44 pb-8 lg:pb-16 min-h-screen flex flex-col items-center">
        {/* Back Button (hide on loading) */}
        {internalStep !== 4 && (
          <div className="w-full container z-20 px-4 md:px-6">
            <button
              onClick={prevStep}
              className="flex items-center text-sm lg:text-lg transition-colors text-white/70 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center">
          {internalStep !== 4 && (
            <StepProgressTracker steps={V3_STEPS} currentStep={activeStep} />
          )}

          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-7xl min-h-[400px] mt-5 lg:mt-8">
            {renderStep()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
