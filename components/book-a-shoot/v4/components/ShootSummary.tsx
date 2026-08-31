"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Calendar, Check, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Swiper imports & styles
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

export interface StudioSummaryData {
  studioId: string;
  name: string;
  location: string;
  totalPrice: number;
  pricingMode: "hourly" | "daily";
  quantity: number;
  pricingLabel?: string;
  cleaningFee?: number;
  selectedDate?: string;
  startTime?: string;
  endTime?: string;
  nights?: number;
  bookingDays?: Array<{ date: string }>;
}

export interface CreativePartnerData {
  id: string | number;
  name: string;
  role: string;
  image: string;
}

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
    videoEditsLabel?: string;
    totalPhotos: string;
  };
  studio?: StudioSummaryData;
  creatives?: CreativePartnerData[];
  addOns: string[];
  includedServices: string[];
}

const DEFAULT_CREATIVES_DATA: CreativePartnerData[] = [
  {
    id: 1,
    name: "Alex Rivera",
    role: "Videographer Specialist",
    image: "/images/crew/CREW(5).png",
  },
  {
    id: 2,
    name: "Ethan Cole",
    role: "Photographer Specialist",
    image: "/images/crew/CREW(9).png",
  },
  {
    id: 3,
    name: "Sophia Martinez",
    role: "Lead Director & Cinematographer",
    image: "/images/crew/CREW(2).png",
  },
  {
    id: 4,
    name: "Liam Chen",
    role: "Lighting & Drone Specialist",
    image: "/images/crew/CREW(6).png",
  },
  {
    id: 5,
    name: "Maya Patel",
    role: "Senior Portrait Photographer",
    image: "/images/crew/CREW(7).png",
  },
];

const DEFAULT_STUDIO_DATA: StudioSummaryData = {
  studioId: "studio-101",
  name: "Hollywood Hills Daylight Studio",
  location: "Hollywood Hills, Los Angeles, CA",
  totalPrice: 450,
  pricingMode: "hourly",
  quantity: 5,
  pricingLabel: "Standard Rate",
  cleaningFee: 50,
  selectedDate: "2026-08-15",
  startTime: "10:00 AM",
  endTime: "03:00 PM",
};

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
    videoEditsLabel: "",
    totalPhotos: "You'll Receive 125 Photos",
  },
  studio: DEFAULT_STUDIO_DATA,
  creatives: DEFAULT_CREATIVES_DATA,
  addOns: ["Additional Camera x1"],
  includedServices: [
    "All Raw Images, Lighting & Insurance Provided",
    "Up to 45 Minutes Setup Time",
    "Digital Delivery",
  ],
};

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDisplayTime = (timeStr?: string) => timeStr || "";

