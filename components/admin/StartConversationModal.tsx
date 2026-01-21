"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StartConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [selectedClient, setSelectedClient] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Mock data
    const clients = ["Client A", "Client B", "Client C"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[480px] bg-black border border-zinc-800 rounded-[24px] p-6 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-2xl font-bold">Start New Conversation</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* content */}
                <div className="space-y-6">
                    {/* Custom Select Input */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-14 px-4 bg-transparent border border-zinc-700 rounded-xl flex items-center justify-between group hover:border-zinc-500 transition-colors"
                        >
                            <span className={`text-sm ${selectedClient ? 'text-white' : 'text-zinc-500'}`}>
                                {selectedClient || "Select Order / Client"}
                            </span>
                            <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />

                            {/* Legend-like label if needed, or just placeholder style. 
                        Design shows "Select Order / Client" inside a border cut or just normal.
                        I'll stick to a clean internal placeholder for now as per "Select Order / Client" text in the image.
                     */}
                        </button>

                        {/* Dropdown Options */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                                {clients.map(client => (
                                    <div
                                        key={client}
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer text-sm"
                                    >
                                        {client}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-fit px-8 h-10 bg-[#E5D5B8] text-black hover:bg-[#d4c4a7] rounded-lg font-medium text-sm"
                        onClick={onClose}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StartConversationModal;
