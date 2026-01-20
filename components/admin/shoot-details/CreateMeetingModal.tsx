"use client";

import React, { useState } from "react";
import { X, ChevronDown, Clock } from "lucide-react";

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateMeetingModal({ isOpen, onClose }: CreateMeetingModalProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-black border border-[#222222] rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-[#222222]">
                    <h2 className="text-2xl font-bold text-white">Create Meeting</h2>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#222222] text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Title Info Box */}
                    <div className="bg-[#E5D5B8] rounded-xl p-4">
                        <p className="text-black font-medium">
                            Title : Project Catch-up – Lana Guzman
                        </p>
                    </div>

                    {/* Shoots Dropdown */}
                    <fieldset className="border border-[#333333] rounded-xl">
                        <legend className="text-[#888888] text-sm px-2 ml-2">Shoots</legend>
                        <div className="relative px-4 pb-3">
                            <select className="w-full bg-transparent text-white text-sm appearance-none cursor-pointer focus:outline-none">
                                <option value="" className="bg-black">Order for the Lana Guzman - Videography</option>
                                <option value="1" className="bg-black">Other Shoot Option 1</option>
                                <option value="2" className="bg-black">Other Shoot Option 2</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={18} />
                        </div>
                    </fieldset>

                    {/* Meeting Start & End Time */}
                    <fieldset className="border border-[#333333] rounded-xl">
                        <legend className="text-[#888888] text-sm px-2 ml-2">Meeting Start & End Time</legend>
                        <div className="relative px-4 pb-3">
                            <input
                                type="text"
                                placeholder=""
                                className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] outline-none"
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-white" size={18} />
                        </div>
                    </fieldset>

                    {/* Description */}
                    <fieldset className="border border-[#333333] rounded-xl">
                        <legend className="text-[#888888] text-sm px-2 ml-2">Description</legend>
                        <div className="px-4 pb-2">
                            <textarea
                                rows={3}
                                placeholder=""
                                className="w-full bg-transparent text-white text-sm placeholder:text-[#555555] resize-none outline-none"
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
                                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === 'google'
                                    ? 'bg-[#E5D5B8] border-2 border-[#E5D5B8]'
                                    : 'bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#555555]'
                                    }`}
                            >
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" rx="6" fill="#4285F4" />
                                    <path d="M20 16L16 12V20L20 16Z" fill="white" />
                                    <path d="M12 12H16V20H12V12Z" fill="white" />
                                </svg>
                            </button>

                            {/* Zoom */}
                            <button
                                onClick={() => setSelectedPlatform('zoom')}
                                className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === 'zoom'
                                    ? 'bg-[#E5D5B8] border-2 border-[#E5D5B8]'
                                    : 'bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#555555]'
                                    }`}
                            >
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" rx="6" fill="#2D8CFF" />
                                    <text x="16" y="22" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">Z</text>
                                </svg>
                            </button>

                            {/* Other */}
                            <button
                                onClick={() => setSelectedPlatform('other')}
                                className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === 'other'
                                    ? 'bg-[#E5D5B8] border-2 border-[#E5D5B8]'
                                    : 'bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#555555]'
                                    }`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Schedule Button */}
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black font-semibold text-sm rounded-xl transition-colors">
                        Schedule Meeting
                    </button>
                </div>
            </div>
        </div>
    );
}
