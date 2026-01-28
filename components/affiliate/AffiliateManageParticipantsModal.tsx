"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ManageParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AffiliateManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [selectedCP, setSelectedCP] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const team = [
        { name: "Nasir Uddin", role: "Post Production Manager", image: "/images/avatar.png" },
        { name: "Cameron Williamson", role: "Project Manager", image: "/images/avatar.png" },
        { name: "Leslie Alexander", role: "Sales Representative", image: "/images/avatar.png" },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[600px] bg-black border border-zinc-800 rounded-[24px] p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-2xl font-bold">Manage Participants</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-10 text-center">
                    <h3 className="text-white font-medium mb-6">Project Management Team</h3>
                    <div className="flex justify-center gap-8">
                        {team.map((member, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-800 relative">
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-sm font-semibold mb-0.5">{member.name}</p>
                                    <p className="text-zinc-500 text-xs">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-px w-full bg-zinc-900 mb-8"></div>

                <div className="space-y-8">
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-14 px-4 bg-transparent border border-zinc-700 rounded-xl flex items-center justify-between group hover:border-zinc-500 transition-colors"
                        >
                            <span className={`text-sm ${selectedCP ? 'text-white' : 'text-zinc-500'}`}>
                                {selectedCP || "Select Assigned CP"}
                            </span>
                            <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                                {["CP 1", "CP 2", "CP 3"].map(cp => (
                                    <div
                                        key={cp}
                                        onClick={() => {
                                            setSelectedCP(cp);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer text-sm"
                                    >
                                        {cp}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c4a7] rounded-xl font-medium text-base w-fit px-8"
                        onClick={onClose}
                    >
                        Create Chat
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AffiliateManageParticipantsModal;
