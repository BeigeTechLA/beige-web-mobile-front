"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import { ArrowLeft, Grid3X3, List, Loader2, MoreVertical, Plus, Search } from "lucide-react";

import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getExternalWorkspaceDisplayName,
  getDisplayInitials,
  isCommonEventWorkspaceId,
  mapExternalFoldersToUi,
  shouldShowCommonEventRootFolder,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  getFileManagerRouteState,
  getFileManagerRouteStateKey,
  setFileManagerRouteState,
} from "@/lib/fileManagerRouteState";

const STATUSES = ["Linked", "Unlinked"];

export default function CreatorFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const isCommonEventWorkspace = isCommonEventWorkspaceId(projectId);
  const { isDark } = useResolvedTheme();
  const routeStateKey = getFileManagerRouteStateKey(pathname);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [folders, setFolders] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    const savedState = getFileManagerRouteState(routeStateKey);
    setSearchTerm(savedState.searchTerm);
  }, [routeStateKey]);

  useEffect(() => {
    setFileManagerRouteState(
      {
        searchTerm,
      },
      routeStateKey
    );
  }, [routeStateKey, searchTerm]);

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
      setWorkspaceName(getExternalWorkspaceDisplayName(workspaceData.workspace));
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      const mappedFolders = mapExternalFoldersToUi(
          workspaceData.folders,
          (folder) =>
            `/creator/dashboard/file-manager/${projectId}/${folder.name.toLowerCase().replace(/\s+/g, "-")}?path=${encodeURIComponent(
              folder.name
            )}`
        );
      setFolders(
        isCommonEventWorkspace
          ? mappedFolders.filter(shouldShowCommonEventRootFolder)
          : mappedFolders
      );

      if (isCommonEventWorkspace) {
        setHasCreatedCpFolders((workspaceData.folders || []).length > 0);
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
    if (isCommonEventWorkspace) return undefined;
    if (!folder?.title) return "root";
    return folder.title.toLowerCase().includes("post") ? "post" : "pre";
  };

  const openFolderWithAccessCheck = async (folder: UiFolderItem) => {
    const targetHref = folder.href || `/creator/dashboard/file-manager/${projectId}`;
    const phase = getFolderPhase(folder);

    if (isCommonEventWorkspace || (phase !== "pre" && phase !== "post")) {
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
        path: isCommonEventWorkspace ? targetFolder.rawName || targetFolder.title : undefined,
      });
      if (result?.url) {
        fileManagerApi.downloadUrl(result.url, `${targetFolder.title || "folder"}.zip`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download folder");
    }
  };

  const handleCreateMyEventFolder = async () => {
    if (!isCommonEventWorkspace) return;
    try {
      setIsCreatingMyFolder(true);
      await fileManagerApi.createCreatorEventFolder(String(projectId));
      setHasCreatedCpFolders(true);
      toast.success("Your folder is ready. Open it below to upload files.");
      await loadWorkspace();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create your folder");
    } finally {
      setIsCreatingMyFolder(false);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setIsOpen(false);
  };

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-x-hidden overflow-y-auto p-4 pb-10 lg:px-10 lg:py-9">
        <Button
          onClick={() => router.back()} className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}>
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {loading ? (
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark
            ? "border-[#3D3D3D] bg-[#171717]"
            : "border-black/5 bg-neutral-50"
            }`}>
            <Loader2 className={`animate-spin ${isDark ? "text-[#BFA780]" : "text-[#cbb38b]"}`} size={40} />
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
                <div className={`min-w-0 max-w-3xl flex-1 ${isDark ? "text-white" : "text-black"}`}>
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                    <h1 className="break-words text-sm font-semibold leading-[32px] lg:text-2xl">
                      {workspaceName}
                    </h1>
                    <span className="flex items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2.5 py-1 text-xs font-medium text-[#16A34A]">
                      Active Project
                    </span>
                  </div>
                  <p className={`text-xs lg:text-sm transition-colors duration-300 ${isDark ? "text-[#D0D0D0]" : "text-gray-600"}`}>
                    <span className={isDark ? "text-[#AAA7A7]" : "text-gray-400"}>Project Code: </span>
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
                <div className={`relative flex w-full lg:max-w-xl items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"}`}>
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
                  <input
                    type="text"
                    placeholder="Search folder..."
                    value={searchTerm}
                    className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                      ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                      : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                      }`}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* View sWitcher */}
                <div className="flex gap-2">
                  {/* MOBILE VIEW: Dropdown Button */}
                  <div className="lg:hidden relative">
                    <Button
                      onClick={toggleDropdown}
                      className={`flex items-center gap-2 ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white" : "border-[#E5E5E5] bg-white text-black"} border p-2 h-12 w-12 rounded-lg `}
                    >
                      {viewMode === 'grid' ? <Grid3X3 size={20} /> : <List size={20} />}
                    </Button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className={`absolute top-full right-0 mt-2 w-48 border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden ${isDark ? "border-[#FFFFFF33] bg-[#171717] text-white" : "border-[#E5E5E5] bg-[#FFFCF6] text-black"}`}>
                        <button
                          onClick={() => handleViewChange('grid')}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'grid'
                            ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                            : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                            }`}
                        >
                          <Grid3X3 size={18} />
                          Grid View
                        </button>
                        <button
                          onClick={() => handleViewChange('list')}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === 'list'
                            ? (isDark ? "bg-white/10 text-white" : "bg-black/5 font-medium text-black")
                            : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                            }`}
                        >
                          <List size={18} />
                          List View
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DESKTOP VIEW: Original Toggle */}
                  <div className={`hidden lg:flex ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-white"} p-1 rounded-xl border w-fit`}>
                    <button
                      onClick={() => handleViewChange("grid")}
                      className={`relative z-10 inline-flex items-center justify-center rounded-lg  px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${viewMode === "grid"
                        ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/60 hover:text-white"
                          : "text-[#666666] hover:text-black"
                        }`}
                    >
                      <Grid3X3 size={20} />
                    </button>
                    <button
                      onClick={() => handleViewChange("list")}
                      className={`relative z-10 inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${viewMode === "list"
                        ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/60 hover:text-white"
                          : "text-[#666666] hover:text-black"
                        }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {isCommonEventWorkspace && hasCreatedCpFolders === false ? (
                <div className={`mb-4 rounded-xl border p-3 text-xs lg:mb-6 lg:text-sm transition-all duration-200 ${isDark ? "border-[#E5D5B8]/25 bg-[#E5D5B8]/5 text-[#E8D1AB]" : "border-[#e5e5e5] bg-white text-black/40"}`}>
                  No folder yet. Create your folder to get started.
                </div>
              ) : isCommonEventWorkspace && hasCreatedCpFolders ? (
                <div className={`mb-4 rounded-xl border p-3 text-xs lg:mb-6 lg:text-sm transition-all duration-200 ${isDark ? "border-[#E5D5B8]/25 bg-[#E5D5B8]/5 text-[#E8D1AB]" : "border-[#e5e5e5] bg-white text-black/40"}`}>
                  <p>Your folder is ready. Open it below to upload files.</p>
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
                          path: isCommonEventWorkspace ? folder.rawName || folder.title : undefined,
                          label: folder.title,
                        });
                        setIsShareModalOpen(true);
                      }}
                      onDelete={undefined}
                      onRename={() => toast.info("Folder rename is the next safe step.")}
                    />
                  ))}
                  {isCommonEventWorkspace && hasCreatedCpFolders === false ? (
                    <button
                      type="button"
                      onClick={handleCreateMyEventFolder}
                      disabled={isCreatingMyFolder}
                      className={`flex min-h-[202px] w-full items-center justify-center border transition-all disabled:cursor-not-allowed disabled:opacity-60 lg:max-w-[350px] lg:rounded-3xl rounded-xl ${isDark
                        ? "border-[#E5D5B8]/35 bg-[#18181b] text-[#E8D1AB] hover:border-[#E5D5B8]/60 hover:bg-[#1d1d22]"
                        : "border-[#e5e5e5e] bg-white text-[#cbb38b] hover:border-[#cbb38b]/70 hover:bg-neutral-100/70"
                        }`}
                    >
                      <span className="flex flex-col items-center gap-2 text-sm font-medium">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isDark
                            ? "border-[#E5D5B8]/50 bg-[#E5D5B8]/10"
                            : "border-[#e5e5e5e] bg-[#cbb38b]/10"
                          }`}>
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
                        isDark={isDark}
                      />
                    ))}
                  </div>

                  <div className={`border rounded-xl hidden overflow-x-auto lg:block transition-all ${isDark ? "bg-[#111] border-white/5" : "bg-white border-[#E5E5E5] shadow-sm"}`}>
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider transition-colors border-b ${isDark ? "bg-white/[0.03] text-white/40 border-white/5" : "bg-black/[0.05] text-black/40 border-[#E5E5E5]"}`}>
                          <th className="rounded-tl-xl px-6 py-5 font-medium">Name</th>
                          <th className="px-6 py-5 font-medium">Files</th>
                          <th className="px-6 py-5 font-medium">Last Updated</th>
                          <th className="rounded-tr-xl px-6 py-5 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFolders.map((item) => (
                          <tr
                            key={item.id}
                            className={`cursor-pointer items-center transition-colors border-b last:border-0 ${isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-black/5 hover:bg-black/[0.02]"}`}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("button")) return;
                              void openFolderWithAccessCheck(item);
                            }}
                          >
                            <td className="flex items-center gap-2 px-6 py-5">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${isDark ? "bg-white/10" : "bg-black/5"
                                }`}>
                                <FolderOpen
                                  className={isDark ? "fill-[#E8D1AB]/20 text-[#E8D1AB]" : "fill-[#cbb38b]/20 text-[#cbb38b]"}
                                  size={24}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                                {item.title}
                              </span>
                            </td>
                            <td className={`px-6 py-5 ${isDark ? "text-white" : "text-black"}`}>
                              {String(item.fileCount).padStart(2, "0")}
                            </td>
                            <td className={`px-6 py-5 ${isDark ? "text-white/60" : "text-black/60"}`}>
                              {item.lastOpened}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <Button
                                className={`h-10 w-10 rounded-full p-0 transition-colors bg-transparent ${isDark
                                  ? "text-white hover:bg-white/10 hover:text-white/90"
                                  : "text-black hover:bg-black/5 hover:text-black/80"
                                  }`}
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
                path: isCommonEventWorkspace ? selectedFolder.rawName || selectedFolder.title : undefined,
                label: selectedFolder.title,
              });
              setIsShareModalOpen(true);
            }}
            onDelete={undefined}
            onRename={() => toast.info("Folder rename is the next safe step.")}
            isDark={isDark}
          />
        )}

        <LinkToShootModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          folderName={selectedFolder?.title || ""}
          isDark={isDark}
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
