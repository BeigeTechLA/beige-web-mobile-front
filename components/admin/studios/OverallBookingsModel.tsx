// Static UI

"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { Calendar, Clock, Users, Mail } from "lucide-react";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";

/**
 * Custom CSS for Vertical Stacking
 */
const customSwiperStyles = `
  .bookings-stack-swiper {
    width: 100%;
    height: 480px !important;
    padding-top: 40px !important;
    padding-bottom: 40px !important;
    overflow: visible !important;
  }

  .bookings-stack-swiper .swiper-slide {
    border-radius: 16px;
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  .swiper-slide-shadow {
    display: none !important;
  }
`;

interface BookingCardProps {
  studioName: string;
  image: string;
  time: string;
  duration: string;
  date: string;
  project: string;
  crew: number;
  contactName: string;
  contactEmail: string;
  price: string;
  isDark: boolean;
}

const BookingCard = ({
  studioName,
  image,
  time,
  duration,
  date,
  project,
  crew,
  contactName,
  contactEmail,
  price,
  isDark,
}: BookingCardProps) => (
  <div className={`w-full max-w-[1048px] h-auto rounded-2xl border overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E3E3E3]"
    }`}>
    <div className="flex h-full p-9">
      {/* Image Section */}
      <div className="w-[377px] h-[281px] shrink-0">
        <img
          src={image}
          alt={studioName}
          className="w-full h-full rounded-2xl object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 px-6 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className={`text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>
              {studioName}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#E5D0A6]">{price}</p>
          </div>
        </div>

        {/* Time & Date Pills */}
        <div className="flex gap-3 mb-6 ">
          <div
            className={`flex items-center py-2 rounded-xl ${isDark ? "bg-[#1A1A1A]" : "bg-[#F4F5F7]"}`}>
            <div className={`flex items-center px-4 gap-2 `}>
              <Clock className={`w-4 h-4 ${isDark ? "text-white/60" : "text-[#323232]/60"}`} />
              <span className={`text-sm ${isDark ? "text-white/80" : "text-[#323232]/80"}`}>
                {time} ({duration})
              </span>
            </div>
            <div className={`flex items-center px-4 gap-2`}>
              <Calendar className={`w-4 h-4 ${isDark ? "text-white/60" : "text-[#323232]/60"}`} />
              <span className={`text-sm ${isDark ? "text-white/80" : "text-[#323232]/80"}`}>
                {date}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full mb-6 ${isDark ? "bg-white/10" : "bg-[#323232]/10"}`} />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 flex-1">
          {/* Project Info */}
          <div>
            <p className={`text-sm mb-2 ${isDark ? "text-white/50" : "text-[#323232]/50"}`}>
              Project
            </p>
            <h4 className={`text-base font-medium mb-2 ${isDark ? "text-white" : "text-[#323232]"}`}>
              {project}
            </h4>
            <div className={`flex items-center gap-2 ${isDark ? "text-white/50" : "text-[#323232]/50"}`}>
              <Users className="w-4 h-4" />
              <span className="text-sm">Crew: {crew}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <p className={`text-sm mb-2 ${isDark ? "text-white/50" : "text-[#323232]/50"}`}>
              Contact
            </p>
            <h4 className={`text-base font-medium mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>
              {contactName}
            </h4>
            <div className={`flex items-center gap-2 ${isDark ? "text-white/50" : "text-[#323232]/50"}`}>
              <Mail className="w-4 h-4" />
              <span className="text-sm">{contactEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const mockBookings = [
  {
    studioName: "Sunset Creative Studio",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
    time: "10:00 AM",
    duration: "4hrs Duration",
    date: "Saturday, Feb 14, 2026",
    project: "Summer Product Launch",
    crew: 5,
    contactName: "Sarah Johnson",
    contactEmail: "sarah@example.com",
    price: "$340.00",
  },
  {
    studioName: "Downtown Photography Hub",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
    time: "2:00 PM",
    duration: "6hrs Duration",
    date: "Monday, Feb 17, 2026",
    project: "Fashion Editorial Shoot",
    crew: 8,
    contactName: "Michael Chen",
    contactEmail: "michael@studio.com",
    price: "$520.00",
  },
  {
    studioName: "Ocean View Studios",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop",
    time: "9:00 AM",
    duration: "8hrs Duration",
    date: "Wednesday, Feb 19, 2026",
    project: "Commercial Video Production",
    crew: 12,
    contactName: "Emma Williams",
    contactEmail: "emma@oceanview.com",
    price: "$890.00",
  },
];

export default function OverallBookingsModel() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <div className={`w-full rounded-2xl border p-3 lg:p-5 transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E3E3E3]"
      }`}>
      <style>{customSwiperStyles}</style>

      {/* Header */}
      <div className="px-3 lg:px-10 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
            <h2 className="text-lg font-semibold text-white">Overall Bookings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-full text-[#8A8A8A] hover:text-white transition-colors text-xs">
              Month
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-full text-[#8A8A8A] hover:text-white transition-colors text-xs">
              All
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-8 border-b border-white/10">
          <button className="pb-3 text-sm font-medium text-white border-b-2 border-[#E5D0A6]">
            Upcoming (2)
          </button>
          <button className={`pb-3 text-sm font-medium transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-[#323232]/60 hover:text-[#323232]"
            }`}>
            Completed (2)
          </button>
          <button className={`pb-3 text-sm font-medium transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-[#323232]/60 hover:text-[#323232]"
            }`}>
            Cancelled (0)
          </button>
        </div>
      </div>

      {/* Swiper Cards */}
      <div className="relative overflow-hidden px-3 lg:px-10">
        <Swiper
          direction="vertical"
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          className="bookings-stack-swiper"
          loop={true}
          speed={800}
          cardsEffect={{
            slideShadows: false,
            perSlideOffset: 10,
            perSlideRotate: 0,
          }}
        >
          {mockBookings.map((booking, index) => (
            <SwiperSlide key={index}>
              <BookingCard
                isDark={isDark}
                {...booking}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}