interface ShootSummaryStepProps {
  onBack?: () => void;
  onContinue?: (contactData: { fullName: string; phoneNumber: string }) => void;
  onEditStep?: (stepName: string) => void;
  summaryData?: ShootSummaryData;
  initialContact?: { fullName: string; phoneNumber: string } | null;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export default function ShootSummaryStep({
  onBack,
  onContinue,
  onEditStep,
  summaryData = DEFAULT_SUMMARY_DATA,
  title = "Your Shoot, All Set.",
  subtitle = "Review your shoot details below. You can make changes before confirming your booking.",
  stepNumber = "09",
  completionPercentage = 95,
  initialContact,
}: ShootSummaryStepProps) {
  const [fullName, setFullName] = useState(initialContact?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialContact?.phoneNumber || "");
  const [errors, setErrors] = useState<string[]>([])

  const creativesList = summaryData.creatives || DEFAULT_CREATIVES_DATA;
  const initialSlideIndex = Math.floor(creativesList.length / 2);
  const [activeCreativeIndex, setActiveCreativeIndex] = useState(initialSlideIndex);

  const studio = summaryData.studio || DEFAULT_STUDIO_DATA;
  const activeCreative = creativesList[activeCreativeIndex] || creativesList[0];
  const firstDay = studio.bookingDays?.[0];
  const lastDay = studio.bookingDays?.[studio.bookingDays.length - 1];

  const sanitizePhoneInput = (value: string) => value.replace(/[^\d+()\-\s]/g, "");
  const getPhoneDigits = (value: string) => value.replace(/\D/g, "");

  const isValidPhoneNumber = (value: string) => {
    const digitCount = getPhoneDigits(value).length;
    return digitCount >= 7 && digitCount <= 15;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div
            className="h-full bg-[#E8D1AB] rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-base md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Studio Data Card : Conditionally present Journey 2 */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Studios
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("studio")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium cursor-pointer"
            >
              EDIT
            </button>
          </div>
          <hr className="border-t border-white/20 my-4 lg:my-7" />

          <div>
            <div className="flex flex-col md:flex-row gap-4 md:items-start">
              <div className="relative w-full lg:w-[275px] h-[120px] lg:h-[190px] rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">
                <Image
                  src="https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png"
                  alt={studio.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <div className="text-sm lg:text-base text-white font-medium truncate">{studio.name}</div>
                    <div className="text-xs lg:text-sm text-[#8C8C8C] flex items-center gap-1">
                      <MapPin size={16} />
                      <span className="truncate">{studio.location}</span>
                    </div>
                  </div>
                  <div className="bg-[#E8D5B5]/20 text-[#E8D1AB] rounded-lg px-4 py-1.5 text-xs lg:text-sm font-medium">
                    Duration : 8 Hours
                  </div>
                </div>
                <hr className="border-t border-white/20 my-3 lg:my-6" />

                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                    Natural light
                  </span>
                  <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                    Product-friendly
                  </span>
                  <span className="px-2.5 py-1 text-xs rounded-sm bg-[#E8D1AB]/10 border border-[#E8D1AB]/10 text-[#E8D1AB]">
                    {studio.pricingMode === "hourly"
                      ? `${studio.quantity} billable hour${studio.quantity > 1 ? "s" : ""}`
                      : `Duration: ${studio.nights || studio.quantity} Night${(studio.nights || studio.quantity) > 1 ? "s" : ""}`}
                  </span>
                  {studio.pricingLabel && (
                    <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                      {studio.pricingLabel}
                    </span>
                  )}
                  {studio.cleaningFee ? (
                    <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                      ${studio.cleaningFee.toLocaleString()} cleaning
                    </span>
                  ) : null}
                </div>
                <hr className="border-t border-white/20 my-3 lg:my-6" />

                <div className="flex gap-10">
                  <div className="text-xs lg:text-sm text-white/70 flex items-center gap-2">
                    <Clock size={16} />
                    <span>Mon, 12 Jan, 2026</span>
                  </div>
                  <div className="text-xs lg:text-sm text-white/70 flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Mon, 12 Jan, 2026</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Project Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Project
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("project")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium cursor-pointer"
            >
              EDIT
            </button>
          </div>
          <hr className="border-t border-white/20 my-4 lg:my-7" />
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
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Schedule & Location
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("schedule")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium cursor-pointer"
            >
              EDIT
            </button>
          </div>
          <hr className="border-t border-white/20 my-4 lg:my-7" />
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
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Editing Services
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("editing")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium cursor-pointer"
            >
              EDIT
            </button>
          </div>
          <hr className={`border-t border-white/20 my-4 lg:my-7`} />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-sm lg:text-base text-[#A2A2A2]">Photo Edits:</span>
                <span className="px-3.5 py-2.5 rounded-md bg-[#E8D5B5]/20 text-sm lg:text-base text-[#E8D5B5]">
                  {summaryData.editingServices.photoEditsLabel}
                </span>
              </div>
              {summaryData.editingServices.videoEditsLabel && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-sm lg:text-base text-[#A2A2A2]">Video Edits:</span>
                  <span className="px-3.5 py-2.5 rounded-md bg-[#E8D5B5]/20 text-sm lg:text-base text-[#E8D5B5]">
                    {summaryData.editingServices.videoEditsLabel}
                  </span>
                </div>
              )}
            </div>
            <div className="px-4 lg:px-7 py-2 lg:py-4 rounded-full bg-white text-[#101010] font-medium text-sm lg:text-lg italic">
              {summaryData.editingServices.totalPhotos}
            </div>
          </div>
        </div>

        {/* Studio Data Card : Conditionally present Journey 1 */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Studios
            </h2>
            <button
              type="button"
              onClick={() => onEditStep?.("studio")}
              className="text-sm lg:text-base tracking-wider uppercase text-[#E8D1AB] hover:text-[#E8D1AB]/80 font-medium cursor-pointer"
            >
              EDIT
            </button>
          </div>
          <hr className="border-t border-white/20 my-4 lg:my-7" />

          <div>
            <div className="flex flex-col md:flex-row gap-4 md:items-start">
              <div className="relative w-full lg:w-[275px] h-[120px] lg:h-[190px] rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">
                <Image
                  src="https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png"
                  alt={studio.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <div className="text-sm lg:text-base text-white font-medium truncate">{studio.name}</div>
                    <div className="text-xs lg:text-sm text-[#8C8C8C] flex items-center gap-1">
                      <MapPin size={16} />
                      <span className="truncate">{studio.location}</span>
                    </div>
                  </div>
                  <div className="bg-[#E8D5B5]/20 text-[#E8D1AB] rounded-lg px-4 py-1.5 text-xs lg:text-sm font-medium">
                    Duration : 8 Hours
                  </div>
                </div>
                <hr className="border-t border-white/20 my-3 lg:my-6" />

                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                    Natural light
                  </span>
                  <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                    Product-friendly
                  </span>
                  <span className="px-2.5 py-1 text-xs rounded-sm bg-[#E8D1AB]/10 border border-[#E8D1AB]/10 text-[#E8D1AB]">
                    {studio.pricingMode === "hourly"
                      ? `${studio.quantity} billable hour${studio.quantity > 1 ? "s" : ""}`
                      : `Duration: ${studio.nights || studio.quantity} Night${(studio.nights || studio.quantity) > 1 ? "s" : ""}`}
                  </span>
                  {studio.pricingLabel && (
                    <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                      {studio.pricingLabel}
                    </span>
                  )}
                  {studio.cleaningFee ? (
                    <span className="px-2.5 py-1 text-xs text-white/70 bg-[#1F1F1F] rounded-sm border border-white/10">
                      ${studio.cleaningFee.toLocaleString()} cleaning
                    </span>
                  ) : null}
                </div>
                <hr className="border-t border-white/20 my-3 lg:my-6" />

                <div className="flex gap-10">
                  <div className="text-xs lg:text-sm text-white/70 flex items-center gap-2">
                    <Clock size={16} />
                    <span>Mon, 12 Jan, 2026</span>
                  </div>
                  <div className="text-xs lg:text-sm text-white/70 flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Mon, 12 Jan, 2026</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Professional Creatives Swiper Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) py-4 lg:py-7 overflow-hidden">
          <div className="flex items-center justify-between px-4 lg:px-7">
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Professional Creatives
            </h2>
          </div>
          <hr className="border-t border-white/20 my-4 lg:my-7" />

          {/* Dynamic Swiper Section */}
          <div className="relative w-full">
            {creativesList.length > 0 ? (
              <Swiper
                key={creativesList.length}
                effect={"coverflow"}
                grabCursor={true}
                centeredSlides={true}
                spaceBetween={24}
                slidesPerView={3}
                initialSlide={initialSlideIndex}
                loop={creativesList.length >= 3}
                mousewheel={{ forceToAxis: true }}
                coverflowEffect={{
                  rotate: 15,
                  stretch: 0,
                  depth: 100,
                  modifier: 1,
                  slideShadows: false,
                }}
                modules={[EffectCoverflow, Mousewheel]}
                onSlideChange={(swiper) => setActiveCreativeIndex(swiper.realIndex)}
                className="w-full py-4"
              >
                {creativesList.map((creative, index) => (
                  <SwiperSlide key={creative.id || index} className="flex items-center justify-center">
                    <div className="relative !w-[184px] !h-[140px] md:!w-[280px] md:!h-[212px] lg:!h-[310px] lg:!w-[406px] rounded-2xl overflow-hidden transition-all duration-500 border border-white/20 shadow-2xl bg-black/40">
                      <Image
                        src={creative.image}
                        alt={creative.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/50">
                No creative partners assigned.
              </div>
            )}
          </div>

          {/* Active Creative Details Display */}
          {activeCreative && (
            <div className="w-full flex flex-col items-center justify-center gap-1 mt-3 text-center">
              <h3 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-[#E8D1AB]">
                {activeCreative.name}
              </h3>
              <p className="text-xs lg:text-sm text-[#A9A9A9]">
                {activeCreative.role}
              </p>
            </div>
          )}
        </div>

        {/* Add-ons & Included Services Row */}
        <div className="flex gap-4">
          {/* Add-ons Subcard */}
          <div className="w-full lg:w-1/3 rounded-2xl border border-white/20 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
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
              <hr className="border-t border-white/20 my-4 lg:my-7" />
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
            <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
              Included Services
            </h2>
            <hr className="border-t border-white/20 my-4 lg:my-7" />
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

      <hr className="border-t border-white/20 my-5 lg:my-10" />

      {/* Contact Information Form */}
      <div className="mb-8">
        <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white mb-5 lg:mb-10">
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
                type="text"
                value={fullName}
                required
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
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
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
