"use client";

import React, { useState } from "react";
import { ArrowLeft, Trash2, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface StudioShootDetailsData {
  projectName: string;
  description: string;
  fullName: string;
  phoneNumber: string;
}

interface StudioShootDetailsStepProps {
  onContinue: (data: StudioShootDetailsData) => void;
  onBack?: () => void;
  initialProjectName?: string;
  initialDescription?: string;
  initialFullName?: string;
  initialPhoneNumber?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export const StudioShootDetails: React.FC<StudioShootDetailsStepProps> = ({
  onContinue,
  onBack,
  initialProjectName = "",
  initialDescription = "",
  initialFullName = "",
  initialPhoneNumber = "",
  title = "Tell us a little about your shoot.",
  subtitle = "Share anything about your shoot, vibe, or ideas. We'll take it from there.",
  stepNumber = "01",
  completionPercentage = 5,
}) => {
  const [projectName, setProjectName] = useState(initialProjectName);
  const [description, setDescription] = useState(initialDescription);
  const [fullName, setFullName] = useState(initialFullName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [errors, setErrors] = useState<string[]>([])

  const sanitizePhoneInput = (value: string) => value.replace(/[^\d+()\-\s]/g, "");
  const getPhoneDigits = (value: string) => value.replace(/\D/g, "");

  const isValidPhoneNumber = (value: string) => {
    const digitCount = getPhoneDigits(value).length;
    return digitCount >= 7 && digitCount <= 15;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName || !phoneNumber) {
      toast.error("Please fill in your contact information");
      setErrors((prev) => [...prev, "contactError"]);
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number");
      setErrors((prev) => [...prev, "contactError"]);
      return;
    }
    if (onContinue) {
      onContinue({
        projectName,
        description,
        fullName,
        phoneNumber,
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Navigation */}
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
             className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div
            className="h-full w-1/2 bg-[#E8D1AB] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      <div className="space-y-6 lg:space-y-10">
        <div className="relative space-y-2">
          <Label
            htmlFor="projectName"
            className="absolute -top-1.5 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-xs lg:text-base text-white/60 pointer-events-none"
          >
            Project Name
          </Label>
          <div className="relative">
            <Input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-14 lg:h-[82px] w-full rounded-lg lg:rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
            />
          </div>
        </div>

        <div className="relative space-y-2">
          <Label
            htmlFor="description"
            className="absolute -top-1.5 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-xs lg:text-base text-white/60 pointer-events-none"
          >
            Description
          </Label>
          <div className="relative">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-45 border-white/30 bg-[#101010] text-white rounded-lg lg:rounded-xl px-4 outline-none focus:border-white text-sm lg:text-base"
            />
          </div>
        </div>
      </div>

      <hr className="border-t border-white/20 my-5 lg:my-10" />

      {/* Contact Information Form */}
      <div className="lg:mb-8">
        <h2 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white mb-5 lg:mb-10">
          Contact Information
        </h2>
        <form id="contact-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-4">
          {/* Full Name Input */}
          <div className="relative space-y-2">
            <Label
              htmlFor="fullName"
              className="absolute -top-1.5 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-xs lg:text-base text-white/60 pointer-events-none"
            >
              Full Name*
            </Label>
            <div className="relative">
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-lg lg:rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
              />
            </div>
          </div>
          <div className="relative space-y-2">
            <Label
              htmlFor="phone"
              className="absolute -top-1.5 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-xs lg:text-base text-white/60 pointer-events-none"
            >
              Phone Number*
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                className="h-14 lg:h-[82px] w-full rounded-lg lg:rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 w-full lg:w-auto lg:min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          className="px-10 py-3.5 w-full lg:w-auto rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer lg:ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StudioShootDetails;