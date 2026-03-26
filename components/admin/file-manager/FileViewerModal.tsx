"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileUrl?: string | null;
  contentType?: string;
}

const isImage = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName || "");
};

const isVideo = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("video/")) return true;
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(fileName || "");
};

const isPdf = (contentType?: string, fileName?: string) => {
  if (contentType === "application/pdf") return true;
  return /\.pdf$/i.test(fileName || "");
};

export default function FileViewerModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  contentType,
}: FileViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] border-white/10 bg-[#101010] p-0 text-white">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="truncate text-white">{fileName || "File Viewer"}</DialogTitle>
        </DialogHeader>

        <div className="h-[80vh] w-full bg-[#0b0b0b] p-4">
          {!fileUrl ? (
            <div className="flex h-full items-center justify-center text-white/60">Loading file...</div>
          ) : isImage(contentType, fileName) ? (
            <div className="flex h-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={fileName || "Preview"} className="max-h-full max-w-full rounded-lg object-contain" />
            </div>
          ) : isVideo(contentType, fileName) ? (
            <video src={fileUrl} controls className="h-full w-full rounded-lg bg-black" />
          ) : isPdf(contentType, fileName) ? (
            <iframe src={fileUrl} title={fileName || "PDF preview"} className="h-full w-full rounded-lg bg-white" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-white/70">
              <p>Preview is not available for this file type.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#E5D5B8] px-4 py-2 text-sm font-medium text-black"
              >
                Open File
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
