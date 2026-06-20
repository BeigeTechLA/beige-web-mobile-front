// New

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";

// Swiper styles
import "swiper/css";

import { adminApi } from "@/lib/api";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const TopCreatives = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"revenue" | "payments" | "affiliate">("revenue");
  const [partners, setPartners] = useState<any[]>([]);
  const [range, setRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
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
            rank: index + 1,
            name: partner.name || "Unknown",
            email: partner.email || "No Email",
            earnings: partner.total_earnings
              ? `$${parseFloat(partner.total_earnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "$0.00",
            percentage: partner.percentage_change || (index === 0 ? 12 : index === 1 ? -5 : 8),
            isPositive: partner.percentage_change >= 0 || (index !== 1),
            image: (() => {
              if (partner.avatar) return `${S3_PREFIX}${partner.avatar}`;
              if (partner.crew_member_files?.length > 0) {
                const photo = partner.crew_member_files.find((f: any) => f.file_type === "profile_photo" || f.file_type === "headshot");
                if (photo) return photo.file_url || `${S3_PREFIX}${photo.file_path}`;
              }
              return "/images/placeholder-user.png";
            })(),
          }));

          if (mappedPartners.length > 0) {
            setPartners(mappedPartners);
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

  const isDark = !mounted || theme === "dark";

  return (
    <div className={`flex-1 w-full rounded-2xl overflow-hidden transition-colors duration-300 border ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
      }`}>
      {/* Header section */}
      <div className={`flex justify-between items-center border-b p-5 transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Top Creative Partners</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`w-[110px] rounded-full h-9 text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center p-5 pb-0">
        <div
          className={`
          flex items-center overflow-hidden rounded-full border
          ${isDark
              ? "bg-[#0D0D0D] border-[#2A2A2A]"
              : "bg-white border-[#E5E5E5]"
            }
        `}
        >
          {[
            { id: "revenue", label: "Revenue Fulfilled" },
            { id: "payments", label: "Payments Earned" },
            { id: "affiliate", label: "Affiliate Revenue" },
          ].map((tab, index) => (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`
            min-w-[90px]
            px-6 py-2.5
            text-sm
            transition-all duration-100
            font-medium
            ${activeTab === tab.id
                    ? "bg-[#E5D5B8] text-[#1A1A1A]"
                    : isDark
                      ? "bg-transparent text-white/70 hover:text-white"
                      : "bg-transparent text-[#323232]"
                  }
          `}
              >
                {tab.label}
              </button>

              {index < 2 && (
                <div
                  className={`w-px h-8 ${isDark ? "bg-[#2A2A2A]" : "bg-[#E5E5E5]"
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* Slider Section */}
      <div className="relative p-5">
        {isLoading ? (
          <div className="h-[580px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]" />
          </div>
        ) : partners.length > 0 ? (
          <Swiper
            key={partners.length}
            grabCursor={true}
            centeredSlides={false}
            slidesPerView={3}
            spaceBetween={14}
            mousewheel={{ forceToAxis: true }}
            modules={[Mousewheel]}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 6,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 10,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 14,
              },
            }}
            className="w-full !overflow-visible"
          >
            {partners.map((partner, index) => (
              <SwiperSlide key={index} className="h-auto">
                <div className="w-full bg-[#0F0F0F] rounded-[16px] border border-white/10 overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E5D5B8] to-[#C9B896] flex items-center justify-center shadow-lg">
                      <span className="text-zinc-900 font-bold text-sm">#{partner.rank}</span>
                    </div>
                  </div>

                  <div className="relative w-full h-[150px] overflow-hidden">
                    <Image
                      src={partner.image}
                      alt={partner.name}
                      fill
                      className="object-cover rounded-[30px] p-5"
                      priority={index < 3}
                    />
                  </div>

                  <div className="p-5 pt-0">
                    <div className="mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-white/40">
                        {partner.email}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 mb-2" />

                    {/* Earnings and Performance */}
                    <div className="flex justify-between items-start mb-4">
                      {/* Earnings */}
                      <div>
                        <div className="text-[18px] font-semibold text-[#E5D5B8] mb-1">
                          {partner.earnings}
                        </div>
                        <div className="text-xs text-white/40">
                          Revenue Fulfilled
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="text-right">
                        <div className={`flex items-center gap-1 mb-1 ${partner.isPositive ? "text-green-400" : "text-red-400"
                          }`}>
                          {partner.isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            {partner.isPositive ? "+" : ""}{partner.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-white/40">
                          vs last period
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-2 px-3 rounded-xl bg-[#18181B] border border-white/10 text-[#E5D5B8] font-normal text-sm hover:border-[#E5D5B8]/30 transition-all duration-300">
                      Revenue Fulfilled
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-[580px] flex items-center justify-center text-white/40">
            No partners found.
          </div>
        )}
      </div>
    </div>
  );
};