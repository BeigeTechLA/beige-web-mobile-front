"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  List,
  ChevronDown,
  Folder,
  MoreVertical,
  Link as LinkIcon,
  FolderSearch,
  Grid3X3,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

import PostProductionFolderView from "./PostProductionFolderView";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import { Button } from "@/components/ui/button";

interface FolderData {
  id: string;
  name: string;
  items: number;
  category: string;
  linked: boolean;
  lastUpdated: string; // For Grid: "Opened 2 hours ago", For List: "02 Hours Ago"
}

const folders: FolderData[] = [];

export default function PostProductionTab({ isDark = true }: { isDark?: boolean }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Menu State
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [activeFolderTitle, setActiveFolderTitle] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, folderTitle: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveFolderTitle(folderTitle);

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top + 10 // Adjusted to appear below button
    });
  };

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

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#111111] border border-[#222222] text-[#999999]" : "bg-[#F3F3F3] border border-[#E3E3E3] text-zinc-500"
            }`}>
            <FolderSearch size={20} />
          </div>
          <span className={`text-sm lg:text-lg font-medium transition-colors ${isDark ? "text-[#E0E0E0]" : "text-[#171717]"
            }`}>Uploaded Folders</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Dropdown */}
          <button className={`flex items-center gap-3 px-4 py-2 border rounded-lg text-sm transition-colors ${isDark ? "bg-[#1A1A1A] border-[#222222] text-[#E0E0E0] hover:bg-[#222222]" : "bg-white border-[#E3E3E3] text-[#171717] hover:bg-zinc-50"
            }`}>
            <span>Status</span>
            <ChevronDown size={16} />
          </button>

          {/* MOBILE VIEW: Dropdown Button */}
          <div className="md:hidden relative">
            <Button
              onClick={toggleDropdown}
              className={`flex items-center gap-2 border p-2 h-8 rounded-lg transition-colors ${isDark ? "bg-[#202020] border-white/10 text-white" : "bg-white border-[#E3E3E3] text-[#171717]"
                }`}
            >
              {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-[50] overflow-hidden ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-[#E3E3E3]"
                }`}>
                <button
                  onClick={() => handleSelect('grid')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid'
                      ? (isDark ? "bg-white/10 text-white" : "bg-[#F3F3F3] text-black")
                      : (isDark ? "text-white/60 hover:bg-white/5" : "text-zinc-500 hover:bg-zinc-50")
                    }`}
                >
                  <Grid3X3 size={18} />
                  Grid View
                </button>
                <button
                  onClick={() => handleSelect('list')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list'
                      ? (isDark ? "bg-white/10 text-white" : "bg-[#F3F3F3] text-black")
                      : (isDark ? "text-white/60 hover:bg-white/5" : "text-zinc-500 hover:bg-zinc-50")
                    }`}
                >
                  <List size={18} />
                  List View
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW: Toggle */}
          <div className={`hidden lg:flex border rounded-lg p-1 transition-colors ${isDark ? "bg-[#1A1A1A] border-[#222222]" : "bg-[#F3F3F3] border-[#E3E3E3]"
            }`}>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-[#E5D5B8] text-black shadow-sm"
                  : (isDark ? "text-[#666666] hover:text-[#E0E0E0]" : "text-zinc-400 hover:text-zinc-600")
                }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list"
                  ? "bg-[#E5D5B8] text-black shadow-sm"
                  : (isDark ? "text-[#666666] hover:text-[#E0E0E0]" : "text-zinc-400 hover:text-zinc-600")
                }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.length > 0 ? (
            folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`cursor-pointer border rounded-2xl overflow-hidden group transition-all ${
                  isDark 
                    ? "bg-[#111111] border-[#222222] hover:border-[#333333]" 
                    : "bg-white border-[#E3E3E3] hover:shadow-md"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Folder className="text-[#E5D5B8] fill-[#E5D5B8] w-8 h-8" />
                      <div>
                        <h3 className={`font-semibold text-base transition-colors ${
                          isDark ? "text-[#E0E0E0] group-hover:text-[#E5D5B8]" : "text-[#171717] group-hover:text-black"
                        }`}>
                          {folder.name}
                        </h3>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-[#666666]" : "text-zinc-500"}`}>
                          {folder.items} Item
                        </p>
                      </div>
                    </div>
                    <button 
                      className={`p-2 rounded-full transition-colors ${
                        isDark ? "text-[#666666] hover:text-white hover:bg-[#222222]" : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                      }`} 
                      onClick={(e) => handleOpenMenu(e, folder.name)}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <span className={`px-4 py-2 rounded-full text-xs border transition-colors ${
                      isDark ? "bg-[#1A1A1A] border-[#222222] text-[#E0E0E0]" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                    }`}>
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

                <div className={`px-6 py-4 border-t flex items-center gap-3 transition-colors ${
                  isDark ? "border-[#222222] bg-[#161616]/50" : "border-[#F0F0F0] bg-zinc-50/50"
                }`}>
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center text-xs font-semibold">
                    DP
                  </div>
                  <span className={`text-sm ${isDark ? "text-[#999999]" : "text-zinc-500"}`}>{folder.lastUpdated}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-full border rounded-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center transition-colors ${
              isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E3E3E3]"
            }`}>
              <EmptyStateContent isDark={isDark} />
            </div>
          )}
        </div>
      ) : (
        <div className={`border rounded-2xl overflow-hidden transition-colors ${
          isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E3E3E3]"
        }`}>
          <table className="hidden lg:table w-full text-left">
            <thead>
              <tr className={`border-b ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Name</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Category</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[10%]">Files</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Last Updated</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm text-right w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody>
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <tr
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`cursor-pointer border-b last:border-0 transition-colors ${
                      isDark ? "border-[#222222] hover:bg-[#161616]" : "border-[#F0F0F0] hover:bg-zinc-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                          isDark ? "bg-[#1A1A1A] border-[#222222]" : "bg-zinc-100 border-zinc-200"
                        }`}>
                          <Folder size={20} className="text-[#999999]" />
                        </div>
                        <span className={`font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#171717]"}`}>{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-4 py-1.5 bg-[#DBeafe] text-[#1E40AF] rounded-full text-xs font-medium">
                        {folder.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={isDark ? "text-[#E0E0E0] text-sm" : "text-[#171717] text-sm"}>{folder.items}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={isDark ? "text-[#E0E0E0] text-sm" : "text-[#171717] text-sm"}>{folder.lastUpdated}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className={`p-2 rounded-full transition-colors ${
                          isDark ? "text-[#666666] hover:text-white hover:bg-[#222222]" : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                        }`} 
                        onClick={(e) => handleOpenMenu(e, folder.name)}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <EmptyStateContent isDark={isDark} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* MOBILE COLLAPSIBLE VIEW */}
          <div className="lg:hidden flex flex-col">
            {folders.length > 0 ? (
              folders.map((folder) => (
                <MobileFolderRow
                  key={folder.id}
                  folder={folder}
                  onSelect={() => setSelectedFolder(folder)}
                  onOpenMenu={handleOpenMenu}
                  isDark={isDark}
                />
              ))
            ) : (
              <div className="py-20 px-6">
                <EmptyStateContent isDark={isDark} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Action Menu */}
      {menuAnchor && (
        <FileActionMenu
          folderName={activeFolderTitle}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => setIsLinkModalOpen(true)}
          anchor={menuAnchor}
        />
      )}

      {/* Link Modal */}
      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={activeFolderTitle || ""}
      />
    </div>
  );
}

