"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import { Plus, Loader2 } from "lucide-react";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/usePermissions";

import "swiper/css";
import "swiper/css/effect-coverflow";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bgColor?: string;
}

interface AssignedPostProductionMember {
  post_production_member_id?: number;
  post_production_member?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    role?: string;
  };
}

const BG_COLORS = ["bg-[#FFFAC2]", "bg-[#F3E8FF]", "bg-[#E0F2FE]", "bg-[#FCE7F3]", "bg-[#DCFCE7]"];

interface ProjectTeamProps {
  projectId: string;
  assignedMembers?: AssignedPostProductionMember[];
  onRequestAssignment?: (continueAction: () => void) => void;
}

export default function ProjectTeam({ projectId, assignedMembers, onRequestAssignment }: ProjectTeamProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(!assignedMembers);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { canEdit, canCreate } = usePermissions("shoots");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const mapMembers = (members: AssignedPostProductionMember[]) => {
    return members.map((m, idx: number) => {
      const profile = m.post_production_member || {};
      return {
        id: Number(m.post_production_member_id || idx),
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || "Unknown",
        role: profile.role || "Post Production",
        bgColor: BG_COLORS[idx % BG_COLORS.length]
      };
    });
  };

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProjectDetails(projectId);

      // Extract post production members from project details 
      // The API might return it under a specific field, let's look for 'post_production_team' or similar
      // Based on earlier context, we might need to map it.
      const projectData = response.data || response;
      const members = projectData.assignedPostProductionMembers || [];

      if (Array.isArray(members)) {
        const mappedMembers = members.map((m: AssignedPostProductionMember, idx: number) => {
          const profile = m.post_production_member || {};
          return {
            id: Number(m.post_production_member_id || idx),
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || "Unknown",
            role: profile.role || "Post Production",
            bgColor: BG_COLORS[idx % BG_COLORS.length]
          };
        });
        setTeamMembers(mappedMembers);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (assignedMembers) {
      setTeamMembers(mapMembers(assignedMembers));
      setLoading(false);
    } else if (projectId) {
      fetchTeamMembers();
    }
  }, [projectId, assignedMembers, fetchTeamMembers]);

  const handleMemberAdded = () => {
    fetchTeamMembers();
    setIsModalOpen(false);
  }

  const handleOpenAssignment = () => {
    if (!canCreate) return;
    if (onRequestAssignment) {
      onRequestAssignment(() => setIsModalOpen(true));
      return;
    }

    setIsModalOpen(true);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className={`rounded-2xl border h-full flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"}`}>
        <Loader2 className={`animate-spin ${isDark ? "text-white/20" : "text-black/10"}`} size={32} />
      </div>
    );
  }

  const hasTeam = teamMembers.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300",
        isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"
      )}
      style={{ fontFamily: 'var(--font-instrument-sans)' }}
    >

      {/* Header */}
      <h3 className={cn(
        "text-lg font-medium mb-4 absolute top-6 z-10 transition-colors duration-300",
        isDark ? "text-white" : "text-black"
      )}>
        Project Post Production Team
      </h3>

      <div className={cn(
        "w-full h-px border-t absolute top-20 left-0 transition-colors duration-300",
        isDark ? "border-[#333333]" : "border-[#E5E5E5]"
      )} />

      <AddPostProductionTeamModal
        isOpen={isModalOpen}
        projectId={projectId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMemberAdded}
        isDark={isDark}
      />

      {!hasTeam && (
        <div className="flex flex-col items-center justify-center h-full mt-16 relative py-10 lg:py-0">
          <button
            onClick={handleOpenAssignment}
            disabled={!canCreate}
            className={cn(
              "w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40",
              isDark ? "bg-[#E8D1AB] shadow-[#E8D1AB]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"
            )}
            title={canCreate ? "Add Post Production Team" : "Create permission not allowed"}
          >
            <Plus className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
          </button>
          <h4 className={cn(
            "text-base font-medium leading-none",
            isDark ? "text-[#E8D1AB]" : "text-[#000]"
          )}>
            {canCreate ? "Add Post Production Team" : "Create permission not allowed"}
          </h4>
        </div>
      )}

      {hasTeam && (
        <>
          {/* Add Button in Top Right for List View */}
          <button
            onClick={handleOpenAssignment}
            disabled={!canCreate}
            className={cn(
              "absolute top-6 right-6 z-30 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              isDark ? "text-[#E8D1AB] hover:text-white" : "text-[#E8D1AB] hover:text-black"
            )}
            title={canCreate ? "Add Post Production Team" : "Create permission not allowed"}
          >
            <Plus size={24} />
          </button>

          {/* Slider Section - Horizontal Coverflow */}
          <div className="w-full h-[250px] mt-24 relative z-10">
            <Swiper
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={"auto"}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              modules={[EffectCoverflow]}
              className="w-full h-full project-team-swiper"
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              initialSlide={0}
            >
              {teamMembers.map((member, index) => (
                <SwiperSlide
                  key={`${member.id}-${index}`}
                  className={cn(
                    "!w-[280px] !h-[250px] rounded-2xl overflow-hidden shadow-lg transition-all duration-300",
                    member.bgColor,
                    activeIndex === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
                  )}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-black/85">
                      {(member.name || "U")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Text Info */}
          <div className="mt-auto mb-4 text-center z-10 relative">
            <h4 className={cn(
              "text-[22px] font-semibold leading-none tracking-normal transition-all duration-300",
              isDark ? "text-white" : "text-black"
            )}>
              {teamMembers[activeIndex]?.name}
            </h4>
            <p className={cn(
              "text-base font-medium leading-none mt-2 transition-all duration-300",
              isDark ? "text-[#888888]" : "text-[#666666]"
            )}>
              {teamMembers[activeIndex]?.role}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <Button
              className={`h-12 px-4 lg:px-7 transition-all duration-300 font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]`}
              onClick={handleOpenAssignment}
              disabled={!canCreate}
              title={canCreate ? "Add More Team Members" : "Create permission not allowed"}
            >
              <Plus /> Add More Team Members
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
