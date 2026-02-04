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

interface FolderData {
  id: string;
  name: string;
  items: number;
  category: string;
  linked: boolean;
  lastUpdated: string; // For Grid: "Opened 2 hours ago", For List: "02 Hours Ago"
}

const folders: FolderData[] = [
  // {
  //     id: "1",
  //     name: "Raw Footage",
  //     items: 24,
  //     category: "Corporate Event",
  //     linked: true,
  //     lastUpdated: "Opened 2 hours ago",
  // },
  // {
  //     id: "2",
  //     name: "Edited Footage",
  //     items: 24,
  //     category: "Corporate Event",
  //     linked: true,
  //     lastUpdated: "Opened 2 hours ago",
  // },
  // {
  //     id: "3",
  //     name: "Final Deliverables",
  //     items: 24,
  //     category: "Corporate Event",
  //     linked: true,
  //     lastUpdated: "Opened 2 hours ago",
  // },
];

import PostProductionFolderView from "./PostProductionFolderView";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import { Button } from "@/components/ui/button";

export default function PostProductionTab() {
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
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#999999]">
            {/* Using a generic folder icon here as a placeholder for the specialized icon in design */}
            <FolderSearch size={20} />
          </div>
          <span className="text-[#E0E0E0] text-sm lg:text-lg font-medium">Uploaded Folders</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Dropdown */}
          <button className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-[#E0E0E0] text-sm hover:bg-[#222222] transition-colors">
            <span>Status</span>
            <ChevronDown size={16} />
          </button>

          {/* MOBILE VIEW: Dropdown Button */}
          <div className="md:hidden relative">
            <Button
              onClick={toggleDropdown}
              className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
            >
              {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                <button
                  onClick={() => handleSelect('grid')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                >
                  <Grid3X3 size={18} />
                  Grid View
                </button>
                <button
                  onClick={() => handleSelect('list')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                >
                  <List size={18} />
                  List View
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW: Original Toggle */}
          <div className="hidden lg:flex bg-[#1A1A1A] border border-[#222222] rounded-lg p-1">
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
        <>
          {folders.length > 0 ? (
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
                      <button className="text-[#666666] hover:text-white p-2 rounded-full hover:bg-[#222222] transition-colors" onClick={(e) => handleOpenMenu(e, folder.name)}>
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
          ) : (
            // Empty State for Grid View
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="mb-6 relative">
                {/* Custom SVG for Folder with Magnifying Glass */}
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#E5D5B8" strokeWidth="1">
                  <path d="M10 30 L40 30 L50 40 L90 40 L90 80 L10 80 Z" fill="none" rx="4" />
                  <path d="M10 30 L10 25 Q10 20 15 20 L35 20 Q40 20 40 25 L40 30" fill="none" />
                  <path d="M25 10 L65 10 L60 30 L20 30 Z" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" transform="rotate(-15 45 20)" />
                  <circle cx="65" cy="55" r="18" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" />
                  <line x1="78" y1="68" x2="90" y2="80" stroke="#E5D5B8" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-medium mb-2">No File Uploaded</h3>
              <p className="text-[#666666] text-sm">No files have been uploaded for this project yet.</p>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
          {/* DESKTOP TABLE VIEW */}
          <table className="hidden lg:table w-full text-left">
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
              {folders.length > 0 ? (
                folders.map((folder) => (
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
                      <button className="text-[#666666] hover:text-white p-2 rounded-full hover:bg-[#222222] transition-colors" onClick={(e) => handleOpenMenu(e, folder.name)}>
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyState colSpan={5} />
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
                />
              ))
            ) : (
              <div className="py-20 px-6">
                <EmptyStateContent />
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
const EmptyStateContent = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="mb-6 relative">
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#E5D5B8" strokeWidth="1">
        <path d="M10 30 L40 30 L50 40 L90 40 L90 80 L10 80 Z" fill="none" rx="4" />
        <path d="M10 30 L10 25 Q10 20 15 20 L35 20 Q40 20 40 25 L40 30" fill="none" />
        <path d="M25 10 L65 10 L60 30 L20 30 Z" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" transform="rotate(-15 45 20)" />
        <circle cx="65" cy="55" r="18" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" />
        <line x1="78" y1="68" x2="90" y2="80" stroke="#E5D5B8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <h3 className="text-white text-xl font-medium mb-2">No File Uploaded</h3>
    <p className="text-[#666666] text-sm">No files have been uploaded for this project yet.</p>
  </div>
);

const EmptyState = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="py-20 text-center">
      <EmptyStateContent />
    </td>
  </tr>
);

function MobileFolderRow({
  folder,
  onSelect,
  onOpenMenu
}: {
  folder: FolderData,
  onSelect: () => void,
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, folderTitle: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-[#222222] last:border-0">
      {/* Visible Row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer active:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1 rounded-full border border-white/10 text-[#666666] transition-transform duration-200",
            isExpanded && "rotate-180"
          )}>
            <ChevronDown size={18} />
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
            <Folder size={20} className="text-[#999999]" />
          </div>
          <span className="text-[#E0E0E0] font-medium text-sm">{folder.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {folder.linked && (
            <div className="text-[#6EE7B7]">
              <LinkIcon size={14} />
            </div>
          )}
          <span className="px-3 py-1 bg-[#DBeafe] text-[#1E40AF] rounded-full text-[10px] font-bold">
            {folder.category.split(' ')[0]} {/* Shortened for mobile */}
          </span>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-6 pt-2 bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-y-4">
            <div className="space-y-1">
              <p className="text-[#666666] text-[10px] font-bold uppercase tracking-wider">File Count</p>
              <div className="flex items-center gap-2 text-white/80">
                <FileText size={14} className="text-[#E5D5B8]" />
                <span className="text-sm font-medium">{folder.items} Items</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-[#666666] text-[10px] font-bold uppercase tracking-wider">Last Activity</p>
              <div className="flex items-center justify-end gap-2 text-white/80">
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
                className="inline-flex items-center justify-center w-10 h-8 border border-white/10 rounded-lg text-white/60 active:bg-white/10"
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