"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  V3Step5Studios,
  V3Step4BookConfirm,
} from "./index";
import { pushToDataLayer } from "@/lib/gtm";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { parseDate } from "@/src/components/landing/lib/utils";
import { buildEditTypeCounts } from "./utils";
import { getSelectedStudiosTotal, normalizeSelectedStudios } from "./studioData";

const V3_STEPS = [
  { label: "Choose Service" },
  { label: "Customized Details" },
  { label: "Book & Confirm" },
];

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

interface FormFields {
  email: string;
  user_id: number | undefined;
  content_type: string;
  shoot_type: string;
  shoot_date_time: string;
  edits_needed: boolean;
  video_edit_types?: string;
  photo_edit_types?: string;
}

export const BookAShootV3 = () => {
  const COACHELLA_DEFAULT_LOCATION = "Indio, California, United States";
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [internalStep, setInternalStep] = useState(1);
  const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
  const [leadTracked, setLeadTracked] = useState(false);
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [userTypeName, setUserTypeName] = useState("Unknown");

  const allowNavigation = useRef(false)

  const [createGuestBooking, { isLoading: isBookingLoading }] =
    useCreateGuestBookingMutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] =
    useUpdateGuestBookingMutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteMutation();
  const [trackEarlyInterest] = useTrackEarlyInterestMutation();

  const isSubmitting = isBookingLoading || isQuoteLoading || isUpdatingBooking;
  const shouldShowStudiosStep = formData.shootType === "coachella";

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

    if (isAuthenticated && user?.email) {
      setUserTypeName(USER_TYPE[user?.user_type_id])
    }

    // trackLoggedInUser();
  }, [
    isAuthenticated,
    user?.email,
    user?.id,
    user?.name,
    leadTracked,
    trackEarlyInterest,
  ]);

  useEffect(() => {
    if (
      formData.shootType === "coachella" &&
      formData.location !== COACHELLA_DEFAULT_LOCATION
    ) {
      updateData({
        location: COACHELLA_DEFAULT_LOCATION,
        locationDetails: null,
      });
    }
  }, [formData.shootType, formData.location, updateData]);

  const nextStep = async () => {
    // Track lead when moving from step 1 to 2 (if not already tracked)
    // if (internalStep === 1 && !leadTracked && formData.email) {
    //   try {
    //     const result = await trackEarlyInterest({
    //       guest_email: formData.email,
    //       user_id: user?.id,
    //       content_type: formData.contentType.join(","),
    //       shoot_type: formData.shootType,
    //     }).unwrap();

    //     setDraftBookingId(result.data.booking_id);
    //     setLeadId(result.data.lead_id);
    //     setLeadTracked(true);
    //     console.log("Lead tracked after step 1:", result.data);
    //   } catch (error) {
    //     console.error("Failed to track lead:", error);
    //     // Non-blocking error, continue with booking flow
    //   }
    // }

    //    if (internalStep === 1 && !leadTracked && formData.email) {
    //   try {
    //     // Show a loading toast if you want
    //     const result = await trackEarlyInterest({
    //       guest_email: formData.email,
    //       user_id: user?.id,
    //       content_type: formData.contentType.join(","),
    //       shoot_type: formData.shootType,
    //       client_name: user?.name || formData.fullName,
    //     }).unwrap();

    //     // IMPORTANT: Update all states at once
    //     const bId = result.data.booking_id;
    //     setDraftBookingId(bId);
    //     setLeadId(result.data.lead_id);
    //     setLeadTracked(true);

    //     updateData({ bookingId: bId });

    //     console.log("Lead tracked successfully:", result.data);
    //   } catch (error) {
    //     console.error("Failed to track lead:", error);
    //   }
    // }
    if (internalStep === 1) {
      try {
        const isEditingOnly =
          formData.contentType.length === 1 &&
          formData.contentType.includes("editing");
        const browserTimeZone = getBrowserTimeZone();
        const startDate = getLocalDatePart(formData.startDate);
        const startTime = getLocalTimePart(formData.startDate);
        const endTime = getLocalTimePart(formData.endDate);
        const estimatedDeliveryDate = getLocalDatePart(formData.expectedDeliveryDate);

        const earlyInterestPayload: any = {
          booking_id: draftBookingId,
          guest_email: formData.email,
          user_id: user?.id,
          shoot_type: formData.shootType,
          client_name: user?.name || formData.fullName,
          edits_needed: formData.editsNeeded,
          video_edit_types: formData.videoEditTypes,
          photo_edit_types: formData.photoEditTypes,
        };

        if (isEditingOnly) {
          earlyInterestPayload.content_type = "ai editing";
          earlyInterestPayload.estimated_delivery_date = estimatedDeliveryDate;
        } else {
          earlyInterestPayload.content_type = formData.contentType.join(",");
          earlyInterestPayload.start_date = startDate;
          earlyInterestPayload.start_time = startTime;
          earlyInterestPayload.end_time = endTime;
          earlyInterestPayload.time_zone = browserTimeZone;
          earlyInterestPayload.startDate = formData.startDate;
          earlyInterestPayload.endDate = formData.endDate;
          earlyInterestPayload.booking_type = formData.bookingType;
          earlyInterestPayload.booking_days = (formData.bookingDays || []).map((d: any) => ({
            ...d,
            time_zone: d.time_zone || d.timeZone || browserTimeZone
          }));
        }

        const result = await trackEarlyInterest(earlyInterestPayload).unwrap();

        setDraftBookingId(result?.data?.booking_id);
        updateData({ bookingId: result?.data?.booking_id });

        const formFields: FormFields = {
          content_type: formData.contentType.join(","),
          shoot_type: formData.shootType,
          shoot_date_time: `${formData.startDate} to ${formData.endDate}`,
          edits_needed: formData.editsNeeded
        };

        if (formData.editsNeeded) {
          formFields.photo_edit_types = formData.photoEditTypes.join(", ");
          formFields.video_edit_types = formData.videoEditTypes.join(", ");
        }

        // add GA event on click of "Continue" in the first step
        pushToDataLayer("service_details_submitted_step1", {
          type: "Action Tracking",
          page_name: "Book-a-shoot Page",
          location_in_website: "book_a_shoot_step1",
          duration_on_page: performance.now() / 1000,
          phone: user?.phone_number,
          user_id: user?.id,
          user_type: userTypeName,
          booking_id: result?.data?.booking_id,
          booking_form_fields: formFields,
          email: formData.email,
        });

        setLeadTracked(true);
      } catch (error) {
        console.error("Failed to save Step 1:", error);
        toast.error("Progress not saved, but you can continue.");
      }
    }
    if (internalStep === 3) {
      // add GA event on initial load

      const formFields = {
        content_type: formData.contentType.join(","),
        shoot_type: formData.shootType,
        shoot_date_time: `${formData.startDate} to ${formData.endDate}`,
        edits_needed: formData.editsNeeded,
        photo_edit_types: formData.photoEditTypes.join(", "),
        video_edit_types: formData.videoEditTypes.join(", "),
        additional_creative: formData.addTeamMembers,
        shoot_location: formData.location,
        additional_details: formData.specialInstructions,
        supporting_url: formData.referenceLinks,
        videographyCount: formData?.videographyCount,
        photographyCount: formData?.photographyCount,
      };

      pushToDataLayer("crew_size_matching", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step3",
        duration_on_page: performance.now() / 1000,
        user_id: isAuthenticated ? user?.id : "Unknown",
        user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : formData.email,
        email: isAuthenticated ? user?.email : "Unknown",
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        booking_id: formData?.bookingId,
        booking_form_fields: formFields
      });

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
      if ((!shouldShowStudiosStep && next === 6) || (shouldShowStudiosStep && next === 7)) {
        setActiveStep(3);
      }
    }
  };

  const prevStep = () => {
    if (internalStep === 1) {
      if (isFormDirty()) {
        setShowLeaveModal(true);
        return;
      }
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
    if (internalStep === 6 && !shouldShowStudiosStep) {
      setInternalStep(5);
      setActiveStep(2);
      return;
    }
    // From studios step, go back to Dream Team
    if (internalStep === 6 && shouldShowStudiosStep) {
      setInternalStep(5);
      setActiveStep(2);
      return;
    }
    // From Book & Confirm (with studios), go back to studios
    if (internalStep === 7 && shouldShowStudiosStep) {
      setInternalStep(6);
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
      // 1. Calculate Shoot Duration in Hours
      const calculateDayHours = (startTime?: string, endTime?: string) => {
        if (!startTime || !endTime) return 0;
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const diff = endMinutes - startMinutes;
        if (diff <= 0) return 0;
        return Math.round((diff / 60) * 100) / 100;
      };

      const calculateDurationHours = () => {
        if (formData.bookingType === "multi_day" && formData.bookingDays && formData.bookingDays.length > 0) {
          const total = formData.bookingDays.reduce((sum, d) => sum + calculateDayHours(d.startTime, d.endTime), 0);
          return Math.max(1, Math.round(total));
        }

        if (!formData.startDate || !formData.endDate) return 3; // Default fallback
        const start = parseDate(formData.startDate);
        const end = parseDate(formData.endDate);
        if (!start || !end) return 3;
        const diffMs = end.getTime() - start.getTime();
        // Round to nearest hour, minimum 1
        return Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      };

      const isEditingOnly =
        formData.contentType.length === 1 &&
        formData.contentType.includes("editing");
      const shootHours = isEditingOnly ? 0 : calculateDurationHours();
      const selectedStudios = normalizeSelectedStudios(formData);
      const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
      const isCoachellaEvent = formData.shootType === "coachella";
      const useContentHouseInclusivePricing =
        isCoachellaEvent && selectedStudios.length > 0;
      const pricingShootHours = useContentHouseInclusivePricing ? 0 : shootHours;

      // 2. Map Database Item IDs based on your SQL structure
      const ITEM_IDS = {
        videographer: 11,
        photographer: 10,
        cinematographer: 12,
        additionalCamera: 50, // Flat rate additional camera
        productionAssistant: 45, // Crew PA
        soundEngineer: 46, // Crew Sound
        director: 47, // Crew Director
        gaffer: 48, // Crew Gaffer
      };

      let quoteItems: Array<{ item_id: number; quantity: number }> = [];

      // 3. Add Base Crew (Calculated in Step 2 from roleCounts)
      if (!useContentHouseInclusivePricing && formData.roleCounts) {
        Object.entries(formData.roleCounts).forEach(([role, count]) => {
          // Map "videographer" string to ID 11, etc.
          const itemId = ITEM_IDS[role as keyof typeof ITEM_IDS];
          const quantity = Number(count);

          if (itemId && quantity > 0) {
            quoteItems.push({
              item_id: itemId,
              quantity: quantity,
            });
          }
        });
      }

      // 4. INJECT MANDATORY ADD-ONS BASED ON SHOOT TYPE

      // Rule: Podcast & Shows -> Additional 2 Cameras
      if (!useContentHouseInclusivePricing && formData.shootType === "podcast") {
        quoteItems.push({
          item_id: ITEM_IDS.additionalCamera,
          quantity: 2,
        });
      }

      // Rule: Short Films & Narratives -> Mandatory Crew Stack
      // Includes PA, Sound Engineer, Director, and Gaffer
      if (
        !useContentHouseInclusivePricing &&
        (formData.shootType === "short_film" || formData.shootType === "movie")
      ) {
        quoteItems.push({ item_id: ITEM_IDS.productionAssistant, quantity: 1 });
        quoteItems.push({ item_id: ITEM_IDS.soundEngineer, quantity: 1 });
        quoteItems.push({ item_id: ITEM_IDS.director, quantity: 1 });
        quoteItems.push({ item_id: ITEM_IDS.gaffer, quantity: 1 });
      }

      // 5. SAVE QUOTE (API Call)
      // We pass shoot_start_date so the backend can calculate the Rush Fee automatically
      let savedQuoteId: number | null = null;

      const firstBookingDate = formData.bookingType === "multi_day" && formData.bookingDays && formData.bookingDays.length > 0
        ? formData.bookingDays
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        : null;

      if (quoteItems.length > 0 || isEditingOnly || useContentHouseInclusivePricing) {
        try {
          const toIsoIfValid = (value?: string | null) => {
            if (!value) return value;
            const d = parseDate(value);
            return d && !isNaN(d.getTime()) ? d.toISOString() : value;
          };

          const quotePayload: any = {
            items: quoteItems,
            shootHours: pricingShootHours,
            eventType: formData.shootType || "general",
            guestEmail: formData.email,
            video_edit_types: formData.editsNeeded
              ? buildEditTypeCounts(formData.videoEditTypes)
              : [],
            photo_edit_types: formData.editsNeeded
              ? buildEditTypeCounts(formData.photoEditTypes)
              : [],
          };

          if (!isEditingOnly) {
            if (!useContentHouseInclusivePricing) {
              quotePayload.shoot_start_date = firstBookingDate
                ? `${firstBookingDate}T00:00:00.000Z`
                : toIsoIfValid(formData.startDate);
            }
            quotePayload.notes = formData.specialInstructions || undefined;
            quotePayload.studio_total = selectedStudiosTotal || 0;
          }

          const savedQuote = await saveQuote(quotePayload).unwrap();
          savedQuoteId = savedQuote.quote_id;
          console.log("Pricing Quote Generated:", savedQuoteId);
        } catch (quoteError) {
          console.error("Pricing Calculation Error:", quoteError);
          toast.error("Error calculating final price, but proceeding with booking...");
        }
      }

      // 6. PREPARE FINAL BOOKING PAYLOAD
      const browserTimeZone = getBrowserTimeZone();
      const bookingDaysPayload = formData.bookingDays?.map((d) => ({
        date: d.date,
        start_time: d.startTime,
        end_time: d.endTime,
        duration_hours: calculateDayHours(d.startTime, d.endTime),
        time_zone: browserTimeZone
      })) || [];

      const startDate = getLocalDatePart(formData.startDate);
      const startTime = getLocalTimePart(formData.startDate);
      const endTime = getLocalTimePart(formData.endDate);
      const estimatedDeliveryDate = getLocalDatePart(formData.expectedDeliveryDate);

      const finalBookingData: any = {
        order_name: `${formData.shootType.toUpperCase()} Shoot - ${formData.fullName}`,
        guest_email: formData.email,
        content_type: isEditingOnly ? "ai editing" : formData.contentType.join(","),
        shoot_type: formData.shootType,
        booking_type: formData.bookingType,
        booking_days: bookingDaysPayload,
        start_date: startDate,
        start_time: startTime,
        end_time: endTime,
        time_zone: browserTimeZone,
        estimated_delivery_date: isEditingOnly ? estimatedDeliveryDate : undefined,
        // start_date_time: formData.startDate,
        // end_time: formData.endDate,
        duration_hours: shootHours,
        location: formData.location,
        quote_id: savedQuoteId, // Attach the calculated price

        // User Profile Details
        full_name: formData.fullName,
        phone: formData.phone,

        // Editing Preferences
        edits_needed: formData.editsNeeded,
        video_edit_types: formData.videoEditTypes,
        photo_edit_types: formData.photoEditTypes,

        // Team Logic
        crew_size: String(formData.crewCount || 1),
        matching_method: formData.matchingMethod || "ai_matchmaker",
        selected_crew_ids: formData.selectedCrewIds || [],

        // Project Scope
        special_instructions: formData.specialInstructions || undefined,
        reference_links: formData.referenceLinks,
        is_draft: false, // Marking as final booking
      };

      // 7. SUBMIT TO BACKEND
      let submissionResult;

      if (draftBookingId) {
        // If we have a Lead/Draft ID from Step 1, update it
        submissionResult = await updateGuestBooking({
          id: draftBookingId,
          data: finalBookingData,
        }).unwrap();
      } else {
        // Fallback: Create fresh booking
        submissionResult = await createGuestBooking(finalBookingData).unwrap();
      }

      // add GA event on payment submit in step4
      pushToDataLayer("booking_payment_confirm_submit", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_review_confirm",
        user_id: isAuthenticated ? user?.id : "Unknown",
        user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
        email: isAuthenticated ? user?.email : formData.email,
        phone: isAuthenticated ? user?.phone_number : formData.phone,
        duration_on_page: performance.now() / 1000,
        booking_id: formData?.bookingId,
        booking_form_fields: {
          full_name: formData.fullName,
          phone: formData.phone,
        }
      });

      toast.success("Booking Secured!", {
        description: "Redirecting to secure payment gateway...",
      });

      // 8. REDIRECT TO PAYMENT
      const paymentUrl = `/search-results/payment?shootId=${submissionResult.booking_id}`;
      router.push(paymentUrl);

    } catch (error: any) {
      console.error("Final Booking Submission Failed:", error);
      toast.error("Submission Failed", {
        description: error?.data?.message || "Could not complete booking. Please check your connection.",
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
        if (shouldShowStudiosStep) {
          return <V3Step5Studios {...props} />;
        }
        return (
          <V3Step4BookConfirm
            {...props}
            onConfirm={handleBookingSubmission}
            isSubmitting={isSubmitting}
          />
        );
      case 7:
        return shouldShowStudiosStep ? (
          <V3Step4BookConfirm
            {...props}
            onConfirm={handleBookingSubmission}
            isSubmitting={isSubmitting}
          />
        ) : null;
      default:
        return null;
    }
  };

  const isFormDirty = useCallback(() => {
    return formData.fullName !== initialDataV3.fullName ||
      formData.email !== initialDataV3.email ||
      internalStep > 1;
  }, [formData, internalStep]);

  useEffect(() => {
    // Push a dummy state so the first "Back" click is captured by popstate
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      if (!allowNavigation.current && isFormDirty()) {
        // Re-push the dummy state so the URL doesn't actually change
        window.history.pushState(null, "", window.location.href);
        setShowLeaveModal(true);
      } else if (allowNavigation.current) {
        // If we've confirmed, let the navigation happen
        // No need to call router.back() here, the browser is already doing it
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isFormDirty]);

  const handleConfirmLeave = () => {
    allowNavigation.current = true;
    setShowLeaveModal(false);

    window.location.href = "/"; // Or use router.back()
  };

  return (
    <div className="bg-[#101010] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />

      {/* LeaveConfirmation Modal */}
      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveModal(false)}
      />

      <main className="relative pt-24 lg:pt-44 pb-8 lg:pb-16 min-h-screen flex flex-col items-center">
        {/* Back Button (hide on loading) */}
        {(internalStep !== 4 && internalStep !== 1) && (
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

const LeaveConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-semibold text-white mb-4">Abandon Booking?</h3>
        <p className="text-white/60 mb-8 leading-relaxed">
          You've filled in details on this page. Moving back will lose all details. Do you wish to continue?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-medium"
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-medium"
          >
            Leave Page
          </button>
        </div>
      </div>
    </div>
  );
};
