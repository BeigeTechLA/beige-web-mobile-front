"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Camera,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  Download,
  ExternalLink,
  FolderOpen,
  Grid3X3,
  History,
  Link,
  LinkIcon,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  SendHorizontal,
  Share2,
  Upload,
  X as CloseIcon,
} from "lucide-react";
import { useViewMode } from "@/hooks/useViewMode";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { affiliateApi } from "@/lib/api";
import {
  fileManagerApi,
  inferWorkspaceCategory,
  isCommonEventWorkspaceId,
  isRecentWithinHours,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";

interface WorkspaceCard {
  externalId: string;
  title: string;
  fileCount: number;
  lastOpened: string;
  userInitials: string;
  category: string;
  updatedAtRaw?: string;
  consoleUrl?: string | null;
}

interface BrowserFolder {
  name: string;
  title: string;
  fileCount: number;
  lastOpened: string;
}

interface BrowserFile {
  id: string;
  title: string;
  filepath: string;
  contentType?: string;
  lastOpened: string;
  userInitials: string;
  uploadedBy?: string;
  uploadedAt?: string;
  size?: number;
}

interface FaceMatchItem {
  path: string;
  score: number;
  confidence: number;
  url?: string;
}

interface ProjectLite {
  project_name?: string;
  stream_project_booking_id?: string | number;
  booking_id?: string | number;
}
const FILES_PAGE_SIZE = 20;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const prettifyFolderName = (name?: string) => {
  const normalized = String(name || "").trim();
  if (!normalized) return "Folder";
  if (normalized === "Pre-Production") return "Pre Production";
  if (normalized === "Post-Production") return "Post Production";
  if (normalized === "Raw Footage") return "Raw Footages";
  return normalized.replace(/-/g, " ");
};

const isRawFootagePath = (path?: string) => {
  const lastSegment = String(path || "")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.toLowerCase()
    .replace(/[\s_-]+/g, "");

  return lastSegment === "rawfootage" || lastSegment === "rawfootages";
};

const normalizePathToken = (value?: string) =>
  String(value || "").toLowerCase().replace(/[\s_-]+/g, "");

const isSelectedForEditsPath = (path?: string) =>
  normalizePathToken(path) === "editedfootage/selectedforedits" ||
  normalizePathToken(path) === "editedfootages/selectedforedits";

const isFinalDeliverablesPath = (path?: string) =>
  normalizePathToken(path) === "finaldeliverables";

const isVersionFolderName = (name?: string) =>
  /^v(?:ersion)?[\s_-]*\d+$/i.test(String(name || "").trim());

const getFinalDeliverablesVersionPath = (folder: { name?: string; path?: string }) => {
  const normalizedPath = String(folder?.path || "").replace(/\\/g, "/");
  const finalDeliverablesMatch = normalizedPath.match(/(?:^|\/)(Final Deliverables\/.+)$/i);
  if (finalDeliverablesMatch?.[1]) return finalDeliverablesMatch[1];
  return `Final Deliverables/${folder.name || ""}`;
};

const getRevisionVersionFromPath = (path?: string) => {
  const match = String(path || "").match(/revisions\/version\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const getFileExtension = (title?: string) => {
  const parts = String(title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const isPreviewableFile = (file: BrowserFile) => {
  const extension = getFileExtension(file.title);
  const contentType = String(file.contentType || "");
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif", "mp4", "mov", "avi", "mkv", "webm"].includes(extension)
  );
};

const getInitials = (name?: string | null) => {
  if (!name) return "FM";
  return (
    name
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "FM"
  );
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
};

const formatShortDateTime = (value?: string) => {
  if (!value) return "10 Jan, 2026 - 10:00 AM";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "10 Jan, 2026 - 10:00 AM";
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatFileSize = (size?: number) => {
  if (!size || Number.isNaN(size)) return "4.5 MB";
  const mb = size / (1024 * 1024);
  return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(1)} MB`;
};

export default function AffiliateFileManager() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const status = "";
  const [viewMode, setViewMode] = useViewMode();

  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceCard[]>([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceCard | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<BrowserFolder[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<"pre" | "post" | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [phaseFolders, setPhaseFolders] = useState<BrowserFolder[]>([]);
  const [phaseFiles, setPhaseFiles] = useState<BrowserFile[]>([]);
  const [isPhaseLoading, setIsPhaseLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [selectedEditFiles, setSelectedEditFiles] = useState<BrowserFile[]>([]);
  const [selectedForEditsCount, setSelectedForEditsCount] = useState(0);
  const [revisionVersionCounts, setRevisionVersionCounts] = useState<Record<number, number>>({});
  const rawFootageSnapshotRef = useRef<BrowserFile[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isSendingForEdits, setIsSendingForEdits] = useState(false);
  const [isApprovingFiles, setIsApprovingFiles] = useState(false);
  const [showEditsSuccess, setShowEditsSuccess] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<BrowserFile | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceMatches, setFaceMatches] = useState<FaceMatchItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraProcessing, setIsCameraProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const loadRoot = async () => {
    const token = Cookies.get("revure_token");
    if (!token) {
      setError("Please log in to view your files.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [shootsResponse, externalWorkspaces] = await Promise.all([
        affiliateApi.getMyShoots(token, { range: "all" }),
        fileManagerApi.listExternalWorkspaces(),
      ]);

      const projects = Array.isArray(shootsResponse?.data?.projects)
        ? shootsResponse.data.projects
        : [];
      const projectMap = new Map<string, ProjectLite>();

      projects.forEach((item: unknown) => {
        const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        const nestedProject =
          row.project && typeof row.project === "object"
            ? (row.project as ProjectLite)
            : null;
        const project = nestedProject || (row as ProjectLite);
        const bookingId = String(
          project?.stream_project_booking_id || project?.booking_id || ""
        );
        if (bookingId) {
          projectMap.set(bookingId, project);
        }
      });

      const mapped = externalWorkspaces
        .filter((workspace) =>
          isCommonEventWorkspaceId(workspace.externalId) ||
          projectMap.has(String(workspace.externalId))
        )
        .map((workspace) => {
          const project = projectMap.get(String(workspace.externalId));
          return {
            externalId: String(workspace.externalId),
            title: workspace.folderName || project?.project_name || "Common Event",
            fileCount: Number(workspace.fileCount || 0),
            lastOpened: workspace.updatedAt || workspace.createdAt || "",
            userInitials: getInitials(workspace.folderName || project?.project_name),
            category: inferWorkspaceCategory(
              workspace.folderName || project?.project_name
            ),
            updatedAtRaw: workspace.updatedAt || workspace.createdAt || "",
            consoleUrl: workspace.consoleUrl,
          };
        });

      setWorkspaces(mapped);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load your file manager"));
    } finally {
      setLoading(false);
    }
  };

  const loadPhase = useCallback(async (
    workspace: WorkspaceCard,
    phase: "pre" | "post",
    path = ""
  ) => {
    try {
      setIsPhaseLoading(true);
      setError(null);
      const shouldLoadSelectedForEditsFiles = phase === "post" && isSelectedForEditsPath(path);
      const revisionVersion = phase === "post" ? getRevisionVersionFromPath(path) : null;
      const candidatePaths =
        phase === "post" && isRawFootagePath(path)
          ? Array.from(new Set([path, "Raw Footages", "Raw Footage"].filter(Boolean)))
          : shouldLoadSelectedForEditsFiles
            ? Array.from(
                new Set(
                  [
                    path,
                    "Edited Footage/Selected for Edits",
                    "Edited Footages/Selected for Edits",
                    "Edited Footage/Selected For Edits",
                    "Edited Footages/Selected For Edits",
                    "Selected for Edits",
                    "Selected For Edits",
                    "Edited Footage",
                    "Edited Footages",
                  ].filter(Boolean)
                )
              )
          : revisionVersion
            ? Array.from(
                new Set(
                  revisionVersion <= 1
                    ? [
                        "Edited Footage",
                        "Edited Footages",
                      ].filter(Boolean)
                    : [
                        `Edited Footage/V${revisionVersion}`,
                        `Edited Footages/V${revisionVersion}`,
                      ].filter(Boolean)
                )
              )
          : [path];

      let response = await fileManagerApi.getExternalWorkspaceFiles(
        workspace.externalId,
        phase,
        candidatePaths[0] || undefined
      );

      for (const candidatePath of candidatePaths.slice(1)) {
        if (
          (response.files || []).length > 0 ||
          (!shouldLoadSelectedForEditsFiles && (response.folders || []).length > 0)
        ) break;
        response = await fileManagerApi.getExternalWorkspaceFiles(
          workspace.externalId,
          phase,
          candidatePath || undefined
        );
      }

      let nextFolders = response.folders || [];
      let nextFiles = response.files || [];

      if (phase === "post" && isFinalDeliverablesPath(path)) {
        const versionFolders = nextFolders.filter((folder) => isVersionFolderName(folder?.name));
        if (versionFolders.length > 0) {
          const versionFileGroups = await Promise.all(
            versionFolders.map((folder) =>
              fileManagerApi
                .getExternalWorkspaceFiles(workspace.externalId, phase, getFinalDeliverablesVersionPath(folder))
                .then((data) => data.files || [])
                .catch(() => [])
            )
          );
          nextFiles = [...nextFiles, ...versionFileGroups.flat()];
          nextFolders = nextFolders.filter((folder) => !isVersionFolderName(folder?.name));
        }
      }

      setPhaseFolders(
        nextFolders.map((folder) => ({
          name: folder.name,
          title: prettifyFolderName(folder.name),
          fileCount: Number(folder.fileCount || 0),
          lastOpened: folder.updatedAt || folder.createdAt || "",
        }))
      );

      const mappedFiles = nextFiles.map((file) => ({
          id: file.id,
          title: file.name,
          filepath: file.path,
          contentType: file.contentType,
          lastOpened: file.updatedAt || file.createdAt || "",
          userInitials: getInitials(
            file.uploadedByName || file.uploadedBy || file.uploaded_by?.name || file.name
          ),
          uploadedBy:
            file.uploadedByName ||
            file.uploadedBy ||
            file.uploaded_by?.name ||
            workspace.title ||
            "Unknown",
          uploadedAt: file.updatedAt || file.createdAt || "",
          size: file.size,
        }));

      const shouldKeepRawSnapshot =
        phase === "post" &&
        isRawFootagePath(path) &&
        mappedFiles.length === 0 &&
        rawFootageSnapshotRef.current.length > 0;

      setPhaseFiles(shouldKeepRawSnapshot ? rawFootageSnapshotRef.current : mappedFiles);
      if (phase === "post" && isRawFootagePath(path) && mappedFiles.length > 0) {
        rawFootageSnapshotRef.current = mappedFiles;
      }

      if (phase === "post" && normalizePathToken(path).startsWith("editedfootage")) {
        const [selectedData, revisionRootData] = await Promise.all([
          fileManagerApi.getExternalWorkspaceFiles(workspace.externalId, phase, "Edited Footage/Selected for Edits").catch(() => null),
          fileManagerApi.getExternalWorkspaceFiles(workspace.externalId, phase, "Edited Footage").catch(() => null),
        ]);

        setSelectedForEditsCount(selectedData?.files?.length || revisionRootData?.files?.length || 0);

        const nextVersionCounts: Record<number, number> = {
          1: revisionRootData?.files?.length || 0,
        };
        const versionFolders = (revisionRootData?.folders || []).filter((folder) =>
          /^V\d+$/i.test(String(folder?.name || ""))
        );
        const versionCountEntries = await Promise.all(
          versionFolders.map(async (folder) => {
            const version = Number(String(folder.name).replace(/\D/g, ""));
            if (version <= 1) return null;
            const versionData = await fileManagerApi
              .getExternalWorkspaceFiles(workspace.externalId, phase, `Edited Footage/V${version}`)
              .catch(() => null);
            return [version, versionData?.files?.length ?? Number(folder.fileCount || 0)] as const;
          })
        );
        versionCountEntries.forEach((entry) => {
          if (!entry) return;
          const [version, count] = entry;
          nextVersionCounts[version] = count;
        });
        setRevisionVersionCounts(nextVersionCounts);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load folder contents"));
    } finally {
      setIsPhaseLoading(false);
    }
  }, []);

  const openWorkspace = async (workspace: WorkspaceCard) => {
    try {
      setIsPhaseLoading(true);
      setFaceMatches([]);
      setSelectedWorkspace(workspace);
      setSelectedPhase(null);
      setSelectedPath("");
      setSearchTerm("");
      const response = await fileManagerApi.getExternalWorkspace(workspace.externalId);
      setWorkspaceFolders(
        (response.folders || []).map((folder) => ({
          name: folder.name,
          title: prettifyFolderName(folder.name),
          fileCount: Number(folder.fileCount || 0),
          lastOpened: folder.updatedAt || folder.createdAt || "",
        }))
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load workspace"));
    } finally {
      setIsPhaseLoading(false);
    }
  };

  useEffect(() => {
    loadRoot();
  }, []);

  useEffect(() => {
    if (selectedWorkspace && selectedPhase) {
      loadPhase(selectedWorkspace, selectedPhase, selectedPath);
    }
  }, [loadPhase, selectedWorkspace, selectedPhase, selectedPath]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  }, [selectedWorkspace?.externalId, selectedPhase, selectedPath]);

  useEffect(() => {
    const previewableFiles = phaseFiles
      .slice(0, visibleFileCount)
      .filter((file) => file.filepath && isPreviewableFile(file));

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
  }, [phaseFiles, visibleFileCount]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isCameraOpen) return;
    if (!cameraStreamRef.current || !videoRef.current) return;

    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => {
      // Ignore autoplay issues; user can retry/capture after interaction.
    });
  }, [isCameraOpen]);

  useEffect(() => () => {
    stopCamera();
  }, [stopCamera]);

  const handleOpenFile = async (file: BrowserFile) => {
    setViewerFile(file);
    setViewerOpen(true);
    setViewerName(file.title);
    setViewerType(file.contentType || "");

    const cachedPreviewUrl = previewUrls[file.id];
    if (cachedPreviewUrl) {
      setViewerUrl(cachedPreviewUrl);
      return;
    }

    setViewerUrl(null);
    try {
      const response = await fileManagerApi.getExternalFileViewUrl(file.filepath, {
        silent: true,
      });
      setViewerUrl(response.url || null);
    } catch {
      setViewerUrl("");
    }
  };

  const handleDownloadFile = async (file: BrowserFile) => {
    if (!file?.filepath) return;

    try {
      const response = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (response?.url) {
        const link = document.createElement("a");
        link.href = response.url;
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error("Failed to download file:", err);
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

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths((prev) =>
      prev.includes(filepath)
        ? prev.filter((path) => path !== filepath)
        : [...prev, filepath]
    );
  };

  const toggleSelectAllVisibleFiles = () => {
    const visiblePaths = visibleFiles.map((file) => file.filepath).filter(Boolean);
    if (!visiblePaths.length) return;

    setIsSelectionMode(true);
    setSelectedFilePaths((prev) => {
      const allVisibleSelected = visiblePaths.every((path) => prev.includes(path));
      if (allVisibleSelected) {
        return prev.filter((path) => !visiblePaths.includes(path));
      }

      return Array.from(new Set([...prev, ...visiblePaths]));
    });
  };

  const toggleSelectAllApprovalFiles = () => {
    const approvalPaths = getCurrentApprovalFilePaths();
    if (!approvalPaths.length) return;

    setIsSelectionMode(true);
    setSelectedFilePaths((prev) => {
      const allApprovalSelected = approvalPaths.every((path) => prev.includes(path));
      if (allApprovalSelected) {
        return prev.filter((path) => !approvalPaths.includes(path));
      }

      return Array.from(new Set([...prev, ...approvalPaths]));
    });
  };

  const handleSendForEdits = async () => {
    if (!selectedWorkspace || selectedFilePaths.length === 0) return;

    try {
      setIsSendingForEdits(true);
      const selectedPaths = new Set(selectedFilePaths);
      const nextSelectedEditFiles = phaseFiles.filter((file) =>
        selectedPaths.has(file.filepath || "")
      );
      if (isRawFootageFolder && phaseFiles.length > 0) {
        rawFootageSnapshotRef.current = phaseFiles;
      }
      const response = await fileManagerApi.sendExternalFilesForEdits({
        externalId: selectedWorkspace.externalId,
        filePaths: selectedFilePaths,
      });
      const movedByOldPath = new Map(
        (response?.data?.moved || []).map((item) => [item.oldPath, item.newPath])
      );
      setSelectedEditFiles(
        nextSelectedEditFiles.map((file) => ({
          ...file,
          filepath: movedByOldPath.get(file.filepath) || file.filepath,
        }))
      );
      setSelectedForEditsCount(nextSelectedEditFiles.length);
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
      setShowEditsSuccess(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send files for edits");
    } finally {
      setIsSendingForEdits(false);
    }
  };

  const openEditedFootageFolder = () => {
    setShowEditsSuccess(false);
    setSelectedPhase("post");
    setSelectedPath("Edited Footage");
    setSearchTerm("");
  };

  const getCurrentApprovalFilePaths = () =>
    phaseFiles.map((file) => file.filepath).filter(Boolean);

  const getSelectedApprovalFilePaths = () => {
    const currentPaths = new Set(getCurrentApprovalFilePaths());
    return selectedFilePaths.filter((path) => currentPaths.has(path));
  };

  const handleApproveSelectedFiles = async () => {
    if (!selectedWorkspace || !isRevisionVersionFolder || selectedFilePaths.length === 0) return;
    const approvedFilePaths = getSelectedApprovalFilePaths();
    if (!approvedFilePaths.length) return;

    try {
      setIsApprovingFiles(true);
      const response = await fileManagerApi.approveExternalFiles({
        externalId: selectedWorkspace.externalId,
        approvedFilePaths,
        allFilePaths: approvedFilePaths,
      });
      toast.success(response?.message || "Selected files approved");
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
      await loadPhase(selectedWorkspace, "post", selectedPath);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve selected files");
    } finally {
      setIsApprovingFiles(false);
    }
  };

  const handleApproveAllFiles = async () => {
    if (!selectedWorkspace || !isRevisionVersionFolder) return;
    const filePaths = getCurrentApprovalFilePaths();
    if (!filePaths.length) return;
    const allFilesSelected = filePaths.every((path) => selectedFilePaths.includes(path));
    if (!allFilesSelected) {
      toast.error("Please select all files before using Approve All");
      return;
    }

    try {
      setIsApprovingFiles(true);
      const response = await fileManagerApi.approveAllExternalFiles({
        externalId: selectedWorkspace.externalId,
        filePaths,
      });
      toast.success(response?.message || "All files approved");
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
      await loadPhase(selectedWorkspace, "post", selectedPath);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve all files");
    } finally {
      setIsApprovingFiles(false);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedFilePaths.length === 0) return;

    toast.info(`Starting download for ${selectedFilePaths.length} files...`);

    for (const path of selectedFilePaths) {
      try {
        const response = await fileManagerApi.getExternalFileDownloadUrl(path);
        if (response?.url) {
          triggerBatchFileDownload(response.url);
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to download file");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read selected image"));
      reader.readAsDataURL(file);
    });

  const runFaceScan = async (scanImageBase64: string) => {
    if (!selectedWorkspace) return;

    setIsFaceScanning(true);
    setFaceMatches([]);

    const response = await fileManagerApi.searchFaceMatches({
      externalId: selectedWorkspace.externalId,
      scanImageBase64,
      threshold: 0.85,
      maxResults: 200,
    });

    const matches = response?.matches || [];
    if (!matches.length) {
      setFaceMatches([]);
      toast.info("No matching photos found for this face scan");
      return;
    }

    const enriched = await Promise.all(
      matches.map(async (match) => {
        const path = String(match.path || "");
        if (!path) return null;
        try {
          const view = await fileManagerApi.getExternalFileViewUrl(path);
          return {
            path,
            score: Number(match.score || 0),
            confidence: Number(match.confidence || match.score || 0),
            url: view?.url || "",
          } as FaceMatchItem;
        } catch {
          return {
            path,
            score: Number(match.score || 0),
            confidence: Number(match.confidence || match.score || 0),
            url: "",
          } as FaceMatchItem;
        }
      })
    );

    const validMatches = enriched.filter((item): item is FaceMatchItem => Boolean(item));
    setFaceMatches(validMatches);
    toast.success(`Found ${validMatches.length} matching photo${validMatches.length === 1 ? "" : "s"}`);
  };

  const handleFaceScanFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedWorkspace) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image for face scan");
      return;
    }

    try {
      const scanImageBase64 = await fileToBase64(file);
      await runFaceScan(scanImageBase64);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Face scan failed");
    } finally {
      setIsFaceScanning(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!selectedWorkspace) return;
    setCameraError(null);
    setIsCameraOpen(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Unable to access camera. Please allow camera permission.");
    }
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setIsCameraProcessing(false);
    setCameraError(null);
    stopCamera();
  };

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      toast.error("Camera is still loading. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      toast.error("Unable to process camera capture.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";

    if (!base64) {
      toast.error("Failed to capture image from camera.");
      return;
    }

    setIsCameraProcessing(true);
    stopCamera();
    try {
      await runFaceScan(base64);
      handleCloseCamera();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Face scan failed");
    } finally {
      setIsCameraProcessing(false);
      setIsFaceScanning(false);
    }
  };

  const renderFaceScanActions = (uploadInputId: string) => (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        id={uploadInputId}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFaceScanFile}
      />
      <label
        htmlFor={uploadInputId}
        className={`inline-flex cursor-pointer items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white transition ${isFaceScanning ? "pointer-events-none opacity-60" : "hover:bg-white/10"
          }`}
      >
        {isFaceScanning ? "Scanning..." : "Upload Face Photo"}
      </label>
      <button
        type="button"
        onClick={handleOpenCamera}
        disabled={isFaceScanning}
        className={`inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white transition ${isFaceScanning ? "pointer-events-none opacity-60" : "hover:bg-white/10"
          }`}
      >
        <Camera size={14} />
        Use Camera
      </button>
    </div>
  );

  const handleOpenMatchedImage = (match: FaceMatchItem) => {
    if (!match.url) return;
    setViewerOpen(true);
    setViewerName(match.path.split("/").pop() || "Matched Image");
    setViewerType("image/*");
    setViewerUrl(match.url);
  };

  const handleDownloadMatchedImage = async (match: FaceMatchItem) => {
    if (!match.path) return;
    try {
      const response = await fileManagerApi.getExternalFileDownloadUrl(match.path);
      if (response?.url) {
        window.open(response.url, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to download image");
    }
  };

  const handleBack = () => {
    if (selectedPath) {
      const parts = selectedPath.split("/").filter(Boolean);
      parts.pop();
      setSelectedPath(parts.join("/"));
      return;
    }
    if (selectedPhase) {
      setFaceMatches([]);
      setSelectedPhase(null);
      return;
    }
    setFaceMatches([]);
    setSelectedWorkspace(null);
    setWorkspaceFolders([]);
  };

  const filteredWorkspaces = useMemo(() => {
    let items = [...workspaces];

    if (selectedTab === "Recent") {
      items = items.filter((workspace) =>
        isRecentWithinHours(workspace.updatedAtRaw, 24 * 5)
      );
    }
    // else if (selectedTab === "Shared" || selectedTab === "Trash") {
    //   items = [];
    // }

    if (status === "Unlinked") {
      items = [];
    }

    if (searchTerm.trim()) {
      items = items.filter((workspace) =>
        workspace.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  }, [workspaces, searchTerm, selectedTab, status]);

  const filteredFolders = useMemo(
    () =>
      phaseFolders.filter((folder) =>
        folder.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [phaseFolders, searchTerm]
  );

  const filteredFiles = useMemo(
    () =>
      phaseFiles.filter((file) =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [phaseFiles, searchTerm]
  );
  const visibleFiles = useMemo(
    () => filteredFiles.slice(0, visibleFileCount),
    [filteredFiles, visibleFileCount]
  );
  const hasMoreFiles = filteredFiles.length > visibleFileCount;

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [selectedWorkspace?.externalId, selectedPhase, selectedPath, searchTerm, phaseFiles.length]);

  const breadcrumb = useMemo(() => {
    const items = ["File Manager"];
    if (selectedWorkspace) items.push(selectedWorkspace.title);
    if (selectedPhase) {
      items.push(selectedPhase === "pre" ? "Pre Production" : "Post Production");
    }
    if (selectedPath) {
      selectedPath
        .split("/")
        .filter(Boolean)
        .forEach((segment) => items.push(prettifyFolderName(segment)));
    }
    return items;
  }, [selectedWorkspace, selectedPhase, selectedPath]);

  const canRunFaceScan = Boolean(
    selectedWorkspace && isCommonEventWorkspaceId(selectedWorkspace.externalId)
  );
  const isSelectedWorkspaceCommonEvent = Boolean(
    selectedWorkspace && isCommonEventWorkspaceId(selectedWorkspace.externalId)
  );
  const canUploadInSelectedPhase = Boolean(
    selectedWorkspace && selectedPhase === "pre" && !isSelectedWorkspaceCommonEvent
  );
  const isRawFootageFolder = selectedPhase === "post" && isRawFootagePath(selectedPath);
  const normalizedSelectedPath = normalizePathToken(selectedPath);
  const isEditsFolder = selectedPhase === "post" && normalizedSelectedPath === "editedfootage";
  const isSelectedForEditsFolder =
    selectedPhase === "post" && normalizedSelectedPath === "editedfootage/selectedforedits";
  const isRevisionsFolder =
    selectedPhase === "post" && normalizedSelectedPath === "editedfootage/revisions";
  const isRevisionVersionFolder =
    selectedPhase === "post" && normalizedSelectedPath.startsWith("editedfootage/revisions/version");
  const currentApprovalVersion = getRevisionVersionFromPath(selectedPath) || 1;
  const revisionVersions = useMemo(() => {
    const versions = new Set<number>([1]);
    Object.keys(revisionVersionCounts).forEach((version) => {
      const numericVersion = Number(version);
      if (Number.isFinite(numericVersion) && numericVersion > 0) versions.add(numericVersion);
    });
    if (currentApprovalVersion > 1) versions.add(currentApprovalVersion);
    return Array.from(versions).sort((a, b) => a - b);
  }, [currentApprovalVersion, revisionVersionCounts]);
  const visibleFilePaths = visibleFiles.map((file) => file.filepath).filter(Boolean);
  const areAllVisibleFilesSelected =
    visibleFilePaths.length > 0 &&
    visibleFilePaths.every((path) => selectedFilePaths.includes(path));
  const approvalFilePaths = isRevisionVersionFolder
    ? phaseFiles.map((file) => file.filepath).filter(Boolean)
    : [];
  const selectedApprovalFileCount = selectedFilePaths.filter((path) =>
    approvalFilePaths.includes(path)
  ).length;
  const areAllApprovalFilesSelected =
    approvalFilePaths.length > 0 &&
    approvalFilePaths.every((path) => selectedFilePaths.includes(path));
  const uploadPath = useMemo(() => {
    if (!selectedWorkspace || !canUploadInSelectedPhase) return undefined;
    const basePath = `${selectedWorkspace.title}/Pre-Production`;
    return selectedPath ? `${basePath}/${selectedPath}` : basePath;
  }, [canUploadInSelectedPhase, selectedPath, selectedWorkspace]);

  const renderRoot = () => {
    if (loading) {
      return (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center text-red-300 text-sm">
          {error}
        </div>
      );
    }

    if (!filteredWorkspaces.length) {
      return (
        <EmptyFileState
          title="No File Uploaded"
          description="No files have been uploaded for this project yet."
        />
      );
    }

    if (viewMode === "list") {
      return (
        <div className="flex flex-col gap-3">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                  <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                  <th className="py-5 px-6 font-medium">Category</th>
                  <th className="py-5 px-6 font-medium">Files</th>
                  <th className="py-5 px-6 font-medium">Status</th>
                  <th className="py-5 px-6 font-medium">Last Updated</th>
                  <th className="py-5 px-6 font-medium text-right rounded-r-xl">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkspaces.map((workspace) => (
                  <tr
                    key={workspace.externalId}
                    className="items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => openWorkspace(workspace)}
                  >
                    <td className="py-5 px-6 text-white flex gap-2 items-center">
                      <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-md">
                        <FolderOpen
                          className="text-[#E8D1AB] fill-[#E8D1AB]/20"
                          size={24}
                        />
                      </div>
                      <span className="text-sm font-semibold">{workspace.title}</span>
                    </td>
                    <td className="py-5 px-6 text-white text-[15px]">
                      <span className="px-4 py-1.5 rounded-xl bg-[#171717] text-white text-xs font-medium">
                        {workspace.category}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-white">
                      {String(workspace.fileCount).padStart(2, "0")}
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2 py-1 text-[11px] font-medium leading-none text-[#16A34A]">
                        <LinkIcon size={16} />
                        Linked
                      </span>
                    </td>
                    <td className="py-5 px-6 text-white/80">
                      Updated {formatRelativeTime(workspace.lastOpened)}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <ExternalLink className="inline-block text-white/40" size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {filteredWorkspaces.map((workspace) => (
              <button
                key={workspace.externalId}
                onClick={() => openWorkspace(workspace)}
                className="w-full bg-[#171717] rounded-xl border border-white/5 overflow-hidden mb-3 text-left"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/5 flex items-center justify-center rounded-lg">
                      <FolderOpen
                        className="text-[#E8D1AB] fill-[#E8D1AB]/10"
                        size={20}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white truncate max-w-[180px]">
                        {workspace.title}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        {String(workspace.fileCount).padStart(2, "0")} Files
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="text-white/40" size={18} />
                </div>
                <div className="border-t border-white/5 bg-black/20 p-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Category</p>
                    <p className="text-white font-medium">{workspace.category}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Last Updated</p>
                    <p className="text-white font-medium">
                      Updated {formatRelativeTime(workspace.lastOpened)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
        {filteredWorkspaces.map((workspace) => (
          <button
            key={workspace.externalId}
            onClick={() => openWorkspace(workspace)}
            className="w-full lg:max-w-[350px] bg-[#18181b] rounded-xl lg:rounded-3xl border border-white/5 shadow-xl cursor-pointer hover:border-white/20 hover:bg-[#1c1c20] transition-all group text-left"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-1">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="shrink-0">
                    <FolderOpen
                      className="text-[#E8D1AB] fill-[#E8D1AB]/20"
                      size={24}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm leading-tight break-words">
                      {workspace.title}
                    </h3>
                    <p className="text-[#E8D1AB]/60 text-sm mt-1">
                      {String(workspace.fileCount).padStart(2, "0")} Files
                    </p>
                  </div>
                </div>
                <ExternalLink className="text-white/40 mt-1 shrink-0" size={16} />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-4 py-1.5 rounded-full bg-black/40 text-white text-xs font-medium border border-white/5">
                  {workspace.category}
                </span>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2 py-1 text-[11px] font-medium leading-none text-[#16A34A]">
                  <LinkIcon size={16} />
                  Linked
                </span>
                <span className="px-2 py-1.5 rounded-full bg-[#1A1A1A] text-[#E8D1AB] text-xs font-medium border border-white/5">
                  View Only
                </span>
              </div>
            </div>

            <div className="flex items-center border-t border-t-white/50 p-5 gap-3">
              <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-[#000] text-base">
                {workspace.userInitials}
              </div>
              <span className="text-[#CDC5C5] text-sm">
                Updated {formatRelativeTime(workspace.lastOpened)}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderWorkspacePhases = () => {
    if (!selectedWorkspace) return null;

    const preFolder = workspaceFolders.find(
      (folder) => folder.title === "Pre Production"
    );
    const postFolder = workspaceFolders.find(
      (folder) => folder.title === "Post Production"
    );

    const phaseCards = [
      { id: "pre", title: "Pre Production", fileCount: preFolder?.fileCount || 0 },
      { id: "post", title: "Post Production", fileCount: postFolder?.fileCount || 0 },
    ];

    if (isPhaseLoading) {
      return (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      );
    }

    const filteredPhaseCards = phaseCards.filter((phase) =>
      phase.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

	    return (
	      <div className="space-y-8">
	        <div>
            <div className="mb-5 flex items-center justify-end">
              {canUploadInSelectedPhase ? (
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                >
                  <Upload size={18} /> Upload Files
                </Button>
              ) : null}
            </div>
	          <div className="flex items-start gap-5 mb-2 lg:mb-6">
            <div className="h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] text-lg lg:text-[30px] font-medium">
              {selectedWorkspace.userInitials}
            </div>
            <div className="min-w-0 text-white max-w-3xl flex-1">
              <div className="flex flex-row lg:items-center gap-2">
                <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                  {selectedWorkspace.title}
                </h1>
                <span className="px-1.5 lg:px-2.5 py-1 rounded-full bg-[#D4FFE4] text-[#16A34A] text-[10px] lg:text-xs lg:font-medium border border-[#6ce9a6]/20 h-fit w-fit">
                  Active Project
                </span>
              </div>
              <p className="text-xs lg:text-sm text-[#D0D0D0]">
                <span className="text-[#AAA7A7]">Project Code: </span>
                {selectedWorkspace.externalId}
              </p>
              {canRunFaceScan ? renderFaceScanActions("affiliate-face-scan-input") : null}
              {/* {selectedWorkspace.consoleUrl ? (
                <a
                  href={selectedWorkspace.consoleUrl}
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
            {selectedWorkspace.externalId}
          </p> */}
          {/* {selectedWorkspace.consoleUrl ? (
            <a
              href={selectedWorkspace.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="lg:hidden inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
            >
              Open Storage Folder
            </a>
          ) : null} */}
        </div>

        <div className="pb-20 lg:pb-0">
          {canRunFaceScan && faceMatches.length > 0 ? (
            <div className="mb-6 rounded-xl border border-white/10 bg-[#141414] p-4">
              <p className="mb-3 text-sm font-medium text-[#E8D1AB]">
                Your matched photos ({faceMatches.length})
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {faceMatches.map((match) => (
                  <div
                    key={match.path}
                    className="overflow-hidden rounded-lg border border-white/10 bg-black/20 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenMatchedImage(match)}
                      className="w-full text-left"
                    >
                      {match.url ? (
                        <div className="aspect-23/18 w-full bg-[#0f0f0f] flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={match.url}
                            alt="Matched face result"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-23/18 w-full items-center justify-center text-xs text-white/50 bg-[#0f0f0f]">
                          Preview unavailable
                        </div>
                      )}
                    </button>
                    <div className="p-2 text-xs text-white/70">
                      Confidence: {Math.round((match.confidence || 0) * 100)}%
                      <button
                        type="button"
                        onClick={() => handleDownloadMatchedImage(match)}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/85 hover:bg-white/10"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {filteredPhaseCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
              {filteredPhaseCards.map((phase) => (
                <FolderCard
                  key={phase.id}
                  title={phase.title}
                  fileCount={phase.fileCount}
                  lastOpened={formatRelativeTime(
                    (phase.id === "pre" ? preFolder?.lastOpened : postFolder?.lastOpened) ||
                    selectedWorkspace.lastOpened
                  )}
                  userInitials={selectedWorkspace.userInitials}
                  onOpenLinkModal={() => { }}
                  onOpen={() => {
                    setSelectedPhase(phase.id as "pre" | "post");
                    setSelectedPath("");
                    setSearchTerm("");
                  }}
                  showMenu={false}
                />
              ))}
            </div>
          ) : (
            <EmptyFileState
              title="No matching folders"
              description="Try another search term to find the project phase."
            />
          )}
        </div>
      </div>
    );
  };

  const renderLinkedPanelHeader = (title: string, countLabel: string) => (
    <div className="rounded-xl border border-white/10 bg-[#101010] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <FolderOpen className="h-4 w-4 text-[#E8D1AB]" />
        </div>
        <h2 className="text-sm font-semibold text-[#E8D1AB]">
          {title} <span className="text-white">({countLabel})</span>
        </h2>
        {isEditsFolder ? (
          <span className="rounded-full border border-[#23C55E]/20 bg-[#12351f] px-2 py-0.5 text-[10px] text-[#33D17A]">
            V1 Latest
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-white/15 bg-[#171717] px-4 py-3 text-xs text-white/80">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-[#19437D]">
          <LinkIcon size={15} />
        </span>
        <div>
          <p>Linked to: Corporate Event 2026</p>
          <p className="mt-0.5 flex items-center gap-1 text-white/65">
            <CalendarDays size={12} /> Jan 15, 2024
          </p>
        </div>
      </div>
    </div>
  );

  const renderFolderTile = (
    title: string,
    fileCount: number,
    onOpen: () => void,
    extra?: React.ReactNode,
    options?: { centered?: boolean }
  ) => (
    <button
      type="button"
      onClick={onOpen}
      className="relative min-h-[260px] overflow-hidden rounded-[28px] border border-white/15 bg-[#18181b] text-left shadow-xl transition hover:border-white/25 hover:bg-[#1c1c20]"
    >
      <div className="flex h-full flex-col">
        <div className={`flex flex-1 gap-3 px-7 py-7 ${options?.centered ? "items-center justify-center text-center" : "items-start justify-between"}`}>
          <div className="flex items-start gap-4">
            {options?.centered ? null : (
              <FolderOpen className="mt-0.5 h-7 w-7 fill-[#E8D1AB]/20 text-[#E8D1AB]" />
            )}
            <div>
              {options?.centered ? (
                <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
                  <Plus size={24} />
                </span>
              ) : null}
              <p className="text-lg font-semibold text-white">{title}</p>
              {!options?.centered ? (
                <p className="mt-2 text-lg text-[#E8D1AB]">
                {String(fileCount).padStart(2, "0")} Files
                </p>
              ) : null}
            </div>
          </div>
          {options?.centered ? null : extra || <MoreVertical className="h-6 w-6 text-white/70" />}
          {!options?.centered ? (
            <div className="absolute mt-24 flex gap-3">
              <span className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">Folder</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#D4FFE4] px-4 py-2 text-sm font-medium text-[#16A34A]">
                <LinkIcon size={16} />
                Linked
              </span>
            </div>
          ) : null}
        </div>
        {!options?.centered ? <div className="flex items-center gap-5 border-t border-white/20 px-7 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8E1FF] text-lg font-medium text-black">
            {getInitials(title)}
          </div>
          <div className="min-w-0 text-lg">
            <p className="truncate text-white/90">Updated {formatRelativeTime(selectedWorkspace?.lastOpened)}</p>
          </div>
        </div> : null}
      </div>
    </button>
  );

  const renderEditToolbar = (showVersion = false) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-9 w-full rounded-md border border-white/10 bg-[#202020] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/35"
        />
      </div>
      <div className="flex items-center gap-2">
        {showVersion ? (
          <BasicDropdown
            label="Version"
            value={`Version ${currentApprovalVersion}`}
            onChange={(value) => {
              const version = Number(String(value).replace(/\D/g, ""));
              if (version > 0) setSelectedPath(`Edited Footage/Revisions/Version ${version}`);
            }}
            options={revisionVersions.map((version) => `Version ${version}`)}
          />
        ) : null}
        <BasicDropdown
          label="Status"
          value=""
          onChange={() => {}}
          options={["Latest", "Approved", "Pending"]}
        />
        <div className="flex overflow-hidden rounded-md border border-white/10 bg-[#202020]">
          <Button onClick={() => setViewMode("grid")} className={`h-9 rounded-none px-4 ${viewMode === "grid" ? "bg-[#E8D1AB] text-black" : "bg-transparent text-white/60"}`}>
            <Grid3X3 size={15} />
          </Button>
          <Button onClick={() => setViewMode("list")} className={`h-9 rounded-none px-4 ${viewMode === "list" ? "bg-[#E8D1AB] text-black" : "bg-transparent text-white/60"}`}>
            <List size={15} />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderEditFileCard = (file: BrowserFile, badge = "File Selected For Edits") => {
    const previewUrl = previewUrls[file.id];
    const selected = selectedFilePaths.includes(file.filepath || "");
    const uploadedBy = file.uploadedBy || selectedWorkspace?.title || "Unknown";
    const uploadedAt = formatShortDateTime(file.uploadedAt || file.lastOpened);

    return (
      <div
        key={file.id}
        role="button"
        tabIndex={0}
        onClick={() => handleOpenFile(file)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") handleOpenFile(file);
        }}
        className="group overflow-hidden rounded-lg border border-white/10 bg-[#171717] outline-none transition hover:border-white/25"
      >
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              {isRawFootageFolder || isRevisionVersionFolder ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFileSelection(file.filepath || "");
                  }}
                  className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : "border-white/20"}`}
                >
                  {selected ? <Check size={12} /> : null}
                </button>
              ) : (
                <span className="h-4 w-4 rounded border border-white/20" />
              )}
              <span>ID : #12345</span>
            </div>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <div className="flex aspect-[1.15] items-center justify-center overflow-hidden rounded bg-[#232323]">
            {previewUrl && file.contentType?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={file.title} className="h-full w-full object-cover" />
            ) : previewUrl && file.contentType?.startsWith("video/") ? (
              <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <Download className="h-12 w-12 rounded-2xl bg-white/40 p-3 text-white" />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-white">
              {file.title} - {isRevisionVersionFolder ? `V${currentApprovalVersion}` : "RAW_V1"}
            </p>
            <span className="rounded border border-white/10 bg-[#252525] px-2 py-0.5 text-[10px] text-[#32D174]">
              V{isRevisionVersionFolder ? currentApprovalVersion : 1} Latest
            </span>
          </div>
          <span className="mt-2 inline-flex rounded-full bg-[#6F2DBD]/35 px-2 py-1 text-[10px] text-[#D8B4FE]">
            {badge}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8E1FF] text-xs font-semibold text-black">
              {getInitials(uploadedBy)}
            </div>
            <div className="text-xs">
              <p className="text-white/80">Uploaded by {uploadedBy}</p>
              <p className="text-[10px] text-white/45">{uploadedAt}</p>
            </div>
          </div>
          <MoreVertical className="h-5 w-5 text-white/70" />
        </div>
      </div>
    );
  };

  const renderEditsFolder = () => (
    <div className="space-y-5">
      {renderLinkedPanelHeader("Edits", "2 Folders")}
      {renderEditToolbar()}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {renderFolderTile("Selected for Edits", selectedForEditsCount || selectedEditFiles.length, () =>
          setSelectedPath("Edited Footage/Selected for Edits")
        )}
        {renderFolderTile("Revisions", Object.values(revisionVersionCounts).reduce((sum, count) => sum + Number(count || 0), 0), () =>
          setSelectedPath("Edited Footage/Revisions")
        )}
      </div>
    </div>
  );

  const renderSelectedForEdits = () => {
    const files = phaseFiles;
    const filtered = files.filter((file) =>
      file.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-5">
        {renderLinkedPanelHeader("Selected for Edits", `${files.length} Files`)}
        {renderEditToolbar()}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => renderEditFileCard(file))}
        </div>
      </div>
    );
  };

  const renderRevisions = () => {
    const availableVersions = revisionVersions.length ? revisionVersions : [1];

    return (
      <div className="space-y-5">
        {renderLinkedPanelHeader("Revision", `${availableVersions.length} Folder${availableVersions.length === 1 ? "" : "s"}`)}
        {renderEditToolbar(true)}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {availableVersions.map((version) => (
            <React.Fragment key={`revision-version-${version}`}>
              {renderFolderTile(`Version ${version}`, revisionVersionCounts[version] || 0, () =>
                setSelectedPath(`Edited Footage/Revisions/Version ${version}`)
              )}
            </React.Fragment>
          ))}
          <React.Fragment key="revision-create-new-version">
            {renderFolderTile(
              "Create New Version",
              0,
              () => {},
              undefined,
              { centered: true }
            )}
          </React.Fragment>
        </div>
      </div>
    );
  };

  const renderRevisionVersion = () => {
    const files = phaseFiles;
    const filtered = files.filter((file) =>
      file.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#101010] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <FolderOpen className="h-4 w-4 text-[#E8D1AB]" />
              </div>
              <h2 className="text-sm font-semibold text-[#E8D1AB]">
                Revision Version {currentApprovalVersion} <span className="text-white">({files.length} Files)</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                onClick={toggleSelectAllApprovalFiles}
                disabled={!filtered.length || isApprovingFiles}
                className="h-9 rounded-md border border-white/15 bg-[#202020] px-4 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
              >
                <CheckSquare size={14} />
                Select All
              </Button>
              <Button
                type="button"
                onClick={handleApproveSelectedFiles}
                disabled={!selectedApprovalFileCount || areAllApprovalFilesSelected || isApprovingFiles}
                className="h-9 rounded-md bg-[#22C55E] px-4 text-xs font-semibold text-white hover:bg-[#16A34A] disabled:opacity-50"
              >
                {isApprovingFiles ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve {selectedApprovalFileCount > 0 ? `(${selectedApprovalFileCount})` : ""}
              </Button>
              <Button
                type="button"
                onClick={handleApproveAllFiles}
                disabled={!areAllApprovalFilesSelected || isApprovingFiles}
                className="h-9 rounded-md bg-[#22C55E] px-4 text-xs font-semibold text-white hover:bg-[#16A34A] disabled:opacity-50"
              >
                {isApprovingFiles ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve All
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-white/15 bg-[#171717] px-4 py-3 text-xs text-white/80">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-[#19437D]">
              <LinkIcon size={15} />
            </span>
            <div>
              <p>Linked to: Corporate Event 2026</p>
              <p className="mt-0.5 flex items-center gap-1 text-white/65">
                <CalendarDays size={12} /> Jan 15, 2024
              </p>
            </div>
          </div>
        </div>
        {renderEditToolbar(true)}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => renderEditFileCard(file, "File Selected For Edits"))}
        </div>
      </div>
    );
  };

  const renderSelectionActionBar = () => {
    if (selectedFilePaths.length === 0) return null;

    return (
      <div className="mt-3 w-full border border-[#E8D1AB]/30 bg-[#1B1915] px-4 py-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D1AB] text-sm font-bold text-black">
              {selectedFilePaths.length}
            </div>
            <span className="font-medium text-white">
              {selectedFilePaths.length} File{selectedFilePaths.length === 1 ? "" : "s"} Selected
              {isRawFootageFolder ? " for Edits" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-9 gap-2 text-white/70 underline underline-offset-4 hover:text-white"
              onClick={() => {
                setSelectedFilePaths([]);
                setIsSelectionMode(false);
              }}
            >
              Clear Selection
            </Button>

            <div className="mx-1 h-6 w-[1px] bg-white/10" />

            {isRawFootageFolder ? (
              <Button
                className="h-9 gap-2 border border-[#E8D1AB]/50 bg-black text-[#E8D1AB] hover:bg-black/80"
                onClick={handleSendForEdits}
                disabled={isSendingForEdits}
              >
                {isSendingForEdits ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <SendHorizontal size={16} />
                )}
                Send For Edits
              </Button>
            ) : (
              <Button
                className="h-9 gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
                onClick={handleBatchDownload}
              >
                <Download size={18} />
                Download
              </Button>
            )}

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
      </div>
    );
  };

  const renderPhaseBrowser = () => {
    if (isPhaseLoading) {
      return (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      );
    }

    if (isEditsFolder) {
      return <div className="pb-20 lg:pb-0">{renderEditsFolder()}</div>;
    }

    if (isSelectedForEditsFolder) {
      return <div className="pb-20 lg:pb-0">{renderSelectedForEdits()}</div>;
    }

    if (isRevisionsFolder) {
      return <div className="pb-20 lg:pb-0">{renderRevisions()}</div>;
    }

    if (isRevisionVersionFolder) {
      return <div className="pb-20 lg:pb-0">{renderRevisionVersion()}</div>;
    }

    return (
      <div className="space-y-4 lg:space-y-8">
        <div>
          <div className="flex items-start gap-5 mb-2 lg:mb-6">
            <div className="h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] text-lg lg:text-[30px] font-medium">
              {selectedWorkspace?.userInitials}
            </div>
            <div className="min-w-0 text-white max-w-3xl flex-1">
              <div className="flex flex-row lg:items-center gap-2">
                <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                  {selectedWorkspace?.title}
                </h1>
                <span
                  className={`px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border border-white/5 flex items-center gap-1.5 h-fit w-fit ${
                    selectedPhase === "post"
                      ? "bg-[#E8D2FB] text-[#540B94]"
                      : "bg-[#FDF4FF] text-[#C026D3]"
                  }`}
                >
                  {selectedPhase === "post" ? "Post Production" : "Pre Production"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border border-white/5 ${
                    canUploadInSelectedPhase
                      ? "bg-[#D4FFE4] text-[#16A34A] border-[#6ce9a6]/20"
                      : "bg-[#1A1A1A] text-[#E8D1AB]"
                  }`}
                >
                  {canUploadInSelectedPhase ? "Upload Enabled" : "View Only"}
                </span>
              </div>
              <p className="text-xs lg:text-sm text-[#D0D0D0]">
                <span className="text-[#AAA7A7]">Project Code: </span>
                {selectedWorkspace?.externalId}
              </p>
	              {canRunFaceScan ? renderFaceScanActions("affiliate-face-scan-input-phase") : null}
	              {/* {selectedWorkspace?.consoleUrl ? (
                <a
                  href={selectedWorkspace.consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                >
                  Open Storage Folder
                </a>
              ) : null} */}
            </div>
          </div>
        </div>

        {filteredFiles.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isRawFootageFolder ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={toggleSelectAllVisibleFiles}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelectAllVisibleFiles();
                    }
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-[#202020] px-4 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  <Checkbox
                    checked={areAllVisibleFilesSelected}
                    className="pointer-events-none h-4 w-4 border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                  />
                  <span>Select All</span>
                </div>
              ) : null}
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
            </div>
          </div>
        ) : null}

        {canRunFaceScan && faceMatches.length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
            <p className="mb-3 text-sm font-medium text-[#E8D1AB]">
              Your matched photos ({faceMatches.length})
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {faceMatches.map((match) => (
                <div
                  key={match.path}
                  className="overflow-hidden rounded-lg border border-white/10 bg-black/20 text-left"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenMatchedImage(match)}
                    className="w-full text-left"
                  >
                    {match.url ? (
                      <div className="aspect-23/18 w-full bg-[#0f0f0f] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={match.url}
                          alt="Matched face result"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-23/18 w-full items-center justify-center text-xs text-white/50 bg-[#0f0f0f]">
                        Preview unavailable
                      </div>
                    )}
                  </button>
                  <div className="p-2 text-xs text-white/70">
                    Confidence: {Math.round((match.confidence || 0) * 100)}%
                    <button
                      type="button"
                      onClick={() => handleDownloadMatchedImage(match)}
                      className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/85 hover:bg-white/10"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {filteredFolders.length > 0 ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={`${selectedPath}-${folder.name}`}
                  title={folder.title}
                  fileCount={folder.fileCount}
                  category="Folder"
                  isLinked={true}
                  lastOpened={formatRelativeTime(folder.lastOpened)}
                  userInitials={getInitials(folder.title)}
                  onOpenLinkModal={() => { }}
                  onOpen={() => {
                    const nextPath = [selectedPath, folder.name]
                      .filter(Boolean)
                      .join("/");
                    setSelectedPath(nextPath);
                  }}
                  showMenu={false}
                />
              ))}
            </div>
          </div>
        ) : null}

        {filteredFiles.length > 0 || filteredFolders.length === 0 ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
            {filteredFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                  {visibleFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={{
                        ...file,
                        previewUrl: previewUrls[file.id],
                        lastOpened: formatRelativeTime(file.lastOpened),
                      }}
                      onOpen={() => {
                        if (isSelectionMode) {
                          toggleFileSelection(file.filepath || "");
                          return;
                        }
                        handleOpenFile(file);
                      }}
                      onDownload={() => handleDownloadFile(file)}
                      isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                      onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
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
	              <EmptyFileState
	                title="No File Uploaded"
	                description="No files have been uploaded for this project yet."
                  onAction={canUploadInSelectedPhase ? () => setIsUploadModalOpen(true) : undefined}
                  actionLabel={canUploadInSelectedPhase ? "Upload Files" : undefined}
	              />
	            )}
	          </div>
	        ) : null}
      </div>
    );
  };

  const renderAffiliateFileDrawer = () => {
    if (!viewerOpen) return null;

    const isImage = viewerType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(viewerName);
    const isVideo = viewerType.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(viewerName);
    const uploadedBy = viewerFile?.uploadedBy || selectedWorkspace?.title || "Unknown";
    const updatedAt = formatShortDateTime(viewerFile?.uploadedAt || viewerFile?.lastOpened);

    return (
      <div
        className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-[2px]"
        onClick={() => {
          setViewerOpen(false);
          setViewerFile(null);
        }}
      >
        <aside
          className="ml-auto flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-black text-white shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div className="min-w-0 pt-1">
              <h3 className="truncate text-xl font-bold leading-7 text-white">{viewerName || "File"}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#32D174]/20 bg-[#12351f] px-2.5 py-1 text-[11px] font-medium text-[#32D174]">
                  V1 Latest
                </span>
                <span className="rounded-full border border-[#0B4E8A]/40 bg-[#0B4E8A] px-2.5 py-1 text-[11px] font-medium text-[#9DD1FF]">
                  Raw Files Uploaded
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewerOpen(false);
                setViewerFile(null);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#242424] text-white/75 transition hover:bg-white/15 hover:text-white"
              aria-label="Close file details"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E8D1AB]/30 bg-[#E8D1AB]/10 px-3.5 text-xs font-semibold text-[#E8D1AB] transition hover:bg-[#E8D1AB]/15">
                <Check size={14} />
                Request Revision
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#171717] px-3.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={() => viewerFile && handleDownloadFile(viewerFile)}
              >
                <Download size={14} /> Download
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#171717] px-3.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
                <Share2 size={14} /> Share
              </button>
            </div>

            <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-xl bg-white md:h-[420px]">
              {viewerUrl === null ? (
                <div className="flex h-full w-full items-center justify-center bg-[#171717] text-sm text-white/55">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading preview...
                </div>
              ) : viewerUrl && isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewerUrl} alt={viewerName} className="h-full w-full object-contain" />
              ) : viewerUrl && isVideo ? (
                <video src={viewerUrl} controls className="h-full w-full bg-black object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#171717] text-sm text-white/55">
                  Preview unavailable
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 rounded-xl bg-[#1B1B1B] px-5 py-4 text-xs">
              <div>
                <p className="text-[11px] text-white/40">Uploaded by</p>
                <p className="mt-1.5 font-medium text-white/85">{uploadedBy}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40">Last updated</p>
                <p className="mt-1.5 font-medium text-white/85">{updatedAt}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40">File type</p>
                <p className="mt-1.5 font-medium text-white/85">{isVideo ? "Video" : "Image"}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40">Current version</p>
                <p className="mt-1.5 font-medium text-white/85">Version 1</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#1B1B1B] p-5">
              <h4 className="text-sm font-semibold text-white">Comments</h4>
              <div className="flex min-h-[110px] items-center justify-center text-center text-xs text-white/35">
                No comments yet. Be the first to comment!
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                className="h-11 w-full rounded-lg border border-white/10 bg-[#202020] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#E8D1AB]/40"
              />
              <button className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#A69A83] px-4 text-xs font-semibold text-black transition hover:bg-[#c9b68e]">
                Post Comment
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  return (
    <div
      className="space-y-4 lg:space-y-8"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div>
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1 text-white">
            File Manager
          </h1>
          <p className="text-xs lg:text-sm text-white/70">
            Live project folders from your booked and paid shoots.
          </p>
        </div>
        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {(selectedWorkspace || selectedPhase) && (
        <div className="space-y-3">
          <button
            onClick={handleBack}
            className="text-white hover:text-white/80 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>
          {renderSelectionActionBar()}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
        {breadcrumb.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && <span>/</span>}
            <span
              className={index === breadcrumb.length - 1 ? "text-white font-medium" : ""}
            >
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>

      {!selectedWorkspace && (
        <>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full mb-4 lg:mb-9">
            <div className="flex flex-nowrap items-center gap-1.5 lg:gap-3 bg-[#171717] p-1.5 rounded-xl w-full lg:w-fit overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { name: "All Files", icon: FolderOpen },
                { name: "Linked to folders", icon: Link },
                { name: "Recent", icon: History },
                // { name: "Shared", icon: Share2 },
                // { name: "Trash", icon: Trash2 },
              ].map((tab) => (
                <Button
                  key={tab.name}
                  onClick={() => setSelectedTab(tab.name)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-2 text-sm font-medium transition-all rounded-lg h-10 lg:h-12 shrink-0 whitespace-nowrap ${selectedTab === tab.name
                      ? "bg-white text-black shadow-lg scale-[1.02]"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <tab.icon size={20} className="shrink-0" />
                  <span className="leading-none">{tab.name}</span>
                </Button>
              ))}
            </div>

            <div className="w-full lg:w-auto flex justify-between lg:justify-end items-center gap-2 text-sm lg:text-base text-[#8F8F8F] bg-[#171717]/50 px-4 py-2 rounded-lg border border-white/5">
              <span className="whitespace-nowrap">Projects:</span>
              <p className="font-medium">
                <span className="text-[#E8D1AB]">{workspaces.length}</span>
                <span className="mx-1">total</span>
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
              <input
                type="text"
                placeholder="Search folder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
              />
            </div>
            <div className="flex gap-2">
              {/* <BasicDropdown
                label="Status"
                value={status}
                onChange={setStatus}
                options={["Linked", "Unlinked"]}
              /> */}

              <div className="md:hidden relative">
                <Button
                  onClick={() => setIsViewMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
                >
                  {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
                </Button>

                {isViewMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "grid"
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5"
                        }`}
                    >
                      <Grid3X3 size={18} />
                      Grid View
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "list"
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5"
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
                  className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === "grid"
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : "bg-transparent text-white/40 hover:text-white"
                    }`}
                >
                  <Grid3X3 size={20} />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === "list"
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : "bg-transparent text-white/40 hover:text-white"
                    }`}
                >
                  <List size={20} />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedWorkspace && !isEditsFolder && !isSelectedForEditsFolder && !isRevisionsFolder && !isRevisionVersionFolder && (
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder={
              selectedPhase ? "Search files or folders..." : "Search project folders..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#18181b] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
          />
        </div>
      )}

      {selectedWorkspace ? (
        selectedPhase ? renderPhaseBrowser() : renderWorkspacePhases()
      ) : (
        renderRoot()
      )}

      {showEditsSuccess ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[6px]">
          <div className="w-[calc(100vw-24px)] max-w-[440px] overflow-hidden rounded-[22px] border border-white/20 bg-black px-5 py-6 text-center text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:max-w-[460px] sm:px-7 sm:py-7">
            <div className="mx-auto max-w-[372px]">
              <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#E8D1AB] text-black">
                <CheckCircle2 className="h-[31px] w-[31px] stroke-[1.75]" />
              </div>
              <h3 className="text-[25px] font-medium leading-tight text-white">
                Edits Request Sent Successfully
              </h3>
              <p className="mx-auto mt-2.5 max-w-[340px] text-[15px] leading-[1.45] text-white/55">
                Your selected files have been sent for edits. The assigned team will review and start the requested changes shortly.
              </p>
            </div>
            <Button
              type="button"
              onClick={openEditedFootageFolder}
              className="mx-auto mt-5 flex h-[46px] w-full max-w-[372px] rounded-[12px] bg-[#E8D1AB] text-[15px] font-semibold text-black hover:bg-[#d8c196]"
            >
              Open Edit Folder
            </Button>
          </div>
        </div>
      ) : null}

      {isCameraOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Face Scan Camera</h3>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              {cameraError && !isCameraProcessing ? (
                <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {cameraError}
                </div>
              ) : null}
              {isCameraProcessing ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-white/10 bg-black">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-white/70" size={28} />
                    <p className="mt-2 text-xs text-white/65">Scanning your face...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full rounded-lg border border-white/10 bg-black object-cover"
                />
              )}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  disabled={isCameraProcessing}
                  className={`rounded-md border border-white/15 px-3 py-1.5 text-sm text-white ${isCameraProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={Boolean(cameraError) || isFaceScanning || isCameraProcessing}
                  className={`rounded-md px-3 py-1.5 text-sm ${cameraError || isFaceScanning || isCameraProcessing
                      ? "cursor-not-allowed bg-[#E8D1AB]/30 text-black/70"
                      : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
                    }`}
                >
                  {isFaceScanning || isCameraProcessing ? "Scanning..." : "Capture & Scan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={selectedWorkspace?.title || "Pre Production"}
        uploadPath={uploadPath}
        onUploadComplete={async () => {
          if (selectedWorkspace && selectedPhase) {
            await loadPhase(selectedWorkspace, selectedPhase, selectedPath);
          }
        }}
      />

      {renderAffiliateFileDrawer()}
    </div>
  );
}
