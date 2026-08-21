"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, User, ArrowUp, ArrowDown } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi } from "@/lib/api";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";

/**
 * Custom CSS to force the "Top-Stacking" behavior.
 * Swiper Cards effect usually translates slides down;
 * we override the slide transformations to stack them upwards.
 */
const stackStyles = `
  .top-stack-swiper .swiper-slide-shadow { display: none !important; }
  .top-stack-swiper .swiper-slide {
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

interface CrewMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bgColor: string;
}

const BG_COLORS = ["bg-[#FFD6D6]", "bg-[#C4B5FD]", "bg-[#E0F2FE]", "bg-[#F3E8FF]", "bg-[#DCFCE7]"];

export default function AffiliateAssignedCP({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);

  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const fetchCrewMembers = async () => {
    const token = Cookies.get("revure_token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await affiliateApi.getProjectDetails(token, projectId);
      const projectData = response.data || response;
      const crew = projectData.assignedCrew || [];

      if (Array.isArray(crew)) {
        const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";
        const mappedCrew = crew.map((item: any, idx: number) => {
          const member = item.crew_member || {};
          const roleLabel = getPrimaryRoleLabel(member.primary_role, member.role_name);

          // Priority: crew_member_files (profile_photo/headshot) -> direct fields -> default
          let imagePath = "/images/crew/CREW(3).png";
          const files = member.crew_member_files || [];
          const profilePhotoFile = files.find((f: any) => f.file_type === "profile_photo" || f.file_type === "headshot");

          if (profilePhotoFile) {
            imagePath = profilePhotoFile.file_url || `${s3Prefix}${profilePhotoFile.file_path}`;
          } else {
            const profileImage = member.profile_photo || member.profile_image || member.image;
            if (profileImage) {
              imagePath = profileImage.startsWith('http') ? profileImage : `${s3Prefix}${profileImage}`;
            }
          }

          return {
            id: item.id,
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || "Unknown",
            role: roleLabel,
            image: imagePath,
            bgColor: BG_COLORS[idx % BG_COLORS.length]
          };
        });
        setCrewMembers(mappedCrew);
      }
    } catch (error) {
      console.error("Error fetching crew members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchCrewMembers();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className={`rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300 min-h-[400px] ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7] border border-[#E5E5E5]"}`}>
        <Loader2 className={`animate-spin ${isDark ? "text-white/20" : "text-black/30"}`} size={32} />
      </div>
    );
  }

  const hasCrew = crewMembers.length > 0;

  if (!mounted) return null;

  return (
    <div
      className={`rounded-2xl h-full flex flex-col items-center transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7] border border-[#E5E5E5]"}`}
      style={{ fontFamily: 'var(--font-instrument-sans)' }}
    >
      <style>{stackStyles}</style>
      {/* Title */}
      <div className={`flex justify-center w-full p-6 border-b ${isDark ? "border-b-[#333333]" : "border-b-[#E5E5E5]"}`}>
        <h3 className={`text-lg font-medium transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
          Assigned CP
        </h3>
      </div>

      {/* Swiper or Placeholder */}
      <div className="p-6 h-full">
        {!hasCrew ? (
          <div className="flex flex-col items-center justify-center h-full relative z-30 py-10 lg:py-0">
            <div className={`w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? "bg-[#E5D5B8] shadow-[#E5D5B8]/10" : "bg-[#E8D1AB] shadow-[#B18A00]/20"}`}>
              <User className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
            </div>
            <h4 className={`${isDark ? "text-[#E5D5B8]" : "text-[#000]"} text-base font-medium leading-none`}>No Crew Assigned</h4>
          </div>
        ) : (
          <>
            {/* Cards Swiper - Vertical Direction */}
            <div className="relative z-10 w-full flex justify-center items-center py-10">
              <Swiper
                effect={"cards"}
                direction={"vertical"}
                grabCursor={true}
                modules={[EffectCards]}
                className="top-stack-swiper w-[240px] h-[260px] lg:!w-[317px] lg:!h-[309px]"
                cardsEffect={{
                  perSlideOffset: 12,
                  perSlideRotate: 0,
                  slideShadows: false,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              >
                {crewMembers.map((member, index) => {
                  const crewMemberId = Number(member.id);
                  return (
                    <SwiperSlide key={member.id || index} className={`relative rounded-3xl overflow-hidden shadow-lg group ${member.bgColor}`}>
                      <div className="relative h-full w-full">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover object-top"
                        />
                      </div>

                      {/* Bottom Gradient Fade */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "linear-gradient(180deg, rgba(0, 0, 0, 0.00) 40%, #000 100%)" }}
                      />

                      {/* Absolute Pill Controller Element on the Slide */}
                      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex flex-col items-center gap-1.5 border border-white/40 bg-white/20 rounded-full px-2 py-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            swiperRef.current?.slidePrev();
                          }}
                          disabled={activeIndex === 0}
                          className="text-white hover:text-[#E5D5B8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            swiperRef.current?.slideNext();
                          }}
                          disabled={activeIndex === crewMembers.length - 1}
                          className="text-white hover:text-[#E5D5B8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Identity Text and Interactive Inline Operations Panel */}
                      <div className="absolute inset-0 flex flex-col justify-end p-5 z-20 pointer-events-none lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity lg:duration-300">
                        <div className="flex items-end justify-between w-full gap-2">
                          <div className="text-left select-none min-w-0 flex-1">
                            <h4 className="text-sm font-semibold leading-tight text-white truncate">
                              {member.name
                                ? `${member.name || ""}`.trim() || "Unknown"
                                : "Unknown"}
                            </h4>
                            {/* Instead of role, replace with compensation if required */}
                            <p className="text-xs leading-normal mt-1 text-[#E8D1AB] truncate">
                              {member.role}
                            </p>
                          </div>

                          {/* Action Controls Frame Context: This page doesnt exist under client as of now */}
                          {/* <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => router.push(`/users/creative-partners/${crewMemberId}`)}
                              className="h-8 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-[10px] font-semibold rounded-full shadow transition-all"
                            >
                              View Profile
                            </button>
                          </div> */}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Text Info */}
            {/* <div className="mt-auto lg:mb-2 text-center z-10 relative">
              <h4 className={`lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300 ${isDark ? "text-white" : "text-black"}`}>
                {crewMembers[activeIndex]?.name}
              </h4>
              <p className={`text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300 ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
                {crewMembers[activeIndex]?.role}
              </p>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}
