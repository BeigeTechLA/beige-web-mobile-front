"use client";

import React, { useState } from "react";
import {
    ArrowLeft,
    Upload,
    Link as LinkIcon,
    Search,
    ChevronDown,
    LayoutGrid,
    List,
    MoreHorizontal,
    Download,
    FileImage,
    FileVideo
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostProductionFolderViewProps {
    folderId: string;
    folderName: string;
    onBack: () => void;
}

// Mock data for files
const mockFiles = [
    {
        id: "1",
        name: "Image123",
        type: "image",
        url: "/placeholder-image.jpg", // In a real app this would be a real URL
        previewColor: "#ffffff"
    },
    {
        id: "2",
        name: "Video.mp4",
        type: "video",
        preview: "transparent",
    },
    {
        id: "3",
        name: "Video.mp4",
        type: "video",
        progress: 40, // download/upload progress
    },
    {
        id: "4",
        name: "Video.mp4",
        type: "video",
        progress: 65,
    },
];

export default function PostProductionFolderView({ folderId, folderName, onBack }: PostProductionFolderViewProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#E0E0E0] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="h-6 w-[1px] bg-[#333333]" />

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#222222] flex items-center justify-center text-[#999999]">
                            {/* Folder Icon Placeholder */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold text-[#E0E0E0]">{folderName} (24 Items)</span>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black rounded-xl font-medium transition-colors">
                    <Upload size={18} />
                    <span>Upload Files</span>
                </button>
            </div>

            {/* Linked Shoot Info Card */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black">
                        <LinkIcon size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#888888] text-sm">Linked to:</span>
                            <span className="text-[#E0E0E0] text-sm font-medium">Corporate Event 2026</span>
                        </div>
                        <div className="text-[#666666] text-xs flex items-center gap-2 mt-0.5">
                            {/* Calendar Icon */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>Jan 15, 2024</span>
                        </div>
                    </div>
                </div>
                <button className="text-[#E0E0E0] text-sm underline underline-offset-4 hover:text-white">
                    Change Shoot
                </button>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#111111] border border-[#222222] rounded-xl py-2.5 pl-10 pr-4 text-[#E0E0E0] placeholder:text-[#666666] focus:outline-none focus:border-[#333333]"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    <button className="flex items-center gap-3 px-4 py-2.5 bg-[#111111] border border-[#222222] rounded-xl text-[#E0E0E0] text-sm hover:bg-[#1A1A1A] transition-colors">
                        <span>Status</span>
                        <ChevronDown size={16} />
                    </button>

                    {/* View Toggle */}
                    <div className="flex bg-[#111111] border border-[#222222] rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "grid"
                                    ? "bg-[#E5D5B8] text-black"
                                    : "text-[#666666] hover:text-[#E0E0E0]"
                            )}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "list"
                                    ? "bg-[#E5D5B8] text-black"
                                    : "text-[#666666] hover:text-[#E0E0E0]"
                            )}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-4 gap-6">
                {mockFiles.map((file) => (
                    <div key={file.id} className="bg-[#111111] border border-[#222222] rounded-2xl p-3 group">
                        <div className="border-b border-[#222222] pb-3 mb-3 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-[#E0E0E0] text-sm font-medium">
                                {file.type === 'image' ? <FileImage size={16} /> : <FileVideo size={16} />}
                                {file.name}
                            </div>
                            <button className="text-[#666666] hover:text-white">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="aspect-square bg-[#000] rounded-xl relative overflow-hidden flex items-center justify-center">
                            {file.type === 'image' ? (
                                <img src="/api/placeholder/400/400" alt="Placeholder" className="w-full h-full object-cover" />
                            ) : (
                                // Simple checkerboard pattern for transparent video placeholder
                                <div className="w-full h-full bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a),linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] bg-[#111]">
                                    {/* Download / Action Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-[#333] rounded-lg flex items-center justify-center text-[#999]">
                                            <Download size={20} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar for uploads/downloads */}
                            {file.progress && (
                                <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#E5D5B8] rounded-full"
                                        style={{ width: `${file.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
