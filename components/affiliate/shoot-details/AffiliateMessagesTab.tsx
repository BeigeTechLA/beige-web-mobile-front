"use client";

import AffiliateCreateChatModal from "./AffiliateCreateChatModal";
import React, { useState } from "react";
import { Search, MoreVertical, Smile, Send } from "lucide-react";

export default function AffiliateMessagesTab() {
    const [hasMessages, setHasMessages] = useState(true);
    const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);

    if (!hasMessages) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] py-20">
                <button
                    onClick={() => setHasMessages(true)}
                    className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                    Show Chat View
                </button>

                <div className="relative mb-8">
                    <div className="w-3 h-3 rounded-full bg-[#333333] absolute -left-12 top-8" />
                    <div className="w-2 h-2 rounded-full bg-[#444444] absolute -right-12 top-12" />
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <path d="M100 20L20 55L45 65L55 90L75 70L100 80L100 20Z" stroke="#E5D5B8" strokeWidth="2" fill="none" />
                        <path d="M45 65L75 35" stroke="#E5D5B8" strokeWidth="2" />
                    </svg>
                </div>

                <h2 className="text-white text-3xl font-bold mb-3">Inbox empty</h2>
                <p className="text-[#888888] text-center mb-2">You have no messages yet.</p>
                <p className="text-[#888888] text-center mb-8">Be the first to start a conversation</p>

                <button
                    onClick={() => setIsCreateChatOpen(true)}
                    className="px-8 py-3 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black font-semibold rounded-full transition-colors"
                >
                    Start Messaging
                </button>

                <AffiliateCreateChatModal isOpen={isCreateChatOpen} onClose={() => setIsCreateChatOpen(false)} />
            </div>
        );
    }

    return (
        <>
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden h-[700px] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-[#222222]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E5D5B8] flex items-center justify-center text-black font-semibold">
                            AF
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Affiliate</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[#888888] text-xs">02 Online Members</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setHasMessages(false)}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg"
                        >
                            Show Empty View
                        </button>

                        <button className="text-[#888888] hover:text-white transition-colors">
                            <Search size={20} />
                        </button>
                        <button className="text-[#888888] hover:text-white transition-colors">
                            <MoreVertical size={20} />
                        </button>
                        <button className="px-4 py-2 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black text-sm font-medium rounded-lg transition-colors">
                            + Add Participant
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-center">
                        <span className="px-4 py-1.5 bg-[#E5D5B8] text-black text-xs font-medium rounded-full">
                            Today
                        </span>
                    </div>

                    <div className="flex justify-center">
                        <span className="text-[#666666] text-sm italic">Affiliate Started The Conversation</span>
                    </div>

                    <div className="flex justify-end gap-3">
                        <div className="max-w-md">
                            <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl rounded-tr-none p-4">
                                <div className="text-[#888888] text-xs mb-1">~ Affiliate</div>
                                <div className="text-white text-sm">Hey, Lana Guzman</div>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 px-2">
                                <span className="text-[#666666] text-xs">12:30 PM</span>
                                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                    <path d="M1 5L5 9L11 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M7 5L11 9L15 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#E5D5B8] flex items-center justify-center text-black text-xs font-semibold shrink-0">
                            AF
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#666666] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            C
                        </div>
                        <div className="max-w-md">
                            <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl rounded-tl-none p-4">
                                <div className="text-[#888888] text-xs mb-1">~ Client</div>
                                <div className="text-white text-sm">
                                    Hey! Quick Question – Are Drone Shots<br />Confirmed for the shoots
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-2">
                                <span className="text-[#666666] text-xs">12:45 PM</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <div className="max-w-md">
                            <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl rounded-tr-none p-4">
                                <div className="text-[#888888] text-xs mb-1">~ Affiliate</div>
                                <div className="text-white text-sm">
                                    Yes, Drone Shots are Confirmed, Lana.<br />They will be included in Final Deliverables
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 px-2">
                                <span className="text-[#666666] text-xs">01:30 PM</span>
                                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                    <path d="M1 5L5 9L11 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M7 5L11 9L15 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#E5D5B8] flex items-center justify-center text-black text-xs font-semibold shrink-0">
                            AF
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E5D5B8] flex items-center justify-center text-black text-xs font-semibold shrink-0">
                            AF
                        </div>
                        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-[#666666] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#222222]">
                    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#333333] rounded-xl px-4 py-3">
                        <button className="text-[#888888] hover:text-white transition-colors">
                            <Smile size={20} />
                        </button>
                        <input
                            type="text"
                            placeholder="Message"
                            className="flex-1 bg-transparent text-white placeholder:text-[#666666] outline-none text-sm"
                        />
                        <button className="text-[#E5D5B8] hover:text-[#D4C3A3] transition-colors">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <AffiliateCreateChatModal isOpen={isCreateChatOpen} onClose={() => setIsCreateChatOpen(false)} />
        </>
    );
}
