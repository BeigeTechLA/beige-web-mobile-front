"use client";

import React, { useState } from "react";
import { Search, Plus, MoreVertical, Send, Smile, UserPlus, Calendar, Check, CheckCheck } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import StartConversationModal from "@/components/admin/StartConversationModal";
import ManageParticipantsModal from "@/components/admin/ManageParticipantsModal";

// Mock Data
const conversations = [
  {
    id: 1,
    name: "Angela Kia",
    message: "Hey! How's it going?",
    time: "04:04AM",
    unread: 3,
    avatar: "/images/avatar.png",
    date: "07",
  },
  {
    id: 2,
    name: "Connor Frazier",
    message: "What kind of music do you like?",
    time: "08:58PM",
    unread: 1,
    avatar: "/images/avatar.png",
    date: "07",
  },
  {
    id: 3,
    name: "Timothy Steele",
    message: "Hi Tina. How's your night going?",
    time: "06:58PM",
    unread: 0,
    avatar: "/images/avatar.png",
    date: "07",
  },
  {
    id: 4,
    name: "Josephine Gordon",
    message: "Sounds good to me!",
    time: "11:33PM",
    unread: 0,
    avatar: "/images/avatar.png",
    date: "07",
  },
];

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">

      {/* Modals */}
      <StartConversationModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
      />
      <ManageParticipantsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">Messages</h1>
          <p className="text-xs lg:text-sm text-white/70">
            Communicate with Users and manage all your conversation in one place
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border border-zinc-900 rounded-3xl flex flex-1 overflow-hidden bg-[#0A0A0A] shadow-2xl">

        {/* Left Sidebar: Chat List */}
        <div className="w-[380px] border-r border-zinc-900 flex flex-col bg-[#0A0A0A]">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Messages</h2>
            </div>

            {/* Search & Add */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Search Conversation"
                  className="w-full bg-[#111] border border-zinc-800 rounded-full py-3 pl-11 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowStartModal(true)}
                className="shrink-0 w-11 h-11 flex items-center justify-center bg-[#E5D5B8] text-black rounded-full hover:opacity-90 transition-opacity"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 custom-scrollbar">
            {conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${activeChat?.id === chat.id
                  ? "bg-[#161616] ring-1 ring-zinc-800"
                  : "hover:bg-zinc-900/40"
                  }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-800">
                    <Image src={chat.avatar} alt={chat.name} width={48} height={48} className="object-cover" />
                  </div>
                  {chat.unread > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-[#E5D5B8] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-[#0A0A0A]">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-semibold text-sm truncate ${activeChat?.id === chat.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {chat.name}
                    </h3>
                    <span className="text-[10px] text-zinc-600 shrink-0 flex gap-1">
                      <span>{chat.date}</span>
                      <span>/</span>
                      <span>{chat.time}</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
                    {chat.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0D0D0D] relative">

          {/* Chat Header */}
          <div className="px-8 py-5 border-b border-zinc-900 flex items-center justify-between bg-[#0D0D0D]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-zinc-800">
                  <Image src={activeChat?.avatar || "/images/avatar.png"} alt="Admin" width={44} height={44} className="object-cover" />
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#0D0D0D]"></span>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-white text-base">Admin</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <p className="text-[11px] text-zinc-500 font-medium">02 Online Participants</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                <Search size={20} />
              </button>
              <button className="p-2.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                <MoreVertical size={20} />
              </button>
              <Button
                onClick={() => setShowManageModal(true)}
                className="bg-[#E5D5B8] text-black px-5 py-2.5 h-10 rounded-lg text-xs font-bold hover:bg-[#d4c4a7] transition-colors flex gap-2 ml-2"
              >
                <Plus size={16} /> {/* Using Plus instead of UserPlus to match button style generally, or kept UserPlus if preferred. 'Add Participant' usually implies a user icon. */}
                Add Participant
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar relative bg-[#0D0D0D]">
            {/* Date Pill */}
            <div className="flex justify-center sticky top-0 z-10 pointer-events-none">
              <span className="bg-[#E5D5B8] text-[#3E3E3E] text-[11px] px-4 py-1.5 rounded-lg font-bold shadow-sm">
                Today
              </span>
            </div>

            {/* System Notice */}
            <div className="flex justify-center">
              <span className="text-zinc-600 text-[11px] italic bg-zinc-900/40 px-5 py-2 rounded-full border border-zinc-800/30">
                Admin Started The Conversation
              </span>
            </div>

            {/* Message: Client (Left) */}
            <div className="flex items-start gap-3 max-w-[65%] group">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-1 border border-zinc-800">
                <Image src="/images/avatar.png" alt="User" width={36} height={36} />
              </div>
              <div className="space-y-1.5">
                <div className="bg-[#161616] p-4 rounded-[18px] rounded-tl-none border border-zinc-800/60 shadow-sm">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1.5">~ User</span>
                  <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">
                    Hey! Quick Question - Are Drone Shots Confirmed for the shoots
                  </p>
                </div>
                <span className="text-[10px] text-zinc-600 ml-1 font-medium block">12:45 PM</span>
              </div>
            </div>

            {/* Message: Admin (Right) */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-start gap-3 max-w-[65%] flex-row-reverse">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-1 border border-zinc-800">
                  <Image src="/images/avatar.png" alt="Admin" width={36} height={36} />
                </div>
                <div className="space-y-1.5">
                  <div className="bg-[#1A1A1A] p-4 rounded-[18px] rounded-br-none border border-zinc-800/60 shadow-sm text-right">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-1.5">~ Admin</span>
                    <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">
                      Hey, Lana Guzman
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mr-14">
                <span className="text-[10px] text-zinc-600 font-medium">12:30 PM</span>
                <CheckCheck size={14} className="text-green-500" />
              </div>
            </div>

            {/* Message: Admin 2 (Right) */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-start gap-3 max-w-[65%] flex-row-reverse">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-1 border border-zinc-800">
                  <Image src="/images/avatar.png" alt="Admin" width={36} height={36} />
                </div>
                <div className="space-y-1.5">
                  <div className="bg-[#1A1A1A] p-4 rounded-[18px] rounded-br-none border border-zinc-800/60 shadow-sm text-right">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-1.5">~ Admin</span>
                    <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">
                      Yes, Drone Shots are Confirmed, Lana. They will be included in Final Deliverables
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mr-14">
                <span className="text-[10px] text-zinc-600 font-medium">01:30 PM</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
                  <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
                  <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
                </div>
                <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-800 ml-1 relative">
                  {/* Small read receipt avatar as seen in design */}
                  <Image src="/images/avatar.png" alt="read" fill className="object-cover" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer Input */}
          <div className="p-6 pt-2 bg-[#0D0D0D]">
            <div className="bg-[#1d1d1d] border border-zinc-800 rounded-2xl p-2.5 flex items-center gap-3 focus-within:border-[#E5D5B8]/30 transition-colors">
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Smile size={22} />
              </button>
              <input
                type="text"
                placeholder="Message"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-500 py-1"
              />
              <button className="p-2 text-[#E5D5B8] hover:text-[#d4c4a7] transition-colors">
                <Send size={20} className="-rotate-45" fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #27272a;
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #3f3f46;
                }
            `}</style>
    </div>
  );
}
