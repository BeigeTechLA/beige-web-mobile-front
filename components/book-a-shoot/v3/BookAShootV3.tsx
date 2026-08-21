"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
import { useTrackEarlyInterestMutation, useUpdateBookingCrewMutation } from "@/lib/redux/features/sales/salesApi";
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
import { V3BrowseStudios } from "./V3BrowseStudios";
import { V3StudioChooseCreators } from "./V3StudiosChooseCreators";
// import { getSelectedStudiosTotal, normalizeSelectedStudios } from "./studioData";
import { HOURLY_STUDIO_LIST, buildHourlyStudioSelection, getSelectedStudiosTotal, normalizeSelectedStudios, serializeStudioMeta } from "./studioData";
import { V3AltChooseService } from "./V3AltChooseService";
import {
  buildStudioFinalizePayload,
  buildStudioLeadPayload,
  buildStudioQuotePayload,
  resolveBookingSchedule,
} from "./studioPayload";

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

// Helper to get dynamic steps for the progress tracker
const getDynamicSteps = (contentType: string[], isBrowsing: boolean) => {
  if (contentType.length === 1 && contentType.includes("studio")) {
    const steps = [
      { label: "Choose Service" },
      { label: "Customized Details" }, // Used for 1.5 and the new Creator step
      { label: "Book & Confirm" },
    ];

    // If browsing, we add another "Customized Details" to the tracker 
    // or keep it at 3 steps but handle the internal logic
    if (isBrowsing) {
      return [
        { label: "Choose Service" },
        { label: "Customized Details" },
        { label: "Customized Details" },
        { label: "Book & Confirm" },
      ];
    }
    return steps;
  }
  return V3_STEPS;
};

