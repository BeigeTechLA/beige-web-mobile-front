"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import Image from "next/image";
import {
  Leaf,
  Wifi,
  Disc,
  Wind,
  Refrigerator,
  Monitor,
  Bone,
  Flame,
  Video,
  Bike,
  Coffee,
  Utensils,
  Car,
  Shield,
  Music,
  Tv,
  ChevronRight,
  Calendar,
  DoorClosed,
  Sparkles,
  Home,
} from "lucide-react";

import { ReviewsComponent } from "./StudioReviews";
import StudioLocationMap from "./StudioLocationMap";

interface StudioInformationProps {
  information?: any;
  isDark?: boolean;
}

interface Amenity {
  icon: React.ElementType;
  label: string;
}

interface DaySchedule {
  open: string;
  close: string;
  isOpen: boolean;
  is24Hours?: boolean;
}



const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


const toArray = (value: unknown, fallback: any[] = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const format12Hour = (timeStr: string) => {
  if (!timeStr) return "";
  const [hours24, minutes] = timeStr.split(':').map(Number);
  
  if (isNaN(hours24)) return timeStr; 

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12; 
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${hours12}:${formattedMinutes} ${period}`;
};

const timeToMinutes = (timeStr?: string) => {
  if (!timeStr) return 0;
  const [hours = "0", minutes = "0"] = String(timeStr).split(":");
  const h = Number(hours);
  const m = Number(minutes);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const isTwentyFourHours = (open?: string, close?: string) =>
  timeToMinutes(open) === 0 && timeToMinutes(close) === 23 * 60 + 45;

export const StudioInformation = ({ information, isDark = false }: StudioInformationProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);

  const data = information || {};
  const address = data.address || {};
  const description = data.description  || "";
  const titleText = data.studio_name ;
  const hostText = data.brand_name ;
  const guestCount = data.space_basics?.guests ?? data.guests ?? 2;
  const bedroomCount = data.space_basics?.bedrooms ?? data.bedrooms ?? 1;
  const bedCount = data.space_basics?.beds ?? data.beds ?? 1;
  const bathCount = data.space_basics?.bathrooms ?? data.bathrooms ?? 1;
  const rawAmenities = Array.isArray(data.amenities) ? data.amenities : [];
  const sourceAmenities = rawAmenities.map((item: any) => {
    if (item && typeof item === "object" && "icon" in item && "label" in item) {
      return item;
    }

    return {
      icon: Home,
      label: typeof item === "string" ? item : String(item),
    };
  });
  const visibleAmenities = isAmenitiesExpanded ? sourceAmenities : sourceAmenities.slice(0, 10);
  const operatingHours = toArray(data.operating_hours, []);
  const schedule = operatingHours.length > 0
    ? days.reduce<Record<string, DaySchedule>>((acc, day, idx) => {
        const hour = operatingHours.find((entry: any) => entry?.day_of_week === idx);
        const dayIs24Hours = isTwentyFourHours(hour?.opens_at, hour?.closes_at);
        
        acc[day] = {
          open: dayIs24Hours ? "24 Hours" : (hour?.opens_at ? format12Hour(String(hour.opens_at)) : ""),
          close: dayIs24Hours ? "" : (hour?.closes_at ? format12Hour(String(hour.closes_at)) : ""),
          isOpen: hour?.is_open ?? false,
          is24Hours: dayIs24Hours,
        };
        return acc;
      }, {})
    : null;
    const isLongComment = (description?.length ?? 0) > 250;
    const mapLatitude = Number(address?.latitude ?? data.latitude ?? 0);
    const mapLongitude = Number(address?.longitude ?? data.longitude ?? 0);
    const [isAddressExpanded, setIsAddressExpanded] = useState(false);
    const fullAddress = address.full_address || `${address.city || ''} ${address.state || ''} ${address.country || ''}`.trim() || "Location details provided after booking";
    const isLongAddress = (fullAddress?.length ?? 0) > 150;

  return (
    <section className="relative overflow-hidden">
      {/* Basic Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1 lg:space-y-2">
          <p className="text-lg lg:text-2xl font-medium">
            {titleText} hosted by {hostText}
          </p>
          <div className="flex gap-3">
            {[
              `${guestCount} guests`,
              `${bedroomCount} bedroom`,
              `${bedCount} bed`,
              `${bathCount} bath`,
            ].filter(Boolean).map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <p className={`text-sm lg:text-base ${isDark ? "text-[#FFF]" : "text-zinc-400"}`}>
                  {item}
                </p>
                {idx !== 3 && (
                  <span className={`text-sm lg:text-base ${isDark ? "text-[#FFF]" : "text-zinc-400"}`}>
                    &#183;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {hostText && (

        <div className="relative inline-block">
          <Image
            src={"/images/crew/CREW(4).png"}
            alt={"Host Image"}
            width={56}
            height={56}
            className="rounded-full w-14 h-14 object-cover"
          />

          <div className="absolute bottom-1 -right-2 w-6 h-6 z-10 -translate-x-0.5 translate-y-0.5">
            <Image
              src={"/images/misc/AirbnbSuperhostBadge.svg"}
              alt={"Airbnb Superhost Badge"}
              width={16}
              height={28}
              className="object-contain"
            />
          </div>
        </div>
        )}
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Features */}
      <div className={`space-y-2 lg:space-y-4 ${isDark ? "text-white" : "text-zinc-900"}`}>
        <FeatureItem
          icon={Home}
          title="Entire home"
          description="You'll have the apartment to yourself"
          isDark={isDark}
        />
        <FeatureItem
          icon={Sparkles}
          title="Enhanced Clean"
          description="This Host committed to Airbnb's 5-step enhanced cleaning process."
          showMore={true}
          isDark={isDark}
        />
        <FeatureItem
          icon={DoorClosed}
          title="Self check-in"
          description="Check yourself in with the keypad."
          isDark={isDark}
        />
        <FeatureItem
          icon={Calendar}
          title="Free cancellation before Feb 14"
          isDark={isDark}
        />
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Description */}
      {description ? (
        <>
      <div className="max-w-4xl space-y-4 lg:space-y-7">
        <p className={`text-sm lg:text-base leading-relaxed ${!isDescriptionExpanded && isLongComment ? "line-clamp-4" : ""}`}>
          {description}
        </p>
        {isLongComment && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="flex items-center gap-1 text-sm font-medium underline decoration-2 underline-offset-4"
          >
            {isDescriptionExpanded ? "Show less" : "Show more"}
            <ChevronRight
              size={14}
              strokeWidth={3}
              className={isDescriptionExpanded ? "-rotate-90 transition-transform" : "rotate-0 transition-transform"}
            />
          </button>
        )}
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      </>
      ):null}

      {/* What this place offers */}
      {sourceAmenities.length > 0 && (
        <>
      <div className="space-y-4 lg:space-y-8">
        <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
          What this place offers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-10">
          {visibleAmenities.map((item, index) => (
            <div key={index} className="flex items-center gap-4 group">
              <item.icon
                size={24}
                strokeWidth={1.5}
                className={`${isDark ? "text-[#C7C7C7]" : "text-zinc-600"}`}
              />
              <span className="text-base font-normal">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${isDark ? "bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"}`}
        >
          {isAmenitiesExpanded ? "Show less" : `Show all ${sourceAmenities.length} amenities`}
        </button>
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      </>
      )}

      {/* Operating Hours */}

      {schedule && (
      <>
      <div className="space-y-4 lg:space-y-8">
        <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
          Operating Hours
        </h2>
        <div className={`p-8 rounded-2xl w-full max-w-md ${isDark ? "bg-[#171717] text-white" : "bg-white text-zinc-900"}`}>
          <div className="space-y-5">
            {days.map((day) => {
              const dayData = schedule[day] || { open: "Closed", close: "", isOpen: false };

              return (
                <div key={day} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] ${dayData.isOpen ? "bg-[#14C573]" : "bg-zinc-600"}`}
                    />
                    <span className="lg:text-lg font-medium tracking-tight">
                      {day}
                    </span>
                  </div>

                  <div className={`lg:text-lg ${isDark ? "text-[#FFFFFF99]" : "text-zinc-500"}`}>
                    {dayData.isOpen ? (
                      dayData.is24Hours ? (
                        "24 Hours"
                      ) : (
                        `${dayData.open} - ${dayData.close}`
                      )
                    ) : (
                      <span className="italic opacity-60">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      </>
      )}

      {/* Where you'll be */}
      {(mapLatitude || fullAddress) && (
        <>      
        <div className="space-y-4 lg:space-y-6">
        <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
          Where you&apos;ll be
        </h2>
        <div className="w-full rounded-2xl bg-zinc-700 h-20 lg:h-[480px] overflow-hidden">
          <StudioLocationMap
            latitude={mapLatitude}
            longitude={mapLongitude}
            isDark={isDark}
            className="rounded-2xl"
          />
        </div>
          <div className="space-y-2">
          <p className="lg:text-lg font-medium">
            {address.city ? `${address.city}, ${address.state}, ${address.country}` : "Location Details"}
          </p>
          <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-[#FFFFFFAD]" : "text-black/60"} ${!isAddressExpanded && isLongAddress ? 'line-clamp-2' : ''}`}>
            {fullAddress}
          </p>
          {isLongAddress && (
            <button
              onClick={() => setIsAddressExpanded(!isAddressExpanded)}
              className="flex items-center gap-1 text-sm font-medium underline decoration-2 underline-offset-4"
            >
              {isAddressExpanded ? "Show less" : "Show more"}
              <ChevronRight size={14} strokeWidth={3} className={isAddressExpanded ? "-rotate-90 transition-transform" : "rotate-0 transition-transform"} />
            </button>
          )}
        </div>
      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      </>
      )} 
      <ReviewsComponent isDark={isDark} />
    </section>
  );
};

const FeatureItem = ({
  icon: Icon,
  title,
  description,
  showMore,
  isDark,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  showMore?: boolean;
  isDark?: boolean;
}) => (
  <div className="flex gap-4">
    <Icon
      size={32}
      strokeWidth={1.5}
      className={`mt-1 shrink-0 ${isDark ? "text-white" : "text-zinc-900"}`}
    />
    <div className="space-y-1">
      <p className="text-sm lg:text-base font-medium tracking-tight">{title}</p>
      {description && (
        <p className={`text-xs lg:text-sm leading-snug ${isDark ? "text-[#8B8B8B]" : "text-zinc-500"}`}>
          {description}
          {showMore && (
            <button className="ml-1 font-semibold underline underline-offset-4 text-white">
              Show more
            </button>
          )}
        </p>
      )}
    </div>
  </div>
);
