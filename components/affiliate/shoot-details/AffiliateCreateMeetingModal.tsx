"use client";

import React, { useState } from "react";
import { X, ChevronDown, Clock, Link, Info } from "lucide-react";

interface AffiliateCreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark?: boolean;
}

export default function AffiliateCreateMeetingModal({ isOpen, onClose, isDark = true }: AffiliateCreateMeetingModalProps) {
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
                                <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                                    <circle cx="24" cy="24" r="20" fill="#2D8CFF" />
                                    <path d="M13 18C13 16.8954 13.8954 16 15 16H25C26.1046 16 27 16.8954 27 18V26C27 27.1046 26.1046 28 25 28H15C13.8954 28 13 27.1046 13 26V18Z" fill="white" />
                                    <path d="M28 20L35 15V29L28 24V20Z" fill="white" />
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