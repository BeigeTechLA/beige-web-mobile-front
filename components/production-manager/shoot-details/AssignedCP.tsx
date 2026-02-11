"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";

const CP_MEMBERS = [
    { id: 1, name: "Ryan Smith", role: "Photographer", image: "/images/crew/CREW(3).png", bgColor: "bg-[#FFD6D6]" }, // Pink
    { id: 2, name: "Marcus Wright", role: "Videographer", image: "/images/crew/CREW(4).png", bgColor: "bg-[#C4B5FD]" }, // Purple
    { id: 3, name: "Sara Kim", role: "Editor", image: "/images/crew/CREW(5).png", bgColor: "bg-white" }, // White
];

export default function AssignedCP({ projectId }: { projectId: string }) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex flex-col items-center justify-center relative overflow-hidden py-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            <h3 className="text-white text-lg font-medium mb-4 absolute top-6 z-10">Assigned CP</h3>
            {/* <div className="w-full h-px bg-[#222222] absolute top-16 left-0" /> */}
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] absolute top-20 left-0" />

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
            <div className="mt-auto lg:mb-2 text-center z-10 relative">
                <h4 className="text-white lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300">
                    {CP_MEMBERS[activeIndex]?.name}
                </h4>
                <p className="text-[#888888] text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300">
                    {CP_MEMBERS[activeIndex]?.role}
                </p>
            </div>

        </div>
    );
}
