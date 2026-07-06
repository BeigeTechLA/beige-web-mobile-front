"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import { ArrowLeft, LinkIcon, Loader2, MoreVertical, Search, Unlink, Upload } from "lucide-react";

import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileManagerBoard } from "@/components/admin/file-manager/FileManagerBoard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import Topbar from "@/components/admin/Topbar";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  isVisibleToNonAdminByVisibleUntil,
  mapExternalFoldersToUi,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

const STATUSES = ["Linked", "Unlinked"];
const ADMIN_FILE_MANAGER_VIEW_MODE_KEY = "admin-file-manager-view-mode";

export default function AdminFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);
  const { isDark } = useResolvedTheme();
  const { canDelete } = usePermissions("file_manager");

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [workspaceVisibleUntil, setWorkspaceVisibleUntil] = useState<string | null>(null);
  const [folders, setFolders] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);
  const [isOpen, setIsOpen] = useState(false);

  const [status, setStatus] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    resourceType: "workspace" | "folder" | "file";
    externalId: string;
    phase?: string;
    path?: string;
    filepath?: string;
    label?: string;
  } | null>(null);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspace(projectId);
      if (!workspaceData?.workspace) {
        setWorkspaceName("");
        setWorkspaceCode(String(projectId || ""));
        setWorkspaceConsoleUrl(null);
        setWorkspaceVisibleUntil(null);
        setFolders([]);
        return;
      }
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setWorkspaceVisibleUntil(workspaceData.workspace.visibleUntil || null);
      setFolders(
        mapExternalFoldersToUi(
          workspaceData.folders,
          (folder) =>
            isCommonEventWorkspace
              ? `/admin/file-manager/${projectId}/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
                folder.name
              )}`
              : `/admin/file-manager/${projectId}/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadWorkspace();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const isVisibilityExpired =
    isCommonEventWorkspace &&
    Boolean(workspaceVisibleUntil) &&
    !isVisibleToNonAdminByVisibleUntil(workspaceVisibleUntil);
  const statusBadge = isVisibilityExpired
    ? {
        label: "Visibility expired",
        className: "bg-[#4A3400] text-[#FACC15] border-[#F59E0B]/35",
      }
    : isCommonEventWorkspace
      ? {
          label: "Common Event",
          className: isDark
            ? "bg-black text-white border-white/10"
            : "bg-gray-100 text-gray-900 border-gray-200",
        }
      : {
          label: "Active Project",
          className: "bg-[#D4FFE4] text-[#16A34A] border-[#6ce9a6]/20",
        };

  const visibleFolders = useMemo(() => {
    let items = [...folders];
    if (status === "Linked") {
      items = items.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      items = items.filter((item) => !item.isLinked);
    }

    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [folders, searchTerm, status]);

  const boardColumns = useMemo(
    () => [
      {
        id: "linked",
        title: "Linked",
        items: visibleFolders.filter((folder) => folder.isLinked),
      },
      {
        id: "unlinked",
        title: "Unlinked",
        items: visibleFolders.filter((folder) => !folder.isLinked),
      },
    ],
    [visibleFolders]
  );

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

  const getSelectedFolderPhase = () => {
    if (isCommonEventWorkspace) return undefined;
    if (!selectedFolder?.title) return "root";
    return selectedFolder.title.toLowerCase().includes("post") ? "post" : "pre";
  };

  const handleDownloadSelectedFolder = async () => {
    if (!selectedFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: getSelectedFolderPhase(),
        path: isCommonEventWorkspace ? selectedFolder.rawName || selectedFolder.title : undefined,
      });
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download folder");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete folders");
      return;
    }
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Folder deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadWorkspace();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-x-hidden overflow-y-auto p-4 pb-10 lg:px-10 lg:py-9">
        <Button onClick={() => router.back()} className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}>
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {
          loading ? (
            <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-gray-200 bg-gray-50"}`}>
              <Loader2 className={`animate-spin text-[#E8D1AB]`} size={40} />
            </div>
          ) : error ? (
            <div className={`text-sm p-4 rounded-2xl border ${isDark
              ? "text-red-300"
              : "text-red-600"
              }`}>
              {error || "Workspace not found"}
            </div>
          ) : !workspaceName ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${isDark ? "border-white/10 bg-[#111111] text-white/65" : "border-gray-300 bg-white text-gray-600"}`}>
              Workspace is not available for this project yet. Older projects may not have one linked.
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-start gap-5 mb-3 lg:mb-6">
                  {/* Workspace Initials Avatar */}
                  <div className={`h-12 w-12 lg:h-21 lg:w-21 rounded-lg lg:rounded-2xl flex items-center justify-center text-lg lg:text-[30px] font-medium transition-colors duration-300 ${isDark
                    ? "bg-[#C8E1FF] text-[#000]"
                    : "bg-blue-100 text-blue-900"
                    }`}>
                    {getDisplayInitials(workspaceName)}
                  </div>

                  <div className={`min-w-0 ${isDark ? "text-white" : "text-black"} max-w-3xl flex-1`}>
                    <div className="flex flex-row lg:items-center gap-2">
                      <h1 className="text-sm lg:text-2xl leading-[32px] font-semibold break-words">
                        {workspaceName}
                      </h1>
                      <span className={`hidden lg:block px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs lg:font-medium border h-fit w-fit ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Project Code Meta text */}
                    <p className={`text-xs lg:text-sm transition-colors duration-300 ${isDark ? "text-[#D0D0D0]" : "text-gray-600"}`}>
                      <span className={isDark ? "text-[#AAA7A7]" : "text-gray-400"}>Project Code: </span>
                      {workspaceCode}
                    </p>

                    <span className={`mt-2 block lg:hidden px-1.5 lg:px-2.5 py-1 rounded-full text-[10px] lg:text-xs lg:font-medium border h-fit w-fit ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
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

                {/* <p className="lg:hidden text-xs text-[#D0D0D0]">
                <span className="text-[#AAA7A7]">Project Code: </span>
                {workspaceCode}
              </p> */}
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

              <div >
                <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
                  <div className="relative flex-1 max-w-xl">
                    <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-[#9F9FA9]"}`} />
                    <input
                      type="text"
                      placeholder="Search folder..."
                      value={searchTerm}
                      className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                        ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                        : "bg-white border-[#E3E3E3] text-black placeholder:text-[#9F9FA9] focus:ring-[#D7D7D7] focus:border-[#D7D7D7]"
                        }`}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 ">
                    {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
                    <FileManagerViewToggle
                      isOpen={isOpen}
                      setIsOpen={setIsOpen}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      isDark={isDark}
                    />
                  </div>
                </div>

                {visibleFolders.length === 0 ? (
                  <EmptyFolderState isDark={isDark} />
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                    {visibleFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        title={folder.title}
                        fileCount={folder.fileCount}
                        lastOpened={folder.lastOpened}
                        userInitials={folder.userInitials}
                        onOpenLinkModal={() => {
                          setSelectedFolder(folder);
                          setIsLinkModalOpen(true);
                        }}
                        href={folder.href}
                        onDownload={async () => {
                          setSelectedFolder(folder);
                          try {
                            const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
                              phase: isCommonEventWorkspace ? undefined : folder.title.toLowerCase().includes("post") ? "post" : "pre",
                              path: isCommonEventWorkspace ? folder.rawName || folder.title : undefined,
                            });
                            if (result?.url) {
                              window.open(result.url, "_blank", "noopener,noreferrer");
                            }
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to download folder");
                          }
                        }}
                        onDelete={() => {
                          setSelectedFolder(folder);
                          setIsDeleteModalOpen(true);
                        }}
                        deleteDisabled={!canDelete}
                        onShare={() => {
                          setSelectedFolder(folder);
                          setShareResource({
                            resourceType: "folder",
                            externalId: String(projectId || ""),
                            phase: isCommonEventWorkspace ? undefined : folder.title.toLowerCase().includes("post") ? "post" : "pre",
                            path: isCommonEventWorkspace ? folder.rawName || folder.title : undefined,
                            label: folder.title,
                          });
                          setIsShareModalOpen(true);
                        }}
                        onRename={() => toast.info("Folder rename is the next safe step.")}
                      />
                    ))}
                  </div>
                ) : viewMode === "board" ? (
                  <FileManagerBoard
                    columns={boardColumns}
                    emptyMessage="No folders in this column"
                    getItemId={(folder) => String(folder.id)}
                    renderCard={(folder) => (
                      <FolderCard
                        title={folder.title}
                        fileCount={folder.fileCount}
                        lastOpened={folder.lastOpened}
                        userInitials={folder.userInitials}
                        isLinked={folder.isLinked}
                        href={folder.href}
                        onOpen={() => router.push(folder.href || `${pathname}/${folder.id}`)}
                        onOpenLinkModal={() => {
                          setSelectedFolder(folder);
                          setIsLinkModalOpen(true);
                        }}
                        onDownload={async () => {
                          setSelectedFolder(folder);
                          try {
                            const result = await fileManagerApi.getExternalFolderDownloadUrl(folder.id);
                            if (result?.url) {
                              window.open(result.url, "_blank", "noopener,noreferrer");
                            }
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to download folder");
                          }
                        }}
                        onDelete={() => {
                          setSelectedFolder(folder);
                          setIsDeleteModalOpen(true);
                        }}
                        deleteDisabled={!canDelete}
                        onShare={() => {
                          setSelectedFolder(folder);
                          setIsShareModalOpen(true);
                        }}
                        onRename={() => toast.info("Folder rename is the next safe step.")}
                      />
                    )}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="lg:hidden">
                      {visibleFolders.map((folder) => (
                        <MobileFolderRow
                          key={folder.id}
                          folder={folder}
                          handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                          menuDisabled={!canDelete}
                          isDark={isDark}
                        />
                      ))}
                    </div>

                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
                            <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                            <th className="py-5 px-6 font-medium">Files</th>
                            <th className="py-5 px-6 font-medium">Last Updated</th>
                            <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                          {visibleFolders.map((folder) => (
                            <tr
                              key={folder.id}
                              className={`items-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                router.push(folder.href || `${pathname}/${folder.id}`);
                              }}
                            >
                              <td className={`py-5 px-6 flex gap-2 items-center min-w-0 ${isDark ? "text-white" : "text-black"}`}>
                                <div className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${isDark ? "bg-white/10" : "bg-transparent"}`}>
                                  <FolderOpen className={"text-[#E8D1AB] fill-[#E8D1AB]/20"} size={24} />
                                </div>
                                <span className="text-sm font-semibold">{folder.title}</span>
                              </td>
                              <td className={`py-5 px-6 font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
                                {String(folder.fileCount).padStart(2, "0")}
                              </td>
                              <td className={`py-5 px-6 font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>{folder.lastOpened}</td>
                              <td className={`py-5 px-6 text-right transition-colors ${isDark ? "text-white" : "text-black"}`}>
                                <Button
                                  className={`h-10 w-10 rounded-full p-0 transition-colors ${isDark ? "text-white hover:bg-white/10 hover:text-white/90" : "text-black bg-transparent hover:bg-black/5 hover:text-black/90"}`}
                                  onClick={(e) => handleOpenMenu(e, folder)}
                                  disabled={!canDelete}
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
            deleteDisabled={!canDelete}
            onShare={() => {
              if (!selectedFolder) return;
              setShareResource({
                resourceType: "folder",
                externalId: String(projectId || ""),
                phase: getSelectedFolderPhase(),
                path: isCommonEventWorkspace ? selectedFolder.rawName || selectedFolder.title : undefined,
                label: selectedFolder.title,
              });
              setIsShareModalOpen(true);
            }}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRename={() => toast.info("Folder rename is the next safe step.")}
            isDark={isDark}
          />
        )}

        <LinkToShootModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          folderName={selectedFolder?.title || ""}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelectedFolder}
          itemName={selectedFolder?.title || "this folder"}
          itemType="folder"
          isDeleting={isDeleting}
        />

        <ShareResourceModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareResource(null);
          }}
          resource={shareResource}
        />
      </div>
    </>
  );
}
