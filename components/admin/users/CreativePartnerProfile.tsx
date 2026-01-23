"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, X, MapPin, Globe, User, Linkedin, Copy, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface ProfileProps {
    id: string;
}

const SECTION_TITLE_STYLE = "text-lg font-medium text-white mb-6 pb-4 border-b border-dashed border-[#333]";
const LABEL_STYLE = "text-[#666] text-sm mb-1 block";
const VALUE_STYLE = "text-[#E0E0E0] text-[15px] font-medium block";

import { Search, LayoutGrid, List, Folder, MoreVertical, ArrowLeft, FileText } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

const PORTFOLIO_IMAGES = [
    "/images/crew/CREW(1).png",
    "/images/crew/CREW(2).png",
    "/images/crew/CREW(3).png",
    "/images/crew/CREW(4).png",
    "/images/crew/CREW(6).png",
];

export const CreativePartnerProfile = ({ id }: ProfileProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Featured Work');
    const [openFolder, setOpenFolder] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // Default to Jan 2026 for demo
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortBy, setSortBy] = useState('All');

    // Mock data for calendar
    const shootDates = [
        new Date(2026, 0, 16),
        new Date(2026, 0, 19),
        new Date(2026, 0, 26),
        new Date(2026, 0, 29),
        new Date(2026, 0, 30),
    ];

    // Mock data for shoots
    const shoots = [
        { id: '#SHO01', name: 'Wedding Highlight Film', files: 24, price: '$1,200.00', status: 'Initiated' },
        { id: '#SHO02', name: 'Product Promo Video', files: 12, price: '$850.00', status: 'Pre Production' },
        { id: '#SHO03', name: 'Corporate Interview Shoot', files: '08', price: '$650.00', status: 'Post Production' },
        { id: '#SHO04', name: 'Fashion Reels Shoot', files: 15, price: '$480.00', status: 'Completed' },
        { id: '#SHO05', name: 'Real Estate Walkthrough', files: 24, price: '$720.00', status: 'Revision' },
        { id: '#SHO06', name: 'Event Aftermovie Shoot', files: 18, price: '$950.00', status: 'Completed' },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Initiated': return 'bg-[#FFF8E1] text-[#D97706] border-none'; // Yellowish
            case 'Pre Production': return 'bg-[#FCE7F3] text-[#DB2777] border-none'; // Pinkish
            case 'Post Production': return 'bg-[#E5E5E5] text-[#525252] border-none'; // Greyish
            case 'Completed': return 'bg-[#DCFCE7] text-[#16A34A] border-none'; // Greenish
            case 'Revision': return 'bg-[#DBEAFE] text-[#2563EB] border-none'; // Blueish
            default: return 'bg-[#333] text-white';
        }
    };

    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    const isShootDay = (date: Date) => {
        return shootDates.some(shootDate => isSameDay(shootDate, date));
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-[#666]">
                <span className="hover:text-[#E0E0E0] cursor-pointer">User - Creative Partners</span>
                <span>/</span>
                <span className="text-white">Creative Partner Profile Details</span>
            </div>

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
                    {openFolder === 'Portfolio 2026' ? (
                        <div>
                            <button
                                onClick={() => setOpenFolder(null)}
                                className="flex items-center gap-2 text-[#E0E0E0] hover:text-white transition-colors mb-6"
                            >
                                <ArrowLeft size={20} />
                                <span className="text-lg font-medium">Portfolio 2026</span>
                            </button>

                            <div className="w-full bg-[#171717] rounded-2xl overflow-hidden text-white border border-[#3D3D3D] py-10">
                                <Swiper
                                    effect={"coverflow"}
                                    grabCursor={true}
                                    centeredSlides={true}
                                    slidesPerView={3}
                                    initialSlide={2}
                                    loop={true}
                                    spaceBetween={10}
                                    coverflowEffect={{
                                        rotate: 50,
                                        stretch: 0,
                                        depth: 100,
                                        modifier: 1,
                                        slideShadows: false,
                                    }}
                                    modules={[EffectCoverflow]}
                                    className="w-full"
                                >
                                    {PORTFOLIO_IMAGES.map((img, index) => (
                                        <SwiperSlide key={index} className="flex items-center justify-center">
                                            <div className="relative w-full h-full md:!w-[280px] md:!h-[400px] rounded-[20px] overflow-hidden transition-all duration-500">
                                                <Image
                                                    src={img}
                                                    alt={`Portfolio Image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                <div
                                    onClick={() => setOpenFolder('Portfolio 2026')}
                                    className="bg-[#1A1A1A] border border-[#333] rounded-xl p-5 hover:border-[#444] transition-colors group cursor-pointer"
                                >
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
                        </>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Availability */}
            {activeTab === 'Availability' && (
                <div className="flex flex-col xl:flex-row gap-6">
                    {/* Left: Calendar */}
                    <div className="flex-1 bg-[#111] border border-[#333] rounded-2xl p-6">
                        <h2 className={SECTION_TITLE_STYLE}>Availability</h2>

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white font-medium min-w-[140px] text-center">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </div>
                                <button
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] hover:text-white transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] text-sm hover:text-white transition-colors flex items-center gap-2">
                                    Today <ChevronDown className="" size={14} />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-[#E0E0E0] text-sm hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        Sort by <ChevronDown className="" size={14} />
                                    </button>

                                    {/* Sort Dropdown */}
                                    {isSortOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#333] rounded-xl shadow-xl overflow-hidden z-20">
                                            {['All', 'Shoots', 'Meetings'].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setSortBy(option);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === option ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#E0E0E0]'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="border border-[#333] rounded-xl overflow-hidden">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-[#333] bg-[#1A1A1A]">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-3 text-center text-sm text-[#888] font-medium border-r border-[#333] last:border-r-0">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Cells */}
                            <div className="grid grid-cols-7 bg-[#111]">
                                {calendarDays.map((day, dayIdx) => {
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const hasShoot = isShootDay(day);
                                    const isTodayDate = isSameDay(day, new Date(2026, 0, 16)); // Mocking "Today" as Jan 16 for demo visual match

                                    // Determine border classes
                                    const isLastRow = dayIdx >= calendarDays.length - 7;
                                    const isLastCol = (dayIdx + 1) % 7 === 0;

                                    return (
                                        <div
                                            key={day.toString()}
                                            className={`min-h-[100px] p-3 border-[#333] ${!isLastRow ? 'border-b' : ''} ${!isLastCol ? 'border-r' : ''} ${!isCurrentMonth ? 'bg-[#0A0A0A] text-[#444]' : 'text-[#E0E0E0]'
                                                }`}
                                        >
                                            <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center ${isTodayDate ? 'bg-[#E5D5B8] text-black rounded-full' : ''
                                                }`}>
                                                {format(day, 'd')}
                                            </span>

                                            {hasShoot && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                                                        <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E293B] border border-[#334155] w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>
                                                        <span className="text-[10px] text-[#93C5FD] font-medium leading-none">Shoot</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="w-full xl:w-[320px] space-y-6">
                        {/* Legend */}
                        <div className="bg-[#111] border border-[#333] rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-4">Color Legend</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-[#444] mt-1.5"></div>
                                    <div>
                                        <div className="text-[#E0E0E0] text-sm font-medium">Disabled</div>
                                        <div className="text-[#666] text-xs">Time off or blocked</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-[#8B7355] mt-1.5"></div>
                                    <div>
                                        <div className="text-[#E0E0E0] text-sm font-medium">Today's</div>
                                        <div className="text-[#666] text-xs">Time off or blocked</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1.5"></div>
                                    <div>
                                        <div className="text-[#E0E0E0] text-sm font-medium">Shoots</div>
                                        <div className="text-[#666] text-xs">Confirmed shoots</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-[#EF4444] mt-1.5"></div>
                                    <div>
                                        <div className="text-[#E0E0E0] text-sm font-medium">Conflicts</div>
                                        <div className="text-[#666] text-xs">Scheduling conflicts</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* This Month Stats */}
                        <div className="bg-[#111] border border-[#333] rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-4">This Month</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                                    <span className="text-[#999] text-sm">Available Days</span>
                                    <span className="text-white font-medium">18</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                                    <span className="text-[#999] text-sm">Booked Shoots</span>
                                    <span className="text-white font-medium">7</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                                    <span className="text-[#999] text-sm">Time Off</span>
                                    <span className="text-white font-medium">3 days</span>
                                </div>
                            </div>
                        </div>

                        {/* Share Availability */}
                        <div className="bg-[#111] border border-[#333] rounded-2xl p-6">
                            <h3 className="text-white font-medium mb-2">Share Availability</h3>
                            <p className="text-[#888] text-sm mb-4">Share your availability link with production teams</p>
                            <button className="w-full py-3 bg-[#E5D5B8] text-black rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#d4c3a3] transition-colors">
                                <Copy size={18} />
                                <span>Copy Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Shoots */}
            {activeTab === 'Shoots' && (
                <div className="bg-[#111] border border-[#333] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#333] bg-[#202020]">
                                    <th className="text-left py-5 px-6 text-[#E8D1AB] font-medium text-sm w-[15%]">Shoot ID</th>
                                    <th className="text-left py-5 px-6 text-[#E8D1AB] font-medium text-sm w-[35%]">Shoot Name</th>
                                    <th className="text-left py-5 px-6 text-[#E8D1AB] font-medium text-sm w-[10%]">Files</th>
                                    <th className="text-left py-5 px-6 text-[#E8D1AB] font-medium text-sm w-[20%]">Price</th>
                                    <th className="text-left py-5 px-6 text-[#E8D1AB] font-medium text-sm w-[20%]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {shoots.map((shoot) => (
                                    <tr key={shoot.id} className="hover:bg-[#161616] transition-colors font-[family-name:var(--font-instrument-sans)]">
                                        <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.id}</td>
                                        <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.name}</td>
                                        <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.files}</td>
                                        <td className="py-6 px-6 text-[#E0E0E0] text-[15px]">{shoot.price}</td>
                                        <td className="py-6 px-6">
                                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(shoot.status)}`}>
                                                {shoot.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Certificates */}
            {
                activeTab === 'Certificates' && (
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-8 min-h-[500px]">
                        <h2 className={SECTION_TITLE_STYLE}>CP Certificates</h2>

                        <div className="flex flex-wrap gap-5">
                            {/* Certificate Card 1 */}
                            <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 w-[340px] hover:border-[#444] transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#FF453A] rounded-md shrink-0">
                                        <span className="text-white text-[8px] font-bold">Pdf</span>
                                    </div>
                                    <span className="text-[#E0E0E0] font-medium text-sm truncate">Certified Professional Videographer (CPV)</span>
                                </div>

                                <div className="w-full h-[220px] bg-[#161616] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                    {/* Large File Icon */}
                                    <div className="w-16 h-20 bg-[#FF453A] rounded-lg flex items-center justify-center relative transform group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-white font-bold text-xl">Pdf</span>
                                        {/* Folded Corner */}
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-[#D93025] rounded-bl-lg"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-[#161616] transform translate-x-3 -translate-y-3 rotate-45"></div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-[#E5D5B8] text-black rounded-xl text-sm font-semibold hover:bg-[#d4c3a3] transition-colors">
                                    View Certificate
                                </button>
                            </div>

                            {/* Certificate Card 2 */}
                            <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 w-[340px] hover:border-[#444] transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#FF453A] rounded-md shrink-0">
                                        <span className="text-white text-[8px] font-bold">Pdf</span>
                                    </div>
                                    <span className="text-[#E0E0E0] font-medium text-sm truncate">Video Production Certificate</span>
                                </div>

                                <div className="w-full h-[220px] bg-[#161616] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                    {/* Large File Icon */}
                                    <div className="w-16 h-20 bg-[#FF453A] rounded-lg flex items-center justify-center relative transform group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-white font-bold text-xl">Pdf</span>
                                        {/* Folded Corner */}
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-[#D93025] rounded-bl-lg"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-[#161616] transform translate-x-3 -translate-y-3 rotate-45"></div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-[#E5D5B8] text-black rounded-xl text-sm font-semibold hover:bg-[#d4c3a3] transition-colors">
                                    View Certificate
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* TAB CONTENT: Resume */}
            {
                activeTab === 'Resume' && (
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-8 min-h-[500px]">
                        <h2 className={SECTION_TITLE_STYLE}>CP Resume</h2>

                        <div className="w-[340px]">
                            <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 hover:border-[#444] transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#2563EB] rounded-md shrink-0">
                                        <FileText size={16} className="text-white" />
                                    </div>
                                    <span className="text-[#E0E0E0] font-medium text-sm truncate">Certified Professional Videographer (CPV)</span>
                                </div>

                                <div className="w-full h-[220px] bg-[#161616] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                    {/* Large Blue Icon */}
                                    <div className="w-16 h-20 bg-[#2563EB] rounded-lg flex flex-col items-center justify-center p-4 relative transform group-hover:scale-105 transition-transform duration-300">
                                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                                        <div className="w-full h-1 bg-white/40 mb-1.5 rounded-full"></div>
                                        <div className="w-3/4 h-1 bg-white/40 rounded-full self-start"></div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-[#E5D5B8] text-black rounded-xl text-sm font-semibold hover:bg-[#d4c3a3] transition-colors">
                                    View Resume
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
