"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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

export const StudioInformation = ({ information, isDark = false }: StudioInformationProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  const spaceBasics = useMemo(() => {
    if (!information?.space_basics) return { guests: 25, bedrooms: 1, beds: 1, bathrooms: 1 };
    try {
      return typeof information.space_basics === 'string'
        ? JSON.parse(information.space_basics)
        : information.space_basics;
    } catch (e) {
      return { guests: 25, bedrooms: 1, beds: 1, bathrooms: 1 };
    }
  }, [information?.space_basics]);

  const parsedAmenities = useMemo(() => {
    let list: string[] = [];
    if (information?.amenities) {
      try {
        const parsed = typeof information.amenities === 'string'
          ? JSON.parse(information.amenities)
          : information.amenities;
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      } catch (e) {}
    }
    
    if (list.length === 0) {
      // fallback to mock amenities mapped to icons
      return amenities;
    }

    return list.map(item => {
      const matched = amenities.find(a => a.label.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(a.label.toLowerCase()));
      return {
        icon: matched ? matched.icon : Home,
        label: item
      };
    });
  }, [information?.amenities]);

  const parsedSchedule = useMemo(() => {
    if (!information?.operating_hours || !Array.isArray(information.operating_hours)) {
      return studioSchedule;
    }
    const schedule: Record<string, DaySchedule> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    dayNames.forEach(d => {
      schedule[d] = { open: 'Closed', close: '', isOpen: false };
    });

    information.operating_hours.forEach((item: any) => {
      const dayNum = typeof item.day_of_week === 'string' ? parseInt(item.day_of_week, 10) : item.day_of_week;
      if (dayNum >= 0 && dayNum < 7) {
        const dayName = dayNames[dayNum];
        const formatTime = (timeStr: string) => {
          if (!timeStr) return '';
          const parts = timeStr.split(':');
          if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
          }
          return timeStr;
        };
        schedule[dayName] = {
          open: formatTime(item.opens_at),
          close: formatTime(item.closes_at),
          isOpen: !!item.is_open
        };
      }
    });
    return schedule;
  }, [information?.operating_hours]);

  const descriptionText = information?.description || description;
  const isLongComment = descriptionText.length > 250;

  const latNum = information?.latitude ? parseFloat(information.latitude) : 34.0401;
  const lngNum = information?.longitude ? parseFloat(information.longitude) : -118.2542;

  const addressTitle = useMemo(() => {
    const city = information?.city;
    const state = information?.state;
    const country = information?.country;
    return [city, state, country].filter(Boolean).join(", ") || "Woodland Hills, Los Angeles, CA";
  }, [information]);

  const addressText = useMemo(() => {
    const parts = [
      information?.address_line1,
      information?.address_line2,
      information?.city,
      information?.state,
      information?.zip_code
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }
    return address;
  }, [information]);

  const visibleAmenities = isAmenitiesExpanded ? parsedAmenities : parsedAmenities.slice(0, 2);
  const canToggleAmenities = parsedAmenities.length >= 3;
  const isLongAddress = addressText.length > 200;

  return (
    <section className="relative overflow-hidden">
      {/* Basic Info */}
      <div className="flex justify-between items-center">
        <div className="space-y-1 lg:space-y-2">
          <p className="text-lg lg:text-2xl font-medium ">
            Entire studio by {information?.brand_name || information?.studio_name || "Host"}
          </p>
          <div className="flex gap-3">
            {
              [
                `${spaceBasics.guests || 0} guest${spaceBasics.guests !== 1 ? 's' : ''}`,
                `${spaceBasics.bedrooms || 0} bedroom${spaceBasics.bedrooms !== 1 ? 's' : ''}`,
                `${spaceBasics.beds || 0} bed${spaceBasics.beds !== 1 ? 's' : ''}`,
                `${spaceBasics.bathrooms || 0} bath${spaceBasics.bathrooms !== 1 ? 's' : ''}`
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <p className={`text-sm lg:text-base ${isDark ? "text-[#FFF]" : "text-zinc-400"}`}>
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
          // showMore={true}
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
          {descriptionText}
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

        {canToggleAmenities && (
          <button
            type="button"
            onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${isDark ? "bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"}`}>
            {isAmenitiesExpanded ? "Show less" : `Show all ${parsedAmenities.length} amenities`}
          </button>
        )}
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
              const dayData = parsedSchedule[day] || { open: 'Closed', close: '', isOpen: false };

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
        <div className="w-full rounded-2xl overflow-hidden h-[300px] lg:h-[480px] relative border border-[#FFFFFF1A] bg-[#111111]">
          {MAPBOX_TOKEN ? (
            <Map
              key={`${latNum}-${lngNum}`}
              initialViewState={{
                longitude: lngNum,
                latitude: latNum,
                zoom: 13
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v11"}
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <Marker longitude={lngNum} latitude={latNum} anchor="bottom">
                <div className="flex flex-col items-center cursor-pointer select-none">
                  {/* Custom Popup/Tooltip */}
                  <div className={`mb-2 font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xl relative whitespace-nowrap border ${
                    isDark ? "bg-[#18181B] text-white border-zinc-800" : "bg-white text-black border-gray-100"
                  }`}>
                    Exact location provided after booking
                    {/* Little down arrow */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${
                      isDark ? "border-t-[#18181B]" : "border-t-white"
                    }`} />
                  </div>
                  
                  {/* Custom Marker Pin */}
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <div className="absolute w-12 h-12 rounded-full bg-indigo-500/30 animate-ping" />
                    {/* Main pin circle */}
                    <div className="relative w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white shadow-md">
                      <Home size={14} className="text-white" />
                    </div>
                  </div>
                </div>
              </Marker>
            </Map>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white/50 text-sm">
              Mapbox Token not configured
            </div>
          )}
        </div>
        <p className="lg:text-lg font-medium">
          {addressTitle}
        </p>

        <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-[#FFFFFFAD]" : "text-black/60"} ${!isAddressExpanded && isLongAddress ? 'line-clamp-2' : ''}`}>
          {addressText}
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

      {/* <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} /> */}
      {/* Reviews */}
      {/* <ReviewsComponent isDark={isDark} /> */}

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