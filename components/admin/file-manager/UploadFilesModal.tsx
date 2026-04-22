"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, UploadCloud, Trash2, File } from "lucide-react";
import { fileManagerApi } from "@/lib/fileManagerApi";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  uploadPath?: string;
  onUploadComplete?: () => Promise<void> | void;
}

type UploadStatus = "queued" | "uploading" | "uploaded" | "failed";

interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
  signature: string;
}

const MAX_PARALLEL_UPLOADS = 6;
const MAX_UPLOAD_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folderName,
  uploadPath,
  onUploadComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedCount = useMemo(
    () => selectedFiles.filter((item) => item.status === "uploaded").length,
    [selectedFiles]
  );
  const failedCount = useMemo(
    () => selectedFiles.filter((item) => item.status === "failed").length,
    [selectedFiles]
  );
  const totalCount = selectedFiles.length;
  const completedCount = uploadedCount + failedCount;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (files) {
      const now = Date.now();
      const incoming = Array.from(files);
      setSelectedFiles((prev) => {
        const existingSignatures = new Set(prev.map((item) => item.signature));
        const deduped = incoming
          .map((file, index) => {
            const signature = `${file.name}-${file.size}-${file.lastModified}`;
            return {
              id: `${signature}-${now}-${index}`,
              file,
              signature,
              status: "queued" as UploadStatus,
            };
          })
          .filter((item) => !existingSignatures.has(item.signature));

        const skippedCount = incoming.length - deduped.length;
        if (skippedCount > 0) {
          setStatusMessage(`${skippedCount} duplicate file(s) were skipped.`);
        }

        return [...prev, ...deduped];
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const setFileStatus = (id: string, status: UploadStatus, error?: string) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item))
    );
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runWithRetry = async (task: () => Promise<void>) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt += 1) {
      try {
        await task();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_UPLOAD_RETRIES - 1) {
          const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }
    throw lastError;
  };

  const uploadFileToGcs = async (filepath: string, selectedFile: File) => {
    await runWithRetry(async () => {
      const uploadPolicy = await fileManagerApi.getExternalUploadPolicy(
        filepath,
        selectedFile.type,
        selectedFile.size
      );
      await fileManagerApi.uploadExternalFile(uploadPolicy, selectedFile);
    });
  };

  const notifyUploadComplete = async (filepath: string, selectedFile: File) => {
    await runWithRetry(async () => {
      await fileManagerApi.notifyExternalFileUploaded(filepath, selectedFile);
    });
  };

  const handleUpload = async (mode: "all" | "failedOnly" = "all") => {
    if (!uploadPath) {
      setStatusMessage("Open a project folder before uploading files.");
      return;
    }

    if (!selectedFiles.length) {
      setStatusMessage("Select at least one file.");
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(`Uploading 0/${selectedFiles.length} files...`);
      setSelectedFiles((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.status === "failed" ? "queued" : item.status,
          error: undefined,
        }))
      );

      const filesToUpload = selectedFiles.filter((item) => {
        if (mode === "failedOnly") return item.status === "failed";
        return item.status !== "uploaded";
      });

      if (!filesToUpload.length) {
        setStatusMessage("No files pending upload.");
        setIsUploading(false);
        return;
      }

      let nextIndex = 0;
      let uploaded = selectedFiles.filter((item) => item.status === "uploaded").length;
      let failed = 0;

      const uploadSingle = async (item: UploadQueueItem) => {
        const selectedFile = item.file;
        const filepath = `${uploadPath.replace(/\/+$/, "")}/${selectedFile.name}`;
        setFileStatus(item.id, "uploading");

        try {
          // Keep upload and metadata retries separate:
          // metadata retries won't re-upload file bytes.
          await uploadFileToGcs(filepath, selectedFile);
          await notifyUploadComplete(filepath, selectedFile);
          uploaded += 1;
          setFileStatus(item.id, "uploaded");
        } catch (error: any) {
          failed += 1;
          setFileStatus(item.id, "failed", error?.message || "Upload failed.");
        }

        setStatusMessage(
          `Uploaded ${uploaded}/${selectedFiles.length} files${failed ? `, failed ${failed}` : ""}.`
        );
      };

      const worker = async () => {
        while (nextIndex < filesToUpload.length) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          await uploadSingle(filesToUpload[currentIndex]);
        }
      };

      const workerCount = Math.min(MAX_PARALLEL_UPLOADS, filesToUpload.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      if (uploaded > 0) {
        await onUploadComplete?.();
      }

      if (failed > 0) {
        setStatusMessage(
          `Completed with issues. Uploaded ${uploaded}/${selectedFiles.length}, failed ${failed}.`
        );
        setSelectedFiles((prev) => prev.filter((item) => item.status === "failed"));
      } else {
        setSelectedFiles([]);
        setStatusMessage(null);
        onClose();
      }
    } catch (error: any) {
      setStatusMessage(error?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="mx-5 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">

        {/* Header */}
        <div className="relative p-3 lg:p-5">
          <button
            onClick={() => {
              if (isUploading) return;
              onClose();
            }}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-hover hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <p className="mt-1 text-sm text-white/60">
            Files will be uploaded to the folder <span className="text-white/80">{folderName}</span>
          </p>
          {uploadPath ? (
            <p className="mt-1 text-xs text-white/40">{uploadPath}</p>
          ) : (
            <p className="mt-1 text-xs text-red-300">Open a folder before uploading files.</p>
          )}
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>
                  Uploaded {uploadedCount}/{totalCount}
                </span>
                <span>
                  Failed {failedCount} | Pending {Math.max(totalCount - completedCount, 0)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#E8D1AB] transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10" />

        {/* Dropzone Area */}
        <div className="p-3 lg:p-5">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex h-[185px] cursor-pointer flex-col items-center justify-center rounded-[10px] border transition-all duration-200 
              ${isDragging
                ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
                : "border-white/10 bg-[#202020] hover:border-white/20 hover:bg-[#202020]/[0.04]"
              }`}
          >
            <input type="file" className="hidden" ref={fileInputRef} multiple onChange={(e) => handleFiles(e.target.files)} />

            <div className="mb-4 flex h-16 w-16 items-center justify-center">
              <UploadCloud className="text-[#E8D1AB]" size={32} />
            </div>

            <p className="text-lg font-medium text-white">
              Drag your files here or{" "}
              <span className="text-[#E8D1AB] underline decoration-[#E8D1AB]/30 underline-offset-4 hover:decoration-[#E8D1AB]">
                Browse
              </span>
            </p>
          </div>

          {/* New: File List Area */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {selectedFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <File size={18} className="text-[#E8D1AB] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.file.name}</p>
                      <p className="text-xs text-white/40">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-[11px] text-white/50 capitalize">
                        {item.status === "failed"
                          ? `Failed${item.error ? `: ${item.error}` : ""}`
                          : item.status}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    disabled={isUploading}
                    className="p-1.5 text-white/40 hover:text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 p-3 pt-0 lg:p-5 lg:pt-3">
          <button
            onClick={() => {
              if (isUploading) return;
              onClose();
            }}
            className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none lg:min-w-[90px]"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !uploadPath}
            className="flex-1 rounded-lg bg-[#E8D1AB] px-4 py-2 text-sm font-medium text-[#101010] transition-opacity hover:opacity-90 lg:flex-none lg:min-w-[110px]"
          >
            {isUploading ? `Uploading ${uploadedCount}/${totalCount}` : "Upload Files"}
          </button>
          {failedCount > 0 && (
            <button
              onClick={() => handleUpload("failedOnly")}
              disabled={isUploading || !uploadPath}
              className="rounded-lg border border-[#E8D1AB]/50 px-4 py-2 text-sm font-medium text-[#E8D1AB] transition-opacity hover:bg-[#E8D1AB]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry Failed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
