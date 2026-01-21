"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Check, X, MapPin, Globe, User, Linkedin } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProfileProps {
    id: string;
}

const SECTION_TITLE_STYLE = "text-lg font-medium text-white mb-6 pb-4 border-b border-dashed border-[#333]";
const LABEL_STYLE = "text-[#666] text-sm mb-1 block";
const VALUE_STYLE = "text-[#E0E0E0] text-[15px] font-medium block";

import { Search, LayoutGrid, List, Folder, MoreVertical } from "lucide-react";

export const CreativePartnerProfile = ({ id }: ProfileProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');

    return (
        <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center gap-2 text-sm text-[#666] mb-2">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-[#E0E0E0] hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-[#111] border border-[#333] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-xl bg-[#222] overflow-hidden relative flex-shrink-0">
                            {/* Placeholder image */}
                            <div className="absolute inset-0 flex items-center justify-center text-[#444]">
                                <User size={48} />
                            </div>
                            <Image
                                src="/uploaded_image_users/ethan.jpg"
                                alt="Ethan Carter"
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    // Fallback if image load fails
                                    (e.target as any).style.display = 'none';
                                }}
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-white">Ethan Carter</h1>
                                <div className="text-green-500">
                                    <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[#888] text-sm mb-2">Branding and visual expert</p>
                            <div className="flex items-center gap-1 text-[#666] text-sm mb-5">
                                <MapPin size={14} />
                                <span>New York, USA</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                                    <Linkedin size={16} />
                                    <span>LinkedIn</span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                                    <span className="font-bold text-lg leading-none">Bē</span>
                                    <span>Behance</span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors">
                                    <Globe size={16} />
                                    <span>Portfolio</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className="px-5 py-2 rounded-full text-sm font-semibold bg-[#F0FFF4] text-[#22C55E] border border-[#22C55E]/20 h-fit">
                        Approved
                    </span>
                </div>

                {/* Dashed Separator */}
                <div className="w-full h-px border-t border-dashed border-[#333] my-8" />

                {/* Tabs */}
                <div className="flex items-center justify-between w-full mt-2">
                    {['Overview', 'Featured Work', 'Availability', 'Shoots', 'Certificates', 'Resume'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-white' : 'text-[#666] hover:text-[#E0E0E0]'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E5D5B8]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'Overview' && (
                <>
                    {/* Personal Information */}
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-8">
                        <h2 className={SECTION_TITLE_STYLE}>Personal Information</h2>
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            <div>
                                <span className={LABEL_STYLE}>First Name</span>
                                <span className={VALUE_STYLE}>Ethan</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Last Name</span>
                                <span className={VALUE_STYLE}>Carter</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Email Address</span>
                                <span className={VALUE_STYLE}>ethanc4519@yahoo.com</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Contact Phone</span>
                                <div className="flex items-center gap-2 text-[#E0E0E0] text-[15px] font-medium">
                                    <span className="text-lg">🇺🇸</span>
                                    <span>+1 (202) 555-0100</span>
                                </div>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Location</span>
                                <span className={VALUE_STYLE}>218 East 5th Street, Los Angeles, California 90013, United States</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Working Distance</span>
                                <span className={VALUE_STYLE}>Up to 10 km</span>
                            </div>
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-8">
                        <h2 className={SECTION_TITLE_STYLE}>Professional Details</h2>
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            <div>
                                <span className={LABEL_STYLE}>Primary Role</span>
                                <span className={VALUE_STYLE}>Videographer</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Year of Experience</span>
                                <span className={VALUE_STYLE}>05 Years</span>
                            </div>
                            <div>
                                <span className={LABEL_STYLE}>Hourly Rate</span>
                                <span className={VALUE_STYLE}>$150.00/-</span>
                            </div>
                            <div className="col-span-2">
                                <span className={LABEL_STYLE}>Bio / About</span>
                                <p className="text-[#888] text-[15px] leading-relaxed mt-1">
                                    A creative photographer with experience in events, lifestyle, and commercial shoots. Passionate about storytelling through visuals and committed to delivering.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-8">
                        <h2 className={SECTION_TITLE_STYLE}>
                            Skills <span className="text-[#E5D5B8]">(02)</span>
                        </h2>
                        <div className="flex gap-3">
                            {['Cinematography', 'Video Editing', 'Sound Recording'].map(skill => (
                                <div key={skill} className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] text-sm">
                                    <span>{skill}</span>
                                    <button className="text-[#666] hover:text-white">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* TAB CONTENT: Featured Work */}
            {activeTab === 'Featured Work' && (
                <div className="bg-[#111] border border-[#333] rounded-2xl p-8 min-h-[500px]">
                    <h2 className={SECTION_TITLE_STYLE}>CP Featured Work</h2>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="relative w-[500px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#555] transition-colors placeholder:text-[#666]"
                            />
                        </div>

                        <div className="flex bg-[#1A1A1A] border border-[#333] rounded-lg p-1">
                            <button className="p-2 rounded bg-[#E5D5B8] text-black">
                                <LayoutGrid size={18} />
                            </button>
                            <button className="p-2 rounded text-[#666] hover:text-white">
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-5 hover:border-[#444] transition-colors group cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#E5D5B8]/10 flex items-center justify-center text-[#E5D5B8]">
                                        <Folder size={20} fill="#E5D5B8" fillOpacity={0.2} />
                                    </div>
                                    <span className="text-white font-medium">Portfolio 2026</span>
                                </div>
                                <button className="text-[#666] hover:text-white">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="flex gap-2 mt-8">
                                <span className="px-3 py-1.5 rounded-full bg-[#111] text-[#999] text-xs font-medium border border-[#333]">
                                    Commercial Event
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-[#111] text-[#999] text-xs font-medium border border-[#333]">
                                    Music Event
                                </span>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-5 hover:border-[#444] transition-colors group cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#E5D5B8]/10 flex items-center justify-center text-[#E5D5B8]">
                                        <Folder size={20} fill="#E5D5B8" fillOpacity={0.2} />
                                    </div>
                                    <span className="text-white font-medium">JP Morgan Company Shoot</span>
                                </div>
                                <button className="text-[#666] hover:text-white">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="flex gap-2 mt-8">
                                <span className="px-3 py-1.5 rounded-full bg-[#111] text-[#999] text-xs font-medium border border-[#333]">
                                    Corporate Event
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
