"use client";

import React, { useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import {
  ArrowLeft, CalendarDays, ChevronRight, Home, Images,
  MapPin, Star, X, Check, Clock, Shield, Share2, Heart, Loader2,
  Utensils, Music, Info, ChevronLeft, Wifi, Tv, Wind,
  Video, Mic, Camera, ShieldCheck, Key, RefreshCw, AlertCircle, Sparkles,
  ExternalLink,
  Grid2X2,
  LayoutGrid,
  Clapperboard,
  PartyPopper,
  DoorClosed,
  MessageCircleMore
} from "lucide-react";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';


import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { HOURLY_STUDIO_LIST, type StudioCatalogItem } from "@/components/book-a-shoot/v3/studioData";

const STUDIO_IMAGE_FALLBACK = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";
const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";

// --- Dummy Data Object (Fallback when API/Lookup returns null) ---
const DEFAULT_DUMMY_STUDIO: StudioCatalogItem & {
  hostName?: string;
  hostAvatar?: string;
  guestsCount?: number;
  securityDeposit?: number;
  billsIncluded?: boolean;
  preferredGuests?: string;
  availableDate?: string;
  reviewsCount?: number;
  ratingBreakdown?: { cleanliness: number; communication: number; checkIn: number };
  userReviews?: Array<{ id: string; name: string; date: string; avatar: string; comment: string }>;
  safetyRules?: string[];
} = {
  id: "dummy-studio-1",
  name: "Beige Media (Modern Resort Villa with Jacuzzi)",
  description: "A fully equipped production studio in Los Angeles, ideal for photo, video, podcast, and product shoots. The space offers professional lighting, flexible shooting setups, and comfortable crew areas to ensure smooth and efficient production. Conveniently located near parking, cafes, and creative services, this studio is designed to help creators move fast and shoot with confidence.",
  priceValue: 150,
  pricingMode: "hourly",
  rating: 5.0,
  reviews: 7,
  beds: 3,
  baths: 1,
  size: "2,400 sq ft",
  poolType: "Apartment",
  image: "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
  images: [
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/weho-gym/MWC+Weho+Studio-2.jpg",
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/weho-content/Weho+Studio-3.jpg",
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/kitchen.png",
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/weho-gym/MWC+Weho+Studio-11.jpg",
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/weho-content/Weho+Studio-43.jpg",
  ],
  amenities: [
    "Garden view", "Kitchen", "Wifi", "Pets allowed",
    "Free washer - in building", "Dryer", "Central air conditioning",
    "Security cameras on property", "Refrigerator", "Bicycles"
  ],
  rules: [
    "Minimum booking is 2 hours",
    "Setup and breakdown must be included within your booking hours",
    "Guests must respect property and keep noise at acceptable levels",
    "No smoking inside the premises"
  ],
  operatingHours: "10:00 am - 10:00 pm",
  hostName: "Ghazal",
  hostAvatar: "/images/crew/CREW(5).png",
  guestsCount: 2,
  securityDeposit: 800,
  billsIncluded: true,
  preferredGuests: "Females",
  availableDate: "Jan 06, 2026",
  reviewsCount: 7,
  ratingBreakdown: {
    cleanliness: 5.0,
    communication: 5.0,
    checkIn: 5.0,
  },
  userReviews: [
    {
      id: "r1",
      name: "Jose",
      date: "December 2021",
      avatar: "/images/crew/CREW(5).png",
      comment: "Host was very attentive.",
    },
    {
      id: "r2",
      name: "Shayna",
      date: "December 2021",
      avatar: "/images/crew/CREW(5).png",
      comment: "Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed...",
    },
    {
      id: "r3",
      name: "Vladko",
      date: "November 2020",
      avatar: "/images/crew/CREW(5).png",
      comment: "This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price.",
    },
  ],
  safetyRules: [
    "Host Rules",
    "Cleaning Protocol",
    "Protective Gears",
    "Physical Distance",
    "Signage",
    "Cancellation Policy",
  ],
};

// --- Data Fetching Logic ---
const getStudioBySlug = (slug: string) => {
  const direct = HOURLY_STUDIO_LIST.find((studio) => studio.id === slug);
  if (direct) return direct;
  const numericIndex = Number(slug);
  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return HOURLY_STUDIO_LIST[numericIndex - 1];
  }
  return undefined;
};

