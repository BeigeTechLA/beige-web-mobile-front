"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { pushToDataLayer } from "@/lib/gtm";

export interface ServiceOption {
  id: string;
  title: string;
  description: string;
  iconSrc?: string;
}

const SERVICES: ServiceOption[] = [
  {
    id: "photography",
    title: "Photography",
    description: "Headshots, events, portraits, products",
    iconSrc: "/images/misc/BookingFlow/Camera.png",
  },
  {
    id: "videography",
    title: "Videography",
    description: "Events, commercials, brand videos",
    iconSrc: "/images/misc/BookingFlow/VideoRecorder.png",
  },
  {
    id: "editing",
    title: "Editing",
    description: "Post-production on footage you already have",
    iconSrc: "/images/misc/BookingFlow/Edit.png",
  },
  {
    id: "studios",
    title: "Studios",
    description: "Studios made for photos, videos, & events",
    iconSrc: "/images/misc/BookingFlow/Studio.png",
  },
  {
    id: "livestream",
    title: "Livestream",
    description: "Live broadcasts, webinars, hybrid events",
    iconSrc: "/images/misc/BookingFlow/Livestream.png",
  },
];

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager",
};

const SERVICE_TO_CONTENT_TYPE: Record<string, string> = {
  photography: "photographer",
  videography: "videographer",
  editing: "editing",
  studios: "studio",
  livestream: "livestream",
};

interface AskingServicesProps {
  onContinue: (selectedServiceIds: string[]) => void;
  onBack?: () => void;
  initialSelected?: string[];
  email?: string;
  bookingId?: number;
}

export const AskingServices: React.FC<AskingServicesProps> = ({
  onContinue,
  onBack,
  initialSelected = ["photography"],
  email = "",
  bookingId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [trackEarlyInterest, { isLoading }] = useTrackEarlyInterestMutation();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [errors, setErrors] = useState<string[]>([]);
  const hasTrackedPageViewRef = useRef(false);

  const toggleService = (id: string) => {
    if (id === "livestream") return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setErrors((prev) => prev.filter((error) => error !== "contentError"));
  };

  const contentTypeValue = useMemo(
    () => selectedIds.map((id) => SERVICE_TO_CONTENT_TYPE[id] || id).join(","),
    [selectedIds]
  );

  useEffect(() => {
    if (hasTrackedPageViewRef.current) return;
    hasTrackedPageViewRef.current = true;

    pushToDataLayer("booking_page_viewed_step1", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_step1",
      user_id: isAuthenticated ? user?.id : "Guest",
      user_type:
        isAuthenticated && user?.user_type_id !== undefined
          ? USER_TYPE[user.user_type_id]
          : "Guest",
      email: isAuthenticated ? user?.email : email,
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      duration_on_page: performance.now() / 1000,
    });
  }, [email, isAuthenticated, user?.email, user?.id, user?.phone_number, user?.user_type_id]);

  const handleNext = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one content type");
      setErrors((prev) => [...prev, "contentError"]);
      return;
    }

    const resolvedEmail = email.trim() || user?.email?.trim() || "";
    if (!resolvedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (!bookingId) {
      toast.error("Booking session not found. Please restart the booking flow.");
      return;
    }

    try {
      const response = await trackEarlyInterest({
        booking_id: bookingId,
        guest_email: resolvedEmail,
        user_id: user?.id,
        client_name: user?.name,
        content_type: contentTypeValue,
      }).unwrap();

      pushToDataLayer("generate_lead", {
        value: 0,
        currency: "USD",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step1",
        duration_on_page: performance.now() / 1000,
        user_id: user?.id || "Guest",
        user_type:
          isAuthenticated && user?.user_type_id !== undefined
            ? USER_TYPE[user.user_type_id]
            : "Guest",
        booking_id: response?.data?.booking_id,
        email: resolvedEmail,
      });

      pushToDataLayer("service_details_submitted_step1", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step1",
        duration_on_page: performance.now() / 1000,
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        user_id: user?.id || "Guest",
        user_type:
          isAuthenticated && user?.user_type_id !== undefined
            ? USER_TYPE[user.user_type_id]
            : "Guest",
        booking_id: response?.data?.booking_id,
        email: resolvedEmail,
        form_content_type: contentTypeValue,
      });

      onContinue(selectedIds);
    } catch (error) {
      console.error("Failed to track service selection:", error);
      toast.error("Failed to start booking. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP 01
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-1/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] text-white mb-3 tracking-tight">
          What do you need?
        </h1>
        <p className="text-white/30 text-base md:text-xl font-light mb-8">
          Pick everything that applies - we can combine them into one production.
        </p>

        {errors.includes("contentError") && (
          <p className="mb-4 text-sm text-red-400">
            Please select at least one content type to continue.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {SERVICES.map((service) => {
            const isSelected = selectedIds.includes(service.id);
            const isDisabled = service.id === "livestream";

            return (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`relative rounded-lg lg:rounded-2xl p-4 lg:p-7 transition-all duration-300 cursor-pointer flex justify-between items-center border overflow-hidden min-h-[140px] ${
                  isDisabled
                    ? "bg-[#0f0f0f] text-white border-white/5 opacity-45 cursor-not-allowed"
                    : isSelected
                    ? "bg-[#E8D1AB] text-[#121212] border-[#E8D1AB] shadow-lg scale-[1.01]"
                    : "bg-[#141414] text-white border-white/10 hover:border-white/20 hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex flex-col justify-between h-full z-10 max-w-[65%]">
                  <div>
                    <h3
                      className={`text-lg lg:text-[26px] font-bold mb-2 lg:mb-4 font-['Cormorant_Garamond'] ${
                        isDisabled ? "text-white" : isSelected ? "text-black" : "text-white"
                      }`}
                    >
                      {service.title}
                    </h3>
                    <p
                      className={`text-sm lg:text-base font-light leading-relaxed ${
                        isDisabled ? "text-white/50" : isSelected ? "text-black/70" : "text-white/70"
                      }`}
                    >
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isDisabled
                          ? "border border-white/20 bg-transparent text-white/40"
                          : isSelected
                          ? "bg-black text-white"
                          : "border border-white/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {service.iconSrc && (
                  <div className="absolute right-0 w-28 h-28 md:w-32 md:h-32 shrink-0 pointer-events-none -mr-2">
                    <Image
                      src={service.iconSrc}
                      alt={service.title}
                      fill
                      className="object-contain object-right-center"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        <div />

        <button
          onClick={handleNext}
          disabled={selectedIds.length === 0 || isLoading}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          {isLoading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default AskingServices;
