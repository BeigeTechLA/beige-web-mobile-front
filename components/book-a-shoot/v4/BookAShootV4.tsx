"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import {
  useCreateGuestBookingMutation,
  useUpdateGuestBookingMutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import { useSaveQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { useAuth } from "@/lib/hooks/useAuth";

import { BookingDataV4, initialDataV4 } from "./types";
import { V4Step0Email } from "./V4Step0Email";
import { V4Step1WhatDoYouNeed } from "./V4Step1WhatDoYouNeed";
import { V4Step1Occasion } from "./V4Step1Occasion";
import { V4Step2Edits } from "./V4Step2Edits";
import { V4Step3WhenWhere } from "./V4Step3WhenWhere";
import { V4Step4StudioRecommendation } from "./V4Step4StudioRecommendation";
import { V4Step4BrowseStudioTypes } from "./V4Step4BrowseStudioTypes";
import {
  V3Step3CrewMatching,
  V3LoadingFindingCreative,
  V3SelectDreamTeam,
  V3Step5Studios,
  V3Step4BookConfirm,
} from "../v3/index";
import { pushToDataLayer } from "@/lib/gtm";
import { parseDate } from "@/src/components/landing/lib/utils";
import { getSelectedStudiosTotal, normalizeSelectedStudios, serializeStudioMeta } from "../v3/studioData";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager",
};

