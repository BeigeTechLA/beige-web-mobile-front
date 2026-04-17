"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Camera, Download, Loader2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import { fileManagerApi, isCommonEventWorkspaceId } from "@/lib/fileManagerApi";

interface WorkspaceItem {
  externalId: string;
  title: string;
}

interface FaceMatchItem {
  path: string;
  score: number;
  confidence: number;
  workspaceTitle: string;
  workspaceId: string;
  url?: string;
}

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

export default function AffiliateFindYourselfPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [faceMatches, setFaceMatches] = useState<FaceMatchItem[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerMetaId, setViewerMetaId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraProcessing, setIsCameraProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const resultCount = useMemo(() => faceMatches.length, [faceMatches]);

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

        const data = await fileManagerApi.listExternalWorkspaces();

        setWorkspaces(
          (data || [])
            .filter((item) => isCommonEventWorkspaceId(item.externalId))
            .map((item) => ({
              externalId: String(item.externalId || ""),
              title: String(item.folderName || item.externalId || "Common Event"),
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
    if (!isCameraOpen) return;
    if (!cameraStreamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => undefined);
  }, [isCameraOpen]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const runFaceScanInCommonEventFolders = async (scanImageBase64: string) => {
    if (!workspaces.length) {
      toast.error("No common event folders available to scan.");
      return;
    }

    setIsFaceScanning(true);
    setFaceMatches([]);

    try {
      const scanResults = await Promise.allSettled(
        workspaces.map(async (workspace) => {
            const response = await fileManagerApi.searchFaceMatches({
              externalId: workspace.externalId,
              scanImageBase64,
              threshold: 0.78,
              maxResults: 200,
            });

          const matches = response?.matches || [];
          return matches.map((match) => ({
            path: String(match.path || ""),
            score: Number(match.score || 0),
            confidence: Number(match.confidence || match.score || 0),
            workspaceTitle: workspace.title,
            workspaceId: workspace.externalId,
          }));
        })
      );

      const merged: FaceMatchItem[] = [];
      scanResults.forEach((result) => {
        if (result.status === "fulfilled") {
          merged.push(...result.value.filter((item) => item.path));
        }
      });

      if (!merged.length) {
        setFaceMatches([]);
        toast.info("No matching photos found in common event folders.");
        return;
      }

      const dedupedByPath = new Map<string, FaceMatchItem>();
      merged.forEach((item) => {
        const existing = dedupedByPath.get(item.path);
        if (!existing || item.confidence > existing.confidence) {
          dedupedByPath.set(item.path, item);
        }
      });

      const deduped = Array.from(dedupedByPath.values()).sort(
        (a, b) => b.confidence - a.confidence
      );

      const withPreview = await Promise.all(
        deduped.map(async (item) => {
          try {
            const view = await fileManagerApi.getExternalFileViewUrl(item.path);
            return { ...item, url: view?.url || "" };
          } catch {
            return { ...item, url: "" };
          }
        })
      );

      setFaceMatches(withPreview);
      toast.success(
        `Found ${withPreview.length} matching photo${withPreview.length === 1 ? "" : "s"} in common event folders`
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Face scan failed");
    } finally {
      setIsFaceScanning(false);
    }
  };

  const handleFaceScanFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image for face scan.");
      return;
    }

    const scanImageBase64 = await fileToBase64(file);
    await runFaceScanInCommonEventFolders(scanImageBase64);
  };

  const handleOpenCamera = async () => {
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
      await runFaceScanInCommonEventFolders(base64);
      handleCloseCamera();
    } finally {
      setIsCameraProcessing(false);
    }
  };

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
            Upload your photo or use camera, then we scan only common event folders.
          </p>
          <p className="text-[#E8D1AB] text-xs">
            Common event folders available: {loading ? "Loading..." : workspaces.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="affiliate-find-yourself-upload"
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFaceScanFile}
            />
            <label
              htmlFor="affiliate-find-yourself-upload"
              className={`inline-flex cursor-pointer items-center rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition ${
                isFaceScanning || loading ? "pointer-events-none opacity-60" : "hover:bg-white/10"
              }`}
            >
              {isFaceScanning ? "Scanning..." : "Upload Face Photo"}
            </label>
            <button
              type="button"
              onClick={handleOpenCamera}
              disabled={isFaceScanning || loading}
              className={`inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition ${
                isFaceScanning || loading ? "pointer-events-none opacity-60" : "hover:bg-white/10"
              }`}
            >
              <Camera size={14} />
              Use Camera
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[#E8D1AB]">Matched photos</p>
            <p className="text-xs text-white/60">{resultCount} results</p>
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
                      Preview unavailable
                    </div>
                  )}
                  </button>
                  <div className="space-y-1 p-2 text-xs">
                    <p className="text-white/90">
                      Confidence: {Math.round((match.confidence || 0) * 100)}%
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
                      <p className="mt-2 text-xs text-white/65">Scanning your face in common event folders...</p>
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
                    : "Keep your face centered, then capture to scan common event folders."}
                </p>
              )}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  disabled={isCameraProcessing}
                  className={`rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 ${
                    isCameraProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={Boolean(cameraError) || isFaceScanning || isCameraProcessing}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    cameraError || isFaceScanning || isCameraProcessing
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
