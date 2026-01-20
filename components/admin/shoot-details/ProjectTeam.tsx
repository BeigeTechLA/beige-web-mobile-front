"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";

const TEAM_MEMBERS = [
    { id: 1, name: "Nasir Uddin", role: "Post Production manager", image: "/images/crew/CREW(6).png", bgColor: "bg-[#FFFAC2]" }, // Yellowish
    { id: 2, name: "Lana Guzman", role: "Videographer", image: "/images/crew/CREW(2).png", bgColor: "bg-[#F3E8FF]" }, // Purpleish
    { id: 3, name: "Riya Patel", role: "Photographer", image: "/images/crew/CREW(1).png", bgColor: "bg-[#E0F2FE]" },
    { id: 4, name: "John Lee", role: "Light Assistant", image: "/images/crew/CREW(3).png", bgColor: "bg-[#FCE7F3]" },
    { id: 5, name: "Dev Shah", role: "Editor", image: "/images/crew/CREW(4).png", bgColor: "bg-[#DCFCE7]" },
];

export default function ProjectTeam() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="bg-[#111111] rounded-2xl border border-[#222222] h-full flex flex-col items-center justify-center relative overflow-hidden py-6">
            <h3 className="text-white text-lg font-medium mb-4 absolute top-6 z-10">Project Management Team</h3>
            <div className="w-full h-px bg-[#222222] absolute top-16 left-0" />
            <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] absolute top-20 left-0" />


            {/* Slider Section */}
            <div className="w-full mt-10 px-0">
                <Swiper
                    effect={"coverflow"}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={1.7} // Allow side slides to peek in
                    initialSlide={0}
                    loop={true}
                    coverflowEffect={{
                        rotate: 0,
                        stretch: 0,
                        depth: 200, // Increase depth to push side slides back
                        modifier: 1,
                        scale: 0.8, // Make side slides smaller
                        slideShadows: false, // Manage opacity manually ideally, or use shadows
                    }}
                    modules={[EffectCoverflow]}
                    onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                    className="w-full !overflow-visible project-team-swiper"
                >
                    {TEAM_MEMBERS.map((member, index) => (
                        <SwiperSlide key={member.id} className="relative aspect-[4/3]">
                            <div
                                className={`w-full h-full rounded-2xl overflow-hidden relative shadow-lg transition-all duration-300 ${member.bgColor}`}
                            >
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    className="object-cover object-top"
                                />
                                {/* Overlay for side items if needed, though Swiper handles some attention */}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Text Info */}
            <div className="mt-6 text-center z-10 relative">
                <h4 className="text-white text-lg font-bold transition-all duration-300">
                    {TEAM_MEMBERS[activeIndex]?.name}
                </h4>
                <p className="text-[#888888] text-sm mt-1 transition-all duration-300">
                    {TEAM_MEMBERS[activeIndex]?.role}
                </p>
            </div>

            {/* Side Masks */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#111111] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent z-20 pointer-events-none" />

        </div>
    );
}
