"use client";

import React, { useState } from "react";
import {
    LayoutGrid,
    List,
    ChevronDown,
    Folder,
    MoreVertical,
    Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderData {
    id: string;
    name: string;
    items: number;
    category: string;
    linked: boolean;
    lastUpdated: string; // For Grid: "Opened 2 hours ago", For List: "02 Hours Ago"
}

const folders: FolderData[] = [
    {
        id: "1",
        name: "Raw Footage",
        items: 24,
        category: "Corporate Event",
        linked: true,
        lastUpdated: "Opened 2 hours ago",
    },
    {
        id: "2",
        name: "Edited Footage",
        items: 24,
        category: "Corporate Event",
        linked: true,
        lastUpdated: "Opened 2 hours ago",
    },
    {
        id: "3",
        name: "Final Deliverables",
        items: 24,
        category: "Corporate Event",
        linked: true,
        lastUpdated: "Opened 2 hours ago",
    },
];

import PostProductionFolderView from "./PostProductionFolderView";

export default function PostProductionTab() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null);

    // If a folder is selected, show the folder details view
    if (selectedFolder) {
        return (
            <PostProductionFolderView
                folderId={selectedFolder.id}
                folderName={selectedFolder.name}
                onBack={() => setSelectedFolder(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#999999]">
                        {/* Using a generic folder icon here as a placeholder for the specialized icon in design */}
                        <Folder size={20} />
                    </div>
                    <span className="text-[#E0E0E0] text-lg font-medium">Uploaded Folders</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Dropdown */}
                    <button className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-[#E0E0E0] text-sm hover:bg-[#222222] transition-colors">
                        <span>Status</span>
                        <ChevronDown size={16} />
                    </button>

                    {/* View Toggle */}
                    <div className="flex bg-[#1A1A1A] border border-[#222222] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-md transition-all",
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
                                "p-2 rounded-md transition-all",
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

            {/* Grid View */}
            {viewMode === "grid" && (
                <div className="grid grid-cols-3 gap-6">
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            onClick={() => setSelectedFolder(folder)}
                            className="cursor-pointer bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden group hover:border-[#333333] transition-colors"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Folder className="text-[#E5D5B8] fill-[#E5D5B8] w-8 h-8" />
                                        <div>
                                            <h3 className="text-[#E0E0E0] font-semibold text-base group-hover:text-[#E5D5B8] transition-colors">
                                                {folder.name}
                                            </h3>
                                            <p className="text-[#666666] text-xs mt-0.5">
                                                {folder.items} Item
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-[#666666] hover:text-white" onClick={(e) => {
                                        e.stopPropagation();
                                        // Menu action
                                    }}>
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mt-6">
                                    <span className="px-4 py-2 bg-[#1A1A1A] rounded-full text-xs text-[#E0E0E0] border border-[#222222]">
                                        {folder.category}
                                    </span>
                                    {folder.linked && (
                                        <span className="px-4 py-2 bg-[#D1FAE5] bg-opacity-10 text-[#6EE7B7] rounded-full text-xs border border-[#6EE7B7]/20 flex items-center gap-1.5">
                                            <LinkIcon size={12} />
                                            Linked
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-[#222222] bg-[#161616]/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center text-xs font-semibold">
                                    DP
                                </div>
                                <span className="text-[#999999] text-sm">{folder.lastUpdated}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#222222]">
                                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Name</th>
                                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Category</th>
                                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[10%]">Files</th>
                                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Last Updated</th>
                                <th className="px-6 py-4 text-[#888888] font-medium text-sm text-right w-[10%]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folders.map((folder) => (
                                <tr
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder)}
                                    className="cursor-pointer border-b border-[#222222] last:border-0 hover:bg-[#161616] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
                                                <Folder size={20} className="text-[#999999]" />
                                            </div>
                                            <span className="text-[#E0E0E0] font-medium">{folder.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-4 py-1.5 bg-[#DBeafe] text-[#1E40AF] rounded-full text-xs font-medium">
                                            Corporate
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[#E0E0E0] text-sm">{folder.items}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[#E0E0E0] text-sm">02 Hours Ago</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-[#666666] hover:text-white p-2" onClick={(e) => {
                                            e.stopPropagation();
                                            // Menu Action
                                        }}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
