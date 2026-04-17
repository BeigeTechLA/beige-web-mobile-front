"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Grid3X3,
  List,
  Loader2,
  MoreVertical,
  Presentation,
  Search,
  Upload
} from "lucide-react";
import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getDisplayInitials,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
  slugToWorkspaceName,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";

const STATUSES = ["Linked", "Unlinked"];

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const getFileMeta = (file: any) => {
  const extension = getFileExtension(file?.title);
  const contentType = file?.contentType || "";

  if (contentType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }

  if (contentType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
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

export default function AdminFileManagerPhasePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string; subFolder: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const isPreProduction = phaseSlug !== "post-production";

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [uploadPathOverride, setUploadPathOverride] = useState<string | undefined>(undefined);
  const [uploadFolderLabel, setUploadFolderLabel] = useState<string | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const loadPhase = async () => {
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
    } catch (err: any) {
      setError(err?.message || "Failed to load folder");
    } finally {
      setLoading(false);
    }
  };

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
  }, [projectId, phaseSlug]);

  const viewState = useMemo(() => {
    if (!workspaceName) {
      return { title: "Folder", kind: "folders" as const, folders: [], files: [] };
    }

    if (phaseSlug === "post-production") {
      return {
        title: "Post Production",
        kind: "folders" as const,
        folders: mapExternalFoldersToUi(
          workspaceFolders,
          (folder) =>
            `/admin/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        ),
        files: [],
      };
    }

    return {
      title: slugToWorkspaceName(phaseSlug),
      kind: workspaceFolders.length > 0 ? "mixed" as const : "files" as const,
      folders: mapExternalFoldersToUi(
        workspaceFolders,
        (folder) =>
          `/admin/file-manager/${projectId}/${phaseSlug}/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
      ),
      files: mapExternalFilesToUi(workspaceFiles),
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
    const filesWithMeta = viewState.files.map((file) => ({
      ...file,
      ...getFileMeta(file),
    }));
    if (!searchTerm.trim()) return filesWithMeta;
    const query = searchTerm.toLowerCase();
    return filesWithMeta.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm, viewState.files]);

  useEffect(() => {
    const previewableFiles = viewState.files.filter(
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
  }, [viewState.files]);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    folder: UiFolderItem
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedFolder(folder);

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20,
    });
  };

  const currentPhase = phaseSlug === "post-production" ? "post" : "pre";
  const defaultUploadPath = workspaceName
    ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}`
    : undefined;

  const getSelectedFolderPath = () => {
    if (!selectedFolder?.href) return undefined;
    const slug = selectedFolder.href.split("/").filter(Boolean).pop();
    return slug ? slugToWorkspaceName(slug) : undefined;
  };

  const handleDownloadSelectedFolder = async () => {
    if (!selectedFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: currentPhase,
        path: currentPhase === "post" ? getSelectedFolderPath() : undefined,
      });
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download folder");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!isPreProduction) return;
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    if (!isPreProduction) return;
    try {
      const folderName = name.trim();
      await fileManagerApi.createExternalFolder(projectId, folderName, { phase: currentPhase });
      toast.success("Folder created");
      setIsCreateFolderModalOpen(false);
      setUploadFolderLabel(folderName);
      setUploadPathOverride(defaultUploadPath ? `${defaultUploadPath}/${folderName}` : undefined);
      setIsUploadModalOpen(true);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create folder");
      throw err;
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
    if (!isPreProduction) return;
    const targetFile = file || selectedFile;
    if (!targetFile?.filepath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadPhase();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

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

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            {isPreProduction ? (
              <>
                <Button onClick={() => setIsUploadModalOpen(true)} className="bg-[#202020] border border-white/20 text-white hover:bg-white/10">
                  <Upload /> Upload Files
                </Button>
                <Button onClick={() => setIsCreateFolderModalOpen(true)} className="bg-[#E5D5B8] text-black">
                  Create Folder
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9">
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
          <>
            <div>
              <div className="flex items-start gap-5 mb-2 lg:mb-6">
                <div className="h-10 w-10 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] lg:text-[30px] font-medium">
                  {getDisplayInitials(workspaceName)}
                </div>
                <div className="min-w-0 text-white max-w-3xl flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                      {workspaceName}
                    </h1>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-white/5 flex items-center gap-1.5 ${
                      phaseSlug === "post-production"
                        ? "bg-[#E8D2FB] text-[#540B94]"
                        : "bg-[#FDF4FF] text-[#C026D3]"
                    }`}>
                      {viewState.title}
                    </span>
                  </div>
                  <p className="hidden lg:block text-sm text-[#D0D0D0]">
                    <span className="text-[#AAA7A7]">Project Code: </span>
                    {workspaceCode}
                  </p>
                  {/* {workspaceConsoleUrl ? (
                    <a
                      href={workspaceConsoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden lg:inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                    >
                      Open Storage Folder
                    </a>
                  ) : null} */}
                </div>
              </div>
              <p className="lg:hidden text-xs text-[#D0D0D0]">
                <span className="text-[#AAA7A7]">Project Code: </span>
                {workspaceCode}
              </p>
              {/* {workspaceConsoleUrl ? (
                <a
                  href={workspaceConsoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="lg:hidden inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                >
                  Open Storage Folder
                </a>
              ) : null} */}
            </div>

            <div className="pb-20 lg:pb-0">
              <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
                  <input
                    type="text"
                    placeholder={viewState.kind === "folders" ? "Search folders..." : "Search files..."}
                    value={searchTerm}
                    className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 ">
                  {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
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

              {viewState.kind === "folders" ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        title={folder.title}
                        fileCount={folder.fileCount}
                        lastOpened={folder.lastOpened}
                        category={folder.category}
                        isLinked={folder.isLinked}
                        userInitials={folder.userInitials}
                        onOpenLinkModal={() => {
                          setSelectedFolder(folder);
                          setIsLinkModalOpen(true);
                        }}
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
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to download folder");
                          }
                        }}
                        onDelete={() => {
                          if (!isPreProduction) return;
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
                          handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                        />
                      ))}
                    </div>

                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                            <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                            <th className="py-5 px-6 text-center font-medium">Files</th>
                            <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                            <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFolders.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                router.push(item.href || `${pathname}/${item.id}`);
                              }}
                            >
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <FolderOpen className="text-[#E8D1AB]" size={20} />
                                  </div>
                                  <span className="text-white text-sm font-medium">{item.title}</span>
                                </div>
                              </td>
                              <td className="py-5 px-6 text-center text-white/60 text-sm">
                                {String(item.fileCount).padStart(2, "0")}
                              </td>
                              <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                              <td className="py-5 px-6 text-right">
                                <Button variant="ghost" className="h-10 w-10 rounded-full p-0 text-white/40 hover:bg-white/10 hover:text-white" onClick={(e) => handleOpenMenu(e, item)}>
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
              ) : viewState.kind === "mixed" ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Folders</h3>
                    {filteredFolders.length === 0 ? (
                      <div className="text-sm text-white/50">No folders yet in this section.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                        {filteredFolders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            title={folder.title}
                            fileCount={folder.fileCount}
                            lastOpened={folder.lastOpened}
                            category={folder.category}
                            isLinked={folder.isLinked}
                            userInitials={folder.userInitials}
                            onOpenLinkModal={() => {
                              setSelectedFolder(folder);
                              setIsLinkModalOpen(true);
                            }}
                            href={folder.href}
                            onDownload={async () => {
                              setSelectedFolder(folder);
                              try {
                                const slug = folder.href?.split("/").filter(Boolean).pop();
                                const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                                  phase: currentPhase,
                                  path: slug ? slugToWorkspaceName(slug) : undefined,
                                });
                                if (result?.url) {
                                  window.open(result.url, "_blank", "noopener,noreferrer");
                                }
                              } catch (err: any) {
                                toast.error(err?.message || "Failed to download folder");
                              }
                            }}
                            onDelete={() => {
                              if (!isPreProduction) return;
                              setSelectedFolder(folder);
                              setSelectedFile(null);
                              setIsDeleteModalOpen(true);
                            }}
                            onRename={() => toast.info("Folder rename is the next safe step.")}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredFiles.length > 0 || filteredFolders.length === 0 ? (
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-[#E8D1AB]">Files</h3>
                      {filteredFiles.length === 0 ? (
                        <EmptyFileState onAction={isPreProduction ? () => setIsUploadModalOpen(true) : undefined} actionLabel={isPreProduction ? "Upload Files" : undefined} />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                          {filteredFiles.map((file) => (
                            <FileCard
                              key={file.id}
                              file={{ ...file, previewUrl: previewUrls[file.id] }}
                              onOpen={() => handleOpenFile(file)}
                              onDownload={() => handleDownloadFile(file)}
                              onDelete={() => {
                                if (!isPreProduction) return;
                                setSelectedFile(file);
                                setSelectedFolder(null);
                                setIsDeleteModalOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : viewMode === "grid" ? (
                filteredFiles.length === 0 ? (
                  <EmptyFileState onAction={isPreProduction ? () => setIsUploadModalOpen(true) : undefined} actionLabel={isPreProduction ? "Upload Files" : undefined} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                    {filteredFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={{ ...file, previewUrl: previewUrls[file.id] }}
                        onOpen={() => handleOpenFile(file)}
                        onDownload={() => handleDownloadFile(file)}
                        onDelete={() => {
                          if (!isPreProduction) return;
                          setSelectedFile(file);
                          setSelectedFolder(null);
                          setIsDeleteModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                filteredFiles.length === 0 ? (
                  <EmptyFileState onAction={isPreProduction ? () => setIsUploadModalOpen(true) : undefined} actionLabel={isPreProduction ? "Upload Files" : undefined} />
                ) : (
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                          <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                          <th className="py-5 px-6 text-center font-medium">Type</th>
                          <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                          <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={() => handleOpenFile(item)}
                          >
                            <td className="py-5 px-6 text-white flex gap-2 items-center">
                              {item.label === "image" && previewUrls[item.id] ? (
                                <div className="h-10 w-10 overflow-hidden rounded-md border border-white/5 bg-[#1A1A1A]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={previewUrls[item.id]}
                                    alt={item.title || "Preview"}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className={`h-10 w-10 ${item.badgeClass} flex items-center justify-center rounded-md`}>
                                  <item.icon className={item.accentClass} size={20} />
                                </div>
                              )}
                              <span className="text-sm font-semibold">{item.title}</span>
                            </td>
                            <td className="py-5 px-6 text-center text-white/60 text-sm">
                              {openingFileId === item.id ? "OPENING..." : item.label}
                            </td>
                            <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" className="text-white/40 hover:text-white" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(item);
                                }}>
                                  Download
                                </Button>
                                <Button variant="ghost" className="text-white/40 hover:text-[#F04438]" onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(item);
                                  setSelectedFolder(null);
                                  if (isPreProduction) setIsDeleteModalOpen(true);
                                }}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {menuAnchor && (
          <FileActionMenu
            folderName={selectedFolder?.title || null}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
            anchor={menuAnchor}
            href={selectedFolder?.href}
            onDownload={handleDownloadSelectedFolder}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRename={() => toast.info("Folder rename is the next safe step.")}
          />
        )}

        <LinkToShootModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          folderName={selectedFolder?.title || ""}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadPathOverride(undefined);
            setUploadFolderLabel(undefined);
          }}
          folderName={uploadFolderLabel || selectedFolder?.title || viewState.title}
          uploadPath={isPreProduction ? uploadPathOverride || defaultUploadPath : undefined}
          onUploadComplete={loadPhase}
        />

        {isPreProduction ? (
          <CreateFolderModal
            isOpen={isCreateFolderModalOpen}
            onClose={() => setIsCreateFolderModalOpen(false)}
            onCreate={handleCreateFolder}
            description={`Create a folder inside ${viewState.title}`}
          />
        ) : null}

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => (selectedFile ? handleDeleteFile(selectedFile) : handleDeleteSelectedFolder())}
          itemName={selectedFile?.title || selectedFolder?.title || "this item"}
          itemType={selectedFile ? "file" : "folder"}
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

        {isPreProduction ? (
          <div className="lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              <Upload size={20} />
              Upload Files
            </Button>
            <Button
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="w-full bg-[#202020] text-white hover:bg-white/10 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              Create Folder
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
