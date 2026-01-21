"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderOpen, Grid3X3, History, Link, LinkIcon, List, MoreVertical, Search, Share2, Trash2, Unlink } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";

const mainFolder = {
  id: "1",
  title: "Corporate_Lana_#123456",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  fileCount: 2,
  category: "Corporate Event",
  isLinked: true,
  lastOpened: "2 hours ago",
  userInitials: "DP",
  subfolders: [
    {
      id: "1",
      title: "Pre_Production",
      fileCount: 2,
      lastOpened: "2 hours ago",
      userInitials: "DP",
      type: "pre-production"
    },
    {
      id: "2",
      title: "Post_Production",
      fileCount: 14,
      lastOpened: "5 hours ago",
      userInitials: "KA",
      type: "post-production"
    }
  ]
}

// statuses may change
const STATUSES = [
  "Linked",
  "Unlinked",
]
interface FolderEntry {
  id: string;
  title: string;
  fileCount: number;
  lastOpened: string;
  userInitials: string;
}

export default function AdminFolderDetailsPage() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState("All Files")
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredFolders, setFilteredFolders] = useState<FolderEntry[]>(mainFolder.subfolders);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = React.useState("")
  const [activeFolderTitle, setActiveFolderTitle] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = mainFolder.subfolders.filter((folder) =>
      folder.title.toLowerCase().includes(value.toLowerCase())
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
    <>
      <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>
      <div className="flex items-center gap-5 ">
        <div className="h-21 w-21 rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] text-[30px] font-medium">
          {mainFolder.userInitials}
        </div>
        <div className="text-white max-w-3xl">
          <div className="flex items-center gap-2 ">
            <h1 className="text-2xl leading-[32px] font-semibold mb-1">{mainFolder.title}</h1>
            {mainFolder.isLinked ? (
              <span className="px-2.5 py-1 rounded-full bg-[#D4FFE4] text-[#16A34A] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                <LinkIcon size={14} />
                Linked
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#FFF1F2] text-[#F43F5E] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                <Unlink size={14} />
                Unlinked
              </span>
            )}
          </div>
          <p className="text-sm text-[#D0D0D0]"><span className="text-[#AAA7A7]">Description: </span>{mainFolder.description}</p>
        </div>
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

        {
          viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5`}>
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  title={folder.title}
                  fileCount={folder.fileCount}
                  lastOpened={folder.lastOpened}
                  userInitials={folder.userInitials}
                  onOpenLinkModal={() => handleOpenLinkModal(folder.title)}
                />
              ))}
            </div>
          ) : (
            <div className={`flex flex-col gap-3`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                    <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                    <th className="py-5 px-6 font-medium">Files</th>
                    <th className="py-5 px-6 font-medium">Last Updated</th>
                    <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.map((folder, idx) => (
                    <tr key={idx} className="items-center">
                      <td className="py-5 px-6 text-white flex gap-2 items-center">
                        <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-md">
                          <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                        </div>
                        <span className="text-sm font-semibold">{folder.title}</span>
                      </td>

                      <td className="py-5 px-6 ">
                        <p className="text-white">{folder.fileCount.toString().padStart(2, '0')} </p>
                      </td>

                      <td className="py-5 px-6">
                        {folder.lastOpened}
                      </td>

                      <td className="py-5 px-6 text-right">
                        <Button
                          className="text-white hover:text-white/90 transition-colors"
                          onClick={(e) => handleOpenMenu(e, folder.title)}
                        >
                          <MoreVertical size={30} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* GLOBAL MENU OVERLAY */}
      {menuAnchor && (
        <FileActionMenu
          folderName={selectedFolder}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => handleOpenLinkModal(activeFolderTitle || "")}
          anchor={menuAnchor}
        />
      )}

      {/* The Actual Modal Component */}
      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selectedFolder || ""}
      />
    </>
  )
}