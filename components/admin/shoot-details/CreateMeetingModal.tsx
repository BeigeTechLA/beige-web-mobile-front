"use client";

import React, { useState } from "react";
import { X, ChevronDown, Clock, Link, Info } from "lucide-react";
import Image from "next/image";

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark?: boolean;
}

export default function CreateMeetingModal({ isOpen, onClose, isDark = true }: CreateMeetingModalProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    if (!isOpen) return null;

    // Theme-based style constants
    const theme = {
        bg: isDark ? "bg-[#0A0A0A]" : "bg-[#FDFDFD]",
        border: isDark ? "border-[#222222]" : "border-[#E5E5E5]",
        fieldBorder: isDark ? "border-[#333333] group-hover:border-[#555555]" : "border-[#D1D1D1] group-hover:border-[#A1A1A1]",
        textMain: isDark ? "text-white" : "text-black",
        textMuted: isDark ? "text-[#888888]" : "text-[#666666]",
        inputBg: "bg-transparent",
        headerBtn: isDark ? "bg-[#1A1A1A] hover:bg-[#222222] border-white/10" : "bg-[#F5F5F5] hover:bg-[#EEEEEE] border-black/10",
        platformBtn: isDark
            ? "bg-[#1A1A1A] border-[#333333] hover:border-[#555555]"
            : "bg-[#F8F8F8] border-[#00000066] hover:border-[#CCCCCC]",
        platformActive: isDark ? "border-[#E5D5B8]" : "border-black shadow-sm",
        infoBox: isDark ? "bg-[#1A1A1A] border-[#222222]" : "bg-[#F9F9F9] border-[#EAEAEA]"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 backdrop-blur-sm transition-opacity ${isDark ? "bg-black/80" : "bg-black/20"}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-[600px] border rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] transition-colors duration-300 ${theme.bg} ${theme.border}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className={`text-2xl font-bold ${theme.textMain}`}>Create Meeting</h2>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${theme.headerBtn} ${theme.textMain}`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-2 space-y-5">
                    {/* Title Info Box */}
                    <div className={`${isDark ? "bg-[#E5D5B8]" : "bg-[#E8D1AB] shadow-sm"} rounded-xl p-5`}>
                        <p className="text-black font-semibold text-base">
                            Title : Project Catch-up – Lana Guzman
                        </p>
                    </div>

                    {/* Shoots Dropdown */}
                    <fieldset className={`border rounded-xl group transition-colors ${theme.fieldBorder}`}>
                        <legend className={`text-sm px-2 ml-3 transition-colors ${theme.textMuted}`}>Shoots</legend>
                        <div className="relative px-4 pb-3">
                            <select className={`w-full bg-transparent text-sm appearance-none cursor-pointer focus:outline-none py-1 ${theme.textMain}`}>
                                <option value="" className={isDark ? "bg-black" : "bg-white"}>Order for the Lana Guzman - Videography</option>
                                <option value="1" className={isDark ? "bg-black" : "bg-white"}>Order for the Lana Guzman - Photography</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-white/70" : "text-black/50"}`} size={18} />
                        </div>
                    </fieldset>

                    {/* Meeting Start & End Time */}
                    <fieldset className={`border rounded-xl group transition-colors ${theme.fieldBorder}`}>
                        <legend className={`text-sm px-2 ml-3 transition-colors ${theme.textMuted}`}>Meeting Start & End Time</legend>
                        <div className="relative px-4 pb-3">
                            <input
                                type="text"
                                className={`w-full bg-transparent text-sm outline-none py-1 placeholder:text-[#555555] ${theme.textMain}`}
                                placeholder="Select time..."
                            />
                            <Clock className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMain}`} size={18} />
                        </div>
                    </fieldset>

                    {/* Description */}
                    <fieldset className={`border rounded-xl group transition-colors ${theme.fieldBorder}`}>
                        <legend className={`text-sm px-2 ml-3 transition-colors ${theme.textMuted}`}>Description</legend>
                        <div className="px-4 pb-3">
                            <textarea
                                rows={3}
                                className={`w-full bg-transparent text-sm resize-none outline-none py-1 placeholder:text-[#555555] ${theme.textMain}`}
                                placeholder="Add notes for participants..."
                            />
                        </div>
                    </fieldset>

                    {/* Select Meet Links */}
                    <div>
                        <h3 className={`font-semibold mb-3 ${theme.textMain}`}>Select Meet Links</h3>
                        <div className="flex items-center gap-3">
                            {/* Google Meet */}
                            <button
                                onClick={() => setSelectedPlatform('google')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${theme.platformBtn} ${selectedPlatform === 'google'
                                    ? theme.platformActive : ""
                                    }`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.5 13.5v-8.25L17.25 9V6a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 6v12A1.5 1.5 0 003 19.5h12.75a1.5 1.5 0 001.5-1.5v-3l5.25 3.75V13.5z" fill="white" fillOpacity="0.01" />
                                    <path d="M12.75 19.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h9.75a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5z" fill="#00AC47" />
                                    <path d="M22.5 9.75l-5.25 3.75-1.5-1.125V6a1.5 1.5 0 00-1.5-1.5H13.5V3h-9V1.5A1.5 1.5 0 016 0h12.75a1.5 1.5 0 011.5 1.5v3.75l2.25 1.5v3z" fill="#EA4335" />
                                    <path d="M22.5 14.25v-4.5L17.25 13.5v-1.125l1.5-1.125 3.75-2.625V6a1.5 1.5 0 00-1.5-1.5h-5.25v12a1.5 1.5 0 001.5 1.5h5.25v-3.75z" fill="#0066DA" />
                                    <path d="M14.25 4.5H6A1.5 1.5 0 004.5 6v12A1.5 1.5 0 006 19.5h8.25V4.5z" fill="#00AC47" />
                                    <path d="M22.5 9.75v4.5l-5.25-3.75 5.25-0.75z" fill="#EA4335" />
                                    <path d="M17.25 12.375L22.5 16.5v-2.25l-5.25-3.75v1.875z" fill="#0066DA" />
                                    <path d="M12.75 4.5v15H3a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 013 4.5h9.75z" fill="#00832D" />
                                    <path d="M12.75 4.5H6a1.5 1.5 0 00-1.5 1.5v3H15V6a1.5 1.5 0 00-1.5-1.5H12.75z" fill="#00AC47" />
                                    <path d="M12.75 19.5H6a1.5 1.5 0 01-1.5-1.5v-3H15v3a1.5 1.5 0 01-1.5 1.5H12.75z" fill="#00AC47" />
                                    <path d="M22.5 6v12l-5.25-3.75V9.75L22.5 6z" fill="#EA4335" />
                                    <path d="M12.75 4.5H3a1.5 1.5 0 00-1.5 1.5v5.25h12.75V6a1.5 1.5 0 00-1.5-1.5z" fill="#EA4335" />
                                    <path d="M12.75 19.5H3a1.5 1.5 0 01-1.5-1.5v-5.25h12.75v5.25a1.5 1.5 0 01-1.5 1.5z" fill="#0066DA" />
                                    <path d="M1.5 11.25h12.75v1.5H1.5z" fill="none" />
                                    <path d="M22.5 6L17.25 9.75v4.5L22.5 18V6z" fill="#EA4335" />
                                    <g>
                                        <path d="M22.5 6L17.25 9.75v4.5L22.5 18V6z" fill="#F6AD01" />
                                        <path d="M12.75 4.5H3a1.5 1.5 0 00-1.5 1.5v5.25h12.75V6a1.5 1.5 0 00-1.5-1.5z" fill="#EA4335" />
                                        <path d="M12.75 19.5H3a1.5 1.5 0 01-1.5-1.5v-5.25h12.75v5.25a1.5 1.5 0 01-1.5 1.5z" fill="#0066DA" />
                                        <path d="M22.5 6L17.25 9.75v4.5L22.5 18V6z" fill="#00AC47" />
                                        <path d="M17.25 9.75v4.5l5.25 3.75V6l-5.25 3.75z" fill="#EA4335" />
                                        <path d="M3 4.5h9.75A1.5 1.5 0 0114.25 6v12a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 18V6A1.5 1.5 0 013 4.5z" fill="#2684FC" />
                                        <path d="M3 4.5h9.75A1.5 1.5 0 0114.25 6v5.25H1.5V6A1.5 1.5 0 013 4.5z" fill="#EA4335" />
                                        <path d="M14.25 11.25v6.75A1.5 1.5 0 0112.75 19.5H3a1.5 1.5 0 01-1.5-1.5v-6.75h12.75z" fill="#00AC47" />
                                        <path d="M22.5 6v12l-5.25-3.75V9.75L22.5 6z" fill="#0066DA" />
                                        <path d="M14.25 6v12a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h9.75a1.5 1.5 0 011.5 1.5z" fill="none" />
                                        <path d="M12.75 4.5H3a1.5 1.5 0 00-1.5 1.5v5.25h12.75V6a1.5 1.5 0 00-1.5-1.5z" fill="#EA4335" />
                                        <path d="M12.75 19.5H3a1.5 1.5 0 01-1.5-1.5v-5.25h12.75v5.25a1.5 1.5 0 01-1.5 1.5z" fill="#00AC47" />
                                        <path d="M22.5 6l-5.25 3.75v4.5L22.5 18V6z" fill="#4285F4" />
                                    </g>
                                    <path d="M12.75 4.5H3a1.5 1.5 0 00-1.5 1.5v5.25h12.75V6a1.5 1.5 0 00-1.5-1.5z" fill="#EA4335" />
                                    <path d="M12.75 19.5H3a1.5 1.5 0 01-1.5-1.5v-5.25h12.75v5.25a1.5 1.5 0 01-1.5 1.5z" fill="#00AC47" />
                                    <path d="M22.5 6l-5.25 3.75v4.5L22.5 18V6z" fill="#4285F4" />
                                    <path d="M17.25 9.75v4.5L12.75 19.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h9.75l4.5 5.25z" fill="none" />
                                    <rect x="3" y="5" width="11" height="14" rx="1" fill="#00832D" />
                                    <path d="M14 11.5L19 7.5V16.5L14 12.5V11.5Z" fill="#00AC47" />
                                    <path d="M14 11L21 6V18L14 13V11Z" fill="#EA4335" />
                                    <path d="M14 7V17H5V7H14Z" fill="#0066DA" />
                                    <path d="M21 6L14 11V7C14 6.45 13.55 6 13 6H5C4.45 6 4 6.45 4 7V17C4 17.55 4.45 18 5 18H13C13.55 18 14 17.55 14 17V13L21 18V6Z" fill="#00AC47" />
                                    <path d="M14 11L21 6V18L14 13V11Z" fill="#EA4335" />
                                    <path d="M14 7V17H5V7H14Z" fill="#0066DA" />
                                    <rect x="4" y="6" width="10" height="12" rx="1" fill="#00832D" />
                                    <path d="M14 11.5L19 7.5V16.5L14 12.5V11.5Z" fill="#00AC47" />
                                </svg>
                            </button>

                            {/* Zoom */}
                            <button
                                onClick={() => setSelectedPlatform('zoom')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${theme.platformBtn} ${selectedPlatform === 'zoom'
                                    ? theme.platformActive : ""
                                    }`}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M4.5 10.5C4.5 9.11929 5.61929 8 7 8H17C18.3807 8 19.5 9.11929 19.5 10.5V13.5C19.5 14.8807 18.3807 16 17 16H7C5.61929 16 4.5 14.8807 4.5 13.5V10.5Z" fill="#2D8CFF" />
                                    <path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" fill="none" />
                                    <path d="M1.5 8.5L6.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                                    <text x="2" y="15" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial, sans-serif">zoom</text>
                                </svg>
                            </button>

                            {/* Other (Sun/Loom icon) */}
                            <button
                                onClick={() => setSelectedPlatform('other')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${theme.platformBtn} ${selectedPlatform === 'other'
                                    ? theme.platformActive : ""
                                    }`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C12.5523 2 13 2.44772 13 3V5C13 5.55228 12.5523 6 12 6C11.4477 6 11 5.55228 11 5V3C11 2.44772 11.4477 2 12 2Z" />
                                    <path d="M12 18C12.5523 18 13 18.4477 13 19V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19C11 18.4477 11.4477 18 12 18Z" />
                                    <path d="M4.92893 4.92893C5.31946 4.53841 5.95262 4.53841 6.34315 4.92893L7.75736 6.34315C8.14788 6.73367 8.14788 7.36683 7.75736 7.75736C7.36683 8.14788 6.73367 8.14788 6.34315 7.75736L4.92893 6.34315C4.53841 5.95262 4.53841 5.31946 4.92893 4.92893Z" />
                                    <path d="M16.2426 16.2426C16.6332 15.8521 17.2663 15.8521 17.6569 16.2426L19.0711 17.6569C19.4616 18.0474 19.4616 18.6805 19.0711 19.0711C18.6805 19.4616 18.0474 19.4616 17.6569 19.0711L16.2426 17.6569C15.8521 17.2663 15.8521 16.6332 16.2426 16.2426Z" />
                                    <path d="M2 12C2 11.4477 2.44772 11 3 11H5C5.55228 11 6 11.4477 6 12C6 12.5523 5.55228 13 5 13H3C2.44772 13 2 12.5523 2 12Z" />
                                    <path d="M18 12C18 11.4477 18.4477 11 19 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H19C18.4477 13 18 12.5523 18 12Z" />
                                    <path d="M4.92893 19.0711C4.53841 18.6805 4.53841 18.0474 4.92893 17.6569L6.34315 16.2426C6.73367 15.8521 7.36683 15.8521 7.75736 16.2426C8.14788 16.6332 8.14788 17.2663 7.75736 17.6569L6.34315 19.0711C5.95262 19.4616 5.31946 19.4616 4.92893 19.0711Z" />
                                    <path d="M16.2426 7.75736C15.8521 8.14788 15.8521 7.51472 16.2426 7.12419L17.6569 5.70998C18.0474 5.31946 18.6805 5.31946 19.0711 5.70998C19.4616 6.1005 19.4616 6.73367 19.0711 7.12419L17.6569 8.53841C17.2663 8.92893 16.6332 8.92893 16.2426 8.53841V7.75736Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Attach Meet Link */}
                    <fieldset className={`border rounded-xl group transition-colors ${theme.fieldBorder}`}>
                        <legend className={`text-sm px-2 ml-3 transition-colors ${theme.textMuted}`}>Attach Meet Link</legend>
                        <div className="relative px-4 pb-3">
                            <input
                                type="text"
                                className={`w-full bg-transparent text-sm outline-none py-1 ${theme.textMain}`}
                            />
                            <Link className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMain}`} size={18} />
                        </div>
                    </fieldset>

                    {/* Invite Participants */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                        <fieldset className={`border rounded-xl flex-1 group transition-colors ${theme.fieldBorder}`}>
                            <legend className={`text-sm px-2 ml-3 transition-colors ${theme.textMuted}`}>Invite Participants*</legend>
                            <div className="px-4 pb-3">
                                <input
                                    type="text"
                                    placeholder="Search team members, clients..."
                                    className={`w-full bg-transparent text-sm outline-none py-1 placeholder:text-[#555555] ${theme.textMain}`}
                                />
                            </div>
                        </fieldset>
                        <button className={`h-[52px] px-8 font-medium text-lg rounded-xl transition-colors ${isDark ? "bg-[#F3EAD8] hover:bg-[#E5D5B8] text-black" : "bg-black text-white hover:bg-gray-800"
                            }`}>
                            Add
                        </button>
                    </div>

                    {/* Disclaimer */}
                    <div className={`border rounded-xl p-4 flex gap-3 items-start transition-colors ${theme.infoBox}`}>
                        <Info className={`${isDark ? "text-white" : "text-black"} shrink-0 mt-0.5`} size={18} />
                        <p className={`text-xs sm:text-sm leading-relaxed ${theme.textMuted}`}>
                            All invited participants will receive an email with the meeting link and calendar invite.
                        </p>
                    </div>

                    {/* Create Button */}
                    <button className={`w-full sm:w-auto px-8 py-4 font-semibold text-sm rounded-xl transition-all bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black
                    }`}>
                        Create & Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
}