export const BookAShootV4 = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [internalStep, setInternalStep] = useState(0); 
  const [formData, setFormData] = useState<BookingDataV4>(initialDataV4);
  const [leadTracked, setLeadTracked] = useState(false);
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [userTypeName, setUserTypeName] = useState("Unknown");
  const [showStudioSelection, setShowStudioSelection] = useState(false);

  const [createGuestBooking, { isLoading: isBookingLoading }] =
    useCreateGuestBookingMutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] =
    useUpdateGuestBookingMutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteMutation();
  const [trackEarlyInterest, { isLoading: isLeadLoading }] = useTrackEarlyInterestMutation();

  const isSubmitting = isBookingLoading || isQuoteLoading || isUpdatingBooking;

  const studioCatalogStep = showStudioSelection ? 7 : null;
  const crewMatchingStep = showStudioSelection ? 8 : 7;
  const loadingStep = showStudioSelection ? 9 : 8;
  const dreamTeamStep = showStudioSelection ? 10 : 9;
  const confirmStep = showStudioSelection ? 11 : 10;

  const updateData = useCallback((newData: Partial<BookingDataV4>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Autofill user email if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email && !formData.email) {
      updateData({
        email: user.email,
        fullName: user.name || formData.fullName,
      });
      setUserTypeName(USER_TYPE[user?.user_type_id] || "Client");
    }
  }, [isAuthenticated, user, formData.email, updateData, formData.fullName]);

  const handleStep0Next = async () => {
    if (formData.email && !leadTracked) {
      try {
        const result = await trackEarlyInterest({
          guest_email: formData.email,
          user_id: user?.id,
          client_name: user?.name || formData.fullName,
        }).unwrap();

        if (result?.data?.booking_id) {
          setDraftBookingId(result.data.booking_id);
          setLeadId(result.data.lead_id);
          updateData({ bookingId: result.data.booking_id });
          setLeadTracked(true);
        }
      } catch (error) {
        console.error("Early interest tracking error:", error);
      }
    }
    setInternalStep(1);
  };

  const nextStep = async () => {
    if (internalStep === crewMatchingStep) {
      pushToDataLayer("crew_size_matching", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page V4",
        location_in_website: `book_a_shoot_v4_step${crewMatchingStep}`,
        duration_on_page: performance.now() / 1000,
        user_id: isAuthenticated ? user?.id : "Guest",
        user_type: isAuthenticated && user?.user_type_id !== undefined
          ? USER_TYPE[user.user_type_id]
          : "Guest",
        email: isAuthenticated ? user?.email : formData.email || "Unknown",
        phone: isAuthenticated ? user?.phone_number : formData.phone || "Unknown",
        booking_id: formData?.bookingId,
      });

      // Crew Matching -> Loading -> Dream Team Selection
      setInternalStep(loadingStep);
      setTimeout(() => {
        setInternalStep(dreamTeamStep);
      }, 2500);
    } else {
      setInternalStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (internalStep === 0) {
      router.back();
      return;
    }

    if (internalStep === dreamTeamStep) {
      setInternalStep(crewMatchingStep);
      return;
    }

    if (internalStep === confirmStep) {
      setInternalStep(dreamTeamStep);
      return;
    }

    setInternalStep((prev) => Math.max(0, prev - 1));
  };

  const handleBrowseStudios = () => {
    setShowStudioSelection(true);
    updateData({ shootType: "studio" });
    setInternalStep(6); // Go to Browse Studio Types (Image 2)
  };

  const handleChangeStudioType = () => {
    setInternalStep(6); // Go to Browse Studio Types (Image 2)
  };

  const handleBookingSubmission = async () => {
    try {
      const calculateDayHours = (startTime?: string, endTime?: string) => {
        if (!startTime || !endTime) return 0;
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const diff = endMinutes - startMinutes;
        return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
      };

      const calculateDurationHours = () => {
        if (!formData.startDate || !formData.endDate) return 8;
        const start = parseDate(formData.startDate);
        const end = parseDate(formData.endDate);
        if (!start || !end) return 8;
        const diffMs = end.getTime() - start.getTime();
        return Math.max(1, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
      };

      const selectedStudios = normalizeSelectedStudios(formData as any);
      const primaryStudio = selectedStudios[0];
      const shootHours = primaryStudio
        ? calculateDayHours(primaryStudio.startTime, primaryStudio.endTime)
        : calculateDurationHours();

      const ITEM_IDS = {
        videographer: 11,
        photographer: 10,
      };

      const items = [
        {
          item_id: ITEM_IDS.photographer,
          quantity: 1,
          hours: shootHours,
        },
      ];

      const quotePayload = {
        name: `${formData.shootType || "Event"} Shoot`,
        shoot_type: formData.shootType || "corporate",
        items,
      };

      const quoteRes = await saveQuote(quotePayload).unwrap();
      const quoteId = quoteRes.data.quote_id;

      const studioMeta = serializeStudioMeta(selectedStudios);
      const finalNotes = [formData.specialInstructions, studioMeta]
        .filter(Boolean)
        .join("\n\n");

      const guestPayload = {
        quote_id: quoteId,
        guest_email: formData.email,
        guest_name: formData.fullName || "Guest Client",
        guest_phone: formData.phone || "0000000000",
        notes: finalNotes,
      };

      if (draftBookingId) {
        await updateGuestBooking({
          bookingId: draftBookingId,
          data: guestPayload,
        }).unwrap();
      } else {
        await createGuestBooking(guestPayload).unwrap();
      }

      toast.success("Booking confirmed successfully!");
      router.push("/dashboard/bookings");
    } catch (error: any) {
      console.error("Booking submission error:", error);
      toast.error(error?.data?.message || "Failed to confirm booking.");
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
      case 0:
        return (
          <V4Step0Email
            data={formData}
            updateData={updateData}
            onNext={handleStep0Next}
            isLoading={isLeadLoading}
          />
        );
      case 1:
        return <V4Step1WhatDoYouNeed {...props} />;
      case 2:
        return <V4Step1Occasion {...props} />;
      case 3:
        return <V4Step2Edits {...props} />;
      case 4:
        return (
          <V4Step3WhenWhere
            {...props}
            onBrowseStudios={handleBrowseStudios}
          />
        );
      case 5:
        return (
          <V4Step4StudioRecommendation
            {...props}
            onChangeStudioType={handleChangeStudioType}
          />
        );
      case 6:
        return (
          <V4Step4BrowseStudioTypes
            {...props}
          />
        );
      case 7:
        return showStudioSelection ? (
          <V3Step5Studios {...(props as any)} />
        ) : (
          <V3Step3CrewMatching {...(props as any)} />
        );
      case 8:
        return showStudioSelection ? (
          <V3Step3CrewMatching {...(props as any)} />
        ) : (
          <V3LoadingFindingCreative />
        );
      case 9:
        return showStudioSelection ? (
          <V3LoadingFindingCreative />
        ) : (
          <V3SelectDreamTeam
            {...(props as any)}
            bookingId={draftBookingId || undefined}
          />
        );
      case 10:
        return showStudioSelection ? (
          <V3SelectDreamTeam
            {...(props as any)}
            bookingId={draftBookingId || undefined}
          />
        ) : (
          <V3Step4BookConfirm
            {...(props as any)}
            onConfirm={handleBookingSubmission}
            isSubmitting={isSubmitting}
          />
        );
      case 11:
        return showStudioSelection ? (
          <V3Step4BookConfirm
            {...(props as any)}
            onConfirm={handleBookingSubmission}
            isSubmitting={isSubmitting}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0e0e0e] min-h-screen text-white selection:bg-[#E5D5B8] selection:text-black">
      <Navbar />

      <main className="relative pt-24 lg:pt-36 pb-12 lg:pb-20 min-h-screen flex flex-col items-center">
        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl min-h-[400px]">
            {renderStep()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
