"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Grid3X3, List, MoreVertical, Search } from "lucide-react";
import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import {
  fileManagerApi,
  getDisplayInitials,
  mapExternalFoldersToUi,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";

const STATUSES = ["Linked", "Unlinked"];

export default function CreatorFolderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [folders, setFolders] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceData = await fileManagerApi.getExternalWorkspace(projectId);
      if (!workspaceData?.workspace) {
        setWorkspaceName("");
        setWorkspaceCode(String(projectId || ""));
        setWorkspaceConsoleUrl(null);
        setFolders([]);
        return;
      }
      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      setFolders(
        mapExternalFoldersToUi(
          workspaceData.folders,
          (folder) =>
            `/creator/dashboard/file-manager/${projectId}/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
  }, [loadWorkspace, projectId]);

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

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, folder: UiFolderItem) => {
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
    if (!selectedFolder?.title) return "root";
    return selectedFolder.title.toLowerCase().includes("post") ? "post" : "pre";
  };

  const handleDownloadSelectedFolder = async () => {
    if (!selectedFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: getSelectedFolderPhase(),
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
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadWorkspace();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <Button onClick={() => router.back()} className="mb-5 flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      {loading ? (
        <div className="text-sm text-white/70">Loading project...</div>
      ) : error ? (
        <div className="text-sm text-red-300">{error || "Workspace not found"}</div>
      ) : !workspaceName ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#111111] p-6 text-sm text-white/65">
          Workspace is not available for this project yet. Older projects may not have one linked.
        </div>
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
                  <span className="flex items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2.5 py-1 text-xs font-medium text-[#16A34A]">
                    Active Project
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

            <p className="text-xs text-[#D0D0D0] lg:hidden">
              <span className="text-[#AAA7A7]">Project Code: </span>
              {workspaceCode}
            </p>
            {/* {workspaceConsoleUrl ? (
              <a
                href={workspaceConsoleUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-[#E8D1AB] underline underline-offset-4 lg:hidden"
              >
                Open Storage Folder
              </a>
            ) : null} */}
          </div>

          <div className="pb-20 lg:pb-0">
            <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
              <div className="relative max-w-xl flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40 lg:left-3 lg:h-4 lg:w-4" />
                <input
                  type="text"
                  placeholder="Search folder..."
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

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
                      await handleDownloadSelectedFolder();
                    }}
                    onDelete={() => {
                      setSelectedFolder(folder);
                      setIsDeleteModalOpen(true);
                    }}
                    onRename={() => toast.info("Folder rename is the next safe step.")}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="lg:hidden">
                  {visibleFolders.map((folder) => (
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
                      {visibleFolders.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("button")) return;
                            router.push(item.href || `/creator/dashboard/file-manager/${projectId}`);
                          }}
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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSelectedFolder}
        itemName={selectedFolder?.title || "this folder"}
        itemType="folder"
        isDeleting={isDeleting}
      />
    </div>
  );
}
