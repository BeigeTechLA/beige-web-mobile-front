"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";

import {
  ArrowLeft,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderOpen,
  Grid3X3,
  List,
  Loader2,
  MoreVertical,
  Presentation,
  Search
} from "lucide-react";
import { FolderCard } from "@/components/production-manager/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/production-manager/BasicDropdown";
import LinkToShootModal from "@/components/production-manager/file-manager/LinkToShootModal";
import UploadModal from "@/components/production-manager/file-manager/UploadFilesModal";
import { MobileFolderRow } from "@/components/production-manager/file-manager/MobileFolderRow";
import { FileCard } from "@/components/production-manager/file-manager/FileCard";
import {
  buildPostProductionFolders,
  fileManagerApi,
  getFilesForFolderView,
  mapFilesForUi,
  type ProjectFileItem,
  type ProjectItem,
} from "@/lib/fileManagerApi";

const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const getFileMeta = (file: any) => {
  const extension = getFileExtension(file?.title);
  const contentType = file?.contentType || "";

  if (contentType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }

  if (contentType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]", badgeClass: "bg-[#E8D1AB]/15" };
  }

  if (contentType === "application/pdf" || extension === "pdf") {
    return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]", badgeClass: "bg-[#F04438]/15" };
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]", badgeClass: "bg-[#3B82F6]/15" };
  }

  if (["ppt", "pptx", "key"].includes(extension)) {
    return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]", badgeClass: "bg-[#F97316]/15" };
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]", badgeClass: "bg-[#10B981]/15" };
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]", badgeClass: "bg-[#A855F7]/15" };
  }

  return { icon: FileText, label: extension || "file", accentClass: "text-white/80", badgeClass: "bg-white/10" };
};

export default function ProductionManagerFolderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ folderIds: string[] }>();
  const folderIds = params.folderIds || [];
  const [projectId, phaseSlug, nestedSlug] = folderIds;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [files, setFiles] = useState<ProjectFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const [status, setStatus] = useState("");

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);

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
        setError(err?.message || "Failed to load folder");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const viewState = useMemo(() => {
    if (!project) {
      return {
        title: "File Manager",
        description: "",
        kind: "folders" as const,
        folders: [],
        files: [],
      };
    }

    if (phaseSlug === "post-production" && !nestedSlug) {
      return {
        title: "Post Production",
        description: project.project_name,
        kind: "folders" as const,
        folders: buildPostProductionFolders(project, files),
        files: [],
      };
    }

    const mappedFiles = mapFilesForUi(getFilesForFolderView(files, phaseSlug, nestedSlug));

    return {
      title:
        phaseSlug === "pre-production"
          ? "Pre Production"
          : nestedSlug === "raw-footage"
          ? "Raw Footages"
          : nestedSlug === "edits" || nestedSlug === "edited-footage"
          ? "Edits"
          : nestedSlug === "final-deliverables"
          ? "Final Deliverables"
          : "Files",
      description: project.project_name,
      kind: "files" as const,
      folders: [],
      files: mappedFiles,
    };
  }, [project, files, phaseSlug, nestedSlug]);

  const filteredFolders = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return viewState.folders.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.folders]);

  const filteredFiles = useMemo(() => {
    const filesWithMeta = viewState.files.map((file) => ({
      ...file,
      ...getFileMeta(file),
    }));
    const query = searchTerm.toLowerCase();
    return filesWithMeta.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.files]);

  const visibleFiles = useMemo(
    () => filteredFiles.slice(0, visibleFileCount),
    [filteredFiles, visibleFileCount]
  );

  const hasMoreFiles = filteredFiles.length > visibleFileCount;

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [searchTerm, projectId, phaseSlug, nestedSlug, viewState.kind]);

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
        <div className="text-red-300 text-sm">{error || "Folder not found"}</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-5 mb-2 lg:mb-6">
              <div className="h-10 w-10 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] lg:text-[30px] font-medium">
                {(project.assigned_creator?.name || project.client?.name || "NA")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || "")
                  .join("")}
              </div>
              <div className="text-white max-w-3xl flex-1">
                <div className="flex flex-1 justify-between items-center gap-2 ">
                  <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold mb-1">{viewState.title}</h1>
                  <span className="px-2.5 py-1 rounded-full bg-[#E8D2FB] text-[#540B94] text-xs font-medium border border-white/5">
                    {project.project_code}
                  </span>
                </div>
                <p className="text-sm text-[#D0D0D0]">
                  <span className="text-[#AAA7A7]">Project: </span>
                  {viewState.description}
                </p>
              </div>
            </div>
          </div>

          <div className="pb-20 lg:pb-0">
            <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
                <input
                  type="text"
                  placeholder="Search..."
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

            {viewState.kind === "folders" ? (
              viewMode === "grid" ? (
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
              )
            ) : viewMode === "grid" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                  {visibleFiles.map((file) => (
                    <FileCard key={file.id} file={file} onMenuTrigger={() => {}} />
                  ))}
                </div>
                {hasMoreFiles && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                      className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    >
                      View More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                        <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                        <th className="py-5 px-6 font-medium text-center">Type</th>
                        <th className="py-5 px-6 font-medium text-center">Last Updated</th>
                        <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFiles.map((item) => (
                        <tr key={item.id} className="items-center hover:bg-white/[0.02] transition-colors">
                          <td className="py-5 px-6 text-white flex gap-2 items-center">
                            <div className={`h-10 w-10 ${item.badgeClass} flex items-center justify-center rounded-md`}>
                              <item.icon className={item.accentClass} size={20} />
                            </div>
                            <span className="text-sm font-semibold">{item.title}</span>
                          </td>
                          <td className="py-5 px-6 text-center text-white/60 text-sm">{item.label}</td>
                          <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                          <td className="py-5 px-6 text-right">
                            <Button
                              variant="ghost"
                              className="text-white hover:text-white/90 transition-colors"
                              onClick={() => {}}
                            >
                              <MoreVertical size={30} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMoreFiles && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                      className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    >
                      View More
                    </Button>
                  </div>
                )}
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

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={selectedFolder || ""}
      />
    </>
  );
}
