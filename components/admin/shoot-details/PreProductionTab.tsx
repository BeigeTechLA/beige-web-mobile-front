"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Loader2,
  ExternalLink,
  Play,
  Presentation,
} from "lucide-react";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import {
  fileManagerApi,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
} from "@/lib/fileManagerApi";
import { useTheme } from "next-themes";

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const isImageFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension);
  }
  return Boolean(contentType?.startsWith("image/"));
};

const isVideoFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["mp4", "mov", "avi", "mkv", "webm"].includes(extension);
  }
  return Boolean(contentType?.startsWith("video/"));
};

const getFileMeta = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);

  if (isImageFile(contentType, title)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }

  if (isVideoFile(contentType, title)) {
    return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]", badgeClass: "bg-[#E8D1AB]/15" };
  }

  if (contentType === "application/pdf" || extension === "pdf") {
    return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]", badgeClass: "bg-[#F04438]/15" };
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]", badgeClass: "bg-[#3B82F6]/15" };
  }

  if (["ppt", "pptx", "key"].includes(extension)) {
    return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]", badgeClass: "bg-[#F97316]/15" };
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]", badgeClass: "bg-[#10B981]/15" };
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]", badgeClass: "bg-[#A855F7]/15" };
  }

  return { icon: FileText, label: extension || "file", accentClass: "text-white/80", badgeClass: "bg-white/10" };
};