// Helper components for readability
function EmptyStateContent({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-6 relative">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#E5D5B8" strokeWidth="1">
          <path d="M10 30 L40 30 L50 40 L90 40 L90 80 L10 80 Z" fill="none" rx="4" />
          <path d="M10 30 L10 25 Q10 20 15 20 L35 20 Q40 20 40 25 L40 30" fill="none" />
          <path d="M25 10 L65 10 L60 30 L20 30 Z" fill={isDark ? "#1A1A1A" : "#F9F9F9"} stroke="#E5D5B8" strokeWidth="1" transform="rotate(-15 45 20)" />
          <circle cx="65" cy="55" r="18" fill={isDark ? "#1A1A1A" : "#F9F9F9"} stroke="#E5D5B8" strokeWidth="1" />
          <line x1="78" y1="68" x2="90" y2="80" stroke="#E5D5B8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className={`text-xl font-medium mb-2 ${isDark ? "text-white" : "text-[#171717]"}`}>No File Uploaded</h3>
      <p className={`text-sm ${isDark ? "text-[#666666]" : "text-zinc-500"}`}>No files have been uploaded for this project yet.</p>
    </div>
  );
}

function MobileFolderRow({
  folder,
  onSelect,
  onOpenMenu,
  isDark
}: {
  folder: FolderData,
  onSelect: () => void,
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, folderTitle: string) => void,
  isDark?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border-b last:border-0 transition-colors ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}>
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isDark ? "active:bg-white/5" : "active:bg-black/5"}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-full border transition-all duration-200 ${isDark ? "border-white/10 text-[#666666]" : "border-zinc-200 text-zinc-400"
            } ${isExpanded ? "rotate-180" : ""}`}>
            <ChevronDown size={18} />
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? "bg-[#1A1A1A] border-[#222222]" : "bg-zinc-100 border-zinc-200"
            }`}>
            <Folder size={20} className="text-[#999999]" />
          </div>
          <span className={`font-medium text-sm ${isDark ? "text-[#E0E0E0]" : "text-[#171717]"}`}>{folder.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {folder.linked && (
            <div className="text-[#6EE7B7]">
              <LinkIcon size={14} />
            </div>
          )}
          <span className="px-3 py-1 bg-[#DBeafe] text-[#1E40AF] rounded-full text-[10px] font-bold">
            {folder.category.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className={`px-4 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? "bg-black/20" : "bg-zinc-50"}`}>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="space-y-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#666666]" : "text-zinc-400"}`}>File Count</p>
              <div className={`flex items-center gap-2 ${isDark ? "text-white/80" : "text-zinc-700"}`}>
                <FileText size={14} className="text-[#E5D5B8]" />
                <span className="text-sm font-medium">{folder.items} Items</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#666666]" : "text-zinc-400"}`}>Last Activity</p>
              <div className={`flex items-center justify-end gap-2 ${isDark ? "text-white/80" : "text-zinc-700"}`}>
                <Clock size={14} className="text-[#E5D5B8]" />
                <span className="text-sm font-medium">{folder.lastUpdated}</span>
              </div>
            </div>

            <div className="col-span-1 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="w-full py-2 bg-[#E5D5B8] text-black text-xs font-bold rounded-lg active:scale-95 transition-transform"
              >
                View Folder
              </button>
            </div>

            <div className="col-span-1 pt-2 text-right">
              <button
                onClick={(e) => onOpenMenu(e, folder.name)}
                className={`inline-flex items-center justify-center w-10 h-8 border rounded-lg transition-colors ${
                  isDark ? "border-white/10 text-white/60 active:bg-white/10" : "border-zinc-200 text-zinc-500 active:bg-black/10"
                }`}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}