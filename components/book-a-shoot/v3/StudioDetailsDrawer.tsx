"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Home, Star, CalendarDays, ChevronDown, MapPin, ChevronLeft, ChevronRight, Images } from "lucide-react";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { StudioCatalogItem } from "./studioData";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const STUDIO_IMAGE_FALLBACK = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";

interface StudioDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studio: StudioCatalogItem | null;
}

export const StudioDetailsDrawer: React.FC<StudioDetailsDrawerProps> = ({
  isOpen,
  onClose,
  studio,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio?.image, ...(studio?.images || [])].forEach((image) => {
      if (image) imageSet.add(image);
    });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);
  const amenities = Array.isArray(studio?.amenities) && studio.amenities.length
    ? studio.amenities
    : ["Natural light", "High-speed WiFi", "Production-friendly layout", "Furniture and decor included"];
  const rules = Array.isArray(studio?.rules) && studio.rules.length
    ? studio.rules
    : ["Minimum booking is 2 hours", "Setup and breakdown must be included in the reservation", "Guests must respect the property"];
  const studioMeta = [
    studio?.beds ? `${studio.beds} bedroom${studio.beds > 1 ? "s" : ""}` : null,
    studio?.baths ? `${studio.baths} bath${studio.baths > 1 ? "s" : ""}` : null,
    studio?.size,
    studio?.poolType,
  ].filter(Boolean);
  const ratingText = studio?.rating
    ? `${studio.rating} Stars${studio.reviews ? ` (${studio.reviews} ${studio.reviews === 1 ? "Rating" : "Ratings"})` : ""}`
    : null;

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setActiveImageIndex(null);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) =>
          current === null ? current : (current - 1 + galleryImages.length) % galleryImages.length,
        );
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) =>
          current === null ? current : (current + 1) % galleryImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, galleryImages.length]);

  if (!mounted || !isOpen) return null;

  const showPreviousImage = () => {
    setActiveImageIndex((current) =>
      current === null ? current : (current - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex((current) =>
      current === null ? current : (current + 1) % galleryImages.length,
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999999] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-[900px] h-full bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0A0A0A] z-10 sticky top-0">
          <h2 className="text-xl font-bold text-white tracking-tight">Studio Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full p-6 lg:p-10 no-scrollbar relative">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-[32px] font-bold text-[#E8D1AB] mb-2 leading-tight">
                {studio?.name || "Beige Palm Desert Golf"} 
                {studioMeta.length > 0 && (
                  <span className="text-white/60 font-normal"> ({studioMeta.join(" / ")})</span>
                )}
              </h1>
              <p className="text-white/60 text-sm underline decoration-white/30 underline-offset-4">{studio?.location || "Woodland Hills, Los Angeles, CA"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-[24px] overflow-hidden mb-12 h-[350px] lg:h-[400px]">
            <button
              type="button"
              onClick={() => setActiveImageIndex(0)}
              className="relative h-full w-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer"
            >
               <Image src={galleryImages[0]} alt={`${studio?.name || "Studio"} photo 1`} fill className="object-cover" />
            </button>
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full relative border-l-2 border-[#0A0A0A]">
               {[1, 2, 3, 4].map((imageIndex) => (
                 <button
                   key={imageIndex}
                   type="button"
                   onClick={() => setActiveImageIndex(Math.min(imageIndex, galleryImages.length - 1))}
                   className="relative w-full h-full bg-white/5 hover:opacity-90 transition-opacity cursor-pointer"
                 >
                   <Image
                     src={galleryImages[imageIndex] || galleryImages[0]}
                     alt={`${studio?.name || "Studio"} photo ${imageIndex + 1}`}
                     fill
                     className="object-cover"
                   />
                   {imageIndex === 4 && (
                     <div className="absolute bottom-4 right-4 bg-white text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-2xl">
                       <Images size={16} /> {galleryImages.length} photos
                     </div>
                   )}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 border-b border-white/10 pb-8 mb-8">
            {[
              { icon: Home, title: "Private production space", desc: "Reserved for your approved booking window." },
              { icon: Star, title: ratingText || "Production-ready", desc: ratingText ? "Reviews / Ratings from the studio details document." : "Designed for shoots, content creation, campaigns, and meetings." },
              { icon: CalendarDays, title: "Hourly booking", desc: `${studio?.minimumBookingHours || 2}-hour minimum booking${studio?.operatingHours ? ` • ${studio.operatingHours}` : ""}` }
            ].map((amenity, i) => (
              <div key={i} className="flex gap-5 items-start">
                 <amenity.icon size={26} strokeWidth={1.5} className="text-white shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-white font-bold text-base">{amenity.title}</h4>
                   {amenity.desc && (
                     <p className="text-white/60 text-[15px] mt-1 leading-relaxed">
                       {amenity.title === "Enhanced Clean" ? (
                         <>This Host committed to Beige&apos;s 5-step enhanced cleaning process. <button className="font-bold underline text-white hover:text-[#E8D1AB] transition-colors ml-1">Show more</button></>
                       ) : amenity.desc}
                     </p>
                   )}
                 </div>
              </div>
            ))}
          </div>

          <div className="border-b border-white/10 pb-8 mb-8">
            <p className="text-white/70 leading-relaxed text-[15px]">
              {studio?.description || "A fully equipped Beige studio ideal for photo, video, podcast, product, campaign, and social content shoots."}
            </p>
            {studio?.highlights && studio.highlights.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-4">What makes it unique</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studio.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-3 text-sm text-white/75">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8D1AB]" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {studio?.pricingOptions && studio.pricingOptions.length > 0 && (
            <div className="border-b border-white/10 pb-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {studio.pricingOptions.map((option) => (
                  <div key={option.key} className="rounded-2xl border border-white/10 bg-[#151515] p-5">
                    <div className="text-white font-bold">{option.label}</div>
                    <div className="mt-2 text-2xl font-bold text-[#E8D1AB]">${option.hourlyRate.toLocaleString()}/hour</div>
                    <div className="mt-2 text-xs text-white/55">
                      {option.minimumHours}-hour minimum{option.cleaningFee ? ` • $${option.cleaningFee.toLocaleString()} cleaning fee` : ""}
                    </div>
                    {option.startingAt && (
                      <div className="mt-2 text-xs font-semibold text-white/70">Starting at ${option.startingAt.toLocaleString()}</div>
                    )}
                    {option.includes && option.includes.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="text-xs font-bold uppercase text-white/40">Includes</div>
                        <div className="mt-2 space-y-1.5">
                          {option.includes.map((item) => (
                            <div key={item} className="text-xs text-white/65">{item}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="text-xs font-bold uppercase text-white/40">Ideal for</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {option.idealFor.map((item) => (
                          <span key={item} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studio?.bestFor && studio.bestFor.length > 0 && (
            <div className="border-b border-white/10 pb-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Best Suited For</h3>
              <div className="flex flex-wrap gap-2">
                {studio.bestFor.map((item) => (
                  <span key={item} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* What this place offers */}
          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mb-10">
              {amenities.map((name, i) => (
                 <div key={i} className="flex items-center gap-4 text-white/80 text-[15px]">
                   <Home size={22} strokeWidth={1.5} className="text-white/70 shrink-0" />
                   <span>{name}</span>
                 </div>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="border-b border-white/10 pb-12 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Operating Hours</h3>
            <div className="bg-[#151515] rounded-[24px] p-6 lg:p-8 max-w-md border border-white/5 shadow-xl">
              {['Operating Hours', 'Weekly Schedule', 'Minimum Booking Hours'].map((label) => (
                <div key={label} className="flex justify-between items-center mb-4 last:mb-0 pb-4 last:pb-0 border-white/5 border-b last:border-b-0 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                    <span className="text-white font-medium text-[15px]">{label}</span>
                  </div>
                  <span className="text-white/60 text-sm font-medium text-right">
                    {label === "Operating Hours"
                      ? studio?.operatingHours || "Available by booking"
                      : label === "Weekly Schedule"
                        ? studio?.weeklySchedule || "Available by booking"
                        : `${studio?.minimumBookingHours || 2} Hours`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Where you'll be */}
          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Where you&apos;ll be</h3>
            {/* <div className="w-full h-[350px] bg-[#111111] rounded-3xl relative overflow-hidden mb-6 flex items-center justify-center border border-white/10 group cursor-pointer">
               {MAPBOX_TOKEN ? (
                 <Map
                   initialViewState={{
                     longitude: -118.6048,
                     latitude: 34.1683,
                     zoom: 12
                   }}
                   interactive={false}
                   style={{ width: '100%', height: '100%' }}
                   mapStyle="mapbox://styles/mapbox/dark-v11"
                   mapboxAccessToken={MAPBOX_TOKEN}
                 >
                   <Marker longitude={-118.6048} latitude={34.1683}>
                     <div className="relative">
                       <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping opacity-30 bg-[#E8D1AB]" />
                       <div className="relative p-1.5 rounded-full shadow-lg border-2 bg-[#E8D1AB] border-[#111111]">
                         <MapPin size={16} className="text-[#1A1A1A]" />
                       </div>
                     </div>
                   </Marker>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-12 pointer-events-none">
                     <span className="text-white font-bold text-sm text-center bg-white/10 px-6 py-3 rounded-xl shadow-2xl border border-white/20 backdrop-blur-xl block whitespace-nowrap">
                       Exact location provided after booking
                     </span>
                   </div>
                 </Map>
               ) : (
                 <>
                   <div className="absolute inset-0 bg-[#E8D1AB]/5 flex items-center justify-center bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/b0/OpenStreetMap_default_map_of_central_London.png')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity blur-[1px]"></div>
                   <span className="text-white font-bold text-sm text-center bg-white/10 px-6 py-3 rounded-xl relative z-10 backdrop-blur-xl shadow-2xl border border-white/20">Exact location provided after booking</span>
                 </>
               )}
            </div> */}
            <h4 className="text-white font-bold text-lg mb-2">{studio?.location || "Los Angeles, CA"}</h4>
            <p className="text-white/60 text-[15px] leading-relaxed mb-4">
              Studio address and arrival details are confirmed with the booking.
            </p>
            <button className="text-white font-bold underline text-[15px] flex items-center gap-1 hover:text-[#E8D1AB] transition-colors">
              Show more <ChevronDown size={14} className="rotate-[-90deg]" />
            </button>
          </div>

          <div className="border-b border-white/10 pb-10 mb-8">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
              <Star className="text-[#E8D1AB] fill-[#E8D1AB]" size={24} /> House Rules
            </h3>
            
            <div className="max-w-2xl flex flex-col gap-4 mb-10">
              {rules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 text-white/75 text-[15px]">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E8D1AB] shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[100000000] bg-black/95 flex flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 lg:px-6">
            <div className="text-sm font-semibold text-white/80">
              {activeImageIndex + 1} / {galleryImages.length}
            </div>
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors"
              aria-label="Close gallery"
            >
              <X size={22} />
            </button>
          </div>

          <div className="relative flex-1">
            <Image
              src={galleryImages[activeImageIndex]}
              alt={`${studio?.name || "Studio"} photo ${activeImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 lg:left-6"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 lg:right-6"
                  aria-label="Next photo"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex h-24 shrink-0 gap-2 overflow-x-auto border-t border-white/10 p-3">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-full w-24 shrink-0 overflow-hidden rounded-md border transition-colors ${
                    activeImageIndex === index ? "border-[#E8D1AB]" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image src={image} alt={`${studio?.name || "Studio"} thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