export default function PreProductionTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  const [workspaceName, setWorkspaceName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const loadPreProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "pre");
      setWorkspaceName(response?.workspace?.folderName || "");
      setFolders(
        mapExternalFoldersToUi(
          response?.folders || [],
          (folder) =>
            `/admin/file-manager/${projectId}/pre-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
      setFiles(mapExternalFilesToUi(response?.files || []));
    } catch (err: any) {
      setError(err?.message || "Failed to load pre-production files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadPreProduction();
    }
  }, [projectId]);

  useEffect(() => {
    const previewableFiles = files.filter(
      (file) =>
        file.filepath &&
        (file.contentType?.startsWith("image/") || file.contentType?.startsWith("video/"))
    );

    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file) => {
          try {
            const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
            return [file.id, result.url] as const;
          } catch {
            return [file.id, ""] as const;
          }
        })
      );

      if (!active) return;

      setPreviewUrls((prev) => ({
        ...prev,
        ...Object.fromEntries(entries.filter(([, url]) => !!url)),
      }));
    };

    loadPreviews();

    return () => {
      active = false;
    };
  }, [files]);

  const hasContent = useMemo(() => folders.length > 0 || files.length > 0, [folders.length, files.length]);

  return (
    <div className="space-y-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      {/* Topbar Banner Wrapper */}
      <div className={`flex items-stretch justify-between rounded-lg lg:rounded-2xl border overflow-hidden min-h-[46px] lg:min-h-[72px] w-full ${isDark ? "bg-[#111111] border-[#222222]" : "bg-[#F4F5F7] border-[#FFFFFF33] shadow-sm"}`}>
        <div className={`flex-1 min-w-0 flex items-center px-3 py-2 lg:px-6 lg:py-4 text-xs lg:text-base font-medium break-words ${isDark ? "text-[#666666]" : "text-[#7C7474]"}`}>
          <span className="w-full whitespace-normal leading-normal">
            {workspaceName ? `Live Pre Production for ${workspaceName}` : "Open and manage Pre Production files"}
          </span>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className={`px-3 lg:px-6 shrink-0 font-medium flex items-center justify-center gap-1.5 lg:gap-2 transition-colors ${isDark
            ? "bg-white text-black hover:bg-zinc-200"
            : "bg-black text-[#E8D1AB] hover:bg-black/80"
            }`}
        >
          <CloudUpload size={20} className="shrink-0" />
          <span className="text-sm lg:text-base leading-none select-none">Upload File</span>
        </button>
      </div>

      {loading ? (
        <div className={`border rounded-2xl min-h-[220px] flex items-center justify-center ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#DFDDDD]"
          }`}>
          <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/40"}`} size={28} />
        </div>
      ) : error ? (
        <div className={`border rounded-2xl min-h-[220px] flex items-center justify-center text-sm ${isDark ? "bg-[#111111] border-[#222222] text-red-300" : "bg-white border-[#DFDDDD] text-red-600"}`}>
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders List Block */}
          {folders.length > 0 && (
            <div className={`border rounded-2xl overflow-hidden ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#DFDDDD] shadow-sm"}`}>
              <div className={`px-6 py-4 border-b ${isDark ? "border-[#222222] bg-[#161616]" : "border-[#DFDDDD] bg-[#FAFAFA]"}`}>
                <h3 className="text-[#E8D1AB] text-base font-medium leading-none">Folders</h3>
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => router.push(folder.href)}
                    className={`text-left flex items-center justify-between rounded-2xl border px-5 py-4 transition-colors ${isDark
                      ? "border-[#222222] bg-[#0A0A0A] hover:border-[#444]"
                      : "border-[#E3E3E3] bg-[#F9F9F9] hover:border-[#B5B5B5]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="text-[#E8D1AB]" size={20} />
                      <div>
                        <div className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{folder.title}</div>
                        <div className={`text-xs ${isDark ? "text-[#888]" : "text-black/50"}`}>{folder.fileCount} files</div>
                      </div>
                    </div>
                    <ExternalLink className={isDark ? "text-white/40" : "text-black/40"} size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Documents List Block */}
          {files.length > 0 || folders.length === 0 ? (
            <div className={`border rounded-lg lg:rounded-2xl overflow-hidden min-h-[280px] ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#DFDDDD] shadow-sm"}`}>
              <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? "border-[#222222] bg-[#161616]" : "border-[#EAE3E3] bg-[#F4F5F7]"
                }`}>
                <h3 className={`text-base font-medium leading-none ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>Uploaded Documents</h3>
              </div>

              {files.length > 0 ? (
                <div className="p-3 lg:p-6 flex gap-6 flex-wrap">
                  {files.map((file) => {
                    const meta = getFileMeta(file.contentType, file.title);
                    const FileIcon = meta.icon;

                    return (
                      <button
                        key={file.id}
                        onClick={() => router.push(`/admin/file-manager/${projectId}/pre-production`)}
                        className={`text-left border rounded-xl p-3 lg:p-4 flex items-center gap-4 w-full lg:w-[360px] group relative transition-colors ${isDark
                          ? "border-[#222222] bg-[#0A0A0A] hover:border-[#444]"
                          : "border-[#E3E3E3] bg-[#F9F9F9] hover:border-[#B5B5B5]"
                          }`}
                      >
                        {/* Media Thumbnail Box */}
                        <div className={`w-14 h-14 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border ${isDark ? "bg-[#161616] border-[#222222]" : "bg-[#F0F0F0] border-[#E3E3E3]"
                          }`}>
                          {previewUrls[file.id] && isImageFile(file.contentType, file.title) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewUrls[file.id]}
                              alt={file.title}
                              className="h-full w-full object-cover"
                            />
                          ) : previewUrls[file.id] && isVideoFile(file.contentType, file.title) ? (
                            <div className="relative h-full w-full">
                              <video
                                src={previewUrls[file.id]}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white">
                                  <Play size={12} className="ml-0.5" fill="currentColor" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.badgeClass}`}>
                                <FileIcon size={20} className={meta.accentClass} />
                              </div>
                              <span className={`text-[10px] uppercase tracking-wide ${isDark ? "text-white/70" : "text-black/70"}`}>
                                {meta.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Metadata Content Block */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm lg:text-base font-medium leading-tight mb-1 truncate ${isDark ? "text-white" : "text-black"}`}
                            title={file.title}
                          >
                            {file.title}
                          </h4>
                          <span className={`text-sm underline underline-offset-4 ${isDark ? "text-[#E8D1AB]" : "text-black/80"}`}>
                            Open in File Manager
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyFileState
                  onAction={() => setIsUploadModalOpen(true)}
                  actionLabel="Upload Files"
                  isDark={isDark} />
              )}
            </div>
          ) : null}
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName="Pre Production"
        uploadPath={workspaceName ? `${workspaceName}/Pre-Production` : undefined}
        onUploadComplete={loadPreProduction}
        isDark={isDark}
      />
    </div>
  );
}
