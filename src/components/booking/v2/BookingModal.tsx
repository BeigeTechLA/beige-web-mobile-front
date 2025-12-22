"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateGuestBookingMutation } from "@/lib/redux/features/booking/guestBookingApi";
import { Step1ProjectNeeds } from "./steps/Step1_ProjectNeeds";
import { Step2ShootType } from "./steps/Step2_ShootType";
import { Step3InfoBudget } from "./steps/Step3_InfoBudget";
import { Step4LocationDate } from "./steps/Step4_LocationDate";
import { Step5Review } from "./steps/Step5_Review";
import { Step6Loading } from "./steps/Step6_Loading";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type BookingData = {
  projectType: "shoot_edit" | "shoot_raw" | null;
  contentType: "videography" | "photography" | "both" | null;
  shootType: string;
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
};

const initialData: BookingData = {
  projectType: null,
  contentType: null,
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
};

export const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
  const router = useRouter();

  // UseEffect to prevent and renable scrolling depending on if modal is open or closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [createGuestBooking, { isLoading: isCreating }] = useCreateGuestBookingMutation();

  // Local state management - replacing Redux
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingData>(initialData);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "creating" | "created" | "error">("idle");
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  // Map 0-indexed currentStep to 1-indexed step for UI
  const step = currentStep + 1;

  // Update function - replaces Redux updateFormData
  const updateData = (updates: Partial<BookingData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  const handleFindCreative = async () => {
    console.log("Find Creative button clicked");
    console.log("Current formData:", formData);

    // Final sanity check (most validation done at step level)
    if (!formData.projectType) {
      toast.error("Incomplete Booking", {
        description: "Please go back and select a project type",
      });
      return;
    }

    if (!formData.shootName || formData.shootName.trim() === "") {
      toast.error("Incomplete Booking", {
        description: "Please go back and enter a shoot name",
      });
      return;
    }

    if (!formData.startDate) {
      toast.error("Incomplete Booking", {
        description: "Please go back and select a start date",
      });
      return;
    }

    if (!formData.location || formData.location.trim() === "") {
      toast.error("Incomplete Booking", {
        description: "Please go back and enter a location",
      });
      return;
    }

    if (!formData.guestEmail || formData.guestEmail.trim() === "") {
      toast.error("Email Required", {
        description: "Please provide your email address",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.guestEmail)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address",
      });
      return;
    }

    console.log("Validation passed, creating guest booking...");

    // Show loading step immediately
    setCurrentStep(5); // Step 6 in 1-indexed = 5 in 0-indexed
    setBookingStatus("creating");

    try {
      // Prepare order data for guest booking API
      const orderData: any = {
        order_name: formData.shootName || "Untitled Shoot",
        guest_email: formData.guestEmail,
        project_type: formData.projectType || undefined,
        content_type: formData.contentType || undefined,
        shoot_type: formData.shootType || undefined,
        edit_type: formData.editType || undefined,
        start_date_time: formData.startDate,
        duration_hours: 0, // Required field - will be calculated based on end_date in the future
        location: formData.location || undefined,
        budget_min: formData.budgetMin || undefined,
        budget_max: formData.budgetMax || undefined,
        crew_size: formData.crewSize || undefined,
      };

      // Add optional fields only if they have values
      if (formData.endDate) {
        orderData.end_time = formData.endDate;
      }
      if (formData.referenceLink) {
        orderData.description = `Reference: ${formData.referenceLink}`;
      }
      if (formData.specialNote) {
        orderData.description = orderData.description
          ? `${orderData.description}\n\nNotes: ${formData.specialNote}`
          : `Notes: ${formData.specialNote}`;
      }
      // Store studio info in description for now since API doesn't have dedicated fields
      if (formData.needStudio) {
        const studioInfo = `Studio: ${formData.studio || 'TBD'}, Duration: ${formData.studioTimeDuration}h`;
        orderData.description = orderData.description
          ? `${orderData.description}\n\n${studioInfo}`
          : studioInfo;
      }

      console.log("Creating guest booking with data:", orderData);

      // Call the guest booking API
      const result = await createGuestBooking(orderData).unwrap();
      const realBookingId = result.booking_id;

      console.log("Guest booking created successfully:", result);

      setCurrentBookingId(realBookingId.toString());
      setBookingStatus("created");

      // Wait for loading animation, then navigate
      setTimeout(() => {
        console.log(`Navigating to: /search-results?shootId=${realBookingId}`);

        // Close modal before navigation
        onClose();

        // Reset state for next time
        setCurrentStep(0);
        setFormData(initialData);
        setBookingStatus("idle");
        setCurrentBookingId(null);

        // Navigate to search results page
        router.push(`/search-results?shootId=${realBookingId}`);
      }, 2000); // 2-second loading animation
    } catch (error: any) {
      console.error("Error creating order:", error);
      setBookingStatus("error");

      toast.error("Booking Failed", {
        description: "Failed to create booking. Please try again.",
      });

      // Go back to review step on error
      setCurrentStep(4); // Step 5 in 1-indexed = 4 in 0-indexed
    }
  };

  // Reset modal state when closed
  const handleClose = () => {
    onClose();
    // Small delay to reset after animation
    setTimeout(() => {
      setCurrentStep(0);
      setFormData(initialData);
      setBookingStatus("idle");
      setCurrentBookingId(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center ${step === 6 ? "px-0" : "px-4"}`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-fit bg-[#FAFAFA] ${step === 6 ? "" : "rounded-xl lg:rounded-[24px]"} shadow-2xl min-h-[500px] max-h-9/10 flex flex-col overflow-y-scroll`}
          >
            {/* Header (Close Button) */}
            {/* {step !== 6 && (
              <div className="absolute top-5 right-5 md:top-[50px] md:right-[50px] z-10">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            )} */}

            {/* Step Content */}
            <div className="flex-1 p-0 flex flex-col min-h-0 max-h-[100dvh] overflow-y-auto">
              {step === 1 && (
                <Step1ProjectNeeds
                  data={formData}
                  updateData={updateData}
                  onNext={nextStep}
                  handleClose={handleClose}
                />
              )}
              {step === 2 && (
                <Step2ShootType
                  data={formData}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  handleClose={handleClose}
                />
              )}
              {step === 3 && (
                <Step3InfoBudget
                  data={formData}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  handleClose={handleClose}
                />
              )}
              {step === 4 && (
                <Step4LocationDate
                  data={formData}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  handleClose={handleClose}
                />
              )}
              {step === 5 && (
                <Step5Review
                  data={formData}
                  updateData={updateData}
                  onNext={handleFindCreative}
                  onBack={prevStep}
                  handleClose={handleClose}
                />
              )}
              {step === 6 && <Step6Loading />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
