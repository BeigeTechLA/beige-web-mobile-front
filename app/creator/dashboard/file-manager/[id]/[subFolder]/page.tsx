"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Grid3X3, List, Search, Upload } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
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

const STATUSES = ["Linked", "Unlinked"];

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<Record<string, unknown> | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<Record<string, unknown> | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [shootDate, setShootDate] = useState<string | null>(null);

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
            `/creator/dashboard/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
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
          `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
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
    const previewableFiles = viewState.files.filter(
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
  }, [viewState.files]);

  const currentPhase = phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
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

  const canUpload = isCommonEventWorkspace || (phaseSlug === "post-production" && isOnOrAfterShootDay(shootDate));
  const showUploadLockBanner = !isCommonEventWorkspace && phaseSlug === "post-production" && !canUpload;

  return (
    <div className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <Button onClick={() => router.back()} className="flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {canUpload ? (
          <Button onClick={() => setIsUploadModalOpen(true)} className="border border-white/20 bg-[#202020] text-white hover:bg-white/10">
            <Upload /> Upload Files
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="text-sm text-white/70">Loading folder...</div>
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
                <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} />
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
                      onDownload={async () => {
                        setSelectedFolder(folder);
                        try {
                          const slug = folder.href?.split("/").filter(Boolean).pop();
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
                      }}
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
                <div className="flex flex-col gap-3">
                  <div className="lg:hidden">
                    {filteredFolders.map((folder) => (
                        <MobileFolderRow
                          key={folder.id}
                          folder={folder}
                          handleOpenMenu={() => undefined}
                        />
                    ))}
                  </div>
                </div>
              )
            ) : viewState.kind === "mixed" ? (
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
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {filteredFiles.map((file) => (
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
                  )}
                </div>
              </div>
            ) : viewMode === "grid" ? (
              filteredFiles.length === 0 ? (
                <EmptyFileState onAction={canUpload ? () => setIsUploadModalOpen(true) : undefined} actionLabel={canUpload ? "Upload Files" : undefined} />
              ) : (
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredFiles.map((file) => (
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
              )
            ) : null}
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
