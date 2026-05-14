"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  previewUrl?: string;
}

const MAX_PARALLEL_UPLOADS = Math.max(
  1,
  Number(process.env.NEXT_PUBLIC_FILE_UPLOAD_PARALLELISM || 3)
);
const UPLOAD_POLICY_BATCH_SIZE = Math.max(
  10,
  Number(process.env.NEXT_PUBLIC_UPLOAD_POLICY_BATCH_SIZE || 100)
);
const UPLOAD_METADATA_BATCH_SIZE = Math.max(
  10,
  Number(process.env.NEXT_PUBLIC_UPLOAD_METADATA_BATCH_SIZE || 100)
);
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
  const batchPolicySupportedRef = useRef<boolean>(true);
  const batchMetadataSupportedRef = useRef<boolean>(true);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [selectionError, setSelectionError] = useState<string | null>(null);

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
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);
useEffect(() => {
  if (!isOpen) {
    setSelectionError(null);
    setStatusMessage(null); 
  }
}, [isOpen]);

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
            if (existingSignatures.has(item.signature)) {
              revokePreviewUrl(item.previewUrl);
              return false;
            }
            return true;
          });

        const duplicateCount = validIncoming.length - deduped.length;
        const notices: string[] = [];
        if (emptyFileCount > 0) {
          notices.push("You cannot upload empty files.");
        }
        if (duplicateCount > 0) {
          notices.push(`${duplicateCount} duplicate file(s) were skipped.`);
        }
        if (notices.length > 0) {
          setSelectionError(notices.join(" "));
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
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      revokePreviewUrl(target?.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
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

  const isRouteNotFoundError = (error: any) => {
    const status = Number(error?.response?.status || 0);
    const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();
    const path = String(error?.response?.data?.path || "").toLowerCase();
    return (
      status === 404 &&
      (message.includes("route not found") ||
        path.includes("/upload-policies/batch") ||
        path.includes("/files-uploaded/batch"))
    );
  };

  const chunkArray = <T,>(items: T[], size: number) => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  };

  const runWithConcurrency = async <T,>(
    items: T[],
    concurrency: number,
    task: (item: T, index: number) => Promise<void>
  ) => {
    let cursor = 0;
    const workers = Math.max(1, concurrency);

    const worker = async () => {
      while (cursor < items.length) {
        const current = cursor;
        cursor += 1;
        // eslint-disable-next-line no-await-in-loop
        await task(items[current], current);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(workers, Math.max(items.length, 1)) }, () => worker())
    );
  };

  const uploadFileToGcs = async (
    uploadPolicy: { url: string; fields: Record<string, string> },
    selectedFile: File
  ) => {
    await runWithRetry(async () => {
      await fileManagerApi.uploadExternalFile(uploadPolicy, selectedFile);
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

    const zeroByteFiles = selectedFiles.filter((item) => item.file.size <= 0);
    if (zeroByteFiles.length > 0) {
      setStatusMessage("Remove empty files (0 bytes) before uploading.");
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
      const pendingMetadataItems: Array<{
        id: string;
        filepath: string;
        fileContentType: string;
        fileSize: number;
        fileName: string;
        file: File;
      }> = [];

      const policyByFilePath = new Map<string, { url: string; fields: Record<string, string> }>();
      const policyFailedPaths = new Set<string>();
      const policyRequests = filesToUpload.map((item) => ({
        filepath: `${uploadPath.replace(/\/+$/, "")}/${item.file.name}`,
        fileContentType: item.file.type,
        fileSize: item.file.size,
      }));

      const policyChunks = chunkArray(policyRequests, UPLOAD_POLICY_BATCH_SIZE);
      for (let index = 0; index < policyChunks.length; index += 1) {
        const chunk = policyChunks[index];
        setStatusMessage(
          `Preparing upload links ${index + 1}/${policyChunks.length}... Uploaded ${uploaded}/${selectedFiles.length}.`
        );
        if (batchPolicySupportedRef.current) {
          try {
            const response = await fileManagerApi.getExternalUploadPoliciesBatch(
              chunk.map((item) => ({
                filepath: item.filepath,
                fileContentType: item.fileContentType,
                fileSize: item.fileSize,
              }))
            );
            const batchItems = Array.isArray((response as any)?.items)
              ? (response as any).items
              : Array.isArray((response as any)?.data?.items)
              ? (response as any).data.items
              : [];

            batchItems.forEach((item: any) => {
              if (item.success && item.data?.url && item.data?.fields) {
                policyByFilePath.set(item.filepath, {
                  url: item.data.url,
                  fields: item.data.fields,
                });
              } else {
                policyFailedPaths.add(item.filepath);
              }
            });
            continue;
          } catch (error: any) {
            if (isRouteNotFoundError(error)) {
              batchPolicySupportedRef.current = false;
            } else {
              // Keep single API flow: if batch endpoint exists but fails (permission/validation),
              // do not fan out into per-file policy calls.
              chunk.forEach((item) => {
                policyFailedPaths.add(item.filepath);
              });
              continue;
            }
          }
        }

        // Fallback when batch endpoint is unavailable
        await runWithConcurrency(chunk, 5, async (item) => {
          try {
            const single = await runWithRetry(async () =>
              fileManagerApi.getExternalUploadPolicy(
                item.filepath,
                item.fileContentType,
                item.fileSize
              )
            );
            if (single?.data?.url && single?.data?.fields) {
              policyByFilePath.set(item.filepath, {
                url: single.data.url,
                fields: single.data.fields,
              });
              return;
            }
            policyFailedPaths.add(item.filepath);
          } catch {
            policyFailedPaths.add(item.filepath);
          }
        });
      }

      const uploadSingle = async (item: UploadQueueItem) => {
        const selectedFile = item.file;
        const filepath = `${uploadPath.replace(/\/+$/, "")}/${selectedFile.name}`;
        setFileStatus(item.id, "uploading");

        if (policyFailedPaths.has(filepath) || !policyByFilePath.has(filepath)) {
          failed += 1;
          setFileStatus(item.id, "failed", "Failed to prepare upload policy.");
          setStatusMessage(
            `Uploaded ${uploaded}/${selectedFiles.length} files${failed ? `, failed ${failed}` : ""}.`
          );
          return;
        }

        try {
          await uploadFileToGcs(policyByFilePath.get(filepath)!, selectedFile);
          pendingMetadataItems.push({
            id: item.id,
            filepath,
            fileContentType: selectedFile.type,
            fileSize: selectedFile.size,
            fileName: selectedFile.name,
            file: selectedFile,
          });
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

      if (pendingMetadataItems.length > 0) {
        const metadataChunks = chunkArray(pendingMetadataItems, UPLOAD_METADATA_BATCH_SIZE);
        let metadataFailed = 0;

        for (let index = 0; index < metadataChunks.length; index += 1) {
          const chunk = metadataChunks[index];
          setStatusMessage(
            `Saving file metadata ${index + 1}/${metadataChunks.length}... Uploaded ${uploaded}/${selectedFiles.length}.`
          );
          if (batchMetadataSupportedRef.current) {
            try {
              const response = await runWithRetry(async () =>
                fileManagerApi.notifyExternalFilesUploadedBatch(
                  chunk.map((item) => ({
                    filepath: item.filepath,
                    fileContentType: item.fileContentType,
                    fileSize: item.fileSize,
                    fileName: item.fileName,
                  }))
                )
              );
              const metadataItems = Array.isArray((response as any)?.items)
                ? (response as any).items
                : Array.isArray((response as any)?.data?.items)
                ? (response as any).data.items
                : [];
              const failedPaths = new Set(
                metadataItems
                  .filter((item) => !item.success)
                  .map((item) => item.filepath)
              );

              if (failedPaths.size > 0) {
                metadataFailed += failedPaths.size;
                setSelectedFiles((prev) =>
                  prev.map((queued) => {
                    const match = chunk.find((entry) => entry.id === queued.id);
                    if (!match) return queued;
                    if (!failedPaths.has(match.filepath)) return queued;
                    return {
                      ...queued,
                      status: "failed",
                      error: "Metadata save failed. Retry failed files.",
                    };
                  })
                );
              }
              continue;
            } catch (error: any) {
              if (isRouteNotFoundError(error)) {
                batchMetadataSupportedRef.current = false;
              } else {
                metadataFailed += chunk.length;
                setSelectedFiles((prev) =>
                  prev.map((queued) => {
                    const match = chunk.find((entry) => entry.id === queued.id);
                    if (!match) return queued;
                    return {
                      ...queued,
                      status: "failed",
                      error: error?.message || "Metadata save failed. Retry failed files.",
                    };
                  })
                );
                continue;
              }
            }
          }

          // Fallback when batch endpoint is unavailable
          await runWithConcurrency(chunk, 5, async (entry) => {
            try {
              await runWithRetry(async () =>
                fileManagerApi.notifyExternalFileUploaded(entry.filepath, entry.file)
              );
            } catch (singleError: any) {
              metadataFailed += 1;
              setSelectedFiles((prev) =>
                prev.map((queued) => {
                  if (queued.id !== entry.id) return queued;
                  return {
                    ...queued,
                    status: "failed",
                    error: singleError?.message || "Metadata save failed. Retry failed files.",
                  };
                })
              );
            }
          });
        }

        if (metadataFailed > 0) {
          failed += metadataFailed;
          uploaded = Math.max(0, uploaded - metadataFailed);
        }
      }

      if (uploaded > 0) {
        await onUploadComplete?.();
      }

      if (failed > 0) {
        setStatusMessage(
          `Completed with issues. Uploaded ${uploaded}/${selectedFiles.length}, failed ${failed}.`
        );
        setSelectedFiles((prev) => {
          prev.forEach((item) => {
            if (item.status !== "failed") {
              revokePreviewUrl(item.previewUrl);
            }
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
             {selectionError && (
              <p className="mt-2 text-sm font-medium text-red-500">
                {selectionError}
              </p>
            )}
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
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-11 w-11 rounded-md object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 shrink-0">
                        <File size={18} className="text-[#E8D1AB]" />
                      </div>
                    )}
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
