"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Leaf,
  Wifi,
  Disc,
  Wind, Refrigerator, Monitor,
  Bone, Flame, Video, Bike, Coffee, Utensils, Car, Shield,
  Music, Tv,
  ChevronRight,
  Calendar,
  DoorClosed,
  Sparkles,
  Home
} from "lucide-react";
import { ReviewsComponent } from "./StudioReviews";

interface StudioInformationProps {
  information?: any; // Replace with actual type
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
}

interface OpeningHoursProps {
  schedule: Record<string, DaySchedule>;
  isDark?: boolean;
}

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  showMore?: boolean;
  isDark?: boolean;
}

const amenities: Amenity[] = [
  { icon: Leaf, label: "Garden view" },
  { icon: Monitor, label: "Kitchen" },
  { icon: Wifi, label: "Wifi" },
  { icon: Bone, label: "Pets allowed" },
  { icon: Disc, label: "Free washer – in building" },
  { icon: Flame, label: "Dryer" },
  { icon: Wind, label: "Central air conditioning" },
  { icon: Video, label: "Security cameras on property" },
  { icon: Refrigerator, label: "Refrigerator" },
  { icon: Bike, label: "Bicycles" },
  { icon: Coffee, label: "Coffee maker" },
  { icon: Music, label: "Sound system" },
  { icon: Tv, label: "65\" HDTV" },
  { icon: Utensils, label: "Cooking basics" },
  { icon: Car, label: "Free parking" },
  { icon: Shield, label: "First aid kit" },
];

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const studioSchedule: Record<string, DaySchedule> = {
  Monday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Tuesday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Wednesday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Thursday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Friday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Saturday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
  Sunday: { open: '10:00 am', close: '10:00 pm', isOpen: true },
};

const description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.Curabitur neque diam, rhoncus vitae euismod quis, vehicula lobortis est. Integer eleifend metus a fermentum aliquet. Duis vel risus orci. Nullam sed metus est. Donec commodo gravida auctor. Sed elementum massa a viverra luctus. Sed in maximus nisl. Suspendisse id mauris congue lorem iaculis sodales. Integer ultrices tristique erat eget blandit. ";

const address = "Duis tristique nisi ut tristique aliquam. Nunc euismod ipsum leo, sed cursus urna ultricies sed. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae dolor velit. Sed enim velit, feugiat scelerisque dolor et, tincidunt tempus libero. Vestibulum at nulla orci. Nullam laoreet, nisl in lobortis tempor, dui mauris tincidunt diam, sit amet gravida mauris justo in tellus. Morbi dictum odio sapien. Quisque cursus, odio et lobortis interdum, metus urna laoreet felis, sed posuere sem mi ac dolor.";

