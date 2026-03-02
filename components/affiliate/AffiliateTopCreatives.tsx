"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

import { affiliateApi, adminApi } from "@/lib/api";
import Cookies from "js-cookie";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const AffiliateTopCreatives = () => {
    const [activeIndex, setActiveIndex] = useState(1); // Default to center
    const [partners, setPartners] = useState<any[]>([]);
    const [range, setRange] = useState<'all' | 'monthly'>('all');
    const [isOpen, setIsOpen] = useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const token = Cookies.get("revure_token");
            if (!token) return;

            try {
                const response = await affiliateApi.getTopCreativePartners(token, range);
                if (response && response.data) {
                    const data = Array.isArray(response.data) ? response.data : [];

                    const mappedPartners = data.map((partner: any, index: number) => ({
                        id: partner.id || index,
                        name: partner.name || "Unknown",
                        email: partner.email || "No Email",
                        earnings: partner.total_earnings
                            ? `$${parseFloat(partner.total_earnings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "$0.00",
                        image: partner.avatar
                            ? `${S3_PREFIX}${partner.avatar}`
                            : "/images/placeholder-user.png",
                        bgColor: index % 3 === 0 ? "bg-blue-200" : index % 3 === 1 ? "bg-green-200" : "bg-orange-100",
                    }));

                    if (mappedPartners.length > 0) {
                        setPartners(mappedPartners);
                        setActiveIndex(Math.floor(mappedPartners.length / 2));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch top creatives:", error);
            }
        };
        fetchData();
    }, [range]);

    const activePartner = partners.length > 0 ? partners[activeIndex % partners.length] : null;

    const toggleRange = () => {
        setRange(prev => prev === 'all' ? 'monthly' : 'all');
        setIsOpen(false);
    };

    return (
        <div className="w-full bg-[#171717] rounded-2xl overflow-hidden text-white border border-[#3D3D3D]">
            {/* Header section */}
            <div className="bg-[#101010] rounded-2xl flex justify-between items-center mb-4 border-b border-b-[#3D3D3D] p-5 ">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <h2 className="">Top Creative Partners</h2>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors capitalize"
                    >
                        {range === 'monthly' ? 'Month' : 'All Time'} <ChevronDown size={14} />
                    </button>
                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                            <button
                                onClick={() => toggleRange()}
                                className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                {range === 'all' ? 'Month' : 'All Time'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Slider Section */}
            <div className="relative">
                {partners.length > 0 ? (
                    <Swiper
                        effect={"coverflow"}
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={3}
                        initialSlide={1}
                        loop={partners.length >= 3} // Only loop if enough items
                        spaceBetween={10}
                        coverflowEffect={{
                            rotate: 50,
                            stretch: 0,
                            depth: 100,
                            modifier: 1,
                            slideShadows: false,
                        }}
                        modules={[EffectCoverflow]}
                        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                        className="w-full"
                    >
                        {partners.map((partner, index) => (
                            <SwiperSlide key={index} className="flex items-center justify-center">
                                <div
                                    className={`relative w-full h-full md:!w-[280px] md:!h-[212px] rounded-[20px] overflow-hidden transition-all duration-500 ${partner.bgColor}`}
                                >
                                    <Image
                                        src={partner.image}
                                        alt={partner.name}
                                        fill
                                        className="object-cover object-top"
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-white/50">
                        No partners found.
                    </div>
                )}
            </div>

            {/* Dynamic Data Display (Center Only) */}
            {activePartner && (
                <div className="w-full flex justify-center gap-8 mt-3 pb-5">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-base font-medium leading-tight">
                            {activePartner.name}
                        </h3>
                        <p className="text-white/40 text-xs leading-tight">
                            {activePartner.email}
                        </p>
                    </div>

                    <div className="bg-[#E8D1AB] text-black px-8 py-2 rounded-full">
                        <span className=" font-semibold leading-tight">{activePartner.earnings}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
