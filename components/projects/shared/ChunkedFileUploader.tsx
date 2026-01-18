'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useInitiateFileUploadMutation,
  useUploadChunkMutation,
  useCompleteUploadMutation,
} from '@/lib/redux/features/projects/projectsApi';
import { FileCategory, ProjectFile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Upload,
  X,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileAudio,
  FileImage,
  File,
  Trash2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface UploadItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

interface CurrentUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  totalBytes: number;
  progress: number;
  speed: number;
  currentChunk: number;
  totalChunks: number;
  uploadSessionId: string | null;
  fileId: number | null;
  isPaused: boolean;
  startTime: number;
  lastChunkTime: number;
}

interface ChunkedFileUploaderProps {
  projectId: number;
  fileCategory: FileCategory;
  onUploadComplete: (file: ProjectFile) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  chunkSize?: number;
  maxRetries?: number;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 MB/s';
  const mbps = bytesPerSecond / (1024 * 1024);
  return `${mbps.toFixed(2)} MB/s`;
}

function getFileIcon(fileName: string): React.ReactNode {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'];
  const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

  if (videoExtensions.includes(extension)) {
    return <FileVideo className="w-5 h-5" />;
  }
  if (audioExtensions.includes(extension)) {
    return <FileAudio className="w-5 h-5" />;
  }
  if (imageExtensions.includes(extension)) {
    return <FileImage className="w-5 h-5" />;
  }
  return <File className="w-5 h-5" />;
}

function validateFileType(file: File, acceptedTypes: string[]): boolean {
  if (acceptedTypes.length === 0) return true;

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  return acceptedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const category = type.replace('/*', '');
      return fileType.startsWith(`${category}/`);
    }
    if (type.startsWith('.')) {
      return fileName.endsWith(type.toLowerCase());
    }
    return fileType === type;
  });
}

function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// ============================================================================
// Component
// ============================================================================

