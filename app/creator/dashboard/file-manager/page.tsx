"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import {
  Grid3X3,
  History,
  Calendar,
  Link,
  List,
  Loader2,
  MoreVertical,
  Search,
} from "lucide-react";

import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  isCommonEventWorkspaceId,
  isRecentWithinHours,
  mapExternalWorkspaceToFolderCard,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function CreatorFileManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();
  const { isDark } = useResolvedTheme();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    resourceType: "workspace" | "folder" | "file";
    externalId: string;
    phase?: string;
    path?: string;
    filepath?: string;
    label?: string;
  } | null>(null);
  const [projects, setProjects] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { name: "All Files", icon: FolderOpen },
    { name: "Linked to folders", icon: Link },
    { name: "Common events", icon: Calendar },
    { name: "Recent", icon: History },
    // { name: "Shared", icon: Share2 },
    // { name: "Trash", icon: Trash2 },
  ];

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fileManagerApi.listExternalWorkspaces();

      setProjects(
        data.map((workspace) =>
          mapExternalWorkspaceToFolderCard(workspace, "/creator/dashboard/file-manager")
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load file manager projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadProjects();
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFolders = useMemo(() => {
    let items = [...projects];

    if (selectedTab === "Linked to folders") {
      items = items.filter((item) => item.isLinked);
    } else if (selectedTab === "Common events") {
      items = items.filter((item) => isCommonEventWorkspaceId(item.id));
    } else if (selectedTab === "Recent") {
      items = items.filter((item) => isRecentWithinHours(item.updatedAtRaw, 24 * 5));
    }
    // } else if (selectedTab === "Shared" || selectedTab === "Trash") {
    //   items = [];
    // }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.category || "").toLowerCase().includes(query)
      );
    }

    return items;
  }, [projects, searchTerm, selectedTab]);

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

  const handleDownloadSelectedFolder = async (folder?: UiFolderItem | null) => {
    const targetFolder = folder || selectedFolder;
    if (!targetFolder) return;
    try {
      const workspaceId = await ensureAssignedWorkspace(targetFolder);
      const result = await fileManagerApi.getExternalFolderDownloadUrl(workspaceId);
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download workspace");
    }
  };

  const ensureAssignedWorkspace = async (folder: UiFolderItem) => {
    const projectId = String(folder.id || "");
    if (folder.resourcePath || isCommonEventWorkspaceId(projectId)) return projectId;

    const created = await fileManagerApi.createExternalWorkspace(
      projectId,
      folder.title || `project_#${projectId}`
    );
    if (!created?.data?.workspace?.externalId) {
      throw new Error("Failed to create file manager workspace");
    }
    await loadProjects();
    return created.data.workspace.externalId;
  };

  const handleOpenFolder = async (folder: UiFolderItem) => {
    try {
      const workspaceId = await ensureAssignedWorkspace(folder);
      router.push(`/creator/dashboard/file-manager/${workspaceId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to open workspace");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;
    if (!isCommonEventWorkspaceId(selectedFolder.id)) {
      toast.error("Only common event folders can be deleted.");
      return;
    }

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Workspace deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadProjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
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
      <div className="overflow-x-hidden overflow-y-auto p-4 pb-20 lg:px-10 lg:py-9">
        <div className="mb-3 flex items-center justify-between lg:mb-6">
          <div className="text-white">
            <h1 className={`text-lg lg:text-2xl font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>File Manager</h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Project folders and common event folders. Uploads are available inside post-production folders.
            </p>
          </div>

          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <div className="mb-4 flex w-full flex-col items-center justify-between gap-4 lg:mb-9 lg:flex-row">
          <div className={`flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto rounded-xl p-1.5 no-scrollbar scroll-smooth lg:w-fit lg:gap-3 border transition-colors ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-black/5"}`}>
            {tabs.map((tab) => {
              const isSelected = selectedTab === tab.name;
              return (
                <Button
                  key={tab.name}
                  onClick={() => setSelectedTab(tab.name)}
                  className={`flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all lg:h-12 lg:px-6 ${isSelected
                    ? isDark
                      ? "scale-[1.02] bg-white text-black shadow-lg"
                      : "scale-[1.02] bg-[#E8D1AB] text-black"
                    : isDark
                      ? "text-white/60 hover:bg-white/10 hover:text-white"
                      : "text-black/60 hover:bg-black/5 hover:text-black"
                    }`}
                >
                  <tab.icon size={20} className="shrink-0" />
                  <span className="leading-none">{tab.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Projects Total Pill */}
          <div className={`flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm lg:w-auto lg:justify-end lg:text-base transition-colors ${isDark
            ? "border-white/5 bg-[#171717]/50 text-[#8F8F8F]"
            : "border-black/5 bg-white text-neutral-500"
            }`}>
            <span className="whitespace-nowrap">Projects:</span>
            <p className="font-medium">
              <span className={isDark ? "text-[#E8D1AB]" : "text-[#cbb38b]"}>
                {projects.length}
              </span>
              <span className="mx-1">total</span>
            </p>
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
            <div className={`relative flex w-full lg:max-w-xl items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder="Search folder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                  }`}
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

          {loading ? 
          <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark
            ? "border-[#3D3D3D] bg-[#171717]"
            : "border-black/5 bg-neutral-50"
            }`}>
            <Loader2 className={`animate-spin ${isDark ? "text-[#BFA780]" : "text-[#cbb38b]"}`} size={40} />
          </div> : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : filteredFolders.length === 0 ? (
            <EmptyFolderState isDark={isDark} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  title={folder.title}
                  fileCount={folder.fileCount}
                  category={folder.category}
                  isLinked={folder.isLinked}
                  lastOpened={folder.lastOpened}
                  userInitials={folder.userInitials}
                  onOpenLinkModal={() => {
                    setSelectedFolder(folder);
                    setIsLinkModalOpen(true);
                  }}
                  onOpen={() => {
                    void handleOpenFolder(folder);
                  }}
                  href={folder.href}
                  onDelete={() => {
                    if (isCommonEventWorkspaceId(folder.id)) {
                      setSelectedFolder(folder);
                      setIsDeleteModalOpen(true);
                    }
                  }}
                  onDownload={() => handleDownloadSelectedFolder(folder)}
                  onShare={() => {
                    void (async () => {
                      try {
                        const workspaceId = await ensureAssignedWorkspace(folder);
                        setShareResource({
                          resourceType: "workspace",
                          externalId: String(workspaceId || ""),
                          label: folder.title,
                        });
                        setIsShareModalOpen(true);
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to share workspace");
                      }
                    })();
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
                    isDark={isDark}
                  />
                ))}
              </div>

              {/* <div className="hidden overflow-x-auto lg:block"> */}
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
                    {filteredFolders.map((folder) => (
                      <tr
                        key={folder.id}
                        className={`cursor-pointer items-center transition-colors border-b last:border-0 ${isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-black/5 hover:bg-black/[0.02]"}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return;
                          void handleOpenFolder(folder);
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
                            {folder.title}
                          </span>
                        </td>
                        <td className={`px-6 py-5 ${isDark ? "text-white" : "text-black"}`}>
                          {String(folder.fileCount).padStart(2, "0")}
                        </td>
                        <td className={`px-6 py-5 ${isDark ? "text-white/60" : "text-black/60"}`}>
                          {folder.lastOpened}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button
                            className={`h-10 w-10 rounded-full p-0 transition-colors bg-transparent ${isDark
                              ? "text-white hover:bg-white/10 hover:text-white/90"
                              : "text-black hover:bg-black/5 hover:text-black/80"
                              }`}
                            onClick={(e) => handleOpenMenu(e, folder)}
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
                void handleOpenFolder(selectedFolder);
              }
            }}
            onDownload={handleDownloadSelectedFolder}
            onShare={() => {
              if (!selectedFolder) return;
              void (async () => {
                try {
                  const workspaceId = await ensureAssignedWorkspace(selectedFolder);
                  setShareResource({
                    resourceType: "workspace",
                    externalId: String(workspaceId || ""),
                    label: selectedFolder.title,
                  });
                  setIsShareModalOpen(true);
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Failed to share workspace");
                }
              })();
            }}
            onDelete={
              selectedFolder && isCommonEventWorkspaceId(selectedFolder.id)
                ? () => setIsDeleteModalOpen(true)
                : undefined
            }
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

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelectedFolder}
          itemName={selectedFolder?.title || "this folder"}
          itemType="folder"
          isDeleting={isDeleting}
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
