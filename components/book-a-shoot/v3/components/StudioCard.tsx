"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, ArrowUpRight, X, Check } from "lucide-react";
import Link from "next/link";

interface StudioCardProps {
  slug: string;
  image: string;
  name: string;
  description: string;
  location: string;
  price: number;
  priceLabel?: string;
  rating: number;
  reviews: number;
  tags?: string[];
  isDark?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
}

export default function StudioCard({
  slug,
  image,
  name,
  description,
  location,
  price,
  priceLabel,
  rating,
  reviews,
  tags = [],
  isDark = true,
  isSelected = false,
  onToggle,
}: StudioCardProps) {
  const fallbackImage = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png";
  const s3Prefix = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");
  const resolvedImage = image
    ? /^https?:\/\//i.test(image)
      ? image
      : s3Prefix
        ? `${s3Prefix}/${image.replace(/^\/+/, "")}`
        : `https://d2jhn32fsulyac.cloudfront.net/assets/studio/${image.replace(/^\/+/, "")}`
    : fallbackImage;
  const displayPrice = priceLabel || (Number.isFinite(price) && price > 0 ? `From $${price}/Hr` : "From $/Hr");
  const displayTags = (tags || []).filter(Boolean);

  return (
    <div className="relative w-full group">
      <div
        className={`absolute inset-0 rounded-[24px] border border-dashed transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isDark ? "border-[#FFFFFF33]" : "border-neutral-300"}`}
        style={{ pointerEvents: 'none' }}
      />

      <motion.div
        initial={false}
        whileHover={{
          y: -6,
          transition: { type: "spring", stiffness: 300, damping: 15 }
        }}
        className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#FFFFFF4D]" : "bg-white border-neutral-200"}`}
      >
        <div className="relative h-[225px] w-full overflow-hidden">
          <img
            src={resolvedImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).src = fallbackImage;
            }}
          />

          <div className="absolute left-5 top-8 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md">
            <div className="flex items-center justify-center rounded-full bg-[#14C573]/20 p-1">
              <div className="h-4 w-4 rounded-full bg-[#14C573] shadow-[0_0_10px_#14C573]" />
            </div>
            <span className="text-base font-medium text-white">Available</span>
          </div>

          <div className="absolute right-5 top-8 flex items-center gap-1.5 rounded-full bg-[#FFFFFF30] px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <Star size={16} className="fill-[#E8D1AB] text-[#E8D1AB]" />
            <span>
              {rating || 5} ({reviews || 0})
            </span>
          </div>

          <div className="absolute bottom-0 left-5 rounded-t-2xl bg-white px-4 py-2">
            <span className="text-lg font-bold text-black">{displayPrice}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`text-[18px] font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>
                {name}
              </h3>
              {description ? <p className={`mt-1 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>{description}</p> : null}
              <div className="mt-2 flex items-center gap-1.5 text-sm opacity-60">
                <MapPin size={16} className={isDark ? "text-[#FFFFFFB2]" : "text-black"} />
                <span className={`truncate ${isDark ? "text-[#FFFFFFB2]" : "text-black"}`}>
                  {location}
                </span>
              </div>
            </div>
            {isSelected && (
              <div className="flex items-center gap-1 rounded-full bg-[#4CAF50] px-3 py-1.5 text-xs font-medium text-white">
                <Check size={12} /> Added
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-y border-y-[#FFFFFF33] py-3.5">
            {displayTags.length > 0 ? (
              displayTags.map((tag) => (
                <div
                  key={tag}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-medium ${isDark
                    ? "border-[#FFFFFF33] text-[#FFFFFFAD]"
                    : "border-neutral-200 text-black"
                    }`}
                >
                  {tag}
                </div>
              ))
            ) : (
              <div className={`text-sm font-medium ${isDark ? "text-[#FFFFFFAD]" : "text-black/60"}`}>
                {description ? description.replace(/[()]/g, "") : "Studio"}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center gap-3">
            {isSelected ? (
              <button
                type="button"
                onClick={onToggle}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFC9C9] py-3.5 text-base font-medium text-[#C31717] transition-opacity hover:opacity-90"
              >
                <X size={18} strokeWidth={2} /> Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="flex-1 rounded-xl bg-[#E8D1AB] py-3.5 text-base font-medium text-black transition-opacity hover:opacity-90"
              >
                Add this Studio
              </button>
            )}
            <Link
              href={`/studios/${slug}`}
              className={`flex h-[56px] w-[56px] items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#FFFFFF33] text-white hover:bg-[#ffffff2a]" : "bg-neutral-100 text-black"}`}
              target="_blank"
            >
              <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>
      </motion.div >
    </div>
  );
}
