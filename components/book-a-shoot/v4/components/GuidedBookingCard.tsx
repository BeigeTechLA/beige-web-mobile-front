"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { pushToDataLayer } from "@/lib/gtm";

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager",
};

interface GuidedBookingCardProps {
  onContinue?: (payload: { email: string; bookingId?: number }) => void;
  imageSrc?: string;
}

export const GuidedBookingCard: React.FC<GuidedBookingCardProps> = ({
  onContinue,
  imageSrc = "/images/misc/BookingFlow/GuidedBookingImg.png", // replace with your asset path
}) => {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [trackEarlyInterest, { isLoading }] = useTrackEarlyInterestMutation();
  const autoFilledEmailRef = useRef<string | null>(null);
  const hasTrackedPageViewRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      autoFilledEmailRef.current = null;
      return;
    }

    if (autoFilledEmailRef.current !== user.email && !email) {
      autoFilledEmailRef.current = user.email;
      setEmail(user.email);
    }
  }, [email, isAuthenticated, user?.email]);

  useEffect(() => {
    if (hasTrackedPageViewRef.current) return;
    hasTrackedPageViewRef.current = true;

    pushToDataLayer("booking_page_viewed_step1", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_step1",
      user_id: isAuthenticated ? user?.id : "Guest",
      user_type: isAuthenticated && user?.user_type_id !== undefined
        ? USER_TYPE[user.user_type_id]
        : "Guest",
      email: isAuthenticated ? user?.email : email,
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      duration_on_page: performance.now() / 1000,
    });
  }, [email, isAuthenticated, user?.email, user?.id, user?.phone_number, user?.user_type_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await trackEarlyInterest({
        guest_email: trimmedEmail,
        user_id: user?.id,
        client_name: user?.name,
      }).unwrap();

      onContinue?.({
        email: trimmedEmail,
        bookingId: response?.data?.booking_id,
      });
    } catch (error) {
      console.error("Failed to track lead for guided booking:", error);
      toast.error("Failed to start booking. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Outer Dark Container Card */}
      <div
        className="relative w-full rounded-[50px] p-8 md:p-14 lg:p-20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-[0.414px] border-white/20 bg-gradient-to-b from-[#161616] to-[#101010]/50"
      >
        {/* Left Column: Form Content */}
        <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-4">
          {/* Top Tagline */}
          <span className="text-xs lg:text-sm tracking-[0.2em] text-[#E8D1AB] uppercase mb-4">
            A Guided Booking
          </span>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] font-medium text-white leading-[1.08] mb-6">
            Let’s get your <br />
            project started.
          </h2>

          {/* Subtext */}
          <p className="text-base md:text-xl text-white/40 font-normal leading-relaxed mb-10 max-w-md">
            We’ll use your email to save your booking and keep you updated.
          </p>

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex flex-col gap-2 mb-8">
              <label
                htmlFor="email"
                className="text-xs lg:text-sm tracking-[0.2em] text-white uppercase mb-4"
              >
                Email ID
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Please enter your email"
                className="w-full bg-transparent border-b border-white/20 pb-3 text-lg md:text-2xl text-[#D8D7D6] font-['Cormorant_Garamond'] placeholder-white/50 outline-none focus:border-[#E8D1AB] transition-colors duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg bg-[#E8D1AB] text-[#0A0908] text-sm lg:text-base hover:bg-[#dfc498] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer mb-6"
            >
              {isLoading ? "Saving..." : "Continue"}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#8A857C]">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#8A857C] shrink-0 stroke-[1.5]" />
            <span>Your information stays private and secure.</span>
          </div>
        </div>

        {/* Right Column: Studio Production Image */}
        <div className="lg:col-span-5 h-[360px] md:h-[480px] lg:h-[520px] relative rounded-3xl overflow-hidden border border-white/10 shadow-inner">
          <Image
            src={imageSrc}
            alt="Studio Production Crew"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </div>

      </div>
    </div>
  );
};

export default GuidedBookingCard;
