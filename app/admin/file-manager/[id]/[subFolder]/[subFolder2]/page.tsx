"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Upload,
  Link as LinkIcon,
  FileVideo,
  Image as ImageIcon,
  FolderOpen,
  ChevronDown,
  Download,
  Calendar,
  Ellipsis,
  FolderSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import Image from "next/image";

interface FileEntry {
  id: string;
  src: string;
  type: "image" | "video";
  name: string;
  userInitials: string;
  lastOpened: string;
}

const defaultImgSrc= "/images/misc/Data.png"

// 1. Data structure supporting both Images and Videos
const RAW_FOOTAGES_DATA: {
  folderName: string;
  itemCount: number;
  linkedTo: string;
  linkedDate: string;
  files: FileEntry[]; // Use the interface here
} = {
  folderName: "Raw Footages",
  itemCount: 24,
  linkedTo: "Corporate Event 2026",
  linkedDate: "Jan 15, 2024",
  files: [
    { id: "f1", src: "/images/categories/commercial.jpg", type: "image", name: "Commercial_Category_Cover.jpg", userInitials: "DP", lastOpened: "2 hours ago" },
    { id: "f2", src: "/videos/Camera_Operator_Filmmaker.mp4", type: "video", name: "Camera_Operator_B-Roll.mp4", userInitials: "SK", lastOpened: "Just now" },
    { id: "f3", src: "/videos/videosnap.mp4", type: "video", name: "Video_Snap_Draft.mp4", userInitials: "JW", lastOpened: "1 day ago" },
    { id: "f4", src: "/images/categories/commercial.jpg", type: "image", name: "Commercial_Shoot_Hero.jpg", userInitials: "DP", lastOpened: "3 days ago" },
    { id: "f5", src: "/images/categories/wedding.jpg", type: "image", name: "Wedding_Ceremony_Wide.jpg", userInitials: "KA", lastOpened: "4 hours ago" },
    { id: "f6", src: "/videos/NewBookingFlow.mp4", type: "video", name: "Booking_Flow_Demo.mp4", userInitials: "SK", lastOpened: "Just now" },
    { id: "f7", src: "/videos/Camera_Operator_Filmmaker.mp4", type: "video", name: "Filmmaker_Action_Shot.mp4", userInitials: "SK", lastOpened: "Just now" },
    { id: "f8", src: "/camerav.mp4", type: "video", name: "Camera_V_Preview.mp4", userInitials: "SK", lastOpened: "Just now" },
    { id: "f9", src: "/images/categories/podcast.jpg", type: "image", name: "Podcast_Studio_Setup.jpg", userInitials: "JW", lastOpened: "6 hours ago" },
    { id: "f10", src: "/videos/Client_Interview.mp4", type: "video", name: "Executive_Interview_01.mp4", userInitials: "DP", lastOpened: "1 hour ago" },
    { id: "f11", src: "/images/categories/music.jpg", type: "image", name: "Music_Video_Stills.jpg", userInitials: "SK", lastOpened: "5 hours ago" },
    { id: "f12", src: "/videos/Event_Highlights.mp4", type: "video", name: "Final_Event_Highlights.mp4", userInitials: "KA", lastOpened: "12 mins ago" },]
};

// statuses may change
const STATUSES = [
  "Linked",
  "Unlinked",
]

export default function SubFolderDetailsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = React.useState("")
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [filteredData, setFilteredData] = useState<FileEntry[]>(RAW_FOOTAGES_DATA.files);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = RAW_FOOTAGES_DATA.files.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredData(filtered);
  };

  return (
    <div className="bg-[#101010]">
      <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
        <div className="bg-[#101010]  flex flex-col gap-5 p-5 border-b border-b-[#3D3D3D] rounded-2xl">
          {/* Title and Upload */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#1A1A1A] p-3 rounded-full">
                <FolderSearch className="text-white" size={24} />
              </div>
              <h1 className="text-base text-[#E8D1AB] font-semibold">
                {RAW_FOOTAGES_DATA.folderName} ({RAW_FOOTAGES_DATA.itemCount} Items)
              </h1>
            </div>
            <Button className="bg-[#E5D5B8] hover:bg-[#D4C3A3] text-black font-medium px-6 py-2 rounded-xl flex items-center gap-2 transition-all">
              <Upload size={18} />
              Upload Files
            </Button>
          </div>

          {/* Linking Status Banner */}
          <div className="bg-[#171717] border border-white/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg border border-white/10">
                <LinkIcon className="text-[#041E42]" size={20} />
              </div>
              <div>
                <p className="">Linked to: {RAW_FOOTAGES_DATA.linkedTo}</p>
                <p className="mt-0.5 flex gap-1 items-center"><Calendar size={14} /> {RAW_FOOTAGES_DATA.linkedDate}</p>
              </div>
            </div>
            <button className="text-base text-white font-medium underline underline-offset-4 hover:text-[#E8D1AB]">
              Change Shoot
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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

          {/* Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {RAW_FOOTAGES_DATA.files.map((file) => (
              <div key={file.id} className="bg-[#111111] border border-white/5 rounded-xl p-[19px] hover:border-white/20 transition-all group relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.type === 'video' ? (
                      <FileVideo size={16} className="text-[#E8D1AB] shrink-0" />
                    ) : (
                      <ImageIcon size={16} className="text-[#E8D1AB] shrink-0" />
                    )}
                    <span className="truncate text-white">{file.name}</span>
                  </div>
                  <button className="text-white hover:text-white/90">
                    <Ellipsis size={16} />
                  </button>
                </div>

                {/* Thumbnail Logic */}
                <div className="aspect-square bg-[#1A1A1A] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                  {file.src && file.type == "image" ? (
                    <Image
                      src={file.src} alt={file.name}
                      width={158}
                      height={150}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Image
                      src={defaultImgSrc}
                      alt={file.name}
                      width={158}
                      height={150}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    // <div className="flex flex-col items-center gap-2 opacity-20">
                    //   <Download size={24} />
                    // </div>
                  )}

                  {/* Progress Bar for uploads/processing */}
                  {/* {file.progress && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8D1AB] transition-all duration-500" style={{ width: `${file.progress}%` }} />
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}