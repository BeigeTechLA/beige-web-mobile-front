"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Camera,
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
  Search,
  Upload,
  X as CloseIcon,
} from "lucide-react";
import { useViewMode } from "@/hooks/useViewMode";
import { Button } from "@/components/ui/button";

import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { SortDateButton } from "@/components/admin/SortDateButton";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
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
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { MobileFolderRow } from "../admin/file-manager/MobileFolderRow";
import { MobileWorkspaceRow } from "./file-manager/AffiliateMobileRow";

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

export default function AffiliateFileManager() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerMetaId, setViewerMetaId] = useState<string | null>(null);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceMatches, setFaceMatches] = useState<FaceMatchItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraProcessing, setIsCameraProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const { isDark } = useResolvedTheme()

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

  const loadPhase = async (
    workspace: WorkspaceCard,
    phase: "pre" | "post",
    path = ""
  ) => {
    try {
      setIsPhaseLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(
        workspace.externalId,
        phase,
        path || undefined
      );

      setPhaseFolders(
        (response.folders || []).map((folder) => ({
          name: folder.name,
          title: prettifyFolderName(folder.name),
          fileCount: Number(folder.fileCount || 0),
          lastOpened: folder.updatedAt || folder.createdAt || "",
        }))
      );

      setPhaseFiles(
        (response.files || []).map((file) => ({
          id: file.id,
          title: file.name,
          filepath: file.path,
          contentType: file.contentType,
          lastOpened: file.updatedAt || file.createdAt || "",
          userInitials: getInitials(file.name),
        }))
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load folder contents"));
    } finally {
      setIsPhaseLoading(false);
    }
  };

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
  }, [selectedWorkspace, selectedPhase, selectedPath]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  }, [selectedWorkspace?.externalId, selectedPhase, selectedPath]);

  useEffect(() => {
    const previewableFiles = phaseFiles
      .slice(0, visibleFileCount)
      .filter(
        (file) =>
          file.filepath &&
          (file.contentType?.startsWith("image/") ||
            file.contentType?.startsWith("video/"))
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
    try {
      setViewerOpen(true);
      setViewerName(file.title);
      setViewerType(file.contentType || "");
      setViewerMetaId(file.filepath || null);
      setViewerUrl(null);
      const response = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      setViewerUrl(response.url || null);
    } catch {
      setViewerOpen(false);
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

      {/* Upload Photo Trigger Label */}
      <label
        htmlFor={uploadInputId}
        className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-xs transition-all ${isFaceScanning
          ? "pointer-events-none opacity-60"
          : isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-black/15 text-black bg-white hover:bg-black/[0.02]"
          }`}
      >
        {isFaceScanning ? "Scanning..." : "Upload Face Photo"}
      </label>
      <button
        type="button"
        onClick={handleOpenCamera}
        disabled={isFaceScanning}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-all ${isFaceScanning
          ? "pointer-events-none opacity-40"
          : isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-black/15 text-black bg-white hover:bg-black/[0.02]"
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
    setViewerMetaId(match.path);
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
  const uploadPath = useMemo(() => {
    if (!selectedWorkspace || !canUploadInSelectedPhase) return undefined;
    const basePath = `${selectedWorkspace.title}/Pre-Production`;
    return selectedPath ? `${basePath}/${selectedPath}` : basePath;
  }, [canUploadInSelectedPhase, selectedPath, selectedWorkspace]);

  const renderRoot = () => {
    if (loading) {
      return (
        <div className={`border rounded-lg lg:rounded-2xl min-h-[280px] flex items-center justify-center ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"}`}>
          <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/50"}`} size={28} />
        </div>
      );
    }

    if (error) {
      return (
        <div className={`border rounded-lg lg:rounded-2xl min-h-[280px] flex items-center justify-center ${isDark ? "bg-[#111111] border-[#222222] text-red-300" : "text-[#F03434] bg-white border-[#E5E5E5]"}`}>
          {error}
        </div>
      );
    }

    if (!filteredWorkspaces.length) {
      return (
        <EmptyFileState
          title="No File Uploaded"
          description="No files have been uploaded for this project yet."
          isDark={isDark}
        />
      );
    }

    if (viewMode === "list") {
      return (
        <div className="flex flex-col gap-3">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse rounded-xl">
              <thead>
                <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 ${isDark
                  ? "bg-[#202020] text-[#E8D1AB]"
                  : "bg-[#FFFCF6] text-[#000000]"
                  }`}>
                  <th className="rounded-t-xl py-5 px-6 font-medium">Name</th>
                  <th className="py-5 px-6 font-medium">Category</th>
                  <th className="py-5 px-6 font-medium">Files</th>
                  <th className="py-5 px-6 font-medium">Status</th>
                  <th className="py-5 px-6 font-medium">Last Updated</th>
                  <th className="py-5 px-6 font-medium text-right rounded-t-xl">Action</th>
                </tr>
              </thead>
              <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                {filteredWorkspaces.map((workspace) => (
                  <tr
                    key={workspace.externalId}
                    className={`items-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                    onClick={() => openWorkspace(workspace)}
                  >
                    {/* Folder Name & Icon Block */}
                    <td className={`py-5 px-6 flex gap-2 items-center min-w-0 {isDark ? "text-white" : "text-black"}`}>
                      <div className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${isDark ? "bg-white/10" : "bg-transparent"}`}>
                        <FolderOpen className={"text-[#E8D1AB] fill-[#E8D1AB]/20"} size={24} />
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[220px]" title={workspace.title}>{workspace.title}</span>
                    </td>
                    <td className="py-5 px-6 text-base">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${isDark ? "bg-[#171717] text-white" : "bg-[#F4F5F7] text-[#727272]"}`}>
                        {workspace.category}
                      </span>
                    </td>
                    <td className={`py-5 px-6 font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
                      {String(workspace.fileCount).padStart(2, "0")}
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2 py-1 text-[11px] font-medium leading-none text-[#16A34A]">
                        <LinkIcon size={16} />
                        Linked
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      Updated {formatRelativeTime(workspace.lastOpened)}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <ExternalLink className={`inline-block ${isDark ? "text-white/40" : "text-black/40"}`} size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {filteredWorkspaces.map((workspace) => (
              <MobileWorkspaceRow
                key={workspace.externalId}
                workspace={workspace}
                isDark={isDark}
                openWorkspace={(ws) => openWorkspace(ws as WorkspaceCard)}
                formatRelativeTime={formatRelativeTime}
              />
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
            className={`w-full h-full lg:max-w-[350px] rounded-xl lg:rounded-3xl border cursor-pointer transition-all group flex flex-col overflow-hidden ${isDark
              ? "bg-[#18181b] border-white/5 shadow-xl hover:border-white/20 hover:bg-[#1c1c20]"
              : "bg-white border-[#e3e3e3] shadow-sm hover:border-[#D7D7D7] hover:shadow-md"
              }`}
          >
            {/* Top Section */}
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="shrink-0">
                    <FolderOpen
                      className="text-[#E8D1AB] fill-[#E8D1AB]/20"
                      size={24}
                    />
                  </div>
                  <div className="min-w-0 flex flex-col items-start">
                    <h3
                      className={`font-semibold text-sm leading-tight truncate transition-colors ${isDark ? "text-white" : "text-black"}`}
                      title={workspace.title}
                    >
                      {workspace.title}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? "text-[#E8D1AB]/60" : "text-[#000000]"}`}>
                      {String(workspace.fileCount).padStart(2, "0")} Files
                    </p>
                  </div>
                </div>
                <ExternalLink className={`mt-1 shrink-0 ${isDark ? "text-white/40" : "text-black/40"}`} size={16} />
              </div>

              <div className="mt-4 flex min-w-0 flex-nowrap items-center gap-2">
                <span className={`min-w-0 max-w-[170px] shrink truncate rounded-full border px-4 py-1.5 text-xs font-medium ${isDark
                  ? "border-white/5 bg-black/40 text-white"
                  : "border-[#F0F0F0] bg-[#F0F0F0] text-[#929292]"
                  }`}>
                  {workspace.category}
                </span>
                <span className={`shrink-0 px-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap bg-[#D4FFE4] text-[#16A34A] border border-[#6ce9a6]/20`}>
                  <LinkIcon size={16} />
                  Linked
                </span>
                <span className={`shrink-0 px-2 py-1.5 rounded-full text-xs font-medium border text-[#E8D1AB] bg-[#1A1A1A] border-white/5`}>
                  View Only
                </span>
              </div>
            </div>

            <div className={`mt-auto flex items-center p-5 gap-3 border-t ${isDark ? "border-t-white/10" : "border-t-[#D7D7D7]"}`}>
              <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-[#000] text-base">
                {workspace.userInitials}
              </div>
              <span className={`text-sm ${isDark ? "text-[#CDC5C5]" : "text-[#000000]"}`}>
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
        <div className={`border rounded-lg lg:rounded-2xl min-h-[280px] flex items-center justify-center ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"}`}>
          <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/50"}`} size={28} />
        </div>
      );
    }

    const filteredPhaseCards = phaseCards.filter((phase) =>
      phase.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    return (
      <div className="space-y-4 lg:space-y-8">
        <div>
          <div className="mb-3 lg:mb-5 flex items-center justify-end">
            {canUploadInSelectedPhase ? (
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className={`border transition-colors ${isDark
                  ? "border-white/20 bg-[#202020] text-white hover:bg-white/10"
                  : "border-black/15 bg-white text-black hover:bg-zinc-50 shadow-sm"
                  }`}
              >
                <Upload size={18} /> Upload Files
              </Button>
            ) : null}
          </div>
          <div className="flex items-start gap-5 mb-2 lg:mb-6">
            <div className={`h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl flex items-center justify-center text-lg lg:text-[30px] font-medium transition-colors ${isDark ? "bg-[#C8E1FF] text-black" : "bg-[#DDEBFF] text-black shadow-inner"
              }`}>
              {selectedWorkspace.userInitials}
            </div>
            <div className={`min-w-0 max-w-3xl flex-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              <div className="flex flex-row lg:items-center gap-2">
                <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                  {selectedWorkspace.title}
                </h1>

                {/* Project Status Pill */}
                <span className={`px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs lg:font-medium border h-fit w-fit transition-colors ${isDark
                  ? "bg-[#D4FFE4] text-[#16A34A] border-[#6ce9a6]/20"
                  : "bg-[#E6FBF0] text-[#15803D] border-[#15803D]/10"
                  }`}>
                  Active Project
                </span>
              </div>

              {/* Project Code Row */}
              <p className={`text-xs lg:text-sm mt-0.5 transition-colors ${isDark ? "text-[#D0D0D0]" : "text-zinc-600"
                }`}>
                <span className={isDark ? "text-[#AAA7A7]" : "text-zinc-400"}>Project Code: </span>
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
            <div className={`mb-6 rounded-xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#141414] p-4" : "border-black/5 bg-white shadow-xs p-4"
              }`}>
              <p className={`mb-3 text-sm font-medium transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"
                }`}>
                Your matched photos ({faceMatches.length})
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {faceMatches.map((match) => (
                  <div
                    key={match.path}
                    className={`overflow-hidden rounded-lg border text-left transition-all duration-300 ${isDark ? "border-white/10 bg-black/20" : "border-black/5 bg-zinc-100/70"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenMatchedImage(match)}
                      className="w-full text-left"
                    >
                      {match.url ? (
                        <div className={`aspect-23/18 w-full flex items-center justify-center transition-colors ${isDark ? "bg-[#0f0f0f]" : "bg-zinc-200"
                          }`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={match.url}
                            alt="Matched face result"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className={`flex aspect-23/18 w-full items-center justify-center text-xs transition-colors ${isDark ? "text-white/50 bg-[#0f0f0f]" : "text-black/40 bg-zinc-200"
                          }`}>
                          Preview unavailable
                        </div>
                      )}
                    </button>

                    <div className={`p-2 text-xs flex flex-col items-start gap-2 transition-colors ${isDark ? "text-white/70" : "text-zinc-700"
                      }`}>
                      <span>
                        Confidence: {Math.round((match.confidence || 0) * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadMatchedImage(match)}
                        className={`inline-flex items-center gap-1 rounded-md border mt-2 text-xs px-2 py-1 transition-all ${isDark
                          ? "border-white/15 text-white/85 hover:bg-white/10"
                          : "border-black/15 text-zinc-800 bg-white hover:bg-zinc-50"
                          }`}
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
              isDark={isDark}
            />
          )}
        </div>
      </div>
    );
  };

  const renderPhaseBrowser = () => {
    if (isPhaseLoading) {
      return (
        <div className={`border rounded-lg lg:rounded-2xl min-h-[280px] flex items-center justify-center ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"}`}>
          <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/50"}`} size={28} />
        </div>
      );
    }

    return (
      <div className="space-y-4 lg:space-y-8">
        <div>
          <div className="flex items-start gap-5 mb-2 lg:mb-6">
            {/* Initials Placeholder Avatar */}
            <div className={`h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl flex items-center justify-center text-lg lg:text-[30px] font-medium transition-colors ${isDark ? "bg-[#C8E1FF] text-black" : "bg-[#DDEBFF] text-black"
              }`}>
              {selectedWorkspace?.userInitials}
            </div>

            {/* Metadata Details Area */}
            <div className={`min-w-0 max-w-3xl flex-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              <div className="flex flex-row flex-wrap lg:items-center gap-2">
                <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                  {selectedWorkspace?.title}
                </h1>
                <span
                  className={`px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs font-medium border flex items-center gap-1.5 h-fit w-fit transition-colors ${selectedPhase === "post"
                    ? isDark
                      ? "bg-[#E8D2FB] text-[#540B94] border-white/5"
                      : "bg-[#F3E8FF] text-[#540B94] border-black/5"
                    : isDark
                      ? "bg-[#FDF4FF] text-[#C026D3] border-white/5"
                      : "bg-[#FCE7F3] text-[#9D174D] border-black/5"
                    }`}
                >
                  {selectedPhase === "post" ? "Post Production" : "Pre Production"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${canUploadInSelectedPhase
                    ? isDark
                      ? "bg-[#D4FFE4] text-[#16A34A] border-[#6ce9a6]/20"
                      : "bg-[#E6FBF0] text-[#15803D] border-[#15803D]/10"
                    : isDark
                      ? "bg-[#1A1A1A] text-[#E8D1AB] border-white/5"
                      : "bg-black/[0.04] text-[#B38F43] border-black/5"
                    }`}
                >
                  {canUploadInSelectedPhase ? "Upload Enabled" : "View Only"}
                </span>
              </div>

              {/* Unique Identifier String */}
              <p className={`text-xs lg:text-sm mt-0.5 transition-colors ${isDark ? "text-[#D0D0D0]" : "text-black/70"
                }`}>
                <span className={isDark ? "text-[#AAA7A7]" : "text-black/40"}>Project Code: </span>
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

        {
          filteredFiles.length > 0 ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  const nextMode = !isSelectionMode;
                  setIsSelectionMode(nextMode);
                  if (!nextMode) setSelectedFilePaths([]);
                }}
                className={`gap-2 h-10 px-4 rounded-lg border transition-all ${isSelectionMode
                  ? "bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90"
                  : isDark
                    ? "bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20"
                    : "bg-white text-black/70 border-black/10 hover:text-black hover:bg-black/[0.02] hover:border-black/20 shadow-xs"
                  }`}
              >
                <CheckSquare size={18} />
                <span>{isSelectionMode ? "Cancel" : "Select"}</span>
              </Button>
            </div>
          ) : null
        }

        {
          canRunFaceScan && faceMatches.length > 0 ? (
            <div className={`rounded-lg lg:rounded-xl border transition-all duration-300 p-4 ${isDark ? "border-white/10 bg-[#141414]" : "border-black/5 bg-white"}`}>
              <p className={`mb-3 text-sm font-medium transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"}`}>
                Your matched photos ({faceMatches.length})
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {faceMatches.map((match) => (
                  <div
                    key={match.path}
                    className={`overflow-hidden rounded-lg border text-left transition-all duration-300 ${isDark ? "border-white/10 bg-black/20" : "border-black/5 bg-black/[0.02]"}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenMatchedImage(match)}
                      className="w-full text-left"
                    >
                      {match.url ? (
                        <div className={`aspect-23/18 w-full flex items-center justify-center transition-colors ${isDark ? "bg-[#0f0f0f]" : "bg-black/[0.06]"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={match.url}
                            alt="Matched face result"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className={`flex aspect-23/18 w-full items-center justify-center text-xs transition-colors ${isDark ? "text-white/50 bg-[#0f0f0f]" : "text-black/40 bg-black/[0.06]"}`}>
                          Preview unavailable
                        </div>
                      )}
                    </button>

                    <div className={`p-2 text-xs flex flex-col items-start gap-2 transition-colors ${isDark ? "text-white/70" : "text-black/80"}`}>
                      <span>
                        Confidence: {Math.round((match.confidence || 0) * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadMatchedImage(match)}
                        className={`inline-flex items-center gap-1 rounded-md border text-xs px-2 py-1 transition-all ${isDark
                          ? "border-white/15 text-white/85 hover:bg-white/10"
                          : "border-black/15 text-black bg-white hover:bg-black/[0.02] shadow-2xs"
                          }`}
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        }

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
                      onOpen={() => handleOpenFile(file)}
                      onDownload={() => handleDownloadFile(file)}
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
                      className={`border ${isDark ? "border-white/20 bg-[#202020] text-white hover:bg-white/10" : "border-black/20 bg-[#F0F0F0] text-black hover:bg-black/10"}`}
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
                isDark={isDark}
              />
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className="space-y-4 lg:space-y-8"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className={`w-full transition-colors duration-200 ${isDark ? "text-white" : "text-black"}`}>
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">
            File Manager
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#727272]"}`}>
            Live project folders from your booked and paid shoots.
          </p>
        </div>
        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {(selectedWorkspace || selectedPhase) && (
        <button
          onClick={handleBack}
          className={`transition-colors flex items-center gap-2 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/80"}`}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      <div className={`flex flex-wrap items-center gap-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1;
          return (
            <React.Fragment key={`${item}-${index}`}>
              {index > 0 && (
                <span className={`transition-colors ${isDark ? "text-white/30" : "text-black/25"}`}>
                  /
                </span>
              )}
              <span className={`transition-colors font-medium ${isLast ? isDark ? "text-white" : "text-black" : ""}`}>
                {item}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {!selectedWorkspace && (
        <>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full mb-4 lg:mb-9">
            <div className={`w-full lg:w-fit overflow-x-auto no-scrollbar scroll-smooth transition-colors duration-200 ${isDark ? "bg-[#171717]" : "bg-white"} flex flex-nowrap items-center gap-1.5 lg:gap-3 p-1.5 rounded-xl`}>
              {[
                { name: "All Files", icon: FolderOpen },
                { name: "Linked to folders", icon: Link },
                { name: "Recent", icon: History },
                // { name: "Shared", icon: Share2 },
                // { name: "Trash", icon: Trash2 },
              ].map((tab) => {
                const isActive = selectedTab === tab.name;
                return (
                  <Button
                    key={tab.name}
                    onClick={() => setSelectedTab(tab.name)}
                    className={`flex items-center gap-2 px-4 lg:px-6 py-2 text-sm font-medium transition-all rounded-lg h-10 lg:h-12 shrink-0 whitespace-nowrap ${isActive
                      ? isDark
                        ? "bg-white text-black shadow-lg scale-[1.02]"
                        : "bg-black text-[#E8D1AB] shadow-md scale-[1.02] hover:bg-black/90"
                      : isDark
                        ? "bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
                        : "bg-transparent text-[#B1B1B1] hover:bg-black/5 hover:text-black"
                      }`}
                  >
                    <tab.icon size={20} className="shrink-0" />
                    <span className="leading-none">{tab.name}</span>
                  </Button>
                )
              })}
            </div>

            <div className={`w-full lg:w-auto flex justify-between lg:justify-end items-center gap-2 text-sm lg:text-base px-4 py-2 rounded-lg border transition-colors duration-200 ${isDark
              ? "text-[#8F8F8F] bg-[#171717]/50 border-white/5"
              : "text-[#000000] bg-white border-white"
              }`}>
              <span className="whitespace-nowrap">Projects:</span>
              <p className="font-medium">
                <span className="text-[#E8D1AB]">{workspaces.length}</span>
                <span className={`mx-1 ${isDark ? "text-[#8F8F8F]" : "text-[#000000]"}`}>total</span>
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
            <div className="relative flex-1 max-w-xl">
              <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-[#9F9FA9]"}`} />
              <input
                type="text"
                placeholder="Search folder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-white border-[#E3E3E3] text-black placeholder:text-[#9F9FA9] focus:ring-[#D7D7D7] focus:border-[#D7D7D7]"
                  }`}
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
                  className={`flex items-center gap-2 p-2 h-8 rounded-lg border transition-colors ${isDark
                    ? "bg-[#202020] border-white/10 text-white hover:bg-[#2c2c2c]"
                    : "bg-white border-[#D7D7D7] text-black hover:bg-[#F4F5F7]"
                    }`}
                >
                  {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
                </Button>

                {isViewMenuOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-[50] overflow-hidden transition-colors ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-[#D7D7D7]"}`}>
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${viewMode === "grid"
                        ? isDark ? "bg-white/10 text-white" : "bg-black/5 text-black font-medium"
                        : isDark ? "text-white/60 hover:bg-white/5" : "text-[#727272] hover:bg-black/5"}
                      `}
                    >
                      <Grid3X3 size={18} />
                      Grid View
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${viewMode === "list"
                        ? isDark ? "bg-white/10 text-white" : "bg-black/5 text-black font-medium"
                        : isDark ? "text-white/60 hover:bg-white/5" : "text-[#727272] hover:bg-black/5"}
                      `}
                    >
                      <List size={18} />
                      List View
                    </button>
                  </div>
                )}
              </div>

              <div className={`hidden lg:flex flex-wrap items-center rounded-lg w-full md:w-fit border transition-colors ${isDark ? "bg-[#202020] border-white/5" : "bg-white border-white"}`}>
                <Button
                  onClick={() => setViewMode("grid")}
                  className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === "grid"
                    ? isDark
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white"
                      : "bg-transparent text-black hover:text-black/80"
                    }`}
                >
                  <Grid3X3 size={20} />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === "list"
                    ? isDark
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
                    : isDark
                      ? "bg-transparent text-white/40 hover:text-white"
                      : "bg-transparent text-black hover:text-black/80"
                    }`}
                >
                  <List size={20} />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedWorkspace && (
        <div className="relative max-w-xl">
          <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-[#9F9FA9]"}`} />
          <input
            type="text"
            placeholder={
              selectedPhase ? "Search files or folders..." : "Search project folders..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
              ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
              : "bg-white border-[#E3E3E3] text-black placeholder:text-[#9F9FA9] focus:ring-[#D7D7D7] focus:border-[#D7D7D7]"
              }`}
          />
        </div>
      )}

      {selectedWorkspace ? (
        selectedPhase ? renderPhaseBrowser() : renderWorkspacePhases()
      ) : (
        renderRoot()
      )}

      {selectedFilePaths.length > 0 ? (
        <div className="fixed bottom-10 left-1/2 z-[100] w-full max-w-xl -translate-x-1/2 px-4">
          <div className={`flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-2xl transition-all duration-300 ${isDark
            ? "border-[#E8D1AB]/50 bg-[#171717]"
            : "border-[#B38F43]/40 bg-white"
            }`}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D1AB] text-sm font-bold text-black">
                {selectedFilePaths.length}
              </div>
              <span className={`font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>Files selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={`gap-2 transition-colors ${isDark
                  ? "text-white/70 hover:text-white"
                  : "text-black/60 hover:text-black"
                  }`}
                onClick={() => {
                  setSelectedFilePaths([]);
                  setIsSelectionMode(false);
                }}
              >
                Clear
              </Button>

              {/* Structural Vertical Segment Separator */}
              <div className={`mx-1 h-6 w-[1px] transition-colors ${isDark ? "bg-white/10" : "bg-black/10"
                }`} />

              <Button
                className={`gap-2 border transition-all ${isDark
                  ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                  : "border-black/10 bg-black text-white hover:bg-black/90 shadow-sm"
                  }`}
                onClick={handleBatchDownload}
              >
                <Download size={18} />
                Download
              </Button>
            </div>

            <button
              onClick={() => {
                setSelectedFilePaths([]);
                setIsSelectionMode(false);
              }}
              className={`transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>
      ) : null}

      {isCameraOpen ? (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? "bg-black/85" : "bg-black/75 backdrop-blur-xs"
          }`}>
          <div className={`w-full max-w-xl overflow-hidden rounded-lg lg:rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#111111]" : "border-black/15 bg-[#F0f0f0]"}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b px-4 py-3 transition-colors ${isDark ? "border-white/10" : "border-white/5 bg-white/5"
              }`}>
              <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Face Scan Camera</h3>
              <button
                type="button"
                onClick={handleCloseCamera}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${isDark
                  ? "border-white/10 text-white/80 hover:bg-white/10"
                  : "border-black/10 text-black hover:bg-black/10"
                  }`}
              >
                Close
              </button>
            </div>

            {/* Camera Body Canvas Workspace */}
            <div className="p-4">
              {cameraError && !isCameraProcessing ? (
                <div className={`rounded-lg border p-3 text-sm mb-3 transition-colors ${isDark
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-red-500/20 bg-red-500/15 text-red-100"
                  }`}>
                  {cameraError}
                </div>
              ) : null}

              {isCameraProcessing ? (
                <div className={`flex aspect-video w-full items-center justify-center rounded-lg border transition-colors ${isDark ? "bg-black border-white/10" : "bg-white border-black/5"}`}>
                  <div className="text-center">
                    <Loader2 className={`mx-auto animate-spin ${isDark ? "text-white/70" : "text-black/70"}`} size={28} />
                    <p className={`mt-2 text-xs ${isDark ? "text-white/65" : "text-black/60"}`}>Scanning your face...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`aspect-video w-full object-cover rounded-lg border transition-colors ${isDark ? "bg-black border-white/10" : "bg-white border-black/5"}`}
                />
              )}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  disabled={isCameraProcessing}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-all ${isCameraProcessing
                    ? "cursor-not-allowed opacity-40 border-white/5 text-white/40"
                    : isDark
                      ? "border-white/15 text-white hover:bg-white/10"
                      : "border-black/5 text-black hover:bg-black/10"
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
        isDark={isDark}
      />

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerMetaId(null);
        }}
        fileName={viewerName}
        fileUrl={viewerUrl}
        contentType={viewerType}
        fileMetaId={viewerMetaId}
        isDark={isDark}
      />
    </div>
  );
}
