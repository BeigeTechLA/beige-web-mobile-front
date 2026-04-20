"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  FileVideo,
  FolderPlus,
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
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  slugToWorkspaceName,
} from "@/lib/fileManagerApi";
import { getProject } from "@/lib/api";
import { toast } from "sonner";

const defaultImgSrc = "/images/misc/Data.png";
const STATUSES = ["Linked", "Unlinked"];

export default function CreatorSubFolderDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string; subFolder2: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const nestedSlug = params.subFolder2;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<Record<string, unknown>>>([]);
  const [files, setFiles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<Record<string, unknown> | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<Record<string, unknown> | null>(null);
  const [shootDate, setShootDate] = useState<string | null>(null);

  const isOnOrAfterShootDay = useCallback((date?: string | null) => {
    if (!date) return false;
    const shootDay = new Date(`${date}T00:00:00`);
    if (Number.isNaN(shootDay.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shootDay.getTime() <= today.getTime();
  }, []);

  const currentFolderPath = useMemo(() => {
    const fromQuery = searchParams.get("path");
    return fromQuery ? decodeURIComponent(fromQuery) : slugToWorkspaceName(nestedSlug);
  }, [nestedSlug, searchParams]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        phaseSlug === "post-production" ? "post" : "pre",
        currentFolderPath
      );
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setFolders(workspaceData.folders || []);
      setFiles(workspaceData.files);

      if (Number.isFinite(Number(projectId))) {
        try {
          const projectDetails = await getProject(Number(projectId));
          setShootDate(projectDetails?.data?.project?.event_date || null);
        } catch {
          setShootDate(null);
        }
      } else {
        setShootDate(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath, phaseSlug, projectId]);

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
  }, [loadFiles, projectId]);

  const folderTitle = useMemo(() => {
    const safePath = String(currentFolderPath || "").trim();
    if (!safePath) return "Files";
    const parts = safePath.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || safePath;
    return last
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }, [currentFolderPath]);

  const folderItems = useMemo(
    () =>
      (folders || []).map((folder) => {
        const folderName = String(folder?.name || "").trim();
        const nextPath = [currentFolderPath, folderName].filter(Boolean).join("/");
        return {
          id: String(folder?.path || nextPath || folderName),
          title: folderName || "Folder",
          fileCount: Number(folder?.fileCount || 0),
          lastOpened: String(folder?.updatedAt || folder?.createdAt || ""),
          category: String(folder?.folderType || "folder"),
          isLinked: true,
          userInitials: getDisplayInitials(folderName || "Folder"),
          href: `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${String(folderName || "folder").toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
            nextPath
          )}`,
        };
      }),
    [currentFolderPath, folders, phaseSlug, projectId]
  );

  const folderFiles = useMemo(() => {
    return mapExternalFilesToUi(files as never[]).map((file) => ({
      ...file,
      type: file.title.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) ? "video" : "image",
      src: defaultImgSrc,
    }));
  }, [files]);

  const filteredData = useMemo(() => {
    let items = folderFiles;
    if (status === "Linked") items = items.filter(() => true);
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderFiles, searchTerm, status]);

  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folderItems;
    const query = searchTerm.toLowerCase();
    return folderItems.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderItems, searchTerm]);

  const formattedShootDate = useMemo(() => {
    if (!shootDate) return "your shoot day";
    const parsed = new Date(`${shootDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return shootDate;
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [shootDate]);

  useEffect(() => {
    const previewableFiles = folderFiles.filter(
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
  }, [folderFiles]);

  const handleOpenFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string" || typeof file.id !== "string") return;
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

  const handleDownloadFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string") return;
    try {
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download file");
    }
  };

  const handleDeleteFile = async (file: Record<string, unknown> | null) => {
    const targetFile = file || selectedFile;
    if (!targetFile || typeof targetFile.filepath !== "string") return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await fileManagerApi.createExternalFolder(projectId, trimmed, {
        phase: phaseSlug === "post-production" ? "post" : "pre",
        path: currentFolderPath,
      });
      toast.success("Folder created");
      await loadFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
      throw err;
    }
  };

  const canUpload = isCommonEventWorkspace || (phaseSlug === "post-production" && isOnOrAfterShootDay(shootDate));
  const showUploadLockBanner = !isCommonEventWorkspace && phaseSlug === "post-production" && !canUpload;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
      <div className="rounded-2xl border-b border-b-[#3D3D3D] bg-[#101010] p-5">
        <div className="mb-5 flex items-center justify-between">
          <Button onClick={() => router.back()} className="flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
            <ArrowLeft size={24} />
            <span className="text-sm font-medium">Back</span>
          </Button>

	          {canUpload ? (
	            <div className="flex items-center gap-2">
	              {isCommonEventWorkspace ? (
	                <Button
	                  onClick={() => setIsCreateFolderModalOpen(true)}
	                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-[#202020] px-3 text-white hover:bg-white/10 lg:h-10 lg:px-6"
	                >
	                  <FolderPlus size={18} />
	                  Create Folder
	                </Button>
	              ) : null}
	              <Button
	                onClick={() => setIsUploadModalOpen(true)}
	                className="flex items-center gap-2 rounded-lg bg-[#E5D5B8] px-3 text-black hover:bg-[#D4C3A3] lg:h-10 lg:px-6"
	              >
	                <Upload size={18} />
	                Upload Files
	              </Button>
	            </div>
	          ) : null}
        </div>

        {loading ? (
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>      
         ) : error ? (
          <div className="text-sm text-red-300">{error || "Folder not found"}</div>
        ) : (
          <>
            <div className="mb-5 flex flex-row justify-between gap-4 md:items-center">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="rounded-full bg-[#1A1A1A] p-3">
                  <span className="text-xl font-semibold text-white">{getDisplayInitials(workspaceName)}</span>
                </div>
                <h1 className="text-base font-semibold text-[#E8D1AB]">
                  {folderTitle} ({filteredData.length} Items)
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-white/20 bg-[#171717] p-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm lg:text-base">Project: {workspaceName}</p>
                <p className="mt-0.5 text-xs text-white/60 lg:text-base">Project Code: {workspaceCode}</p>
                {/* {workspaceConsoleUrl ? (
                  <a
                    href={workspaceConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-[#E8D1AB] underline underline-offset-4"
                  >
                    Open Storage Folder
                  </a>
                ) : null} */}
              </div>
            </div>
          </>
        )}
      </div>

      {!loading && !error ? (
        <div className="p-5">
          {showUploadLockBanner ? (
            <div className="mb-3 rounded-xl border border-[#E8D1AB]/25 bg-gradient-to-r from-[#2A2215] to-[#17130E] p-3 lg:mb-4 lg:p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#E8D1AB]/15 p-2 text-[#E8D1AB]">
                  <CalendarClock size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F2E4C8]">Uploads unlock on shoot day</p>
                  <p className="mt-1 text-xs text-[#DCC7A0] lg:text-sm">
                    Post-production upload will be available on{" "}
                    <span className="font-medium text-[#F2E4C8]">{formattedShootDate}</span>. You can review folders and existing files now.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mb-6 flex flex-row items-center justify-between gap-4">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40 lg:left-3 lg:h-4 lg:w-4" />
	              <input
	                type="text"
	                placeholder="Search folders or files..."
	                value={searchTerm}
                className="w-full rounded-lg border border-white/10 bg-[#18181b] py-1.5 pl-6 pr-4 text-xs text-white placeholder:text-white/40 transition-all focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] lg:py-2 lg:pl-9 lg:text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
              <div className="hidden w-full flex-wrap items-center rounded-lg border border-white/5 bg-[#202020] md:w-fit lg:flex">
                <Button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-l-lg px-5 py-2.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : "bg-transparent text-white/40 hover:text-white"
                  }`}
                >
                  <Grid3X3 size={20} />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  className={`rounded-r-lg px-5 py-2.5 transition-colors ${
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

	          {filteredFolders.length > 0 ? (
	            <div className="mb-6">
	              <h3 className="mb-3 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
	              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
	                {filteredFolders.map((folder) => (
	                  <FolderCard
	                    key={folder.id}
	                    title={folder.title}
	                    fileCount={folder.fileCount}
	                    lastOpened={folder.lastOpened || "recently"}
	                    category={folder.category}
	                    isLinked={folder.isLinked}
	                    userInitials={folder.userInitials}
	                    onOpenLinkModal={() => undefined}
	                    href={folder.href}
	                    showMenu={false}
	                  />
	                ))}
	              </div>
	            </div>
	          ) : null}

	          {viewMode === "grid" ? (
	            filteredData.length === 0 ? (
	              <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {filteredData.map((file) => (
                  <div
                    key={file.id}
                    className="group relative cursor-pointer rounded-xl border border-white/10 bg-[#111111] p-4 transition-all hover:border-white/20 lg:p-[19px]"
                    onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="min-w-0 flex items-center gap-2">
                        {file.type === "video" ? (
                          <FileVideo size={16} className="shrink-0 text-[#E8D1AB]" />
                        ) : (
                          <ImageIcon size={16} className="shrink-0 text-[#E8D1AB]" />
                        )}
                        <span className="truncate text-sm text-white lg:text-base">{file.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="text-white/70 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file as unknown as Record<string, unknown>);
                          }}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className="text-white/70 hover:text-[#F04438]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file as unknown as Record<string, unknown>);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#1A1A1A]">
                      {file.contentType?.startsWith("image/") && previewUrls[file.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrls[file.id]}
                          alt={file.title || "Preview"}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : file.contentType?.startsWith("video/") && previewUrls[file.id] ? (
                        <div className="relative h-full w-full">
                          <video
                            src={previewUrls[file.id]}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                          src={typeof file.src === "string" ? file.src : defaultImgSrc}
                          alt={typeof file.title === "string" ? file.title : "Default file icon"}
                          width={158}
                          height={150}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredData.length === 0 ? (
            <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
          ) : (
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                  <tr>
                    <th className="rounded-l-xl px-6 py-5 font-medium">File title</th>
                    <th className="px-6 py-5 font-medium">Type</th>
                    <th className="px-6 py-5 font-medium">Last Opened</th>
                    <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((file) => (
                    <tr
                      key={file.id}
                      className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                      onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                    >
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-white/5 bg-[#1A1A1A]">
                            <Image
                              src={typeof file.src === "string" ? file.src : defaultImgSrc}
                              alt={typeof file.title === "string" ? file.title : "Default Image"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="max-w-[200px] truncate font-medium text-white">{file.title}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex items-center gap-2 capitalize text-white/60">
                          {file.type === "video" ? <FileVideo size={14} className="text-[#E8D1AB]" /> : <ImageIcon size={14} className="text-[#E8D1AB]" />}
                          {String(file.type || "")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-xs italic text-white/40">{file.lastOpened}</td>
                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file as unknown as Record<string, unknown>);
                            }}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-[#F04438]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file as unknown as Record<string, unknown>);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            {openingFileId === file.id ? <span className="text-[10px]">...</span> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

	      <UploadModal
	        isOpen={isUploadModalOpen}
	        onClose={() => setIsUploadModalOpen(false)}
	        folderName={folderTitle}
	        uploadPath={
	          canUpload && workspaceName
	            ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}/${currentFolderPath}`
	            : undefined
	        }
	        onUploadComplete={loadFiles}
	      />

	      <CreateFolderModal
	        isOpen={isCreateFolderModalOpen}
	        onClose={() => setIsCreateFolderModalOpen(false)}
	        onCreate={handleCreateFolder}
	        title="Create Client Folder"
	        description={`Create folder inside ${folderTitle}`}
	      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => handleDeleteFile(selectedFile)}
        itemName={typeof selectedFile?.title === "string" ? selectedFile.title : "this file"}
        itemType="file"
        isDeleting={isDeleting}
      />

      <FileViewerModal
        isOpen={!!viewerFile}
        onClose={() => {
          setViewerFile(null);
          setViewerUrl(null);
        }}
        fileName={typeof viewerFile?.title === "string" ? viewerFile.title : undefined}
        fileUrl={viewerUrl}
        contentType={typeof viewerFile?.contentType === "string" ? viewerFile.contentType : undefined}
        fileMetaId={typeof viewerFile?.filepath === "string" ? viewerFile.filepath : null}
      />
    </div>
  );
}
