"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Camera, ChevronDown, ChevronUp, Download, Loader2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import { affiliateApi } from "@/lib/api";
import { fileManagerApi, isCommonEventWorkspaceId } from "@/lib/fileManagerApi";

interface WorkspaceItem {
  externalId: string;
  title: string;
  isCommonEvent: boolean;
}

interface FaceMatchItem {
  path: string;
  score: number;
  confidence: number;
  workspaceTitle: string;
  workspaceId: string;
  url?: string;
}

interface FaceIndexStatusItem {
  externalId: string;
  state: "ready" | "partial" | "not_indexed" | "indexing" | "empty";
  totalCandidates: number;
  readyCandidates: number;
  skippedCandidates?: number;
  indexingCandidates: number;
  failedCandidates: number;
  pendingCandidates: number;
  coverage: number;
}

interface ProjectLite {
  project_name?: string;
  stream_project_booking_id?: string | number;
  booking_id?: string | number;
}

const FAST_SCAN_THRESHOLD = 0.78;
const DEEP_SCAN_THRESHOLD = 0.74;
const FAST_SCAN_CANDIDATE_LIMIT = 90;
const FAST_SCAN_FALLBACK_CANDIDATE_LIMIT = 120;
const COLD_SCAN_CANDIDATE_LIMIT = 70;
const DEEP_SCAN_CANDIDATE_LIMIT = 220;
const DEEP_SCAN_FALLBACK_CANDIDATE_LIMIT = 320;
const FAST_SCAN_MAX_RESULTS = 60;
const PREVIEW_BATCH_LIMIT = 12;
const QUERY_IMAGE_MAX_EDGE = 1600;
const QUERY_IMAGE_QUALITY = 0.92;
const BACKGROUND_REINDEX_BATCH_LIMIT = 240;

const getScaledDimensions = (width: number, height: number, maxEdge: number) => {
  if (!width || !height) return { width: maxEdge, height: maxEdge };
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) return { width, height };
  const ratio = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const dataUrlToBase64 = (dataUrl: string) => (dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);

const optimizeDataUrlToBase64 = (dataUrl: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const { width, height } = getScaledDimensions(
        image.naturalWidth,
        image.naturalHeight,
        QUERY_IMAGE_MAX_EDGE
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Failed to initialize image processing."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const optimized = canvas.toDataURL("image/jpeg", QUERY_IMAGE_QUALITY);
      resolve(dataUrlToBase64(optimized));
    };
    image.onerror = () => reject(new Error("Failed to process selected image"));
    image.src = dataUrl;
  });

const fileToOptimizedBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result || "");
        if (!dataUrl) {
          reject(new Error("Failed to read selected image"));
          return;
        }
        const optimizedBase64 = await optimizeDataUrlToBase64(dataUrl);
        resolve(optimizedBase64);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed to optimize selected image"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read selected image"));
    reader.readAsDataURL(file);
  });

