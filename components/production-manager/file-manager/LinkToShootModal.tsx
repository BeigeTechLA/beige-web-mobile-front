"use client";

import React, { useState } from "react";
import { X, Search, Calendar, MapPin, Lightbulb } from "lucide-react";
import { Button } from "../../ui/button";

interface Shoot {
    id: string;
    name: string;
    date: string;
    location: string;
}

interface LinkToShootModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
}

const LinkToShootModal: React.FC<LinkToShootModalProps> = ({
    isOpen,
    onClose,
    folderName,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedShootId, setSelectedShootId] = useState<string | null>(null);

    // Mock data for shoots
    const shoots: Shoot[] = [
        { id: "1", name: "Product Launch 2024", date: "Jan 15, 2024", location: "Studio A" },
        { id: "2", name: "Sarah & Mike Wedding", date: "Jan 10, 2024", location: "Grand Hotel" },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[540px] bg-black border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex items-start justify-between p-3 lg:p-5 border-b border-b-white/30">
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-2">Link Folder to Shoots</h2>
                        <p className="text-white/60 text-sm mt-1">
                            Link "{folderName}" to a booked shoot
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 lg:p-5">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search shoots..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-[#979797] focus:outline-none focus:ring-1 focus:ring-[#E8D1AB]/50 transition-all"
                            />
                        </div>

                        {/* Shoot List */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {shoots.map((shoot) => (
                                <div
                                    key={shoot.id}
                                    onClick={() => setSelectedShootId(shoot.id)}
                                    className={`group cursor-pointer p-3 lg:py-4 lg:px-5 rounded-xl border transition-all ${selectedShootId === shoot.id
                                        ? "bg-[#E8D1AB]/5 border-[#E8D1AB]"
                                        : "bg-transparent border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    <h4 className="text-white font-semibold lg:text-lg">{shoot.name}</h4>
                                    <div className="flex items-center gap-5 mt-2">
                                        <div className="flex items-center gap-1.5 text-[#979797] text-sm font-medium">
                                            <Calendar size={14} />
                                            {shoot.date}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#979797] text-sm font-medium">
                                            <MapPin size={14} />
                                            {shoot.location}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info Tip Box */}
                        <div className="bg-[#F3F8FF] rounded-lg p-3 flex gap-3 border border-[#BFDBFE]">
                            <Lightbulb className="text-[#1E40AF] shrink-0 mt-0.5" size={18} />
                            <p className="text-[#1E40AF] text-sm leading-relaxed">
                                Once linked, this folder will be visible to the client for this shoot.
                                They will be able to view and download files.
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-start gap-3 mt-4 lg:mt-8">
                        <Button
                            onClick={onClose}
                            className="bg-white text-black hover:bg-white/90 rounded-lg h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!selectedShootId}
                            className="bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90 rounded-lg h-9 disabled:opacity-50"
                        >
                            Link Shoots
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkToShootModal;
