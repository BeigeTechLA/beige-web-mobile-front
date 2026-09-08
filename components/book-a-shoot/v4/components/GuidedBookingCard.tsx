"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

interface GuidedBookingCardProps {
  onContinue?: (email: string) => void;
  imageSrc?: string;
}

export const GuidedBookingCard: React.FC<GuidedBookingCardProps> = ({
  onContinue,
  imageSrc = "/images/misc/BookingFlow/GuidedBookingImg.png", // replace with your asset path
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue) {
      onContinue(email);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Outer Dark Container Card */}
      <div
        className="relative w-full rounded-3xl lg:rounded-[50px] p-5 md:p-14 lg:p-20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-[0.414px] border-white/20 bg-gradient-to-b from-[#161616] to-[#101010]/50"
      >
        {/* Left Column: Form Content */}
        <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-4">
          {/* Top Tagline */}
          <span className="text-xs lg:text-sm tracking-[0.2em] text-[#E8D1AB] uppercase mb-4">
            A Guided Booking
          </span>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white leading-[1.08] mb-4 lg:mb-6">
            Let’s get your <br />
            project started.
          </h2>

          {/* Subtext */}
          <p className="text-sm md:text-xl text-white/40 font-normal leading-relaxed mb-6 lg:mb-10 max-w-md">
            We’ll use your email to save your booking and keep you updated.
          </p>

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex flex-col gap-2 mb-5 lg:mb-8">
              <label
                htmlFor="email"
                className="text-xs lg:text-sm tracking-[0.2em] text-white uppercase mb-2 lg:mb-4"
              >
                Email ID
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Please enter your email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="book-a-shoot-email-input w-full bg-transparent border-0 border-b border-white/20 rounded-none pb-3 text-lg md:text-2xl text-[#D8D7D6] font-['Roboto_Condensed'] placeholder-white/50 outline-none ring-0 focus:border-[#E8D1AB] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#E8D1AB] text-[#0A0908] text-base font-medium hover:bg-[#dfc498] transition-all duration-200 cursor-pointer mb-4 lg:mb-6"
            >
              Continue
            </button>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-sm text-[#8A857C]">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#8A857C] shrink-0 stroke-[1.5]" />
            <span>Your information stays private and secure.</span>
          </div>
        </div>

        {/* Right Column: Studio Production Image */}
        <div className="lg:col-span-5 h-[280px] md:h-[480px] lg:h-[520px] relative rounded-3xl overflow-hidden border border-white/10 shadow-inner">
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
