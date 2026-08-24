"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Plus, PlayCircle, RotateCcw, X } from "lucide-react";

import { Input } from "@/components/ui/input";

export interface MediaFile {
  id: string;
  file?: File;
  url: string;
  filePath?: string;
  thumbnailUrl?: string | null;
  type: "image" | "video";
  status: "selected" | "uploaded" | "uploading" | "failed";
  error?: string;
}

interface Props {
  isDark?: boolean;
  files: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
  error?: string;
  onError?: (message: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const makePreviewFile = (file: File): MediaFile => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  url: URL.createObjectURL(file),
  type: file.type.startsWith("video") ? "video" : "image",
  status: "selected",
});

export default function MediaUploadForm({ isDark = true, files, onFilesChange, error, onError }: Props) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<MediaFile[]>(files);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const syncFiles = (nextFiles: MediaFile[]) => {
    setLocalFiles(nextFiles);
    onFilesChange(nextFiles);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const validFiles: File[] = [];
    const rejected: string[] = [];

    acceptedFiles.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: unsupported type`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: over 50MB`);
        return;
      }
      validFiles.push(file);
    });

    if (rejected.length) onError?.(rejected.join(", "));
    if (!validFiles.length) return;

    const previews = validFiles.map(makePreviewFile);
    const nextFiles = [...localFiles, ...previews];
    syncFiles(nextFiles);
    setLocalError(null);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"], "video/*": [".mp4", ".mov"] },
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = async (id: string) => {
    const target = localFiles.find((file) => file.id === id);
    if (!target) return;

    if (target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }

    syncFiles(localFiles.filter((file) => file.id !== id));
  };

  const retryUpload = async (id: string) => {
    const target = localFiles.find((file) => file.id === id);
    if (!target?.file) return;
    setLocalError("Files are uploaded when you save the studio.");
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDropOnTile = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = localFiles.findIndex((file) => file.id === draggedId);
    const toIndex = localFiles.findIndex((file) => file.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...localFiles];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    syncFiles(next);
  };

  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";
  const subTextColor = isDark ? "text-[#FFFFFFB2]" : "text-[#71717B]";
  const uploadedCount = useMemo(() => localFiles.length, [localFiles]);
  const tileClass = "h-[96px] w-[96px] shrink-0 rounded-lg";

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      <section className={`space-y-6 p-4 lg:p-8 border rounded-xl transition-colors duration-200 ${borderColor}`}>
        {(error || localError) && <p className="text-sm text-red-500">{error || localError}</p>}
        <div
          {...getRootProps()}
          className={`relative w-full min-h-[280px] flex flex-col items-center justify-center cursor-pointer transition-all rounded-xl border border-dashed ${isDragActive ? "bg-[#E8D1AB]/5" : "bg-transparent"} ${borderColor}`}
        >
          <Input {...getInputProps()} />

          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8D1AB]/10">
            <ImageIcon className="h-9 w-9 text-[#E8D1AB]" />
          </div>

          <p className={`text-base lg:text-lg font-semibold ${isDark ? "text-[#9F9F9F]" : "text-black"}`}>
            <span className="text-[#E8D1AB]">Click to upload</span> or drag and drop
          </p>
          <p className={`text-sm lg:text-base mt-1 ${subTextColor}`}>
            JPG, JPEG, PNG, WEBP, MP4 or MOV less than 50MB
          </p>

          <button
            type="button"
            onClick={open}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E8D1AB] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#dcc08a]"
          >
            <Plus size={16} />
            Add studio media
          </button>
        </div>

        <div className={`p-4 border border-dashed rounded-md ${isDark ? "border-[#FFFFFF4D]" : "border-gray-300"}`}>
          <div className="mb-3 flex items-center justify-between text-xs text-white/60">
            <span>Selected {uploadedCount}/5</span>
          </div>
          <div className="flex flex-nowrap items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
            {localFiles.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => handleDragStart(file.id)}
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropOnTile(file.id);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={`relative ${tileClass} overflow-hidden rounded-lg group cursor-grab active:cursor-grabbing ring-1 ring-transparent hover:ring-[#E8D1AB]/30`}
              >
                {file.type === "image" ? (
                  <img src={file.thumbnailUrl || file.url} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <PlayCircle className="text-white opacity-60" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void removeFile(file.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>

                {file.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-[10px] text-white">Uploading...</span>
                  </div>
                )}
                {file.status === "failed" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                    <span className="px-2 text-center text-[10px] text-red-300">Upload failed</span>
                    {file.file && (
                      <button
                        type="button"
                        onClick={() => void retryUpload(file.id)}
                        className="inline-flex items-center gap-1 rounded bg-[#E8D1AB] px-2 py-1 text-[10px] font-semibold text-black"
                      >
                        <RotateCcw size={10} /> Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={open}
              className={`flex ${tileClass} items-center justify-center rounded-lg bg-[#E8D1AB] transition hover:bg-[#E8D1AB]/80`}
            >
              <Plus className="text-black" size={28} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
