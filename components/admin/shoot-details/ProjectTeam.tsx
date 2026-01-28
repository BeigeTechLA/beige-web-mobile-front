"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import { Plus, User, Loader2 } from "lucide-react";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";
import { adminApi } from "@/lib/api";

import "swiper/css";
import "swiper/css/effect-coverflow";

interface TeamMember {
    id: number;
    name: string;
    role: string;
    image: string;
    bgColor?: string;
}

const BG_COLORS = ["bg-[#FFFAC2]", "bg-[#F3E8FF]", "bg-[#E0F2FE]", "bg-[#FCE7F3]", "bg-[#DCFCE7]"];

export default function ProjectTeam({ projectId }: { projectId: string }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

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
        if (projectId) {
            fetchTeamMembers();
        }
    }, [projectId]);

    const handleMemberAdded = () => {
        fetchTeamMembers();
        setIsModalOpen(false);
    }

    if (loading) {
        return (
            <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/20" size={32} />
            </div>
        );
    }

    const hasTeam = teamMembers.length > 0;

    return (
        <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex flex-col items-center justify-center relative overflow-hidden py-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>

            {/* Header */}
            <h3 className="text-white text-lg font-medium mb-4 absolute top-6 z-10">
                Project Post Production Team
            </h3>

            <div className="w-full h-px bg-[#222222] absolute top-16 left-0" />
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] absolute top-20 left-0" />

            <AddPostProductionTeamModal
                isOpen={isModalOpen}
                projectId={projectId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleMemberAdded}
            />

            {!hasTeam && (
                <div className="flex flex-col items-center justify-center h-full mt-16 relative z-30">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-20 h-20 bg-[#E5D5B8] rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform shadow-lg shadow-[#E5D5B8]/10">
                        <Plus size={40} className="text-black" />
                    </button>
                    <h4 className="text-[#E5D5B8] text-base font-medium leading-none">Add Post Production Team</h4>
                </div>
            )}

            {hasTeam && (
                <>
                    {/* Add Button in Top Right for List View */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="absolute top-6 right-6 z-30 text-[#E5D5B8] hover:text-white transition-colors"
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
                                    key={member.id}
                                    className={`!w-[280px] !h-[180px] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${member.bgColor} ${activeIndex === index ? 'opacity-100' : 'opacity-40'}`}
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
                        <h4 className="text-white text-[22px] font-semibold leading-none tracking-normal transition-all duration-300">
                            {teamMembers[activeIndex]?.name}
                        </h4>
                        <p className="text-[#888888] text-base font-medium leading-none mt-2 transition-all duration-300">
                            {teamMembers[activeIndex]?.role}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
