"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import {
  ArrowLeft,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  MoreVertical,

  Presentation,
  Search,
  Upload,
  CheckSquare,
  Square,
  X as CloseIcon,
  Download as DownloadIcon,
  Trash2 as TrashIcon
} from "lucide-react";
import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import { FileManagerBoard } from "@/components/admin/file-manager/FileManagerBoard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import Topbar from "@/components/admin/Topbar";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
  slugToWorkspaceName,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  getFileManagerRouteState,
  getFileManagerRouteStateKey,
  setFileManagerRouteState,
} from "@/lib/fileManagerRouteState";

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

const tryDecodeURIComponent = (value: string) => {
  const normalizedValue = String(value || "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalizedValue);
  } catch {
    return normalizedValue;
  }
};

const getPhaseRelativePath = (resourcePath?: string, fallbackName?: string) => {
  const normalized = String(resourcePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (!normalized) return fallbackName;

  const segments = normalized.split("/").filter(Boolean);
  const phaseIndex = segments.findIndex((segment) => {
    const lower = String(segment || "").trim().toLowerCase();
    return lower === "pre-production" || lower === "post-production";
  });

  if (phaseIndex >= 0) {
    const relativePath = segments.slice(phaseIndex + 1).join("/");
    if (relativePath) return relativePath;
  }

  return segments[segments.length - 1] || fallbackName;
};

export default function AdminFileManagerPhasePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);
  const isPhaseRoute = phaseSlug === "pre-production" || phaseSlug === "post-production";
  const isCommonEventRootFolder = isCommonEventWorkspace && !isPhaseRoute;
  const isCommonEventPhaseFolder = isCommonEventWorkspace && isPhaseRoute;
  const rootFolderPath = useMemo(
    () => String(searchParams.get("path") || slugToWorkspaceName(phaseSlug) || "").trim(),
    [phaseSlug, searchParams]
  );
  const isPreProduction = phaseSlug !== "post-production";
  const fileCardStage = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const { isDark } = useResolvedTheme();
  const routeStateKey = getFileManagerRouteStateKey(pathname);
  const { canCreate, canDelete } = usePermissions("file_manager");

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);
  const [isOpen, setIsOpen] = useState(false);

  const [status, setStatus] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [uploadPathOverride, setUploadPathOverride] = useState<string | undefined>(undefined);
  const [uploadFolderLabel, setUploadFolderLabel] = useState<string | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
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

  const loadPhase = async () => {
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
    } catch (err: any) {
      setError(err?.message || "Failed to load folder");
    } finally {
      setLoading(false);
    }
  };

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
  }, [projectId, phaseSlug, isCommonEventRootFolder, rootFolderPath]);

  const viewState = useMemo(() => {
    if (!workspaceName) {
      return { title: "Folder", kind: "folders" as const, folders: [], files: [] };
    }

    if (isCommonEventRootFolder) {
      return {
        title: rootFolderPath || slugToWorkspaceName(phaseSlug),
        kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders,
          (folder) => {
            const childPath = [rootFolderPath, folder.name].filter(Boolean).join("/");
            const slug = folder.name.toLowerCase().replace(/\s+/g, "-");
            const query = new URLSearchParams();
            if (childPath) query.set("path", childPath);
            if (folder.name) query.set("name", String(folder.name));
            const queryString = query.toString();
            return `/admin/file-manager/${projectId}/${phaseSlug}/${slug}${queryString ? `?${queryString}` : ""}`;
          }
        ),
        files: mapExternalFilesToUi(workspaceFiles),
      };
    }

    if (phaseSlug === "post-production") {
      return {
        title: "Post Production",
        kind: "folders" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders,
          (folder) => {
            const childPath = isCommonEventPhaseFolder
              ? [rootFolderPath, folder.name].filter(Boolean).join("/")
              : tryDecodeURIComponent(String(folder.name));
            const slug = folder.name.toLowerCase().replace(/\s+/g, "-");
            const query = new URLSearchParams();
            if (childPath) query.set("path", childPath);
            if (folder.name) query.set("name", String(folder.name));
            const queryString = query.toString();
            return `/admin/file-manager/${projectId}/post-production/${slug}${queryString ? `?${queryString}` : ""}`;
          }
        ),
        files: [],
      };
    }

    return {
      title: slugToWorkspaceName(phaseSlug),
      kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
      folders: mapExternalFoldersToUi(
        workspaceFolders,
        (folder) => {
          const childPath = isCommonEventPhaseFolder
            ? [rootFolderPath, folder.name].filter(Boolean).join("/")
            : tryDecodeURIComponent(String(folder.name));
          const slug = folder.name.toLowerCase().replace(/\s+/g, "-");
          const query = new URLSearchParams();
          if (childPath) query.set("path", childPath);
          if (folder.name) query.set("name", String(folder.name));
          const queryString = query.toString();
          return `/admin/file-manager/${projectId}/${phaseSlug}/${slug}${queryString ? `?${queryString}` : ""}`;
        }
      ),
      files: mapExternalFilesToUi(workspaceFiles),
    };
  }, [isCommonEventPhaseFolder, isCommonEventRootFolder, phaseSlug, projectId, rootFolderPath, workspaceFiles, workspaceFolders, workspaceName]);

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
    const filesWithMeta = viewState.files.map((file) => ({
      ...file,
      ...getFileMeta(file),
    }));
    if (!searchTerm.trim()) return filesWithMeta;
    const query = searchTerm.toLowerCase();
    return filesWithMeta.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.files]);
  const visibleFiles = useMemo(
    () => filteredFiles.slice(0, visibleFileCount),
    [filteredFiles, visibleFileCount]
  );
  const hasMoreFiles = filteredFiles.length > visibleFileCount;

  const folderBoardColumns = useMemo(
    () => [
      {
        id: "linked",
        title: "Linked",
        items: filteredFolders.filter((folder) => folder.isLinked),
      },
      {
        id: "unlinked",
        title: "Unlinked",
        items: filteredFolders.filter((folder) => !folder.isLinked),
      },
    ],
    [filteredFolders]
  );

  const fileBoardColumns = useMemo(() => {
    const labels = Array.from(new Set(filteredFiles.map((file) => file.label || "file")));
    const orderedLabels = [
      ...FILE_BOARD_ORDER.filter((label) => labels.includes(label)),
      ...labels.filter((label) => !FILE_BOARD_ORDER.includes(label)),
    ];

    return orderedLabels.map((label) => ({
      id: label,
      title: FILE_BOARD_TITLES[label] || `${String(label).charAt(0).toUpperCase()}${String(label).slice(1)} Files`,
      items: filteredFiles.filter((file) => (file.label || "file") === label),
    }));
  }, [filteredFiles]);

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [projectId, phaseSlug, searchTerm, viewState.files.length, viewState.kind]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
      (file: any) =>
        file.filepath &&
        (file.contentType?.startsWith("image/") || file.contentType?.startsWith("video/"))
    );

    if (!previewableFiles.length) return;

    let active = true;
    const timeoutId = window.setTimeout(() => {
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
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [visibleFiles]);

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

  const currentPhase = isCommonEventWorkspace ? undefined : phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? isCommonEventWorkspace
      ? `${workspaceName}/${rootFolderPath}`
      : `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;

  const getFolderPath = (folder?: UiFolderItem | null) => {
    if (!folder) return undefined;
    if (isCommonEventWorkspace) {
      return [rootFolderPath, folder.rawName || folder.title].filter(Boolean).join("/");
    }
    return getPhaseRelativePath(folder.resourcePath, folder.title);
  };

  const getSelectedFolderPath = () => {
    return getFolderPath(selectedFolder);
  };

  const handleDownloadSelectedFolder = async () => {
    if (!selectedFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: currentPhase,
        path: getSelectedFolderPath(),
      });
      if (result?.url) {
        fileManagerApi.downloadUrl(result.url, `${selectedFolder.title || "folder"}.zip`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download folder");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete folders");
      return;
    }
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    if (!isPreProduction || !canCreate) return;
    try {
      const folderName = name.trim();
      await fileManagerApi.createExternalFolder(projectId, folderName, {
        phase: currentPhase,
        path: isCommonEventWorkspace ? rootFolderPath : undefined,
      });
      toast.success("Folder created");
      setIsCreateFolderModalOpen(false);
      setUploadFolderLabel(folderName);
      setUploadPathOverride(defaultUploadPath ? `${defaultUploadPath}/${folderName}` : undefined);
      setIsUploadModalOpen(true);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create folder");
      throw err;
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (result?.url) {
        fileManagerApi.downloadUrl(result.url, file.title || file.name || "file");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download file");
    }
  };

  const handleDeleteFile = async (file: any) => {
    const targetFile = file || selectedFile;
    if (!canDelete) {
      toast.error("You do not have permission to delete files");
      return;
    }
    if (!targetFile?.filepath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

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

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths(prev =>
      prev.includes(filepath)
        ? prev.filter(p => p !== filepath)
        : [...prev, filepath]
    );
  };

  const selectAllVisibleFiles = () => {
    const allVisible = visibleFiles.map((file) => file.filepath || "").filter(Boolean);
    setSelectedFilePaths(Array.from(new Set(allVisible)));
    setIsSelectionMode(true);
  };

  const handleBatchDownload = async () => {
    if (selectedFilePaths.length === 0) return;
    try {
      toast.info(`Preparing ${selectedFilePaths.length} files as a zip...`);
      await fileManagerApi.downloadExternalSelectedFiles(selectedFilePaths, "selected-files.zip");
      toast.success("Download started");
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download selected files");
    }
  };

  const handleBatchDelete = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete files");
      return;
    }
    if (selectedFilePaths.length === 0) return;

    try {
      setIsDeleting(true);
      const total = selectedFilePaths.length;
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
          <>
            <Button
              onClick={() => {
                if (isSelectionMode || !canCreate) return;
                setIsUploadModalOpen(true);
              }}
              disabled={isSelectionMode || !canCreate}
              className="bg-[#202020] border border-white/20 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload size={18} /> Upload Files
            </Button>
            {isPreProduction ? (
              <Button
                onClick={() => {
                  if (!canCreate) return;
                  setIsCreateFolderModalOpen(true);
                }}
                disabled={!canCreate}
                className="bg-[#E5D5B8] text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create Folder
              </Button>
            ) : null}
          </>
        }
      />

      <div className="overflow-x-hidden overflow-y-auto p-4 pb-20 lg:px-10 lg:py-9">
        <Button onClick={() => router.back()} className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}>
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {loading ? (
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-gray-200 bg-gray-50"}`}>
            <Loader2 className={`animate-spin text-[#E8D1AB]`} size={40} />
          </div>
        ) : error ? (
          <div className={`text-sm ${isDark ? "text-red-300" : "text-red-600"}`}>
            {error || "Folder not found"}
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-start gap-5 mb-2 lg:mb-6">
                <div className={`h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl flex items-center justify-center text-lg lg:text-[30px] font-medium transition-colors duration-300 ${isDark
                  ? "bg-[#C8E1FF] text-[#000]"
                  : "bg-blue-100 text-blue-900"
                  }`}>
                  {getDisplayInitials(workspaceName)}
                </div>
                <div className={`min-w-0 ${isDark ? "text-white" : "text-black"} max-w-3xl flex-1`}>
                  <div className="flex flex-row lg:items-center gap-0.5 lg:gap-2">
                    <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                      {workspaceName}
                    </h1>
                    <span className={`hidden lg:block px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border border-white/5 flex items-center gap-1.5 h-fit w-fit ${phaseSlug === "post-production" ? "bg-[#E8D2FB] text-[#540B94]" : "bg-[#FDF4FF] text-[#C026D3]"}`}>
                      {viewState.title}
                    </span>
                  </div>
                  <p className={`text-xs lg:text-sm transition-colors duration-300 ${isDark ? "text-[#D0D0D0]" : "text-gray-600"}`}>
                    <span className={isDark ? "text-[#AAA7A7]" : "text-gray-400"}>Project Code: </span>
                    {workspaceCode}
                  </p>
                  <span className={`mt-2 block lg:hidden px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border border-white/5 flex items-center gap-1.5 h-fit w-fit ${phaseSlug === "post-production" ? "bg-[#E8D2FB] text-[#540B94]" : "bg-[#FDF4FF] text-[#C026D3]"}`}>
                    {viewState.title}
                  </span>
                  {/* {workspaceConsoleUrl ? (
                    <a
                      href={workspaceConsoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden lg:inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                    >
                      Open Storage Folder
                    </a>
                  ) : null} */}
                </div>
              </div>
              {/* <p className="lg:hidden text-xs text-[#D0D0D0]">
                <span className="text-[#AAA7A7]">Project Code: </span>
                {workspaceCode}
              </p> */}
              {/* {workspaceConsoleUrl ? (
                <a
                  href={workspaceConsoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="lg:hidden inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                >
                  Open Storage Folder
                </a>
              ) : null} */}
            </div>

            <div className="pb-20 lg:pb-0">
              <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-[#9F9FA9]"}`} />
                  <input
                    type="text"
                    placeholder={viewState.kind === "folders" ? "Search folders..." : "Search files..."}
                    value={searchTerm}
                    className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                      ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                      : "bg-white border-[#E3E3E3] text-black placeholder:text-[#9F9FA9] focus:ring-[#D7D7D7] focus:border-[#D7D7D7]"
                      }`}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {filteredFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const nextMode = !isSelectionMode;
                        setIsSelectionMode(nextMode);
                        if (!nextMode) setSelectedFilePaths([]);
                      }}
                      className={`gap-2 h-8 lg:h-10 px-4 rounded-lg border transition-all ${isSelectionMode
                        ? 'bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90'
                        : isDark
                          ? 'bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20'
                          : 'bg-white text-[#333333] border-[#E5E5E5] hover:bg-zinc-50 hover:text-black'
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
                <div className="space-y-6">
                  {filteredFolders.length > 0 ? (
                    <div className="space-y-3">
                      <div className="px-1">
                        <h3 className="text-sm font-medium text-[#E8D1AB]">Folders Board</h3>
                      </div>
                      <FileManagerBoard
                        columns={folderBoardColumns}
                        emptyMessage="No folders in this column"
                        getItemId={(folder) => String(folder.id)}
                        renderCard={(folder) => (
                          <FolderCard
                            title={folder.title}
                            fileCount={folder.fileCount}
                            lastOpened={folder.lastOpened}
                            userInitials={folder.userInitials}
                            isLinked={folder.isLinked}
                            category={folder.category}
                            href={folder.href}
                            onOpen={() => router.push(folder.href || `${pathname}/${folder.id}`)}
                            onOpenLinkModal={() => {
                              setSelectedFolder(folder);
                              setIsLinkModalOpen(true);
                            }}
                            onDownload={async () => {
                              setSelectedFolder(folder);
                              try {
                                const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                                  phase: currentPhase,
                                  path: getFolderPath(folder),
                                });
                                if (result?.url) {
                                  fileManagerApi.downloadUrl(result.url, `${folder.title || "folder"}.zip`);
                                }
                              } catch (err: any) {
                                toast.error(err?.message || "Failed to download folder");
                              }
                            }}
                            onDelete={() => {
                              setSelectedFolder(folder);
                              setIsDeleteModalOpen(true);
                            }}
                            deleteDisabled={!canDelete}
                            onShare={() => {
                              setSelectedFolder(folder);
                              setIsShareModalOpen(true);
                            }}
                            onRename={() => toast.info("Folder rename is the next safe step.")}
                          />
                        )}
                      />
                    </div>
                  ) : null}

                  {filteredFiles.length > 0 ? (
                    <div className="space-y-3">
                      <div className="px-1">
                        <h3 className="text-sm font-medium text-[#E8D1AB]">Files Board</h3>
                      </div>
                      <FileManagerBoard
                        columns={fileBoardColumns}
                        emptyMessage="No files in this column"
                        getItemId={(file) => String(file.id)}
                        renderCard={(file) => (
                          <FileCard
                            file={{ ...file, previewUrl: previewUrls[file.id] }}
                            stage={fileCardStage}
                            onOpen={() => handleOpenFile(file)}
                            onDownload={() => handleDownloadFile(file)}
                            onDelete={() => {
                              setSelectedFile(file);
                              setSelectedFolder(null);
                              setIsDeleteModalOpen(true);
                            }}
                            deleteDisabled={!canDelete}
                            onShare={() => {
                              setSelectedFile(file);
                              setShareResource({
                                resourceType: "file",
                                externalId: String(projectId || ""),
                                phase: currentPhase,
                                filepath: file.filepath,
                                label: file.title,
                              });
                              setIsShareModalOpen(true);
                            }}
                            isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                            onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                            isDark={isDark}
                          />
                        )}
                      />
                    </div>
                  ) : filteredFolders.length === 0 ? (
                    <EmptyFileState
                      onAction={() => setIsUploadModalOpen(true)}
                      actionLabel="Upload Files"
                      actionDisabled={!canCreate}
                      isDark={isDark}
                    />
                  ) : null}
                </div>
              ) : viewState.kind === "folders" ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        title={folder.title}
                        fileCount={folder.fileCount}
                        lastOpened={folder.lastOpened}
                        category={folder.category}
                        isLinked={folder.isLinked}
                        userInitials={folder.userInitials}
                        onOpenLinkModal={() => {
                          setSelectedFolder(folder);
                          setIsLinkModalOpen(true);
                        }}
                        href={folder.href}
                        onDownload={async () => {
                          setSelectedFolder(folder);
                          try {
                            const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                              phase: currentPhase,
                              path: getFolderPath(folder),
                            });
                            if (result?.url) {
                              fileManagerApi.downloadUrl(result.url, `${folder.title || "folder"}.zip`);
                            }
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to download folder");
                          }
                        }}
                            onDelete={() => {
                              setSelectedFolder(folder);
                              setSelectedFile(null);
                              setIsDeleteModalOpen(true);
                            }}
                            deleteDisabled={!canDelete}
                            onShare={() => {
                          setSelectedFolder(folder);
                          setShareResource({
                            resourceType: "folder",
                            externalId: String(projectId || ""),
                            phase: currentPhase,
                            path: getFolderPath(folder),
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
                          menuDisabled={!canDelete}
                          isDark={isDark}
                        />
                      ))}
                    </div>

                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 rounded-xl ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
                            <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                            <th className="py-5 px-6 text-center font-medium">Files</th>
                            <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                            <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                          {filteredFolders.map((item) => (
                            <tr
                              key={item.id}
                              className={`items-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                router.push(item.href || `${pathname}/${item.id}`);
                              }}
                            >
                              <td className={`py-5 px-6 flex gap-3 items-center min-w-0 `}>
                                <div className={`p-2 rounded-lg border transition-colors ${isDark ? "bg-white/10 border-white/5 " : "bg-transparent border-[#D7D7D7]"}`}>
                                  <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={20} />
                                </div>
                                <span className={`${isDark ? "text-white" : "text-black"} text-sm font-medium`}>{item.title}</span>
                              </td>
                              <td className={`py-5 px-6 text-center text-sm ${isDark ? "text-white/60" : "text-black/40"}`}>
                                {String(item.fileCount).padStart(2, "0")}
                              </td>
                              <td className={`py-5 px-6 text-center text-sm ${isDark ? "text-[#8F8F8F]" : "text-black/40"}`}>{item.lastOpened}</td>
                              <td className="py-5 px-6 text-right">
                                <Button
                                  variant="ghost"
                                  className={`h-10 w-10 rounded-full p-0 transition-colors ${isDark ? "text-white hover:bg-white/10 hover:text-white/90" : "text-black bg-transparent hover:bg-black/5 hover:text-black/90"}`}
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
                viewMode === "grid" ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                      {filteredFolders.length === 0 ? (
                        <div className="text-sm text-white/50">No folders yet in this section.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                          {filteredFolders.map((folder) => (
                            <FolderCard
                              key={folder.id}
                              title={folder.title}
                              fileCount={folder.fileCount}
                              lastOpened={folder.lastOpened}
                              category={folder.category}
                              isLinked={folder.isLinked}
                              userInitials={folder.userInitials}
                              onOpenLinkModal={() => {
                                setSelectedFolder(folder);
                                setIsLinkModalOpen(true);
                              }}
                              href={folder.href}
                              onDownload={async () => {
                                setSelectedFolder(folder);
                                try {
                                  const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                                    phase: currentPhase,
                                    path: getFolderPath(folder),
                                  });
                                  if (result?.url) {
                                    fileManagerApi.downloadUrl(result.url, `${folder.title || "folder"}.zip`);
                                  }
                                } catch (err: any) {
                                  toast.error(err?.message || "Failed to download folder");
                                }
                              }}
                              onDelete={() => {
                                setSelectedFolder(folder);
                                setSelectedFile(null);
                                setIsDeleteModalOpen(true);
                              }}
                              onShare={() => {
                                setSelectedFolder(folder);
                                setShareResource({
                                  resourceType: "folder",
                                  externalId: String(projectId || ""),
                                  phase: currentPhase,
                                  path: getFolderPath(folder),
                                  label: folder.title,
                                });
                                setIsShareModalOpen(true);
                              }}
                              onRename={() => toast.info("Folder rename is the next safe step.")}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {filteredFiles.length > 0 || filteredFolders.length === 0 ? (
                      <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                        {filteredFiles.length === 0 ? (
                          <EmptyFileState
                            onAction={() => setIsUploadModalOpen(true)}
                            actionLabel="Upload Files"
                            actionDisabled={!canCreate}
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                              {visibleFiles.map((file) => (
                                <FileCard
                                  key={file.id}
                                  file={{ ...file, previewUrl: previewUrls[file.id] }}
                                  stage={fileCardStage}
                                  onOpen={() => handleOpenFile(file)}
                                  onDownload={() => handleDownloadFile(file)}
                                  onDelete={() => {
                                    setSelectedFile(file);
                                    setSelectedFolder(null);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  deleteDisabled={!canDelete}
                                  onShare={() => {
                                    setSelectedFile(file);
                                    setShareResource({
                                      resourceType: "file",
                                      externalId: String(projectId || ""),
                                      phase: currentPhase,
                                      filepath: file.filepath,
                                      label: file.title,
                                    });
                                    setIsShareModalOpen(true);
                                  }}
                                  isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                                  onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                                  isDark={isDark}
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
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                      {filteredFolders.length === 0 ? (
                        <div className="text-sm text-white/50">No folders yet in this section.</div>
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

                          <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
                                  <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                                  <th className="py-5 px-6 text-center font-medium">Files</th>
                                  <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                                  <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                                </tr>
                              </thead>
                              <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                                {filteredFolders.map((item) => (
                                  <tr
                                    key={item.id}
                                    className={`items-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
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
                                      <Button variant="ghost" className="h-10 w-10 rounded-full p-0 text-white/40 hover:bg-white/10 hover:text-white" onClick={(e) => handleOpenMenu(e, item)} disabled={!canDelete}>
                                        <MoreVertical size={20} />
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

                    {filteredFiles.length > 0 || filteredFolders.length === 0 ? (
                      <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                        {filteredFiles.length === 0 ? (
                          <EmptyFileState
                            onAction={() => setIsUploadModalOpen(true)}
                            actionLabel="Upload Files"
                            actionDisabled={!canCreate}
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
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
                                            className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                          />
                                        </div>
                                      </th>
                                    )}
                                    <th className={`${!isSelectionMode ? 'rounded-l-xl' : ''} py-5 px-6 font-medium`}>Name</th>
                                    <th className="py-5 px-6 text-center font-medium">Type</th>
                                    <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                                    <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleFiles.map((item) => (
                                    <tr
                                      key={item.id}
                                      className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${(isSelectionMode && selectedFilePaths.includes(item.filepath || "")) ? 'bg-white/[0.04]' : ''}`}
                                      onClick={() => handleOpenFile(item)}
                                    >
                                      {isSelectionMode && (
                                        <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                                          <Checkbox
                                            checked={selectedFilePaths.includes(item.filepath || "")}
                                            onCheckedChange={() => toggleFileSelection(item.filepath || "")}
                                            className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                          />
                                        </td>
                                      )}
                                      <td className="py-5 px-6 text-white flex gap-2 items-center">
                                        {item.label === "image" && previewUrls[item.id] ? (
                                          <div className="h-10 w-10 overflow-hidden rounded-md border border-white/5 bg-[#1A1A1A]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={previewUrls[item.id]}
                                              alt={item.title || "Preview"}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <div className={`h-10 w-10 ${item.badgeClass} flex items-center justify-center rounded-md`}>
                                            <item.icon className={item.accentClass} size={20} />
                                          </div>
                                        )}
                                        <span className="text-sm font-semibold">{item.title}</span>
                                      </td>
                                      <td className="py-5 px-6 text-center text-white/60 text-sm">
                                        {openingFileId === item.id ? "OPENING..." : item.label}
                                      </td>
                                      <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                                      <td className="py-5 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <Button variant="ghost" className="text-white/40 hover:text-white" onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadFile(item);
                                          }}>
                                            Download
                                          </Button>
                                          <Button variant="ghost" className="text-white/40 hover:text-[#E8D1AB]" onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(item);
                                            setShareResource({
                                              resourceType: "file",
                                              externalId: String(projectId || ""),
                                              phase: currentPhase,
                                              filepath: item.filepath,
                                              label: item.title,
                                            });
                                            setIsShareModalOpen(true);
                                          }}>
                                            Share
                                          </Button>
                                          <Button variant="ghost" className="text-white/40 hover:text-[#F04438]" onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(item);
                                            setSelectedFolder(null);
                                            setIsDeleteModalOpen(true);
                                          }}>
                                            Delete
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
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
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              ) : viewMode === "grid" ? (
                filteredFiles.length === 0 ? (
                  <EmptyFileState
                    onAction={() => setIsUploadModalOpen(true)}
                    actionLabel="Upload Files"
                    actionDisabled={!canCreate}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                      {visibleFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={{ ...file, previewUrl: previewUrls[file.id] }}
                          stage={fileCardStage}
                          onOpen={() => handleOpenFile(file)}
                          onDownload={() => handleDownloadFile(file)}
                          onDelete={() => {
                            setSelectedFile(file);
                            setSelectedFolder(null);
                            setIsDeleteModalOpen(true);
                          }}
                          deleteDisabled={!canDelete}
                          onShare={() => {
                            setSelectedFile(file);
                            setShareResource({
                              resourceType: "file",
                              externalId: String(projectId || ""),
                              phase: currentPhase,
                              filepath: file.filepath,
                              label: file.title,
                            });
                            setIsShareModalOpen(true);
                          }}
                          isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                          onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                          isDark={isDark}
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
              ) : (
                filteredFiles.length === 0 ? (
                  <EmptyFileState
                    onAction={() => setIsUploadModalOpen(true)}
                    actionLabel="Upload Files"
                    actionDisabled={!canCreate}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
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
                                    className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                  />
                                </div>
                              </th>
                            )}
                            <th className={`${!isSelectionMode ? 'rounded-l-xl' : ''} py-5 px-6 font-medium`}>Name</th>
                            <th className="py-5 px-6 text-center font-medium">Type</th>
                            <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                            <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleFiles.map((item) => (
                            <tr
                              key={item.id}
                              className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${(isSelectionMode && selectedFilePaths.includes(item.filepath || "")) ? 'bg-white/[0.04]' : ''}`}
                              onClick={() => handleOpenFile(item)}
                            >
                              {isSelectionMode && (
                                <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedFilePaths.includes(item.filepath || "")}
                                    onCheckedChange={() => toggleFileSelection(item.filepath || "")}
                                    className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                  />
                                </td>
                              )}
                              <td className="py-5 px-6 text-white flex gap-2 items-center">
                                {item.label === "image" && previewUrls[item.id] ? (
                                  <div className="h-10 w-10 overflow-hidden rounded-md border border-white/5 bg-[#1A1A1A]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={previewUrls[item.id]}
                                      alt={item.title || "Preview"}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className={`h-10 w-10 ${item.badgeClass} flex items-center justify-center rounded-md`}>
                                    <item.icon className={item.accentClass} size={20} />
                                  </div>
                                )}
                                <span className="text-sm font-semibold">{item.title}</span>
                              </td>
                              <td className="py-5 px-6 text-center text-white/60 text-sm">
                                {openingFileId === item.id ? "OPENING..." : item.label}
                              </td>
                              <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                              <td className="py-5 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" className="text-white/40 hover:text-white" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(item);
                                  }}>
                                    Download
                                  </Button>
                                  <Button variant="ghost" className="text-white/40 hover:text-[#E8D1AB]" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(item);
                                    setShareResource({
                                      resourceType: "file",
                                      externalId: String(projectId || ""),
                                      phase: currentPhase,
                                      filepath: item.filepath,
                                      label: item.title,
                                    });
                                    setIsShareModalOpen(true);
                                  }}>
                                    Share
                                  </Button>
                                          <Button
                                            variant="ghost"
                                            className="text-white/40 hover:text-[#F04438] disabled:cursor-not-allowed disabled:opacity-40"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!canDelete) return;
                                              setSelectedFile(item);
                                              setSelectedFolder(null);
                                              setIsDeleteModalOpen(true);
                                            }}
                                            disabled={!canDelete}
                                            title={canDelete ? "Delete file" : "Delete permission not allowed"}
                                          >
                                            Delete
                                          </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
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
                )
              )}
            </div>
          </>
        )}

        {menuAnchor && (
          <FileActionMenu
            folderName={selectedFolder?.title || null}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
            anchor={menuAnchor}
            href={selectedFolder?.href}
            onDownload={handleDownloadSelectedFolder}
            onShare={() => {
              if (!selectedFolder) return;
              setShareResource({
                resourceType: "folder",
                externalId: String(projectId || ""),
                phase: currentPhase,
                path: getSelectedFolderPath(),
                label: selectedFolder.title,
              });
              setIsShareModalOpen(true);
            }}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRename={() => toast.info("Folder rename is the next safe step.")}
            isDark={isDark}
          />
        )}

        <LinkToShootModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          folderName={selectedFolder?.title || ""}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadPathOverride(undefined);
            setUploadFolderLabel(undefined);
          }}
          folderName={uploadFolderLabel || selectedFolder?.title || viewState.title}
          uploadPath={uploadPathOverride || defaultUploadPath}
          onUploadComplete={loadPhase}
          isDark={isDark}
        />

        {isPreProduction ? (
          <CreateFolderModal
            isOpen={isCreateFolderModalOpen}
            onClose={() => setIsCreateFolderModalOpen(false)}
            onCreate={handleCreateFolder}
            description={`Create a folder inside ${viewState.title}`}
            isDark={isDark}
          />
        ) : null}

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
          }}
          onConfirm={() => {
            if (selectedFilePaths.length > 0) {
              handleBatchDelete();
            } else if (selectedFile) {
              handleDeleteFile(selectedFile);
            } else {
              handleDeleteSelectedFolder();
            }
          }}
          itemName={
            selectedFilePaths.length > 0
              ? `${selectedFilePaths.length} selected files`
              : selectedFile?.title || selectedFolder?.title || "this item"
          }
          itemType={selectedFile || selectedFilePaths.length > 0 ? "file" : "folder"}
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
          fileMetaId={viewerFile?.filepath || null}
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

        {/* Batch Action Toolbar */}
        {selectedFilePaths.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[min(94vw,760px)] px-4">
            <div className={`border rounded-2xl shadow-2xl p-3 lg:p-4 flex flex-wrap items-center justify-between gap-3 transition-colors duration-200 ${isDark ? "bg-[#171717]  border-[#E8D1AB]/50" : "bg-white border-black/10 "}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-[#E8D1AB] text-black h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedFilePaths.length}
                </div>
                <span className={`font-medium leading-tight ${isDark ? "text-white" : "text-black"}`}>Files selected</span>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedFilePaths([])}
                  className={`shrink-0 gap-2 transition-colors ${isDark
                    ? "text-white/70 hover:text-white hover:bg-white/5"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                    }`}
                >
                  Clear
                </Button>

                <Button
                  variant="ghost"
                  onClick={selectAllVisibleFiles}
                  className={`shrink-0 gap-2 ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                >
                  <CheckSquare size={18} />
                  Select all
                </Button>

                <div className={`hidden sm:block h-6 w-[1px] mx-1 transition-colors ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                <Button
                  onClick={handleBatchDownload}
                  className={`shrink-0 gap-2 border transition-colors ${isDark
                    ? "bg-white/10 text-white border-white/10 hover:bg-white/20"
                    : "bg-black/[0.04] text-black border-black/5 hover:bg-black/[0.08]"
                    }`}
                >
                  <DownloadIcon size={18} />
                  Download
                </Button>

                <Button
                  onClick={() => {
                    if (!canDelete) return;
                    setIsDeleteModalOpen(true);
                  }}
                  disabled={!canDelete}
                  title={canDelete ? "Delete selected" : "Delete permission not allowed"}
                  className="shrink-0 bg-[#F04438] text-white hover:bg-[#d7372d] gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashIcon size={18} />
                  Delete
                </Button>
              </div>

              <button
                onClick={() => setSelectedFilePaths([])}
                className="shrink-0 text-white/40 hover:text-white"
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
          {isPreProduction ? (
            <Button
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="w-full bg-[#202020] text-white hover:bg-white/10 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              Create Folder
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
