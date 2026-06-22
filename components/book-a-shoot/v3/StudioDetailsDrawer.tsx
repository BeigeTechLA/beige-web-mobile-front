"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Star, ChevronDown, ChevronRight, ChevronLeft, Images, Check, Home, Zap, Lock, Gift } from "lucide-react";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { StudioCatalogItem } from "./studioData";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const STUDIO_IMAGE_FALLBACK = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";

const BOOKING_FOR_TABS = [
  { key: "productions", label: "Production" },
  { key: "audio", label: "Audio" },
  { key: "events", label: "Events" },
];

const PRODUCTION_INCLUDES = ["Photo shoots", "Video shoots", "Product shoots"];

const RULES_ACCORDION = [
  "Host Rules",
  "Cleaning Protocol",
  "Protective Gears",
  "Physical Distance",
  "Signage",
  "Cancellation Policy",
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  default: <Home size={18} strokeWidth={1.5} className="text-white/70 shrink-0" />,
};

interface StudioDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studio: StudioCatalogItem | null;
  onAddStudio?: (studio: StudioCatalogItem) => void;
  isStudioAdded?: boolean;
}

export const StudioDetailsDrawer: React.FC<StudioDetailsDrawerProps> = ({
  isOpen,
  onClose,
  studio,
  onAddStudio,
  isStudioAdded = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activeBookingTab, setActiveBookingTab] = useState("productions");
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio?.image, ...(studio?.images || [])].forEach((img) => { if (img) imageSet.add(img); });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);

  const amenities = Array.isArray(studio?.amenities) && studio.amenities.length
    ? studio.amenities
    : ["Garden view", "Kitchen", "WiFi", "Pets allowed", "Free washer · in building", "Dryer", "Central air conditioning", "Security cameras on property", "Refrigerator", "Bicycles"];

  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 8);

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const reviews = studio?.reviewsList || [
    { name: "Jose", date: "December 2021", text: "Host was very attentive." },
    { name: "Shayna", date: "December 2021", text: "Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed..." },
    { name: "Vladko", date: "November 2020", text: "This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price." },
  ];

  useEffect(() => {
    setMounted(true);
    if (isOpen) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = "auto"; setActiveImageIndex(null); }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  useEffect(() => {
    if (activeImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImageIndex(null);
      if (e.key === "ArrowLeft") setActiveImageIndex(c => c === null ? c : (c - 1 + galleryImages.length) % galleryImages.length);
      if (e.key === "ArrowRight") setActiveImageIndex(c => c === null ? c : (c + 1) % galleryImages.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, galleryImages.length]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999999] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-[860px] h-full bg-[#0D0D0D] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0D0D0D] z-10">
          <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Title */}
          <div className="px-6 lg:px-10 pt-6 pb-4">
            <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
              {studio?.name || "Beige Media (Modern Resort Villa with Jacuzzi)"}
            </h1>
            <p className="text-white/50 text-sm underline underline-offset-2 mt-1">
              {studio?.location || "Woodland Hills, Los Angeles, CA"}
            </p>
          </div>

          {/* Gallery */}
          <div className="px-6 lg:px-10">
            <div className="grid grid-cols-2 gap-2 rounded-[16px] overflow-hidden h-[300px] lg:h-[380px]">
              <button type="button" onClick={() => setActiveImageIndex(0)}
                className="relative h-full w-full hover:opacity-90 transition-opacity">
                <Image src={galleryImages[0]} alt="Studio" fill className="object-cover" />
              </button>
              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                {[1, 2, 3, 4].map((i) => (
                  <button key={i} type="button" onClick={() => setActiveImageIndex(Math.min(i, galleryImages.length - 1))}
                    className="relative w-full h-full hover:opacity-90 transition-opacity">
                    <Image src={galleryImages[i] || galleryImages[0]} alt={`Studio ${i + 1}`} fill className="object-cover" />
                    {i === 3 && (
                      <div className="absolute bottom-3 right-3 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Images size={14} /> Show all photos
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two column layout: Left content + Right price card */}
          <div className="px-6 lg:px-10 mt-8 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

            {/* LEFT */}
            <div className="flex-1 min-w-0">

              {/* Host info */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-white font-semibold text-base">Entire rental unit hosted by Ghazal</h3>
                  <p className="text-white/50 text-sm mt-0.5">2 guests · 3 bedroom · 1 bed · 1 bath</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#E8D1AB] flex items-center justify-center text-black font-bold text-sm shrink-0">G</div>
              </div>

              {/* Booking For */}
              <div className="mb-6">
                <h3 className="text-white font-semibold text-base mb-4">Booking For</h3>
                <div className="flex gap-3">
                  {BOOKING_FOR_TABS.map((tab) => (
                    <button key={tab.key} type="button"
                      onClick={() => setActiveBookingTab(tab.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${activeBookingTab === tab.key ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "border-white/20 text-white/60 hover:border-white/40"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                {activeBookingTab === "productions" && (
                  <div className="mt-4">
                    <p className="text-white/70 text-sm font-medium mb-2">Production Includes</p>
                    <div className="flex flex-wrap gap-4">
                      {PRODUCTION_INCLUDES.map((item) => (
                        <span key={item} className="flex items-center gap-1.5 text-sm text-white/70">
                          <Check size={14} className="text-white" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature list */}
              <div className="flex flex-col gap-5 pb-6 border-b border-white/10 mb-6">
                {[
                  { icon: Home, title: "Entire home", desc: "You'll have the apartment to yourself" },
                  { icon: Zap, title: "Enhanced Clean", desc: <>This Host committed to Beige&apos;s 5-step enhanced cleaning process. <button className="underline font-semibold text-white">Show more</button></> },
                  { icon: Lock, title: "Self check-in", desc: "Check yourself in with the keypad." },
                  { icon: Gift, title: "Free cancellation before Feb 14", desc: null },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <item.icon size={22} strokeWidth={1.5} className="text-white shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      {item.desc && <p className="text-white/50 text-sm mt-0.5 leading-relaxed">{item.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
                  {studio?.description || "A fully equipped production studio in Los Angeles, ideal for photo, video, podcast, and product shoots. The space offers professional lighting, flexible shooting setups, and comfortable crew areas to ensure smooth and efficient production. Conveniently located near parking, cafes, and creative services, this studio is designed to help creators move fast and shoot with confidence."}
                </p>
                <button className="text-white font-semibold text-sm mt-2 flex items-center gap-1 hover:text-[#E8D1AB] transition-colors">
                  Show more <ChevronRight size={14} />
                </button>
              </div>

              {/* What this place offers */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <h3 className="text-white font-bold text-lg mb-5">What this place offers</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                  {visibleAmenities.map((name, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                      <Home size={18} strokeWidth={1.5} className="text-white/60 shrink-0" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
                {amenities.length > 8 && (
                  <button onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="mt-2 border border-white/20 rounded-lg px-4 py-2 text-sm text-white font-medium hover:border-white/40 transition-colors">
                    {showAllAmenities ? "Show less" : `Show all ${amenities.length} amenities`}
                  </button>
                )}
              </div>

              {/* Operating Hours */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <h3 className="text-white font-bold text-lg mb-5">Operating Hours</h3>
                <div className="flex flex-col gap-2">
                  {weekDays.map((day) => (
                    <div key={day} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0" />
                        <span className="text-white text-sm">{day}</span>
                      </div>
                      <span className="text-white/50 text-sm">10:00 am - 10:00 pm</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Where you'll be — Mapbox */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <h3 className="text-white font-bold text-lg mb-5">Where you&apos;ll be</h3>
                <div className="w-full h-[260px] rounded-2xl overflow-hidden relative mb-4">
                  {MAPBOX_TOKEN ? (
                    <Map
                      initialViewState={{ longitude: studio?.lng || -118.6048, latitude: studio?.lat || 34.1683, zoom: 12 }}
                      interactive={false}
                      style={{ width: "100%", height: "100%" }}
                      mapStyle="mapbox://styles/mapbox/dark-v11"
                      mapboxAccessToken={MAPBOX_TOKEN}
                    >
                      <Marker longitude={studio?.lng || -118.6048} latitude={studio?.lat || 34.1683}>
                        <div className="relative">
                          <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-30 bg-[#E8D1AB]" />
                          <div className="p-1.5 rounded-full bg-[#E8D1AB] border-2 border-[#111]">
                            <div className="w-3 h-3 rounded-full bg-black" />
                          </div>
                        </div>
                      </Marker>
                    </Map>
                  ) : (
                    <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                      <span className="text-white/40 text-sm">Map unavailable</span>
                    </div>
                  )}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-8 pointer-events-none">
                    <span className="bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap block">
                      Exact location provided after booking
                    </span>
                  </div>
                </div>
                <h4 className="text-white font-semibold text-sm mb-1">{studio?.location || "Woodland Hills, Los Angeles, CA"}</h4>
                <p className="text-white/50 text-sm leading-relaxed mb-2">
                  Very dynamic and appreciated district. Home to many historical monuments and cultural sites.
                </p>
                <button className="text-white font-semibold text-sm flex items-center gap-1 hover:text-[#E8D1AB] transition-colors">
                  Show more <ChevronRight size={14} />
                </button>
              </div>

              {/* Reviews */}
              <div className="pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={18} className="text-[#E8D1AB] fill-[#E8D1AB]" />
                  <span className="text-white font-bold text-base">{studio?.rating || "5.0"} · {studio?.reviews || 7} reviews</span>
                </div>
                {/* Rating bars */}
                <div className="flex flex-col gap-2 mb-6">
                  {["Cleanliness", "Communication", "Check-in"].map((label) => (
                    <div key={label} className="flex items-center gap-4">
                      <span className="text-white/60 text-sm w-28 shrink-0">{label}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full">
                        <div className="h-full bg-white rounded-full w-full" />
                      </div>
                      <span className="text-white/60 text-sm w-6">5.0</span>
                    </div>
                  ))}
                </div>
                {/* Review cards */}
                <div className="flex flex-col gap-6">
                  {reviews.map((review, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {review.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{review.name}</p>
                          <p className="text-white/40 text-xs">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{review.text}</p>
                      {i === 1 && <button className="text-white font-semibold text-sm mt-1 flex items-center gap-1">Show more <ChevronRight size={13} /></button>}
                    </div>
                  ))}
                </div>
                <button className="mt-6 border border-white/20 rounded-lg px-5 py-2.5 text-sm text-white font-medium hover:border-white/40 transition-colors">
                  Show all {studio?.reviews || 12} reviews
                </button>
              </div>

              {/* Rules & Health Safety */}
              <div className="pb-10">
                <h3 className="text-white font-bold text-lg mb-5">Rules & Health Safety Measures</h3>
                <div className="flex flex-col">
                  {RULES_ACCORDION.map((rule) => (
                    <button key={rule} type="button"
                      onClick={() => setOpenAccordion(openAccordion === rule ? null : rule)}
                      className="flex items-center justify-between py-4 border-b border-white/10 text-white text-sm font-medium hover:text-[#E8D1AB] transition-colors text-left">
                      <span>{rule}</span>
                      <ChevronRight size={16} className="text-white/40 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT — Price Card (sticky) */}
            <div className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-6">
              <div className="border border-white/10 rounded-2xl bg-[#151515] p-5">
                {/* Price + rating */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">${studio?.pricePerHour || 150}</span>
                    <span className="text-white/50 text-sm"> / Hour</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-white/70">
                    <Star size={14} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                    <span>{studio?.rating || "4.5"}</span>
                    <span className="underline ml-1">{studio?.reviews || 7} reviews</span>
                  </div>
                </div>

                {/* Details table */}
                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mb-4">
                  {[
                    { label: "Bills", value: "Include" },
                    { label: "Security deposited", value: "$800", highlight: true },
                    { label: "Property type", value: "Apartment" },
                    { label: "Room furnishing", value: "Furnished" },
                    { label: "Profred", value: "Females" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-white/50">{row.label}</span>
                      <span className={row.highlight ? "text-[#34C759] font-medium" : "text-white"}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-sm border-t border-white/10 pt-4 mb-5">
                  <span className="text-white/50">Available</span>
                  <span className="text-white font-medium">Jan 06, 2026</span>
                </div>

                {/* Add this Studio button */}
                <button
                  type="button"
                  onClick={() => onAddStudio?.(studio!)}
                  className={`w-full h-11 rounded-xl font-semibold text-sm transition-all ${isStudioAdded ? "bg-[#FFD6D6] text-[#FF4545] hover:bg-[#ffc2c2]" : "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"}`}
                >
                  {isStudioAdded ? "Remove Studio" : "Add this Studio"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Full screen gallery */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[100000000] bg-black/95 flex flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <span className="text-sm font-semibold text-white/80">{activeImageIndex + 1} / {galleryImages.length}</span>
            <button type="button" onClick={() => setActiveImageIndex(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white">
              <X size={22} />
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={galleryImages[activeImageIndex]} alt="Studio" fill className="object-contain" sizes="100vw" />
            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={() => setActiveImageIndex(c => c === null ? c : (c - 1 + galleryImages.length) % galleryImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
                  <ChevronLeft size={28} />
                </button>
                <button type="button" onClick={() => setActiveImageIndex(c => c === null ? c : (c + 1) % galleryImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
          <div className="flex h-24 shrink-0 gap-2 overflow-x-auto border-t border-white/10 p-3">
            {galleryImages.map((img, i) => (
              <button key={i} type="button" onClick={() => setActiveImageIndex(i)}
                className={`relative h-full w-24 shrink-0 overflow-hidden rounded-md border transition-colors ${activeImageIndex === i ? "border-[#E8D1AB]" : "border-white/10"}`}>
                <Image src={img} alt={`thumb ${i}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};