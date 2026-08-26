"use client";

import React, { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ShootSummaryData {
  project: {
    service: string;
    occasion: string;
    description: string;
  };
  schedule: {
    date: string;
    startAndEndTime: string;
    location: string;
  };
  editingServices: {
    photoEditsLabel: string;
    totalPhotos: string;
  };
  addOns: string[];
  includedServices: string[];
}

const isValidPhoneNumber = (value: string) => {
  const digitCount = value.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= 15;
};

interface ShootSummaryStepProps {
  onBack?: () => void;
  onContinue?: (contactData: { fullName: string; phoneNumber: string }) => void;
  onEditStep?: (stepName: string) => void;
  summaryData?: ShootSummaryData;
}

const DEFAULT_SUMMARY_DATA: ShootSummaryData = {
  project: {
    service: "Photography",
    occasion: "Corporate Event",
    description: "No description added",
  },
  schedule: {
    date: "Single Day - 15/08/2026",
    startAndEndTime: "10:00 AM - 15:00 PM (5 Hour Duration)",
    location: "Woodland Hills, Woodland Hills, CA",
  },
  editingServices: {
    photoEditsLabel: "Edited Photos 100 Included + 25 Added",
    totalPhotos: "You'll Receive 125 Photos",
  },
  addOns: ["Additional Camera x1"],
  includedServices: [
    "All Raw Images, Lighting & Insurance Provided",
    "Up to 45 Minutes Setup Time",
    "Digital Delivery",
  ],
};

export default function ShootSummaryStep({
  onBack,
  onContinue,
  onEditStep,
  summaryData = DEFAULT_SUMMARY_DATA,
}: ShootSummaryStepProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      toast.error("Please fill in your contact information");
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (onContinue) {
      onContinue({ fullName, phoneNumber });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Step Header */}
      <div className="mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP 09
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div className="h-full bg-[#E8D1AB] w-[95%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] text-white mb-3 tracking-tight">
          Your Shoot, All Set.
        </h1>
        <p className="text-white/30 text-base md:text-xl font-light">
          Review your shoot details below. You can make changes before confirming your booking.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Project Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white">
              Project
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("project")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium"
            >
              EDIT
            </button>
          </div>
          <hr className={`border-t border-white/20 my-4 lg:my-7`} />
          <div className="space-y-3 text-sm lg:text-base">
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Service</span>
              <span className="text-[#D9D1C2]">{summaryData.project.service}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Occasion</span>
              <span className="text-[#D9D1C2]">{summaryData.project.occasion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Description</span>
              <span className="text-[#D9D1C2]">{summaryData.project.description}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Location Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white">
              Schedule & Location
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("schedule")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium"
            >
              EDIT
            </button>
          </div>
          <hr className={`border-t border-white/20 my-4 lg:my-7`} />
          <div className="space-y-3 text-sm lg:text-base">
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Date</span>
              <span className="text-[#D9D1C2]">{summaryData.schedule.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Start & End Time</span>
              <span className="text-[#D9D1C2]">{summaryData.schedule.startAndEndTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#A2A2A2]">Location</span>
              <span className="text-[#D9D1C2]">{summaryData.schedule.location}</span>
            </div>
          </div>
        </div>

        {/* Editing Services Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white">
              Editing Services
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("editing")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium"
            >
              EDIT
            </button>
          </div>
          <hr className={`border-t border-white/20 my-4 lg:my-7`} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-sm lg:text-base text-[#A2A2A2]">Photo Edits:</span>
              <span className="px-3.5 py-2.5 rounded-md bg-[#E8D5B5]/20 text-sm lg:text-base text-[#E8D5B5]">
                {summaryData.editingServices.photoEditsLabel}
              </span>
            </div>
            <div className="px-4 lg:px-7 py-2 lg:py-4 rounded-full bg-white text-[#101010] font-medium text-sm lg:text-lg italic">
              {summaryData.editingServices.totalPhotos}
            </div>
          </div>
        </div>

        {/* Add-ons & Included Services Row */}
        <div className="flex gap-4">
          {/* Add-ons Subcard */}
          <div className="w-full lg:w-1/3 rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white">
                  Add-ons
                </h2>
                <button
                  type="button"
                  onClick={() => onEditStep?.("addons")}
                  className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium"
                >
                  EDIT
                </button>
              </div>
              <hr className={`border-t border-white/20 my-4 lg:my-7`} />
              <div className="flex flex-wrap gap-2 pt-1">
                {summaryData.addOns.map((addon, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2.5 rounded-md bg-[#E8D5B5]/20 text-sm lg:text-base text-[#E8D5B5]"
                  >
                    {addon}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Included Services Subcard */}
          <div className="w-full lg:w-2/3 rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
            <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white">
              Included Services
            </h2>
            <hr className={`border-t border-white/20 my-4 lg:my-7`} />
            <div className="flex flex-wrap gap-3 lg:gap-5">
              {summaryData.includedServices.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full border border-[#E8D1AB]/40 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#E8D1AB]" />
                  </div>
                  <span className="text-sm lg:text-base text-white/70 font-light">
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className={`border-t border-white/20 my-5 lg:my-10`} />

      {/* Contact Information Form */}
      <div className="mb-8">
        <h2 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-white mb-5 lg:mb-10">
          Contact Information
        </h2>
        <form id="contact-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name Input */}
          <div className="relative space-y-2">
            <Label
              htmlFor="fullName"
              className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
            >
              Full Name*
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                type={"text"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
              />
            </div>
          </div>
          <div className="relative space-y-2">
            <Label
              htmlFor="phone"
              className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
            >
              Phone Number*
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type={"tel"}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                className="h-14 lg:h-[82px] w-full rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="submit"
          form="contact-form"
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