export default function AffiliateFindYourselfPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState("");
  const [workspaceIndexStatusMap, setWorkspaceIndexStatusMap] = useState<
    Record<string, FaceIndexStatusItem>
  >({});
  const [isIndexStatusLoading, setIsIndexStatusLoading] = useState(false);
  const [faceMatches, setFaceMatches] = useState<FaceMatchItem[]>([]);
  const [isHydratingPreviews, setIsHydratingPreviews] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerMetaId, setViewerMetaId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraProcessing, setIsCameraProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const activeScanIdRef = useRef(0);
  const workspaceDropdownRef = useRef<HTMLDivElement | null>(null);
  const autoReindexTriggeredRef = useRef<Set<string>>(new Set());

  const resultCount = useMemo(() => faceMatches.length, [faceMatches]);
  const selectedWorkspaceCount = useMemo(() => selectedWorkspaceIds.length, [selectedWorkspaceIds]);
  const canStartScan = !loading && !isFaceScanning && selectedWorkspaceCount > 0;
  const selectedWorkspaceIndexSummary = useMemo(() => {
    const selectedStatuses = selectedWorkspaceIds
      .map((workspaceId) => workspaceIndexStatusMap[workspaceId])
      .filter(Boolean);

    if (!selectedStatuses.length) {
      return {
        ready: 0,
        preparing: selectedWorkspaceIds.length,
      };
    }

    const ready = selectedStatuses.filter((item) => item.state === "ready").length;
    return { ready, preparing: Math.max(0, selectedWorkspaceIds.length - ready) };
  }, [selectedWorkspaceIds, workspaceIndexStatusMap]);
  const filteredWorkspaceOptions = useMemo(() => {
    if (!workspaceSearchTerm.trim()) return workspaces;
    const term = workspaceSearchTerm.trim().toLowerCase();
    return workspaces.filter((workspace) => workspace.title.toLowerCase().includes(term));
  }, [workspaceSearchTerm, workspaces]);
  const scanWorkspaces = useMemo(
    () => workspaces.filter((workspace) => selectedWorkspaceIds.includes(workspace.externalId)),
    [selectedWorkspaceIds, workspaces]
  );

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
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("revure_token");
        if (!token) {
          setWorkspaces([]);
          return;
        }

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
          const bookingId = String(project?.stream_project_booking_id || project?.booking_id || "");
          if (bookingId) {
            projectMap.set(bookingId, project);
          }
        });

        setWorkspaces(
          (externalWorkspaces || [])
            .filter((item) => {
              const externalId = String(item.externalId || "");
              return isCommonEventWorkspaceId(externalId) || projectMap.has(externalId);
            })
            .map((item) => ({
              externalId: String(item.externalId || ""),
              title: String(
                item.folderName ||
                projectMap.get(String(item.externalId || ""))?.project_name ||
                (isCommonEventWorkspaceId(String(item.externalId || "")) ? "Common Event" : item.externalId) ||
                "Folder"
              ),
              isCommonEvent: isCommonEventWorkspaceId(String(item.externalId || "")),
            }))
            .filter((item) => item.externalId)
        );
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to load folders");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!workspaces.length) {
      setSelectedWorkspaceIds([]);
      return;
    }

    setSelectedWorkspaceIds((previous) => {
      const availableIds = new Set(workspaces.map((workspace) => workspace.externalId));
      return previous.filter((id) => availableIds.has(id));
    });
  }, [workspaces]);

  useEffect(() => {
    const loadSelectedWorkspaceStatus = async () => {
      if (!selectedWorkspaceIds.length) {
        setWorkspaceIndexStatusMap({});
        return;
      }

      setIsIndexStatusLoading(true);
      try {
        const statusResults = await Promise.allSettled(
          selectedWorkspaceIds.map((workspaceId) =>
            fileManagerApi.getFaceScanIndexStatus(workspaceId)
          )
        );

        const nextMap: Record<string, FaceIndexStatusItem> = {};
        statusResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const row = result.value;
          if (!row?.externalId) return;
          nextMap[row.externalId] = {
            externalId: row.externalId,
            state: row.state || "not_indexed",
            totalCandidates: Number(row.totalCandidates || 0),
            readyCandidates: Number(row.readyCandidates || 0),
            skippedCandidates: Number(row.skippedCandidates || 0),
            indexingCandidates: Number(row.indexingCandidates || 0),
            failedCandidates: Number(row.failedCandidates || 0),
            pendingCandidates: Number(row.pendingCandidates || 0),
            coverage: Number(row.coverage || 0),
          };
        });
        setWorkspaceIndexStatusMap(nextMap);
      } finally {
        setIsIndexStatusLoading(false);
      }
    };

    void loadSelectedWorkspaceStatus();
  }, [selectedWorkspaceIds]);

  useEffect(() => {
    if (!selectedWorkspaceIds.length) return;
    selectedWorkspaceIds.forEach((workspaceId) => {
      if (autoReindexTriggeredRef.current.has(workspaceId)) return;

      const status = workspaceIndexStatusMap[workspaceId];
      if (!status || status.state === "ready" || status.totalCandidates === 0) return;

      autoReindexTriggeredRef.current.add(workspaceId);
      void fileManagerApi
        .reindexFaceEmbeddings({
          externalId: workspaceId,
          candidateLimit: BACKGROUND_REINDEX_BATCH_LIMIT,
          concurrency: 2,
        })
        .catch(() => {
          autoReindexTriggeredRef.current.delete(workspaceId);
        });
    });
  }, [selectedWorkspaceIds, workspaceIndexStatusMap]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!workspaceDropdownRef.current) return;
      if (workspaceDropdownRef.current.contains(event.target as Node)) return;
      setIsWorkspaceDropdownOpen(false);
    };

    if (isWorkspaceDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isWorkspaceDropdownOpen]);

  useEffect(() => {
    if (!isCameraOpen) return;
    if (!cameraStreamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => undefined);
  }, [isCameraOpen]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  const hydratePreviewUrls = useCallback(async (scanId: number, items: FaceMatchItem[]) => {
    if (!items.length) return;

    setIsHydratingPreviews(true);
    try {
      const previewEntries = await Promise.all(
        items.map(async (item) => {
          try {
            const view = await fileManagerApi.getExternalFileViewUrl(item.path);
            return [item.path, view?.url || ""] as const;
          } catch {
            return [item.path, ""] as const;
          }
        })
      );

      if (activeScanIdRef.current !== scanId) return;
      const previewMap = new Map(previewEntries);
      setFaceMatches((previous) =>
        previous.map((item) => ({
          ...item,
          url: previewMap.get(item.path) ?? item.url ?? "",
        }))
      );
    } finally {
      if (activeScanIdRef.current === scanId) {
        setIsHydratingPreviews(false);
      }
    }
  }, []);

  const runFaceScanInSelectedFolders = async (scanImageBase64: string) => {
    if (!scanWorkspaces.length) {
      toast.error("No folders selected for scanning.");
      return;
    }

    setIsFaceScanning(true);
    setIsHydratingPreviews(false);
    setFaceMatches([]);
    const scanId = Date.now();
    activeScanIdRef.current = scanId;

    try {
      const scanResults = await Promise.allSettled(
        scanWorkspaces.map(async (workspace) => {
          const indexStatus = workspaceIndexStatusMap[workspace.externalId];
          const isColdFolder = !indexStatus || indexStatus.readyCandidates === 0;
          const fastResponse = await fileManagerApi.searchFaceMatches({
            externalId: workspace.externalId,
            scanImageBase64,
            threshold: FAST_SCAN_THRESHOLD,
            minScore: FAST_SCAN_THRESHOLD,
            maxResults: FAST_SCAN_MAX_RESULTS,
            candidateLimit: isColdFolder ? COLD_SCAN_CANDIDATE_LIMIT : FAST_SCAN_CANDIDATE_LIMIT,
            fallbackCandidateLimit: FAST_SCAN_FALLBACK_CANDIDATE_LIMIT,
            backgroundReindex: true,
            backgroundBatchLimit: BACKGROUND_REINDEX_BATCH_LIMIT,
            backgroundConcurrency: 2,
          });

          const fastMatches = (fastResponse?.matches || []).map((match) => ({
            path: String(match.path || ""),
            score: Number(match.score || 0),
            confidence: Number(match.confidence || match.score || 0),
            workspaceTitle: workspace.title,
            workspaceId: workspace.externalId,
          }));

          if (fastMatches.length >= 2) {
            return {
              matches: fastMatches,
              noFaceDetectedInScanImage: Boolean(fastResponse?.noFaceDetectedInScanImage),
            };
          }

          const deepResponse = await fileManagerApi.searchFaceMatches({
            externalId: workspace.externalId,
            scanImageBase64,
            threshold: DEEP_SCAN_THRESHOLD,
            minScore: DEEP_SCAN_THRESHOLD,
            maxResults: FAST_SCAN_MAX_RESULTS,
            candidateLimit: DEEP_SCAN_CANDIDATE_LIMIT,
            fallbackCandidateLimit: DEEP_SCAN_FALLBACK_CANDIDATE_LIMIT,
            backgroundReindex: true,
            backgroundBatchLimit: BACKGROUND_REINDEX_BATCH_LIMIT,
            backgroundConcurrency: 2,
          });

          const deepMatches = (deepResponse?.matches || []).map((match) => ({
            path: String(match.path || ""),
            score: Number(match.score || 0),
            confidence: Number(match.confidence || match.score || 0),
            workspaceTitle: workspace.title,
            workspaceId: workspace.externalId,
          }));

          return {
            matches: deepMatches.length ? deepMatches : fastMatches,
            noFaceDetectedInScanImage:
              Boolean(deepResponse?.noFaceDetectedInScanImage) ||
              Boolean(fastResponse?.noFaceDetectedInScanImage),
          };
        })
      );

      const merged: FaceMatchItem[] = [];
      let hasNoFaceDetection = false;
      scanResults.forEach((result) => {
        if (result.status === "fulfilled") {
          merged.push(...(result.value.matches || []).filter((item) => item.path));
          if (result.value.noFaceDetectedInScanImage) {
            hasNoFaceDetection = true;
          }
        }
      });

      if (!merged.length) {
        setFaceMatches([]);
        if (hasNoFaceDetection) {
          toast.error("Face not detected clearly. Please use a clear close-up face photo.");
        } else {
          toast.info("No matching photos found in selected folders.");
        }
        return;
      }

      const dedupedByPath = new Map<string, FaceMatchItem>();
      merged.forEach((item) => {
        const existing = dedupedByPath.get(item.path);
        if (!existing || item.confidence > existing.confidence) {
          dedupedByPath.set(item.path, item);
        }
      });

      const deduped = Array.from(dedupedByPath.values())
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, FAST_SCAN_MAX_RESULTS);

      setFaceMatches(deduped);
      toast.success(`Found ${deduped.length} matching photo${deduped.length === 1 ? "" : "s"}`);
      void hydratePreviewUrls(scanId, deduped.slice(0, PREVIEW_BATCH_LIMIT));
      if (selectedWorkspaceIds.length) {
        const updatedStatuses = await Promise.allSettled(
          selectedWorkspaceIds.map((workspaceId) => fileManagerApi.getFaceScanIndexStatus(workspaceId))
        );
        const nextStatusMap: Record<string, FaceIndexStatusItem> = {};
        updatedStatuses.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const row = result.value;
          if (!row?.externalId) return;
          nextStatusMap[row.externalId] = {
            externalId: row.externalId,
            state: row.state || "not_indexed",
            totalCandidates: Number(row.totalCandidates || 0),
            readyCandidates: Number(row.readyCandidates || 0),
            skippedCandidates: Number(row.skippedCandidates || 0),
            indexingCandidates: Number(row.indexingCandidates || 0),
            failedCandidates: Number(row.failedCandidates || 0),
            pendingCandidates: Number(row.pendingCandidates || 0),
            coverage: Number(row.coverage || 0),
          };
        });
        setWorkspaceIndexStatusMap(nextStatusMap);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Face scan failed");
    } finally {
      setIsFaceScanning(false);
    }
  };

  const handleToggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceIds((previous) => {
      if (previous.includes(workspaceId)) {
        return previous.filter((id) => id !== workspaceId);
      }
      return [...previous, workspaceId];
    });
  };

  const handleSelectAllWorkspaces = () => {
    setSelectedWorkspaceIds(workspaces.map((workspace) => workspace.externalId));
  };

  const handleFaceScanFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image for face scan.");
      return;
    }

    const scanImageBase64 = await fileToOptimizedBase64(file);
    await runFaceScanInSelectedFolders(scanImageBase64);
  };

  const startCameraStream = async (facingMode: "user" | "environment") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
      audio: false,
    });

    cameraStreamRef.current = stream;
    setCameraFacingMode(facingMode);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    setCameraFacingMode("user");
    setIsCameraOpen(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      await startCameraStream("user");
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

  const handleSwitchCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia || isCameraProcessing) return;

    const nextFacingMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraError(null);

    stopCamera();

    try {
      await startCameraStream(nextFacingMode);
    } catch {
      try {
        await startCameraStream(cameraFacingMode);
        setCameraError("This device/browser does not support switching camera.");
      } catch {
        setCameraError("Unable to switch camera on this device.");
      }
    }
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

    const { width: scaledWidth, height: scaledHeight } = getScaledDimensions(
      width,
      height,
      QUERY_IMAGE_MAX_EDGE
    );
    const canvas = document.createElement("canvas");
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      toast.error("Unable to process camera capture.");
      return;
    }

    context.drawImage(video, 0, 0, scaledWidth, scaledHeight);
    const dataUrl = canvas.toDataURL("image/jpeg", QUERY_IMAGE_QUALITY);
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";

    if (!base64) {
      toast.error("Failed to capture image from camera.");
      return;
    }

    setIsCameraProcessing(true);
    stopCamera();
    try {
      await runFaceScanInSelectedFolders(base64);
      handleCloseCamera();
    } finally {
      setIsCameraProcessing(false);
    }
  };

  const handleOpenMatchedImage = async (match: FaceMatchItem) => {
    let previewUrl = match.url || "";
    if (!previewUrl) {
      try {
        const response = await fileManagerApi.getExternalFileViewUrl(match.path);
        previewUrl = response?.url || "";
        if (previewUrl) {
          setFaceMatches((previous) =>
            previous.map((item) => (item.path === match.path ? { ...item, url: previewUrl } : item))
          );
        }
      } catch {
        previewUrl = "";
      }
    }

    if (!previewUrl) {
      toast.error("Preview unavailable for this photo.");
      return;
    }

    setViewerOpen(true);
    setViewerName(match.path.split("/").pop() || "Matched Image");
    setViewerType("image/*");
    setViewerMetaId(match.path);
    setViewerUrl(previewUrl);
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

  return (
    <>
      <Topbar pathname={pathname} />
      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="space-y-2">
          <h1 className="text-white text-lg lg:text-2xl font-semibold">Find Yourself</h1>
          <p className="text-white/70 text-xs lg:text-sm">
            Upload your photo or use camera, then we run a fast scan on your selected folders.
          </p>
          <p className="text-[#E8D1AB] text-xs">
            Your available folders: {loading ? "Loading..." : workspaces.length}
          </p>
          <p className="text-white/50 text-[11px]">
            Old folders are auto-indexed in background while you scan, so each next scan gets faster.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-6">
          <div className="flex flex-col gap-2" ref={workspaceDropdownRef}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full max-w-xl">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Scan Folders
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceDropdownOpen((previous) => !previous);
                    if (!isWorkspaceDropdownOpen) setWorkspaceSearchTerm("");
                  }}
                  disabled={isFaceScanning || loading}
                  className={`h-14 w-full relative rounded-2xl px-4 py-4 flex items-center justify-between border transition-colors ${isFaceScanning || loading
                      ? "cursor-not-allowed opacity-60 border-white/20 bg-[#171717]"
                      : "cursor-pointer border-white/40 bg-[#171717]"
                    }`}
                >
                  <span className="text-sm text-white/90">
                    {selectedWorkspaceCount
                      ? `${selectedWorkspaceCount} folder${selectedWorkspaceCount === 1 ? "" : "s"} selected`
                      : "Select folders"}
                  </span>
                  {isWorkspaceDropdownOpen ? (
                    <ChevronUp className="text-white flex-shrink-0" size={18} />
                  ) : (
                    <ChevronDown className="text-white flex-shrink-0" size={18} />
                  )}
                </button>
              </div>
            </div>

            {isWorkspaceDropdownOpen ? (
              <div className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#171717] p-2">
                <div className="mb-2 px-2">
                  <input
                    type="text"
                    value={workspaceSearchTerm}
                    onChange={(event) => setWorkspaceSearchTerm(event.target.value)}
                    placeholder="Search folders..."
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#111111] px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB]"
                  />
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2 px-2">
                  <button
                    type="button"
                    onClick={handleSelectAllWorkspaces}
                    disabled={isFaceScanning || loading || !workspaces.length}
                    className={`rounded-md border border-white/15 px-2 py-1 text-[11px] ${isFaceScanning || loading || !workspaces.length
                        ? "cursor-not-allowed text-white/40 opacity-60"
                        : "text-white/80 hover:bg-white/10"
                      }`}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkspaceIds([])}
                    disabled={isFaceScanning || loading || !selectedWorkspaceCount}
                    className={`rounded-md border border-white/15 px-2 py-1 text-[11px] ${isFaceScanning || loading || !selectedWorkspaceCount
                        ? "cursor-not-allowed text-white/40 opacity-60"
                        : "text-white/80 hover:bg-white/10"
                      }`}
                  >
                    Clear
                  </button>
                </div>
                {filteredWorkspaceOptions.length ? (
                  filteredWorkspaceOptions.map((workspace) => {
                    const isSelected = selectedWorkspaceIds.includes(workspace.externalId);
                    const indexStatus = workspaceIndexStatusMap[workspace.externalId];
                    const indexLabel = indexStatus?.state === "ready" ? "Ready" : "Preparing";
                    return (
                      <button
                        key={workspace.externalId}
                        type="button"
                        onClick={() => handleToggleWorkspace(workspace.externalId)}
                        className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${isSelected ? "bg-[#FFFCE8] text-black" : "text-white/70 hover:bg-white/5"
                          }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]" : "border-white/50"
                            }`}
                        >
                          {isSelected ? <div className="h-1 w-1 rounded-full bg-black" /> : null}
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate text-sm">{workspace.title}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`shrink-0 text-[10px] ${isSelected ? "text-black/65" : "text-white/45"
                                }`}
                            >
                              {workspace.isCommonEvent ? "Common Event" : "Project"}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                                indexLabel === "Ready"
                                  ? isSelected
                                    ? "bg-black/10 text-black/70"
                                    : "bg-emerald-500/20 text-emerald-200"
                                  : isSelected
                                  ? "bg-black/10 text-black/70"
                                  : "bg-amber-500/20 text-amber-200"
                              }`}
                            >
                              {indexLabel}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-1 text-xs text-white/60">No folders available.</p>
                )}
              </div>
            ) : null}

            <p className="text-[11px] text-white/50">
              Fast scan mode: up to {FAST_SCAN_CANDIDATE_LIMIT} candidates per selected folder.
            </p>
            {selectedWorkspaceCount ? (
              <p className="text-[11px] text-[#E8D1AB]/90">
                Folder status: {selectedWorkspaceIndexSummary.ready} ready,{" "}
                {selectedWorkspaceIndexSummary.preparing} preparing
                {isIndexStatusLoading ? " (updating...)" : ""}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              id="affiliate-find-yourself-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFaceScanFile}
              disabled={!canStartScan}
            />
            <label
              htmlFor="affiliate-find-yourself-upload"
              className={`inline-flex items-center rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition ${canStartScan ? "cursor-pointer hover:bg-white/10" : "pointer-events-none opacity-60"
                }`}
            >
              {isFaceScanning ? "Scanning..." : "Upload Face Photo"}
            </label>
            <button
              type="button"
              onClick={handleOpenCamera}
              disabled={!canStartScan}
              className={`inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition ${canStartScan ? "hover:bg-white/10" : "pointer-events-none opacity-60"
                }`}
            >
              <Camera size={14} />
              Use Camera
            </button>
            {!selectedWorkspaceCount ? (
              <p className="text-xs text-[#E8D1AB]/90">Select at least one folder to start scanning.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#E8D1AB]">Matched photos</p>
            <p className="text-xs text-white/60">
              {resultCount} results {isHydratingPreviews ? "| loading previews..." : ""}
            </p>
          </div>

          {isFaceScanning ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-white/60" size={26} />
            </div>
          ) : faceMatches.length ? (
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
                        Click to load preview
                      </div>
                    )}
                  </button>
                  <div className="space-y-1 p-2 text-xs">
                    <p className="text-white/90">
                      Matches: {Math.round((match.confidence || 0) * 100)}%
                    </p>
                    <p className="text-[#E8D1AB] truncate">{match.workspaceTitle}</p>
                    <button
                      type="button"
                      onClick={() => handleDownloadMatchedImage(match)}
                      className="mt-1 inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/85 hover:bg-white/10"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-white/60">
              <Search className="mx-auto mb-2 text-white/30" size={20} />
              No matches yet. Upload or scan your face photo to start.
            </div>
          )}
        </div>
      </div>

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
              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                {isCameraProcessing ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto animate-spin text-white/70" size={28} />
                      <p className="mt-2 text-xs text-white/65">Scanning your face in selected folders...</p>
                    </div>
                  </div>
                ) : (
                  <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                )}
              </div>
              {cameraError && !isCameraProcessing ? (
                <p className="mt-3 text-xs text-red-300">{cameraError}</p>
              ) : (
                <p className="mt-3 text-xs text-white/60">
                  {isCameraProcessing
                    ? "Processing capture. Please wait..."
                    : "Keep your face centered, then capture to scan selected folders."}
                </p>
              )}
              <div className="mt-4 space-y-2">
                {isMobileViewport ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={Boolean(cameraError) || isFaceScanning || isCameraProcessing}
                      className={`rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 ${cameraError || isFaceScanning || isCameraProcessing
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/10"
                        }`}
                    >
                      {cameraFacingMode === "user" ? "Back Camera" : "Front Camera"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseCamera}
                      disabled={isCameraProcessing}
                      className={`rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 ${isCameraProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
                        }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
                <div className={`flex items-center gap-2 ${isMobileViewport ? "justify-stretch" : "justify-end"}`}>
                  <button
                    type="button"
                    onClick={handleCloseCamera}
                    disabled={isCameraProcessing}
                    className={`rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 ${isMobileViewport ? "hidden" : "inline-flex"
                      } ${isCameraProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromCamera}
                    disabled={Boolean(cameraError) || isFaceScanning || isCameraProcessing}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${isMobileViewport ? "w-full" : ""
                      } ${cameraError || isFaceScanning || isCameraProcessing
                        ? "cursor-not-allowed bg-[#E5D5B8]/40 text-black/50"
                        : "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      }`}
                  >
                    {isCameraProcessing || isFaceScanning ? "Scanning..." : "Capture & Scan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileName={viewerName}
        contentType={viewerType}
        fileUrl={viewerUrl}
        fileMetaId={viewerMetaId}
      />
    </>
  );
}
