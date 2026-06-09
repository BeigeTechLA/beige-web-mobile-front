"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, ArrowUpRight, X, Check } from "lucide-react";
import Link from "next/link";

interface StudioCardProps {
  image: string;
  name: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
  isDark?: boolean;
  isSelected?: boolean;
}

export default function StudioCard({
  image,
  name,
  description,
  location,
  price,
  rating,
  reviews,
  tags,
  isDark = true,
  isSelected = false
}: StudioCardProps) {

  return (
    // Outer container keeps the stack index and relative positioning
    <div className="relative w-full max-w-[450px] group">

      {/* 2. Dotted Outline (Holds original position) */}
      <div
        className={`absolute inset-0 rounded-xl lg:rounded-3xl border-2 border-dashed transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isDark ? "border-[#FFFFFF33]" : "border-neutral-300"}`}
        style={{ pointerEvents: 'none' }}
      />

      {/* 1. Animated Card Body (Tilts Right) */}
      <motion.div
        initial={false}
        whileHover={{
          y: -8,
          rotate: 10, // Updated to tilt right
          transition: { type: "spring", stiffness: 300, damping: 15 }
        }}
        className={`relative w-full h-full rounded-xl lg:rounded-3xl border transition-colors duration-300 cursor-pointer ${isDark
          ? "bg-[#101010] border-[#FFFFFF4D]"
          : "bg-white border-neutral-200"
          }`}
      >
        {/* Image Container */}
        <div className="relative aspect-[106/89] w-full overflow-hidden rounded-t-xl lg:rounded-t-3xl">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-xl lg:rounded-t-3xl"
          />

          {/* Availability Badge */}
          <div className="absolute left-5 top-8 flex items-center gap-2">
            <div className="rounded-full border-9 border-[#1DAA23]/30">
              <div className="h-5 w-5 rounded-full bg-[#1DAA23] opacity-100" />
            </div>
            <span className="text-lg lg:text-xl font-medium text-white">Available</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute right-5 top-8 flex items-center gap-1 rounded-full bg-[#FFFFFF30] px-3 py-1.5 backdrop-blur-md">
            <Star size={20} className="fill-[#E8D1AB] text-[#E8D1AB]" />
            <span className="lg:text-lg font-medium text-white">
              {rating} ({reviews})
            </span>
          </div>

          {/* Pricing Badge */}
          <div className="absolute bottom-0 left-5 rounded-t-2xl bg-white px-4 py-2">
            <span className="text-lg lg:text-xl font-bold text-black">From ${price}/Hr</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-2.5 lg:space-y-4.5 px-5 py-7">
          <div className="flex">
            <div>
              <h3 className={`max-w-4/5 text-lg lg:text-xl font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>
                {name} <br />
                <span className="font-medium opacity-90">{description}</span>
              </h3>

              <div className="flex items-center gap-1 opacity-60">
                <MapPin size={24} className={isDark ? "text-[#FFFFFFB2]" : "text-black"} />
                <span className={`lg:text-lg ${isDark ? "text-[#FFFFFFB2]" : "text-black"}`}>
                  {location}
                </span>
              </div>
            </div>
            {
              isSelected && (
                <p className="bg-[#4CAF50] rounded-full text-xs flex-0 h-fit px-2 py-1.5 flex items-center gap-1">
                  <Check size={12} /> Added
                </p>
              )
            }
          </div>

          <div className="flex flex-wrap gap-2 py-[18px] border-y border-y-[#FFFFFF33]">
            {tags.map((tag) => (
              <div
                key={tag}
                className={`rounded-lg border px-4 py-2 lg:text-lg font-medium ${isDark
                  ? "border-[#FFFFFF33] text-[#FFFFFFAD]"
                  : "border-neutral-200 text-black"
                  }`}
              >
                {tag}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex items-center gap-2 lg:gap-4">
            {
              isSelected ? (
                <button className="flex gap-1.5 justify-center items-center flex-1 rounded-lg bg-[#FFC9C9] py-3.5 text-lg lg:text-xl font-medium text-[#C31717] transition-opacity hover:opacity-90">
                  <X size={20} strokeWidth={2} /> Remove
                </button>
              ) : (
                <button className="flex-1 rounded-lg bg-[#E8D1AB] py-3.5 text-lg lg:text-xl font-medium text-black transition-opacity hover:opacity-90">
                  Add this Studio
                </button>
              )
            }
            {/* Make url dynamic */}
            <Link
              href={`/studios/1`}
              className={`flex aspect-square h-[48px] items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#FFFFFF33] text-white hover:bg-[#ffffff2a]" : "bg-neutral-100 text-black"}`}
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