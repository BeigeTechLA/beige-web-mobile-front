"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
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
  ExternalLink,
  Play,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import {
  fileManagerApi,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
} from "@/lib/fileManagerApi";

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

export default function PostProductionTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { theme, resolvedTheme } = useTheme();
  const viewMode = (searchParams.get("view") as "grid" | "list") || "grid";
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const isDark = !mounted || resolvedTheme === "dark" || theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewChange = (mode: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const loadPostProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "post");
      setFolders(
        mapExternalFoldersToUi(
          response?.folders || [],
          (folder) =>
            `/admin/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
      setFiles(mapExternalFilesToUi(response?.files || []));
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

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#999999]">
            <FolderSearch size={20} />
          </div>
          <span className={`text-sm lg:text-lg font-medium transition-colors ${isDark ? "text-[#E0E0E0]" : "text-[#171717]"
            }`}>Uploaded Folders</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-[#E0E0E0] text-sm hover:bg-[#222222] transition-colors">
            <span>Status</span>
            <ChevronDown size={16} />
          </button>

          <div className="md:hidden relative">
            <Button
              onClick={toggleDropdown}
              className={`flex items-center gap-2 border p-2 h-8 rounded-lg transition-colors ${isDark ? "bg-[#202020] border-white/10 text-white" : "bg-white border-[#E3E3E3] text-[#171717]"
                }`}
            >
              {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
            </Button>

            {isOpen && (
              <div className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-[50] overflow-hidden ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-[#E3E3E3]"
                }`}>
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

      {loading ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      ) : error ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center text-red-300 text-sm">
          {error}
        </div>
      ) : viewMode === "grid" ? (
        folders.length > 0 || files.length > 0 ? (
          <div className="space-y-6">
            {folders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => router.push(folder.href)}
                    className="text-left cursor-pointer bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden group hover:border-[#333333] transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Folder className="text-[#E5D5B8] w-8 h-8" />
                          <div>
                            <h3 className="text-[#E0E0E0] font-semibold text-base group-hover:text-[#E5D5B8] transition-colors">
                              {folder.title}
                            </h3>
                            <p className="text-[#666666] text-xs mt-0.5">
                              {folder.fileCount} Items
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="text-white/40" size={16} />
                      </div>

                      <div className="flex items-center gap-3 mt-6">
                        <span className="px-4 py-2 bg-[#1A1A1A] rounded-full text-xs text-[#E0E0E0] border border-[#222222]">
                          {folder.category}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#222222] bg-[#161616]/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center text-xs font-semibold">
                        {folder.userInitials}
                      </div>
                      <span className="text-[#999999] text-sm">Updated {folder.lastOpened}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {files.length > 0 ? (
              <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden min-h-[280px]">
                <div className="px-6 py-4 border-b border-[#222222] bg-[#161616] flex justify-between items-center">
                  <h3 className="text-[#E5D5B8] text-base font-medium leading-none">Uploaded Documents</h3>
                </div>
                <div className="p-3 lg:p-6 flex gap-6 flex-wrap">
                  {files.map((file) => {
                    const meta = getFileMeta(file.contentType, file.title);
                    const FileIcon = meta.icon;

                    return (
                      <button
                        key={file.id}
                        onClick={() => router.push(`/admin/file-manager/${projectId}/post-production`)}
                        className="text-left border border-[#222222] bg-[#0A0A0A] rounded-xl p-3 lg:p-4 flex items-center gap-4 w-full lg:w-[360px] group relative hover:border-[#444] transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-[#161616] shrink-0 flex items-center justify-center overflow-hidden border border-[#222222]">
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
                              <span className="text-[10px] uppercase tracking-wide text-white/70">
                                {meta.label}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm lg:text-base font-medium leading-tight mb-1 truncate" title={file.title}>
                            {file.title}
                          </h4>
                          <span className="text-[#E5D5B8] text-sm underline underline-offset-4">
                            Open in File Manager
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
          <table className="hidden lg:table w-full text-left">
            <thead>
              <tr className={`border-b ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Name</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Category</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[10%]">Files</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Last Updated</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm text-right w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody>
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <tr
                    key={folder.id}
                    onClick={() => router.push(folder.href)}
                    className="cursor-pointer border-b border-[#222222] last:border-0 hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? "bg-[#1A1A1A] border-[#222222]" : "bg-zinc-100 border-zinc-200"
                          }`}>
                          <Folder size={20} className="text-[#999999]" />
                        </div>
                        <span className="text-[#E0E0E0] font-medium">{folder.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-4 py-1.5 bg-[#1A1A1A] text-[#E0E0E0] rounded-full text-xs font-medium">
                        {folder.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#E0E0E0] text-sm">{folder.fileCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#E0E0E0] text-sm">{folder.lastOpened}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ExternalLink className="inline-block text-white/40" size={16} />
                    </td>
                  </tr>
                ))
              ) : (
                files.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : null
              )}
              {files.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => router.push(`/admin/file-manager/${projectId}/post-production`)}
                  className="cursor-pointer border-b border-[#222222] last:border-0 hover:bg-[#161616] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border bg-[#1A1A1A] border-[#222222]">
                        {previewUrls[file.id] && file.contentType?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrls[file.id]} alt={file.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase text-[#E5D5B8]">
                            {file.title.split(".").pop() || "file"}
                          </span>
                        )}
                      </div>
                      <span className="text-[#E0E0E0] font-medium">{file.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-4 py-1.5 bg-[#1A1A1A] text-[#E0E0E0] rounded-full text-xs font-medium">
                      File
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#E0E0E0] text-sm">-</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#E0E0E0] text-sm">{file.lastOpened}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ExternalLink className="inline-block text-white/40" size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="lg:hidden p-4 space-y-3">
            {folders.length > 0 ? folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => router.push(folder.href)}
                className="w-full text-left rounded-xl border border-[#222222] bg-[#0A0A0A] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{folder.title}</div>
                    <div className="text-xs text-[#888] mt-1">{folder.fileCount} Items</div>
                  </div>
                  <ExternalLink className="text-white/40" size={16} />
                </div>
              </button>
            )) : null}
            {files.length > 0 ? files.map((file) => (
              <button
                key={file.id}
                onClick={() => router.push(`/admin/file-manager/${projectId}/post-production`)}
                className="w-full text-left rounded-xl border border-[#222222] bg-[#0A0A0A] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border bg-[#1A1A1A] border-[#222222] shrink-0">
                      {previewUrls[file.id] && file.contentType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrls[file.id]} alt={file.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase text-[#E5D5B8]">
                          {file.title.split(".").pop() || "file"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">{file.title}</div>
                      <div className="text-xs text-[#888] mt-1">Updated {file.lastOpened}</div>
                    </div>
                  </div>
                  <ExternalLink className="text-white/40 shrink-0" size={16} />
                </div>
              </button>
            )) : null}
            {folders.length === 0 && files.length === 0 ? <EmptyState /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <EmptyFileState
      title="No File Uploaded"
      description="No files have been uploaded for this project yet."
    />
  );
}
