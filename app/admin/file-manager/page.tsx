"use client"

import React, { useState } from "react";
import UploadModal from "@/components/admin/UploadFilesModal";
import { Folder, Grid3X3, History, Link, List, Search, Share2, Trash2 } from "lucide-react";
import { FolderCard } from "@/components/admin/FolderCard";
import { Button } from "@/components/ui/button";
import { BlackDropdownSelect } from "@/components/auth/BlackDropdown";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/FileActionMenu";
import LinkToShootModal from "@/components/admin/LinkToShootModal";

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
    title: "Commercial_Shoot_V1",
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

export default function AdminFileManagerPage() {
  const [selectedTab, setSelectedTab] = useState("All Files")
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredFolders, setFilteredFolders] = useState<FolderEntry[]>(folderData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = React.useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const tabs = [
    { name: "All Files", icon: Folder },
    { name: "Linked to Shoots", icon: Link },
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

  const handleOpenLinkModal = (folderTitle: string) => {
    setSelectedFolder(folderTitle);
    setIsLinkModalOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="text-white">
          <h1 className="text-2xl leading-[32px] font-semibold mb-1">File Manager</h1>
          <p className="text-sm text-white/70">Here's what's happening with your shoots and requests today.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 bg-[#171717] p-1 rounded-lg w-full md:w-fit">
          {tabs.map((tab, index) => (
            <Button
              key={`tab_${index}`}
              onClick={() => onChange(tab.name)}
              className={`flex gap-2 px-2 py-1 text-sm font-medium transition-all rounded-lg ${selectedTab === tab.name ? "bg-white text-black " : "hover:bg-white/10"}
          `}
            >
              <tab.icon size={20} />
              {tab.name}
            </Button>
          ))}
        </div>

        <p className="text-[#8F8F8F]">
          Storage Used: <span className="text-[#E8D1AB]">{"24.5GB"}</span> / 100GB
        </p>
      </div>

      <div
        className="h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px', // 30px is the total dash + gap width
          backgroundRepeat: 'repeat-x'
        }}
      />

      <div className="">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          {/* <div>Search box</div> */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              className="w-full pl-9 pr-4 py-2 bg-[#18181b] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
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

            <div className="flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
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

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5" : "flex flex-col gap-3"}>
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              title={folder.title}
              fileCount={folder.fileCount}
              category={folder.category}
              isLinked={folder.isLinked}
              lastOpened={folder.lastOpened}
              userInitials={folder.userInitials}
              onOpenLinkModal={() => handleOpenLinkModal(folder.title)}
            />
          ))}
        </div>
      </div>
      {/* The Actual Modal Component */}
      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selectedFolder || ""}
      />
    </>
  )
}