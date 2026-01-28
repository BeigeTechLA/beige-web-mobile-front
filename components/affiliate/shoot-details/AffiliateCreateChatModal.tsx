"use client";

import React from "react";
import { X, ChevronDown } from "lucide-react";

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const teamMembers = [
    { name: "Nasir Uddin", role: "Post Production Manager", avatar: "/api/placeholder/120/120" },
    { name: "Cameron Williamson", role: "Project Manager", avatar: "/api/placeholder/120/120" },
    { name: "Leslie Alexander", role: "Sales Representative", avatar: "/api/placeholder/120/120" },
];

export default function AffiliateCreateChatModal({ isOpen, onClose }: CreateChatModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl bg-black border border-[#222222] rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-[#222222]">
                    <h2 className="text-3xl font-bold text-white">Create Chat</h2>
                    <button
                        onClick={onClose}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#222222] text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-white text-2xl font-semibold text-center mb-8">
                            Project Management Team
                        </h3>
                        <div className="flex justify-center gap-12">
                            {teamMembers.map((member, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-[#333333]">
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h4 className="text-white font-semibold text-lg mb-1">{member.name}</h4>
                                    <span className="text-[#888888] text-sm">{member.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[#888888] text-sm mb-3 block">Select Assigned CP</label>
                        <div className="relative">
                            <select className="w-full bg-transparent border border-[#333333] rounded-xl px-6 py-4 text-white appearance-none cursor-pointer focus:outline-none focus:border-[#E5D5B8] transition-colors">
                                <option value="" className="bg-black">Select a CP...</option>
                                <option value="1" className="bg-black">CP Option 1</option>
                                <option value="2" className="bg-black">CP Option 2</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={20} />
                        </div>
                    </div>

                    <button className="w-auto px-10 py-3.5 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black font-semibold text-lg rounded-xl transition-colors">
                        Create Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
