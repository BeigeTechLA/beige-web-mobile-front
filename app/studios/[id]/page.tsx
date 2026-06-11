"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { Swiper as SwiperType } from "swiper";
import { motion, AnimatePresence } from 'framer-motion';

import { ArrowLeft, Loader2, Leaf, Wifi, Disc, Wind, Refrigerator, Monitor, Bone, Flame, Video, Bike, Coffee, Utensils, Car, Shield, Music, Tv, ChevronRight, Calendar, DoorClosed, Sparkles, Home, ExternalLink, Heart, Clapperboard, Mic, PartyPopper, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";

import StudioImages from "../components/StudioImages";
import StudioBookingSidebar from "../components/StudioBookingCard";
import Image from "next/image";
import { ReviewsComponent } from "@/components/admin/studios/StudioReviews";
import HostRulesAccordion from "../components/HostRulesAccordion";


interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  showMore?: boolean;
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

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

type TabID = 'Production' | 'Audio' | 'Events';
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


const studioImages = [
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72',
];

const description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.Curabitur neque diam, rhoncus vitae euismod quis, vehicula lobortis est. Integer eleifend metus a fermentum aliquet. Duis vel risus orci. Nullam sed metus est. Donec commodo gravida auctor. Sed elementum massa a viverra luctus. Sed in maximus nisl. Suspendisse id mauris congue lorem iaculis sodales. Integer ultrices tristique erat eget blandit. ";

const address = "Duis tristique nisi ut tristique aliquam. Nunc euismod ipsum leo, sed cursus urna ultricies sed. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae dolor velit. Sed enim velit, feugiat scelerisque dolor et, tincidunt tempus libero. Vestibulum at nulla orci. Nullam laoreet, nisl in lobortis tempor, dui mauris tincidunt diam, sit amet gravida mauris justo in tellus. Morbi dictum odio sapien. Quisque cursus, odio et lobortis interdum, metus urna laoreet felis, sed posuere sem mi ac dolor.";

function StudioDetailContent() {
  const swiperRef = useRef<SwiperType | null>(null);
  const router = useRouter();

  // Updated state to handle dynamic project categories
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeProject, setActiveProject] = useState<string>("All");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [isFromBookingPage, setIsFromBookingPage] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Overview");


  const searchParams = useSearchParams();
  const params = useParams();
  const shootId = searchParams.get("shootId") ?? searchParams.get("booking_id") ?? undefined;

  const isLongComment = description.length > 250;
  const isLongAddress = address.length > 200;
  const visibleAmenities = isAmenitiesExpanded ? amenities : amenities.slice(0, 10);

  // --- DYNAMIC DATA PROCESSING ---

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#E8D1AB] animate-spin" />
          <p className="text-white/60 text-lg">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-24 lg:pt-44 pb-8 lg:pb-16 min-h-screen flex flex-col items-center">
      <div className="container relative z-10 mx-auto flex flex-col items-center">
        <div className="w-full">
          <Button
            onClick={handleBack}
            className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-end w-full ">
          <div>
            <p className="text-white text-2xl font-medium lg:text-[32px]">
              Beige Media (Modern Resort Villa with Jacuzzi)
            </p>
            <p className="text-[#FFFFFFAD] text-xs lg:text-sm underline underline-offset-2">
              Woodland Hills, Los Angeles, CA
            </p>
          </div>
          <div className="flex gap-4 ">
            <button className="flex gap-1 items-center text-white text-sm font-medium">
              <ExternalLink size={16} /> Share
            </button>
            <button className="flex gap-1 items-center text-white text-sm font-medium">
              <Heart size={16} /> Save
            </button>
          </div>
        </div>

        {/* Image Component */}
        <StudioImages images={studioImages} />

        {/*  */}
        <div className="grid grid-cols-12 gap-4 w-full">
          {/* Left column */}
          <div className="col-span-8 p-4 w-full">
            {/* First few sections with extra right padding */}
            <div className="max-w-4/5 ">
              {/* General Overview */}
              <div className="flex justify-between items-center">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-lg lg:text-2xl font-medium ">
                    Entire rental unit hosted by Ghazal
                  </p>
                  <div className="flex gap-3">
                    {
                      ["2 guests", "1 bedroom", "1 bed", "1 bath"].map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <p key={idx} className={`text-xs lg:text-sm text-[#FFF]`}>
                            {item}
                          </p>
                          {
                            idx !== 3 && <span className={`text-xs lg:text-sm text-[#FFF]`}>
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
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />

              {/*  Booking For*/}
              <div>
                <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Booking For
                </h2>
                <CategoryTabs />
              </div>
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />

              {/* Features */}
              <div className={`space-y-2 lg:space-y-4 text-white`}>
                <FeatureItem
                  icon={Home}
                  title="Entire home"
                  description="You&apos;ll have the apartment to yourself"
                />
                <FeatureItem
                  icon={Sparkles}
                  title="Enhanced Clean"
                  description="This Host committed to Airbnb&apos;s 5-step enhanced cleaning process."
                  showMore={true}
                />
                <FeatureItem
                  icon={DoorClosed}
                  title="Self check-in"
                  description="Check yourself in with the keypad."
                />
                <FeatureItem
                  icon={Calendar}
                  title="Free cancellation before Feb 14"
                />
              </div>
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />

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
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />


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
                        className={`text-[#C7C7C7]`}
                      />
                      <span className="text-base font-normal">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]`}>
                  {isAmenitiesExpanded ? "Show less" : `Show all ${amenities.length} amenities`}
                </button>
              </div>
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />

              {/* Operating Hours */}
              <div className={`space-y-4 lg:space-y-8`}>
                <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Operating Hours
                </h2>
                <div className={`p-8 rounded-2xl w-full max-w-md bg-[#171717] text-white`}>
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

                          <div className={`lg:text-lg text-[#FFFFFF99]`}>
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
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />
            </div>

            {/* Full Width components */}
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

              <p className={`text-sm lg:text-base leading-relaxed text-[#FFFFFFAD] ${!isAddressExpanded && isLongAddress ? 'line-clamp-2' : ''}`}>
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
            <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33] max-w-4/5`} />

            <ReviewsComponent />
            <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33] max-w-4/5`} />

            {/* Rules */}
            <div className={`space-y-4 lg:space-y-6`}>
              <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                Rules & Health Safety Measures
              </h2>
              <HostRulesAccordion />
            </div>

          </div>

          {/* Right Column */}
          <div className="col-span-4 w-full">
            {/* Basic infor: Add card */}
            <StudioBookingSidebar />
          </div>
        </div>


      </div>
    </div>
  );
}

