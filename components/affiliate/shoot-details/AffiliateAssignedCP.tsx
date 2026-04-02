"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, User } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi } from "@/lib/api";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";

interface CrewMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bgColor: string;
}

const BG_COLORS = ["bg-[#FFD6D6]", "bg-[#C4B5FD]", "bg-[#E0F2FE]", "bg-[#F3E8FF]", "bg-[#DCFCE7]"];

export default function AffiliateAssignedCP({ projectId }: { projectId: string }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);

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
      className={`rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"}`}
      style={{ fontFamily: 'var(--font-instrument-sans)' }}
    >
      <h3 className={`text-lg font-medium mb-4 absolute top-6 z-10 transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
        Assigned CP
      </h3>

      <div className={`w-full h-px border-t absolute top-20 left-0 transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"
        }`} />

      {!hasCrew ? (
        <div className="flex flex-col items-center justify-center h-full mt-16 relative z-30">
          <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6">
            <User size={40} className="text-[#333]" />
          </div>
          <h4 className="text-[#666] text-base font-medium leading-none">No Crew Assigned</h4>
        </div>
      ) : (
        <>
          {/* Cards Swiper - Vertical Direction */}
          <div className="w-[240px] h-[260px] mt-24 relative z-10">
            <Swiper
              effect={"cards"}
              direction={"vertical"}
              grabCursor={true}
              modules={[EffectCards]}
              className="w-full h-full"
              cardsEffect={{
                perSlideOffset: 12,
                perSlideRotate: 0,
                slideShadows: false,
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            >
              {crewMembers.map((member) => (
                <SwiperSlide key={member.id} className={`rounded-3xl overflow-hidden shadow-lg ${member.bgColor}`}>
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Text Info */}
          <div className="mt-auto lg:mb-2 text-center z-10 relative">
            <h4 className={`lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300 ${isDark ? "text-white" : "text-black"}`}>
              {crewMembers[activeIndex]?.name}
            </h4>
            <p className={`text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300 ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
              {crewMembers[activeIndex]?.role}
            </p>
          </div>
        </>
      )}
    </div>
  );
}