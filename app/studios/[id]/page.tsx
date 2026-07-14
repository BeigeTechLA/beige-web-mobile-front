"use client";

import React, { Suspense, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  Home,
  Images,
  Loader2,
  MapPin,
  Shield,
  Share2,
  Star,
  X,
} from "lucide-react";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { ReviewsComponent } from "@/components/admin/studios/StudioReviews";
import HostRulesAccordion from "../components/HostRulesAccordion";
import { studioCatalogApi, type StudioCatalogListItem } from "@/lib/api";

const STUDIO_IMAGE_FALLBACK =
  "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";
const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";

const StudioDetailContent = ({ studio }: { studio: StudioCatalogListItem }) => {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();
    [studio.image, ...(studio.images || [])].forEach((image) => {
      if (image) imageSet.add(image);
    });
    if (imageSet.size === 0) imageSet.add(STUDIO_IMAGE_FALLBACK);
    return Array.from(imageSet);
  }, [studio]);

  const studioMeta = [
    studio.size,
    studio.beds ? `${studio.beds} bed${studio.beds > 1 ? "s" : ""}` : null,
    studio.baths ? `${studio.baths} bath${studio.baths > 1 ? "s" : ""}` : null,
    studio.propertyType,
    studio.pricingMode,
  ].filter(Boolean);

  const ratingText = studio.rating
    ? `${studio.rating} Stars${
        studio.reviews
          ? ` (${studio.reviews} ${studio.reviews === 1 ? "Rating" : "Ratings"})`
          : ""
      }`
    : null;

  const amenities = studio.amenities?.length
    ? studio.amenities
    : [
        "Natural light",
        "High-speed WiFi",
        "Production-friendly layout",
        "Furniture and decor included",
      ];
  const rules = [
    "Minimum booking and usage details follow the catalog listing.",
    "Setup and breakdown must be included in the reservation.",
    "Guests must respect the property and studio guidelines.",
  ];
  const highlights = [
    "Live catalog studio details are loaded by slug.",
    "Designed for shoots, content creation, campaigns, and meetings.",
    "Booking information stays in sync with the catalog entry.",
  ];
  const minimumBookingHours = studio.minimumBookingHours || 2;

  return (
    <div className="relative pt-24 lg:pt-36 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
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
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <MapPin size={16} className="text-[#E8D1AB]" />
            <span className="underline underline-offset-4 decoration-white/20">
              {DEFAULT_DISPLAY_ADDRESS}
            </span>
          </div>
        </div>

        <div className="mb-12 grid h-[320px] grid-cols-1 overflow-hidden rounded-[24px] md:h-[480px] md:grid-cols-2 gap-2">
          <div
            className="relative h-full w-full cursor-pointer bg-zinc-900"
            onClick={() => setActiveImageIndex(0)}
          >
            <Image
              src={galleryImages[0]}
              alt="Main"
              fill
              className="object-cover hover:opacity-90 transition-opacity"
              priority
            />
          </div>
          <div className="hidden h-full grid-cols-2 grid-rows-2 gap-2 md:grid">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="relative cursor-pointer bg-zinc-900"
                onClick={() =>
                  setActiveImageIndex(Math.min(idx, galleryImages.length - 1))
                }
              >
                <Image
                  src={galleryImages[idx] || galleryImages[0]}
                  alt={`Gallery ${idx}`}
                  fill
                  className="object-cover hover:opacity-90 transition-opacity"
                />
                {idx === 4 && (
                  <div className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-2xl">
                    <Images size={14} /> {galleryImages.length} Photos
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <section className="flex flex-col gap-8 border-b border-white/10 pb-10">
              <div className="flex items-start gap-5">
                <Home
                  size={26}
                  strokeWidth={1.5}
                  className="text-[#E8D1AB] shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Private production space
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Reserved for your approved booking window.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <Star
                  size={26}
                  strokeWidth={1.5}
                  className="text-[#E8D1AB] shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {ratingText || "Production-ready"}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {ratingText
                      ? "Highly rated by creators"
                      : "Designed for shoots, content creation, and campaigns."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <CalendarDays
                  size={26}
                  strokeWidth={1.5}
                  className="text-[#E8D1AB] shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Hourly booking
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {minimumBookingHours}-hour minimum booking •{" "}
                    {studio.operatingHours || studio.weeklySchedule || "Inquire for hours"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-zinc-300 leading-relaxed text-lg">
                {studio.description || "Explore this studio's live catalog listing for booking details, images, and usage guidance."}
              </p>
              {highlights.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">
                    What makes it unique
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex items-center gap-3 text-zinc-400 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="pt-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Pricing & Tags
              </h3>
              <div className="bg-zinc-900/40 rounded-3xl p-8 border border-zinc-800/50">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                  <div>
                    <h4 className="text-4xl font-bold text-[#E8D1AB]">
                      ${Number(studio.priceValue || 0).toLocaleString()}
                      <span className="text-lg text-zinc-500">/hr</span>
                    </h4>
                    <p className="text-zinc-500 text-sm mt-1">
                      {minimumBookingHours}-hour minimum booking
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] mb-4">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(studio.tags || []).map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-white/10 pt-10">
              <h3 className="text-xl font-bold text-white mb-8">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
                {amenities.map((item) => (
                  <div key={item} className="flex items-center gap-4 text-zinc-300">
                    <Check size={18} className="text-[#E8D1AB]" />
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 pt-10">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Shield size={22} className="text-[#E8D1AB]" /> House Rules
              </h3>
              <div className="grid gap-4 max-w-2xl">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <span className="text-[#E8D1AB] font-mono text-xs mt-1">
                      0{idx + 1}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 pt-10">
              <h3 className="text-xl font-bold text-white mb-8">Reviews</h3>
              <ReviewsComponent />
            </section>

            <section className="border-t border-white/10 pt-10">
              <h3 className="text-xl font-bold text-white mb-8">
                Rules & Health Safety Measures
              </h3>
              <HostRulesAccordion rules={studio.rules || rules} defaultOpenAll />
            </section>
          </div>

          <div className="lg:col-span-4">
            <aside className="sticky top-32 bg-[#171717] border border-[#E8D1AB]/30 rounded-[32px] p-8 shadow-2xl shadow-black">
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <span className="text-4xl font-bold text-white">
                    ${(studio.priceValue || 0).toLocaleString()}
                  </span>
                  <span className="text-zinc-500 ml-1">/ hour</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Star size={16} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                  {studio.rating || "5.0"}
                </div>
              </div>

              <div className="space-y-5 py-6 border-y border-white/10 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Minimum booking</span>
                  <span className="text-white font-medium">
                    2 hours
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Property type</span>
                  <span className="text-white font-medium">
                    {studio.propertyType || "Studio"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Availability</span>
                  <span className="text-white font-medium text-right max-w-[150px]">
                    {studio.operatingHours || studio.weeklySchedule || "Flexible"}
                  </span>
                </div>
              </div>

              <Link
                href={`/book-a-studio?studioId=${studio.slug || studio.id}`}
                className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-[#E8D1AB] font-bold text-black hover:bg-[#dcb98a] active:scale-95 transition-all shadow-lg shadow-[#E8D1AB]/10"
              >
                Book this Studio
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
            <span className="text-white/50 font-mono text-xs tracking-widest">
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
                alt="Full view"
                fill
                className="object-contain"
                priority
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
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
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border transition-all duration-200 ${
                    activeImageIndex === idx
                      ? "border-white opacity-100 scale-110 z-10"
                      : "border-transparent opacity-30 hover:opacity-60"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                </button>
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
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={40} />
          </div>
        }
      >
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={40} />
          </div>
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
