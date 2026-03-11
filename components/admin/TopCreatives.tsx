"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/Datepicker";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
// Added Mousewheel module for perfect mouse scrolling interaction
import { EffectCoverflow, Mousewheel } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

import { adminApi } from "@/lib/api";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const TopCreatives = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to center
  const [partners, setPartners] = useState<any[]>([]);
  const [range, setRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: any = { range };
        if (range === 'custom') {
          if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
          if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
        }

        const response = await adminApi.getTopCreativePartners(params);
        if (response && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];

          const mappedPartners = data.map((partner: any, index: number) => ({
            id: partner.id || index,
            name: partner.name || "Unknown",
            email: partner.email || "No Email",
            earnings: partner.total_earnings
              ? `$${parseFloat(partner.total_earnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "$0.00",
            image: (() => {
              if (partner.avatar) return `${S3_PREFIX}${partner.avatar}`;
              if (partner.crew_member_files?.length > 0) {
                const photo = partner.crew_member_files.find((f: any) => f.file_type === "profile_photo" || f.file_type === "headshot");
                if (photo) return photo.file_url || `${S3_PREFIX}${photo.file_path}`;
              }
              return "/images/placeholder-user.png";
            })(),
            bgColor: index % 3 === 0 ? "bg-blue-200" : index % 3 === 1 ? "bg-green-200" : "bg-orange-100",
          }));

          if (mappedPartners.length > 0) {
            setPartners(mappedPartners);
            // This ensures we start at the middle slide regardless of data length
            setActiveIndex(Math.floor(mappedPartners.length / 2));
          } else {
            setPartners([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch top creatives:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [range, startDate, endDate]);

  const activePartner = partners.length > 0 ? partners[activeIndex] : null;


  return (
    <div className="w-full bg-[#171717] rounded-2xl overflow-hidden text-white border border-[#3D3D3D]">
      {/* Header section */}
      <div className="bg-[#101010] rounded-2xl flex justify-between items-center mb-4 border-b border-b-[#3D3D3D] p-5 ">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Top Creative Partners</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* {range === 'custom' && (
  <div className="flex items-center gap-2">
    <div className="w-[140px]">
      <DatePicker
        label=""
        value={startDate}
        onChange={setStartDate}
        sx={{
          height: '36px',
          borderRadius: '99px',
          '& .MuiInputBase-input': { fontSize: '12px', padding: '0 12px' }
        }}
      />
    </div>
    <div className="w-[140px]">
      <DatePicker
        label=""
        value={endDate}
        onChange={setEndDate}
        sx={{
          height: '36px',
          borderRadius: '99px',
          '& .MuiInputBase-input': { fontSize: '12px', padding: '0 12px' }
        }}
      />
    </div>
  </div>
)} */}
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[110px] bg-zinc-900 border-[#3D3D3D] rounded-full h-9 text-xs text-white/70 focus:ring-0">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#3D3D3D]">
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {/* <SelectItem value="custom">Custom</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Slider Section */}
      <div className="relative">
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]" />
          </div>
        ) : partners.length > 0 ? (
          <Swiper
            key={partners.length} // Force re-render when data loads to fix initial centering
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={3}
            initialSlide={Math.floor(partners.length / 2)} // Starts at center
            loop={partners.length >= 5} // Loop only if enough items to prevent "jumping"
            mousewheel={{ forceToAxis: true }} // Allows scrolling with mouse wheel perfectly
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: false,
            }}
            modules={[EffectCoverflow, Mousewheel]}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="w-full"
          >
            {partners.map((partner, index) => (
              <SwiperSlide key={index} className="flex items-center justify-center">
                <div
                  className={`relative !w-[184px] !h-[140px] md:!w-[280px] md:!h-[212px] rounded-[20px] overflow-hidden transition-all duration-500 ${partner.bgColor}`}
                >
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-white/50">
            No partners found.
          </div>
        )}
      </div>

      {/* Dynamic Data Display (Center Only) */}
      {activePartner && (
        <div className="w-full flex flex-col lg:flex-row items-center lg:justify-center gap-3 lg:gap-8 mt-3 pb-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium leading-tight">
              {activePartner.name}
            </h3>
            <p className="text-white/40 text-xs leading-tight">
              {activePartner.email}
            </p>
          </div>

          <div className="bg-[#E8D1AB] text-black px-8 py-2 rounded-full w-fit ">
            <span className=" font-semibold leading-tight">{activePartner.earnings}</span>
          </div>
        </div>
      )}
    </div>
  );
};