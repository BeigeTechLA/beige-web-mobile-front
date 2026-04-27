"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Download,
  FileVideo,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  Play,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getDisplayInitials,
  mapExternalFilesToUi,
  slugToWorkspaceName,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { useViewMode } from "@/app/useViewMode";

const defaultImgSrc = "/images/misc/Data.png";
const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;

const tryDecodeURIComponent = (value: string) => {
  const normalizedValue = String(value || "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalizedValue);
  } catch {
    return normalizedValue;
  }
};

const normalizeRelativeFolderPath = (value: string, phaseSlug: string) => {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();
  if (!normalized) return "";

  const segments = normalized.split("/").filter(Boolean);
  const phaseSegment = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const phaseIndex = segments.findIndex((segment) => String(segment || "").trim().toLowerCase() === phaseSegment);
  if (phaseIndex >= 0) {
    return segments.slice(phaseIndex + 1).join("/");
  }

  return normalized;
};

export default function SubFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string; subFolder2: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const nestedSlug = params.subFolder2;
  const canUpload = phaseSlug !== "post-production";
  const folderPath = useMemo(() => {
    const queryPath = searchParams.get("path");
    const rawPath = queryPath ? tryDecodeURIComponent(queryPath).trim() : slugToWorkspaceName(nestedSlug);
    return normalizeRelativeFolderPath(rawPath, phaseSlug);
  }, [nestedSlug, phaseSlug, searchParams]);
  const folderName = useMemo(() => {
    const queryName = searchParams.get("name");
    if (queryName) return tryDecodeURIComponent(queryName).trim();
    const fallbackFromPath = folderPath.split("/").filter(Boolean).pop();
    return fallbackFromPath || slugToWorkspaceName(nestedSlug);
  }, [folderPath, nestedSlug, searchParams]);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        phaseSlug === "post-production" ? "post" : "pre",
        folderPath
      );
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setFiles(workspaceData.files);
    } catch (err: any) {
      setError(err?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadFiles();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [folderPath, phaseSlug, projectId]);

  const folderTitle = useMemo(() => {
    if (nestedSlug === "raw-footage") return "Raw Footages";
    if (nestedSlug === "edited-footage") return "Edited Footages";
    if (nestedSlug === "final-deliverables") return "Final Deliverables";
    return folderName || "Files";
  }, [folderName, nestedSlug]);

  const folderFiles = useMemo(() => {
    return mapExternalFilesToUi(files).map((file) => ({
      ...file,
      type: file.title.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) ? "video" : "image",
      src: defaultImgSrc,
    }));
  }, [files]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return folderFiles;
    const query = searchTerm.toLowerCase();
    return folderFiles.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderFiles, searchTerm]);
  const visibleFiles = useMemo(
    () => filteredData.slice(0, visibleFileCount),
    [filteredData, visibleFileCount]
  );
  const hasMoreFiles = filteredData.length > visibleFileCount;

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [folderPath, phaseSlug, projectId, searchTerm, folderFiles.length]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
      (file: any) =>
        file.filepath &&
        (file.contentType?.startsWith("image/") || file.contentType?.startsWith("video/"))
    );
    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file: any) => {
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
  }, [visibleFiles]);

  const handleOpenFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      setOpeningFileId(file.id);
      const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      if (result?.url) {
        setViewerFile(file);
        setViewerUrl(result.url);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download file");
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (!canUpload) return;
    const targetFile = file || selectedFile;
    if (!targetFile?.filepath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          canUpload ? (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#202020] border border-white/20 text-white hover:bg-white/10"
            >
              <Upload size={18} />
              Upload Files
            </Button>
          ) : null
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 bg-[#101010]">
        <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {loading ? (
<div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>        
      ) : error ? (
          <div className="text-red-300 text-sm">{error || "Folder not found"}</div>
        ) : (
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <div className="bg-[#101010] flex flex-col gap-5 p-5 border-b border-b-[#3D3D3D] rounded-2xl">
              <div className="flex flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="bg-[#1A1A1A] p-3 rounded-full">
                    <span className="text-white text-xl font-semibold">{getDisplayInitials(workspaceName)}</span>
                  </div>
                  <h1 className="text-base text-[#E8D1AB] font-semibold">
                    {folderTitle} ({filteredData.length} Items)
                  </h1>
                </div>
              </div>

              <div className="bg-[#171717] border border-white/20 rounded-lg p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 ">
                <div>
                  <p className="text-sm lg:text-base">Project: {workspaceName}</p>
                  <p className="text-xs lg:text-base text-white/60 mt-0.5">Project Code: {workspaceCode}</p>
                  {/* {workspaceConsoleUrl ? (
                    <a
                      href={workspaceConsoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                    >
                      Open Storage Folder
                    </a>
                  ) : null} */}
                </div>
                {/* <Button
                  onClick={() => setIsLinkModalOpen(true)}
                  variant="link"
                  className="text-sm lg:text-base text-white font-medium underline underline-offset-4 hover:text-[#E8D1AB] p-0 h-auto"
                >
                  Change Shoot
                </Button> */}
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-row items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 ">
                  {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
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
                          onClick={() => {
                            setViewMode("grid");
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          <Grid3X3 size={18} />
                          Grid View
                        </button>
                        <button
                          onClick={() => {
                            setViewMode("list");
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          <List size={18} />
                          List View
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
                    <Button
                      onClick={() => setViewMode("grid")}
                      className={`px-5 py-2.5 rounded-l-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                          : "bg-transparent text-white/40 hover:text-white"
                      }`}
                    >
                      <Grid3X3 size={20} />
                    </Button>
                    <Button
                      onClick={() => setViewMode("list")}
                      className={`px-5 py-2.5 rounded-r-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                          : "bg-transparent text-white/40 hover:text-white"
                      }`}
                    >
                      <List size={20} />
                    </Button>
                  </div>
                </div>
              </div>

              {viewMode === "grid" ? (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {visibleFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-[#111111] border border-white/10 rounded-xl p-4 lg:p-[19px] hover:border-white/20 transition-all group relative cursor-pointer"
                          onClick={() => handleOpenFile(file)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type === "video" ? (
                                <FileVideo size={16} className="text-[#E8D1AB] shrink-0" />
                              ) : (
                                <ImageIcon size={16} className="text-[#E8D1AB] shrink-0" />
                              )}
                              <span className="truncate text-sm lg:text-base text-white">{file.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="text-white/70 hover:text-white" onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}>
                                <Download size={16} />
                              </button>
                              <button className="text-white/70 hover:text-[#F04438]" onClick={(e) => {
                                e.stopPropagation();
                                if (!canUpload) return;
                                setSelectedFile(file);
                                setIsDeleteModalOpen(true);
                              }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="aspect-square bg-[#1A1A1A] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                            {file.contentType?.startsWith("image/") && previewUrls[file.id] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrls[file.id]}
                                alt={file.title || "Preview"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : file.contentType?.startsWith("video/") && previewUrls[file.id] ? (
                              <div className="relative h-full w-full">
                                <video
                                  src={previewUrls[file.id]}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                                    <Play size={18} className="ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={file.src || defaultImgSrc}
                                alt={file.title || "Default file icon"}
                                width={158}
                                height={150}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreFiles ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                          onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                        >
                          View More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                      <thead className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                        <tr>
                          <th className="rounded-l-xl py-5 px-6 font-medium">File title</th>
                          <th className="py-5 px-6 font-medium">Type</th>
                          <th className="py-5 px-6 font-medium">Last Opened</th>
                          <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFiles.map((file) => (
                          <tr
                            key={file.id}
                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            onClick={() => handleOpenFile(file)}
                          >
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-[#1A1A1A] overflow-hidden flex-shrink-0 relative border border-white/5">
                                  {file.contentType?.startsWith("image/") && previewUrls[file.id] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={previewUrls[file.id]}
                                      alt={file.title || "Preview"}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : file.contentType?.startsWith("video/") && previewUrls[file.id] ? (
                                    <video
                                      src={previewUrls[file.id]}
                                      className="h-full w-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-white/5">
                                      {file.type === "video" ? (
                                        <FileVideo size={14} className="text-[#E8D1AB]" />
                                      ) : (
                                        <ImageIcon size={14} className="text-[#E8D1AB]" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium text-white truncate max-w-[200px]">{file.title}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-white/60 capitalize">
                                {file.type === "video" ? <FileVideo size={14} className="text-[#E8D1AB]" /> : <ImageIcon size={14} className="text-[#E8D1AB]" />}
                                {file.type}
                              </div>
                            </td>
                            <td className="py-5 px-6 whitespace-nowrap text-white/40 italic text-xs">{file.lastOpened}</td>
                            <td className="py-5 px-6 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(file);
                                }}>
                                  <Download size={16} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-[#F04438] transition-colors" onClick={(e) => {
                                  e.stopPropagation();
                                  if (!canUpload) return;
                                  setSelectedFile(file);
                                  setIsDeleteModalOpen(true);
                                }}>
                                  {openingFileId === file.id ? <span className="text-[10px]">...</span> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    {hasMoreFiles ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                          onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                        >
                          View More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          folderName={folderTitle}
          uploadPath={
            canUpload && workspaceName
              ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}/${folderPath}`
              : undefined
          }
          onUploadComplete={loadFiles}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => handleDeleteFile(selectedFile)}
          itemName={selectedFile?.title || "this file"}
          itemType="file"
          isDeleting={isDeleting}
        />

        <FileViewerModal
          isOpen={!!viewerFile}
          onClose={() => {
            setViewerFile(null);
            setViewerUrl(null);
          }}
          fileName={viewerFile?.title}
          fileUrl={viewerUrl}
          contentType={viewerFile?.contentType}
          fileMetaId={viewerFile?.filepath || null}
        />
      </div>
    </>
  );
}
