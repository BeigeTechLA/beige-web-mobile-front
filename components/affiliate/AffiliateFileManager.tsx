"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, Grid3X3, History, Link, LinkIcon, List, MoreVertical, Search, Share2, Trash2, Unlink, Upload } from "lucide-react";
import { AffiliateFolderCard } from "@/components/affiliate/file-manager/AffiliateFolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import AffiliateFileActionMenu from "@/components/affiliate/file-manager/AffiliateFileActionMenu";
import AffiliateLinkToShootModal from "@/components/affiliate/file-manager/AffiliateLinkToShootModal";
import AffiliateUploadFilesModal from "@/components/affiliate/file-manager/AffiliateUploadFilesModal";
import { SortDateButton } from "@/components/admin/SortDateButton";

import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";

interface FolderEntry {
  id: string;
  title: string;
  fileCount: number;
  category: string;
  isLinked: boolean;
  lastOpened: string;
  userInitials: string;
}

const folderData = [
  {
    id: "1",
    title: "Corporate_Lana_#123456",
    fileCount: 2,
    category: "Corporate Event",
    isLinked: true,
    lastOpened: "2 hours ago",
    userInitials: "DP",
  },
  {
    id: "2",
    title: "Project_Beige_Final",
    fileCount: 14,
    category: "Brands & Products",
    isLinked: true,
    lastOpened: "5 hours ago",
    userInitials: "KA",
  },
  {
    id: "3",
    title: "Wedding_Vows_Recap",
    fileCount: 45,
    category: "Private Events",
    isLinked: false,
    lastOpened: "1 day ago",
    userInitials: "CE",
  },
  {
    id: "4",
    title: "Commercial_folder_V1",
    fileCount: 8,
    category: "Commercial & Advertising",
    isLinked: true,
    lastOpened: "3 days ago",
    userInitials: "DP",
  },
  {
    id: "5",
    title: "Behind_The_Scenes_2026",
    fileCount: 120,
    category: "Behind-the-Scenes",
    isLinked: false,
    lastOpened: "1 week ago",
    userInitials: "JW",
  },
  {
    id: "6",
    title: "Influencer_Collab_NY",
    fileCount: 3,
    category: "Social Content",
    isLinked: false,
    lastOpened: "Just now",
    userInitials: "SK",
  },
];

const STATUSES = [
  "Linked",
  "Unlinked",
]

import AffiliateFolderDetailsView from "./file-manager/AffiliateFolderDetailsView";
import AffiliateFileDetailsView from "./file-manager/AffiliateFileDetailsView";

// ... (types and mock data)

