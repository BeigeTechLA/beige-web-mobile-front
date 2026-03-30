"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import { Plus, User, Loader2 } from "lucide-react";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/effect-coverflow";
import { Button } from "@/components/ui/button";

interface TeamMember {
    id: number;
    name: string;
    role: string;
    image: string;
    bgColor?: string;
}

const BG_COLORS = ["bg-[#FFFAC2]", "bg-[#F3E8FF]", "bg-[#E0F2FE]", "bg-[#FCE7F3]", "bg-[#DCFCE7]"];

export default function ProjectTeam({ projectId, assignedMembers }: { projectId: string; assignedMembers?: any[] }) {
    const router = useRouter();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
    const mapMembers = (members: any[]) => {
        return members.map((m: any, idx: number) => {
            const profile = m.post_production_member || {};
            return {
                id: m.post_production_member_id,
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || "Unknown",
                role: profile.role || "Post Production",
                image: profile.profile_image || profile.image || "/images/crew/CREW(6).png",
                bgColor: BG_COLORS[idx % BG_COLORS.length]
            };
        });
    };

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getProjectDetails(projectId);

            // Extract post production members from project details 
            // The API might return it under a specific field, let's look for 'post_production_team' or similar
            // Based on earlier context, we might need to map it.
            const projectData = response.data || response;
            const members = projectData.assignedPostProductionMembers || [];

            if (Array.isArray(members)) {
                const mappedMembers = members.map((m: any, idx: number) => {
                    const profile = m.post_production_member || {};
                    return {
                        id: m.post_production_member_id,
                        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || "Unknown",
                        role: profile.role || "Post Production",
                        image: profile.profile_image || profile.image || "/images/crew/CREW(6).png",
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
    };

    useEffect(() => {
        if (assignedMembers) {
            setTeamMembers(mapMembers(assignedMembers));
            setLoading(false);
        } else if (projectId) {
            fetchTeamMembers();
        }
    }, [projectId, assignedMembers]);

    const handleMemberAdded = () => {
        fetchTeamMembers();
        setIsModalOpen(false);
    }

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
                "w-full h-px bg-dashed border-t border-dashed absolute top-20 left-0 transition-colors duration-300",
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
                <div className="flex flex-col items-center justify-center h-full mt-16 relative z-30 py-10 lg:py-0">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={cn(
                            "w-12 h-12 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg",
                            isDark ? "bg-[#E5D5B8] shadow-[#E5D5B8]/10" : "bg-[#E8D1AB] shadow-[#B18A00]/20"
                        )}
                    >
                        <Plus size={40} className={"text-black"} />
                    </button>
                    <h4 className={cn(
                        "text-base font-medium leading-none",
                        isDark ? "text-[#E5D5B8]" : "text-[#000]"
                    )}>
                        Add Post Production Team
                    </h4>
                </div>
            )}

            {hasTeam && (
                <>
                    {/* Add Button in Top Right for List View */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={cn(
                            "absolute top-6 right-6 z-30 transition-colors",
                            isDark ? "text-[#E5D5B8] hover:text-white" : "text-[#B18A00] hover:text-black"
                        )}
                    >
                        <Plus size={24} />
                    </button>

                    {/* Slider Section - Horizontal Coverflow */}
                    <div className="w-full h-[220px] mt-24 relative z-10">
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
                                        "!w-[280px] !h-[180px] rounded-2xl overflow-hidden shadow-lg transition-all duration-300",
                                        member.bgColor,
                                        activeIndex === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
                                    )}
                                >
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
                            className={cn(
                                "h-12 px-4 lg:px-7 transition-all duration-300 font-semibold",
                                isDark
                                    ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
                                    : "bg-[#B18A00] text-white hover:bg-[#967500]"
                            )}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus /> Add More Team Members
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}