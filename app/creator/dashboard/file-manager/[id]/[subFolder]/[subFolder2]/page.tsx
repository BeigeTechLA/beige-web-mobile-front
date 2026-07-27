"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";

import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderPlus,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  Plus,
  Play,
  Presentation,
  Search,
  Trash2,
  Upload,
  X as CloseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  slugToWorkspaceName,
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
  if (isImageFile(contentType, title)) return { icon: ImageIcon, label: "image", accentClass: "text-[#22C55E]" };
  if (isVideoFile(contentType, title)) return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]" };
  if (contentType === "application/pdf" || extension === "pdf") return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]" };
  if (["doc", "docx", "txt", "rtf"].includes(extension)) return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]" };
  if (["ppt", "pptx", "key"].includes(extension)) return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]" };
  if (["xls", "xlsx", "csv"].includes(extension)) return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]" };
  return { icon: FileText, label: extension || "file", accentClass: "text-white/80" };
};

export default function CreatorSubFolderDetailsPage() {
  const { canCreate: canCreateByPermission, canDelete: canDeleteByPermission } = usePermissions("file_manager");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string; subFolder2: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const nestedSlug = params.subFolder2;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);
  const isPhaseRoute = phaseSlug === "pre-production" || phaseSlug === "post-production";
  const isCommonEventRootFolder = isCommonEventWorkspace && !isPhaseRoute;
  const fileCardStage = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const { isDark } = useResolvedTheme();
  const routeStateKey = getFileManagerRouteStateKey(pathname);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [folders, setFolders] = useState<Array<Record<string, unknown>>>([]);
  const [files, setFiles] = useState<Array<Record<string, unknown>>>([]);
  const [revisionFiles, setRevisionFiles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode();
  const [isOpen, setIsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<Record<string, unknown> | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<Record<string, unknown> | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Record<string, unknown> | null>(null);
  const [shootDate, setShootDate] = useState<string | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedUploadVersion, setSelectedUploadVersion] = useState<number | null>(null);
  const [isCreatingRevisionVersion, setIsCreatingRevisionVersion] = useState(false);

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

  const currentFolderPath = useMemo(() => {
    const fromQuery = searchParams.get("path");
    return fromQuery ? decodeURIComponent(fromQuery) : slugToWorkspaceName(nestedSlug);
  }, [nestedSlug, searchParams]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        isCommonEventRootFolder ? undefined : phaseSlug === "post-production" ? "post" : "pre",
        currentFolderPath
      );
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setFolders(workspaceData.folders || []);
      setFiles(workspaceData.files);

      const normalizedPath = currentFolderPath.trim().toLowerCase().replace(/[_\s]+/g, "-");
      if (phaseSlug === "post-production" && normalizedPath.endsWith("selected-for-edits")) {
        try {
          const revisions = await fileManagerApi.getExternalWorkspaceFiles(projectId, "post", "Edits/Revisions");
          const nestedFiles = await Promise.all(
            (revisions.folders || []).map(async (folder) => {
              const versionPath = ["Edits/Revisions", folder.name].filter(Boolean).join("/");
              const versionData = await fileManagerApi.getExternalWorkspaceFiles(projectId, "post", versionPath);
              return versionData.files || [];
            })
          );
          setRevisionFiles(nestedFiles.flat() as unknown as Array<Record<string, unknown>>);
        } catch {
          setRevisionFiles([]);
        }
      } else {
        setRevisionFiles([]);
      }

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
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath, isCommonEventRootFolder, phaseSlug, projectId]);

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
  }, [loadFiles, projectId]);

  const folderTitle = useMemo(() => {
    const safePath = String(currentFolderPath || "").trim();
    if (!safePath) return "Files";
    const parts = safePath.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || safePath;
    return last
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }, [currentFolderPath]);

  const folderItems = useMemo(
    () =>
      (folders || []).map((folder) => {
        const folderName = String(folder?.name || "").trim();
        const nextPath = [currentFolderPath, folderName].filter(Boolean).join("/");
        return {
          id: String(folder?.path || nextPath || folderName),
          title: folderName || "Folder",
          fileCount: Number(folder?.fileCount || 0),
          lastOpened: String(folder?.updatedAt || folder?.createdAt || ""),
          category: String(folder?.folderType || "folder"),
          isLinked: true,
          userInitials: getDisplayInitials(folderName || "Folder"),
          resourcePath: String(folder?.path || nextPath),
          href: `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${String(folderName || "folder").toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
            nextPath
          )}`,
        };
      }),
    [currentFolderPath, folders, phaseSlug, projectId]
  );

  const folderFiles = useMemo(() => mapExternalFilesToUi(files as never[]), [files]);

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

  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folderItems;
    const query = searchTerm.toLowerCase();
    return folderItems.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderItems, searchTerm]);

  const isRevisionRootFolder = useMemo(() => {
    const normalized = currentFolderPath
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
    return phaseSlug === "post-production" && (normalized === "revisions" || normalized.endsWith("/revisions"));
  }, [currentFolderPath, phaseSlug]);

  const isRevisionVersionFolder = useMemo(() => {
    const normalized = currentFolderPath.trim();
    return phaseSlug === "post-production" && /(^|\/)Version\d+$/i.test(normalized);
  }, [currentFolderPath, phaseSlug]);

  const isSelectedForEditsFolder = useMemo(() => {
    const normalized = currentFolderPath
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
    return (
      phaseSlug === "post-production" &&
      (normalized === "selected-for-edits" || normalized.endsWith("/selected-for-edits"))
    );
  }, [currentFolderPath, phaseSlug]);

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
  }, [currentFolderPath, phaseSlug, projectId, searchTerm, folderFiles.length]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  }, [currentFolderPath, phaseSlug, projectId]);

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

  const handleOpenFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string" || typeof file.id !== "string") return;
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
    if (!(isCommonEventWorkspace || phaseSlug === "post-production")) {
      toast.error("Files can only be deleted in post-production for normal events.");
      return;
    }

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFolder = async (folder: Record<string, unknown> | null) => {
    const targetFolder = folder || selectedFolder;
    if (!targetFolder || typeof targetFolder.resourcePath !== "string") return;
    if (!isCommonEventWorkspace) {
      toast.error("Folders can only be deleted in common events.");
      return;
    }

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setSelectedFolder(null);
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await fileManagerApi.createExternalFolder(projectId, trimmed, {
        phase: isCommonEventRootFolder ? undefined : phaseSlug === "post-production" ? "post" : "pre",
        path: currentFolderPath,
      });
      toast.success("Folder created");
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
      throw err;
    }
  };

  const getVersionNumberFromPath = (path?: string) => {
    const match = String(path || "").match(/(?:^|\/)Version(\d+)(?:\/|$)/i);
    return match?.[1] ? Number(match[1]) : null;
  };

  const normalizeRevisionMatchKey = (value?: string) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getFileBaseName = (value?: string) => normalizeRevisionMatchKey(value).replace(/\.[^.]+$/, "");

  const getSelectedFileRevisionMatches = (file: Record<string, unknown>) => {
    const fileTitle = normalizeRevisionMatchKey(String(file.title || ""));
    const fileBaseName = getFileBaseName(String(file.title || ""));

    return revisionFiles
      .filter((revisionFile) => {
        const revisionName = normalizeRevisionMatchKey(String(revisionFile.name || revisionFile.title || ""));
        const revisionBaseName = getFileBaseName(String(revisionFile.name || revisionFile.title || ""));
        const metadata =
          revisionFile.metadata && typeof revisionFile.metadata === "object"
            ? (revisionFile.metadata as Record<string, unknown>)
            : {};
        const copiedFromName = normalizeRevisionMatchKey(String(metadata.copiedFrom || "").split("/").pop() || "");
        const copiedFromBaseName = getFileBaseName(copiedFromName);

        return (
          revisionName === fileTitle ||
          revisionBaseName === fileBaseName ||
          copiedFromName === fileTitle ||
          copiedFromBaseName === fileBaseName
        );
      })
      .map((revisionFile) => ({
        file: revisionFile,
        version:
          getVersionNumberFromPath(String(revisionFile.path || revisionFile.filepath || "")) ||
          Number((revisionFile.metadata as Record<string, unknown> | undefined)?.currentVersion || 0),
      }))
      .filter((item) => item.version > 0)
      .sort((a, b) => b.version - a.version);
  };

  const getSelectedFileRevisionState = (file: Record<string, unknown>) => {
    const matches = getSelectedFileRevisionMatches(file);
    const latest = matches[0];
    if (!latest) {
      return {
        currentVersion: 0,
        nextUploadVersion: 1,
        status: "pending" as const,
      };
    }

    const metadata =
      latest.file.metadata && typeof latest.file.metadata === "object"
        ? (latest.file.metadata as Record<string, unknown>)
        : {};
    const editStatus = String(metadata.editStatus || "").toLowerCase();

    if (editStatus === "approved") {
      return {
        currentVersion: latest.version,
        nextUploadVersion: null,
        status: "approved" as const,
      };
    }

    if (editStatus === "revision_requested") {
      const nextVersion = Number(metadata.requestedNextVersion || latest.version + 1);
      return {
        currentVersion: latest.version,
        nextUploadVersion: nextVersion,
        status: "revision_requested" as const,
      };
    }

    return {
      currentVersion: latest.version,
      nextUploadVersion: null,
      status: "uploaded" as const,
    };
  };

  const getSelectedFileStatusBadge = (file: Record<string, unknown>) => {
    if (isRevisionVersionFolder) {
      const metadata =
        file.metadata && typeof file.metadata === "object"
          ? (file.metadata as Record<string, unknown>)
          : {};
      const editStatus = String(metadata.editStatus || "").toLowerCase();
      const currentVersion =
        getVersionNumberFromPath(String(file.filepath || "")) ||
        Number(metadata.currentVersion || 0);

      if (editStatus === "approved") {
        return {
          label: "Approved",
          versionLabel: currentVersion ? `V${currentVersion} Latest` : "Approved",
          className: "border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]",
          versionClassName: "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#86EFAC]",
        };
      }

      if (editStatus === "revision_requested") {
        return {
          label: "Revision Requested",
          versionLabel: currentVersion ? `V${currentVersion} Latest` : "Revision Latest",
          className: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]",
          versionClassName: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#F2E4C8]",
        };
      }

      if (currentVersion) {
        return {
          label: `Version${currentVersion} Uploaded`,
          versionLabel: `V${currentVersion} Latest`,
          className: "border-[#7C3AED]/30 bg-[#7C3AED]/15 text-[#C4B5FD]",
          versionClassName: "border-[#7C3AED]/30 bg-[#7C3AED]/15 text-[#C4B5FD]",
        };
      }
    }

    if (!isSelectedForEditsFolder) {
      return null;
    }

    const revisionState = getSelectedFileRevisionState(file);
    if (revisionState.status === "pending") {
      return {
        label: "Version1 Pending",
        versionLabel: "V1 Pending",
        className: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]",
        versionClassName: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#F2E4C8]",
      };
    }

    if (revisionState.status === "approved") {
      return {
        label: `Version${revisionState.currentVersion} Approved`,
        versionLabel: `V${revisionState.currentVersion} Latest`,
        className: "border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]",
        versionClassName: "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#86EFAC]",
      };
    }

    if (revisionState.status === "revision_requested") {
      return {
        label: "Revision Requested",
        versionLabel: `V${revisionState.currentVersion} Latest`,
        className: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]",
        versionClassName: "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#F2E4C8]",
      };
    }

    return {
      label: `Version${revisionState.currentVersion} Uploaded`,
      versionLabel: `V${revisionState.currentVersion} Latest`,
      className: "border-[#7C3AED]/30 bg-[#7C3AED]/15 text-[#C4B5FD]",
      versionClassName: "border-[#7C3AED]/30 bg-[#7C3AED]/15 text-[#C4B5FD]",
    };
  };

  const pendingSelectedFiles = isSelectedForEditsFolder
    ? folderFiles.filter((file) => getSelectedFileRevisionState(file as unknown as Record<string, unknown>).nextUploadVersion)
    : [];
  const nextRevisionFolderVersion = useMemo(() => {
    const versionNumbers = folderItems
      .map((folder) => {
        const normalizedTitle = folder.title.trim().replace(/\s+/g, "");
        const titleMatch = normalizedTitle.match(/^Version(\d+)$/i);
        return titleMatch?.[1]
          ? Number(titleMatch[1])
          : getVersionNumberFromPath(folder.resourcePath || folder.id);
      })
      .filter((version): version is number => Number.isFinite(version) && version > 0);

    return (versionNumbers.length ? Math.max(...versionNumbers) : 0) + 1;
  }, [folderItems]);
  const nextSelectedEditsUploadVersion = pendingSelectedFiles[0]
    ? getSelectedFileRevisionState(pendingSelectedFiles[0] as unknown as Record<string, unknown>).nextUploadVersion || 1
    : 1;
  const nextBulkUploadVersion = isRevisionRootFolder ? nextRevisionFolderVersion : nextSelectedEditsUploadVersion;

  const canUpload = isCommonEventWorkspace || (phaseSlug === "post-production" && isOnOrAfterShootDay(shootDate));
  const showUploadLockBanner = !isCommonEventWorkspace && phaseSlug === "post-production" && !canUpload;
  const canDeleteFolders = isCommonEventWorkspace;
  const canDeleteFiles = isCommonEventWorkspace || phaseSlug === "post-production";
  const uploadFolderPath = useMemo(() => {
    if (!canUpload || !workspaceName) return undefined;
    const versionToUpload = selectedUploadVersion || nextBulkUploadVersion || 1;
    let targetPath = currentFolderPath;
    if (isRevisionRootFolder) {
      targetPath = `${currentFolderPath.replace(/\/+$/, "")}/Version${versionToUpload}`;
    } else if (isSelectedForEditsFolder) {
      const editRoot = currentFolderPath
        .split("/")
        .filter(Boolean)
        .slice(0, -1)
        .join("/");
      targetPath = `${editRoot || "Edits"}/Revisions/Version${versionToUpload}`;
    }
    if (isCommonEventWorkspace) {
      return `${workspaceName}/${targetPath}`;
    }
    const phaseFolder = phaseSlug === "post-production" ? "Post-Production" : "Pre-Production";
    return `${workspaceName}/${phaseFolder}/${targetPath}`;
  }, [
    canUpload,
    currentFolderPath,
    isCommonEventWorkspace,
    isRevisionRootFolder,
    isSelectedForEditsFolder,
    nextBulkUploadVersion,
    phaseSlug,
    selectedUploadVersion,
    workspaceName,
  ]);

  const uploadModalVersion = selectedUploadVersion || nextBulkUploadVersion || 1;
  const canUploadSelectedEdits = !isSelectedForEditsFolder || pendingSelectedFiles.length > 0;
  const openUploadModalForVersion = (version?: number | null) => {
    setSelectedUploadVersion(version || null);
    setIsUploadModalOpen(true);
  };
  const hasVisibleFoldersOrVersionCreate = filteredFolders.length > 0 || (isRevisionRootFolder && canUpload);
  const showHeaderUploadButton = canUpload && !isRevisionRootFolder && canUploadSelectedEdits;

  const handleCreateRevisionVersion = async () => {
    if (!isRevisionRootFolder || !canUpload || isCreatingRevisionVersion) return;

    const versionNumber = nextRevisionFolderVersion;
    const versionName = `Version${versionNumber}`;
    const versionPath = [currentFolderPath, versionName].filter(Boolean).join("/");
    const versionHref = `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${versionName.toLowerCase()}?path=${encodeURIComponent(
      versionPath
    )}`;

    try {
      setIsCreatingRevisionVersion(true);
      await fileManagerApi.createExternalFolder(projectId, versionName, {
        phase: "post",
        path: currentFolderPath,
      });
      toast.success(`${versionName} created`);
      await loadFiles();
      router.push(versionHref);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to create ${versionName}`);
    } finally {
      setIsCreatingRevisionVersion(false);
    }
  };
  const allVisibleFilesSelected =
    visibleFiles.length > 0 &&
    visibleFiles.every((file) => selectedFilePaths.includes(file.filepath || ""));
  const someVisibleFilesSelected =
    visibleFiles.some((file) => selectedFilePaths.includes(file.filepath || "")) &&
    !allVisibleFilesSelected;
  const selectionLockActive = isSelectionMode || selectedFilePaths.length > 0;

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
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete files");
    } finally {
      setIsDeleting(false);
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
                  className={`cursor-pointer items-center transition-colors border-b last:border-0 ${selectionLockActive ? "cursor-default" : isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"} ${isDark ? "border-white/5" : "border-black/5"} ${isSelectionMode && isSelected
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
                        <Download size={16} />
                      </button>
                      {canDeleteFiles ? (
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
                          <Trash2 size={16} />
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
        {canUpload ? (
          <div className="flex items-center gap-2">
            {isCommonEventWorkspace ? (
              <Button
                onClick={() => setIsCreateFolderModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-[#202020] px-3 text-white hover:bg-white/10 lg:h-10 lg:px-6"
              >
                <FolderPlus size={18} />
                Create Folder
              </Button>
            ) : null}
            {showHeaderUploadButton ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  openUploadModalForVersion(isSelectedForEditsFolder || isRevisionRootFolder ? uploadModalVersion : null);
                }}
                disabled={selectionLockActive}
                className="flex items-center gap-2 rounded-lg bg-[#E8D0AA] px-3 text-black hover:bg-[#D4C3A3] lg:h-10 lg:px-6"
              >
                <Upload size={18} />
                {isSelectedForEditsFolder || isRevisionRootFolder ? `Upload Version${uploadModalVersion} Files` : "Upload Files"}
              </Button>
            ) : null}
          </div>
        ) : null}
      />
      <div className="overflow-x-hidden overflow-y-auto p-4 pb-24 lg:px-10 lg:py-9">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}
          >
            <ArrowLeft size={24} />
            <span className="text-sm font-medium">Back</span>
          </Button>

          {/* {canUpload ? (
            <div className="flex items-center gap-2">
              {isCommonEventWorkspace ? (
                <Button
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-[#202020] px-3 text-white hover:bg-white/10 lg:h-10 lg:px-6"
                >
                  <FolderPlus size={18} />
                  Create Folder
                </Button>
              ) : null}
              {showHeaderUploadButton ? (
                <Button
                  onClick={() => {
                    if (selectionLockActive) return;
                    openUploadModalForVersion(isSelectedForEditsFolder || isRevisionRootFolder ? uploadModalVersion : null);
                  }}
                  disabled={selectionLockActive}
                  className="flex items-center gap-2 rounded-lg bg-[#E8D0AA] px-3 text-black hover:bg-[#D4C3A3] lg:h-10 lg:px-6"
                >
                  <Upload size={18} />
                  {isSelectedForEditsFolder || isRevisionRootFolder ? `Upload Version${uploadModalVersion} Files` : "Upload Files"}
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
                  <h1 className="break-words text-sm font-semibold leading-[32px] lg:text-2xl">
                    {folderTitle} ({filteredData.length} Items)
                  </h1>
                  <div className="flex flex-col items-start justify-between gap-2 rounded-lg lg:flex-row lg:items-center">
                    <div>
                      <p className="text-sm lg:text-base">Project: {workspaceName}</p>
                      <p className="hidden text-sm text-[#D0D0D0] lg:block">
                        <span className={isDark ? "text-[#AAA7A7]" : "text-gray-400"}>Project Code: </span>
                        {workspaceCode}
                      </p>
                      {/* {workspaceConsoleUrl ? (
                  <a
                    href={workspaceConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-[#E8D1AB] underline underline-offset-4"
                  >
                    Open Storage Folder
                  </a>
                ) : null} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !error ? (
          <div>
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
                      <span className={`font-medium transition-colors ${isDark ? "text-[#F2E4C8]" : "text-[#7A6444]"}`}>{formattedShootDate}</span>. You can review folders and existing files now.
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
                  placeholder="Search folders or files..."
                  value={searchTerm}
                  className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                    ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                    : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                    }`}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {filteredData.length > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const nextMode = !isSelectionMode;
                      setIsSelectionMode(nextMode);
                      if (!nextMode) setSelectedFilePaths([]);
                    }}
                    className={`gap-2 h-12 p-4 rounded-xl border transition-all ${isSelectionMode
                      ? "bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90"
                      : isDark ? "bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20" : "bg-white text-black/70 border-[#E5E5E5] hover:text-black hover:border-[#cbb38b] hover:bg-[#F8F8F8]"
                      }`}
                  >
                    <CheckSquare size={18} />
                    <span>{isSelectionMode ? "Cancel" : "Select"}</span>
                  </Button>
                ) : null}
                {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
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

            {filteredFolders.length > 0 ? (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      title={folder.title}
                      fileCount={folder.fileCount}
                      lastOpened={folder.lastOpened || "recently"}
                      category={folder.category}
                      isLinked={folder.isLinked}
                      userInitials={folder.userInitials}
                      onOpenLinkModal={() => undefined}
                      href={folder.href}
                      onShare={() => {
                        setShareResource({
                          resourceType: "folder",
                          externalId: String(projectId || ""),
                          phase: isCommonEventRootFolder ? undefined : phaseSlug === "post-production" ? "post" : "pre",
                          path: String(folder.resourcePath || ""),
                          label: folder.title,
                        });
                        setIsShareModalOpen(true);
                      }}
                      onDelete={
                        canDeleteFolders
                          ? () => {
                            setSelectedFolder(folder as unknown as Record<string, unknown>);
                            setSelectedFile(null);
                            setIsDeleteModalOpen(true);
                          }
                          : undefined
                      }
                    />
                  ))}
                  {isRevisionRootFolder && canUpload ? (
                    <button
                      type="button"
                      onClick={handleCreateRevisionVersion}
                      disabled={isCreatingRevisionVersion}
                      className={`flex min-h-[202px] w-full flex-col items-center justify-center gap-5 rounded-3xl border border-dashed p-5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-70 lg:max-w-[350px] ${isDark
                        ? "border-[#E8D1AB]/35 bg-[#18181b] hover:border-[#E8D1AB]/60 hover:bg-[#1c1c20]"
                        : "border-[#cbb38b]/40 bg-neutral-50 hover:border-[#cbb38b]/70 hover:bg-neutral-100/70"
                        }`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isDark
                        ? "border-[#E8D1AB]/50 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                        : "border-[#cbb38b]/50 bg-[#cbb38b]/10 text-[#cbb38b]"
                        }`}>
                        {isCreatingRevisionVersion ? <Loader2 size={22} className="animate-spin" /> : <Plus size={24} />}
                      </span>
                      <span className={`text-sm font-semibold transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"
                        }`}>
                        {isCreatingRevisionVersion ? "Creating..." : `Create Version ${nextRevisionFolderVersion}`}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {filteredFolders.length === 0 && isRevisionRootFolder && canUpload ? (
              <div className="mb-6">
                <h3 className={`mb-3 text-sm font-semibold transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}`}>
                  Folders
                </h3>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={handleCreateRevisionVersion}
                    disabled={isCreatingRevisionVersion}
                    className={`flex min-h-[202px] w-full flex-col items-center justify-center gap-5 rounded-3xl border border-dashed p-5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-70 lg:max-w-[350px] ${isDark
                      ? "border-[#E8D1AB]/35 bg-[#18181b] hover:border-[#E8D1AB]/60 hover:bg-[#1c1c20]"
                      : "border-[#cbb38b]/40 bg-neutral-50 hover:border-[#cbb38b]/70 hover:bg-neutral-100/70"
                      }`}
                  >
                    {/* Icon Wrapper Container */}
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isDark ? "border-[#E8D1AB]/50 bg-[#E8D1AB]/10 text-[#E8D1AB]" : "border-[#cbb38b]/50 bg-[#cbb38b]/10 text-[#cbb38b]"}`}>
                      {isCreatingRevisionVersion ? <Loader2 size={22} className="animate-spin" /> : <Plus size={24} />}
                    </span>

                    {/* Label Text Description */}
                    <span className={`text-sm font-semibold transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}`}>
                      {isCreatingRevisionVersion ? "Creating..." : "Create Version 1"}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {viewMode === "grid" ? (
              filteredData.length === 0 ? (
                hasVisibleFoldersOrVersionCreate ? null : (
                  <EmptyFileState
                    onAction={showHeaderUploadButton ? () => setIsUploadModalOpen(true) : undefined}
                    actionLabel={showHeaderUploadButton ? "Upload Files" : undefined}
                    isDark={isDark}
                  />
                )
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {visibleFiles.map((file) => {
                      const statusBadge = getSelectedFileStatusBadge(file as unknown as Record<string, unknown>);
                      const revisionState = getSelectedFileRevisionState(file as unknown as Record<string, unknown>);
                      return (
                        <FileCard
                          key={file.id}
                          file={{
                            ...file,
                            previewUrl: previewUrls[file.id],
                            statusLabel: statusBadge?.label,
                            statusClassName: statusBadge?.className,
                            versionLabel: statusBadge?.versionLabel,
                            versionClassName: statusBadge?.versionClassName,
                          }}
                          stage={fileCardStage}
                          onOpen={selectionLockActive ? undefined : () => handleOpenFile(file as unknown as Record<string, unknown>)}
                          onDownload={selectionLockActive ? undefined : () => handleDownloadFile(file as unknown as Record<string, unknown>)}
                          onUploadEdited={
                            !selectionLockActive && isSelectedForEditsFolder && revisionState.nextUploadVersion
                              ? () => openUploadModalForVersion(revisionState.nextUploadVersion)
                              : undefined
                          }
                          onDelete={
                            !selectionLockActive && canDeleteFiles
                              ? () => {
                                setSelectedFile(file as unknown as Record<string, unknown>);
                                setIsDeleteModalOpen(true);
                              }
                              : undefined
                          }
                          isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                          onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                          isDark={isDark}
                        />
                      );
                    })}
                  </div>
                  {hasMoreFiles ? (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        className={`transition-colors rounded-lg ${isDark ? "border-white/20 bg-[#202020] text-white hover:bg-white/10" : "border-black/10 bg-white text-black hover:bg-black/5"}`}
                        onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                      >
                        View More
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            ) : filteredData.length === 0 ? (
              hasVisibleFoldersOrVersionCreate ? null : (
                <EmptyFileState
                  onAction={showHeaderUploadButton ? () => setIsUploadModalOpen(true) : undefined}
                  actionLabel={showHeaderUploadButton ? "Upload Files" : undefined}
                  isDark={isDark}
                />
              )
            ) : (
              renderFilesTable()
            )}
          </div>
        ) : null}

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedUploadVersion(null);
          }}
          folderName={
            isSelectedForEditsFolder || isRevisionRootFolder
              ? `Version${uploadModalVersion}`
              : folderTitle
          }
          uploadPath={
            uploadFolderPath ??
            (canUpload && workspaceName
              ? isCommonEventRootFolder
                ? `${workspaceName}/${currentFolderPath}`
                : `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"
                }/${currentFolderPath}`
              : undefined)
          }
          onUploadComplete={async () => {
            await loadFiles();
            setSelectedUploadVersion(null);
          }}
          isDark={isDark}
        />

        <CreateFolderModal
          isOpen={isCreateFolderModalOpen}
          onClose={() => setIsCreateFolderModalOpen(false)}
          onCreate={handleCreateFolder}
          title="Create Client Folder"
          description={`Create folder inside ${folderTitle}`}
          isDark={isDark}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (selectedFilePaths.length > 0) return handleBatchDelete();
            if (selectedFile) return handleDeleteFile(selectedFile);
            return handleDeleteFolder(selectedFolder);
          }}
          itemName={
            selectedFilePaths.length > 0
              ? `${selectedFilePaths.length} selected files`
              : typeof selectedFile?.title === "string"
                ? selectedFile.title
                : typeof selectedFolder?.title === "string"
                  ? selectedFolder.title
                  : "this item"
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
          fileName={typeof viewerFile?.title === "string" ? viewerFile.title : undefined}
          fileUrl={viewerUrl}
          contentType={typeof viewerFile?.contentType === "string" ? viewerFile.contentType : undefined}
          fileMetaId={typeof viewerFile?.filepath === "string" ? viewerFile.filepath : null}
          isDark={isDark}
        />

        {selectedFilePaths.length > 0 ? (
          <div className="fixed bottom-6 left-1/2 z-[100] w-full max-w-xl -translate-x-1/2 px-4 lg:bottom-10">
            <div className={`relative flex flex-col gap-4 rounded-2xl border p-4 shadow-2xl transition-all lg:flex-row lg:items-center lg:justify-between lg:gap-2 ${isDark
              ? "border-[#E8D1AB]/50 bg-[#171717]"
              : "border-[#cbb38b]/50 bg-white"
              }`}>

              {/* Left Info Section */}
              <div className="flex items-center gap-3 pr-8 lg:pr-0">
                {/* Selected Items Counter Badge */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${isDark
                  ? "bg-[#E8D1AB] text-black"
                  : "bg-[#cbb38b] text-white"
                  }`}>
                  {selectedFilePaths.length}
                </div>
                <span className={`font-medium text-sm lg:text-base transition-colors ${isDark ? "text-white" : "text-black"}`}>
                  Files selected
                </span>
                {/* Clear Button */}
                <Button
                  variant="ghost"
                  className={`text-xs lg:text-sm h-9 lg:h-10 transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
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
                  className={`text-xs lg:text-sm h-9 lg:h-10 gap-2 transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
                    }`}
                  onClick={() => {
                    const allVisible = visibleFiles.map((file) => file.filepath || "").filter(Boolean);
                    setSelectedFilePaths(Array.from(new Set(allVisible)));
                    setIsSelectionMode(true);
                  }}
                >
                  <CheckSquare size={16} />
                  Select all
                </Button>
              </div>

              {/* Right Action Trigger Group */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
                {/* Vertical Divider (Hidden on small screens where buttons break lines) */}
                <div className={`hidden lg:block mx-1 h-6 w-[1px] transition-colors ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                {/* Action Buttons Container */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  {/* Batch Download Button */}
                  <Button
                    className={`flex-1 lg:flex-none gap-2 border text-xs lg:text-sm h-9 lg:h-10 transition-colors ${isDark
                      ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                      : "border-black/10 bg-black/5 text-black hover:bg-black/10"
                      }`}
                    onClick={handleBatchDownload}
                  >
                    <Download size={16} className="lg:size-[18px]" />
                    Download
                  </Button>

                  {/* Batch Delete Button */}
                  {canDeleteFiles ? (
                    <Button
                      className={`flex-1 lg:flex-none gap-2 text-xs lg:text-sm h-9 lg:h-10 transition-colors ${isDark
                        ? "bg-[#F04438] text-white hover:bg-[#F04438]/90"
                        : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      <Trash2 size={16} className="lg:size-[18px]" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Absolute Escape Close Cross (Pinned to top corner on tiny viewports) */}
              <button
                onClick={() => {
                  setSelectedFilePaths([]);
                  setIsSelectionMode(false);
                }}
                className={`absolute top-4 right-4 lg:static transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>
        ) : null}

        {/* --- FLOATING MOBILE BUTTON --- */}
        {canUpload ? (
          <div className={`lg:hidden w-full fixed flex gap-2 items-center justify-center bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
            {isCommonEventWorkspace ? (
              <Button
                onClick={() => setIsCreateFolderModalOpen(true)}
                className="flex items-center gap-2 w-full rounded-lg border border-white/20 bg-[#202020] px-3 text-white hover:bg-white/10 lg:h-10 lg:px-6"
              >
                <FolderPlus size={18} />
                Create Folder
              </Button>
            ) : null}
            {showHeaderUploadButton ? (
              <Button
                onClick={() => {
                  if (selectionLockActive) return;
                  openUploadModalForVersion(isSelectedForEditsFolder || isRevisionRootFolder ? uploadModalVersion : null);
                }}
                disabled={selectionLockActive}
                className="flex items-center gap-2 w-full rounded-lg bg-[#E8D0AA] px-3 text-black hover:bg-[#D4C3A3] lg:h-10 lg:px-6"
              >
                <Upload size={18} />
                {isSelectedForEditsFolder || isRevisionRootFolder ? `Upload Version${uploadModalVersion} Files` : "Upload Files"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
