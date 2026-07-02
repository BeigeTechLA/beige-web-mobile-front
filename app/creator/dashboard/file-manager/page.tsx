"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  fileManagerApi,
  isCommonEventWorkspaceId,
  isRecentWithinHours,
  mapExternalWorkspaceToFolderCard,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";

export default function CreatorFileManagerPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode();

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

  return (
    <div className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between lg:mb-6">
        <div className="text-white">
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">File Manager</h1>
          <p className="text-xs lg:text-sm text-white/70">
            Project folders and common event folders. Uploads are available inside post-production folders.
          </p>
        </div>

        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <div className="mb-4 flex w-full flex-col items-center justify-between gap-4 lg:mb-9 lg:flex-row">
        <div className="flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto rounded-xl bg-[#171717] p-1.5 no-scrollbar scroll-smooth lg:w-fit lg:gap-3">
          {tabs.map((tab) => (
            <Button
              key={tab.name}
              onClick={() => setSelectedTab(tab.name)}
              className={`flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all lg:h-12 lg:px-6 ${
                selectedTab === tab.name
                  ? "scale-[1.02] bg-white text-black shadow-lg"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <tab.icon size={20} className="shrink-0" />
              <span className="leading-none">{tab.name}</span>
            </Button>
          ))}
        </div>

        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-[#171717]/50 px-4 py-2 text-sm text-[#8F8F8F] lg:w-auto lg:justify-end lg:text-base">
          <span className="whitespace-nowrap">Projects:</span>
          <p className="font-medium">
            <span className="text-[#E8D1AB]">{projects.length}</span>
            <span className="mx-1">total</span>
          </p>
        </div>
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
            <div className="relative md:hidden">
              <Button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-[#202020] p-2 text-white"
              >
                {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
              </Button>

              {isOpen && (
                <div className="absolute right-0 top-full z-[50] mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    Grid View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    List View
                  </button>
                </div>
              )}
            </div>

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

        {loading ? <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
                }`}>
                <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
              </div> : error ? (
          
          <div className="text-sm text-red-300">{error}</div>
        ) : filteredFolders.length === 0 ? (
            <EmptyFolderState/>
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
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="cursor-pointer rounded-xl bg-[#202020] text-sm font-normal text-[#E8D1AB]">
                    <th className="rounded-l-xl px-6 py-5 font-medium">Name</th>
                    <th className="px-6 py-5 font-medium">Files</th>
                    <th className="px-6 py-5 font-medium">Last Updated</th>
                    <th className="rounded-r-xl px-6 py-5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.map((folder) => (
                    <tr
                      key={folder.id}
                      className="cursor-pointer items-center transition-colors hover:bg-white/[0.02]"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button")) return;
                        void handleOpenFolder(folder);
                      }}
                    >
                      <td className="flex items-center gap-2 px-6 py-5 text-white">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
                          <FolderOpen className="fill-[#E8D1AB]/20 text-[#E8D1AB]" size={24} />
                        </div>
                        <span className="text-sm font-semibold">{folder.title}</span>
                      </td>
                      <td className="px-6 py-5 text-white">{String(folder.fileCount).padStart(2, "0")}</td>
                      <td className="px-6 py-5">{folder.lastOpened}</td>
                      <td className="px-6 py-5 text-right">
                        <Button
                          className="h-10 w-10 rounded-full p-0 text-white transition-colors hover:bg-white/10 hover:text-white/90"
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