const StudioDetailContent = ({ studio: initialStudio }: { studio?: StudioCatalogItem }) => {
  const router = useRouter();
  const studio = initialStudio || DEFAULT_DUMMY_STUDIO;

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<"production" | "audio" | "events">("production");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllAmenitiesModal, setShowAllAmenitiesModal] = useState(false);

  // Pricing Logic
  const [selectedPricingKey, setSelectedPricingKey] = useState<string>(studio.pricingOptions?.[0]?.key || "");
  const selectedPricing = useMemo(
    () => studio.pricingOptions?.find((option) => option.key === selectedPricingKey) || studio.pricingOptions?.[0] || null,
    [selectedPricingKey, studio.pricingOptions],
  );

  // Gallery Deduplication
  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio.image, ...(studio.images || [])].forEach((image) => { if (image) imageSet.add(image); });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);

  // Fallbacks & Extended Data Mapping
  const hostName = (studio as typeof DEFAULT_DUMMY_STUDIO).hostName || "Ghazal";
  const hostAvatar = (studio as typeof DEFAULT_DUMMY_STUDIO).hostAvatar || DEFAULT_DUMMY_STUDIO.hostAvatar;
  const guestsCount = (studio as typeof DEFAULT_DUMMY_STUDIO).guestsCount || 2;
  const bedroomsCount = studio.beds || 3;
  const bedsCount = 1;
  const bathsCount = studio.baths || 1;

  const amenities = studio.amenities?.length ? studio.amenities : DEFAULT_DUMMY_STUDIO.amenities!;
  const userReviews = (studio as typeof DEFAULT_DUMMY_STUDIO).userReviews || DEFAULT_DUMMY_STUDIO.userReviews!;
  const safetyRules = (studio as typeof DEFAULT_DUMMY_STUDIO).safetyRules || DEFAULT_DUMMY_STUDIO.safetyRules!;
  const ratingBreakdown = (studio as typeof DEFAULT_DUMMY_STUDIO).ratingBreakdown || DEFAULT_DUMMY_STUDIO.ratingBreakdown!;

  const operatingDays = [
    { day: "Monday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Tuesday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Wednesday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Thursday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Friday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Saturday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
    { day: "Sunday", hours: studio.operatingHours || "10:00 am - 10:00 pm" },
  ];

  return (
    <div className="relative pt-20 md:pt-24 lg:pt-32 pb-10 lg:pb-24 text-white">
      <div className="max-w-[1400px] mx-auto md:px-6 lg:px-8">

        {/* Navigation Bar */}
        <div className="hidden lg:block lg:mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Header (Restored Data Labels) */}
        <div className="hidden lg:block lg:mb-10">
          <h1 className="text-lg lg:text-[32px] font-medium text-white mb-2">
            {studio.name}
          </h1>
          <div className="flex justify-between items-center text-xs lg:text-sm">
            <div className="flex items-center gap-2 text-white/60">
              {/* <MapPin size={16} className="text-[#E8D1AB]" /> */}
              <span className="underline underline-offset-2 underline underline-offset-2-offset-4 decoration-white/20">{DEFAULT_DISPLAY_ADDRESS}</span>
            </div>

            <button className="flex items-center gap-1 text-white font-medium">
              <ExternalLink size={16} />
              Share
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-5 lg:mb-10">
          {/* MOBILE CAROUSEL (< md) */}
          <div className="block md:hidden relative w-full h-[320px] overflow-hidden group">
            {/* Floating Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-[#1D1D1D] backdrop-blur-md border border-[#9C9C9C] flex items-center justify-center text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Mobile Image Swiper */}
            <Swiper
              modules={[Pagination]}
              slidesPerView={1}
              spaceBetween={0}
              pagination={{
                clickable: true,
                el: ".custom-swiper-pagination",
              }}
              className="w-full h-full"
            >
              {galleryImages.map((img, idx) => (
                <SwiperSlide key={idx} onClick={() => setActiveImageIndex(idx)}>
                  <div className="relative w-full h-full cursor-pointer">
                    <Image
                      src={img}
                      alt={`Studio slide ${idx + 1}`}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                    {/* Top Fade to #101010 */}
                    <div className="absolute top-0 inset-x-0 h-12 z-10 pointer-events-none bg-gradient-to-b from-[#0F0F0F] to-transparent" />

                    {/* Bottom Fade to #101010 */}
                    <div className="absolute bottom-0 inset-x-0 h-16 z-10 pointer-events-none bg-gradient-to-t from-[#0F0F0F] to-transparent" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Bottom Gradient Overlay & Controls */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none flex flex-col gap-3">
              {/* Custom Horizontal Bar Indicators */}
              <div className="max-w-30 custom-swiper-pagination flex items-center gap-[1px] pointer-events-auto [&_.swiper-pagination-bullet]:h-[2px] [&_.swiper-pagination-bullet]:flex-1 [&_.swiper-pagination-bullet]:bg-[#626262] [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet-active]:bg-[#E8D1AB] [&_.swiper-pagination-bullet]:transition-all" />
            </div>
          </div>

          {/* DESKTOP & TABLET GRID (>= md) */}
          <div className="hidden md:grid h-[500px] grid-cols-12 gap-2 overflow-hidden rounded-3xl">
            {/* Main Large Image */}
            <div
              className="relative col-span-6 h-full w-full cursor-pointer bg-white group overflow-hidden rounded-xl"
              onClick={() => setActiveImageIndex(0)}
            >
              <Image
                src={galleryImages[0]}
                alt="Main Studio Photo"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>

            {/* 4 Small Images Layout */}
            <div className="hidden md:col-span-6 md:grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer bg-white overflow-hidden group rounded-xl"
                  onClick={() => setActiveImageIndex(Math.min(idx, galleryImages.length - 1))}
                >
                  <Image
                    src={galleryImages[idx] || galleryImages[0]}
                    alt={`Studio Grid image ${idx}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {idx === 4 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(0); }}
                      className="absolute bottom-4 right-4 bg-white/95 text-black hover:bg-white px-4 py-2 rounded-lg font-medium text-xs lg:text-sm flex items-center gap-2 shadow-xl backdrop-blur-sm transition-all"
                    >
                      <LayoutGrid size={20} /> Show all photos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Main Content & Sidebar Grid */}
        <div className="px-4 lg:px-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-30">
          {/* Left Column Content */}
          <div className="lg:col-span-8 space-y-5 lg:space-y-12">
            {/* Mobile Top Info block */}
            <div className="md:hidden">
              {/* Available Status Badge */}
              <div className="flex items-center gap-2 bg-[#1DAA23] border border-[#14C573] text-white px-3 py-1 rounded-full w-max text-[10px] font-medium mb-4">
                <span className="absolute w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-white" />
                Available
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-start">
                  <h1 className="text-base font-bold text-white max-w-2/3">
                    {studio.name}
                  </h1>
                  <div className="flex items-center gap-2 mb-6">
                    <Star size={14} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                    <h3 className="text-sm font-medium text-white/70">
                      {studio.rating || "5.0"} ({studio.reviews || 117})
                    </h3>
                  </div>
                </div>
                <p className="text-white/60 text-sm ">{DEFAULT_DISPLAY_ADDRESS}</p>
                <div className="flex gap-1 items-center">
                  <span className="text-[#E8D1AB] text-sm font-extrabold">From $59/Hr</span>
                  <span className="text-white text-xs">(Minimum 3hr)</span>
                </div>
              </div>

              <div className="flex gap-2 ">
                <button
                  type="button"
                  className="shrink-0 w-14 h-14 rounded-lg text-black bg-[linear-gradient(90deg,#E8D1AB_0%,#FDEFD9_100%),linear-gradient(97deg,#E8D1AB_4.35%,#D4A14D_111.36%)] p-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M13.3337 29.3333C19.2247 29.3333 24.0003 24.5577 24.0003 18.6667C24.0003 12.7756 19.2247 8 13.3337 8C7.44262 8 2.66699 12.7756 2.66699 18.6667C2.66699 20.314 3.04043 21.8741 3.70726 23.267C3.93645 23.7457 4.01692 24.2881 3.87973 24.8008L3.44234 26.4355C3.0976 27.724 4.27635 28.9027 5.56479 28.558L7.19951 28.1206C7.71224 27.9834 8.2546 28.0639 8.73333 28.2931C10.1262 28.9599 11.6863 29.3333 13.3337 29.3333Z" stroke="black" />
                    <path d="M24.0003 19.3371C24.089 19.3001 24.1768 19.2617 24.264 19.2219C24.7467 19.0014 25.2884 18.9189 25.8011 19.0561L26.4359 19.226C27.7243 19.5707 28.9031 18.3919 28.5583 17.1035L28.3885 16.4688C28.2513 15.9561 28.3338 15.4144 28.5543 14.9316C29.0548 13.836 29.3337 12.6179 29.3337 11.3346C29.3337 6.54817 25.4535 2.66797 20.667 2.66797C17.064 2.66797 13.9745 4.86662 12.667 7.99544" stroke="black" />
                    <path d="M8.69071 18.668H8.70271M13.345 18.668H13.357M17.9997 18.668H18.0117" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg text-black bg-[linear-gradient(90deg,#E8D1AB_0%,#FDEFD9_100%),linear-gradient(97deg,#E8D1AB_4.35%,#D4A14D_111.36%)] p-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">

                    {hostAvatar && (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                        <Image src={hostAvatar} alt={hostName} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <p className="text-sm">Hosted by {hostName}</p>
                      <p className="text-[10px]">Response time: Within an hour</p>
                    </div>
                  </div>
                  <ChevronRight />
                </button>
              </div>

            </div>

            {/* Title Header & Host Info */}
            <div className="hidden text-white md:flex justify-between items-start">
              <div>
                <h1 className="text-lg lg:text-2xl font-medium mb-1">
                  Entire rental unit hosted by {hostName}
                </h1>
                <p className="text-xs lg:text-sm">
                  {guestsCount} guests • {bedroomsCount} bedroom • {bedsCount} bed • {bathsCount} bath
                </p>
              </div>
              {hostAvatar && (
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                  <Image src={hostAvatar} alt={hostName} fill className="object-cover" />
                </div>
              )}
            </div>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Booking For Type Selector */}
            <section className="space-y-4">
              <h3 className="text-sm lg:text-2xl font-medium text-white">Booking For</h3>
              <div className="flex p-1.5 bg-[#282828] lg:bg-[#171717] lg:border lg:border-white/40 lg:border-[0.5px] rounded-lg lg:rounded-2xl w-full">
                <button
                  onClick={() => setBookingType("production")}
                  className={`lg:min-w-[220px] flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm lg:text-lg font-medium lg:font-normal transition-all ${bookingType === "production"
                    ? "bg-[#E8D1AB] text-black"
                    : "text-[#8B8B8B] hover:text-white"
                    }`}
                >
                  <Clapperboard className="w-4 h-4 lg:w-7 lg:h-7" strokeWidth={1.5} /> Production
                </button>
                <button
                  onClick={() => setBookingType("audio")}
                  className={`lg:min-w-[220px] flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm lg:text-lg font-medium lg:font-normal transition-all ${bookingType === "audio"
                    ? "bg-[#E8D1AB] text-black"
                    : "text-[#8B8B8B] hover:text-white"
                    }`}
                >
                  <Mic className="w-4 h-4 lg:w-7 lg:h-7" strokeWidth={1.5} /> Audio
                </button>
                <button
                  onClick={() => setBookingType("events")}
                  className={`lg:min-w-[220px] flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm lg:text-lg font-medium lg:font-normal transition-all ${bookingType === "events"
                    ? "bg-[#E8D1AB] text-black"
                    : "text-[#8B8B8B] hover:text-white"
                    }`}
                >
                  <PartyPopper className="w-4 h-4 lg:w-7 lg:h-7" strokeWidth={1.5} /> Events
                </button>
              </div>

              {/* Includes checklist based on selection */}
              <div className="pt-2">
                <p className="text-sm lg:text-xl text-[#E8D1AB] font-medium mb-3">Production Includes</p>
                <div className="flex flex-wrap gap-6 text-xs lg:text-sm text-[#A9A9A9]">
                  <div className="flex items-center gap-2">
                    <Image
                      src={"/images/misc/BookingFlow/Tick.svg"}
                      alt="Check mark icon"
                      width={18}
                      height={18}
                      className="w-4 h-4 lg:h-5 lg:w-5"
                    />
                    <span>Photo shoots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={"/images/misc/BookingFlow/Tick.svg"}
                      alt="Check mark icon"
                      width={18}
                      height={18}
                      className="w-4 h-4 lg:h-5 lg:w-5"
                    />
                    <span> Video shoots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={"/images/misc/BookingFlow/Tick.svg"}
                      alt="Check mark icon"
                      width={18}
                      height={18}
                      className="w-4 h-4 lg:h-5 lg:w-5"
                    />
                    <span>Product shoots</span>
                  </div>
                </div>
              </div>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Quick Highlights Info */}
            <section className="text-white space-y-6">
              <div className="flex items-start gap-4">
                <Home size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Entire home</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">You’ll have the apartment to yourself</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Sparkles size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Enhanced Clean</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">
                    This Host committed to Airbnb’s 5-step enhanced cleaning process.{" "}
                    <button className="underline underline-offset-2 font-medium">Show more</button>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <DoorClosed size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Self check-in</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">Check yourself in with the keypad.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CalendarDays size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Free cancellation before Feb 14</h4>
                </div>
              </div>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Description Section */}
            <section className="space-y-3">
              <h3 className="text-sm lg:hidden font-medium text-white">About Studio</h3>
              <p className={`text-white text-sm lg:text-base ${!showFullDescription ? "line-clamp-5 lg:line-clamp-3" : ""}`}>
                {studio.description}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-white font-medium underline underline-offset-2 text-xs lg:text-sm flex items-center gap-1 hover:text-white mt-2"
              >
                {showFullDescription ? "Show less" : "Show more"} <ChevronRight size={14} className={showFullDescription ? "rotate-270" : ""} />
              </button>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* What this place offers (Amenities) */}
            <section>
              <h3 className="text-sm lg:text-2xl font-medium text-white mb-4 lg:mb-6">What this place offers</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                {amenities.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-[#C7C7C7] text-sm lg:text-base">
                    <Check size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAllAmenitiesModal(true)}
                className="px-4 py-2 rounded-lg bg-[#E8D1AB] hover:bg-[#E8D1AB]/80 text-black font-medium text-xs lg:text-sm transition-colors"
              >
                Show all {amenities.length} amenities
              </button>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Operating Hours */}
            <section>
              <h3 className="text-sm lg:text-2xl font-medium text-white mb-4 lg:mb-6">Operating Hours</h3>
              <div className="bg-[#171717] rounded-xl p-4 lg:p-8 max-w-md space-y-4">
                {operatingDays.map((item) => (
                  <div key={item.day} className="flex items-center justify-between text-sm lg:text-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-[#14C573] inline-block" />
                      <span className="font-medium text-white">{item.day}</span>
                    </div>
                    <span className="text-white/60">{item.hours}</span>
                  </div>
                ))}
              </div>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Where you'll be (Location & Map) */}
            <section>
              <h3 className="text-sm lg:text-2xl font-medium text-white mb-4 lg:mb-6">Where you’ll be</h3>

              {/* MAp component will go here */}
              <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-white mb-4">
                {/* Map Mock Graphics */}
                <Image
                  src="/images/crew/CREW(5).png"
                  alt="Location Map Preview"
                  fill
                  className="object-cover opacity-70 grayscale hover:grayscale-0 transition-all duration-500"
                />

                {/* Center Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white text-black font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                    <Home size={16} className="text-[#101010]" />
                    Exact location provided after booking
                  </div>
                </div>
              </div>

              <h4 className="text-sm lg:text-lg font-medium text-white mb-2 lg:mb-4">{DEFAULT_DISPLAY_ADDRESS}</h4>
              <p className={`text-white/70 text-sm lg:text-base mb-2 lg:mb-4 ${!showFullDescription ? "line-clamp-3" : ""}`}>
                Very dynamic and appreciated district by the people of Bordeaux thanks to rue St James and place Fernand Lafargue. Home to many historical monuments such as the Grosse Cloche, the Porte de Bourgogne and the Porte Cailhau, and cultural sites such as the Aquitaine Museum.
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#E8D1AB] font-medium underline underline-offset-2 text-xs lg:text-sm flex items-center gap-1 hover:text-[#E8D1AB]/80 mt-2"
              >
                {showFullDescription ? "Show less" : "Show more"} <ChevronRight size={14} className={showFullDescription ? "rotate-270" : ""} />
              </button>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Reviews Section */}
            <section>
              <div className="flex items-center gap-2 mb-4 lg:mb-6">
                <Star className="w-6 h-6 lg:h-8 lg:w-8 fill-[#E8D1AB] text-[#E8D1AB]" />
                <h3 className="text-sm lg:text-2xl font-medium text-white">
                  {studio.rating || "5.0"} • {studio.reviews || 7} reviews
                </h3>
              </div>

              {/* Specific Rating Metrics */}
              <div className="flex flex-col gap-4 mb-8 max-w-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-base text-white">Cleanliness</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-[#454545] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8D1AB] w-4/5 rounded-full" />
                    </div>
                    <span className="text-xs">{ratingBreakdown.cleanliness.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-base text-white">Communication</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-[#454545] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8D1AB] w-4/5 rounded-full" />
                    </div>
                    <span className="text-xs ">{ratingBreakdown.communication.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-base text-white">Check-in</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-[#454545] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8D1AB] w-4/5 rounded-full" />
                    </div>
                    <span className="text-xs ">{ratingBreakdown.checkIn.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {userReviews.map((rev) => (
                  <div key={rev.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white">
                        <Image src={rev.avatar} alt={rev.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h5 className="font-medium text-white text-sm lg:text-base">{rev.name}</h5>
                        <p className="text-xs lg:text-sm text-[#6B7280]">{rev.date}</p>
                      </div>
                    </div>
                    <p className="text-white text-xs lg:text-base">{rev.comment}</p>
                  </div>
                ))}
              </div>

              <button className="mt-9 px-4 py-2 rounded-lg bg-[#E8D1AB] hover:bg-[#E8D1AB]/80 text-black font-medium text-sm transition-colors">
                Show all {studio.reviews || 12} reviews
              </button>
            </section>
            <hr className="border-t my-4 lg:my-7 border-white/20" />

            {/* Rules & Health Safety Measures */}
            <section className="space-y-6">
              <h3 className="text-sm lg:text-2xl font-medium text-white">Rules & Health Safety Measures</h3>

              <div className="bg-[#171717] rounded-2xl overflow-hidden p-5">
                {safetyRules.map((rule, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      className="w-full flex items-center justify-between p-5 text-left transition-colors"
                    >
                      <span className="text-white/70 text-sm lg:text-lg">{rule}</span>
                      <ChevronRight size={16} className="text-white" />
                    </button>

                    {/* Render SVG divider only if it's NOT the last item */}
                    {idx !== safetyRules.length - 1 && (
                      <div className="w-full h-[2px] md:h-px">
                        <svg viewBox="0 0 1600 1" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="separator-gradient" x1="0" y1="0.5" x2="1600" y2="0.5" gradientUnits="userSpaceOnUse">
                              <stop stopColor="white" stopOpacity="0.02" />
                              <stop offset="0.5" stopColor="white" stopOpacity="0.4" />
                              <stop offset="1" stopColor="white" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <rect width="1600" height="1" fill="url(#separator-gradient)" />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <aside className="sticky top-32 bg-[#171717] border border-[#E8D1AB] rounded-2xl p-4 lg:px-8 lg:py-10">

              {/* Header Price & Rating */}
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg lg:text-3xl font-medium text-[#E8D1AB]">
                    ${(selectedPricing?.hourlyRate || studio.priceValue || 150).toLocaleString()}
                  </span>
                  <span className="text-base lg:text-2xl">/ Hour</span>
                </div>
                <div className="flex items-center gap-1 text-sm lg:text-xl font-medium text-white">
                  <Star size={20} className="text-white" />
                  <span>{studio.rating || "4.5"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" viewBox="0 0 3 3" fill="none">
                    <circle cx="1.4414" cy="1.4414" r="1.4414" fill="#6B7280" />
                  </svg>
                  <span className="text-white underline underline-offset-2 ml-0.5">{studio.reviews || 7} reviews</span>
                </div>
              </div>
              <hr className="border-t my-4 lg:my-7 border-white/20" />

              {/* Features Detail List */}
              <div className="space-y-4 text-sm lg:text-xl text-[#9A9898]">
                <div className="flex justify-between items-center">
                  <span>Bills</span>
                  <span>Include</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Security deposited</span>
                  <span className="text-[#067450]">${(studio as typeof DEFAULT_DUMMY_STUDIO).securityDeposit || 800}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Property type</span>
                  <span>{studio.poolType || "Apartment"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Room furnishing</span>
                  <span>Furnished</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Preferred</span>
                  <span>{(studio as typeof DEFAULT_DUMMY_STUDIO).preferredGuests || "Females"}</span>
                </div>
              </div>
              <hr className="border-t my-4 lg:my-7 border-white/20" />

              {/* Date Indicator */}
              <div className="flex justify-between items-center text-sm lg:text-xl text-[#9A9898] font-medium pb-4 lg:pb-7">
                <span>Available</span>
                <span>{(studio as typeof DEFAULT_DUMMY_STUDIO).availableDate || "Jan 06, 2026"}</span>
              </div>

              {/* Action Button */}
              <Link
                href={`/book-a-studio?studioId=${studio.id}${selectedPricingKey ? `&pricingKey=${selectedPricingKey}` : ""}`}
                className="flex h-12 lg:h-15 w-full items-center justify-center rounded-lg bg-[#E8D1AB] text-black font-medium text-sm lg:text-lg hover:bg-[#dfc498] active:scale-[0.98] transition-all"
              >
                Add this Studio
              </Link>
            </aside>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div
        className={`lg:hidden fixed flex gap-2 border-t border-white/10 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#101010]`}
      // className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3"
      >

        <button
          type="button"
          onClick={() => router.back()}
          className="py-3.5 w-full rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base hover:bg-white/5 transition-all cursor-pointer"
        >
          Back
        </button>

        <button
          onClick={() => { console.log("Add this studio") }}
          className="py-3.5 w-full rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Add this Studio
        </button>
      </div>

      {/* Fullscreen Gallery View Modal */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col">
          <div className="flex justify-between items-center p-6 bg-black/50 z-10">
            <span className="text-white/50  text-xs tracking-widest">
              {activeImageIndex + 1} / {galleryImages.length}
            </span>
            <button
              onClick={() => setActiveImageIndex(null)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center px-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null));
              }}
              className="absolute left-4 z-20 p-4 text-white/40 hover:text-white transition-all"
            >
              <ChevronLeft size={48} strokeWidth={1} />
            </button>

            <div className="relative w-full h-full max-h-[75vh]">
              <Image
                src={galleryImages[activeImageIndex]}
                alt="Full studio image preview"
                fill
                className="object-contain"
                priority
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : null));
              }}
              className="absolute right-4 z-20 p-4 text-white/40 hover:text-white transition-all"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          </div>

          <div className="w-full bg-black py-8">
            <div className="flex justify-start md:justify-center gap-2 overflow-x-auto px-6 no-scrollbar">
              {galleryImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border transition-all ${activeImageIndex === idx
                    ? "border-white opacity-100 scale-110 z-10"
                    : "border-transparent opacity-30 hover:opacity-60"
                    }`}
                >
                  <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Amenities Modal */}
      {showAllAmenitiesModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-white w-full max-w-2xl max-h-[80vh] rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white">
              <h3 className="text-xl font-bold text-white">All Amenities</h3>
              <button
                onClick={() => setShowAllAmenitiesModal(false)}
                className="p-1 text-white hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white text-sm py-1">
                  <Check size={16} className="text-[#E8D1AB]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StudioDetailsPage() {
  const params = useParams();
  const studioSlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const studio = getStudioBySlug(String(studioSlug || ""));

  return (
    <main className="min-h-screen bg-[#101010] text-white selection:bg-[#E8D1AB] selection:text-black">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#E8D1AB]" size={40} /></div>}>
        <StudioDetailContent studio={studio || DEFAULT_DUMMY_STUDIO} />
      </Suspense>
      <Footer />
    </main>
  );
}