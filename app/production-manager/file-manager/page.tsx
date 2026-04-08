"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Grid3X3, History, Link, List, Search, Share2, Trash2 } from "lucide-react";
import { FolderCard } from "@/components/production-manager/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/production-manager/BasicDropdown";
import LinkToShootModal from "@/components/production-manager/file-manager/LinkToShootModal";
import UploadModal from "@/components/production-manager/file-manager/UploadFilesModal";
import { SortDateButton } from "@/components/production-manager/SortDateButton";
import { MobileFolderRow } from "@/components/production-manager/file-manager/MobileFolderRow";
import { fileManagerApi, mapProjectToFolderCard, type UiFolderItem } from "@/lib/fileManagerApi";

const STATUSES = ["Linked", "Unlinked"];

export default function ProductionManagerFileManagerPage() {
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [projects, setProjects] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { name: "All Files", icon: Grid3X3 },
    { name: "Linked to folders", icon: Link },
    { name: "Recent", icon: History },
    { name: "Shared", icon: Share2 },
    { name: "Trash", icon: Trash2 },
  ];

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fileManagerApi.getProjects();
        if (!mounted) return;
        setProjects(data.map(mapProjectToFolderCard));
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load file manager projects");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFolders = useMemo(() => {
    let items = [...projects];

    if (selectedTab === "Linked to folders") {
      items = items.filter((item) => item.isLinked);
    } else if (selectedTab === "Recent") {
      items = items.slice(0, 10);
    } else if (selectedTab === "Shared" || selectedTab === "Trash") {
      items = [];
    }

    if (status === "Linked") {
      items = items.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      items = items.filter((item) => !item.isLinked);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      items = items.filter(
        (folder) =>
          folder.title.toLowerCase().includes(query) ||
          (folder.category || "").toLowerCase().includes(query)
      );
    }

    return items;
  }, [projects, searchTerm, selectedTab, status]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <>
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="text-white">
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">File Manager</h1>
          <p className="text-xs lg:text-sm text-white/70">
            Live project folders from your production workflow.
          </p>
        </div>

        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <div className="flex flex-col lg:flex-row gap-2 justify-between items-center mb-4 lg:mb-9">
        <div className="flex flex-nowrap items-center gap-3 bg-[#171717] p-1 rounded-lg w-full md:w-fit overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Button
              key={tab.name}
              onClick={() => setSelectedTab(tab.name)}
              className={`flex gap-2 px-2 py-[2px] text-sm font-medium transition-all rounded-lg h-7 lg:h-10 ${
                selectedTab === tab.name ? "bg-white text-black " : "hover:bg-white/10"
              }`}
            >
              <tab.icon size={20} />
              {tab.name}
            </Button>
          ))}
        </div>

        <div className="w-full flex justify-between lg:justify-end gap-1 text-sm lg:text-base text-[#8F8F8F]">
          <span>Projects:</span>
          <p>
            <span className="text-[#E8D1AB]">{projects.length}</span> total
          </p>
        </div>
      </div>

      <div className="pb-20 lg:pb-0">
        <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
            <input
              type="text"
              placeholder="Search folder..."
              value={searchTerm}
              className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ">
            <BasicDropdown
              label="Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={STATUSES}
            />

            <div className="md:hidden relative">
              <Button
                onClick={toggleDropdown}
                className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
              >
                {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
              </Button>

              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <Grid3X3 size={18} />
                    Grid View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <List size={18} />
                    List View
                  </button>
                </div>
              )}
            </div>

            <div className="hidden lg:flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
              <Button
                onClick={() => setViewMode("grid")}
                className={`px-5 py-2.5 rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    : "bg-transparent text-white/40 hover:text-white"
                }`}
              >
                <Grid3X3 size={20} />
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                className={`px-5 py-2.5 rounded-r-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    : "bg-transparent text-white/40 hover:text-white"
                }`}
              >
                <List size={20} />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-white/70 text-sm">Loading projects...</div>
        ) : error ? (
          <div className="text-red-300 text-sm">{error}</div>
        ) : filteredFolders.length === 0 ? (
          <div className="text-white/60 text-sm">No folders found for this view.</div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                title={folder.title}
                fileCount={folder.fileCount}
                category={folder.category}
                isLinked={folder.isLinked}
                lastOpened={folder.lastOpened}
                userInitials={folder.userInitials}
                onOpenLinkModal={() => {
                  setSelectedFolder(folder.title);
                  setIsLinkModalOpen(true);
                }}
                href={folder.href}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="lg:hidden">
              {filteredFolders.map((folder) => (
                <MobileFolderRow
                  key={folder.id}
                  folder={folder}
                  handleOpenMenu={() => {
                    setSelectedFolder(folder.title);
                    setIsLinkModalOpen(true);
                  }}
                />
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                    <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                    <th className="py-5 px-6 font-medium">Files</th>
                    <th className="py-5 px-6 font-medium">Last Updated</th>
                    <th className="py-5 px-6 font-medium text-right rounded-r-xl">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.map((folder) => (
                    <tr key={folder.id} className="items-center hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-6 text-white text-sm font-semibold">{folder.title}</td>
                      <td className="py-5 px-6 text-white/60 text-sm">{folder.fileCount}</td>
                      <td className="py-5 px-6 text-[#8F8F8F] text-sm">{folder.lastOpened}</td>
                      <td className="py-5 px-6 text-right">
                        <Button
                          onClick={() => {
                            if (folder.href) window.location.href = folder.href;
                          }}
                          className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90 h-9"
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selectedFolder || ""}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={selectedFolder || ""}
      />
    </>
  );
}