export const BookAShootV3 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const isStudioFlow = formData.contentType.length === 1 && formData.contentType.includes("studio"); //For studio: journey 2 where only studio is selected
  const isStudioContentFlow =
    formData.contentType.length > 1 &&
    formData.contentType.includes("studio") &&
    (formData.contentType.includes("videographer") || formData.contentType.includes("photographer")); //For studio: journey 3 where studio + video/photography is selected

  const [createGuestBooking, { isLoading: isBookingLoading }] =
    useCreateGuestBookingMutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] =
    useUpdateGuestBookingMutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteMutation();
  const [trackEarlyInterest] = useTrackEarlyInterestMutation();
  const [updateBookingCrew] = useUpdateBookingCrewMutation();
  const [studioPrefillApplied, setStudioPrefillApplied] = useState(false);

  const isSubmitting = isBookingLoading || isQuoteLoading || isUpdatingBooking;
  const shouldShowStudiosStep = formData.shootType === "studio";
  const studioStep = shouldShowStudiosStep ? 2 : null;
  const moreDetailsStep = shouldShowStudiosStep ? 3 : 2;
  const crewMatchingStep = shouldShowStudiosStep ? 4 : 3;
  const loadingStep = shouldShowStudiosStep ? 5 : 4;
  const dreamTeamStep = shouldShowStudiosStep ? 6 : 5;
  const confirmStep = shouldShowStudiosStep ? 7 : 6;

  // const updateData = (newData: Partial<BookingDataV3>) => {
  //   setFormData((prev) => ({ ...prev, ...newData }));
  // };

  const updateData = useCallback((newData: Partial<BookingDataV3>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const toUtcIsoIfValid = (value?: string | null) => {
    if (!value) return value;
    const date = parseDate(value);
    return date && !isNaN(date.getTime()) ? date.toISOString() : value;
  };

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

          // generate_lead GA4 event can be called here but the parent function (trackLoggedInUser) is currently not being called. Hence not adding

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
    if (studioPrefillApplied) return;

    const studioId = searchParams.get("studioId");
    const pricingKey = searchParams.get("pricingKey") || "";

    if (!studioId) return;

    const matchedStudio = HOURLY_STUDIO_LIST.find((studio) => studio.id === studioId);
    if (!matchedStudio) return;

    const selectedPricing =
      matchedStudio.pricingOptions?.find((option) => option.key === pricingKey) ||
      matchedStudio.pricingOptions?.[0];

    const normalizedSelection = selectedPricing
      ? buildHourlyStudioSelection(matchedStudio, {
          selectedDate: formData.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          startTime: getLocalTimePart(formData.startDate) || "10:30",
          endTime: getLocalTimePart(formData.endDate) || "14:30",
          pricingKey: selectedPricing.key,
        })
      : null;

    setFormData((prev) => ({
      ...prev,
      contentType: prev.contentType.includes("studio")
        ? prev.contentType
        : [...prev.contentType, "studio"],
      shootType: prev.shootType || "podcast",
      selectedStudioIds: [matchedStudio.id],
      selectedStudioImage: matchedStudio.image,
      selectedStudioName: matchedStudio.name,
      selectedStudios: normalizedSelection ? [normalizedSelection] : prev.selectedStudios,
      isBrowsingStudios: true,
    }));

    setStudioPrefillApplied(true);
  }, [formData.endDate, formData.startDate, searchParams, studioPrefillApplied]);

  // forceBrowseOptions to be used when alt steps related to studios are added 
  const nextStep = async (forceBrowseOptions?: boolean) => {
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

        const earlyInterestPayload: Record<string, unknown> = {
          booking_id: draftBookingId,
          guest_email: formData.email,
          user_id: user?.id,
          shoot_type: formData.shootType,
          client_name: user?.name || formData.fullName,
          phone: formData.phone,
          studio_booking_for: formData.bookingFor || "production",
          project_name: formData.projectName || "",
          special_instructions: formData.specialInstructions || "",
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
          earlyInterestPayload.startDate = toUtcIsoIfValid(formData.startDate);
          earlyInterestPayload.endDate = toUtcIsoIfValid(formData.endDate);
          earlyInterestPayload.booking_type = formData.bookingType;
          earlyInterestPayload.booking_days = (formData.bookingDays || []).map((d) => ({
            ...d,
            time_zone: d.time_zone || d.timeZone || browserTimeZone
          }));
          if (formData.selectedStudios?.length) {
            Object.assign(earlyInterestPayload, buildStudioLeadPayload(formData));
          }
        }

        if (!draftBookingId) {
          earlyInterestPayload.booking_id = null;
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

        let combinedEditTypes = "none";
        if (formData.editsNeeded) {
          formFields.photo_edit_types = formData.photoEditTypes.join(", ");
          formFields.video_edit_types = formData.videoEditTypes.join(", ");

          const edits = [
            ...(formData.photoEditTypes || []),
            ...(formData.videoEditTypes || [])
          ].filter(Boolean); // Remove any empty/falsy values

          combinedEditTypes = edits.length > 0 ? edits.join(", ") : "none";
        }

        // add GA event on click of "Continue" in the first step
        pushToDataLayer("generate_lead", {
          value: 0, // Standard parameters
          currency: "USD",
          page_name: "Book-a-shoot Page",  // Custom data schema
          location_in_website: "book_a_shoot_step1",
          duration_on_page: performance.now() / 1000,
          user_id: user?.id || "Guest",
          user_type: userTypeName || "Guest",
          booking_id: result?.data?.booking_id,
          email: formData.email,
        });

        pushToDataLayer("service_details_submitted_step1", {
          type: "Action Tracking",
          page_name: "Book-a-shoot Page",
          location_in_website: "book_a_shoot_step1",
          duration_on_page: performance.now() / 1000,
          phone: user?.phone_number,
          user_id: user?.id || "Guest",
          user_type: userTypeName || "Guest",
          booking_id: result?.data?.booking_id,
          email: formData.email,

          // Flat fields passed individually for seamless GA4 tracking:
          form_content_type: formFields.content_type,
          form_shoot_type: formFields.shoot_type,
          form_shoot_date_time: formFields.shoot_date_time,
          form_edits_needed: formFields.edits_needed ? "true" : "false", // Convert boolean to a clear string
          form_edit_types: combinedEditTypes,
          form_booking_type: formData.bookingType,
        });

        console.log("Generate_lead pushed to DL");

        setLeadTracked(true);
        if (isStudioFlow) {
          setInternalStep(1.5); // Move to Browse Studios (Customized Details label)
          setActiveStep(2);
          return;
        }

        if (isStudioContentFlow) {
          setInternalStep(2.1); // Move to Videography/Photography services page
          setActiveStep(2);
          return;
        }

        setInternalStep(2);
        setActiveStep(2);
      } catch (error) {
        console.error("Failed to save Step 1:", error);
        toast.error("Progress not saved, but you can continue.");
      }
    }

    // --- Journey 2 specific: Next from 1.5 (Browse Studios) goes straight to Book & Confirm ---
    if (internalStep === 1.5 && isStudioFlow) {
      const shouldBrowse = forceBrowseOptions ?? formData.isBrowsingCreators;

      if (shouldBrowse) {
        setInternalStep(1.7);
        setActiveStep(3);
      } else {
        setInternalStep(6);
        setActiveStep(3);
      }
      return;
    }
    if (internalStep === 1.7) {
      setInternalStep(6);
      setActiveStep(4); // Adjust based on dynamic steps length
      return;
    }

    // --- Journey 3 specific: Next from 2.1 (Select services) goes to More details(step2) ---
    if (internalStep === 2.1) {
      setInternalStep(2);
      setActiveStep(2); // Adjust based on dynamic steps length
      return;
    }

    if (internalStep === 2) {
      const shouldBrowse = forceBrowseOptions ?? formData.isBrowsingStudios;
      // If user opted to browse studios after entering details
      if (shouldBrowse) {
        setInternalStep(2.5); // New "Browse Studios" step for Journey 3
        setActiveStep(2);
        return;
      }
      setInternalStep(3);
      setActiveStep(2);
      return;
    }

    // --- Step 2.5 Logic (The New Step) ---
    if (internalStep === 2.5) {
      setInternalStep(3);
      setActiveStep(2);
      return;
    }

    if (internalStep === crewMatchingStep) {
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
        location_in_website: `book_a_shoot_step${crewMatchingStep}`,
        duration_on_page: performance.now() / 1000,
        user_id: isAuthenticated ? user?.id : "Guest",
        user_type: isAuthenticated && user?.user_type_id !== undefined
          ? USER_TYPE[user.user_type_id]
          : "Guest",
        email: isAuthenticated ? user?.email : "Unknown",
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        booking_id: formData?.bookingId,
        // booking_form_fields: formFields
      });

      // Step 3 -> Loading -> Crew Selection
      setInternalStep(loadingStep); // Loading
      setTimeout(() => {
        setInternalStep(dreamTeamStep); // Crew Select
        setActiveStep(2);
      }, 2500);
    } else {
      const next = internalStep + 1;
      setInternalStep(next);

      if (next === studioStep) setActiveStep(1);
      if (next === moreDetailsStep || next === crewMatchingStep || next === loadingStep || next === dreamTeamStep) {
        setActiveStep(2);
      }
      if (next === confirmStep) {
        setActiveStep(3);
      }
    }
  };

  const prevStep = () => {
    // Back from Step 3: check if we should go to 2.5 or 2
    if (internalStep === 3) {
      if (formData.isBrowsingStudios) {
        setInternalStep(2.5);
        return;
      }
      setInternalStep(2);
      return;
    }

    // Back from New Step 2.5 goes to More Details
    if (internalStep === 2.5) {
      setInternalStep(2);
      return;
    }

    // Back from New Step 2.1 to the first step
    if (internalStep === 2.1 && isStudioContentFlow) {
      setInternalStep(1); // Move to Videography/Photography services page
      setActiveStep(1);
      return;
    }

    // StudioJourney 2 accomodation
    if (internalStep === 2 && isStudioFlow) {
      setInternalStep(1.5);
      return;
    }
    // Back from Book & Confirm in Studio Flow goes back to Browse Studios
    if (internalStep === 6 && isStudioFlow) {
      if (formData.isBrowsingCreators) {
        setInternalStep(1.7);
        setActiveStep(3);
      } else {
        setInternalStep(1.5);
        setActiveStep(2);
      }
      return;
    }

    if (internalStep === 1.7) {
      setInternalStep(1.5);
      setActiveStep(1);
      return;
    }

    // Back from Browse Studios goes to Choose Service
    if (internalStep === 1.5) {
      setInternalStep(1);
      setActiveStep(1);
      return;
    }

    if (internalStep === 1) {
      if (isFormDirty()) {
        setShowLeaveModal(true);
        return;
      }
      router.back();
      return;
    }

    // From Dream Team selection, go back to Crew Matching
    if (internalStep === dreamTeamStep) {
      setInternalStep(crewMatchingStep);
      setActiveStep(2);
      return;
    }

    // From Book & Confirm, go back to Dream Team selection
    if (internalStep === confirmStep) {
      setInternalStep(dreamTeamStep);
      setActiveStep(2);
      return;
    }

    const prev = internalStep - 1;
    setInternalStep(prev);

    if (prev === 1) setActiveStep(1);
    if (prev === studioStep) setActiveStep(1);
    if (prev === moreDetailsStep || prev === crewMatchingStep) setActiveStep(2);
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
          return Math.max(1, Math.round(total * 100) / 100);
        }

        if (!formData.startDate || !formData.endDate) return 3; // Default fallback
        const start = parseDate(formData.startDate);
        const end = parseDate(formData.endDate);
        if (!start || !end) return 3;
        const diffMs = end.getTime() - start.getTime();
        // Preserve quarter/half hours so saved pricing matches confirmation.
        return Math.max(1, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
      };

      const isEditingOnly =
        formData.contentType.length === 1 &&
        formData.contentType.includes("editing");
      const selectedStudios = normalizeSelectedStudios(formData);
      const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
      const primaryStudio = selectedStudios[0];
      const shootHours = isEditingOnly
        ? 0
        : primaryStudio
          ? calculateDayHours(primaryStudio.startTime, primaryStudio.endTime)
          : calculateDurationHours();
      const isStudioBooking = formData.shootType === "studio";
      const hasSelectedCreatorPricing =
        !isEditingOnly &&
        (
          (formData.selectedCrewIds?.length || 0) > 0 ||
          Number(formData.roleCounts?.videographer || 0) > 0 ||
          Number(formData.roleCounts?.photographer || 0) > 0 ||
          Number(formData.roleCounts?.cinematographer || 0) > 0
        );
      const useContentHouseInclusivePricing =
        isStudioBooking && selectedStudios.length > 0 && !hasSelectedCreatorPricing;
      const pricingShootHours = useContentHouseInclusivePricing ? 0 : shootHours;
      const studioMeta = serializeStudioMeta(selectedStudios);
      const finalSpecialInstructions = [formData.specialInstructions, studioMeta]
        .filter((entry) => String(entry || "").trim())
        .join("\n\n");
      let savedQuoteId: number | null = null;
      let savedQuoteTotal: number | null = null;

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

      const quoteItems: Array<{ item_id: number; quantity: number }> = [];

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

      // 6. PREPARE FINAL BOOKING PAYLOAD
      const browserTimeZone = getBrowserTimeZone();
      const resolvedSchedule = resolveBookingSchedule(formData, primaryStudio);
      const startDate = resolvedSchedule.selectedDate;
      const startTime = resolvedSchedule.startTime;
      const endTime = resolvedSchedule.endTime;
      const estimatedDeliveryDate = getLocalDatePart(formData.expectedDeliveryDate);
      const primaryStudioSchedule =
        formData.bookingType === "multi_day"
          ? formData.bookingDays?.find((day) => day.date && day.startTime && day.endTime)
          : null;
      const resolvedStudioDate = primaryStudioSchedule?.date || startDate;
      const resolvedStudioStartTime = primaryStudioSchedule?.startTime || startTime;
      const resolvedStudioEndTime = primaryStudioSchedule?.endTime || endTime;
      const resolvedStudioDuration = calculateDayHours(resolvedStudioStartTime, resolvedStudioEndTime) || primaryStudio?.quantity || shootHours;

      const finalBookingData: Record<string, unknown> = {
        order_name: `${formData.shootType.toUpperCase()} Shoot - ${formData.fullName}`,
        guest_email: formData.email,
        content_type: isEditingOnly ? "ai editing" : formData.contentType.join(","),
        shoot_type: formData.shootType,
        studio_booking_for: formData.bookingFor || "production",
        project_name: formData.projectName || "",
        booking_type: formData.bookingType,
        booking_days: (formData.bookingDays?.length
          ? formData.bookingDays
          : (resolvedStudioDate ? [{
            date: resolvedStudioDate,
            startTime: resolvedStudioStartTime,
            endTime: resolvedStudioEndTime,
            durationHours: resolvedStudioDuration,
            timeZone: browserTimeZone,
          }] : [])
        ).map((d) => ({
          date: d.date,
          start_time: d.startTime,
          end_time: d.endTime,
          duration_hours: d.durationHours || calculateDayHours(d.startTime, d.endTime),
          time_zone: d.timeZone || browserTimeZone,
        })),
        start_date: resolvedStudioDate || startDate,
        start_time: resolvedStudioStartTime || startTime,
        end_time: resolvedStudioEndTime || endTime,
        time_zone: browserTimeZone,
        estimated_delivery_date: isEditingOnly ? estimatedDeliveryDate : undefined,
        duration_hours: resolvedStudioDuration,
        location: primaryStudio?.location || formData.location,
        location_latitude:
          primaryStudio?.lat ??
          formData.locationDetails?.coordinates?.lat ??
          formData.locationDetails?.lat ??
          formData.locationDetails?.center?.[1] ??
          undefined,
        location_longitude:
          primaryStudio?.lng ??
          formData.locationDetails?.coordinates?.lng ??
          formData.locationDetails?.lng ??
          formData.locationDetails?.center?.[0] ??
          undefined,
        quote_id: savedQuoteId ?? undefined, // Attach the calculated price when available
        ...buildStudioFinalizePayload({
          ...formData,
          selectedStudios,
        }),

        // User Profile Details
        full_name: formData.fullName,
        phone: formData.phone,

        // Editing Preferences
        edits_needed: formData.editsNeeded,
        video_edit_types: formData.videoEditTypes,
        photo_edit_types: formData.photoEditTypes,
        crew_roles: formData.roleCounts || {},

        // Team Logic
        // Project Scope
        special_instructions: formData.description?.trim() || finalSpecialInstructions || undefined,
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

      const finalBookingId = submissionResult?.booking_id || draftBookingId;

      const firstBookingDate = formData.bookingType === "multi_day" && formData.bookingDays && formData.bookingDays.length > 0
        ? formData.bookingDays
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        : null;

      if (finalBookingId) {
        try {
          const toIsoIfValid = (value?: string | null) => {
            if (!value) return value;
            const d = parseDate(value);
            return d && !isNaN(d.getTime()) ? d.toISOString() : value;
          };

          const quotePayload: Record<string, unknown> = {
            items: quoteItems,
            creator_ids: formData.selectedCrewIds || [],
            booking_id: finalBookingId,
            bookingId: finalBookingId,
            role_counts:
              isEditingOnly
                ? { editor: 1 }
                : useContentHouseInclusivePricing && !hasSelectedCreatorPricing
                  ? {}
                  : (formData.roleCounts || {}),
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
            Object.assign(quotePayload, buildStudioQuotePayload({
              ...formData,
              selectedStudios,
            }));
          }

          const savedQuote = await saveQuote(quotePayload).unwrap();
          savedQuoteId = savedQuote.quote_id;
          savedQuoteTotal = savedQuote.total;

          if (savedQuoteId && finalBookingId) {
            await updateGuestBooking({
              id: finalBookingId,
              data: {
                quote_id: savedQuoteId,
              } as Partial<BookingDataV3>,
            }).unwrap();
          }

          console.log("Pricing Quote Generated:", savedQuoteId);
        } catch (quoteError) {
          console.error("Pricing Calculation Error:", quoteError);
          toast.error("Error calculating final price, but proceeding with booking...");
        }
      }

      // add GA event on payment submit in step4
      // pushToDataLayer("booking_payment_confirm_submit", {
      //   type: "Action Tracking",
      //   page_name: "Book-a-shoot Page",
      //   location_in_website: "book_a_shoot_review_confirm",
      //   user_id: isAuthenticated ? user?.id : "Unknown",
      //   user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : "Guest",,
      //   email: isAuthenticated ? user?.email : formData.email,
      //   phone: isAuthenticated ? user?.phone_number : formData.phone,
      //   duration_on_page: performance.now() / 1000,
      //   booking_id: formData?.bookingId,
      //   booking_form_fields: {
      //     full_name: formData.fullName,
      //     phone: formData.phone,
      //   }
      // });

      // --- NATIVE GA4 BEGIN_CHECKOUT FOR DIRECT BOOKING FLOW ---
      pushToDataLayer("begin_checkout", {
        currency: "USD",
        value: savedQuoteTotal || 0,

        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_review_confirm_btn",

        email: isAuthenticated ? user?.email : formData.email,
        user_id: isAuthenticated ? user?.id : "Guest",
        user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : "Guest",
        full_name: formData.fullName,
        phone: isAuthenticated ? user?.phone_number : "Unknown",

        booking_id: submissionResult?.booking_id || draftBookingId,
        items: [{
          item_name: finalBookingData?.order_name || "Shoot Booking",
          price: savedQuoteTotal || 0,
          quantity: 1
        }]
      });
      // ---------------------------------------------------------

      toast.success("Booking Secured!", {
        description: "Redirecting to secure payment gateway...",
      });

      // 8. REDIRECT TO PAYMENT
      const paymentUrl = `/search-results/payment?shootId=${submissionResult.booking_id}`;
      router.push(paymentUrl);

    } catch (error: unknown) {
      console.error("Final Booking Submission Failed:", error);
      const message =
        typeof error === "object" && error && "data" in error
          ? String((error as { data?: { message?: string } }).data?.message || "")
          : "";
      toast.error("Submission Failed", {
        description: message || "Could not complete booking. Please check your connection.",
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
      onNext: (forceBrowse?: boolean) => nextStep(forceBrowse),
      onBack: prevStep,
    };

    switch (internalStep) {
      case 1:
        return <V3Step1ChooseService {...props} />;
      case 1.5: // New Studio Browse Step
        return <V3BrowseStudios {...props} />;
      case 1.7:
        return <V3StudioChooseCreators {...props} />; // Studios journey 2
      case 2:
        return <V3Step2MoreDetails {...props} />;
      case 2.1:
        return <V3AltChooseService {...props} />; //  Studios journey 3
      case 2.5: // New Step for non-studio primary flows
        return <V3BrowseStudios {...props} />;
      case 3:
        return shouldShowStudiosStep ? <V3Step2MoreDetails {...props} /> : <V3Step3CrewMatching {...props} />;
      case 4:
        return shouldShowStudiosStep ? <V3Step3CrewMatching {...props} /> : <V3LoadingFindingCreative />;
      case 5:
        return shouldShowStudiosStep ? <V3LoadingFindingCreative /> : (
          <V3SelectDreamTeam
            {...props}
            bookingId={draftBookingId || undefined}
          />
        );
      case 6:
        return shouldShowStudiosStep ? (
          <V3SelectDreamTeam
            {...props}
            bookingId={draftBookingId || undefined}
          />
        ) : (
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
          {/* {internalStep !== 4 && (
            <StepProgressTracker steps={V3_STEPS} currentStep={activeStep} />
          )} */}
          {internalStep !== 4 && (
            <StepProgressTracker
              steps={getDynamicSteps(formData.contentType)}
              currentStep={activeStep}
            />
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
          You&apos;ve filled in details on this page. Moving back will lose all details. Do you wish to continue?
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
      {/* </div> */}
    </div>
  );
};
