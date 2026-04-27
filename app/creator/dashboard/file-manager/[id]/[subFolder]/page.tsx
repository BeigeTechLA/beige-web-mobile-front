"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CalendarClock, Download, FileVideo, FolderOpen, FolderPlus, Grid3X3, Image as ImageIcon, List, Loader2, MoreVertical, Play, Search, Trash2, Upload } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
  slugToWorkspaceName,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { getProject } from "@/lib/api";
import { toast } from "sonner";
import { useViewMode } from "@/app/useViewMode";

const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;
const defaultImgSrc = "/images/misc/Data.png";

export default function CreatorFileManagerPhasePage() {
  const router = useRouter();
  const params = useParams<{ id: string; subFolder: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<Array<Record<string, unknown>>>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, setViewMode } = useViewMode();
  const [status, setStatus] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<Record<string, unknown> | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<Record<string, unknown> | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [shootDate, setShootDate] = useState<string | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);

  const isOnOrAfterShootDay = useCallback((date?: string | null) => {
    if (!date) return false;
    const shootDay = new Date(`${date}T00:00:00`);
    if (Number.isNaN(shootDay.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shootDay.getTime() <= today.getTime();
  }, []);

  const loadPhase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const phase = phaseSlug === "post-production" ? "post" : "pre";
      const workspaceData = await fileManagerApi.getExternalWorkspaceFiles(projectId, phase);
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setWorkspaceFolders(workspaceData.folders);
      setWorkspaceFiles(workspaceData.files);

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
      setError(err instanceof Error ? err.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [phaseSlug, projectId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadPhase();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [loadPhase, projectId]);

  const viewState = useMemo(() => {
    if (!workspaceName) {
      return { title: "Folder", kind: "folders" as const, folders: [], files: [] };
    }

    if (phaseSlug === "post-production") {
      return {
        title: "Post Production",
        kind: "folders" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders as never[],
          (folder) =>
            `/creator/dashboard/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
              folder.name
            )}`
        ),
        files: [],
      };
    }

    return {
      title: slugToWorkspaceName(phaseSlug),
      kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
      folders: mapExternalFoldersToUi(
        workspaceFolders as never[],
        (folder) =>
          `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
            folder.name
          )}`
      ),
      files: mapExternalFilesToUi(workspaceFiles as never[]),
    };
  }, [phaseSlug, projectId, workspaceFiles, workspaceFolders, workspaceName]);

  const filteredFolders = useMemo(() => {
    let items = viewState.folders;
    if (status === "Linked") {
      items = items.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      items = items.filter((item) => !item.isLinked);
    }
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, status, viewState.folders]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return viewState.files;
    const query = searchTerm.toLowerCase();
    return viewState.files.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.files]);
  const visibleFiles = useMemo(
    () => filteredFiles.slice(0, visibleFileCount),
    [filteredFiles, visibleFileCount]
  );
  const hasMoreFiles = filteredFiles.length > visibleFileCount;

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
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [projectId, phaseSlug, searchTerm, viewState.files.length, viewState.kind]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
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
  }, [visibleFiles]);

  const currentPhase = phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;
  const isCommonEventPreProductionRoot =
    isCommonEventWorkspace && phaseSlug === "pre-production";
  const canCreateFolder = isCommonEventWorkspace && !isCommonEventPreProductionRoot;

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, folder: UiFolderItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedFolder(folder);

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20,
    });
  };

  const handleDownloadSelectedFolder = async (folder?: UiFolderItem | null) => {
    const targetFolder = folder || selectedFolder;
    if (!targetFolder) return;

    try {
      const slug = targetFolder.href?.split("/").filter(Boolean).pop();
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: currentPhase,
        path: currentPhase === "post" && slug ? slugToWorkspaceName(slug) : undefined,
      });
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download folder");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setSelectedFolder(null);
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
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
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenFile = async (file: Record<string, unknown>) => {
    if (typeof file.filepath !== "string" || typeof file.id !== "string") return;
    try {
      const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      if (result?.url) {
        setViewerFile(file);
        setViewerUrl(result.url);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const canUpload =
    !isCommonEventPreProductionRoot &&
    (isCommonEventWorkspace ||
      (phaseSlug === "post-production" && isOnOrAfterShootDay(shootDate)));
  const showUploadLockBanner = !isCommonEventWorkspace && phaseSlug === "post-production" && !canUpload;

  const handleCreateFolder = async ({ name }: { name: string }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await fileManagerApi.createExternalFolder(projectId, trimmed, { phase: currentPhase });
      toast.success("Folder created");
      await loadPhase();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
      throw err;
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <Button onClick={() => router.back()} className="flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {canUpload || canCreateFolder ? (
          <div className="flex items-center gap-2">
            {canCreateFolder ? (
              <Button onClick={() => setIsCreateFolderModalOpen(true)} className="border border-white/20 bg-[#202020] text-white hover:bg-white/10">
                <FolderPlus /> Create Folder
              </Button>
            ) : null}
            {canUpload ? (
              <Button onClick={() => setIsUploadModalOpen(true)} className="border border-white/20 bg-[#202020] text-white hover:bg-white/10">
                <Upload /> Upload Files
              </Button>
            ) : null}
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
          <div>
            <div className="mb-2 flex items-start gap-5 lg:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8E1FF] text-[#000] lg:h-21 lg:w-21 lg:rounded-2xl lg:text-[30px] lg:font-medium">
                {getDisplayInitials(workspaceName)}
              </div>
              <div className="min-w-0 max-w-3xl flex-1 text-white">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <h1 className="break-words text-sm font-semibold leading-[32px] lg:text-2xl">
                    {workspaceName}
                  </h1>
                  <span
                    className={`flex items-center gap-1.5 rounded-full border border-white/5 px-2.5 py-1 text-xs font-medium ${
                      phaseSlug === "post-production"
                        ? "bg-[#E8D2FB] text-[#540B94]"
                        : "bg-[#FDF4FF] text-[#C026D3]"
                    }`}
                  >
                    {viewState.title}
                  </span>
                </div>
                <p className="hidden text-sm text-[#D0D0D0] lg:block">
                  <span className="text-[#AAA7A7]">Project Code: </span>
                  {workspaceCode}
                </p>
                {/* {workspaceConsoleUrl ? (
                  <a
                    href={workspaceConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 hidden text-xs text-[#E8D1AB] underline underline-offset-4 lg:inline-block"
                  >
                    Open Storage Folder
                  </a>
                ) : null} */}
              </div>
            </div>
          </div>

          <div className="pb-20 lg:pb-0">
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
            <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
              <div className="relative max-w-xl flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40 lg:left-3 lg:h-4 lg:w-4" />
                <input
                  type="text"
                  placeholder={viewState.kind === "folders" ? "Search folders..." : "Search files..."}
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

            {viewState.kind === "folders" ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      title={folder.title}
                      fileCount={folder.fileCount}
                      lastOpened={folder.lastOpened}
                      category={folder.category}
                      isLinked={folder.isLinked}
                      userInitials={folder.userInitials}
                      onOpenLinkModal={() => undefined}
                      href={folder.href}
                      onDownload={() => handleDownloadSelectedFolder(folder)}
                      onDelete={() => {
                        setSelectedFolder(folder);
                        setSelectedFile(null);
                        setIsDeleteModalOpen(true);
                      }}
                      onRename={() => toast.info("Folder rename is the next safe step.")}
                    />
                  ))}
                </div>
              ) : (
                filteredFolders.length === 0 ? (
                  <EmptyFileState />
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="lg:hidden">
                      {filteredFolders.map((folder) => (
                        <MobileFolderRow
                          key={folder.id}
                          folder={folder}
                          handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                        />
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                            <th className="rounded-l-xl px-6 py-5 font-medium">Name</th>
                            <th className="px-6 py-5 text-center font-medium">Files</th>
                            <th className="px-6 py-5 text-center font-medium">Last Updated</th>
                            <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFolders.map((item) => (
                            <tr
                              key={item.id}
                              className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                              onClick={() =>
                                router.push(item.href || `/creator/dashboard/file-manager/${projectId}/${phaseSlug}`)
                              }
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                                    <FolderOpen className="text-[#E8D1AB]" size={20} />
                                  </div>
                                  <span className="text-sm font-medium text-white">{item.title}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center text-sm text-white/60">
                                {String(item.fileCount).padStart(2, "0")}
                              </td>
                              <td className="px-6 py-5 text-center text-sm text-[#8F8F8F]">{item.lastOpened}</td>
                              <td className="px-6 py-5 text-right">
                                <Button
                                  variant="ghost"
                                  className="h-10 w-10 rounded-full p-0 text-white/40 hover:bg-white/10 hover:text-white"
                                  onClick={(e) => handleOpenMenu(e, item)}
                                >
                                  <MoreVertical size={20} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )
            ) : viewState.kind === "mixed" ? (
              viewMode === "grid" ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                    {filteredFolders.length === 0 ? (
                      <EmptyFileState />
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {filteredFolders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            title={folder.title}
                            fileCount={folder.fileCount}
                            lastOpened={folder.lastOpened}
                            category={folder.category}
                            isLinked={folder.isLinked}
                            userInitials={folder.userInitials}
                            onOpenLinkModal={() => undefined}
                            href={folder.href}
                            showMenu={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                    {filteredFiles.length === 0 ? (
                      <EmptyFileState />
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                          {visibleFiles.map((file) => (
                            <FileCard
                              key={file.id}
                              file={{ ...file, previewUrl: previewUrls[file.id] }}
                              onOpen={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                              onDownload={() => handleDownloadFile(file as unknown as Record<string, unknown>)}
                              onDelete={() => {
                                setSelectedFile(file as unknown as Record<string, unknown>);
                                setIsDeleteModalOpen(true);
                              }}
                            />
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
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                    {filteredFolders.length === 0 ? (
                      <EmptyFileState />
                    ) : (
                      <div className="space-y-3">
                        <div className="lg:hidden">
                          {filteredFolders.map((folder) => (
                            <MobileFolderRow
                              key={folder.id}
                              folder={folder}
                              handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                            />
                          ))}
                        </div>

                        <div className="hidden overflow-x-auto lg:block">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                                <th className="rounded-l-xl px-6 py-5 font-medium">Name</th>
                                <th className="px-6 py-5 text-center font-medium">Files</th>
                                <th className="px-6 py-5 text-center font-medium">Last Updated</th>
                                <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFolders.map((item) => (
                                <tr
                                  key={item.id}
                                  className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                                  onClick={() => router.push(item.href || `/creator/dashboard/file-manager/${projectId}/${phaseSlug}`)}
                                >
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                                        <FolderOpen className="text-[#E8D1AB]" size={20} />
                                      </div>
                                      <span className="text-sm font-medium text-white">{item.title}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center text-sm text-white/60">
                                    {String(item.fileCount).padStart(2, "0")}
                                  </td>
                                  <td className="px-6 py-5 text-center text-sm text-[#8F8F8F]">{item.lastOpened}</td>
                                  <td className="px-6 py-5 text-right">
                                    <Button
                                      variant="ghost"
                                      className="h-10 w-10 rounded-full p-0 text-white/40 hover:bg-white/10 hover:text-white"
                                      onClick={(e) => handleOpenMenu(e, item)}
                                    >
                                      <MoreVertical size={20} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                    {filteredFiles.length === 0 ? (
                      <EmptyFileState />
                    ) : (
                      <div className="space-y-4">
                        <div className="hidden overflow-x-auto lg:block">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                                <th className="rounded-l-xl px-6 py-5 font-medium">Name</th>
                                <th className="px-6 py-5 text-center font-medium">Type</th>
                                <th className="px-6 py-5 text-center font-medium">Last Updated</th>
                                <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleFiles.map((item) => (
                                <tr
                                  key={item.id}
                                  className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                                  onClick={() => handleOpenFile(item as unknown as Record<string, unknown>)}
                                >
                                  <td className="px-6 py-5 text-white text-sm font-medium">{item.title}</td>
                                  <td className="px-6 py-5 text-center text-sm text-white/60">
                                    {item.contentType || "File"}
                                  </td>
                                  <td className="px-6 py-5 text-center text-sm text-[#8F8F8F]">{item.lastOpened}</td>
                                  <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        className="text-white/40 hover:text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(item as unknown as Record<string, unknown>);
                                        }}
                                      >
                                        Download
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="text-white/40 hover:text-[#F04438]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFile(item as unknown as Record<string, unknown>);
                                          setIsDeleteModalOpen(true);
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-3 lg:hidden">
                          {visibleFiles.map((file) => (
                            <div
                              key={`file-mobile-${file.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#171717] p-4"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{file.title}</p>
                                  <p className="mt-1 text-xs text-white/50">Updated {file.lastOpened}</p>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file as unknown as Record<string, unknown>)}
                                className="shrink-0 text-white/50 hover:text-white"
                              >
                                Download
                              </button>
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
                    )}
                  </div>
                </div>
              )
            ) : viewMode === "grid" ? (
              filteredFiles.length === 0 ? (
                <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {visibleFiles.map((file) => {
                      const fileType = file.title.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) ? "video" : "image";
                      return (
                        <div
                          key={file.id}
                          className="group relative cursor-pointer rounded-xl border border-white/10 bg-[#111111] p-4 transition-all hover:border-white/20 lg:p-[19px]"
                          onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="min-w-0 flex items-center gap-2">
                              {fileType === "video" ? (
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
                              {/* <button
                                className="text-white/70 hover:text-[#F04438]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(file as unknown as Record<string, unknown>);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </button> */}
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
                                src={defaultImgSrc}
                                alt={typeof file.title === "string" ? file.title : "Default file icon"}
                                width={158}
                                height={150}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
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
            ) : filteredFiles.length === 0 ? (
                <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
              ) : (
                <div className="space-y-4">
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                          <th className="rounded-l-xl px-6 py-5 font-medium">File title</th>
                          <th className="px-6 py-5 font-medium">Type</th>
                          <th className="px-6 py-5 font-medium">Last Opened</th>
                          <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFiles.map((file) => {
                          const fileType = file.title.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) ? "video" : "image";
                          return (
                          <tr
                            key={file.id}
                            className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                            onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                          >
                            <td className="whitespace-nowrap px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-white/5 bg-[#1A1A1A]">
                                  <Image
                                    src={defaultImgSrc}
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
                                {fileType === "video" ? <FileVideo size={14} className="text-[#E8D1AB]" /> : <ImageIcon size={14} className="text-[#E8D1AB]" />}
                                {fileType}
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
                                {/* <button
                                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-[#F04438]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(file as unknown as Record<string, unknown>);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button> */}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 lg:hidden">
                    {visibleFiles.map((file) => (
                      <div
                        key={`file-only-mobile-${file.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#171717] p-4"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenFile(file as unknown as Record<string, unknown>)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{file.title}</p>
                            <p className="mt-1 text-xs text-white/50">Updated {file.lastOpened}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file as unknown as Record<string, unknown>)}
                          className="shrink-0 text-white/50 hover:text-white"
                        >
                          Download
                        </button>
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
              )}
          </div>
        </>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={workspaceName || ""}
        uploadPath={canUpload ? defaultUploadPath : undefined}
        onUploadComplete={loadPhase}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
        title="Create Folder"
        description={`Create folder inside ${viewState.title}`}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (selectedFile) return handleDeleteFile(selectedFile);
          return handleDeleteSelectedFolder();
        }}
        itemName={selectedFile ? String(selectedFile.title || "this file") : selectedFolder?.title || "this folder"}
        itemType={selectedFile ? "file" : "folder"}
        isDeleting={isDeleting}
      />

      {menuAnchor && selectedFolder ? (
        <FileActionMenu
          folderName={selectedFolder.title}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => undefined}
          anchor={menuAnchor}
          href={selectedFolder.href}
          onOpen={() => router.push(selectedFolder.href || `/creator/dashboard/file-manager/${projectId}/${phaseSlug}`)}
          onDownload={() => void handleDownloadSelectedFolder(selectedFolder)}
          onDelete={() => {
            setSelectedFile(null);
            setIsDeleteModalOpen(true);
          }}
          onRename={() => toast.info("Folder rename is the next safe step.")}
        />
      ) : null}

      <FileViewerModal
        isOpen={!!viewerFile}
        onClose={() => {
          setViewerFile(null);
          setViewerUrl(null);
        }}
        fileName={String(viewerFile?.title || "")}
        fileUrl={viewerUrl}
        contentType={typeof viewerFile?.contentType === "string" ? viewerFile.contentType : undefined}
        fileMetaId={typeof viewerFile?.filepath === "string" ? viewerFile.filepath : null}
      />
    </div>
  );
}
