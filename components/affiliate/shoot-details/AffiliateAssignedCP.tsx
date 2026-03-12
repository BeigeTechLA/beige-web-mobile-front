"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, User } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi } from "@/lib/api";

interface CrewMember {
    id: number;
    name: string;
    role: string;
    image: string;
    bgColor: string;
}

const BG_COLORS = ["bg-[#FFD6D6]", "bg-[#C4B5FD]", "bg-[#E0F2FE]", "bg-[#F3E8FF]", "bg-[#DCFCE7]"];

export default function AffiliateAssignedCP({ projectId }: { projectId: string }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);

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
                    const roles = member.primary_role ? (typeof member.primary_role === 'string' ? JSON.parse(member.primary_role) : member.primary_role) : [];
                    // Using a simple role mapping or label
                    const roleLabel = roles.includes("9") ? "Cinematographer" : (roles.length > 0 ? `Role ${roles[0]}` : "Crew Member");

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
            <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-white/20" size={32} />
            </div>
        );
    }

    const hasCrew = crewMembers.length > 0;

    return (
        <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex flex-col items-center justify-center relative overflow-hidden py-6 min-h-[400px]" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            <h3 className="text-white text-lg font-medium mb-4 absolute top-6 z-10">Assigned CP</h3>
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] absolute top-20 left-0" />

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
                        <h4 className="text-white lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300">
                            {crewMembers[activeIndex]?.name}
                        </h4>
                        <p className="text-[#888888] text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300">
                            {crewMembers[activeIndex]?.role}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
