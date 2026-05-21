"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import {
  Calendar,
  History,
  Link,
  LinkIcon,
  Loader2,
  MoreVertical,
  Search,

  Share2,
  Trash2,
  Unlink,
} from "lucide-react";
import { FolderOpen } from "lucide-react";
import { FolderCard } from "@/components/admin/file-manager/FolderCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import { CreateFolderModal } from "@/components/admin/file-manager/CreateFolderModal";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import { FileManagerBoard } from "@/components/admin/file-manager/FileManagerBoard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  isRecentWithinHours,
  mapExternalWorkspaceToFolderCard,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";

const STATUSES = ["Linked", "Unlinked"];
const PAGE_SIZE = 24;
const PAGINATION_WINDOW = 1;
const ADMIN_FILE_MANAGER_VIEW_MODE_KEY = "admin-file-manager-view-mode";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}

const getPageItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 1) return [1];

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - PAGINATION_WINDOW);
  const end = Math.min(totalPages - 1, currentPage + PAGINATION_WINDOW);

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("ellipsis");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
};

export default function AdminFolderManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 350);
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);
  const [status, setStatus] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreateCommonEventModalOpen, setIsCreateCommonEventModalOpen] = useState(false);
  const [projects, setProjects] = useState<UiFolderItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUpdatedTimestamp = (value?: string) => {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const isSameCalendarDate = (value: string | undefined, selected: Date) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    return (
      date.getFullYear() === selected.getFullYear() &&
      date.getMonth() === selected.getMonth() &&
      date.getDate() === selected.getDate()
    );
  };

  const tabs = [
    { name: "All Files", icon: FolderOpen },
    { name: "Common Event", icon: Calendar },
    { name: "Linked to folders", icon: Link },
    { name: "Recent", icon: History },
    // { name: "Shared", icon: Share2 },
    // { name: "Trash", icon: Trash2 },
  ];

  const loadProjects = async (page: number = 1, searchQuery: string = debouncedSearchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const { workspaces, pagination: serverPagination } = await fileManagerApi.listExternalWorkspacesPaginated({
        page,
        limit: PAGE_SIZE,
        search: searchQuery,
      });

      setProjects(workspaces.map((workspace) => mapExternalWorkspaceToFolderCard(workspace, "/admin/file-manager")));
      setPagination(serverPagination);
      if (serverPagination.page !== page) {
        setCurrentPage(serverPagination.page);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load file manager projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadProjects(currentPage, debouncedSearchTerm);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentPage, debouncedSearchTerm]);

  const applySharedFilters = (items: UiFolderItem[]) => {
    let nextItems = [...items];

    if (status === "Linked") {
      nextItems = nextItems.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      nextItems = nextItems.filter((item) => !item.isLinked);
    }

    if (selectedDate) {
      nextItems = nextItems.filter((item) => isSameCalendarDate(item.updatedAtRaw, selectedDate));
    }

    nextItems.sort((a, b) => {
      const diff = getUpdatedTimestamp(b.updatedAtRaw) - getUpdatedTimestamp(a.updatedAtRaw);
      if (diff !== 0) return diff;
      return a.title.localeCompare(b.title);
    });

    return nextItems;
  };

  const filteredFolders = useMemo(() => {
    let items = [...projects];

    if (selectedTab === "Linked to folders") {
      items = items.filter((item) => item.isLinked);
    } else if (selectedTab === "Recent") {
      items = items.filter((item) => isRecentWithinHours(item.updatedAtRaw, 24 * 5));
    } else if (selectedTab === "Common Event") {
      items = items.filter((item) => item.category === "Common Event");
    }
    // } else if (selectedTab === "Shared" || selectedTab === "Trash") {
    //   items = [];
    // }

    return applySharedFilters(items);
  }, [projects, selectedTab, status, selectedDate]);

  const boardColumns = useMemo(
    () => [
      {
        id: "all-files",
        title: "All Files",
        items: applySharedFilters(projects),
      },
      {
        id: "common-event",
        title: "Common Event",
        items: applySharedFilters(projects.filter((folder) => folder.category === "Common Event")),
      },
      {
        id: "linked-to-folders",
        title: "Linked to folders",
        items: applySharedFilters(projects.filter((folder) => folder.isLinked)),
      },
      {
        id: "recent",
        title: "Recent",
        items: applySharedFilters(projects.filter((folder) => isRecentWithinHours(folder.updatedAtRaw, 24 * 5))),
      },
    ],
    [projects, status, selectedDate]
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

  const handleDownloadSelectedFolder = async () => {
    if (!selectedFolder) return;
    try {
      const result = await fileManagerApi.getExternalFolderDownloadUrl(selectedFolder.id);
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download workspace");
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Workspace deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadProjects(currentPage, debouncedSearchTerm);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCommonEventFolder = async ({ name }: { name: string }) => {
    const eventName = String(name || "").trim();
    if (!eventName) return;
    try {
      setIsCreatingEvent(true);
      await fileManagerApi.createCommonEvent(eventName);
      toast.success("Common event folder created");
      setCurrentPage(1);
      await loadProjects(1, debouncedSearchTerm);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create common event folder");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const topbarActions = (
    <Button
      onClick={() => setIsCreateCommonEventModalOpen(true)}
      disabled={isCreatingEvent}
      className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
    >
      {isCreatingEvent ? "Creating..." : "Create Common Event"}
    </Button>
  );

  return (
    <>
      <Topbar pathname={pathname} actions={topbarActions} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9">
        <div className="mb-3 lg:mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start">
            <div className="text-white w-full">
            <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">File Manager</h1>
            <p className="text-xs lg:text-sm text-white/70">
              Live project folders from paid and booked shoots.
            </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <SortDateButton
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                width="w-full sm:w-fit"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full mb-4 lg:mb-9">
          <div className="flex flex-nowrap items-center gap-1.5 lg:gap-3 bg-[#171717] p-1.5 rounded-xl w-full lg:w-fit overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => (
              <Button
                key={tab.name}
                onClick={() => setSelectedTab(tab.name)}
                className={`flex items-center gap-2 px-4 lg:px-6 py-2 text-sm font-medium transition-all rounded-lg h-10 lg:h-12 shrink-0 whitespace-nowrap ${
                  selectedTab === tab.name
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <tab.icon size={20} className="shrink-0" />
                <span className="leading-none">{tab.name}</span>
              </Button>
            ))}
          </div>

          <div className="w-full lg:w-auto flex justify-between lg:justify-end items-center gap-2 text-sm lg:text-base text-[#8F8F8F] bg-[#171717]/50 px-4 py-2 rounded-lg border border-white/5">
            <span className="whitespace-nowrap">Projects:</span>
            <p className="font-medium">
              <span className="text-[#E8D1AB]">{pagination.total}</span>
              <span className="mx-1">total</span>
            </p>
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
              <input
                type="text"
                placeholder="Search folder..."
                value={searchTerm}
                className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
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
              />
            </div>
          </div>

          {loading ? (
             <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>
          ) : error ? (
            <div className="text-red-300 text-sm">{error}</div>
          ) : filteredFolders.length === 0 ? (
            <EmptyFolderState/>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
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
                  href={folder.href}
                  onDownload={async () => {
                    setSelectedFolder(folder);
                    try {
                      const result = await fileManagerApi.getExternalFolderDownloadUrl(folder.id);
                      if (result?.url) {
                        window.open(result.url, "_blank", "noopener,noreferrer");
                      }
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to download workspace");
                    }
                  }}
                  onDelete={() => {
                    setSelectedFolder(folder);
                    setIsDeleteModalOpen(true);
                  }}
                  onShare={() => {
                    setSelectedFolder(folder);
                    setIsShareModalOpen(true);
                  }}
                  onRename={() => toast.info("Workspace rename will be the next safe step.")}
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
                  category={folder.category}
                  isLinked={folder.isLinked}
                  lastOpened={folder.lastOpened}
                  userInitials={folder.userInitials}
                  onOpenLinkModal={() => {
                    setSelectedFolder(folder);
                    setIsLinkModalOpen(true);
                  }}
                  href={folder.href}
                  onOpen={() => router.push(folder.href || `${pathname}/${folder.id}`)}
                  onDownload={async () => {
                    setSelectedFolder(folder);
                    try {
                      const result = await fileManagerApi.getExternalFolderDownloadUrl(folder.id);
                      if (result?.url) {
                        window.open(result.url, "_blank", "noopener,noreferrer");
                      }
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to download workspace");
                    }
                  }}
                  onDelete={() => {
                    setSelectedFolder(folder);
                    setIsDeleteModalOpen(true);
                  }}
                  onShare={() => {
                    setSelectedFolder(folder);
                    setIsShareModalOpen(true);
                  }}
                  onRename={() => toast.info("Workspace rename will be the next safe step.")}
                />
              )}
            />
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
                      <th className="py-5 px-6 font-medium">Category</th>
                      <th className="py-5 px-6 font-medium">Files</th>
                      <th className="py-5 px-6 font-medium">Status</th>
                      <th className="py-5 px-6 font-medium">Last Updated</th>
                      <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFolders.map((folder) => (
                      <tr
                        key={folder.id}
                        className="items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return;
                          router.push(folder.href || `${pathname}/${folder.id}`);
                        }}
                      >
                        <td className="py-5 px-6 text-white flex gap-2 items-center min-w-0">
                          <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-md">
                            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                          </div>
                          <span className="text-sm font-semibold truncate max-w-[220px]" title={folder.title}>
                            {folder.title}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-white text-[15px]">
                          <span className="px-4 py-1.5 rounded-xl bg-[#171717] text-white text-xs font-medium ">
                            {folder.category}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-white">{String(folder.fileCount).padStart(2, "0")}</td>
                        <td className="py-5 px-6">
                          {folder.isLinked ? (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2 py-1 text-[11px] font-medium leading-none text-[#16A34A]">
                              <LinkIcon size={16} />
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#6ce9a6]/20 bg-[#FFF1F2] px-2 py-1 text-[11px] font-medium leading-none text-[#F43F5E]">
                              <Unlink size={16} />
                              Unlinked
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-6">{folder.lastOpened}</td>
                        <td className="py-5 px-6 text-right">
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

          {!loading && !error && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0E0E0E] p-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="h-12 min-w-[112px] rounded-xl border border-white/10 bg-[#131313] px-5 text-sm font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {getPageItems(pagination.page, pagination.totalPages).map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-lg text-white/50">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-12 min-w-12 rounded-xl px-4 text-sm font-medium transition-colors ${
                        item === pagination.page
                          ? "bg-[#E5D5B8] text-black"
                          : "text-[#8CA2C5] hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className="h-12 min-w-[112px] rounded-xl border border-white/10 bg-[#131313] px-5 text-sm font-medium text-[#8CA2C5] transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
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
            onDownload={handleDownloadSelectedFolder}
            onShare={() => setIsShareModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRename={() => toast.info("Workspace rename will be the next safe step.")}
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
          itemName={selectedFolder?.title || "this workspace"}
          itemType="workspace"
          isDeleting={isDeleting}
        />

        <CreateFolderModal
          isOpen={isCreateCommonEventModalOpen}
          onClose={() => {
            if (!isCreatingEvent) setIsCreateCommonEventModalOpen(false);
          }}
          onCreate={handleCreateCommonEventFolder}
          title="Create Common Event"
          description="Create a common folder for admin uploads and file sharing"
        />

        <ShareResourceModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          resource={
            selectedFolder
              ? {
                  resourceType: "workspace",
                  externalId: String(selectedFolder.id || ""),
                  label: selectedFolder.title || "Workspace",
                }
              : null
          }
        />
      </div>
    </>
  );
}
