"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Home, Images, MapPin, Star, X } from "lucide-react";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { HOURLY_STUDIO_LIST, type StudioCatalogItem } from "@/components/book-a-shoot/v3/studioData";

const STUDIO_IMAGE_FALLBACK = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";
const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";

const getStudioBySlug = (slug: string) => {
  const direct = HOURLY_STUDIO_LIST.find((studio) => studio.id === slug);
  if (direct) return direct;

  const numericIndex = Number(slug);
  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return HOURLY_STUDIO_LIST[numericIndex - 1];
  }

  return undefined;
};

const StudioDetailContent = ({ studio }: { studio: StudioCatalogItem }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio.image, ...(studio.images || [])].forEach((image) => {
      if (image) imageSet.add(image);
    });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);

  const amenities = studio.amenities?.length
    ? studio.amenities
    : ["Natural light", "High-speed WiFi", "Production-friendly layout", "Furniture and decor included"];
  const rules = studio.rules?.length
    ? studio.rules
    : ["Minimum booking is 2 hours", "Setup and breakdown must be included in the reservation", "Guests must respect the property"];
  const studioMeta = [
    studio.beds ? `${studio.beds} bedroom${studio.beds > 1 ? "s" : ""}` : null,
    studio.baths ? `${studio.baths} bath${studio.baths > 1 ? "s" : ""}` : null,
    studio.size,
    studio.poolType,
  ].filter(Boolean);
  const ratingText = studio.rating
    ? `${studio.rating} Stars${studio.reviews ? ` (${studio.reviews} ${studio.reviews === 1 ? "Rating" : "Ratings"})` : ""}`
    : null;

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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-[#E8D1AB] lg:text-[44px]">
          {studio.name}
          {studioMeta.length > 0 && (
            <span className="text-white/60 font-normal"> ({studioMeta.join(" / ")})</span>
          )}
        </h1>
        <p className="mt-3 text-sm text-white/60 underline decoration-white/30 underline-offset-4">
          {DEFAULT_DISPLAY_ADDRESS}
        </p>
      </div>

      <div className="mb-12 grid h-[320px] grid-cols-1 overflow-hidden rounded-[24px] md:h-[460px] md:grid-cols-2 md:gap-2">
        <button
          type="button"
          onClick={() => setActiveImageIndex(0)}
          className="relative h-full w-full bg-white/5 transition-opacity hover:opacity-90"
        >
          <Image src={galleryImages[0]} alt={`${studio.name} photo 1`} fill className="object-cover" priority />
        </button>
        <div className="hidden h-full grid-cols-2 grid-rows-2 gap-2 md:grid">
          {[1, 2, 3, 4].map((imageIndex) => (
            <button
              key={imageIndex}
              type="button"
              onClick={() => setActiveImageIndex(Math.min(imageIndex, galleryImages.length - 1))}
              className="relative h-full w-full bg-white/5 transition-opacity hover:opacity-90"
            >
              <Image
                src={galleryImages[imageIndex] || galleryImages[0]}
                alt={`${studio.name} photo ${imageIndex + 1}`}
                fill
                className="object-cover"
              />
              {imageIndex === 4 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-black shadow-2xl">
                  <Images size={16} /> {galleryImages.length} photos
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <section className="mb-8 border-b border-white/10 pb-8">
            <div className="flex flex-col gap-6">
              {[
                { icon: Home, title: "Private production space", desc: "Reserved for your approved booking window." },
                { icon: Star, title: ratingText || "Production-ready", desc: ratingText || "Designed for shoots, content creation, campaigns, and meetings." },
                { icon: CalendarDays, title: "Hourly booking", desc: `${studio.minimumBookingHours || 2}-hour minimum booking${studio.operatingHours ? ` • ${studio.operatingHours}` : ""}` },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-5">
                  <item.icon size={26} strokeWidth={1.5} className="mt-0.5 shrink-0 text-white" />
                  <div>
                    <h2 className="font-bold text-white">{item.title}</h2>
                    <p className="mt-1 text-[15px] leading-relaxed text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 border-b border-white/10 pb-8">
            <p className="text-[15px] leading-relaxed text-white/70">{studio.description}</p>
            {studio.highlights && studio.highlights.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-4 text-lg font-bold text-white">What makes it unique</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {studio.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-3 text-sm text-white/75">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8D1AB]" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {studio.pricingOptions && studio.pricingOptions.length > 0 && (
            <section className="mb-8 border-b border-white/10 pb-10">
              <h2 className="mb-6 text-2xl font-bold text-white">Pricing</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {studio.pricingOptions.map((option) => (
                  <div key={option.key} className="rounded-2xl border border-white/10 bg-[#151515] p-5">
                    <div className="font-bold text-white">{option.label}</div>
                    <div className="mt-2 text-2xl font-bold text-[#E8D1AB]">${option.hourlyRate.toLocaleString()}/hour</div>
                    <div className="mt-2 text-xs text-white/55">
                      {option.minimumHours}-hour minimum{option.cleaningFee ? ` • $${option.cleaningFee.toLocaleString()} cleaning fee` : ""}
                    </div>
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
            </section>
          )}

          <section className="mb-8 border-b border-white/10 pb-10">
            <h2 className="mb-6 text-2xl font-bold text-white">What this place offers</h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {amenities.map((name) => (
                <div key={name} className="flex items-center gap-4 text-[15px] text-white/80">
                  <Home size={22} strokeWidth={1.5} className="shrink-0 text-white/70" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 border-b border-white/10 pb-10">
            <h2 className="mb-6 text-2xl font-bold text-white">Where you&apos;ll be</h2>
            <div className="flex items-center gap-2 text-white">
              <MapPin size={18} className="text-[#E8D1AB]" />
              <span>{DEFAULT_DISPLAY_ADDRESS}</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">
              Studio address and arrival details are confirmed with the booking.
            </p>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
              <Star className="fill-[#E8D1AB] text-[#E8D1AB]" size={24} /> House Rules
            </h2>
            <div className="flex max-w-2xl flex-col gap-4">
              {rules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 text-[15px] text-white/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8D1AB]" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-[24px] border border-[#E8D1AB] bg-[#171717] p-6 lg:sticky lg:top-28">
          <div className="flex items-baseline gap-1 text-[#E8D1AB]">
            <span className="text-3xl font-semibold">${(studio.priceValue || studio.pricingOptions?.[0]?.hourlyRate || 0).toLocaleString()}</span>
            <span className="text-xl">/ Hour</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-white">
            <Star size={18} className="fill-white text-white" />
            <span>{studio.rating || "5.0"}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/55">{studio.reviews || 0} reviews</span>
          </div>
          <div className="my-8 border-t border-white/10" />
          <div className="space-y-4 text-sm">
            {[
              ["Minimum booking", `${studio.minimumBookingHours || 2} hours`],
              ["Property type", studio.poolType],
              ["Availability", studio.operatingHours || studio.weeklySchedule || "Available by booking"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-white/55">{label}</span>
                <span className="text-right text-white/80">{value}</span>
              </div>
            ))}
          </div>
          <Link
            href="/book-a-studio"
            className="mt-8 flex h-14 w-full items-center justify-center rounded-lg bg-[#E8D1AB] font-semibold text-black transition-colors hover:bg-[#dcb98a]"
          >
            Book this Studio
          </Link>
        </aside>
      </div>

      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[100000000] flex flex-col bg-black/95">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 lg:px-6">
            <div className="text-sm font-semibold text-white/80">{activeImageIndex + 1} / {galleryImages.length}</div>
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/15"
              aria-label="Close gallery"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={galleryImages[activeImageIndex]} alt={`${studio.name} photo ${activeImageIndex + 1}`} fill className="object-contain" sizes="100vw" />
            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={showPreviousImage} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 lg:left-6" aria-label="Previous photo">
                  <ChevronLeft size={28} />
                </button>
                <button type="button" onClick={showNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20 lg:right-6" aria-label="Next photo">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default function StudioDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studioSlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const studio = getStudioBySlug(String(studioSlug || ""));

  return (
    <main className="min-h-screen bg-[#101010] text-white">
      <Navbar />
      <div className="container mx-auto px-4 pb-16 pt-24 md:px-6 lg:pt-44">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center text-sm text-white/60 transition-colors hover:text-white lg:text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        {studio ? (
          <StudioDetailContent studio={studio} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-8">
            <h1 className="text-2xl font-semibold text-white">Studio not found</h1>
            <p className="mt-2 text-white/60">This studio link does not match an available Beige studio.</p>
            <Link href="/book-a-studio" className="mt-6 inline-flex rounded-lg bg-[#E8D1AB] px-5 py-3 font-semibold text-black">
              Browse Studios
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
