"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { CloudUpload, FileImage, FileVideo, File as FileIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import ModalShell from "@/components/admin/shoot-details/ModalShell"; // adjust path

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

/** "Upload Files" modal: drag & drop or browse, review the list, then upload. */
export default function UploadFilesModal({
  open,
  isDark,
  folderName,
  onClose,
  onUpload,
  accept = "image/*,video/*",
  multiple = true,
}: {
  open: boolean;
  isDark: boolean;
  /** Shown in "Files will be uploaded to the folder …" */
  folderName: string;
  onClose: () => void;
  /** Called with the chosen files; may return a promise (the button shows a spinner meanwhile) */
  onUpload: (files: File[]) => void | Promise<unknown>;
  accept?: string;
  multiple?: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fresh selection every time the modal opens
  useEffect(() => {
    if (open) {
      setFiles([]);
      setDragging(false);
      setUploading(false);
    }
  }, [open]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      if (!multiple) return incoming.slice(0, 1);
      const seen = new Set(prev.map(fileKey));
      return [...prev, ...incoming.filter((f) => !seen.has(fileKey(f)))];
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (key: string) => setFiles((prev) => prev.filter((f) => fileKey(f) !== key));

  const submit = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      await onUpload(files);
    } catch {
      toast.error("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const kindIcon = (f: File) => (f.type.startsWith("image/") ? FileImage : f.type.startsWith("video/") ? FileVideo : FileIcon);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      dismissible={!uploading}
      maxWidth="max-w-lg"
      className="!rounded-[20px]"
    >
      {/* Header */}
      <div className={`flex items-start justify-between gap-4 border-b p-5 ${isDark ? "border-[#3A3A3A]" : "border-[#E5E5E5]"}`}>
        <div className="min-w-0">
          <h2 id={titleId} className="text-base lg:text-lg font-semibold">Upload Files</h2>
          <p id={descId} className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            Files will be uploaded to the folder {folderName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          aria-label="Close"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${isDark ? "bg-[#2B2626] hover:bg-[#363331] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Drop zone */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          aria-label="Choose files to upload"
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border px-4  text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D1AB] ${files.length ? "py-8" : "py-10 lg:h-[185px]"} ${dragging
            ? "border-[#E8D1AB] bg-[#E8D1AB]/10"
            : isDark ? "border-white/30 bg-[#202020] hover:border-white/50" : "border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#D9C7A0]"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M19.125 30.375V23.625H23.625L18 16.875L12.375 23.625H16.875V30.375H11.25V30.3188C11.061 30.33 10.881 30.375 10.6875 30.375C8.44974 30.375 6.30362 29.4861 4.72129 27.9037C3.13895 26.3214 2.25 24.1753 2.25 21.9375C2.25 17.6085 5.52375 14.0805 9.7245 13.5968C10.0928 11.6714 11.1205 9.9346 12.6309 8.68501C14.1412 7.43543 16.0398 6.7512 18 6.75C19.9605 6.75108 21.8594 7.43523 23.3701 8.68478C24.8808 9.93434 25.909 11.6712 26.2778 13.5968C30.4785 14.0805 33.7477 17.6085 33.7477 21.9375C33.7477 24.1753 32.8588 26.3214 31.2765 27.9037C29.6941 29.4861 27.548 30.375 25.3102 30.375C25.1212 30.375 24.939 30.33 24.7477 30.3188V30.375H19.125Z" fill="#E8D1AB" />
          </svg>
          <p className="text-sm lg:text-base">
            Drag your files here or{" "}
            <span className={`underline underline-offset-4 ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>Browse</span>
          </p>
        </div>

        {/* Chosen files */}
        {files.length > 0 && (
          <ul className={`max-h-[220px] divide-y overflow-y-auto rounded-xl border ${isDark ? "border-white/10 divide-white/10" : "border-[#E5E5E5] divide-[#EEEEEE]"}`}>
            {files.map((f) => {
              const Icon = kindIcon(f);
              const key = fileKey(f);
              return (
                <li key={key} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon size={18} className="shrink-0 text-[#E8D1AB]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm" title={f.name}>{f.name}</span>
                  <span className={`shrink-0 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(key)}
                    disabled={uploading}
                    aria-label={`Remove ${f.name}`}
                    className={`shrink-0 rounded p-1 transition-colors disabled:opacity-40 ${isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-black/50 hover:bg-black/5 hover:text-black"}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className={`h-10 rounded-lg border px-6 text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? "border-white/20 bg-[#101010] text-white hover:bg-[#1C1C1C]" : "border-[#E5E5E5] bg-[#F0F0F0] text-[#202020] hover:bg-[#E5E5E5]"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!files.length || uploading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8D3AE] px-6 text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading && <Loader2 size={18} className="animate-spin" />}
            {files.length > 1 ? `Upload ${files.length} Files` : "Upload File"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
