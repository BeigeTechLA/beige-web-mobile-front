"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  DoorClosed,
  ExternalLink,
  Heart,
  Home,
  LayoutGrid,
  Loader2,
  MapPin,
  Mic,
  PartyPopper,
  Share2,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { studioCatalogApi, type StudioCatalogListItem } from "@/lib/api";
import HostRulesAccordion from "../components/HostRulesAccordion";

const STUDIO_IMAGE_FALLBACK =
  "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";
const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";
const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");
const STUDIO_ASSET_BASE_URL = "https://d2jhn32fsulyac.cloudfront.net/assets/studio";

type StudioReview = {
  id: string;
  name: string;
  date: string;
  avatar: string;
  comment: string;
};

type StudioRatingBreakdown = {
  cleanliness: number;
  communication: number;
  checkIn: number;
};

type StudioDetailExtras = StudioCatalogListItem & {
  hostName?: string | null;
  hostAvatar?: string | null;
  guestsCount?: number | null;
  securityDeposit?: number | null;
  billsIncluded?: boolean | null;
  preferredGuests?: string | null;
  availableDate?: string | null;
  reviewsCount?: number | null;
  ratingBreakdown?: StudioRatingBreakdown | null;
  userReviews?: StudioReview[] | null;
  safetyRules?: string[] | null;
};

const FALLBACK_AMENITIES = [
  "Natural light",
  "High-speed WiFi",
  "Production-friendly layout",
  "Furniture and decor included",
  "Kitchen access",
  "Flexible staging areas",
  "Crew-friendly common areas",
  "Street parking nearby",
];

const FALLBACK_RULES = [
  "Minimum booking and usage details follow the catalog listing.",
  "Setup and breakdown must be included in the reservation.",
  "Guests must respect the property and studio guidelines.",
];

const FALLBACK_REVIEWS: StudioReview[] = [
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
    comment:
      "Wonderful neighborhood, easy access to restaurants, and a cozy studio setup with a responsive host.",
  },
  {
    id: "r3",
    name: "Vladko",
    date: "November 2020",
    avatar: "/images/crew/CREW(5).png",
    comment:
      "Clean, organized, and production friendly. The space had everything needed for a smooth shoot.",
  },
];

const FALLBACK_RATING_BREAKDOWN: StudioRatingBreakdown = {
  cleanliness: 5,
  communication: 5,
  checkIn: 5,
};

const BOOKING_INCLUDES = {
  production: ["Photo shoots", "Video shoots", "Product shoots"],
  audio: ["Podcast recording", "Voiceover sessions", "Music content"],
  events: ["Private events", "Brand gatherings", "Launch activations"],
};

