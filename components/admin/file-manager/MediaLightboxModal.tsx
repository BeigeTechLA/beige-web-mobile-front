"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Download,
  ExternalLink,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  Loader2,
} from "lucide-react";

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileUrl?: string | null;
  contentType?: string;
  fileMetaId?: string | null;
  isDark?: boolean;
}

const isImage = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)$/i.test(fileName || "");
};

const isVideo = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("video/")) return true;
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(fileName || "");
};

const isPdf = (contentType?: string, fileName?: string) => {
  if (contentType === "application/pdf") return true;
  return /\.pdf$/i.test(fileName || "");
};

const getFileTypeLabel = (contentType?: string, fileName?: string) => {
  if (isImage(contentType, fileName)) return "Image";
  if (isVideo(contentType, fileName)) return "Video";
  if (isPdf(contentType, fileName)) return "PDF";
  const extension = String(fileName || "").split(".").pop();
  return extension && extension !== fileName ? extension.toUpperCase() : "File";
};

export default function MediaLightboxModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  contentType,
}: MediaLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isImageFile = isImage(contentType, fileName);
  const isVideoFile = isVideo(contentType, fileName);
  const isPdfFile = isPdf(contentType, fileName);
  const fileTypeLabel = getFileTypeLabel(contentType, fileName);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetTransform();
      setIsLoaded(false);
    }
  }, [isOpen, fileUrl, resetTransform]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        resetTransform();
      } else if (e.key === "r" || e.key === "R") {
        handleRotate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, resetTransform]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-xl select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Navigation / Action Bar */}
      <div className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: File metadata */}
        <div className="flex items-center gap-3 min-w-0 max-w-[40%] sm:max-w-[50%]">
          <div className="min-w-0">
            <h2
              className="truncate text-sm sm:text-base font-semibold text-white tracking-wide"
              title={fileName}
            >
              {fileName || "Media Preview"}
            </h2>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
                {fileTypeLabel}
              </span>
              {isImageFile && zoom !== 1 && (
                <span className="text-[11px] text-[#E5D5B8] font-mono">
                  {Math.round(zoom * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Image controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isImageFile && (
            <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mr-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetTransform}
                className="px-2 h-8 flex items-center justify-center rounded-lg text-xs font-mono text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Reset Zoom (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3.5}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <button
                type="button"
                onClick={handleRotate}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Rotate 90° (R)"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}

          {fileUrl ? (
            <a
              href={fileUrl}
              download={fileName}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E5D5B8]/30 bg-[#E5D5B8]/15 px-3 text-xs font-semibold text-[#E5D5B8] hover:bg-[#E5D5B8]/25 transition"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
            title="Close (Escape)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Media Stage */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden p-4 sm:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {!fileUrl ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="h-8 w-8 animate-spin text-[#E5D5B8]" />
            <span className="text-sm font-medium">Loading media...</span>
          </div>
        ) : isImageFile ? (
          <div
            className={`relative flex items-center justify-center transition-all ${
              zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E5D5B8]" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={fileName || "Full image view"}
              onLoad={() => setIsLoaded(true)}
              className={`max-h-[82vh] max-w-[92vw] w-auto h-auto rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              draggable={false}
            />
          </div>
        ) : isVideoFile ? (
          <div className="relative max-h-[82vh] max-w-[92vw] w-full flex items-center justify-center">
            <video
              src={fileUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-[92vw] rounded-2xl bg-black object-contain shadow-2xl border border-white/10"
            />
          </div>
        ) : isPdfFile ? (
          <div className="h-[84vh] w-[92vw] max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#1a1a1a]">
            <iframe
              src={fileUrl}
              title={fileName || "PDF preview"}
              className="h-full w-full border-none bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/70 shadow-2xl max-w-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E5D5B8]/15 text-[#E5D5B8]">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{fileName}</h3>
              <p className="mt-1 text-xs text-white/50">Preview is not directly available for this format.</p>
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                download={fileName}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#E5D5B8] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#d8c49e] transition shadow-lg"
              >
                <Download className="h-4 w-4" />
                Download File
              </a>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Hint Bar for Images */}
      {isImageFile && (
        <div className="relative z-20 flex h-10 shrink-0 items-center justify-center border-t border-white/5 bg-black/40 px-4 text-[11px] text-white/40 backdrop-blur-sm">
          <span>Use +/- to zoom &bull; Click &amp; drag to pan &bull; Press R to rotate &bull; Press Esc to close</span>
        </div>
      )}
    </div>
  );
}
