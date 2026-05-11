"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderSearch,
  Grid3X3,
  LayoutGrid,
  List,
  Loader2,
  Play,
  Presentation,
} from "lucide-react";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AffiliatePostProductionTabProps {
  projectId: string;
}

const prettifyFolderName = (name?: string) => {
  const normalized = String(name || "").trim();
  if (!normalized) return "Folder";
  if (normalized === "Raw Footage") return "Raw Footages";
  return normalized.replace(/-/g, " ");
};

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

export default function AffiliatePostProductionTab({ projectId }: AffiliatePostProductionTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentPath, setCurrentPath] = useState("");
  const viewMode = (searchParams.get("view") as "grid" | "list") || "grid";
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerMetaId, setViewerMetaId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const loadPostProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "post", currentPath || undefined);
      setFolders(response?.folders || []);
      setFiles(response?.files || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load post-production folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadPostProduction();
    }
  }, [projectId, currentPath]);

  useEffect(() => {
    const previewableFiles = files.filter(
      (file) =>
        file.path &&
        (file.contentType?.startsWith("image/") || file.contentType?.startsWith("video/"))
    );

    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file) => {
          try {
            const result = await fileManagerApi.getExternalFileViewUrl(file.path);
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

  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  const handleOpenFile = async (file: any) => {
    try {
      setViewerOpen(true);
      setViewerUrl(null);
      setViewerName(file.name);
      setViewerType(file.contentType || "");
      setViewerMetaId(file.path || null);
      const response = await fileManagerApi.getExternalFileViewUrl(file.path);
      setViewerUrl(response.url || null);
    } catch {
      setViewerOpen(false);
    }
  };

  const handleViewChange = (mode: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#999999]">
            <FolderSearch size={20} />
          </div>
          <span className="text-sm lg:text-lg font-medium text-[#E0E0E0]">Uploaded Folders</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-[#E0E0E0] text-sm hover:bg-[#222222] transition-colors">
            <span>Status</span>
            <ChevronDown size={16} />
          </button>

          <div className="md:hidden relative">
            <Button
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
            >
              {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
            </Button>

            {isOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                <button
                  onClick={() => handleViewChange("grid")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
                >
                  <Grid3X3 size={18} />
                  Grid View
                </button>
                <button
                  onClick={() => handleViewChange("list")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
                >
                  <List size={18} />
                  List View
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:flex bg-[#1A1A1A] border border-[#222222] rounded-lg p-1">
            <button
              onClick={() => handleViewChange("grid")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "grid" ? "bg-[#E5D5B8] text-black" : "text-[#666666] hover:text-[#E0E0E0]"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "list" ? "bg-[#E5D5B8] text-black" : "text-[#666666] hover:text-[#E0E0E0]"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {currentPath && (
        <button onClick={handleBack} className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {loading ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      ) : error ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "grid" ? (
            <>
              {folders.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {folders.map((folder) => (
                    <button
                      key={folder.path}
                      onClick={() => {
                        const nextPath = [currentPath, folder.name].filter(Boolean).join("/");
                        setCurrentPath(nextPath);
                      }}
                      className="text-left cursor-pointer bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden group hover:border-[#333333] transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Folder className="text-[#E5D5B8] w-8 h-8" />
                            <div>
                              <h3 className="text-[#E0E0E0] font-semibold text-base group-hover:text-[#E5D5B8] transition-colors">
                                {prettifyFolderName(folder.name)}
                              </h3>
                              <p className="text-[#666666] text-xs mt-0.5">
                                {folder.fileCount || 0} Items
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="text-white/40" size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {files.length > 0 || folders.length === 0 ? (
                files.length > 0 ? (
                  <div className="p-3 lg:p-0 flex gap-6 flex-wrap">
                    {files.map((file) => {
                      const meta = getFileMeta(file.contentType, file.name);
                      const FileIcon = meta.icon;

                      return (
                        <button
                          key={file.id}
                          onClick={() => handleOpenFile(file)}
                          className="text-left border border-[#222222] bg-[#0A0A0A] rounded-2xl overflow-hidden group relative hover:border-[#444] transition-colors w-full sm:w-[260px]"
                        >
                          <div className="aspect-[4/3] bg-[#161616] border-b border-[#222222] flex items-center justify-center overflow-hidden">
                            {previewUrls[file.id] && isImageFile(file.contentType, file.name) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrls[file.id]}
                                alt={file.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            ) : previewUrls[file.id] && isVideoFile(file.contentType, file.name) ? (
                              <div className="relative h-full w-full">
                                <video
                                  src={previewUrls[file.id]}
                                  className="h-full w-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white">
                                    <Play size={20} className="ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.badgeClass}`}>
                                  <FileIcon size={34} className={meta.accentClass} />
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/70">
                                  {meta.label}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h4 className="text-white text-sm lg:text-base font-medium leading-tight mb-2 truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <span className="text-[#E5D5B8] text-sm underline underline-offset-4">View File</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyFileState
                    title="No File Uploaded"
                    description="No files have been uploaded for this project yet."
                  />
                )
              ) : null}
            </>
          ) : (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
              <table className="hidden lg:table w-full text-left">
                <thead>
                  <tr className="border-b border-[#222222]">
                    <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[50%]">Name</th>
                    <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Type</th>
                    <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Files</th>
                    <th className="px-6 py-4 text-[#888888] font-medium text-sm text-right w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.map((folder) => (
                    <tr
                      key={folder.path}
                      onClick={() => {
                        const nextPath = [currentPath, folder.name].filter(Boolean).join("/");
                        setCurrentPath(nextPath);
                      }}
                      className="cursor-pointer border-b border-[#222222] hover:bg-[#161616] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
                            <Folder size={20} className="text-[#999999]" />
                          </div>
                          <span className="text-[#E0E0E0] font-medium">{prettifyFolderName(folder.name)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">Folder</td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">{folder.fileCount || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <ExternalLink className="inline-block text-white/40" size={16} />
                      </td>
                    </tr>
                  ))}
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => handleOpenFile(file)}
                      className="cursor-pointer border-b border-[#222222] hover:bg-[#161616] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
                            <FileText size={20} className="text-[#E5D5B8]" />
                          </div>
                          <span className="text-[#E0E0E0] font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">File</td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">-</td>
                      <td className="px-6 py-4 text-right">
                        <ExternalLink className="inline-block text-white/40" size={16} />
                      </td>
                    </tr>
                  ))}
                  {folders.length === 0 && files.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyFileState
                          title="No File Uploaded"
                          description="No files have been uploaded for this project yet."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="lg:hidden p-4 space-y-3">
                {folders.length > 0 ? folders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => {
                      const nextPath = [currentPath, folder.name].filter(Boolean).join("/");
                      setCurrentPath(nextPath);
                    }}
                    className="w-full text-left rounded-xl border border-[#222222] bg-[#0A0A0A] px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{prettifyFolderName(folder.name)}</div>
                        <div className="text-xs text-[#888] mt-1">{folder.fileCount || 0} Items</div>
                      </div>
                      <ExternalLink className="text-white/40" size={16} />
                    </div>
                  </button>
                )) : files.length > 0 ? files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleOpenFile(file)}
                    className="w-full text-left rounded-xl border border-[#222222] bg-[#0A0A0A] px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{file.name}</div>
                        <div className="text-xs text-[#888] mt-1">File</div>
                      </div>
                      <ExternalLink className="text-white/40" size={16} />
                    </div>
                  </button>
                )) : (
                  <EmptyFileState
                    title="No File Uploaded"
                    description="No files have been uploaded for this project yet."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerMetaId(null);
        }}
        fileName={viewerName}
        fileUrl={viewerUrl}
        contentType={viewerType}
        fileMetaId={viewerMetaId}
      />
    </div>
  );
}