const normalizeStudioImageSrc = (src?: string | null) => {
  if (!src) return STUDIO_IMAGE_FALLBACK;
  if (/^https?:\/\//i.test(src)) return src;
  const relativePath = src.replace(/^\/+/, "");
  return S3_PREFIX
    ? `${S3_PREFIX}/${relativePath}`
    : `${STUDIO_ASSET_BASE_URL}/${relativePath}`;
};

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin text-[#E8D1AB]" size={40} />
  </div>
);

const StudioDetailContent = ({ studio }: { studio: StudioCatalogListItem }) => {
  const router = useRouter();
  const detail = studio as StudioDetailExtras;

  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [bookingType, setBookingType] =
    useState<keyof typeof BOOKING_INCLUDES>("production");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullLocation, setShowFullLocation] = useState(false);
  const [showAllAmenitiesModal, setShowAllAmenitiesModal] = useState(false);

  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio.image, ...(studio.images || [])].forEach((image) => {
      if (image) imageSet.add(normalizeStudioImageSrc(image));
    });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);

  const location = studio.location || DEFAULT_DISPLAY_ADDRESS;
  const minimumBookingHours = studio.minimumBookingHours || 2;
  const propertyType = studio.propertyType || studio.poolType || "Studio";
  const operatingHours =
    studio.operatingHours || studio.weeklySchedule || "Inquire for hours";
  const amenities = studio.amenities?.length ? studio.amenities : FALLBACK_AMENITIES;
  const rules = studio.rules?.length ? studio.rules : FALLBACK_RULES;
  const safetyRules = detail.safetyRules?.length
    ? detail.safetyRules
    : ["Host Rules", "Cleaning Protocol", "Cancellation Policy"];
  const userReviews = detail.userReviews?.length ? detail.userReviews : FALLBACK_REVIEWS;
  const ratingBreakdown = detail.ratingBreakdown || FALLBACK_RATING_BREAKDOWN;
  const hostName = detail.hostName || "Beige Studio Host";
  const hostAvatar = detail.hostAvatar || "/images/crew/CREW(5).png";
  const guestsCount = detail.guestsCount || 2;
  const bedsCount = studio.beds || 1;
  const bathsCount = studio.baths || 1;
  const reviewCount = detail.reviewsCount || studio.reviews || userReviews.length;
  const priceValue = studio.priceValue || 0;

  const studioMeta = [
    studio.size,
    studio.beds ? `${studio.beds} bed${studio.beds > 1 ? "s" : ""}` : null,
    studio.baths ? `${studio.baths} bath${studio.baths > 1 ? "s" : ""}` : null,
    propertyType,
    studio.pricingMode,
  ].filter(Boolean);

  const operatingDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => ({ day, hours: operatingHours }));

  return (
    <div className="relative pt-24 lg:pt-32 pb-24 text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-full border border-zinc-800 hover:bg-zinc-900 text-white transition-colors">
              <Share2 size={18} />
            </button>
            <button className="p-2.5 rounded-full border border-zinc-800 hover:bg-zinc-900 text-white transition-colors">
              <Heart size={18} />
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl lg:text-[44px] font-bold leading-tight text-white mb-4">
            <span className="text-[#E8D1AB]">{studio.name}</span>
            {studioMeta.length > 0 && (
              <span className="text-white/40 font-normal">
                {" "}
                ({studioMeta.join(" / ")})
              </span>
            )}
          </h1>
          <div className="flex items-center justify-between gap-4 text-xs lg:text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <MapPin size={16} className="text-[#E8D1AB]" />
              <span className="underline underline-offset-4 decoration-white/20">
                {location}
              </span>
            </div>
            <button className="flex items-center gap-1 text-white font-medium">
              <ExternalLink size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="mb-10 grid h-[320px] md:h-[500px] grid-cols-1 md:grid-cols-12 gap-2 overflow-hidden rounded-3xl">
          <div
            className="relative md:col-span-6 h-full w-full cursor-pointer bg-zinc-900 group overflow-hidden rounded-xl"
            onClick={() => setActiveImageIndex(0)}
          >
            <Image
              src={galleryImages[0]}
              alt="Main studio photo"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
          <div className="hidden md:col-span-6 md:grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="relative cursor-pointer bg-zinc-900 overflow-hidden group rounded-xl"
                onClick={() => setActiveImageIndex(Math.min(idx, galleryImages.length - 1))}
              >
                <Image
                  src={galleryImages[idx] || galleryImages[0]}
                  alt={`Studio grid image ${idx}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {idx === 4 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveImageIndex(0);
                    }}
                    className="absolute bottom-4 right-4 bg-white/95 text-black hover:bg-white px-4 py-2 rounded-lg font-medium text-xs lg:text-sm flex items-center gap-2 shadow-xl backdrop-blur-sm transition-all"
                  >
                    <LayoutGrid size={18} /> Show all photos
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="text-white flex justify-between items-start gap-4">
              <div>
                <h2 className="text-lg lg:text-2xl font-medium mb-1">
                  Production space hosted by {hostName}
                </h2>
                <p className="text-xs lg:text-sm text-white/70">
                  {guestsCount} guests - {bedsCount} bed - {bathsCount} bath
                </p>
              </div>
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                <Image src={hostAvatar} alt={hostName} fill className="object-cover" />
              </div>
            </div>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section className="space-y-4">
              <h3 className="text-lg lg:text-2xl font-medium text-white">Booking For</h3>
              <div className="grid grid-cols-3 p-1.5 bg-[#171717] border border-white/40 rounded-2xl w-full">
                {[
                  { key: "production", label: "Production", icon: Clapperboard },
                  { key: "audio", label: "Audio", icon: Mic },
                  { key: "events", label: "Events", icon: PartyPopper },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setBookingType(key as keyof typeof BOOKING_INCLUDES)}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs lg:text-lg transition-all ${
                      bookingType === key
                        ? "bg-[#E8D1AB] text-black"
                        : "text-[#8B8B8B] hover:text-white"
                    }`}
                  >
                    <Icon size={24} strokeWidth={1.2} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-base lg:text-xl text-[#E8D1AB] font-medium mb-3">
                  {bookingType[0].toUpperCase() + bookingType.slice(1)} Includes
                </p>
                <div className="flex flex-wrap gap-6 text-xs lg:text-sm text-[#A9A9A9]">
                  {BOOKING_INCLUDES[bookingType].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check size={22} className="text-white" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section className="text-white space-y-6">
              <div className="flex items-start gap-4">
                <Home size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Private production space</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">
                    Reserved for your approved booking window.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Sparkles size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Production-ready</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">
                    Designed for shoots, content creation, campaigns, and meetings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <DoorClosed size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Catalog synced</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">
                    Studio details, pricing, and booking rules load from the live catalog.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CalendarDays size={22} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm lg:text-base">Hourly booking</h4>
                  <p className="text-xs lg:text-sm text-[#8B8B8B]">
                    {minimumBookingHours}-hour minimum booking - {operatingHours}
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section className="space-y-3">
              <p
                className={`text-white text-sm lg:text-base leading-relaxed ${
                  !showFullDescription ? "line-clamp-3" : ""
                }`}
              >
                {studio.description ||
                  studio.short_description ||
                  "Explore this studio's live catalog listing for booking details, images, and usage guidance."}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-white font-medium underline underline-offset-2 text-xs lg:text-sm flex items-center gap-1 hover:text-white mt-2"
              >
                {showFullDescription ? "Show less" : "Show more"}
                <ChevronRight size={14} className={showFullDescription ? "rotate-90" : ""} />
              </button>
            </section>

            {studio.highlights && studio.highlights.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg lg:text-2xl font-medium text-white">
                  What makes it unique
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studio.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-3 text-zinc-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
                      {highlight}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section>
              <h3 className="text-lg lg:text-2xl font-medium text-white mb-6">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                {amenities.slice(0, 10).map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[#C7C7C7] text-sm lg:text-base">
                    <Check size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAllAmenitiesModal(true)}
                className="px-4 py-2 rounded-lg bg-[#E8D1AB] hover:bg-[#E8D1AB]/80 text-black font-medium text-sm transition-colors"
              >
                Show all {amenities.length} amenities
              </button>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section>
              <h3 className="text-lg lg:text-2xl font-medium text-white mb-6">
                Operating Hours
              </h3>
              <div className="bg-[#171717] rounded-xl p-4 lg:p-8 max-w-md space-y-4">
                {operatingDays.map((item) => (
                  <div key={item.day} className="flex items-center justify-between gap-4 text-sm lg:text-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-[#14C573] inline-block" />
                      <span className="font-medium text-white">{item.day}</span>
                    </div>
                    <span className="text-white/60 text-right">{item.hours}</span>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section>
              <h3 className="text-lg lg:text-2xl font-medium text-white mb-6">
                Where you will be
              </h3>
              <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-white mb-4">
                <Image
                  src={galleryImages[0]}
                  alt="Location preview"
                  fill
                  className="object-cover opacity-70 grayscale hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white text-black font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                    <Home size={16} className="text-[#101010]" />
                    Exact location provided after booking
                  </div>
                </div>
              </div>
              <h4 className="text-sm lg:text-lg font-medium text-white mb-2 lg:mb-4">
                {location}
              </h4>
              <p
                className={`text-white/70 text-sm lg:text-base mb-2 lg:mb-4 ${
                  !showFullLocation ? "line-clamp-3" : ""
                }`}
              >
                This studio is listed in the Beige catalog with location and access
                information shared after booking confirmation.
              </p>
              <button
                onClick={() => setShowFullLocation(!showFullLocation)}
                className="text-[#E8D1AB] font-medium underline underline-offset-2 text-xs lg:text-sm flex items-center gap-1 hover:text-[#E8D1AB]/80 mt-2"
              >
                {showFullLocation ? "Show less" : "Show more"}
                <ChevronRight size={14} className={showFullLocation ? "rotate-90" : ""} />
              </button>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Star size={32} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                <h3 className="text-lg lg:text-2xl font-medium text-white">
                  {studio.rating || "5.0"} - {reviewCount} reviews
                </h3>
              </div>
              <div className="flex flex-col gap-4 mb-8 max-w-xl">
                {[
                  ["Cleanliness", ratingBreakdown.cleanliness],
                  ["Communication", ratingBreakdown.communication],
                  ["Check-in", ratingBreakdown.checkIn],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm lg:text-base text-white">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1 bg-[#454545] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8D1AB] w-4/5 rounded-full" />
                      </div>
                      <span className="text-xs">{Number(value).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {userReviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white">
                        <Image
                          src={review.avatar}
                          alt={review.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="font-medium text-white text-sm lg:text-base">
                          {review.name}
                        </h5>
                        <p className="text-xs lg:text-sm text-[#6B7280]">{review.date}</p>
                      </div>
                    </div>
                    <p className="text-white text-sm lg:text-base">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-t my-4 lg:my-7 border-white/20" />

            <section className="space-y-6">
              <h3 className="text-lg lg:text-2xl font-medium text-white">
                Rules & Health Safety Measures
              </h3>
              <HostRulesAccordion rules={rules.length ? rules : safetyRules} defaultOpenAll />
            </section>
          </div>

          <div className="lg:col-span-4">
            <aside className="sticky top-32 bg-[#171717] border border-[#E8D1AB] rounded-2xl p-4 lg:px-8 lg:py-10">
              <div className="flex justify-between items-baseline gap-4 mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg lg:text-3xl font-medium text-[#E8D1AB]">
                    ${priceValue.toLocaleString()}
                  </span>
                  <span className="text-base lg:text-2xl">/ Hour</span>
                </div>
                <div className="flex items-center gap-1 text-sm lg:text-xl font-medium text-white">
                  <Star size={20} className="text-white" />
                  <span>{studio.rating || "4.5"}</span>
                  <span className="text-white underline underline-offset-2 ml-0.5">
                    {reviewCount} reviews
                  </span>
                </div>
              </div>

              <hr className="border-t my-4 lg:my-7 border-white/20" />

              <div className="space-y-4 text-sm lg:text-xl text-[#9A9898]">
                <div className="flex justify-between items-center gap-4">
                  <span>Bills</span>
                  <span>{detail.billsIncluded === false ? "Excluded" : "Included"}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span>Security deposit</span>
                  <span className="text-[#14C573]">
                    ${(detail.securityDeposit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span>Property type</span>
                  <span className="text-right">{propertyType}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span>Minimum booking</span>
                  <span>{minimumBookingHours} hours</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span>Preferred</span>
                  <span>{detail.preferredGuests || "Creators"}</span>
                </div>
              </div>

              <hr className="border-t my-4 lg:my-7 border-white/20" />

              <div className="flex justify-between items-center gap-4 text-sm lg:text-xl text-[#9A9898] font-medium pb-4 lg:pb-7">
                <span>Available</span>
                <span className="text-right">{detail.availableDate || operatingHours}</span>
              </div>

              <Link
                href={`/book-a-studio?studioId=${studio.slug || studio.id}`}
                className="flex h-12 lg:h-14 w-full items-center justify-center rounded-lg bg-[#E8D1AB] text-black font-medium text-sm lg:text-lg hover:bg-[#dfc498] active:scale-[0.98] transition-all"
              >
                Add this Studio
              </Link>
              <p className="text-center text-zinc-500 text-[11px] mt-4 uppercase tracking-widest font-bold">
                Secure checkout via Beige
              </p>
            </aside>
          </div>
        </div>
      </div>

      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[999999] bg-black flex flex-col">
          <div className="flex justify-between items-center p-6 bg-black/50 z-10">
            <span className="text-white/50 text-xs tracking-widest">
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
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev !== null
                    ? (prev - 1 + galleryImages.length) % galleryImages.length
                    : null,
                );
              }}
              className="absolute left-4 z-20 p-4 text-white/40 hover:text-white transition-all active:scale-90"
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
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev !== null ? (prev + 1) % galleryImages.length : null,
                );
              }}
              className="absolute right-4 z-20 p-4 text-white/40 hover:text-white transition-all active:scale-90"
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          </div>

          <div className="w-full bg-black py-8">
            <div className="flex justify-start md:justify-center gap-2 overflow-x-auto px-6 no-scrollbar">
              {galleryImages.map((image, idx) => (
                <button
                  key={image}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border transition-all duration-200 ${
                    activeImageIndex === idx
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

      {showAllAmenitiesModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-white/20 w-full max-w-2xl max-h-[80vh] rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">All Amenities</h3>
              <button
                onClick={() => setShowAllAmenitiesModal(false)}
                className="p-1 text-white hover:text-white/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {amenities.map((item) => (
                <div key={item} className="flex items-center gap-3 text-white text-sm py-1">
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
  const [studio, setStudio] = useState<StudioCatalogListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const slug = String(studioSlug || "");

    const loadStudio = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await studioCatalogApi.getBySlug(slug);
        if (!mounted) return;
        setStudio(result);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load studio details:", err);
        setStudio(null);
        setError("Studio not found");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (slug) {
      loadStudio();
    } else {
      setLoading(false);
      setError("Studio not found");
    }

    return () => {
      mounted = false;
    };
  }, [studioSlug]);

  return (
    <main className="min-h-screen bg-[#101010] text-white selection:bg-[#E8D1AB] selection:text-black">
      <Navbar />
      <Suspense fallback={<LoadingState />}>
        {loading ? (
          <LoadingState />
        ) : studio ? (
          <StudioDetailContent studio={studio} />
        ) : (
          <div className="container mx-auto pt-44 px-4 h-screen text-center">
            <h1 className="text-2xl font-bold mb-4">{error || "Studio not found"}</h1>
            <Link href="/book-a-studio" className="text-[#E8D1AB] underline">
              Return to listings
            </Link>
          </div>
        )}
      </Suspense>
      <Footer />
    </main>
  );
}
