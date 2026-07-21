"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Plus, PlayCircle, X } from "lucide-react";

import { Input } from "@/components/ui/input";

interface MediaFile {
  id: string;
  file?: File;
  url: string;
  type: "image" | "video";
  status: "selected" | "uploaded" | "uploading";
}

interface Props {
  isDark?: boolean;
  files: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
}

const makePreviewFile = (file: File): MediaFile => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  url: URL.createObjectURL(file),
  type: file.type.startsWith("video") ? "video" : "image",
  status: "selected",
});

export default function MediaUploadForm({ isDark = true, files, onFilesChange }: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const nextFiles = acceptedFiles.map(makePreviewFile);
      onFilesChange([...files, ...nextFiles]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"], "video/*": [".mp4", ".mov"] },
    maxSize: 50 * 1024 * 1024,
  });

  const removeFile = (id: string) => {
    const nextFiles = files.filter((file) => {
      if (file.id === id) {
        if (file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
        return false;
      }
      return true;
    });

    onFilesChange(nextFiles);
  };

  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFFB2]" : "text-[#71717B]";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      <section className={`space-y-6 p-4 lg:p-8 border rounded-xl transition-colors duration-200 ${borderColor}`}>
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
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-lg group"
              >
                {file.type === "image" ? (
                  <img src={file.url} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <PlayCircle className="text-white opacity-60" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>

                {file.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-[10px] text-white">Uploading...</span>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={open}
              className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-lg bg-[#E8D1AB] transition hover:bg-[#E8D1AB]/80"
            >
              <Plus className="text-black" size={28} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
