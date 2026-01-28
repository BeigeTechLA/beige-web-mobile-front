"use client";

import React, { useState } from "react";
import { X, ChevronDown, Clock, Link, Info } from "lucide-react";

interface AffiliateCreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AffiliateCreateMeetingModal({ isOpen, onClose }: AffiliateCreateMeetingModalProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-[600px] bg-black border border-[#222222] rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-2xl font-bold text-white">Create Meeting</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#222222] text-white transition-colors border border-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-2 space-y-5">
                    {/* Title Info Box */}
                    <div className="bg-[#E5D5B8] rounded-xl p-5">
                        <p className="text-black font-semibold text-base">
                            Title : Project Catch-up – Lana Guzman
                        </p>
                    </div>

                    {/* Shoots Dropdown */}
                    <fieldset className="border border-[#333333] rounded-xl group hover:border-[#555555] transition-colors">
                        <legend className="text-[#888888] text-sm px-2 ml-3">Shoots</legend>
                        <div className="relative px-4 pb-3">
                            <select className="w-full bg-transparent text-white text-sm appearance-none cursor-pointer focus:outline-none py-1">
                                <option value="" className="bg-black">Order for the Lana Guzman - Videography</option>
                                <option value="1" className="bg-black">Order for the Lana Guzman - Photography</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" size={18} />
                        </div>
                    </fieldset>

                    {/* Meeting Start & End Time */}
                    <fieldset className="border border-[#333333] rounded-xl group hover:border-[#555555] transition-colors">
                        <legend className="text-[#888888] text-sm px-2 ml-3">Meeting Start & End Time</legend>
                        <div className="relative px-4 pb-3">
                            <input
                                type="text"
                                placeholder=""
                                className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] outline-none py-1"
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-white" size={18} />
                        </div>
                    </fieldset>

                    {/* Description */}
                    <fieldset className="border border-[#333333] rounded-xl group hover:border-[#555555] transition-colors">
                        <legend className="text-[#888888] text-sm px-2 ml-3">Description</legend>
                        <div className="px-4 pb-3">
                            <textarea
                                rows={3}
                                className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] resize-none outline-none py-1"
                            />
                        </div>
                    </fieldset>

                    {/* Select Meet Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-3">Select Meet Links</h3>
                        <div className="flex items-center gap-3">
                            {/* Google Meet */}
                            <button
                                onClick={() => setSelectedPlatform('google')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === 'google'
                                    ? 'bg-[#1A1A1A] border border-[#E5D5B8]'
                                    : 'bg-[#1A1A1A] border border-[#333333] hover:border-[#555555]'
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
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === 'zoom'
                                    ? 'bg-[#1A1A1A] border border-[#E5D5B8]'
                                    : 'bg-[#1A1A1A] border border-[#333333] hover:border-[#555555]'
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
                    <fieldset className="border border-[#333333] rounded-xl group hover:border-[#555555] transition-colors">
                        <legend className="text-[#888888] text-sm px-2 ml-3">Attach Meet Link</legend>
                        <div className="relative px-4 pb-3">
                            <input
                                type="text"
                                className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] outline-none py-1"
                            />
                            <Link className="absolute right-4 top-1/2 -translate-y-1/2 text-white" size={18} />
                        </div>
                    </fieldset>

                    {/* Invite Participants */}
                    <div className="flex gap-4 items-end">
                        <fieldset className="border border-[#333333] rounded-xl flex-1 group hover:border-[#555555] transition-colors">
                            <legend className="text-[#888888] text-sm px-2 ml-3">Invite Participants*</legend>
                            <div className="px-4 pb-3">
                                <input
                                    type="text"
                                    placeholder="Search team members, clients..."
                                    className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] outline-none py-1"
                                />
                            </div>
                        </fieldset>
                        <button className="h-[52px] px-8 bg-[#F3EAD8] hover:bg-[#E5D5B8] text-black font-medium text-lg rounded-xl transition-colors mb-px">
                            Add
                        </button>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-4 flex gap-3 items-start">
                        <Info className="text-white shrink-0 mt-0.5" size={18} />
                        <p className="text-[#888888] text-xs sm:text-sm leading-relaxed">
                            All invited participants will receive an email with the meeting link and calendar invite.
                        </p>
                    </div>

                    {/* Create Button */}
                    <button className="px-8 py-4 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black font-semibold text-sm rounded-xl transition-colors">
                        Create & Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
}
