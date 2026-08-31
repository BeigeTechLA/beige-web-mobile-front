"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Folder,
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
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  canCreativePartnerDeleteFile,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
  shouldShowCommonEventRootFolder,
  slugToWorkspaceName,
  type UiFolderItem,
  type UiFileItem,
} from "@/lib/fileManagerApi";
import { getProject } from "@/lib/api";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  getFileManagerRouteState,
  getFileManagerRouteStateKey,
  setFileManagerRouteState,
} from "@/lib/fileManagerRouteState";

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
  const { canCreate: canCreateByPermission, canDelete: canDeleteByPermission } = usePermissions("file_manager");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);
  const isPhaseRoute = phaseSlug === "pre-production" || phaseSlug === "post-production";
  const isCommonEventRootFolder = isCommonEventWorkspace && !isPhaseRoute;
  const fileCardStage = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const rootFolderPath = useMemo(
    () => String(searchParams.get("path") || slugToWorkspaceName(phaseSlug) || "").trim(),
    [phaseSlug, searchParams]
  );
  const { isDark } = useResolvedTheme();
  const routeStateKey = getFileManagerRouteStateKey(pathname);

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
  const [isOpen, setIsOpen] = useState(false);

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
  const [cpDeleteLockDays, setCpDeleteLockDays] = useState(7);
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

  useEffect(() => {
    const savedState = getFileManagerRouteState(routeStateKey);
    setSearchTerm(savedState.searchTerm);
    setVisibleFileCount(savedState.visibleFileCount);
  }, [routeStateKey]);

  useEffect(() => {
    setFileManagerRouteState(
      {
        searchTerm,
        visibleFileCount,
      },
      routeStateKey
    );
  }, [routeStateKey, searchTerm, visibleFileCount]);

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
      const phase = isCommonEventRootFolder ? undefined : phaseSlug === "post-production" ? "post" : "pre";
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        phase,
        isCommonEventRootFolder ? rootFolderPath : undefined
      );
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
  }, [isCommonEventRootFolder, phaseSlug, projectId, rootFolderPath]);

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

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fileManagerApi.getFileManagerSettings();
        if (mounted) {
          setCpDeleteLockDays(Number(settings?.cpDeleteLockDays ?? settings?.cp_delete_lock_days ?? 7));
        }
      } catch {
        if (mounted) setCpDeleteLockDays(7);
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const viewState = useMemo(() => {
    if (!workspaceName) {
      return { title: "Folder", kind: "folders" as const, folders: [], files: [] };
    }

    if (isCommonEventRootFolder) {
      return {
        title: rootFolderPath || slugToWorkspaceName(phaseSlug),
        kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders as never[],
          (folder) => {
            const childPath = [rootFolderPath, folder.name].filter(Boolean).join("/");
            return `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
              childPath
            )}`;
          }
        ).filter(shouldShowCommonEventRootFolder),
        files: mapExternalFilesToUi(workspaceFiles as never[]),
      };
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
  }, [isCommonEventRootFolder, phaseSlug, projectId, rootFolderPath, workspaceFiles, workspaceFolders, workspaceName]);

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

  const currentPhase = isCommonEventRootFolder ? undefined : phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? isCommonEventRootFolder
      ? `${workspaceName}/${rootFolderPath}`
      : `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;
  const isCommonEventPreProductionRoot =
    isCommonEventWorkspace && phaseSlug === "pre-production";
  const canCreateFolder = isCommonEventWorkspace && !isCommonEventPreProductionRoot && canCreateByPermission;
  const canDeleteFolders = canDeleteByPermission;
  const canDeleteFiles = (isCommonEventWorkspace || phaseSlug === "post-production") && canDeleteByPermission;
  const canDeleteFileWithinWindow = useCallback(
    (file: Pick<UiFileItem, "createdAt" | "updatedAtRaw"> | null | undefined) =>
      canDeleteFiles && canCreativePartnerDeleteFile(file, cpDeleteLockDays),
    [canDeleteFiles, cpDeleteLockDays]
  );
  const getFolderActionPath = useCallback((folder?: UiFolderItem | null) => {
    if (!folder) return undefined;
    if (isCommonEventRootFolder) {
      return [rootFolderPath, folder.rawName || folder.title].filter(Boolean).join("/");
    }
    const slug = folder.href?.split("/").filter(Boolean).pop();
    return currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined;
  }, [currentPhase, isCommonEventRootFolder, rootFolderPath]);
  const canDeleteFolderWithinWindow = useCallback(
    (folder?: UiFolderItem | null) => {
      if (!canDeleteFolders || !folder) return false;
      if (!isCommonEventWorkspace && phaseSlug !== "post-production") return false;
      const folderActionPath = isCommonEventRootFolder
        ? [rootFolderPath, folder.rawName || folder.title].filter(Boolean).join("/")
        : folder.resourcePath || getFolderActionPath(folder) || "";
      const folderSegments = String(folderActionPath).split("/").filter(Boolean);
      if (isCommonEventWorkspace && folderSegments.length <= 1) return false;
      return canCreativePartnerDeleteFile(folder, cpDeleteLockDays);
    },
    [canDeleteFolders, cpDeleteLockDays, getFolderActionPath, isCommonEventRootFolder, isCommonEventWorkspace, phaseSlug, rootFolderPath]
  );

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;
    if (!canDeleteFolderWithinWindow(selectedFolder)) {
      toast.error(`Creative partners can delete their own folders only within ${cpDeleteLockDays} day${cpDeleteLockDays === 1 ? "" : "s"} of creation. Please request admin support.`);
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
        fileManagerApi.downloadUrl(result.url, String(file.title || file.name || "file"));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download file");
    }
  };

  const handleDeleteFile = async (file: Record<string, unknown> | null) => {
    const targetFile = file || selectedFile;
    if (!targetFile || typeof targetFile.filepath !== "string") return;
    if (!canDeleteFileWithinWindow(targetFile as Pick<UiFileItem, "createdAt" | "updatedAtRaw">)) {
      toast.error(`Creative partners can delete files only within ${cpDeleteLockDays} day${cpDeleteLockDays === 1 ? "" : "s"} of upload. Please request admin support.`);
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
    canCreateByPermission &&
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
  const selectionLockActive = isSelectionMode || selectedFilePaths.length > 0;
  const selectedFiles = useMemo(
    () => filteredFiles.filter((file) => selectedFilePaths.includes(file.filepath || "")),
    [filteredFiles, selectedFilePaths]
  );
  const canDeleteSelectedFiles =
    selectedFiles.length > 0 &&
    selectedFiles.every((file) => canDeleteFileWithinWindow(file));

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths((prev) =>
      prev.includes(filepath)
        ? prev.filter((path) => path !== filepath)
        : [...prev, filepath]
    );
  };

  const handleBatchDownload = async () => {
    if (selectedFilePaths.length === 0) return;
    try {
      toast.info(`Preparing ${selectedFilePaths.length} files as a zip...`);
      await fileManagerApi.downloadExternalSelectedFiles(selectedFilePaths, "selected-files.zip");
      toast.success("Download started");
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download selected files");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedFilePaths.length === 0) return;
    if (!canDeleteSelectedFiles) {
      toast.error(`Some selected files are locked. Creative partners can delete files only within ${cpDeleteLockDays} day${cpDeleteLockDays === 1 ? "" : "s"} of upload.`);
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
      await fileManagerApi.createExternalFolder(projectId, trimmed, {
        phase: currentPhase,
        path: isCommonEventRootFolder ? rootFolderPath : undefined,
      });
      toast.success("Folder created");
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
      throw err;
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  const renderFilesTable = () => (
    <div className="space-y-4">

      <div className={`border rounded-xl overflow-x-auto no-scrollbar transition-all ${isDark ? "bg-[#111] border-white/5" : "bg-white border-[#E5E5E5] shadow-sm"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-xs uppercase tracking-wider transition-colors border-b ${isDark
              ? "bg-white/[0.03] text-white/40 border-white/5"
              : "bg-black/[0.05] text-black/40 border-[#E5E5E5]"
              }`}>
              {isSelectionMode ? (
                <th className="rounded-tl-xl p-4 lg:px-6 lg:py-5 font-medium">
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
                    className={`h-5 w-5 transition-colors ${isDark
                      ? "border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                      : "border-black/40 data-[state=checked]:border-[#cbb38b] data-[state=checked]:bg-[#cbb38b] data-[state=checked]:text-white"
                      }`}
                  />
                </th>
              ) : null}
              <th className={`${!isSelectionMode ? "rounded-tl-xl" : ""} p-4 lg:px-6 lg:py-5 font-medium`}>
                File title
              </th>
              <th className="p-4 lg:px-6 lg:py-5 font-medium">Type</th>
              <th className="p-4 lg:px-6 lg:py-5 font-medium">Last Opened</th>
              <th className="rounded-tr-xl p-4 lg:px-6 lg:py-5 text-right font-medium">Action</th>
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
                  className={`cursor-pointer items-center transition-colors border-b last:border-0 ${selectionLockActive ? "cursor-default" : isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-black/5 hover:bg-black/[0.02]"
                    } ${isSelectionMode && isSelected
                      ? isDark ? "bg-white/[0.04]" : "bg-black/[0.03]"
                      : ""
                    }`}
                  onClick={selectionLockActive ? undefined : () => handleOpenFile(file as unknown as Record<string, unknown>)}
                >
                  {isSelectionMode ? (
                    <td className="whitespace-nowrap p-4 lg:px-6 lg:py-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                        className={`h-5 w-5 transition-colors ${isDark
                          ? "border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                          : "border-black/40 data-[state=checked]:border-[#cbb38b] data-[state=checked]:bg-[#cbb38b] data-[state=checked]:text-white"
                          }`}
                      />
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap p-4 lg:px-6 lg:py-5">
                    <div className="flex items-center gap-3">
                      <div className={`relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border transition-colors ${isDark ? "border-white/5 bg-[#1A1A1A]" : "border-black/5 bg-neutral-100"
                        }`}>
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
                      <span className={`max-w-[240px] truncate font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                        {file.title}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-4 lg:px-6 lg:py-5">
                    <div className={`capitalize transition-colors ${isDark ? "text-white/60" : "text-black/60"}`}>
                      {meta.label}
                    </div>
                  </td>
                  <td className={`whitespace-nowrap p-4 lg:px-6 lg:py-5 text-sm transition-colors ${isDark ? "text-white/60" : "text-black/60"}`}>
                    {file.lastOpened}
                  </td>
                  <td className="whitespace-nowrap p-4 lg:px-6 lg:py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark
                          ? "text-white/40 hover:bg-white/10 hover:text-white"
                          : "text-black/40 hover:bg-black/5 hover:text-black"
                          }`}
                        disabled={selectionLockActive}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectionLockActive) return;
                          handleDownloadFile(file as unknown as Record<string, unknown>);
                        }}
                      >
                        <DownloadIcon size={16} />
                      </button>
                      {canDeleteFileWithinWindow(file) ? (
                        <button
                          type="button"
                          className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark
                            ? "text-white/40 hover:bg-white/10 hover:text-[#F04438]"
                            : "text-black/40 hover:bg-black/5 hover:text-red-500"
                            }`}
                          disabled={selectionLockActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectionLockActive) return;
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
            className={`border transition-colors ${isDark
              ? "border-white/20 bg-[#202020] text-white hover:bg-white/10"
              : "border-black/10 bg-neutral-100 text-black hover:bg-black/5"
              }`}
            onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
          >
            View More
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        actions=
        {canUpload || canCreateFolder ? (
          <div className="flex items-center gap-2">
            {canCreateFolder ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  setIsCreateFolderModalOpen(true);
                }}
                disabled={selectionLockActive}
                className="border border-white/20 bg-[#202020] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FolderPlus /> Create Folder
              </Button>
            ) : null}
            {canUpload ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  setIsUploadModalOpen(true);
                }}
                disabled={selectionLockActive}
                className="border border-white/20 bg-[#E8D0AA] text-black hover:bg-[#D4C3A3] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload /> Upload Files
              </Button>
            ) : null}
          </div>
        ) : null}
      />
      <div className="overflow-x-hidden overflow-y-auto p-4 pb-20 lg:px-10 lg:py-9">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => {
              if (selectionLockActive) return;
              router.back();
            }}
            disabled={selectionLockActive}
            className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}
          >
            <ArrowLeft size={24} />
            <span className="text-sm font-medium">Back</span>
          </Button>

          {/* {canUpload || canCreateFolder ? (
            <div className="flex items-center gap-2">
              {canCreateFolder ? (
                <Button
                  onClick={() => {
                    if (selectionLockActive) return;
                    setIsCreateFolderModalOpen(true);
                  }}
                  disabled={selectionLockActive}
                  className="border border-white/20 bg-[#202020] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FolderPlus /> Create Folder
                </Button>
              ) : null}
              {canUpload ? (
                <Button
                  onClick={() => {
                    if (selectionLockActive) return;
                    setIsUploadModalOpen(true);
                  }}
                  disabled={selectionLockActive}
                  className="border border-white/20 bg-[#E8D0AA] text-black hover:bg-[#D4C3A3] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Upload /> Upload Files
                </Button>
              ) : null}
            </div>
          ) : null} */}
        </div>

        {loading ? (
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark
            ? "border-[#3D3D3D] bg-[#171717]"
            : "border-black/5 bg-neutral-50"
            }`}>
            <Loader2 className={`animate-spin ${isDark ? "text-[#BFA780]" : "text-[#cbb38b]"}`} size={40} />
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
                <div className={`min-w-0 max-w-3xl flex-1 ${isDark ? "text-white" : "text-black"}`}>
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
                    <span className={isDark ? "text-[#AAA7A7]" : "text-gray-400"}>Project Code: </span>
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
                <div className={`mb-3 rounded-xl border p-3 lg:mb-4 lg:p-4 transition-all duration-200 ${isDark ? "border-[#E8D1AB]/25 bg-gradient-to-r from-[#2A2215] to-[#17130E]" : "border-[#cbb38b]/30 bg-gradient-to-r from-[#FAF6EE] to-[#F3EAE0]"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 transition-colors ${isDark ? "bg-[#E8D1AB]/15 text-[#E8D1AB]" : "bg-[#cbb38b]/15 text-[#cbb38b]"}`}>
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors ${isDark ? "text-[#F2E4C8]" : "text-[#7A6444]"}`}>
                        Uploads unlock on shoot day
                      </p>
                      <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-[#DCC7A0]" : "text-[#8A7558]"}`}>
                        Post-production upload will be available on{" "}
                        <span className={`font-medium transition-colors ${isDark ? "text-[#F2E4C8]" : "text-[#7A6444]"}`}>
                          {formattedShootDate}
                        </span>
                        . You can review folders and existing files now.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
                <div className={`relative flex w-full lg:max-w-xl items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"}`}>
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
                  <input
                    type="text"
                    placeholder="Search folder..."
                    value={searchTerm}
                    className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                      ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                      : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                      }`}
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

                  {/* View sWitcher */}
                  <div className="flex gap-2">
                    {/* MOBILE VIEW: Dropdown Button */}
                    <div className="lg:hidden relative">
                      <Button
                        onClick={toggleDropdown}
                        className={`flex items-center gap-2 ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white" : "border-[#E5E5E5] bg-white text-black"} border p-2 h-12 w-12 rounded-lg `}
                      >
                        {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
                      </Button>

                      {/* Dropdown Menu */}
                      {isOpen && (
                        <div className={`absolute top-full right-0 mt-2 w-48 border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden ${isDark ? "border-[#FFFFFF33] bg-[#171717] text-white" : "border-[#E5E5E5] bg-[#FFFCF6] text-black"}`}>
                          <button
                            onClick={() => handleViewChange('grid')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid'
                              ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                              : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                              }`}
                          >
                            <Grid3X3 size={18} />
                            Grid View
                          </button>
                          <button
                            onClick={() => handleViewChange('list')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list'
                              ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                              : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                              }`}
                          >
                            <List size={18} />
                            List View
                          </button>
                        </div>
                      )}
                    </div>

                    {/* DESKTOP VIEW: Original Toggle */}
                    <div className={`hidden lg:flex ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-white"} p-1 rounded-xl border w-fit`}>
                      <button
                        onClick={() => handleViewChange("grid")}
                        className={`relative z-10 inline-flex items-center justify-center rounded-lg  px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${viewMode === "grid"
                          ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                          : isDark
                            ? "text-white/60 hover:text-white"
                            : "text-[#666666] hover:text-black"
                          }`}
                      >
                        <Grid3X3 size={20} />
                      </button>
                      <button
                        onClick={() => handleViewChange("list")}
                        className={`relative z-10 inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${viewMode === "list"
                          ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                          : isDark
                            ? "text-white/60 hover:text-white"
                            : "text-[#666666] hover:text-black"
                          }`}
                      >
                        <List size={20} />
                      </button>
                    </div>
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
                            const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                              phase: currentPhase,
                              path: getFolderActionPath(folder),
                            });
                            if (result?.url) {
                              fileManagerApi.downloadUrl(result.url, `${folder.title || "folder"}.zip`);
                            }
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : "Failed to download folder");
                          }
                        }}
                        onDelete={
                          canDeleteFolderWithinWindow(folder)
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
                            path: getFolderActionPath(folder),
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
                          isDark={isDark}
                        />
                      ))}
                    </div>
                    <div className={`border rounded-xl hidden overflow-x-auto lg:block transition-all ${isDark ? "bg-[#111] border-white/5" : "bg-white border-[#E5E5E5] shadow-sm"}`}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-xs uppercase tracking-wider transition-colors border-b ${isDark ? "bg-white/[0.03] text-white/40 border-white/5" : "bg-black/[0.05] text-black/40 border-[#E5E5E5]"}`}>
                            <th className="rounded-tl-xl px-6 py-5 font-medium">Name</th>
                            <th className="px-6 py-5 font-medium">Files</th>
                            <th className="px-6 py-5 font-medium">Last Updated</th>
                            <th className="rounded-tr-xl px-6 py-5 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFolders.map((item) => (
                            <tr
                              key={item.id}
                              className={`cursor-pointer items-center transition-colors border-b last:border-0 ${isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-black/5 hover:bg-black/[0.02]"}`}
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                router.push(item.href || `${pathname}/${item.id}`);
                              }}
                            >
                              <td className="flex items-center gap-2 px-6 py-5">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${isDark ? "bg-white/10" : "bg-black/5"
                                  }`}>
                                  <FolderOpen
                                    className={isDark ? "fill-[#E8D1AB]/20 text-[#E8D1AB]" : "fill-[#cbb38b]/20 text-[#cbb38b]"}
                                    size={24}
                                  />
                                </div>
                                <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                                  {item.title}
                                </span>
                              </td>
                              <td className={`px-6 py-5 ${isDark ? "text-white" : "text-black"}`}>
                                {String(item.fileCount).padStart(2, "0")}
                              </td>
                              <td className={`px-6 py-5 ${isDark ? "text-white/60" : "text-black/60"}`}>{item.lastOpened}</td>
                              <td className="py-5 px-6 text-right">
                                <Button
                                  variant="ghost"
                                  className={`h-10 w-10 rounded-full p-0 transition-colors bg-transparent ${isDark
                                    ? "text-white hover:bg-white/10 hover:text-white/90"
                                    : "text-black hover:bg-black/5 hover:text-black/80"
                                    }`}
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
                      <EmptyFileState isDark={isDark} />
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
                              canDeleteFolderWithinWindow(folder)
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
                                path: getFolderActionPath(folder),
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
                      <EmptyFileState isDark={isDark} />
                    ) : (
                      viewMode === "grid" ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {visibleFiles.map((file) => (
                              <FileCard
                                key={file.id}
                                file={{ ...file, previewUrl: previewUrls[file.id] }}
                                stage={fileCardStage}
                                onOpen={selectionLockActive ? undefined : () => handleOpenFile(file as unknown as Record<string, unknown>)}
                                onDownload={selectionLockActive ? undefined : () => handleDownloadFile(file as unknown as Record<string, unknown>)}
                                isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                                onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                                onDelete={
                                  !selectionLockActive && canDeleteFileWithinWindow(file)
                                    ? () => {
                                      setSelectedFile(file as unknown as Record<string, unknown>);
                                      setIsDeleteModalOpen(true);
                                    }
                                    : undefined
                                }
                                onShare={selectionLockActive ? undefined : () => {
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
                  <EmptyFileState
                    onAction={canUpload && !selectionLockActive ? () => setIsUploadModalOpen(true) : undefined}
                    actionLabel={canUpload && !selectionLockActive ? "Upload Files" : undefined}
                    isDark={isDark}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {visibleFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={{ ...file, previewUrl: previewUrls[file.id] }}
                          stage={fileCardStage}
                          onOpen={selectionLockActive ? undefined : () => handleOpenFile(file as unknown as Record<string, unknown>)}
                          onDownload={selectionLockActive ? undefined : () => handleDownloadFile(file as unknown as Record<string, unknown>)}
                          isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                          onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                          onDelete={
                            !selectionLockActive && canDeleteFileWithinWindow(file)
                              ? () => {
                                setSelectedFile(file as unknown as Record<string, unknown>);
                                setIsDeleteModalOpen(true);
                              }
                              : undefined
                          }
                          onShare={selectionLockActive ? undefined : () => {
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
                <EmptyFileState
                  onAction={canUpload && !selectionLockActive ? () => setIsUploadModalOpen(true) : undefined}
                  actionLabel={canUpload && !selectionLockActive ? "Upload Files" : undefined}
                  isDark={isDark}
                />
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
          isDark={isDark}
        />

        <CreateFolderModal
          isOpen={isCreateFolderModalOpen}
          onClose={() => setIsCreateFolderModalOpen(false)}
          onCreate={handleCreateFolder}
          title="Create Folder"
          description={`Create folder inside ${viewState.title}`}
          isDark={isDark}
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
          isDark={isDark}
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
                const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                  phase: currentPhase,
                  path: getFolderActionPath(selectedFolder),
                });
                if (result?.url) {
                  fileManagerApi.downloadUrl(result.url, `${selectedFolder.title || "folder"}.zip`);
                }
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Failed to download folder");
              }
            }}
            onDelete={
              canDeleteFolderWithinWindow(selectedFolder)
                ? () => {
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
                path: getFolderActionPath(selectedFolder),
                label: selectedFolder.title,
              });
              setIsShareModalOpen(true);
            }}
            onRename={() => toast.info("Folder rename is the next safe step.")}
            isDark={isDark}
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
          isDark={isDark}
        />
        <ShareResourceModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareResource(null);
          }}
          resource={shareResource}
        />

        {selectedFilePaths.length > 0 && (
          <div className="fixed bottom-4 left-1/2 z-[100] w-fit -translate-x-1/2 lg:bottom-10">
            <div
              className={`relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-2xl lg:gap-4 lg:px-5 lg:py-3 ${isDark
                ? "border-[#E8D1AB]/50 bg-[#171717]"
                : "border-[#cbb38b]/50 bg-white"
                }`}
            >
              <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">

                {/* ─ Mobile: Folder icon with counter badge ─ */}
                <div className="relative lg:hidden shrink-0">
                  <Folder size={28} color="#000" fill="#E8D1AB" />
                  <span
                    className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#cbb38b] text-white"
                      }`}
                  >
                    {selectedFilePaths.length}
                  </span>
                </div>

                {/*  Desktop: Counter badge ─ */}
                <div
                  className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#cbb38b] text-white"
                    }`}
                >
                  {selectedFilePaths.length}
                </div>

                <span
                  className={`font-medium text-xs lg:text-base whitespace-nowrap ${isDark ? "text-white" : "text-black"
                    }`}
                >
                  <span className="lg:hidden">Selected</span>
                  <span className="hidden lg:inline">Files selected</span>
                </span>

                <Button
                  variant="ghost"
                  className={`text-xs lg:text-sm h-8 lg:h-9 px-2 lg:px-3 ${isDark
                    ? "text-white/70 hover:text-white"
                    : "text-black/70 hover:text-black"
                    }`}
                  onClick={() => {
                    setSelectedFilePaths([]);
                    setIsSelectionMode(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  className={`gap-1.5 text-xs lg:text-sm h-8 lg:h-9 px-2 lg:px-0 ${isDark
                    ? "text-white/70 hover:text-white"
                    : "text-black/70 hover:text-black"
                    }`}
                  onClick={() => {
                    const allVisible = visibleFiles
                      .map((file) => file.filepath || "")
                      .filter(Boolean);
                    setSelectedFilePaths(Array.from(new Set(allVisible)));
                    setIsSelectionMode(true);
                  }}
                >
                  <CheckSquare size={14} className="lg:size-[16px]" />
                  <span className="hidden lg:inline">Select all</span>
                  <span className="lg:hidden">All</span>
                </Button>
              </div>

              {/* DIVIDER (desktop only) */}
              <div
                className={`hidden lg:block h-7 w-[2px] shrink-0 ${isDark ? "bg-white/10" : "bg-black/10"
                  }`}
              />
              <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                <Button
                  className={`gap-1.5 lg:gap-2 text-xs lg:text-sm h-9 lg:h-10 ${isDark
                    ? "border border-white/10 bg-white/10 text-white hover:bg-white/20"
                    : "border border-black/10 bg-black/5 text-black hover:bg-black/10"
                    }`}
                  onClick={handleBatchDownload}
                >
                  <DownloadIcon size={16} className="lg:size-[18px]" />
                  <span className="hidden lg:inline">Download</span>
                </Button>
                {canDeleteSelectedFiles && (
                  <Button
                    className={`gap-1.5 lg:gap-2 text-xs lg:text-sm h-9 lg:h-10 ${isDark
                      ? "bg-[#F04438] text-white hover:bg-[#F04438]/90"
                      : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <TrashIcon size={16} className="lg:size-[18px]" />
                    <span className="hidden lg:inline">Delete</span>
                  </Button>
                )}
                <button
                  onClick={() => {
                    setSelectedFilePaths([]);
                    setIsSelectionMode(false);
                  }}
                  className={`h-8 w-8 lg:h-9 lg:w-9 flex items-center justify-center rounded-full shrink-0 ${isDark
                    ? "text-white/40 hover:text-white hover:bg-white/10"
                    : "text-black/40 hover:text-black hover:bg-black/10"
                    }`}
                >
                  <CloseIcon size={18} className="lg:size-[20px]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- FLOATING MOBILE BUTTON --- */}
        {canUpload || canCreateFolder ? (
          <div className={`lg:hidden fixed flex gap-2 items-center justify-center bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
            {canCreateFolder ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  setIsCreateFolderModalOpen(true);
                }}
                disabled={selectionLockActive}
                className="border border-white/20 bg-[#202020] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FolderPlus /> Create Folder
              </Button>
            ) : null}
            {canUpload ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  setIsUploadModalOpen(true);
                }}
                disabled={selectionLockActive}
                className="border border-white/20 bg-[#E8D0AA] text-black hover:bg-[#D4C3A3] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload /> Upload Files
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
