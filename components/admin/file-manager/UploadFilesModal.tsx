"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, UploadCloud, Trash2, File } from "lucide-react";
import { fileManagerApi } from "@/lib/fileManagerApi";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  uploadPath?: string;
  existingFileNames?: string[];
  onUploadComplete?: () => Promise<void> | void;
  isDark?: boolean;
}

type UploadStatus = "queued" | "uploading" | "uploaded" | "failed" | "skipped";
type UploadConflictMode = "replace" | "skip" | "keep_both";

interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
  signature: string;
  previewUrl?: string;
}

interface ApiErrorLike {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      path?: string;
    };
  };
}

interface BatchPolicyItem {
  filepath: string;
  resolvedFilepath?: string;
  success?: boolean;
  skipped?: boolean;
  data?: {
    url?: string;
    fields?: Record<string, string>;
    filepath?: string;
    skipped?: boolean;
  };
}

interface BatchMetadataItem {
  filepath: string;
  success?: boolean;
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
  existingFileNames = [],
  onUploadComplete,
  isDark = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchPolicySupportedRef = useRef<boolean>(true);
  const batchMetadataSupportedRef = useRef<boolean>(true);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const cancelUploadRef = useRef(false);
  const activeUploadControllersRef = useRef<Set<AbortController>>(new Set());
  const wasOpenRef = useRef(isOpen);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [detectedConflictIds, setDetectedConflictIds] = useState<string[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, UploadConflictMode>>({});
  const [conflictSearch, setConflictSearch] = useState("");

  const uploadedCount = useMemo(
    () => selectedFiles.filter((item) => item.status === "uploaded").length,
    [selectedFiles]
  );
  const failedCount = useMemo(
    () => selectedFiles.filter((item) => item.status === "failed").length,
    [selectedFiles]
  );
  const skippedCount = useMemo(
    () => selectedFiles.filter((item) => item.status === "skipped").length,
    [selectedFiles]
  );
  const totalCount = selectedFiles.length;
  const completedCount = uploadedCount + failedCount + skippedCount;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const conflictOptions: Array<{ value: UploadConflictMode; label: string }> = [
    { value: "replace", label: "Replace" },
    { value: "skip", label: "Skip" },
    { value: "keep_both", label: "Keep both" },
  ];
  const getFileNameFromPath = useCallback((value: string) => {
    const cleanValue = String(value || "").trim().replace(/\\/g, "/");
    const lastSegment = cleanValue.split("/").filter(Boolean).pop() || cleanValue;
    try {
      return decodeURIComponent(lastSegment.replace(/\+/g, " "));
    } catch {
      return lastSegment.replace(/\+/g, " ");
    }
  }, []);
  const getNameWithoutExtension = useCallback((value: string) => {
    const dotIndex = value.lastIndexOf(".");
    return dotIndex > 0 ? value.slice(0, dotIndex) : value;
  }, []);
  const getComparableFileNameKeys = useCallback((value: string) => {
    const fileName = getFileNameFromPath(value).trim().toLowerCase();
    if (!fileName) return [];
    const withoutExtension = getNameWithoutExtension(fileName).trim();
    return Array.from(new Set([fileName, withoutExtension].filter(Boolean)));
  }, [getFileNameFromPath, getNameWithoutExtension]);
  const existingFileNameSet = useMemo(
    () =>
      new Set(
        existingFileNames.flatMap((name) => getComparableFileNameKeys(name))
      ),
    [existingFileNames, getComparableFileNameKeys]
  );
  const conflictItems = useMemo(
    () => selectedFiles.filter((item) => detectedConflictIds.includes(item.id)),
    [detectedConflictIds, selectedFiles]
  );
  const filteredConflictItems = useMemo(() => {
    const query = conflictSearch.trim().toLowerCase();
    if (!query) return conflictItems;
    return conflictItems.filter((item) => item.file.name.toLowerCase().includes(query));
  }, [conflictItems, conflictSearch]);
  const conflictResolutionCounts = useMemo(
    () =>
      detectedConflictIds.reduce(
        (counts, id) => {
          const mode = conflictResolutions[id] || "replace";
          counts[mode] += 1;
          return counts;
        },
        { replace: 0, skip: 0, keep_both: 0 } as Record<UploadConflictMode, number>
      ),
    [conflictResolutions, detectedConflictIds]
  );

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
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen) {
      setSelectionError(null);
      setStatusMessage(null);
      setDetectedConflictIds([]);
      setConflictResolutions({});
      setConflictSearch("");
    } else if (!wasOpen && !isUploading) {
      cancelUploadRef.current = false;
      setStatusMessage(null);
    }
  }, [isOpen, isUploading]);

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
      setDetectedConflictIds([]);
      setConflictResolutions({});
      setConflictSearch("");
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

  const runWithRetry = async <T,>(task: () => Promise<T>, respectCancellation = true): Promise<T> => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt += 1) {
      if (respectCancellation && cancelUploadRef.current) {
        throw new Error("Upload cancelled.");
      }
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (respectCancellation && cancelUploadRef.current) {
          throw error;
        }
        if (attempt < MAX_UPLOAD_RETRIES - 1) {
          const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }
    throw lastError;
  };

  const toApiError = (error: unknown): ApiErrorLike =>
    typeof error === "object" && error !== null ? (error as ApiErrorLike) : {};

  const getErrorMessage = (error: unknown, fallback: string) => {
    const apiError = toApiError(error);
    return apiError.response?.data?.message || apiError.message || fallback;
  };

  const isRouteNotFoundError = (error: unknown) => {
    const apiError = toApiError(error);
    const status = Number(apiError.response?.status || 0);
    const message = String(apiError.response?.data?.message || apiError.message || "").toLowerCase();
    const path = String(apiError.response?.data?.path || "").toLowerCase();
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
    const abortController = new AbortController();
    activeUploadControllersRef.current.add(abortController);
    try {
      await runWithRetry(async () => {
        await fileManagerApi.uploadExternalFile(
          uploadPolicy,
          selectedFile,
          undefined,
          abortController.signal
        );
      });
    } finally {
      activeUploadControllersRef.current.delete(abortController);
    }
  };

  const cancelUpload = () => {
    if (!isUploading) {
      setSelectedFiles((prev) => {
        prev.forEach((item) => revokePreviewUrl(item.previewUrl));
        return [];
      });
      setDetectedConflictIds([]);
      setConflictResolutions({});
      setConflictSearch("");
      onClose();
      return;
    }

    cancelUploadRef.current = true;
    setStatusMessage("Cancelling upload...");
    activeUploadControllersRef.current.forEach((controller) => controller.abort());
    setSelectedFiles((prev) => {
      prev.forEach((item) => revokePreviewUrl(item.previewUrl));
      return [];
    });
    setDetectedConflictIds([]);
    setConflictResolutions({});
    setConflictSearch("");
    onClose();
  };

  const getUploadFilepath = (fileName: string) =>
    `${uploadPath?.replace(/\/+$/, "") || ""}/${fileName}`;

  const setConflictResolution = (id: string, mode: UploadConflictMode) => {
    setConflictResolutions((prev) => ({ ...prev, [id]: mode }));
  };

  const applyConflictResolutionToAll = (mode: UploadConflictMode) => {
    setConflictResolutions((prev) => {
      const next = { ...prev };
      detectedConflictIds.forEach((id) => {
        next[id] = mode;
      });
      return next;
    });
  };

  const handleUpload = async (requestedMode?: unknown) => {
    const mode = requestedMode === "failedOnly" ? "failedOnly" : "all";

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
        return item.status !== "uploaded" && item.status !== "skipped";
      });

      if (!filesToUpload.length) {
        setStatusMessage("No files pending upload.");
        setIsUploading(false);
        return;
      }

      const shouldDetectConflicts = mode === "all" && detectedConflictIds.length === 0;
      if (shouldDetectConflicts) {
        const selectedNameCounts = new Map<string, number>();
        filesToUpload.forEach((item) => {
          getComparableFileNameKeys(item.file.name).forEach((key) => {
            selectedNameCounts.set(key, (selectedNameCounts.get(key) || 0) + 1);
          });
        });
        const clientDetectedConflictIds = new Set(
          filesToUpload
            .filter((item) => {
              const keys = getComparableFileNameKeys(item.file.name);
              return keys.some((key) => existingFileNameSet.has(key) || (selectedNameCounts.get(key) || 0) > 1);
            })
            .map((item) => item.id)
        );

        setStatusMessage(`Checking ${filesToUpload.length} file(s) for duplicate names...`);
        const conflictCheckResponse = await fileManagerApi.detectExternalUploadConflicts(
          filesToUpload.map((item) => ({
            filepath: getUploadFilepath(item.file.name),
            fileName: item.file.name,
          }))
        );
        const conflictCheckWithItems = conflictCheckResponse as typeof conflictCheckResponse & {
          items?: typeof conflictCheckResponse.data.items;
        };
        const conflictCheckItems = Array.isArray(conflictCheckWithItems.items)
          ? conflictCheckWithItems.items
          : Array.isArray(conflictCheckResponse?.data?.items)
            ? conflictCheckResponse.data.items
            : [];
        if (conflictCheckItems.length !== filesToUpload.length) {
          setSelectedFiles((prev) =>
            prev.map((item) =>
              filesToUpload.some((queued) => queued.id === item.id)
                ? { ...item, status: "failed", error: "Unable to check duplicate file name." }
                : item
            )
          );
          setStatusMessage("Could not check duplicate file names. Upload stopped so existing files are not overwritten.");
          setIsUploading(false);
          return;
        }
        const failedConflictChecks = conflictCheckItems.filter((item) => !item.success);
        if (failedConflictChecks.length > 0) {
          setSelectedFiles((prev) =>
            prev.map((item) => {
              const failedCheck = failedConflictChecks.find(
                (entry) => entry.filepath === getUploadFilepath(item.file.name)
              );
              if (!failedCheck) return item;
              return {
                ...item,
                status: "failed",
                error: failedCheck.error || "Unable to check duplicate file name.",
              };
            })
          );
          setStatusMessage("Could not check duplicate file names. Upload stopped so existing files are not overwritten.");
          setIsUploading(false);
          return;
        }

        const existingPathConflictIds = new Set(
          conflictCheckItems
            .filter((entry) => entry.exists)
            .map((entry) => entry.filepath)
        );
        filesToUpload.forEach((item) => {
          if (existingPathConflictIds.has(getUploadFilepath(item.file.name))) {
            clientDetectedConflictIds.add(item.id);
          }
        });

        const nextConflictIds = Array.from(clientDetectedConflictIds);

        if (nextConflictIds.length > 0) {
          setDetectedConflictIds(nextConflictIds);
          setConflictResolutions((prev) => {
            const next = { ...prev };
            nextConflictIds.forEach((id) => {
              next[id] = next[id] || "replace";
            });
            return next;
          });
          setSelectedFiles((prev) =>
            prev.map((item) =>
              nextConflictIds.includes(item.id)
                ? { ...item, status: "queued", error: "Duplicate file name found." }
                : { ...item, status: "queued", error: undefined }
            )
          );
          setStatusMessage(`${nextConflictIds.length} duplicate file(s) found. Choose what to do, then continue upload.`);
          setIsUploading(false);
          return;
        }
      }

      let nextIndex = 0;
      let uploaded = selectedFiles.filter((item) => item.status === "uploaded").length;
      let skipped = selectedFiles.filter((item) => item.status === "skipped").length;
      let failed = 0;
      const pendingMetadataItems: Array<{
        id: string;
        filepath: string;
        fileContentType: string;
        fileSize: number;
        fileName: string;
        file: File;
      }> = [];

      const policyByFilePath = new Map<string, { url?: string; fields?: Record<string, string>; filepath: string; skipped?: boolean }>();
      const policyFailedPaths = new Set<string>();
      const fileIdByFilePath = new Map<string, string>();
      const policyRequests = filesToUpload.map((item) => ({
        id: item.id,
        filepath: getUploadFilepath(item.file.name),
        fileContentType: item.file.type,
        fileSize: item.file.size,
        conflictMode: shouldDetectConflicts ? "skip" as UploadConflictMode : conflictResolutions[item.id] || "replace" as UploadConflictMode,
      }));
      policyRequests.forEach((item) => fileIdByFilePath.set(item.filepath, item.id));

      const policyChunks = chunkArray(policyRequests, UPLOAD_POLICY_BATCH_SIZE);
      for (let index = 0; index < policyChunks.length; index += 1) {
        if (cancelUploadRef.current) break;
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
                conflictMode: item.conflictMode,
              }))
            );
            const responseWithItems = response as typeof response & { items?: BatchPolicyItem[] };
            const batchItems = Array.isArray(responseWithItems.items)
              ? responseWithItems.items
              : Array.isArray(response.data?.items)
                ? response.data.items
                : [];

            batchItems.forEach((item) => {
              if (item.success && item.data?.skipped) {
                policyByFilePath.set(item.filepath, {
                  filepath: item.data.filepath || item.filepath,
                  skipped: true,
                });
              } else if (item.success && item.data?.url && item.data?.fields) {
                policyByFilePath.set(item.filepath, {
                  url: item.data.url,
                  fields: item.data.fields,
                  filepath: item.data.filepath || item.filepath,
                });
              } else {
                policyFailedPaths.add(item.filepath);
              }
            });
            continue;
          } catch (error: unknown) {
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
          if (cancelUploadRef.current) return;
          try {
            const single = await runWithRetry(async () =>
              fileManagerApi.getExternalUploadPolicy(
                item.filepath,
                item.fileContentType,
                item.fileSize,
                item.conflictMode
              )
            );
            if (single?.data?.skipped) {
              policyByFilePath.set(item.filepath, {
                filepath: single.data.filepath || item.filepath,
                skipped: true,
              });
              return;
            }
            if (single?.data?.url && single?.data?.fields) {
              policyByFilePath.set(item.filepath, {
                url: single.data.url,
                fields: single.data.fields,
                filepath: single.data.filepath || item.filepath,
              });
              return;
            }
            policyFailedPaths.add(item.filepath);
          } catch {
            policyFailedPaths.add(item.filepath);
          }
        });
      }

      if (shouldDetectConflicts) {
        const nextConflictIds = Array.from(policyByFilePath.entries())
          .filter(([, policy]) => policy.skipped)
          .map(([filepath]) => fileIdByFilePath.get(filepath))
          .filter((id): id is string => Boolean(id));

        if (nextConflictIds.length > 0) {
          setDetectedConflictIds(nextConflictIds);
          setConflictResolutions((prev) => {
            const next = { ...prev };
            nextConflictIds.forEach((id) => {
              next[id] = next[id] || "replace";
            });
            return next;
          });
          setSelectedFiles((prev) =>
            prev.map((item) =>
              nextConflictIds.includes(item.id)
                ? { ...item, status: "queued", error: "Duplicate file name found." }
                : { ...item, status: "queued", error: undefined }
            )
          );
          setStatusMessage(`${nextConflictIds.length} duplicate file(s) found. Choose what to do, then continue upload.`);
          setIsUploading(false);
          return;
        }
      }

      const uploadSingle = async (item: UploadQueueItem) => {
        if (cancelUploadRef.current) return;
        const selectedFile = item.file;
        const filepath = getUploadFilepath(selectedFile.name);
        setFileStatus(item.id, "uploading");

        if (cancelUploadRef.current) {
          setFileStatus(item.id, "queued");
          return;
        }

        if (policyFailedPaths.has(filepath) || !policyByFilePath.has(filepath)) {
          failed += 1;
          setFileStatus(item.id, "failed", "Failed to prepare upload policy.");
          setStatusMessage(
            `Uploaded ${uploaded}/${selectedFiles.length} files${failed ? `, failed ${failed}` : ""}.`
          );
          return;
        }

        try {
          const uploadPolicy = policyByFilePath.get(filepath)!;
          if (uploadPolicy.skipped) {
            skipped += 1;
            setFileStatus(item.id, "skipped", "Skipped duplicate.");
            setStatusMessage(
              `Uploaded ${uploaded}/${selectedFiles.length} files, skipped ${skipped}${failed ? `, failed ${failed}` : ""}.`
            );
            return;
          }
          if (!uploadPolicy.url || !uploadPolicy.fields) {
            throw new Error("Upload policy is missing signed upload fields.");
          }
          await uploadFileToGcs(uploadPolicy as { url: string; fields: Record<string, string> }, selectedFile);
          pendingMetadataItems.push({
            id: item.id,
            filepath: uploadPolicy.filepath,
            fileContentType: selectedFile.type,
            fileSize: selectedFile.size,
            fileName: selectedFile.name,
            file: selectedFile,
          });
          uploaded += 1;
          setFileStatus(item.id, "uploaded");
        } catch (error: unknown) {
          if (cancelUploadRef.current) {
            setFileStatus(item.id, "queued");
            return;
          }
          failed += 1;
          setFileStatus(item.id, "failed", getErrorMessage(error, "Upload failed."));
        }

        setStatusMessage(
          `Uploaded ${uploaded}/${selectedFiles.length} files${skipped ? `, skipped ${skipped}` : ""}${failed ? `, failed ${failed}` : ""}.`
        );
      };

      const worker = async () => {
        while (!cancelUploadRef.current && nextIndex < filesToUpload.length) {
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
              const response = await runWithRetry(
                async () =>
                  fileManagerApi.notifyExternalFilesUploadedBatch(
                    chunk.map((item) => ({
                      filepath: item.filepath,
                      fileContentType: item.fileContentType,
                      fileSize: item.fileSize,
                      fileName: item.fileName,
                    }))
                  ),
                false
              );
              const responseWithItems = response as typeof response & { items?: BatchMetadataItem[] };
              const metadataItems = Array.isArray(responseWithItems.items)
                ? responseWithItems.items
                : Array.isArray(response.data?.items)
                  ? response.data.items
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
            } catch (error: unknown) {
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
                      error: getErrorMessage(error, "Metadata save failed. Retry failed files."),
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
              await runWithRetry(
                async () => fileManagerApi.notifyExternalFileUploaded(entry.filepath, entry.file),
                false
              );
            } catch (singleError: unknown) {
              metadataFailed += 1;
              setSelectedFiles((prev) =>
                prev.map((queued) => {
                  if (queued.id !== entry.id) return queued;
                  return {
                    ...queued,
                    status: "failed",
                    error: getErrorMessage(singleError, "Metadata save failed. Retry failed files."),
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

      if (cancelUploadRef.current) {
        setSelectedFiles((prev) =>
          prev.map((item) => (item.status === "uploading" ? { ...item, status: "queued" } : item))
        );
        setStatusMessage(`Upload cancelled. Uploaded ${uploaded}/${selectedFiles.length} files${skipped ? `, skipped ${skipped}` : ""}.`);
        return;
      }

      if (failed > 0) {
        setStatusMessage(
          `Completed with issues. Uploaded ${uploaded}/${selectedFiles.length}${skipped ? `, skipped ${skipped}` : ""}, failed ${failed}.`
        );
        setSelectedFiles((prev) => {
          const failedIds = prev.filter((item) => item.status === "failed").map((item) => item.id);
          prev.forEach((item) => {
            if (item.status !== "failed") {
              revokePreviewUrl(item.previewUrl);
            }
          });
          setDetectedConflictIds((conflictIds) => conflictIds.filter((id) => failedIds.includes(id)));
          setConflictResolutions((resolutions) =>
            Object.fromEntries(
              Object.entries(resolutions).filter(([id]) => failedIds.includes(id))
            )
          );
          return prev.filter((item) => item.status === "failed");
        });
      } else {
        setSelectedFiles((prev) => {
          prev.forEach((item) => revokePreviewUrl(item.previewUrl));
          return [];
        });
        setDetectedConflictIds([]);
        setConflictResolutions({});
        setStatusMessage(null);
        onClose();
      }
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, "Upload failed."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      {/* Modal Container */}
      <div className={`flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-white/10 bg-black" : "border-zinc-200 bg-white"
        }`}>

        {/* Header */}
        <div className="relative shrink-0 p-3 lg:p-5">
          <button
            onClick={cancelUpload}
            className={`absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              }`}
          >
            <X size={20} />
          </button>

          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>Upload Files</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
            Files will be uploaded to the folder <span className={isDark ? "text-white/80" : "text-zinc-800 font-medium"}>{folderName}</span>
          </p>
          {uploadPath ? (
            <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-zinc-400"}`}>{uploadPath}</p>
          ) : (
            <p className={`mt-1 text-xs ${isDark ? "text-red-300" : "text-red-500"}`}>Open a folder before uploading files.</p>
          )}
          {detectedConflictIds.length > 0 && (
            <div className={`mt-3 rounded-lg border p-3 ${isDark ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/5" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {detectedConflictIds.length} duplicate file{detectedConflictIds.length === 1 ? "" : "s"} found
                  </p>
                  <p className={`text-xs ${isDark ? "text-white/50" : "text-zinc-600"}`}>
                    Use a bulk action for all files, then search and change only exceptions.
                  </p>
                </div>
                <div className="grid min-w-[330px] grid-cols-3 gap-1">
                  {conflictOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isUploading}
                      onClick={() => applyConflictResolutionToAll(option.value)}
                      className={`h-8 whitespace-nowrap rounded-md px-3 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isDark
                        ? "bg-white/10 text-white/80 hover:bg-white/15"
                        : "bg-white text-zinc-700 hover:bg-zinc-100"
                        }`}
                    >
                      All {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`mt-3 grid grid-cols-3 gap-2 rounded-md border p-2 text-center text-[11px] ${isDark ? "border-white/10 bg-black/20 text-white/60" : "border-zinc-200 bg-white text-zinc-600"}`}>
                <span>Replace {conflictResolutionCounts.replace}</span>
                <span>Skip {conflictResolutionCounts.skip}</span>
                <span>Keep both {conflictResolutionCounts.keep_both}</span>
              </div>

              {detectedConflictIds.length > 8 && (
                <input
                  value={conflictSearch}
                  onChange={(event) => setConflictSearch(event.target.value)}
                  disabled={isUploading}
                  placeholder="Search duplicate files..."
                  className={`mt-3 h-9 w-full rounded-md border px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60 ${isDark
                    ? "border-white/10 bg-black/30 text-white placeholder:text-white/35 focus:border-[#E8D1AB]/50"
                    : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400"
                    }`}
                />
              )}

              <div className="mt-3 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                {filteredConflictItems.length > 0 ? (
                  filteredConflictItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-md border p-2 ${isDark ? "border-white/10 bg-black/25" : "border-zinc-200 bg-white"}`}
                    >
                      <p className={`truncate text-xs font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
                        {item.file.name}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        {conflictOptions.map((option) => {
                          const active = (conflictResolutions[item.id] || "replace") === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isUploading}
                              onClick={() => setConflictResolution(item.id, option.value)}
                              className={`h-8 rounded-md px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${active
                                ? isDark
                                  ? "bg-[#E8D1AB] text-black"
                                  : "bg-black text-white"
                                : isDark
                                  ? "text-white/70 hover:bg-white/10"
                                  : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`rounded-md border p-3 text-center text-xs ${isDark ? "border-white/10 text-white/45" : "border-zinc-200 text-zinc-500"}`}>
                    No duplicate files match this search.
                  </p>
                )}
              </div>
            </div>
          )}
          {selectedFiles.length > 0 && (
            <div className={`mt-3 space-y-2 rounded-lg border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
              }`}>
              <div className={`flex items-center justify-between text-xs ${isDark ? "text-white/70" : "text-zinc-600"}`}>
                <span>
                  Uploaded {uploadedCount}/{totalCount}
                </span>
                <span>
                  Failed {failedCount} | Skipped {skippedCount} | Pending {Math.max(totalCount - completedCount, 0)}
                </span>
              </div>
              <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-200 ${isDark ? "bg-[#E8D1AB]" : "bg-black"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`h-[1px] w-full shrink-0 ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />

        {/* Dropzone Area */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-5">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex ${detectedConflictIds.length > 0 ? "h-[140px]" : "h-[185px]"} cursor-pointer flex-col items-center justify-center rounded-[10px] border transition-all duration-200 
          ${isDragging
                ? isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/5" : "border-black bg-zinc-50"
                : isDark
                  ? "border-white/10 bg-[#202020] hover:border-white/20 hover:bg-[#202020]/[0.04]"
                  : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
              }`}
          >
            <input type="file" className="hidden" ref={fileInputRef} multiple onChange={(e) => handleFiles(e.target.files)} />

            <div className="mb-4 flex h-16 w-16 items-center justify-center">
              <UploadCloud className={isDark ? "text-[#E8D1AB]" : "text-zinc-600"} size={32} />
            </div>

            <p className={`text-lg font-medium ${isDark ? "text-white" : "text-zinc-800"}`}>
              Drag your files here or{" "}
              <span className={
                isDark
                  ? "text-[#E8D1AB] underline decoration-[#E8D1AB]/30 underline-offset-4 hover:decoration-[#E8D1AB]"
                  : "text-zinc-900 underline decoration-zinc-900/30 underline-offset-4 hover:decoration-zinc-900"
              }>
                Browse
              </span>
            </p>
            {selectionError && (
              <p className="mt-2 text-sm font-medium text-red-500">
                {selectionError}
              </p>
            )}
          </div>

          {/* File List Area */}
          {selectedFiles.length > 0 && (
            <div className={`mt-4 max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin ${isDark ? "scrollbar-thumb-white/10" : "scrollbar-thumb-zinc-200"
              }`}>
              {selectedFiles.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg p-3 border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className={`h-11 w-11 rounded-md object-cover shrink-0 border ${isDark ? "border-white/10" : "border-zinc-200"
                          }`}
                      />
                    ) : (
                      <div className={`flex h-11 w-11 items-center justify-center rounded-md border shrink-0 ${isDark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
                        }`}>
                        <File size={18} className={isDark ? "text-[#E8D1AB]" : "text-zinc-500"} />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-zinc-800"}`}>{item.file.name}</p>
                      <p className={`text-xs ${isDark ? "text-white/40" : "text-zinc-500"}`}>
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className={`text-[11px] capitalize ${isDark ? "text-white/50" : "text-zinc-400"}`}>
                        {item.status === "failed"
                          ? `Failed${item.error ? `: ${item.error}` : ""}`
                          : item.status === "skipped"
                            ? "Skipped duplicate"
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
                    className={`p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white/40 hover:text-red-400" : "text-zinc-400 hover:text-red-500"
                      }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {statusMessage && (
            <div className={`mt-4 rounded-lg border p-3 text-sm ${isDark ? "border-white/10 bg-white/5 text-white/70" : "border-zinc-200 bg-zinc-50 text-zinc-700"
              }`}>
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex shrink-0 items-center gap-3 border-t p-3 lg:p-5 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <button
            onClick={cancelUpload}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none lg:min-w-[90px] ${isDark ? "bg-white text-black" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              }`}
          >
            {isUploading ? "Cancel Upload" : "Cancel"}
          </button>
          <button
            onClick={() => handleUpload()}
            disabled={isUploading || !uploadPath}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 lg:flex-none lg:min-w-[110px] ${isDark ? "bg-[#E8D1AB] text-[#101010]" : "bg-black text-white"
              }`}
          >
            {isUploading ? `Uploading ${uploadedCount}/${totalCount}` : detectedConflictIds.length > 0 ? "Continue Upload" : "Upload Files"}
          </button>
          {failedCount > 0 && (
            <button
              onClick={() => handleUpload("failedOnly")}
              disabled={isUploading || !uploadPath}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark
                  ? "border border-[#E8D1AB]/50 text-[#E8D1AB] hover:bg-[#E8D1AB]/10"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
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
