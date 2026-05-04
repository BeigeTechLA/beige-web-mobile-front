"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import { ArrowLeft, Grid3X3, List, Loader2, Search } from "lucide-react";

import { FolderCard } from "@/components/production-manager/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/production-manager/BasicDropdown";
import LinkToShootModal from "@/components/production-manager/file-manager/LinkToShootModal";
import { MobileFolderRow } from "@/components/production-manager/file-manager/MobileFolderRow";
import {
  buildProjectRootFolders,
  fileManagerApi,
  type ProjectItem,
  type ProjectFileItem,
} from "@/lib/fileManagerApi";

const STATUSES = ["Linked", "Unlinked"];

export default function ProductionManagerFolderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [files, setFiles] = useState<ProjectFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const [status, setStatus] = useState("");

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectData, fileData] = await Promise.all([
          fileManagerApi.getProject(projectId),
          fileManagerApi.getProjectFiles(projectId),
        ]);

        if (!mounted) return;
        setProject(projectData);
        setFiles(fileData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load project");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const folders = useMemo(() => {
    if (!project) return [];
    const items = buildProjectRootFolders(project, files);
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [project, files, searchTerm]);

  return (
    <>
      <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent">
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      {loading ? (
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div> 
            ) : error || !project ? (
        <div className="text-red-300 text-sm">{error || "Project not found"}</div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-5 mb-2 lg:mb-6">
              <div className="h-10 w-10 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] lg:text-[30px] font-medium">
                {(project.assigned_creator?.name || project.client?.name || "NA")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || "")
                  .join("")}
              </div>
              <div className="text-white max-w-3xl flex-1 lg:flex-0">
                <div className="flex flex-1 justify-between items-center gap-2 ">
                  <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold mb-1">{project.project_name}</h1>
                  <span className="px-2.5 py-1 rounded-full bg-[#D4FFE4] text-[#16A34A] text-xs font-medium border border-[#6ce9a6]/20">
                    {project.state_display_name || project.current_state}
                  </span>
                </div>
                <p className="hidden lg:block text-sm text-[#D0D0D0]">
                  <span className="text-[#AAA7A7]">Project Code: </span>
                  {project.project_code}
                </p>
              </div>
            </div>

            <p className="lg:hidden text-xs text-[#D0D0D0]">
              <span className="text-[#AAA7A7]">Project Code: </span>
              {project.project_code}
            </p>
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
                {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
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

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    title={folder.title}
                    fileCount={folder.fileCount}
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
                {folders.map((folder) => (
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
            )}
          </div>
        </>
      )}

      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selectedFolder || ""}
      />
    </>
  );
}
