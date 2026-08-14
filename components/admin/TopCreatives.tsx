"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { adminApi } from "@/lib/api";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const TopCreatives = () => {
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1);
  const [partners, setPartners] = useState<any[]>([]);
  const [range, setRange] = useState<string>("most_shoot");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const response = await adminApi.getTopCreativePartners({
            filter: range as "most_shoot" | "most_paid",
          });

        if (response && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          const mappedPartners = data.map((partner: any, index: number) => {
              const totalShoots = Number(
                partner.total_shoots || 0
              );

              const totalPaid = Number(
                partner.total_paid ??
                  partner.total_earnings ??
                  0
              );

              const formattedAmount = `$${totalPaid.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}`;

              return {
                id: partner.id || index,
                rank: partner.rank || index + 1,
                name: partner.name || "Unknown",
                email: partner.email || "No Email",

                totalShoots,
                totalPaid,

                earnings: formattedAmount,

                image: (() => {
                  if (partner.avatar) {
                    if (
                      String(partner.avatar).startsWith(
                        "http"
                      )
                    ) {
                      return partner.avatar;
                    }

                    return `${S3_PREFIX}${partner.avatar}`;
                  }

                  if (partner.crew_member_files?.length > 0) {
                    const photo = partner.crew_member_files.find((f: any) => f.file_type === "profile_photo" || f.file_type === "headshot");
                    if (photo) return photo.file_url || `${S3_PREFIX}${photo.file_path}`;
                  }
                  return "/images/placeholder-user.png";
                })(),
                bgColor: index % 3 === 0 ? "bg-blue-200" : index % 3 === 1 ? "bg-green-200" : "bg-orange-100",
              };
            });

          if (mappedPartners.length > 0) {
            setPartners(mappedPartners);
            setActiveIndex(Math.floor(mappedPartners.length / 2));
          } else {
            setPartners([]);
            setActiveIndex(0);
          }
        } else {
          setPartners([]);
          setActiveIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch top creatives:", error);

        setPartners([]);
        setActiveIndex(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [range]);

  const isDark = !mounted || theme === "dark";
  const activePartner = partners.length > 0 ? partners[activeIndex] || partners[0] : null;

  return (
    <div className={`flex-1 w-full rounded-2xl overflow-hidden transition-colors duration-300 border ${
      isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
    }`}>
      {/* Header section */}
      <div className={`flex justify-between items-center border-b p-5 transition-colors duration-300 ${
        isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E3E3E3]"
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Top Creative Partners</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`w-[110px] rounded-full h-9 text-xs focus:ring-0 ${
              isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
            }`}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className={`${isDark? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="most_shoot">Most Shoots</SelectItem>
              <SelectItem value="most_paid">Most Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Slider Section */}
      <div className="relative py-6">
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]" />
          </div>
        ) : partners.length > 0 ? (
          <Swiper
            key={range + partners.length + (isDark ? "dark" : "light")}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={3}
            initialSlide={Math.floor(partners.length / 2)}
            loop={partners.length >= 5}
            mousewheel={{ forceToAxis: true }}
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
          <div className={`h-[200px] flex items-center justify-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
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
            <p className={`text-xs leading-tight ${isDark ? "text-white/40" : "text-[#00000066]"}`}>
              {activePartner.email}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="bg-[#E8D1AB] text-black px-6 py-1 rounded-full w-fit">
              <span className=" font-semibold leading-tight">{activePartner.earnings}</span>
            </div>

            {range === "most_shoot" && (
              <span className={`text-xs ${isDark ? "text-[#E8D1AB]" : "text-[#E8D1AB]"}`}>
                {activePartner.totalShoots}{" "}
                {activePartner.totalShoots === 1 ? "Shoot" : "Shoots"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};