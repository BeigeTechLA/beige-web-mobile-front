"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { File, Trash2, UploadCloud, X } from "lucide-react";
import { fileManagerApi } from "@/lib/fileManagerApi";

interface SharedUploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
  accessToken: string;
  folderName: string;
  phase?: string;
  path?: string;
  uploadPath?: string;
  onUploadComplete?: () => Promise<void> | void;
}

type UploadStatus = "queued" | "uploading" | "uploaded" | "failed";

interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  signature: string;
  previewUrl?: string;
  error?: string;
}

const MAX_PARALLEL_UPLOADS = Math.max(1, Number(process.env.NEXT_PUBLIC_FILE_UPLOAD_PARALLELISM || 3));
const UPLOAD_POLICY_BATCH_SIZE = Math.max(10, Number(process.env.NEXT_PUBLIC_UPLOAD_POLICY_BATCH_SIZE || 100));
const UPLOAD_METADATA_BATCH_SIZE = Math.max(10, Number(process.env.NEXT_PUBLIC_UPLOAD_METADATA_BATCH_SIZE || 100));

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export default function SharedUploadFilesModal({
  isOpen,
  onClose,
  shareToken,
  accessToken,
  folderName,
  phase,
  path,
  uploadPath,
  onUploadComplete,
}: SharedUploadFilesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const cancelUploadRef = useRef(false);
  const activeUploadControllersRef = useRef<Set<AbortController>>(new Set());

  const uploadedCount = useMemo(() => selectedFiles.filter((item) => item.status === "uploaded").length, [selectedFiles]);
  const failedCount = useMemo(() => selectedFiles.filter((item) => item.status === "failed").length, [selectedFiles]);
  const totalCount = selectedFiles.length;
  const completedCount = uploadedCount + failedCount;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const isImageFile = (file: File) =>
    file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file.name);

  const createImagePreview = (file: File) => {
    if (!isImageFile(file)) return undefined;
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  };

  const revokePreviewUrl = (url?: string) => {
    if (!url || !previewUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectionError(null);
      setStatusMessage(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectionError(null);
    const now = Date.now();
    const incoming = Array.from(files);
    const validIncoming = incoming.filter((file) => file.size > 0);
    const emptyFileCount = incoming.length - validIncoming.length;

    setSelectedFiles((prev) => {
      const existingSignatures = new Set(prev.map((item) => item.signature));
      const deduped = validIncoming
        .map((file, index) => {
          const signature = `${file.name}-${file.size}-${file.lastModified}`;
          return {
            id: `${signature}-${now}-${index}`,
            file,
            signature,
            status: "queued" as UploadStatus,
            previewUrl: createImagePreview(file),
          };
        })
        .filter((item) => {
          if (!existingSignatures.has(item.signature)) return true;
          revokePreviewUrl(item.previewUrl);
          return false;
        });

      const notices: string[] = [];
      const duplicateCount = validIncoming.length - deduped.length;
      if (emptyFileCount) notices.push("You cannot upload empty files.");
      if (duplicateCount) notices.push(`${duplicateCount} duplicate file(s) were skipped.`);
      if (notices.length) setSelectionError(notices.join(" "));

      return [...prev, ...deduped];
    });
  };

  const setFileStatus = (id: string, status: UploadStatus, error?: string) => {
    setSelectedFiles((prev) => prev.map((item) => (item.id === id ? { ...item, status, error } : item)));
  };

  const runWithConcurrency = async <T,>(items: T[], concurrency: number, task: (item: T) => Promise<void>) => {
    let cursor = 0;
    const worker = async () => {
      while (!cancelUploadRef.current && cursor < items.length) {
        const current = cursor;
        cursor += 1;
        await task(items[current]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(concurrency, 1), Math.max(items.length, 1)) }, () => worker()));
  };

  const uploadFileToStorage = async (uploadPolicy: { url: string; fields: Record<string, string> }, file: File) => {
    const abortController = new AbortController();
    activeUploadControllersRef.current.add(abortController);
    try {
      await fileManagerApi.uploadExternalFile(uploadPolicy, file, undefined, abortController.signal);
    } finally {
      activeUploadControllersRef.current.delete(abortController);
    }
  };

  const getUploadFilepath = (fileName: string) => {
    const cleanBasePath = String(uploadPath || "").replace(/^\/+|\/+$/g, "");
    if (!cleanBasePath) return undefined;
    return `${cleanBasePath}/${fileName}`;
  };

  const removeFile = (id: string) => {
    if (isUploading) return;
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      revokePreviewUrl(target?.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const closeOrCancel = () => {
    if (isUploading) {
      cancelUploadRef.current = true;
      activeUploadControllersRef.current.forEach((controller) => controller.abort());
      setStatusMessage("Cancelling upload...");
    } else {
      setSelectedFiles((prev) => {
        prev.forEach((item) => revokePreviewUrl(item.previewUrl));
        return [];
      });
      onClose();
    }
  };

  const handleUpload = async (mode: "all" | "failedOnly" = "all") => {
    if (!selectedFiles.length || !shareToken || !accessToken) {
      setStatusMessage("Select at least one file.");
      return;
    }

    try {
      cancelUploadRef.current = false;
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

      const policyByFilePath = new Map<string, { url: string; fields: Record<string, string> }>();
      const policyFailedPaths = new Set<string>();
      const policyPathById = new Map<string, string>();
      const policyRequests = filesToUpload.map((item) => ({
        id: item.id,
        fileName: item.file.name,
        filepath: getUploadFilepath(item.file.name),
        fileContentType: item.file.type || "application/octet-stream",
        fileSize: item.file.size,
        phase,
        path,
      }));

      const policyChunks = chunkArray(policyRequests, UPLOAD_POLICY_BATCH_SIZE);
      for (let index = 0; index < policyChunks.length; index += 1) {
        if (cancelUploadRef.current) break;
        const chunk = policyChunks[index];
        setStatusMessage(`Preparing upload links ${index + 1}/${policyChunks.length}...`);
        const response = await fileManagerApi.getSharedUploadPoliciesBatch(shareToken, accessToken, {
          phase,
          path,
          items: chunk.map(({ fileName, filepath, fileContentType, fileSize }) => ({ fileName, filepath, fileContentType, fileSize, phase, path })),
        });
        const batchItems = Array.isArray(response?.data?.items) ? response.data.items : [];
        batchItems.forEach((item: { success?: boolean; filepath?: string; data?: { url?: string; fields?: Record<string, string>; filepath?: string } }) => {
          const filepath = item.data?.filepath || item.filepath || "";
          const request = chunk.find((entry) => entry.fileName === String(filepath).split("/").pop());
          if (!request || !filepath) return;
          policyPathById.set(request.id, filepath);
          if (item.success && item.data?.url && item.data?.fields) {
            policyByFilePath.set(filepath, { url: item.data.url, fields: item.data.fields });
          } else {
            policyFailedPaths.add(filepath);
          }
        });
      }

      let uploaded = selectedFiles.filter((item) => item.status === "uploaded").length;
      let failed = 0;
      const pendingMetadataItems: Array<{
        id: string;
        filepath: string;
        fileContentType: string;
        fileSize: number;
        fileName: string;
      }> = [];

      await runWithConcurrency(filesToUpload, MAX_PARALLEL_UPLOADS, async (item) => {
        const filepath = policyPathById.get(item.id);
        setFileStatus(item.id, "uploading");
        if (!filepath || policyFailedPaths.has(filepath) || !policyByFilePath.has(filepath)) {
          failed += 1;
          setFileStatus(item.id, "failed", "Failed to prepare upload policy.");
          return;
        }
        try {
          await uploadFileToStorage(policyByFilePath.get(filepath)!, item.file);
          pendingMetadataItems.push({
            id: item.id,
            filepath,
            fileContentType: item.file.type || "application/octet-stream",
            fileSize: item.file.size,
            fileName: item.file.name,
          });
          uploaded += 1;
          setFileStatus(item.id, "uploaded");
        } catch (error) {
          failed += 1;
          setFileStatus(item.id, "failed", error instanceof Error ? error.message : "Upload failed.");
        }
        setStatusMessage(`Uploaded ${uploaded}/${selectedFiles.length} files${failed ? `, failed ${failed}` : ""}.`);
      });

      if (pendingMetadataItems.length) {
        const metadataChunks = chunkArray(pendingMetadataItems, UPLOAD_METADATA_BATCH_SIZE);
        let metadataFailed = 0;
        for (let index = 0; index < metadataChunks.length; index += 1) {
          const chunk = metadataChunks[index];
          setStatusMessage(`Saving file metadata ${index + 1}/${metadataChunks.length}...`);
          const response = await fileManagerApi.notifySharedFilesUploadedBatch(shareToken, accessToken, {
            phase,
            path,
            items: chunk.map((item) => ({ ...item, phase, path })),
          });
          const metadataItems = Array.isArray(response?.data?.items) ? response.data.items : [];
          const failedPaths = new Set(metadataItems.filter((item: { success?: boolean }) => !item.success).map((item: { filepath?: string }) => item.filepath));
          if (failedPaths.size) {
            metadataFailed += failedPaths.size;
            setSelectedFiles((prev) =>
              prev.map((queued) => {
                const match = chunk.find((entry) => entry.id === queued.id);
                if (!match || !failedPaths.has(match.filepath)) return queued;
                return { ...queued, status: "failed", error: "Metadata save failed. Retry failed files." };
              })
            );
          }
        }
        if (metadataFailed) {
          failed += metadataFailed;
          uploaded = Math.max(0, uploaded - metadataFailed);
        }
      }

      if (uploaded > 0) await onUploadComplete?.();

      if (failed > 0) {
        setStatusMessage(`Completed with issues. Uploaded ${uploaded}/${selectedFiles.length}, failed ${failed}.`);
        setSelectedFiles((prev) => {
          prev.forEach((item) => {
            if (item.status !== "failed") revokePreviewUrl(item.previewUrl);
          });
          return prev.filter((item) => item.status === "failed");
        });
      } else {
        setSelectedFiles((prev) => {
          prev.forEach((item) => revokePreviewUrl(item.previewUrl));
          return [];
        });
        setStatusMessage(null);
        onClose();
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#080808] text-white shadow-2xl">
        <div className="relative p-5">
          <button
            type="button"
            onClick={closeOrCancel}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold">Upload Files</h2>
          <p className="mt-1 pr-12 text-sm text-white/55">Files will be uploaded to <span className="text-white/80">{folderName}</span></p>
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Uploaded {uploadedCount}/{totalCount}</span>
                <span>Failed {failedCount} | Pending {Math.max(totalCount - completedCount, 0)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#E8D1AB] transition-all duration-200" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="h-px bg-white/10" />
        <div className="p-5">
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex h-[185px] cursor-pointer flex-col items-center justify-center rounded-lg border transition-colors ${
              isDragging ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : "border-white/10 bg-white/[0.04] hover:border-white/20"
            }`}
          >
            <input ref={fileInputRef} type="file" className="hidden" multiple onChange={(event) => handleFiles(event.target.files)} />
            <UploadCloud className="mb-4 text-[#E8D1AB]" size={32} />
            <p className="text-base font-medium">Drag files here or <span className="text-[#E8D1AB] underline underline-offset-4">Browse</span></p>
            {selectionError && <p className="mt-2 text-sm font-medium text-red-400">{selectionError}</p>}
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 max-h-[200px] space-y-2 overflow-y-auto pr-2">
              {selectedFiles.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt={item.file.name} className="h-11 w-11 shrink-0 rounded-md border border-white/10 object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                        <File size={18} className="text-[#E8D1AB]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-xs text-white/40">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-[11px] capitalize text-white/50">
                        {item.status === "failed" ? `Failed${item.error ? `: ${item.error}` : ""}` : item.status}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFile(item.id);
                    }}
                    disabled={isUploading}
                    className="p-1.5 text-white/40 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {statusMessage && <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">{statusMessage}</div>}
        </div>
        <div className="flex items-center gap-3 p-5 pt-0">
          <button type="button" onClick={closeOrCancel} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
            {isUploading ? "Cancel Upload" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => handleUpload()}
            disabled={isUploading || !selectedFiles.length}
            className="rounded-lg bg-[#E8D1AB] px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? `Uploading ${uploadedCount}/${totalCount}` : "Upload Files"}
          </button>
          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => handleUpload("failedOnly")}
              disabled={isUploading}
              className="rounded-lg border border-[#E8D1AB]/50 px-4 py-2 text-sm font-medium text-[#E8D1AB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry Failed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
