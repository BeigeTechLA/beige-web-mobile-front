"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import { ArrowLeft, Grid3X3, List, Loader2, MoreVertical, Plus, Search } from "lucide-react";

import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import {
  fileManagerApi,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFoldersToUi,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";

const STATUSES = ["Linked", "Unlinked"];

export default function CreatorFolderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [folders, setFolders] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const [status, setStatus] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingMyFolder, setIsCreatingMyFolder] = useState(false);
  const [hasCreatedCpFolders, setHasCreatedCpFolders] = useState<boolean | null>(null);
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

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setHasCreatedCpFolders(null);
      const workspaceData = await fileManagerApi.getExternalWorkspace(projectId);
      if (!workspaceData?.workspace) {
        setWorkspaceName("");
        setWorkspaceCode(String(projectId || ""));
        setWorkspaceConsoleUrl(null);
        setFolders([]);
        setHasCreatedCpFolders(null);
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

      if (isCommonEventWorkspace) {
        const [preAccess, postAccess] = await Promise.allSettled([
          fileManagerApi.getExternalWorkspaceFiles(projectId, "pre"),
          fileManagerApi.getExternalWorkspaceFiles(projectId, "post"),
        ]);
        setHasCreatedCpFolders(preAccess.status === "fulfilled" && postAccess.status === "fulfilled");
      } else {
        setHasCreatedCpFolders(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [isCommonEventWorkspace, projectId]);

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

  const preProductionFolder = useMemo(
    () => folders.find((folder) => folder.title.toLowerCase().includes("pre production")),
    [folders]
  );
  const postProductionFolder = useMemo(
    () => folders.find((folder) => folder.title.toLowerCase().includes("post production")),
    [folders]
  );

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

  const getFolderPhase = (folder?: UiFolderItem | null) => {
    if (!folder?.title) return "root";
    return folder.title.toLowerCase().includes("post") ? "post" : "pre";
  };

  const openFolderWithAccessCheck = async (folder: UiFolderItem) => {
    const targetHref = folder.href || `/creator/dashboard/file-manager/${projectId}`;
    const phase = getFolderPhase(folder);

    if (!isCommonEventWorkspace || (phase !== "pre" && phase !== "post")) {
      router.push(targetHref);
      return;
    }

    try {
      await fileManagerApi.getExternalWorkspaceFiles(projectId, phase);
      router.push(targetHref);
    } catch (err: unknown) {
      toast.error("First create your folder, then you can access your folders and upload files.");
    }
  };

  const handleDownloadSelectedFolder = async (folder?: UiFolderItem | null) => {
    const targetFolder = folder || selectedFolder;
    if (!targetFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(projectId, {
        phase: getFolderPhase(targetFolder),
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
    if (!isCommonEventWorkspace) {
      toast.error("Folders can only be deleted in common events.");
      return;
    }

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

  const handleCreateMyEventFolder = async () => {
    if (!isCommonEventWorkspace) return;
    try {
      setIsCreatingMyFolder(true);
      const results = await Promise.allSettled([
        fileManagerApi.createCreatorEventFolder(String(projectId), undefined, { phase: "pre" }),
        fileManagerApi.createCreatorEventFolder(String(projectId), undefined, { phase: "post" }),
      ]);
      const fulfilled = results
        .filter((entry): entry is PromiseFulfilledResult<{ folderName?: string }> => entry.status === "fulfilled")
        .map((entry) => entry.value);

      if (!fulfilled.length) {
        throw new Error("Failed to create Creative Partner folder");
      }

      setHasCreatedCpFolders(true);
      toast.success("Your folders are ready in both Pre Production and Post Production. Open either folder below to upload files.");
      await loadWorkspace();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create your folder");
    } finally {
      setIsCreatingMyFolder(false);
    }
  };

  const handleOpenPersonalPhaseFolder = async (phase: "pre" | "post") => {
    const phaseSlug = phase === "post" ? "post-production" : "pre-production";
    try {
      const phaseData = await fileManagerApi.getExternalWorkspaceFiles(projectId, phase);
      const personalFolderName = String(phaseData?.folders?.[0]?.name || "").trim();

      if (!personalFolderName) {
        router.push(`/creator/dashboard/file-manager/${projectId}/${phaseSlug}`);
        return;
      }

      router.push(
        `/creator/dashboard/file-manager/${projectId}/${phaseSlug}/${personalFolderName
          .toLowerCase()
          .replace(/\s+/g, "-")}?path=${encodeURIComponent(personalFolderName)}`
      );
    } catch {
      toast.error("Please create your folder first, then open Pre Production or Post Production.");
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between gap-2">
        <Button onClick={() => router.back()} className="flex items-center gap-2 p-0 text-white transition-colors hover:text-white/80">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>
      </div>

      {loading ? (
        <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>      
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

            {isCommonEventWorkspace && hasCreatedCpFolders === false ? (
              <div className="mb-4 rounded-xl border border-[#E5D5B8]/25 bg-[#E5D5B8]/5 p-3 text-xs text-[#E8D1AB] lg:mb-6 lg:text-sm">
                No folders yet. Create one to get started - it will appear in both Pre Production and Post Production
                {/* <br />
                Once created, you can see your folder in Pre Production and Post Production as well. */}
              </div>
            ) : isCommonEventWorkspace && hasCreatedCpFolders && (preProductionFolder || postProductionFolder) ? (
              <div className="mb-4 rounded-xl border border-[#E5D5B8]/25 bg-[#E5D5B8]/5 p-3 text-xs text-[#E8D1AB] lg:mb-6 lg:text-sm">
                <p>
                  Your folders are ready in both{" "}
                  {preProductionFolder ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenPersonalPhaseFolder("pre")}
                      className="font-semibold underline underline-offset-4 transition-colors hover:text-[#F4E7CC]"
                    >
                      Pre Production
                    </button>
                  ) : (
                    <span className="font-semibold">Pre Production</span>
                  )}{" "}
                  and{" "}
                  {postProductionFolder ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenPersonalPhaseFolder("post")}
                      className="font-semibold underline underline-offset-4 transition-colors hover:text-[#F4E7CC]"
                    >
                      Post Production
                    </button>
                  ) : (
                    <span className="font-semibold">Post Production</span>
                  )}
                  . Open either folder below to upload files.
                </p>
              </div>
            ) : null}

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
                    onOpen={() => {
                      void openFolderWithAccessCheck(folder);
                    }}
                    href={folder.href}
                    onDownload={async () => {
                      await handleDownloadSelectedFolder(folder);
                    }}
                    onShare={() => {
                      setShareResource({
                        resourceType: "folder",
                        externalId: String(projectId || ""),
                        phase: getFolderPhase(folder),
                        label: folder.title,
                      });
                      setIsShareModalOpen(true);
                    }}
                    onDelete={
                      isCommonEventWorkspace
                        ? () => {
                            setSelectedFolder(folder);
                            setIsDeleteModalOpen(true);
                          }
                        : undefined
                    }
                    onRename={() => toast.info("Folder rename is the next safe step.")}
                  />
                ))}
                {isCommonEventWorkspace && hasCreatedCpFolders === false ? (
                  <button
                    type="button"
                    onClick={handleCreateMyEventFolder}
                    disabled={isCreatingMyFolder}
                    className="flex min-h-[202px] w-full items-center justify-center rounded-xl border border-dashed border-[#E5D5B8]/35 bg-[#18181b] text-[#E8D1AB] transition-all hover:border-[#E5D5B8]/60 hover:bg-[#1d1d22] disabled:cursor-not-allowed disabled:opacity-60 lg:max-w-[350px] lg:rounded-3xl"
                  >
                    <span className="flex flex-col items-center gap-2 text-sm font-medium">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5D5B8]/50 bg-[#E5D5B8]/10">
                        <Plus size={22} />
                      </span>
                      {isCreatingMyFolder ? "Creating..." : "Create Your Folder"}
                    </span>
                  </button>
                ) : null}
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
                            void openFolderWithAccessCheck(item);
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
          onOpen={() => {
            if (selectedFolder) {
              void openFolderWithAccessCheck(selectedFolder);
            }
          }}
          onDownload={handleDownloadSelectedFolder}
          onShare={() => {
            if (!selectedFolder) return;
            setShareResource({
              resourceType: "folder",
              externalId: String(projectId || ""),
              phase: getFolderPhase(selectedFolder),
              label: selectedFolder.title,
            });
            setIsShareModalOpen(true);
          }}
          onDelete={isCommonEventWorkspace ? () => setIsDeleteModalOpen(true) : undefined}
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
      <ShareResourceModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareResource(null);
        }}
        resource={shareResource}
      />

    </div>
  );
}
