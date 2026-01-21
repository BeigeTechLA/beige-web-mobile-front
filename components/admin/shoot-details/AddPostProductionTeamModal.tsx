"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddPostProductionTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddPostProductionTeamModal: React.FC<AddPostProductionTeamModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [selectedTeam, setSelectedTeam] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Mock data
    const teams = ["Editing Team A", "VFX Team B", "Colorist Team C"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[500px] bg-black border border-zinc-800 rounded-[24px] p-8 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-2xl font-bold">Add Post Production Team</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    <div className="relative">
                        {/* Custom Select Input */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-14 px-4 bg-transparent border border-zinc-700 rounded-xl flex items-center justify-between group hover:border-zinc-500 transition-colors"
                        >
                            <span className={`text-sm ${selectedTeam ? 'text-white' : 'text-zinc-500'}`}>
                                {selectedTeam || "Select Post Production Team"}
                            </span>
                            <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Label (Visual only to match design if needed, but placeholder is clear) */}
                        <span className="absolute -top-2.5 left-4 bg-black px-1 text-xs text-zinc-500">
                            Select Post Production Team
                        </span>

                        {/* Dropdown Options */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                                {teams.map(team => (
                                    <div
                                        key={team}
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer text-sm"
                                    >
                                        {team}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-fit px-8 h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c4a7] rounded-lg font-medium text-base"
                        onClick={onClose}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddPostProductionTeamModal;