export default function AffiliateFileManager() {
  const [view, setView] = useState<"main" | "folder" | "subfolder">("main");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState("All Files")
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredFolders, setFilteredFolders] = useState<FolderEntry[]>(folderData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = React.useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Inside AdminFolderManagerPage component
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [activeFolderTitle, setActiveFolderTitle] = useState<string | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  const handleNavigateToFolder = (id: string) => {
    setSelectedFolderId(id);
    setView("folder");
  };

  const handleNavigateToSubFolder = (id: string) => {
    setSelectedSubFolderId(id);
    setView("subfolder");
  };

  const handleBackToMain = () => {
    setView("main");
    setSelectedFolderId(null);
  };

  const handleBackToFolder = () => {
    setView("folder");
    setSelectedSubFolderId(null);
  };

  if (view === "folder" && selectedFolderId) {
    return (
      <AffiliateFolderDetailsView
        folderId={selectedFolderId}
        onBack={handleBackToMain}
        onNavigateToSubFolder={handleNavigateToSubFolder}
      />
    );
  }

  if (view === "subfolder" && selectedFolderId && selectedSubFolderId) {
    return (
      <AffiliateFileDetailsView
        folderId={selectedFolderId}
        subFolderId={selectedSubFolderId}
        onBack={handleBackToFolder}
      />
    );
  }

  const tabs = [
    { name: "All Files", icon: Folder },
    { name: "Linked to folders", icon: Link },
    { name: "Recent", icon: History },
    { name: "Shared", icon: Share2 },
    { name: "Trash", icon: Trash2 },
  ]

  const onChange = ((val: string) => {
    setSelectedTab(val);
  })

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    // Filter by Title or Category
    const filtered = folderData.filter((folder) =>
      folder.title.toLowerCase().includes(value.toLowerCase()) ||
      folder.category.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredFolders(filtered);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, folderTitle: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveFolderTitle(folderTitle);

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20
    });
  };

  const handleOpenLinkModal = (folderTitle: string) => {
    setSelectedFolder(folderTitle);
    setIsLinkModalOpen(true);
    setMenuAnchor(null);
  };

  return (
    <div className="space-y-3 lg:space-y-6">
      <div className="flex flex-col lg:flex-row gap-2 justify-between items-center">
        <div className="flex flex-nowrap items-center gap-3 bg-[#171717] p-1 rounded-lg w-full md:w-fit overflow-x-auto no-scrollbar">
          {tabs.map((tab, index) => (
            <Button
              key={`tab_${index}`}
              onClick={() => onChange(tab.name)}
              className={`flex gap-2 px-2 py-[2px] text-sm font-medium transition-all rounded-lg h-7 lg:h-10 ${selectedTab === tab.name ? "bg-white text-black " : "hover:bg-white/10"}
          `}
            >
              <tab.icon size={20} />
              {tab.name}
            </Button>
          ))}
        </div>

        <div className="w-full flex justify-between lg:justify-end gap-1 text-sm lg:text-base text-[#8F8F8F]">
          <span>Storage Used:</span> <p><span className="text-[#E8D1AB]">{"24.5GB"}</span> / 100GB</p>
        </div>
      </div>

      <div
        className="h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px',
          backgroundRepeat: 'repeat-x'
        }}
      />

      <div className="pb-20 lg:pb-0">
        <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
            <input
              type="text"
              placeholder="Search folder..."
              value={searchTerm}
              className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ">
            {/* Status dropdown to be added */}
            <BasicDropdown
              label="Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={STATUSES}
            />

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
            <div className="hidden lg:flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
              <Button
                onClick={() => setViewMode('grid')}
                className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === 'grid'
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : "bg-transparent text-white/40 hover:text-white"
                  }`}
              >
                <Grid3X3 size={20} />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === 'list'
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : "bg-transparent text-white/40 hover:text-white"
                  }`}
              >
                <List size={20} />
              </Button>
            </div>

          </div>
        </div>

        {
          viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5`}>
              {filteredFolders.map((folder) => (
                <AffiliateFolderCard
                  key={folder.id}
                  title={folder.title}
                  fileCount={folder.fileCount}
                  category={folder.category}
                  isLinked={folder.isLinked}
                  lastOpened={folder.lastOpened}
                  userInitials={folder.userInitials}
                  onOpenLinkModal={() => handleOpenLinkModal(folder.title)}
                  onClick={() => handleNavigateToFolder(folder.id)}
                />
              ))}
            </div>
          ) : (
            <div className={`flex flex-col gap-3`}>
              {/* MOBILE LIST VIEW */}
              <div className="lg:hidden">
                {filteredFolders.map((folder) => (
                  <MobileFolderRow
                    key={folder.id}
                    folder={folder}
                    handleOpenMenu={(e, title) => handleOpenMenu(e, title)}
                  />
                ))}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                      <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                      <th className="py-5 px-6 font-medium">Category</th>
                      <th className="py-5 px-6 font-medium">Files</th>
                      <th className="py-5 px-6 font-medium">Status</th>
                      <th className="py-5 px-6 font-medium">Last Updated</th>
                      <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFolders.map((folder, idx) => (
                      <tr key={idx} className="items-center cursor-pointer hover:bg-white/5" onClick={() => handleNavigateToFolder(folder.id)}>
                        <td className="py-5 px-6 text-white flex gap-2 items-center">
                          <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-md">
                            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                          </div>
                          <span className="text-sm font-semibold">{folder.title}</span>
                        </td>

                        <td className="py-5 px-6 text-white text-[15px]">
                          <span className="px-4 py-1.5 rounded-xl bg-[#171717] text-white text-xs font-medium ">
                            {folder.category}
                          </span>
                        </td>

                        <td className="py-5 px-6 ">
                          <p className="text-white">{folder.fileCount.toString().padStart(2, '0')} </p>
                        </td>

                        <td className="py-5 px-6 ">
                          {folder.isLinked ? (
                            <span className="px-2 py-1.5 rounded-full bg-[#D4FFE4] text-[#16A34A] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                              <LinkIcon size={16} />
                              Linked
                            </span>
                          ) : (
                            <span className="px-2 py-1.5 rounded-full bg-[#FFF1F2] text-[#F43F5E] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                              <Unlink size={16} />
                              Unlinked
                            </span>
                          )}
                        </td>

                        <td className="py-5 px-6">
                          {folder.lastOpened}
                        </td>

                        <td className="py-5 px-6 text-right">
                          <Button
                            className="text-white hover:text-white/90 transition-colors bg-transparent p-0"
                            onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, folder.title); }}
                          >
                            <MoreVertical size={30} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </div>
      {/* GLOBAL MENU OVERLAY */}
      {menuAnchor && (
        <AffiliateFileActionMenu
          folderName={selectedFolder}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => handleOpenLinkModal(activeFolderTitle || "")}
          anchor={menuAnchor}
        />
      )}

      <AffiliateLinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selectedFolder || ""}
      />

      <AffiliateUploadFilesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={selectedFolder || ""} //need this logic better figured out
      />

      {/* CreateFolderModal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={(data) => console.log("Creating folder:", data)}
      />

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#0f0f0f]`}>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="w-full bg-[#202020] text-white hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          <Upload size={20} />
          Upload Files
        </Button>
        <Button
          onClick={() => setIsCreateFolderModalOpen(true)}
          className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          Create New Folder
        </Button>
      </div>
    </div>
  )
}