export function ChunkedFileUploader({
  projectId,
  fileCategory,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024 * 1024, // 10GB
  acceptedTypes = ['video/*', 'audio/*', 'image/*'],
  chunkSize = 10 * 1024 * 1024, // 10MB
  maxRetries = 3,
  disabled = false,
  className,
}: ChunkedFileUploaderProps) {
  // ============================================================================
  // State
  // ============================================================================
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [currentUpload, setCurrentUpload] = useState<CurrentUpload | null>(null);
  const [completedUploads, setCompletedUploads] = useState<ProjectFile[]>([]);

  // ============================================================================
  // Refs
  // ============================================================================
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const isProcessingRef = useRef(false);

  // ============================================================================
  // RTK Query Mutations
  // ============================================================================
  const [initiateUpload] = useInitiateFileUploadMutation();
  const [uploadChunk] = useUploadChunkMutation();
  const [completeUpload] = useCompleteUploadMutation();

  // ============================================================================
  // File Validation
  // ============================================================================
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${formatBytes(maxFileSize)}`,
        };
      }

      if (!validateFileType(file, acceptedTypes)) {
        return {
          valid: false,
          error: `File type not accepted. Allowed types: ${acceptedTypes.join(', ')}`,
        };
      }

      return { valid: true };
    },
    [maxFileSize, acceptedTypes]
  );

  // ============================================================================
  // Upload Logic
  // ============================================================================
  const uploadSingleChunk = useCallback(
    async (
      chunk: Blob,
      chunkIndex: number,
      uploadSessionId: string,
      retryCount = 0
    ): Promise<boolean> => {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('upload_session_id', uploadSessionId);
        formData.append('chunk_index', chunkIndex.toString());

        const result = await uploadChunk({
          projectId,
          formData,
        }).unwrap();

        return result.uploaded;
      } catch (error) {
        if (retryCount < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return uploadSingleChunk(chunk, chunkIndex, uploadSessionId, retryCount + 1);
        }
        throw error;
      }
    },
    [uploadChunk, projectId, maxRetries]
  );

  const processUpload = useCallback(
    async (item: UploadItem) => {
      const { file, id } = item;
      const totalChunks = Math.ceil(file.size / chunkSize);

      try {
        // Step 1: Initiate upload session
        const session = await initiateUpload({
          projectId,
          data: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || getMimeType(file.name),
            file_category: fileCategory,
          },
        }).unwrap();

        const startTime = Date.now();

        setCurrentUpload({
          id,
          fileName: file.name,
          fileSize: file.size,
          uploadedBytes: 0,
          totalBytes: file.size,
          progress: 0,
          speed: 0,
          currentChunk: 0,
          totalChunks,
          uploadSessionId: session.upload_session_id,
          fileId: session.file_id,
          isPaused: false,
          startTime,
          lastChunkTime: startTime,
        });

        // Step 2: Upload chunks sequentially
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          // Check if paused
          while (isPausedRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Upload cancelled');
          }

          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const success = await uploadSingleChunk(
            chunk,
            chunkIndex,
            session.upload_session_id
          );

          if (!success) {
            throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
          }

          const uploadedBytes = end;
          const currentTime = Date.now();
          const elapsedSeconds = (currentTime - startTime) / 1000;
          const speed = elapsedSeconds > 0 ? uploadedBytes / elapsedSeconds : 0;

          setCurrentUpload((prev) =>
            prev
              ? {
                  ...prev,
                  uploadedBytes,
                  progress: Math.round((uploadedBytes / file.size) * 100),
                  speed,
                  currentChunk: chunkIndex + 1,
                  lastChunkTime: currentTime,
                }
              : null
          );
        }

        // Step 3: Complete upload
        const completedFile = await completeUpload({
          projectId,
          data: {
            upload_session_id: session.upload_session_id,
          },
        }).unwrap();

        // Update state
        setCompletedUploads((prev) => [...prev, completedFile]);
        setUploadQueue((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'completed' as const } : u))
        );

        onUploadComplete(completedFile);

        return completedFile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';

        setUploadQueue((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: 'failed' as const, error: errorMessage } : u
          )
        );

        onUploadError?.(errorMessage);
        throw error;
      }
    },
    [
      chunkSize,
      initiateUpload,
      projectId,
      fileCategory,
      uploadSingleChunk,
      completeUpload,
      onUploadComplete,
      onUploadError,
    ]
  );

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const queuedItems = uploadQueue.filter((item) => item.status === 'queued');

    for (const item of queuedItems) {
      abortControllerRef.current = new AbortController();
      isPausedRef.current = false;

      setUploadQueue((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading' as const } : u))
      );

      try {
        await processUpload(item);
      } catch {
        // Error already handled in processUpload
      }

      setCurrentUpload(null);
      abortControllerRef.current = null;
    }

    isProcessingRef.current = false;
  }, [uploadQueue, processUpload]);

  // Start processing queue when items are added
  useEffect(() => {
    const hasQueued = uploadQueue.some((item) => item.status === 'queued');
    const hasUploading = uploadQueue.some((item) => item.status === 'uploading');

    if (hasQueued && !hasUploading && !isProcessingRef.current) {
      processQueue();
    }
  }, [uploadQueue, processQueue]);

  // ============================================================================
  // Event Handlers
  // ============================================================================
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newItems: UploadItem[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);

        if (!validation.valid) {
          onUploadError?.(validation.error || 'Invalid file');
          continue;
        }

        newItems.push({
          id: generateId(),
          file,
          fileName: file.name,
          fileSize: file.size,
          status: 'queued',
        });
      }

      if (newItems.length > 0) {
        setUploadQueue((prev) => [...prev, ...newItems]);
      }
    },
    [validateFile, onUploadError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handlePauseResume = useCallback(() => {
    isPausedRef.current = !isPausedRef.current;
    setCurrentUpload((prev) =>
      prev ? { ...prev, isPaused: isPausedRef.current } : null
    );
  }, []);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (currentUpload) {
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === currentUpload.id ? { ...u, status: 'cancelled' as const } : u
        )
      );
    }
    setCurrentUpload(null);
  }, [currentUpload]);

  const handleRemoveFromQueue = useCallback((itemId: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleRetry = useCallback(
    (item: UploadItem) => {
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: 'queued' as const, error: undefined } : u
        )
      );
    },
    []
  );

  // ============================================================================
  // Render
  // ============================================================================
  const acceptedTypesString = acceptedTypes.join(',');
  const isUploading = currentUpload !== null;
  const queuedCount = uploadQueue.filter((item) => item.status === 'queued').length;

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file drop zone. Click to browse or drag and drop files."
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE] focus:ring-offset-2 focus:ring-offset-[#101010]',
          isDragging
            ? 'border-[#ECE1CE] bg-[#ECE1CE]/10 scale-[1.02]'
            : 'border-gray-600 hover:border-gray-500',
          (isUploading || disabled) && 'pointer-events-none opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypesString}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
          disabled={disabled}
        />

        <motion.div
          initial={false}
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-[#ECE1CE]/20' : 'bg-gray-800'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 transition-colors',
                isDragging ? 'text-[#ECE1CE]' : 'text-gray-400'
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-white font-medium">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-gray-400 text-sm">
              or <span className="text-[#ECE1CE] underline">browse</span> to select
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              Maximum file size: {formatBytes(maxFileSize)}
            </p>
            <p>
              Accepted formats: {acceptedTypes.join(', ').replace(/\*/g, '')}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Current Upload Progress */}
      <AnimatePresence mode="wait">
        {currentUpload && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <div className="bg-[#101010] border border-gray-800 rounded-lg p-4">
              {/* File Info Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-[#ECE1CE] flex-shrink-0">
                    {getFileIcon(currentUpload.fileName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      {currentUpload.fileName}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Chunk {currentUpload.currentChunk} of {currentUpload.totalChunks}
                    </p>
                  </div>
                </div>
                <span className="text-[#ECE1CE] font-semibold text-lg ml-4">
                  {currentUpload.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ECE1CE] to-[#d4c4a8]"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentUpload.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {formatBytes(currentUpload.uploadedBytes)} / {formatBytes(currentUpload.totalBytes)}
                </span>
                <span className="text-gray-400">
                  {formatSpeed(currentUpload.speed)}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePauseResume();
                  }}
                  className="border-gray-600 hover:border-gray-500 text-white"
                  aria-label={currentUpload.isPaused ? 'Resume upload' : 'Pause upload'}
                >
                  {currentUpload.isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  aria-label="Cancel upload"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>

              {/* Paused Indicator */}
              <AnimatePresence>
                {currentUpload.isPaused && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-center"
                  >
                    <span className="text-yellow-500 text-sm font-medium">
                      Upload paused
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue */}
      <AnimatePresence>
        {queuedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium text-sm">
                Queued ({queuedCount})
              </h4>
            </div>
            <div className="space-y-2">
              {uploadQueue
                .filter((item) => item.status === 'queued')
                .map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-gray-400 flex-shrink-0">
                        {getFileIcon(item.fileName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{item.fileName}</p>
                        <p className="text-gray-500 text-xs">{formatBytes(item.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromQueue(item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      aria-label={`Remove ${item.fileName} from queue`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failed Uploads */}
      <AnimatePresence>
        {uploadQueue.filter((item) => item.status === 'failed').length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <h4 className="text-red-400 font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Failed Uploads
            </h4>
            <div className="space-y-2">
              {uploadQueue
                .filter((item) => item.status === 'failed')
                .map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-red-400 flex-shrink-0">
                        {getFileIcon(item.fileName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{item.fileName}</p>
                        <p className="text-red-400 text-xs">{item.error || 'Upload failed'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(item)}
                        className="border-red-500/50 hover:border-red-500 text-red-400 hover:text-red-300"
                      >
                        Retry
                      </Button>
                      <button
                        onClick={() => handleRemoveFromQueue(item.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        aria-label={`Remove ${item.fileName} from list`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Uploads */}
      <AnimatePresence>
        {completedUploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <h4 className="text-green-400 font-medium text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedUploads.length})
            </h4>
            <div className="space-y-2">
              {completedUploads.map((file, index) => (
                <motion.div
                  key={file.file_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-green-400 flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{file.file_name}</p>
                      <p className="text-green-400 text-xs">
                        {formatBytes(file.file_size_bytes)} - Upload complete
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChunkedFileUploader;
