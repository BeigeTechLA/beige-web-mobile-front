"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import { Plus } from "lucide-react";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";

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
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Explicitly set to false to ensure "Add" UI is shown by default.
    const [hasTeam, setHasTeam] = useState(false);

    const handleAddTeam = () => {
        setHasTeam(true); // Toggle to true to show list after adding
        setIsModalOpen(false);
    }

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
                onClose={() => handleAddTeam()}
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
                            {TEAM_MEMBERS.map((member, index) => (
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
                            {TEAM_MEMBERS[activeIndex]?.name}
                        </h4>
                        <p className="text-[#888888] text-base font-medium leading-none mt-2 transition-all duration-300">
                            {TEAM_MEMBERS[activeIndex]?.role}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
