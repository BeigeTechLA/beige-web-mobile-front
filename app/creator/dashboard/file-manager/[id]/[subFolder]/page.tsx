"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  Download as DownloadIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  List,
  Loader2,
  MoreVertical,
  Play,
  Presentation,
  Search,
  Trash2 as TrashIcon,
  Upload,
  X as CloseIcon,
} from "lucide-react";

import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
  slugToWorkspaceName,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { getProject } from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;
const getFileExtension = (title?: string) => {
  const parts = String(title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};
const isImageFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension);
  }
  return Boolean(contentType?.startsWith("image/"));
};
const isVideoFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["mp4", "mov", "avi", "mkv", "webm"].includes(extension);
  }
  return Boolean(contentType?.startsWith("video/"));
};
const getFileMeta = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (isImageFile(contentType, title)) return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]" };
  if (isVideoFile(contentType, title)) return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]" };
  if (contentType === "application/pdf" || extension === "pdf") return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]" };
  if (["doc", "docx", "txt", "rtf"].includes(extension)) return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]" };
  if (["ppt", "pptx", "key"].includes(extension)) return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]" };
  if (["xls", "xlsx", "csv"].includes(extension)) return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]" };
  return { icon: FileText, label: extension || "file", accentClass: "text-white/80" };
};

export default function CreatorFileManagerPhasePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string; subFolder: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<Array<Record<string, unknown>>>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const [status, setStatus] = useState("");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<Record<string, unknown> | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<Record<string, unknown> | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [shootDate, setShootDate] = useState<string | null>(null);
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

  const isOnOrAfterShootDay = useCallback((date?: string | null) => {
    if (!date) return false;
    const shootDay = new Date(`${date}T00:00:00`);
    if (Number.isNaN(shootDay.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shootDay.getTime() <= today.getTime();
  }, []);

  const loadPhase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const phase = phaseSlug === "post-production" ? "post" : "pre";
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(projectId, phase);
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setWorkspaceFolders(workspaceData.folders);
      setWorkspaceFiles(workspaceData.files);

      if (Number.isFinite(Number(projectId))) {
        try {
          const projectDetails = await getProject(Number(projectId));
          setShootDate(projectDetails?.data?.project?.event_date || null);
        } catch {
          setShootDate(null);
        }
      } else {
        setShootDate(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [phaseSlug, projectId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadPhase();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [loadPhase, projectId]);

  const viewState = useMemo(() => {
    if (!workspaceName) {
      return { title: "Folder", kind: "folders" as const, folders: [], files: [] };
    }

    if (phaseSlug === "post-production") {
      return {
        title: "Post Production",
        kind: "folders" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders as never[],
          (folder) =>
            `/creator/dashboard/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
              folder.name
            )}`
        ),
        files: [],
      };
    }

    return {
      title: slugToWorkspaceName(phaseSlug),
      kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
      folders: mapExternalFoldersToUi(
        workspaceFolders as never[],
        (folder) =>
          `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
            folder.name
          )}`
      ),
      files: mapExternalFilesToUi(workspaceFiles as never[]),
    };
  }, [phaseSlug, projectId, workspaceFiles, workspaceFolders, workspaceName]);

  const filteredFolders = useMemo(() => {
    let items = viewState.folders;
    if (status === "Linked") {
      items = items.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      items = items.filter((item) => !item.isLinked);
    }
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, status, viewState.folders]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return viewState.files;
    const query = searchTerm.toLowerCase();
    return viewState.files.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.files]);
  const visibleFiles = useMemo(
    () => filteredFiles.slice(0, visibleFileCount),
    [filteredFiles, visibleFileCount]
  );
  const hasMoreFiles = filteredFiles.length > visibleFileCount;

  const formattedShootDate = useMemo(() => {
    if (!shootDate) return "your shoot day";
    const parsed = new Date(`${shootDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return shootDate;
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [shootDate]);

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [projectId, phaseSlug, searchTerm, viewState.files.length, viewState.kind]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  }, [projectId, phaseSlug, searchTerm, viewState.kind]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
      (file) =>
        file.filepath &&
        (isImageFile(file.contentType, file.title) || isVideoFile(file.contentType, file.title))
    );

    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file) => {
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

  const currentPhase = phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;
  const isCommonEventPreProductionRoot =
    isCommonEventWorkspace && phaseSlug === "pre-production";
  const canCreateFolder = isCommonEventWorkspace && !isCommonEventPreProductionRoot;
  const canDeleteFolders = isCommonEventWorkspace;
  const canDeleteFiles = isCommonEventWorkspace || phaseSlug === "post-production";

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;
    if (!canDeleteFolders) {
      toast.error("Folders can only be deleted in common events.");
      return;
    }

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setSelectedFolder(null);
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string") return;
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download file");
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

  const handleDeleteFile = async (file: Record<string, unknown> | null) => {
    const targetFile = file || selectedFile;
    if (!targetFile || typeof targetFile.filepath !== "string") return;
    if (!canDeleteFiles) {
      toast.error("Files can only be deleted in post-production for normal events.");
      return;
    }

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    folder: UiFolderItem
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedFolder(folder);
    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;
    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20,
    });
  };

  const handleOpenFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string" || typeof file.id !== "string") return;
    try {
      const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      if (result?.url) {
        setViewerFile(file);
        setViewerUrl(result.url);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const canUpload =
    !isCommonEventPreProductionRoot &&
    (isCommonEventWorkspace ||
      (phaseSlug === "post-production" && isOnOrAfterShootDay(shootDate)));
  const showUploadLockBanner = !isCommonEventWorkspace && phaseSlug === "post-production" && !canUpload;
  const allVisibleFilesSelected =
    visibleFiles.length > 0 &&
    visibleFiles.every((file) => selectedFilePaths.includes(file.filepath || ""));
  const someVisibleFilesSelected =
    visibleFiles.some((file) => selectedFilePaths.includes(file.filepath || "")) &&
    !allVisibleFilesSelected;

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths((prev) =>
      prev.includes(filepath)
        ? prev.filter((path) => path !== filepath)
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
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to download file");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedFilePaths.length === 0) return;
    if (!canDeleteFiles) {
      toast.error("Files can only be deleted in post-production for normal events.");
      return;
    }

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
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete files");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await fileManagerApi.createExternalFolder(projectId, trimmed, { phase: currentPhase });
      toast.success("Folder created");
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
      throw err;
    }
  };

  const renderFilesTable = () => (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
            <tr>
              {isSelectionMode ? (
                <th className="w-10 rounded-l-xl px-6 py-5 font-medium">
                  <Checkbox
                    checked={allVisibleFilesSelected ? true : someVisibleFilesSelected ? "indeterminate" : false}
                    onCheckedChange={() => {
                      const visiblePaths = visibleFiles
                        .map((file) => file.filepath || "")
                        .filter(Boolean);

                      setSelectedFilePaths((prev) => {
                        if (allVisibleFilesSelected) {
                          return prev.filter((path) => !visiblePaths.includes(path));
                        }

                        return Array.from(new Set([...prev, ...visiblePaths]));
                      });
                    }}
                    className="h-5 w-5 border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                  />
                </th>
              ) : null}
              <th className={`${!isSelectionMode ? "rounded-l-xl" : ""} px-6 py-5 font-medium`}>
                File title
              </th>
              <th className="px-6 py-5 font-medium">Type</th>
              <th className="px-6 py-5 font-medium">Last Opened</th>
              <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleFiles.map((file) => {
              const meta = getFileMeta(file.contentType, file.title);
              const Icon = meta.icon;
              const isSelected = selectedFilePaths.includes(file.filepath || "");
              const previewUrl = previewUrls[file.id];

              return (
                <tr
                  key={file.id}
                  className={`group cursor-pointer transition-colors hover:bg-white/[0.02] ${isSelectionMode && isSelected ? "bg-white/[0.04]" : ""}`}
                  onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                >
                  {isSelectionMode ? (
                    <td className="whitespace-nowrap px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                        className="h-5 w-5 border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                      />
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-white/5 bg-[#1A1A1A]">
                        {isImageFile(file.contentType, file.title) && previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={file.title || "Preview"}
                            className="h-full w-full object-cover"
                          />
                        ) : isVideoFile(file.contentType, file.title) && previewUrl ? (
                          <div className="relative h-full w-full">
                            <video
                              src={previewUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <Play size={14} className="ml-0.5 text-white" fill="currentColor" />
                            </div>
                          </div>
                        ) : (
                          <Icon size={16} className={`${meta.accentClass} absolute inset-0 m-auto`} />
                        )}
                      </div>
                      <span className="max-w-[240px] truncate font-medium text-white">{file.title}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-5">
                    <div className="capitalize text-white/60">{meta.label}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-xs italic text-white/40">
                    {file.lastOpened}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file as unknown as Record<string, unknown>);
                        }}
                      >
                        <DownloadIcon size={16} />
                      </button>
                      {canDeleteFiles ? (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-[#F04438]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file as unknown as Record<string, unknown>);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <TrashIcon size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  );

  return (
    <div className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <Button onClick={() => router.back()} className="flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {canUpload || canCreateFolder ? (
          <div className="flex items-center gap-2">
            {canCreateFolder ? (
              <Button onClick={() => setIsCreateFolderModalOpen(true)} className="border border-white/20 bg-[#202020] text-white hover:bg-white/10">
                <FolderPlus /> Create Folder
              </Button>
            ) : null}
            {canUpload ? (
              <Button onClick={() => setIsUploadModalOpen(true)} className="border border-white/20 bg-[#202020] text-white hover:bg-white/10">
                <Upload /> Upload Files
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
          <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
        </div>
      ) : error ? (
        <div className="text-sm text-red-300">{error || "Folder not found"}</div>
      ) : (
        <>
          <div>
            <div className="mb-2 flex items-start gap-5 lg:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8E1FF] text-[#000] lg:h-21 lg:w-21 lg:rounded-2xl lg:text-[30px] lg:font-medium">
                {getDisplayInitials(workspaceName)}
              </div>
              <div className="min-w-0 max-w-3xl flex-1 text-white">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <h1 className="break-words text-sm font-semibold leading-[32px] lg:text-2xl">
                    {workspaceName}
                  </h1>
                  <span
                    className={`flex items-center gap-1.5 rounded-full border border-white/5 px-2.5 py-1 text-xs font-medium ${phaseSlug === "post-production"
                        ? "bg-[#E8D2FB] text-[#540B94]"
                        : "bg-[#FDF4FF] text-[#C026D3]"
                      }`}
                  >
                    {viewState.title}
                  </span>
                </div>
                <p className="hidden text-sm text-[#D0D0D0] lg:block">
                  <span className="text-[#AAA7A7]">Project Code: </span>
                  {workspaceCode}
                </p>
                {/* {workspaceConsoleUrl ? (
                  <a
                    href={workspaceConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 hidden text-xs text-[#E8D1AB] underline underline-offset-4 lg:inline-block"
                  >
                    Open Storage Folder
                  </a>
                ) : null} */}
              </div>
            </div>
          </div>

          <div className="pb-20 lg:pb-0">
            {showUploadLockBanner ? (
              <div className="mb-3 rounded-xl border border-[#E8D1AB]/25 bg-gradient-to-r from-[#2A2215] to-[#17130E] p-3 lg:mb-4 lg:p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#E8D1AB]/15 p-2 text-[#E8D1AB]">
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F2E4C8]">Uploads unlock on shoot day</p>
                    <p className="mt-1 text-xs text-[#DCC7A0] lg:text-sm">
                      Post-production upload will be available on{" "}
                      <span className="font-medium text-[#F2E4C8]">{formattedShootDate}</span>. You can review folders and existing files now.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
              <div className="relative max-w-xl flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40 lg:left-3 lg:h-4 lg:w-4" />
                <input
                  type="text"
                  placeholder={viewState.kind === "folders" ? "Search folders..." : "Search files..."}
                  value={searchTerm}
                  className="w-full rounded-lg border border-white/10 bg-[#18181b] py-1.5 pl-6 pr-4 text-xs text-white placeholder:text-white/40 transition-all focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] lg:py-2 lg:pl-9 lg:text-sm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {filteredFiles.length > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const nextMode = !isSelectionMode;
                      setIsSelectionMode(nextMode);
                      if (!nextMode) setSelectedFilePaths([]);
                    }}
                    className={`gap-2 h-10 px-4 rounded-lg border transition-all ${isSelectionMode
                      ? "bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90"
                      : "bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20"
                      }`}
                  >
                    <CheckSquare size={18} />
                    <span>{isSelectionMode ? "Cancel" : "Select"}</span>
                  </Button>
                ) : null}
                {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
                <div className="hidden w-full flex-wrap items-center rounded-lg border border-white/5 bg-[#202020] md:w-fit lg:flex">
                  <Button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-l-lg px-5 py-2.5 transition-colors ${viewMode === "grid"
                        ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                        : "bg-transparent text-white/40 hover:text-white"
                      }`}
                  >
                    <Grid3X3 size={20} />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    className={`rounded-r-lg px-5 py-2.5 transition-colors ${viewMode === "list"
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
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      title={folder.title}
                      fileCount={folder.fileCount}
                      lastOpened={folder.lastOpened}
                      category={folder.category}
                      isLinked={folder.isLinked}
                      userInitials={folder.userInitials}
                      onOpenLinkModal={() => undefined}
                      href={folder.href}
                      onDownload={async () => {
                        setSelectedFolder(folder);
                        try {
                          const slug = folder.href?.split("/").filter(Boolean).pop();
                          const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                            phase: currentPhase,
                            path: currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined,
                          });
                          if (result?.url) {
                            window.open(result.url, "_blank", "noopener,noreferrer");
                          }
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : "Failed to download folder");
                        }
                      }}
                      onDelete={
                        canDeleteFolders
                          ? () => {
                            setSelectedFolder(folder);
                            setSelectedFile(null);
                            setIsDeleteModalOpen(true);
                          }
                          : undefined
                      }
                      onShare={() => {
                        const slug = folder.href?.split("/").filter(Boolean).pop();
                        setShareResource({
                          resourceType: "folder",
                          externalId: String(projectId || ""),
                          phase: currentPhase,
                          path: currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined,
                          label: folder.title,
                        });
                        setIsShareModalOpen(true);
                      }}
                      onRename={() => toast.info("Folder rename is the next safe step.")}
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
                        handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                      />
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                          <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                          <th className="py-5 px-6 text-center font-medium">Files</th>
                          <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                          <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFolders.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("button")) return;
                              router.push(item.href || `${pathname}/${item.id}`);
                            }}
                          >
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                  <FolderOpen className="text-[#E8D1AB]" size={20} />
                                </div>
                                <span className="text-white text-sm font-medium">{item.title}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center text-white/60 text-sm">
                              {String(item.fileCount).padStart(2, "0")}
                            </td>
                            <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                            <td className="py-5 px-6 text-right">
                              <Button
                                variant="ghost"
                                className="h-10 w-10 rounded-full p-0 text-white/40 hover:bg-white/10 hover:text-white"
                                onClick={(e) => handleOpenMenu(e, item)}
                              >
                                <MoreVertical size={20} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : viewState.kind === "mixed" ? (
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                  {filteredFolders.length === 0 ? (
                    <EmptyFileState />
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {filteredFolders.map((folder) => (
                        <FolderCard
                          key={folder.id}
                          title={folder.title}
                          fileCount={folder.fileCount}
                          lastOpened={folder.lastOpened}
                          category={folder.category}
                          isLinked={folder.isLinked}
                          userInitials={folder.userInitials}
                          onOpenLinkModal={() => undefined}
                          href={folder.href}
                          onDelete={
                            canDeleteFolders
                              ? () => {
                                setSelectedFolder(folder);
                                setSelectedFile(null);
                                setIsDeleteModalOpen(true);
                              }
                              : undefined
                          }
                          onShare={() => {
                            setShareResource({
                              resourceType: "folder",
                              externalId: String(projectId || ""),
                              phase: currentPhase,
                              label: folder.title,
                            });
                            setIsShareModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                  {filteredFiles.length === 0 ? (
                    <EmptyFileState />
                  ) : (
                    viewMode === "grid" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                          {visibleFiles.map((file) => (
                            <FileCard
                              key={file.id}
                              file={{ ...file, previewUrl: previewUrls[file.id] }}
                              onOpen={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                              onDownload={() => handleDownloadFile(file as unknown as Record<string, unknown>)}
                              isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                              onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                              onDelete={
                                canDeleteFiles
                                  ? () => {
                                    setSelectedFile(file as unknown as Record<string, unknown>);
                                    setIsDeleteModalOpen(true);
                                  }
                                  : undefined
                              }
                              onShare={() => {
                                setShareResource({
                                  resourceType: "file",
                                  externalId: String(projectId || ""),
                                  phase: currentPhase,
                                  filepath: file.filepath || undefined,
                                  label: file.title,
                                });
                                setIsShareModalOpen(true);
                              }}
                            />
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
                    ) : (
                      renderFilesTable()
                    )
                  )}
                </div>
              </div>
            ) : viewMode === "grid" ? (
              filteredFiles.length === 0 ? (
                <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {visibleFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={{ ...file, previewUrl: previewUrls[file.id] }}
                        onOpen={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                        onDownload={() => handleDownloadFile(file as unknown as Record<string, unknown>)}
                        isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                        onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                        onDelete={
                          canDeleteFiles
                            ? () => {
                              setSelectedFile(file as unknown as Record<string, unknown>);
                              setIsDeleteModalOpen(true);
                            }
                            : undefined
                        }
                        onShare={() => {
                          setShareResource({
                            resourceType: "file",
                            externalId: String(projectId || ""),
                            phase: currentPhase,
                            filepath: file.filepath || undefined,
                            label: file.title,
                          });
                          setIsShareModalOpen(true);
                        }}
                      />
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
            ) : filteredFiles.length === 0 ? (
              <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
            ) : (
              renderFilesTable()
            )}
          </div>
        </>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={workspaceName || ""}
        uploadPath={canUpload ? defaultUploadPath : undefined}
        onUploadComplete={loadPhase}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
        title="Create Folder"
        description={`Create folder inside ${viewState.title}`}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (selectedFilePaths.length > 0) return handleBatchDelete();
          if (selectedFile) return handleDeleteFile(selectedFile);
          return handleDeleteSelectedFolder();
        }}
        itemName={selectedFilePaths.length > 0 ? `${selectedFilePaths.length} selected files` : selectedFile ? String(selectedFile.title || "this file") : selectedFolder?.title || "this folder"}
        itemType={selectedFile || selectedFilePaths.length > 0 ? "file" : "folder"}
        isDeleting={isDeleting}
      />
      {menuAnchor && selectedFolder ? (
        <FileActionMenu
          folderName={selectedFolder.title}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => undefined}
          anchor={menuAnchor}
          href={selectedFolder.href}
          onDownload={async () => {
            try {
              const slug = selectedFolder.href?.split("/").filter(Boolean).pop();
              const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                phase: currentPhase,
                path: currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined,
              });
              if (result?.url) {
                window.open(result.url, "_blank", "noopener,noreferrer");
              }
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : "Failed to download folder");
            }
          }}
          onDelete={
            canDeleteFolders
              ? () => {
                  setSelectedFile(null);
                  setIsDeleteModalOpen(true);
                }
              : undefined
          }
          onShare={() => {
            const slug = selectedFolder.href?.split("/").filter(Boolean).pop();
            setShareResource({
              resourceType: "folder",
              externalId: String(projectId || ""),
              phase: currentPhase,
              path: currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined,
              label: selectedFolder.title,
            });
            setIsShareModalOpen(true);
          }}
          onRename={() => toast.info("Folder rename is the next safe step.")}
        />
      ) : null}

      <FileViewerModal
        isOpen={!!viewerFile}
        onClose={() => {
          setViewerFile(null);
          setViewerUrl(null);
        }}
        fileName={String(viewerFile?.title || "")}
        fileUrl={viewerUrl}
        contentType={typeof viewerFile?.contentType === "string" ? viewerFile.contentType : undefined}
        fileMetaId={typeof viewerFile?.filepath === "string" ? viewerFile.filepath : null}
      />
      <ShareResourceModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareResource(null);
        }}
        resource={shareResource}
      />

      {selectedFilePaths.length > 0 ? (
        <div className="fixed bottom-10 left-1/2 z-[100] w-full max-w-xl -translate-x-1/2 px-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8D1AB]/50 bg-[#171717] p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D1AB] text-sm font-bold text-black">
                {selectedFilePaths.length}
              </div>
              <span className="font-medium text-white">Files selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="gap-2 text-white/70 hover:text-white"
                onClick={() => {
                  setSelectedFilePaths([]);
                  setIsSelectionMode(false);
                }}
              >
                Clear
              </Button>

              <div className="mx-1 h-6 w-[1px] bg-white/10" />

              <Button
                className="gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
                onClick={handleBatchDownload}
              >
                <DownloadIcon size={18} />
                Download
              </Button>

              {canDeleteFiles ? (
                <Button
                  className="gap-2 bg-[#F04438] text-white hover:bg-[#F04438]/90"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <TrashIcon size={18} />
                  Delete
                </Button>
              ) : null}
            </div>

            <button
              onClick={() => {
                setSelectedFilePaths([]);
                setIsSelectionMode(false);
              }}
              className="text-white/40 hover:text-white"
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
