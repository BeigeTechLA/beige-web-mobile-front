"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";

import Image from "next/image";
import {
  ArrowLeft,
  Download,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Play,
  Search,
  Trash2,
  Upload,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckSquare,
  Square,
  X as CloseIcon,
  Download as DownloadIcon,
  Trash2 as TrashIcon,
  Share2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import { FileManagerBoard } from "@/components/admin/file-manager/FileManagerBoard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getDisplayInitials,
  mapExternalFilesToUi,
  slugToWorkspaceName,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { MobileFileRow } from "@/components/admin/file-manager/MobileRow";

const defaultImgSrc = "/images/misc/Data.png";
const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;
const ADMIN_FILE_MANAGER_VIEW_MODE_KEY = "admin-file-manager-view-mode";
const FILE_BOARD_ORDER = ["image", "video", "pdf", "doc", "ppt", "sheet", "zip", "file"];
const FILE_BOARD_TITLES: Record<string, string> = {
  image: "Images",
  video: "Videos",
  pdf: "PDFs",
  doc: "Documents",
  ppt: "Presentations",
  sheet: "Sheets",
  zip: "Archives",
  file: "Other Files",
};

const tryDecodeURIComponent = (value: string) => {
  const normalizedValue = String(value || "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalizedValue);
  } catch {
    return normalizedValue;
  }
};

const normalizeRelativeFolderPath = (value: string, phaseSlug: string) => {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();
  if (!normalized) return "";

  const segments = normalized.split("/").filter(Boolean);
  const phaseSegment = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const phaseIndex = segments.findIndex((segment) => String(segment || "").trim().toLowerCase() === phaseSegment);
  if (phaseIndex >= 0) {
    return segments.slice(phaseIndex + 1).join("/");
  }

  return normalized;
};

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

export default function SubFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string; subFolder2: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const nestedSlug = params.subFolder2;
  const canUpload = true;
  const folderPath = useMemo(() => {
    const queryPath = searchParams.get("path");
    const rawPath = queryPath ? tryDecodeURIComponent(queryPath).trim() : slugToWorkspaceName(nestedSlug);
    return normalizeRelativeFolderPath(rawPath, phaseSlug);
  }, [nestedSlug, phaseSlug, searchParams]);
  const folderName = useMemo(() => {
    const queryName = searchParams.get("name");
    if (queryName) return tryDecodeURIComponent(queryName).trim();
    const fallbackFromPath = folderPath.split("/").filter(Boolean).pop();
    return fallbackFromPath || slugToWorkspaceName(nestedSlug);
  }, [folderPath, nestedSlug, searchParams]);
  const { isDark } = useResolvedTheme();

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    resourceType: "workspace" | "folder" | "file";
    externalId: string;
    phase?: string;
    path?: string;
    filepath?: string;
    label?: string;
  } | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        phaseSlug === "post-production" ? "post" : "pre",
        folderPath
      );
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setFiles(workspaceData.files);
    } catch (err: any) {
      setError(err?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadFiles();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [folderPath, phaseSlug, projectId]);

  const folderTitle = useMemo(() => {
    if (nestedSlug === "raw-footage") return "Raw Footages";
    if (nestedSlug === "edited-footage") return "Edited Footages";
    if (nestedSlug === "final-deliverables") return "Final Deliverables";
    return folderName || "Files";
  }, [folderName, nestedSlug]);

  const folderFiles = useMemo(() => {
    return mapExternalFilesToUi(files).map((file) => ({
      ...file,
      ...getFileMeta(file),
      src: defaultImgSrc,
    }));
  }, [files]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return folderFiles;
    const query = searchTerm.toLowerCase();
    return folderFiles.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderFiles, searchTerm]);
  const visibleFiles = useMemo(
    () => filteredData.slice(0, visibleFileCount),
    [filteredData, visibleFileCount]
  );
  const hasMoreFiles = filteredData.length > visibleFileCount;

  const fileBoardColumns = useMemo(() => {
    const labels = Array.from(new Set(filteredData.map((file) => file.label || "file")));
    const orderedLabels = [
      ...FILE_BOARD_ORDER.filter((label) => labels.includes(label)),
      ...labels.filter((label) => !FILE_BOARD_ORDER.includes(label)),
    ];

    return orderedLabels.map((label) => ({
      id: label,
      title: FILE_BOARD_TITLES[label] || `${String(label).charAt(0).toUpperCase()}${String(label).slice(1)} Files`,
      items: filteredData.filter((file) => (file.label || "file") === label),
    }));
  }, [filteredData]);

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [folderPath, phaseSlug, projectId, searchTerm, folderFiles.length]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
      (file: any) =>
        file.filepath &&
        (file.contentType?.startsWith("image/") || file.contentType?.startsWith("video/"))
    );
    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file: any) => {
          try {
            const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
            return [file.id, result.url] as const;
          } catch {
            return [file.id, ""] as const;
          }
        })
      );

      if (!active) return;
      setPreviewUrls((prev) => ({
        ...prev,
        ...Object.fromEntries(entries.filter(([, url]) => !!url)),
      }));
    };

    loadPreviews();
    return () => {
      active = false;
    };
  }, [visibleFiles]);

  const handleOpenFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      setOpeningFileId(file.id);
      const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      if (result?.url) {
        setViewerFile(file);
        setViewerUrl(result.url);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (result?.url) {
        const link = document.createElement("a");
        link.href = result.url;
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download file");
    }
  };

  const triggerBatchFileDownload = (url: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      iframe.remove();
    }, 5000);
  };

  const handleDeleteFile = async (file: any) => {
    const targetFile = file || selectedFile;
    if (!targetFile?.filepath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths(prev =>
      prev.includes(filepath)
        ? prev.filter(p => p !== filepath)
        : [...prev, filepath]
    );
  };

  const handleBatchDownload = async () => {
    if (selectedFilePaths.length === 0) return;
    toast.info(`Starting download for ${selectedFilePaths.length} files...`);
    for (const path of selectedFilePaths) {
      try {
        const result = await fileManagerApi.getExternalFileDownloadUrl(path);
        if (result?.url) {
          triggerBatchFileDownload(result.url);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to download file");
      }
      await new Promise(r => setTimeout(r, 300));
    }
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedFilePaths.length === 0) return;

    try {
      setIsDeleting(true);
      let count = 0;
      for (const path of selectedFilePaths) {
        await fileManagerApi.deleteExternalEntry(path);
        count++;
      }
      toast.success(`Deleted ${count} file(s)`);
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
      setIsDeleteModalOpen(false);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete files");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          canUpload ? (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
            >
              <Upload size={18} />
              Upload Files
            </Button>
          ) : null
        }
      />

      <div className="overflow-x-hidden overflow-y-auto p-4 pb-30 lg:px-10 lg:py-9">
        <Button onClick={() => router.back()} className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}>
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {loading ? (
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-gray-200 bg-gray-50"}`}>
            <Loader2 className={`animate-spin text-[#E8D1AB]`} size={40} />
          </div>
        ) : error ? (
          <div className="text-red-300 text-sm">{error || "Folder not found"}</div>
        ) : (
          <div className={`border rounded-2xl transition-colors duration-200 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F9FAFB] border-black/10"}`}>
            <div className={`flex flex-col gap-5 p-4 lg:p-5 border-b rounded-t-2xl transition-colors duration-200 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-black/10"}`}>
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                  <div className={`flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full shrink-0 lg:text-xl transition-colors ${isDark ? "bg-[#1A1A1A] text-white" : "bg-black text-white"}`}>
                    {getDisplayInitials(workspaceName)}
                  </div>
                  <h1 className={`text-sm lg:text-base font-semibold truncate ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"} `}>
                    {folderTitle} ({filteredData.length} Items)
                  </h1>
                </div>
              </div>

              <div className={`border rounded-lg p-3 lg:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${isDark ? "bg-[#171717] border-white/20 text-white" : "bg-white border-[#E5E5E5] text-black"}`}>
                <div className="min-w-0">
                  <p className="text-sm lg:text-base">Project: {workspaceName}</p>
                  <p className={`text-xs lg:text-base ${isDark ? "text-white/60" : "text-black/60"} mt-0.5`}>Project Code: {workspaceCode}</p>
                  {/* {workspaceConsoleUrl ? (
                    <a
                      href={workspaceConsoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                    >
                      Open Storage Folder
                    </a>
                  ) : null} */}
                </div>
                {/* <Button
                  onClick={() => setIsLinkModalOpen(true)}
                  variant="link"
                  className="text-sm lg:text-base text-white font-medium underline underline-offset-4 hover:text-[#E8D1AB] p-0 h-auto"
                >
                  Change Shoot
                </Button> */}
              </div>
            </div>

            <div className="p-4 lg:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
                <div className="relative w-full lg:max-w-md lg:max-w-xl">
                  <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 ${isDark ? "text-white/40" : "text-black/40"}`} />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    className={`w-full pl-8 lg:pl-9 pr-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm outline-none transition-all focus:ring-1 focus:ring-[#E8D1AB] ${isDark
                      ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40"
                      : "bg-[#F0F0F0] border-black/15 text-black placeholder:text-black/40"}`}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 ">
                  {filteredData.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = !isSelectionMode;
                        setIsSelectionMode(next);
                        if (!next) setSelectedFilePaths([]);
                      }}
                      className={`gap-2 h-8 lg:h-10 px-3 lg:px-4 rounded-lg border transition-all ${isSelectionMode
                        ? 'bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90'
                        : isDark
                          ? 'bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20'
                          : 'bg-[#F0F0F0] text-black/70 border-black/15 hover:text-black hover:border-black/30'
                        }`}
                    >
                      <CheckSquare size={18} />
                      <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
                    </Button>
                  )}
                  {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
                  <FileManagerViewToggle
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    isDark={isDark}
                  />
                </div>
              </div>

              {viewMode === "board" ? (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <FileManagerBoard
                    columns={fileBoardColumns}
                    emptyMessage="No files in this column"
                    getItemId={(file) => String(file.id)}
                    renderCard={(file) => (
                      <FileCard
                        file={{ ...file, previewUrl: previewUrls[file.id] }}
                        onOpen={() => handleOpenFile(file)}
                        onDownload={() => handleDownloadFile(file)}
                        onDelete={() => {
                          setSelectedFile(file);
                          setIsDeleteModalOpen(true);
                        }}
                        onShare={() => {
                          setSelectedFile(file);
                          setShareResource({
                            resourceType: "file",
                            externalId: String(projectId || ""),
                            phase: phaseSlug === "post-production" ? "post" : "pre",
                            filepath: file.filepath,
                            label: file.title,
                          });
                          setIsShareModalOpen(true);
                        }}
                        isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                        onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                      />
                    )}
                  />
                )
              ) : viewMode === "grid" ? (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {visibleFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`border rounded-xl p-4 lg:p-[19px] transition-all group relative cursor-pointer ${(isSelectionMode && selectedFilePaths.includes(file.filepath || "")) ? 'border-[#E8D1AB] ring-1 ring-[#E8D1AB]/50' : isDark ? 'bg-[#111111] border-[#202020] hover:border-white/20' : 'bg-[#F6F6F6] hover:border-black/20 border-[#CACACA4D]'}`}
                          onClick={() => handleOpenFile(file)}
                        >
                          {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedFilePaths.includes(file.filepath || "")}
                                onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                                className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                              />
                            </div>
                          )}
                          <div className={`flex items-center justify-between mb-3 ${isSelectionMode ? 'ml-7' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <file.icon size={16} className={`${file.accentClass} shrink-0`} />
                              <span className={`truncate text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>{file.title}</span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button className={isDark ? "text-white/70 hover:text-white" : "text-black/60 text-black/80"} onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}>
                                <Download size={16} />
                              </button>
                              <button className={isDark ? "text-white/70 hover:text-[#E8D1AB]" : "text-black/60 hover:text-black/80"} onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setShareResource({
                                  resourceType: "file",
                                  externalId: String(projectId || ""),
                                  phase: phaseSlug === "post-production" ? "post" : "pre",
                                  filepath: file.filepath,
                                  label: file.title,
                                });
                                setIsShareModalOpen(true);
                              }}>
                                <Share2 size={16} />
                              </button>
                              <button className="text-white/70 hover:text-[#F04438]" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setIsDeleteModalOpen(true);
                              }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="aspect-square bg-[#1A1A1A] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                            {file.label === "image" && previewUrls[file.id] ? (
                              <img
                                src={previewUrls[file.id]}
                                alt={file.title || "Preview"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) :
                              file.label === "video" && previewUrls[file.id] ? (
                                <div className="relative h-full w-full">
                                  <video
                                    src={previewUrls[file.id]}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                                      <Play size={18} className="ml-0.5" fill="currentColor" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${file.badgeClass}`}>
                                  <file.icon
                                    className={`${file.accentClass} opacity-80 group-hover:scale-110 transition-transform`}
                                    size={48}
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreFiles ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                          onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                        >
                          View More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <>
                    {/* Main Display Fragment Block Container Layout */}
                    <div className="space-y-4">
                      {/* Mobile Specific List View (lg:hidden) */}
                      <div className={`lg:hidden border rounded-xl overflow-hidden transition-colors duration-200 setup-beta-tag shadow-sm ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
                        <div className={`flex justify-between px-5 py-3 text-sm font-medium border-b rounded-b-xl ${isDark ? "border-b-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "bg-[#FFFCF6] text-[#000000] border-b-[#E5E5E5]"}`}>
                          <span>File Name</span>

                        </div>
                        <div className="flex flex-col">
                          {visibleFiles.map((file) => (
                            <MobileFileRow
                              key={file.id}
                              file={file}
                              isDark={isDark}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedFilePaths.includes(file.filepath || "")}
                              onSelect={() => toggleFileSelection(file.filepath || "")}
                              onOpen={() => handleOpenFile(file)}
                              onDownload={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}
                              onShare={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setShareResource({
                                  resourceType: "file",
                                  externalId: String(projectId || ""),
                                  phase: phaseSlug === "post-production" ? "post" : "pre",
                                  filepath: file.filepath,
                                  label: file.title,
                                });
                                setIsShareModalOpen(true);
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setIsDeleteModalOpen(true);
                              }}
                              isDeleting={openingFileId === file.id}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Regular Desktop Table View Layout (hidden lg:block) */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className={`w-full text-left border-collapse text-sm transition-colors border rounded-xl overflow-hidden ${isDark ? "border-white/10" : "border-[#E5E5E5]"
                          }`}>
                          <thead>
                            <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"
                              }`}>
                              {isSelectionMode && (
                                <th className="rounded-l-xl py-5 px-6 font-medium w-10">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={visibleFiles.length > 0 && visibleFiles.every(f => selectedFilePaths.includes(f.filepath || ""))}
                                      onCheckedChange={(checked: boolean | "indeterminate") => {
                                        if (checked === true) {
                                          const allVisible = visibleFiles.map(f => f.filepath || "").filter(Boolean);
                                          setSelectedFilePaths(prev => Array.from(new Set([...prev, ...allVisible])));
                                        } else {
                                          const allVisible = visibleFiles.map(f => f.filepath || "");
                                          setSelectedFilePaths(prev => prev.filter(p => !allVisible.includes(p)));
                                        }
                                      }}
                                      className={`h-5 w-5 border-medium transition-colors data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black ${isDark ? "border-white/50" : "border-black/40"}`}
                                    />
                                  </div>
                                </th>
                              )}
                              <th className={`${!isSelectionMode ? 'rounded-l-xl' : ''} py-5 px-6 font-medium`}>File title</th>
                              <th className="py-5 px-6 font-medium">Type</th>
                              <th className="py-5 px-6 font-medium">Last Opened</th>
                              <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                            </tr>
                          </thead>
                          <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                            {visibleFiles.map((file) => (
                              <tr
                                key={file.id}
                                className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${(isSelectionMode && selectedFilePaths.includes(file.filepath || "")) ? 'bg-white/[0.04]' : ''
                                  }`}
                                onClick={() => handleOpenFile(file)}
                              >
                                {isSelectionMode && (
                                  <td className="py-5 px-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedFilePaths.includes(file.filepath || "")}
                                      onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                                      className={`h-5 w-5 border-medium transition-colors data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black ${isDark ? "border-white/50" : "border-black/40"}`}
                                    />
                                  </td>
                                )}
                                <td className="py-5 px-6 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg overflow-hidden flex-shrink-0 relative border flex items-center justify-center transition-colors ${isDark ? "border-white/5 bg-[#1A1A1A]" : "border-black/5 bg-black/[0.03]"
                                      }`}>
                                      {file.label === "image" && previewUrls[file.id] ? (
                                        <img
                                          src={previewUrls[file.id]}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className={`flex h-full w-full items-center justify-center ${file.badgeClass}`}>
                                          <file.icon className={file.accentClass} size={20} />
                                        </div>
                                      )}
                                    </div>
                                    <span className={`font-medium truncate max-w-[180px] md:max-w-[200px] ${isDark ? "text-white" : "text-black"}`}>
                                      {file.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-5 px-6 whitespace-nowrap">
                                  <div className={`flex items-center gap-2 font-medium capitalize ${isDark ? "text-white/70" : "text-black/70"}`}>
                                    {file.label}
                                  </div>
                                </td>
                                <td className={`py-5 px-6 whitespace-nowrap text-xs italic font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
                                  {file.lastOpened}
                                </td>
                                <td className="py-5 px-6 whitespace-nowrap text-right">
                                  <div className={`flex items-center justify-end gap-1 ${isDark ? "text-white/60" : "text-black/60"}`}>
                                    <button
                                      className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/5 hover:text-black"}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(file);
                                      }}
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button
                                      className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 hover:text-[#E8D1AB]" : "hover:bg-black/5 hover:text-[#B38F43]"}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(file);
                                        setShareResource({
                                          resourceType: "file",
                                          externalId: String(projectId || ""),
                                          phase: phaseSlug === "post-production" ? "post" : "pre",
                                          filepath: file.filepath,
                                          label: file.title,
                                        });
                                        setIsShareModalOpen(true);
                                      }}
                                    >
                                      <Share2 size={16} />
                                    </button>
                                    <button
                                      className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 hover:text-[#F04438]" : "hover:bg-black/5 hover:text-[#F04438]"}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(file);
                                        setIsDeleteModalOpen(true);
                                      }}
                                    >
                                      {openingFileId === file.id ? <span className="text-[10px] tracking-tighter">...</span> : <Trash2 size={16} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Control Area */}
                      {hasMoreFiles && (
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            className={`border transition-colors text-xs lg:text-sm h-9 px-4 rounded-lg ${isDark
                              ? "border-white/20 bg-[#202020] text-white hover:bg-white/10"
                              : "border-black/15 bg-white text-black hover:bg-black/5"
                              }`}
                            onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                          >
                            View More
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          folderName={folderTitle}
          uploadPath={
            workspaceName
              ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}/${folderPath}`
              : undefined
          }
          onUploadComplete={loadFiles}
          isDark={isDark}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (selectedFilePaths.length > 0) {
              handleBatchDelete();
            } else {
              handleDeleteFile(selectedFile);
            }
          }}
          itemName={selectedFilePaths.length > 0 ? `${selectedFilePaths.length} selected files` : selectedFile?.title || "this file"}
          itemType="file"
          isDeleting={isDeleting}
          isDark={isDark}
        />

        <FileViewerModal
          isOpen={!!viewerFile}
          onClose={() => {
            setViewerFile(null);
            setViewerUrl(null);
          }}
          fileName={viewerFile?.title}
          fileUrl={viewerUrl}
          contentType={viewerFile?.contentType}
          isDark={isDark}
          fileMetaId={viewerFile?.filepath || null}
        />

        <ShareResourceModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareResource(null);
          }}
          resource={shareResource}
        />

        {/* Batch Action Toolbar */}
        {selectedFilePaths.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-2 lg:px-4">
            <div className={`border rounded-xl lg:rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 transition-colors duration-200 ${isDark ? "bg-[#171717] border-[#E8D1AB]/50" : "bg-white border-black/10"}`}>
              <div className="flex items-center gap-3">
                <div className="bg-[#E8D1AB] text-black h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ">
                  {selectedFilePaths.length}
                </div>
                <span className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Files selected</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className={`gap-2 transition-colors text-sm lg:text-base ${isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-black/70 hover:text-black hover:bg-black/5"}`}
                  onClick={() => setSelectedFilePaths([])}
                >
                  Clear
                </Button>

                <div className={`h-6 w-[1px] mx-1 transition-colors ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                <Button
                  className={`gap-2 border transition-colors ${isDark
                    ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                    : "bg-black/5 text-black hover:bg-black/10 border-black/5"
                    }`}
                  onClick={handleBatchDownload}
                >
                  <DownloadIcon size={18} />
                  <span className="hidden lg:block">Download</span>
                </Button>

                <Button
                  className="bg-[#F04438] text-white hover:bg-[#F04438]/90 gap-2 setup-beta-tag"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <TrashIcon size={18} />
                  <span className="hidden lg:block">Delete</span>
                </Button>
              </div>

              <button
                onClick={() => setSelectedFilePaths([])}
                className={`transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>
        )}

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 items-center justify-center bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            <Upload size={20} />
            Upload Files
          </Button>
        </div>
      </div>
    </>
  );
}