export const StudioInformation = ({ isDark = false }: StudioInformationProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  const visibleAmenities = isAmenitiesExpanded ? amenities : amenities.slice(0, 10);
  const isLongComment = description.length > 250;
  const isLongAddress = address.length > 200;

  return (
    <section className="relative overflow-hidden">
      {/* Basic Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1 lg:space-y-2">
          <p className="text-lg lg:text-2xl font-medium ">
            Entire rental unit hosted by Ghazal
          </p>
          <div className="flex gap-3">
            {
              ["2 guests", "1 bedroom", "1 bed", "1 bath"].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <p key={idx} className={`text-sm lg:text-base ${isDark ? "text-[#FFF]" : "text-zinc-400"}`}>
                    {item}
                  </p>
                  {
                    idx !== 3 && <span className={`text-sm lg:text-base ${isDark ? "text-[#FFF]" : "text-zinc-400"}`}>
                      &#183;
                    </span>
                  }
                </div>
              ))
            }
          </div>
        </div>
        <div className="relative inline-block">
          {/* The Main Host Image */}
          <Image
            src={"/images/crew/CREW(4).png"}
            alt={"Host Image"}
            width={56}
            height={56}
            className="rounded-full w-14 h-14 object-cover"
          />

          {/* The Overlay Badge */}
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
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Features */}
      <div className={`space-y-2 lg:space-y-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        <FeatureItem
          icon={Home}
          title="Entire home"
          description="You’ll have the apartment to yourself"
          isDark={isDark}
        />
        <FeatureItem
          icon={Sparkles}
          title="Enhanced Clean"
          description="This Host committed to Airbnb’s 5-step enhanced cleaning process."
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
      <div className={`max-w-4xl space-y-4 lg:space-y-7`}>
        <p className={`text-sm lg:text-base leading-relaxed ${!isDescriptionExpanded && isLongComment ? 'line-clamp-4' : ''}`}>
          {description}
        </p>
        {isLongComment && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="flex items-center gap-1 text-sm font-medium underline decoration-2 underline-offset-4"
          >
            {isDescriptionExpanded ? "Show less" : "Show more"}
            <ChevronRight size={14} strokeWidth={3} className={isDescriptionExpanded ? "-rotate-90 transition-transform" : "rotate-0 transition-transform"} />
          </button>
        )}
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* What this place offers */}
      <div className={`space-y-4 lg:space-y-8`}>
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
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${isDark ? "bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"}`}>
          {isAmenitiesExpanded ? "Show less" : `Show all ${amenities.length} amenities`}
        </button>
      </div>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* Operating Hours */}
      <div className={`space-y-4 lg:space-y-8`}>
        <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
          Operating Hours
        </h2>
        <div className={`p-8 rounded-2xl w-full max-w-md ${isDark ? 'bg-[#171717] text-white' : 'bg-white text-zinc-900'}`}>
          <div className="space-y-5">
            {days.map((day) => {
              const dayData = studioSchedule[day] || { open: 'Closed', close: '', isOpen: false };

              return (
                <div key={day} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Status Indicator Dot */}
                    <div
                      className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] ${dayData.isOpen ? 'bg-[#14C573]' : 'bg-zinc-600'}`}
                    />
                    <span className="lg:text-lg font-medium tracking-tight">
                      {day}
                    </span>
                  </div>

                  <div className={`lg:text-lg ${isDark ? 'text-[#FFFFFF99]' : 'text-zinc-500'}`}>
                    {dayData.isOpen ? (
                      `${dayData.open} - ${dayData.close}`
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

      {/* Where you'll be */}
      <div className={`space-y-4 lg:space-y-6`}>
        <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
          Where you&apos;ll be
        </h2>
        {/* Map or location details would go here */}
        <div className="w-full rounded-2xl bg-zinc-700 h-20 lg:h-[480px] p-4">
          Add Map component here
        </div>
        <p className="lg:text-lg font-medium">
          Woodland Hills, Los Angeles, CA
        </p>

        <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-[#FFFFFFAD]" : "text-black/60"} ${!isAddressExpanded && isLongAddress ? 'line-clamp-2' : ''}`}>
          {address}
        </p>
        {isLongAddress && (
          <button
            onClick={() => setIsAddressExpanded(!isAddressExpanded)}
            className="flex items-center gap-1 text-sm text-[#E8D1AB] font-medium underline decoration-2 underline-offset-4"
          >
            {isAddressExpanded ? "Show less" : "Show more"}
            <ChevronRight size={14} strokeWidth={3} className={isAddressExpanded ? "-rotate-90 transition-transform" : "rotate-0 transition-transform"} />
          </button>
        )}


      </div>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      {/* Reviews */}
      <ReviewsComponent isDark={isDark} />

    </section>
  );
};

const FeatureItem = ({ icon: Icon, title, description, showMore, isDark }: FeatureItemProps) => (
  <div className="flex gap-4">
    <Icon
      size={32}
      strokeWidth={1.5}
      className={`mt-1 shrink-0 ${isDark ? 'text-white' : 'text-zinc-900'}`}
    />
    <div className="space-y-1">
      <p className="text-sm lg:text-base font-medium tracking-tight">{title}</p>
      {description && (
        <p className={`text-xs lg:text-sm leading-snug ${isDark ? 'text-[#8B8B8B]' : 'text-zinc-500'}`}>
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