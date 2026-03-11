"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

export default function AssignedCP({ projectId, leadId, assignedCrew = [] }: { projectId: string; leadId?: string | number, assignedCrew?: any[] }) {
    const router = useRouter();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [crewMembers, setCrewMembers] = useState<any[]>(assignedCrew);
    const [removingCrewId, setRemovingCrewId] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    useEffect(() => {
        setCrewMembers(assignedCrew);
    }, [assignedCrew]);

    const hasCPs = crewMembers.length > 0;


    const handleRemoveCP = async (crewMemberId: number) => {
        try {
            setRemovingCrewId(crewMemberId);
            const response = await adminApi.removeProjectCrew({
                project_id: Number(projectId),
                crew_member_id: crewMemberId,
            });

            if (response?.success === false && response?.error) {
                toast.error(response.error);
                return;
            }

            setCrewMembers((prev) => {
                const updated = prev.filter((member) => Number(member.crew_member_id) !== Number(crewMemberId));
                setActiveIndex((current) => {
                    if (updated.length === 0) return 0;
                    return Math.min(current, updated.length - 1);
                });
                return updated;
            });
            toast.success("Assigned CP removed successfully");
        } catch (error) {
            console.error("Failed to remove assigned CP:", error);
            toast.error("Failed to remove assigned CP");
        } finally {
            setRemovingCrewId(null);
        }
    };

    // Use a placeholder if there is no image
    const getProfileImage = (member: any) => {
        const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

        if (member.crew_member?.crew_member_files?.length > 0) {
            const photo = member.crew_member.crew_member_files.find((f: any) => f.file_type === "profile_photo" || f.file_type === "headshot");
            if (photo) {
                if (photo.file_url) return photo.file_url;
                if (photo.file_path) return `${s3Prefix}${photo.file_path}`;
            }
        }

        const fullName = `${member.crew_member?.first_name || ""} ${member.crew_member?.last_name || ""}`.trim() || "Unknown";
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
    };

    if (!mounted) return null;

    return (
        <div
            className={`rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"}`}
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
        >
            <h3 className={`text-lg font-medium mb-4 absolute top-6 z-10 transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
                Assigned CP
            </h3>

            <div className={`w-full h-px bg-dashed border-t border-dashed absolute top-20 left-0 transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"
                }`} />

            {hasCPs ? (
                <>
                    {/* Cards Swiper - Vertical Direction to match 'down' interaction feel */}
                    <div className="w-[240px] h-[260px] mt-24 relative z-10">
                        <Swiper
                            effect={"cards"}
                            direction={"vertical"} // Vertical swipe to "pull down" or "push up"
                            grabCursor={true}
                            modules={[EffectCards]}
                            className="w-full h-full"
                            cardsEffect={{
                                perSlideOffset: 12, // Reduced offset to keep in box
                                perSlideRotate: 0, // No rotation
                                slideShadows: false,
                            }}
                            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                        >
                            {crewMembers.map((member, index) => {
                                const bgColor = index % 3 === 0 ? "bg-[#FFD6D6]" : index % 3 === 1 ? "bg-[#C4B5FD]" : "bg-white";
                                return (
                                    <SwiperSlide key={member.id || index} className={`relative rounded-3xl overflow-hidden shadow-lg ${bgColor}`}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCP(Number(member.crew_member_id || member.id));
                                            }}
                                            disabled={removingCrewId === Number(member.crew_member_id || member.id)}
                                            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-all"
                                            aria-label="Remove CP"
                                        >
                                            {removingCrewId === Number(member.crew_member_id || member.id) ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <X size={18} />
                                            )}
                                        </button>
                                        <Image
                                            src={getProfileImage(member)}
                                            alt={`${member.crew_member?.first_name} ${member.crew_member?.last_name}`}
                                            fill
                                            className="object-cover object-top"
                                        />
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>

                    {/* Text Info - Added to match ProjectTeam symmetry */}
                    <div className="mt-auto lg:mb-4 text-center z-10 relative">
                        <h4 className={`lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300 ${isDark ? "text-white" : "text-black"}`}>
                            {crewMembers[activeIndex]?.crew_member ? `${crewMembers[activeIndex].crew_member.first_name} ${crewMembers[activeIndex].crew_member.last_name}` : "Unknown"}
                        </h4>
                        <p className={`text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300 ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
                            {crewMembers[activeIndex]?.crew_member?.role_name || "Creative Partner"}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        <Button
                            onClick={() => router.push(`/admin/shoots/${projectId}/add-creatives`)}
                            className={`h-12 px-4 lg:px-7 transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D9C19A]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}`}
                        >
                            <Plus /> Add More CPs
                        </Button>
                        <Button
                            className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border transition-colors ${isDark
                                ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
                                : "text-black bg-[#F5F5F5] border-[#E5E5E5] hover:bg-[#EEEEEE]"
                                }`}
                        >
                            Change CPs
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full mt-16 relative z-30">
                    <button
                        onClick={() => router.push("/admin/select-creatives")}
                        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg ${isDark
                            ? "bg-[#E5D5B8] shadow-[#E5D5B8]/10"
                            : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"
                            }`}
                    >
                        <Plus size={40} className="text-black" />
                    </button>
                    <h4 className={`text-base font-medium leading-none ${isDark ? "text-[#E5D5B8]" : "text-[#D9C19A]"}`}>
                        Assign Creative Partner
                    </h4>
                </div>
            )}
        </div>
    );
}