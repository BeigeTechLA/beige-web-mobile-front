"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Loader2, ChevronRight, ExternalLink, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";

import StudioImages from "../components/StudioImages";
import StudioBookingSidebar from "../components/StudioBookingCard";
import Image from "next/image";
import { ReviewsComponent } from "@/components/admin/studios/StudioReviews";
import HostRulesAccordion from "../components/HostRulesAccordion";
import { getStudioBySlug } from "@/components/book-a-shoot/v3/studioData";

const PUBLIC_STUDIO_LOCATION = "Los Angeles, California, USA";

function StudioDetailContent() {
  const router = useRouter();

  // Updated state to handle dynamic project categories
  const [isLoading] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);


  const params = useParams();
  const studioSlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const studio = useMemo(() => getStudioBySlug(String(studioSlug || "")), [studioSlug]);
  const studioImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio?.image, ...(studio?.images || [])].forEach((image) => {
      if (image) imageSet.add(image);
    });
    return Array.from(imageSet);
  }, [studio]);
  const description = studio?.description || "";
  const address = PUBLIC_STUDIO_LOCATION;
  const amenityLabels = studio?.amenities?.length
    ? studio.amenities
    : ["Natural light", "High-speed WiFi", "Production-friendly layout", "Furniture and decor included"];
  const visibleAmenities = isAmenitiesExpanded ? amenityLabels : amenityLabels.slice(0, 10);
  const pricingOptions = studio?.pricingOptions || [];
  const studioHighlights = studio?.highlights?.length
    ? studio.highlights
    : [
        "Private production space reserved for your approved booking window.",
        "Designed for shoots, content creation, campaigns, and meetings.",
        `${studio?.minimumBookingHours || 2}-hour minimum booking.`,
      ];
  const studioMeta = [
    studio?.beds ? `${studio.beds} bedroom${studio.beds > 1 ? "s" : ""}` : null,
    studio?.baths ? `${studio.baths} bath${studio.baths > 1 ? "s" : ""}` : null,
    studio?.size,
    studio?.poolType,
  ].filter(Boolean);

  const isLongComment = description.length > 250;
  const isLongAddress = address.length > 200;

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

  if (!studio) {
    return (
      <div className="relative pt-24 lg:pt-44 pb-8 lg:pb-16 min-h-screen flex flex-col items-center">
        <div className="container relative z-10 mx-auto">
          <Button
            onClick={handleBack}
            className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-8">
            <h1 className="text-2xl font-semibold text-white">Studio not found</h1>
            <p className="mt-2 text-white/60">This studio link does not match an available Beige studio.</p>
          </div>
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
              {studio.name}
            </p>
            <p className="text-[#FFFFFFAD] text-xs lg:text-sm underline underline-offset-2">
              {PUBLIC_STUDIO_LOCATION}
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
                    {studio.poolType} hosted by Beige Studios
                  </p>
                  <div className="flex gap-3">
                    {
                      (studioMeta.length ? studioMeta : ["Private production space", `${studio.minimumBookingHours || 2} hour minimum`]).map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <p key={idx} className={`text-xs lg:text-sm text-[#FFF]`}>
                            {item}
                          </p>
                          {
                            idx !== (studioMeta.length ? studioMeta.length - 1 : 1) && <span className={`text-xs lg:text-sm text-[#FFF]`}>
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

              {/* Pricing */}
              <div className="space-y-4 lg:space-y-6">
                <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Booking Options
                </h2>
                {pricingOptions.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pricingOptions.map((option) => (
                      <div key={option.key} className="rounded-2xl border border-white/10 bg-[#171717] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base lg:text-lg font-semibold text-white">{option.label}</h3>
                            <p className="mt-2 text-2xl font-semibold text-[#E8D1AB]">
                              ${option.hourlyRate.toLocaleString()}/hour
                            </p>
                          </div>
                          {option.startingAt && (
                            <span className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                              From ${option.startingAt.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-white/55">
                          {option.minimumHours}-hour minimum{option.cleaningFee ? ` • $${option.cleaningFee.toLocaleString()} cleaning fee` : ""}
                        </p>
                        {option.includes && option.includes.length > 0 && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-xs font-semibold uppercase text-white/40">Includes</p>
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {option.includes.map((item) => (
                                <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                                  <Check size={16} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-5 border-t border-white/10 pt-4">
                          <p className="text-xs font-semibold uppercase text-white/40">Ideal for</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {option.idealFor.map((item) => (
                              <span key={item} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#171717] p-5">
                    <p className="text-2xl font-semibold text-[#E8D1AB]">{studio.priceLabel}</p>
                    <p className="mt-2 text-sm text-white/55">{studio.minimumBookingHours || 2}-hour minimum booking</p>
                  </div>
                )}
              </div>
              <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />

              {/* Highlights */}
              <div className={`space-y-4 text-white`}>
                <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Studio Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studioHighlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-3 text-sm lg:text-base text-white/75">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8D1AB]" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
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

              {studio.bestFor && studio.bestFor.length > 0 && (
                <>
                  <div className="space-y-4 lg:space-y-6">
                    <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                      Best Suited For
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {studio.bestFor.map((item) => (
                        <span key={item} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <hr className={`border-t my-4 lg:my-9 border-[#FFFFFF33]`} />
                </>
              )}


              {/* What this place offers */}
              <div className={`space-y-4 lg:space-y-8`}>
                <h2 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  What this place offers
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-10">
                  {visibleAmenities.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <Check
                        size={24}
                        strokeWidth={1.5}
                        className={`text-[#C7C7C7]`}
                      />
                      <span className="text-base font-normal">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]`}>
                  {isAmenitiesExpanded ? "Show less" : `Show all ${amenityLabels.length} amenities`}
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
                    {[
                      ["Operating Hours", studio.operatingHours || "Available by booking"],
                      ["Weekly Schedule", studio.weeklySchedule || "Available by booking"],
                      ["Minimum Booking", `${studio.minimumBookingHours || 2} hours`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-[#14C573] shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                          <span className="lg:text-lg font-medium tracking-tight">{label}</span>
                        </div>
                        <div className={`lg:text-lg text-[#FFFFFF99] text-right`}>{value}</div>
                      </div>
                    ))}
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
              <p className="lg:text-lg font-medium">
                {PUBLIC_STUDIO_LOCATION}
              </p>

              <p className={`text-sm lg:text-base leading-relaxed text-[#FFFFFFAD] ${!isAddressExpanded && isLongAddress ? 'line-clamp-2' : ''}`}>
                Exact arrival details are confirmed with the booking.
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
              <HostRulesAccordion rules={studio.rules} defaultOpenAll />
            </div>

          </div>

          {/* Right Column */}
          <div className="col-span-4 w-full">
            {/* Basic infor: Add card */}
            <StudioBookingSidebar
              price={studio.priceValue || studio.pricingOptions?.[0]?.hourlyRate}
              rating={studio.rating}
              reviews={studio.reviews}
              propertyType={studio.poolType}
              minimumHours={studio.minimumBookingHours}
              operatingHours={studio.operatingHours || studio.weeklySchedule}
            />
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
