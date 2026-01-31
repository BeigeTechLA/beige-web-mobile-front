"use client";

import React, { useState } from 'react';
import { MessageCircle, Send, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SalesMessagesView() {
    const [selectedChat, setSelectedChat] = useState<number | null>(1);

    const chats = [
        { id: 1, name: 'John Doe', lastMessage: 'Looking forward to the shoot!', time: '2h ago', unread: 2 },
        { id: 2, name: 'Jane Smith', lastMessage: 'Can we reschedule?', time: '5h ago', unread: 0 },
        { id: 3, name: 'Tech Corp Team', lastMessage: 'Perfect, see you then', time: '1d ago', unread: 1 },
    ];

    const messages = [
        { id: 1, sender: 'John Doe', message: 'Hi! I wanted to discuss the upcoming shoot.', time: '10:30 AM', isMine: false },
        { id: 2, sender: 'You', message: 'Of course! What would you like to know?', time: '10:32 AM', isMine: true },
        { id: 3, sender: 'John Doe', message: 'Looking forward to the shoot!', time: '10:35 AM', isMine: false },
    ];

    return (
        <div className="flex h-[calc(100vh-200px)] gap-6">
            {/* Chat List */}
            <div className="w-80 bg-[#1A1A1A] border border-zinc-800 rounded-xl p-4 flex flex-col">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <Input
                            placeholder="Search conversations..."
                            className="bg-[#0f0f0f] border-zinc-800 pl-10 text-white placeholder:text-zinc-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChat === chat.id ? 'bg-[#E5D5B8]/10 border border-[#E5D5B8]/20' : 'hover:bg-[#202020]'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <span className="text-white font-medium">{chat.name}</span>
                                <span className="text-xs text-zinc-500">{chat.time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-400 truncate flex-1">{chat.lastMessage}</p>
                                {chat.unread > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#E5D5B8] text-black text-xs rounded-full font-medium">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-[#1A1A1A] border border-zinc-800 rounded-xl flex flex-col">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#E5D5B8]/20 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-[#E5D5B8]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">
                                        {chats.find(c => c.id === selectedChat)?.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500">Active now</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${msg.isMine ? 'bg-[#E5D5B8] text-black' : 'bg-[#202020] text-white'} rounded-lg p-3`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <span className={`text-xs ${msg.isMine ? 'text-black/60' : 'text-zinc-500'} mt-1 block`}>
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[#0f0f0f] border-zinc-800 text-white"
                                />
                                <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