export default function StudioDetailPage() {
  return (
    <main className="bg-[#101010] min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#101010]" />}>
        <StudioDetailContent />
      </Suspense>
      <Footer />
    </main>
  );
}


const FeatureItem = ({ icon: Icon, title, description, showMore }: FeatureItemProps) => (
  <div className="flex gap-4">
    <Icon
      size={32}
      strokeWidth={1.5}
      className={`mt-1 shrink-0 text-white`}
    />
    <div className="space-y-1">
      <p className="text-sm lg:text-base font-medium tracking-tight">{title}</p>
      {description && (
        <p className={`text-xs lg:text-sm leading-snug text-[#8B8B8B]`}>
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

const CategoryTabs = () => {
  const [activeTab, setActiveTab] = useState<TabID>('Production');

  const tabsData = {
    Production: {
      id: 'Production' as const,
      label: 'Production',
      icon: Clapperboard,
      includes: ['Photo shoots', 'Video shoots', 'Product shoots'],
    },
    Audio: {
      id: 'Audio' as const,
      label: 'Audio',
      icon: Mic,
      includes: ['Podcast recording', 'Voiceover', 'Music production', 'Mixing'],
    },
    Events: {
      id: 'Events' as const,
      label: 'Events',
      icon: PartyPopper,
      includes: ['Workshops', 'Networking', 'Pop-up shops'],
    },
  };

  const tabs = Object.values(tabsData);
  const activeTabData = tabsData[activeTab];

  return (
    <div className="w-full p-4 space-y-7">
      <div className="w-full bg-[#171717] border border-[#FFFFFF66] rounded-2xl p-2.5 h-18 flex items-center relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabID)}
              className={`relative flex-1 h-full flex items-center justify-center gap-1.5 transition-colors duration-300 z-10 ${isActive ? 'text-[#101010]' : 'text-[#8B8B8B] hover:text-gray-300'
                }`}
            >
              <Icon size={30} strokeWidth={1} />
              <span className="lg:text-lg">{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-[#E8D1AB] rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <h3 className="lg:text-xl font-medium text-[#E8D1AB] mb-3.5">
            {activeTabData.label} Includes
          </h3>

          <div className="flex flex-wrap gap-x-12 gap-y-4">
            {activeTabData.includes.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check size={24} className="text-white flex-shrink-0" />
                <span className="text-[#A9A9A9] text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};