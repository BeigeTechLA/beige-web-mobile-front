"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const CP_MEMBERS = [
    { id: 1, name: "Ryan Smith", role: "Photographer", image: "/images/crew/CREW(3).png", bgColor: "bg-[#FFD6D6]" }, // Pink
    { id: 2, name: "Marcus Wright", role: "Videographer", image: "/images/crew/CREW(4).png", bgColor: "bg-[#C4B5FD]" }, // Purple
    { id: 3, name: "Sara Kim", role: "Editor", image: "/images/crew/CREW(5).png", bgColor: "bg-white" }, // White
];

export default function AssignedCP({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
    const hasCPs = CP_MEMBERS.length > 0;

    if (!mounted) return null;

    return (
        <div
            className={`rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"}`}
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
        >
            <h3 className={`text-lg font-medium mb-4 absolute top-6 z-10 transition-colors duration-300 ${isDark ? "text-white" : "text-black"
                }`}>
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
                            {CP_MEMBERS.map((member) => (
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

                    {/* Text Info - Added to match ProjectTeam symmetry */}
                    <div className="mt-auto lg:mb-4 text-center z-10 relative">
                        <h4 className={`lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300 ${isDark ? "text-white" : "text-black"
                            }`}>
                            {CP_MEMBERS[activeIndex]?.name}
                        </h4>
                        <p className={`text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300 ${isDark ? "text-[#888888]" : "text-[#666666]"
                            }`}>
                            {CP_MEMBERS[activeIndex]?.role}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 px-4">
                        <Button
                            onClick={() => router.push("/admin/sales-representative/create-new-deal")}
                            className={`h-12 px-4 lg:px-7 transition-colors ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                                }`}
                        >
                            <Plus /> Add More CPs
                        </Button>
                        <Button className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border transition-colors ${isDark
                            ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
                            : "text-black bg-[#F5F5F5] border-[#E5E5E5] hover:bg-[#EEEEEE]"
                            }`}>
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
                    <h4 className={`text-base font-medium leading-none ${isDark ? "text-[#E5D5B8]" : "text-[#D9C19A]"
                        }`}>
                        Assign Creative Partner
                    </h4>
                </div>
            )}
        </div>
    );
}