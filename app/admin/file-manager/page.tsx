"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";
import {
  Calendar,
  CalendarX,
  ChevronLeft,
  History,
  Link,
  LinkIcon,
  Loader2,
  MoreVertical,
  Search,
  ChevronRight,
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
  isVisibleToNonAdminByVisibleUntil,
  isRecentWithinHours,
  mapExternalWorkspaceToFolderCard,
  type ExternalFolderActivityResponse,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import WorkspaceAccessModal from "@/components/admin/file-manager/WorkspaceAccessModal";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { getFileManagerRouteState, getFileManagerRouteStateKey, setFileManagerRouteState } from "@/lib/fileManagerRouteState";

const STATUSES = ["Linked", "Unlinked"];
const LIST_PAGE_SIZE = 10;
const BOARD_PAGE_SIZE = 24;
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

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const isVisibilityExpiredFolder = (folder: UiFolderItem) =>
  folder.category === "Common Event" &&
  Boolean(folder.visibleUntil) &&
  !isVisibleToNonAdminByVisibleUntil(folder.visibleUntil);

const formatFileSize = (bytes?: number) => {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatActivityDate = (value?: string) => {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

export default function AdminFolderManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const routeStateKey = getFileManagerRouteStateKey(pathname);
  const [selectedTab, setSelectedTab] = useState("All folders");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 350);
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);
  const { isDark } = useResolvedTheme();
  const { canCreate, canDelete } = usePermissions("file_manager");

  const [status, setStatus] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState<ExternalFolderActivityResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreateCommonEventModalOpen, setIsCreateCommonEventModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [projects, setProjects] = useState<UiFolderItem[]>([]);
  const [boardProjects, setBoardProjects] = useState<UiFolderItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [boardPage, setBoardPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIST_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [boardPagination, setBoardPagination] = useState({
    page: 1,
    limit: BOARD_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [boardLoadingInitial, setBoardLoadingInitial] = useState(false);
  const [boardLoadingMore, setBoardLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectsRequestRef = useRef(0);
  const boardProjectsRequestRef = useRef(0);
  const [routeStateReady, setRouteStateReady] = useState(false);
  const hasSkippedInitialFilterResetRef = useRef(false);

  useEffect(() => {
    const savedState = getFileManagerRouteState(routeStateKey);
    setSelectedTab(savedState.selectedTab);
    setSearchTerm(savedState.searchTerm);
    setCurrentPage(savedState.currentPage);
    setRouteStateReady(true);
  }, [routeStateKey]);

  useEffect(() => {
    if (!routeStateReady) return;

    setFileManagerRouteState({
      selectedTab,
      searchTerm,
      currentPage,
    }, routeStateKey);
  }, [currentPage, routeStateKey, routeStateReady, searchTerm, selectedTab]);

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
    { name: "All folders", icon: FolderOpen },
    { name: "Shoot folders", icon: Link },
    { name: "Common events", icon: Calendar },
    { name: "Visibility expired", icon: CalendarX },
    { name: "Recent", icon: History },
    // { name: "Shared", icon: Share2 },
    // { name: "Trash", icon: Trash2 },
  ];

  const handleTabChange = (nextTab: string) => {
    // Invalidate any in-flight grid request immediately so late responses cannot
    // flash stale data after the active tab changes.
    projectsRequestRef.current += 1;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setBoardPage(1);
    setSelectedTab(nextTab);
  };

  const loadProjects = async (page: number = 1, searchQuery: string = debouncedSearchTerm) => {
    const requestId = ++projectsRequestRef.current;

    try {
      if (requestId === projectsRequestRef.current) {
        setLoading(true);
        setError(null);
      }

      const { workspaces, pagination: serverPagination } = await fileManagerApi.listExternalWorkspacesPaginated({
        page,
        limit: LIST_PAGE_SIZE,
        search: searchQuery,
        workspaceType:
          selectedTab === "Common events"
            ? "common-events"
            : selectedTab === "Visibility expired"
            ? "visibility-expired"
              : undefined,
      });

      if (requestId !== projectsRequestRef.current) return;

      setProjects(workspaces.map((workspace) => mapExternalWorkspaceToFolderCard(workspace, "/admin/file-manager")));
      setPagination(serverPagination);
      if (serverPagination.page !== page) {
        setCurrentPage(serverPagination.page);
      }
    } catch (err: unknown) {
      if (requestId !== projectsRequestRef.current) return;
      setError(getErrorMessage(err, "Failed to load file manager projects"));
    } finally {
      if (requestId === projectsRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const loadBoardProjects = useCallback(
    async (page: number = 1, searchQuery: string = debouncedSearchTerm, append = false) => {
      const requestId = ++boardProjectsRequestRef.current;

      try {
        if (append) {
          if (requestId === boardProjectsRequestRef.current) {
            setBoardLoadingMore(true);
          }
        } else {
          if (requestId === boardProjectsRequestRef.current) {
            setBoardLoadingInitial(true);
          }
        }

        const { workspaces, pagination: serverPagination } = await fileManagerApi.listExternalWorkspacesPaginated({
          page,
          limit: BOARD_PAGE_SIZE,
          search: searchQuery,
        });

        if (requestId !== boardProjectsRequestRef.current) return;

        const mapped = workspaces.map((workspace) =>
          mapExternalWorkspaceToFolderCard(workspace, "/admin/file-manager")
        );

        setBoardProjects((prev) => {
          if (!append) return mapped;
          const seen = new Set(prev.map((item) => item.id));
          const next = [...prev];
          mapped.forEach((item) => {
            if (!seen.has(item.id)) {
              next.push(item);
              seen.add(item.id);
            }
          });
          return next;
        });
        setBoardPagination(serverPagination);
        setBoardPage(serverPagination.page || page);
      } catch (err: unknown) {
        if (requestId !== boardProjectsRequestRef.current) return;
        setError(getErrorMessage(err, "Failed to load file manager projects"));
      } finally {
        if (requestId === boardProjectsRequestRef.current) {
          setBoardLoadingInitial(false);
          setBoardLoadingMore(false);
        }
      }
    },
    [debouncedSearchTerm]
  );

  useEffect(() => {
    if (!routeStateReady) return;
    if (!hasSkippedInitialFilterResetRef.current) {
      hasSkippedInitialFilterResetRef.current = true;
      return;
    }

    setCurrentPage(1);
    setBoardPage(1);
  }, [debouncedSearchTerm, routeStateReady, selectedTab]);

  useEffect(() => {
    if (!routeStateReady) return;
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadProjects(currentPage, debouncedSearchTerm);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentPage, debouncedSearchTerm, routeStateReady, selectedTab]);

  useEffect(() => {
    if (!routeStateReady) return;
    if (viewMode !== "board") return;
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadBoardProjects(1, debouncedSearchTerm, false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [viewMode, debouncedSearchTerm, loadBoardProjects, routeStateReady]);

  const handleLoadMoreBoardProjects = useCallback(async () => {
    if (viewMode !== "board") return;
    if (boardLoadingInitial || boardLoadingMore) return;
    if (!boardPagination.hasNextPage) return;
    await loadBoardProjects((boardPagination.page || boardPage) + 1, debouncedSearchTerm, true);
  }, [
    viewMode,
    boardLoadingInitial,
    boardLoadingMore,
    boardPagination.hasNextPage,
    boardPagination.page,
    boardPage,
    loadBoardProjects,
    debouncedSearchTerm,
  ]);

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
    const source = viewMode === "board" ? boardProjects : projects;
    let items = [...source];

    if (selectedTab === "Shoot folders") {
      items = items.filter((item) => item.category !== "Common Event");
    } else if (selectedTab === "Recent") {
      items = items.filter((item) => isRecentWithinHours(item.updatedAtRaw, 24 * 5));
    } else if (selectedTab === "Common events") {
      items = items.filter((item) => item.category === "Common Event");
    } else if (selectedTab === "Visibility expired") {
      items = items.filter(isVisibilityExpiredFolder);
    }
    // } else if (selectedTab === "Shared" || selectedTab === "Trash") {
    //   items = [];
    // }

    return applySharedFilters(items);
  }, [projects, boardProjects, selectedTab, status, selectedDate, viewMode]);

  const boardColumns = useMemo(
    () => [
      {
        id: "all-files",
        title: "All folders",
        items: applySharedFilters(boardProjects),
        hasMore: boardPagination.hasNextPage,
        isLoadingMore: boardLoadingMore,
      },
      {
        id: "shoot-folders",
        title: "Shoot folders",
        items: applySharedFilters(boardProjects.filter((folder) => folder.category !== "Common Event")),
        hasMore: boardPagination.hasNextPage,
        isLoadingMore: boardLoadingMore,
      },
      {
        id: "common-event",
        title: "Common events",
        items: applySharedFilters(boardProjects.filter((folder) => folder.category === "Common Event")),
        hasMore: boardPagination.hasNextPage,
        isLoadingMore: boardLoadingMore,
      },
      {
        id: "visibility-expired",
        title: "Visibility expired",
        items: applySharedFilters(boardProjects.filter(isVisibilityExpiredFolder)),
        hasMore: boardPagination.hasNextPage,
        isLoadingMore: boardLoadingMore,
      },
      {
        id: "recent",
        title: "Recent",
        items: applySharedFilters(
          boardProjects.filter((folder) => isRecentWithinHours(folder.updatedAtRaw, 24 * 5))
        ),
        hasMore: boardPagination.hasNextPage,
        isLoadingMore: boardLoadingMore,
      },
    ],
    [
      boardProjects,
      boardPagination.hasNextPage,
      boardLoadingMore,
      status,
      selectedDate,
    ]
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
        fileManagerApi.downloadUrl(result.url, `${selectedFolder.title || "workspace"}.zip`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to download workspace"));
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!canDelete || !selectedFolder?.resourcePath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(selectedFolder.resourcePath);
      toast.success("Workspace deleted");
      setIsDeleteModalOpen(false);
      setMenuAnchor(null);
      setSelectedFolder(null);
      await loadProjects(currentPage, debouncedSearchTerm);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete workspace"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenActivity = async (folder?: UiFolderItem | null) => {
    const targetFolder = folder || selectedFolder;
    const rootPath = targetFolder?.resourcePath || targetFolder?.rawName || "";
    if (!rootPath) return;

    setSelectedFolder(targetFolder);
    setMenuAnchor(null);
    setIsActivityModalOpen(true);
    setActivityLoading(true);
    setActivityData(null);

    try {
      const data = await fileManagerApi.getExternalFolderActivityLogs({
        rootPath,
        limit: 50,
      });
      setActivityData(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load folder activity"));
    } finally {
      setActivityLoading(false);
    }
  };

  const openRenameModal = (folder?: UiFolderItem | null) => {
    const targetFolder = folder || selectedFolder;
    if (!targetFolder?.id) return;
    setSelectedFolder(targetFolder);
    setMenuAnchor(null);
    setIsRenameModalOpen(true);
  };

  const handleRenameWorkspace = async ({ name }: { name: string }) => {
    if (!selectedFolder?.id) return;
    const displayName = name.trim();
    if (!displayName) {
      toast.error("Display name is required");
      return;
    }

    try {
      setIsRenamingWorkspace(true);
      await fileManagerApi.updateWorkspaceDisplayName(selectedFolder.id, displayName);
      toast.success("Folder display name updated");
      setIsRenameModalOpen(false);
      setSelectedFolder(null);
      await loadProjects(currentPage, debouncedSearchTerm);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to rename folder"));
      throw err;
    } finally {
      setIsRenamingWorkspace(false);
    }
  };

  const handleCreateCommonEventFolder = async ({ name, visibleUntil }: { name: string; visibleUntil?: string | null }) => {
    if (!canCreate) return;
    const eventName = String(name || "").trim();
    if (!eventName) return;
    try {
      setIsCreatingEvent(true);
      await fileManagerApi.createCommonEvent(eventName, { visibleUntil });
      toast.success("Common event folder created");
      setCurrentPage(1);
      await loadProjects(1, debouncedSearchTerm);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create common event folder");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleUpdateCommonEventVisibility = async ({ visibleUntil }: { name: string; visibleUntil?: string | null }) => {
    if (!selectedFolder?.id) return;
    try {
      setIsUpdatingVisibility(true);
      await fileManagerApi.updateCommonEventVisibility(String(selectedFolder.id), visibleUntil || null);
      toast.success("Common event visibility updated");
      await loadProjects(currentPage, debouncedSearchTerm);
      if (viewMode === "board") {
        await loadBoardProjects(1, debouncedSearchTerm, false);
      }
      setIsVisibilityModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update common event visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const openVisibilityModal = (folder: UiFolderItem) => {
    setSelectedFolder(folder);
    setIsVisibilityModalOpen(true);
  };

  const topbarActions = canCreate ? (
    <Button
      onClick={() => setIsCreateCommonEventModalOpen(true)}
      disabled={isCreatingEvent}
      className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
    >
      {isCreatingEvent ? "Creating..." : "Create Common Event"}
    </Button>
  ) : null;

  return (
    <>
      <Topbar pathname={pathname} actions={topbarActions} />

      <div className="overflow-x-hidden overflow-y-auto p-4 pb-20 lg:px-10 lg:py-9">
        <div className="mb-3 lg:mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start">
            <div className={`w-full transition-colors duration-200 ${isDark ? "text-white" : "text-black"}`}>
              <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">
                File Manager
              </h1>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#727272]"}`}>
                Live project folders from paid and booked shoots.
              </p>
            </div>

            <div className="w-fit lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <SortDateButton
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                width="w-full sm:w-fit"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full mb-4 lg:mb-9">
          {/* Tab Navigation Segment — constrained so it never causes horizontal scroll */}
          <div className={`w-full lg:w-fit overflow-x-auto no-scrollbar scroll-smooth transition-colors duration-200 ${isDark ? "bg-[#171717]" : "bg-white"} flex flex-nowrap items-center gap-1.5 lg:gap-3 p-1.5 rounded-xl`}>
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.name;
              return (
                <Button
                  key={tab.name}
                  onClick={() => handleTabChange(tab.name)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-2 text-sm font-medium transition-all rounded-lg h-10 lg:h-12 shrink-0 whitespace-nowrap ${isActive
                    ? isDark
                      ? "bg-white text-black shadow-lg scale-[1.02]"
                      : "bg-black text-[#E8D1AB] shadow-md scale-[1.02] hover:bg-black/90"
                    : isDark
                      ? "bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
                      : "bg-transparent text-[#B1B1B1] hover:bg-black/5 hover:text-black"
                    }`}
                >
                  <tab.icon size={20} className="shrink-0" />
                  <span className="leading-none">{tab.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Active Projects Counter Metric Badge */}
          <div className={`w-full lg:w-auto flex justify-between lg:justify-end items-center gap-2 text-sm lg:text-base px-4 py-2 rounded-lg border transition-colors duration-200 ${isDark
            ? "text-[#8F8F8F] bg-[#171717]/50 border-white/5"
            : "text-[#000000] bg-white border-white"
            }`}>
            <span className="whitespace-nowrap">Projects:</span>
            <p className="font-medium">
              <span className={"text-[#E8D1AB] font-bold"}>
                {viewMode === "board" ? boardPagination.total : pagination.total}
              </span>
              <span className={`mx-1 ${isDark ? "text-[#8F8F8F]" : "text-[#000000]"}`}>total</span>
            </p>
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <div className="flex justify-between items-center gap-2 mb-3 lg:mb-6">
            {/* Search Input Container Block */}
            <div className="relative flex-1 max-w-xl">
              <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-[#9F9FA9]"}`} />
              <input
                type="text"
                placeholder="Search folder, client name, or email..."
                value={searchTerm}
                className={`w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-white border-[#E3E3E3] text-black placeholder:text-[#9F9FA9] focus:ring-[#D7D7D7] focus:border-[#D7D7D7]"
                  }`}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Control Actions / Toggle Layout Wrapper */}
            <div className="flex gap-2">
              {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} isDark={isDark} /> */}

              <FileManagerViewToggle
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isDark={isDark}
              />
            </div>
          </div>

          {(viewMode === "board" ? boardLoadingInitial : loading) ? (
            <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#e3e3e3] bg-[#F0F0F0]"}`}>
              <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
            </div>
          ) : error ? (
            <div className="text-red-300 text-sm">{error}</div>
          ) : filteredFolders.length === 0 ? (
            <EmptyFolderState isDark={isDark} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  title={folder.title}
                  fileCount={folder.fileCount}
                  category={folder.category}
                  isLinked={folder.isLinked}
                  visibilityExpired={isVisibilityExpiredFolder(folder)}
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
                        fileManagerApi.downloadUrl(result.url, `${folder.title || "workspace"}.zip`);
                      }
                    } catch (err: unknown) {
                      toast.error(getErrorMessage(err, "Failed to download workspace"));
                    }
                  }}
                  onDelete={canDelete ? () => {
                    setSelectedFolder(folder);
                    setIsDeleteModalOpen(true);
                  } : undefined}
                  onShare={() => {
                    setSelectedFolder(folder);
                    setIsShareModalOpen(true);
                  }}
                  onAccess={folder.category !== "Common Event" ? () => {
                    setSelectedFolder(folder);
                    setIsAccessModalOpen(true);
                  } : undefined}
                  onActivity={() => handleOpenActivity(folder)}
                  onEditVisibility={
                    folder.category === "Common Event" ? () => openVisibilityModal(folder) : undefined
                  }
                  onRename={() => openRenameModal(folder)}
                />
              ))}
            </div>
          ) : viewMode === "board" ? (
            <FileManagerBoard
              columns={boardColumns}
              emptyMessage="No folders in this column"
              onColumnEndReached={() => {
                handleLoadMoreBoardProjects();
              }}
              getItemId={(folder) => String(folder.id)}
              renderCard={(folder) => (
                <FolderCard
                  title={folder.title}
                  fileCount={folder.fileCount}
                  category={folder.category}
                  isLinked={folder.isLinked}
                  visibilityExpired={isVisibilityExpiredFolder(folder)}
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
                        fileManagerApi.downloadUrl(result.url, `${folder.title || "workspace"}.zip`);
                      }
                    } catch (err: unknown) {
                      toast.error(getErrorMessage(err, "Failed to download workspace"));
                    }
                  }}
                  onDelete={canDelete ? () => {
                    setSelectedFolder(folder);
                    setIsDeleteModalOpen(true);
                  } : undefined}
                  onShare={() => {
                    setSelectedFolder(folder);
                    setIsShareModalOpen(true);
                  }}
                  onAccess={folder.category !== "Common Event" ? () => {
                    setSelectedFolder(folder);
                    setIsAccessModalOpen(true);
                  } : undefined}
                  onActivity={() => handleOpenActivity(folder)}
                  onEditVisibility={
                    folder.category === "Common Event" ? () => openVisibilityModal(folder) : undefined
                  }
                  onRename={() => openRenameModal(folder)}
                />
              )}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {/* Mobile Responsive Layout List */}
              <div className="lg:hidden">
                {filteredFolders.map((folder) => (
                  <MobileFolderRow
                    key={folder.id}
                    folder={{ ...folder, visibilityExpired: isVisibilityExpiredFolder(folder) }}
                    handleOpenMenu={(e) => handleOpenMenu(e, folder)}
                    isDark={isDark}
                  />
                ))}
              </div>

              {/* Desktop Large Dataset Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse rounded-xl">
                  <thead>
                    <tr className={`text-sm font-normal cursor-pointer transition-colors duration-200 ${isDark
                      ? "bg-[#202020] text-[#E8D1AB]"
                      : "bg-[#FFFCF6] text-[#000000]"
                      }`}>
                      <th className="rounded-t-xl py-5 px-6 font-medium">Name</th>
                      <th className="py-5 px-6 font-medium">Category</th>
                      <th className="py-5 px-6 font-medium">Files</th>
                      <th className="py-5 px-6 font-medium">Status</th>
                      <th className="py-5 px-6 font-medium">Last Updated</th>
                      <th className="py-5 px-6 font-medium text-right rounded-t-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                    {filteredFolders.map((folder) => (
                      <tr
                        key={folder.id}
                        className={`items-center cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return;
                          router.push(folder.href || `${pathname}/${folder.id}`);
                        }}
                      >
                        {/* Folder Name & Icon Block */}
                        <td className={`py-5 px-6 flex gap-2 items-center min-w-0 {isDark ? "text-white" : "text-black"}`}>
                          <div className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${isDark ? "bg-white/10" : "bg-transparent"}`}>
                            <FolderOpen className={"text-[#E8D1AB] fill-[#E8D1AB]/20"} size={24} />
                          </div>
                          <span className="text-sm font-semibold truncate max-w-[220px]" title={folder.title}>
                            {folder.title}
                          </span>
                        </td>

                        {/* Category Field */}
                        <td className="py-5 px-6 text-base">
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${isDark? "bg-[#171717] text-white": "bg-[#F4F5F7] text-[#727272]"}`}>
                            {folder.category}
                          </span>
                        </td>

                        {/* File Counts */}
                        <td className={`py-5 px-6 font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
                          {String(folder.fileCount).padStart(2, "0")}
                        </td>

                        {/* Linking Badges */}
                        <td className="py-5 px-6">
                          {isVisibilityExpiredFolder(folder) ? (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/15 px-2 py-1 text-[11px] font-medium leading-none text-amber-200">
                              <CalendarX size={16} />
                              Visibility expired
                            </span>
                          ) : folder.isLinked ? (
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

                        {/* Meta Update Info */}
                        <td className="py-5 px-6">{folder.lastOpened}</td>

                        {/* Table Action Controls */}
                        <td className="py-5 px-6 text-right">
                          <Button
                            className={`h-10 w-10 rounded-full p-0 transition-colors ${isDark
                              ? "text-white hover:bg-white/10 hover:text-white/90"
                              : "text-black bg-transparent hover:bg-black/5 hover:text-black/90"
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

          {!loading && !error && viewMode !== "board" && pagination.totalPages > 1 && (
            <div className="w-full mt-6 flex items-center justify-center">
              <div className={`flex flex-wrap items-center justify-center lg:gap-2 rounded-2xl border transition-colors duration-200 p-2 max-w-full ${isDark ? "border-white/10 bg-[#0E0E0E]" : "border-[#D7D7D7] bg-white"}`}>
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className={`h-10 w-10 lg:h-12 lg:min-w-[112px] rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center ${isDark
                    ? "border-white/10 bg-[#131313] text-white/55 hover:border-white/20 hover:text-white"
                    : "border-[#D7D7D7] bg-white text-[#727272] hover:border-black/20 hover:text-black"
                    }`}
                >
                  <span className="hidden lg:block px-4">Previous</span>
                  <ChevronLeft size={16} className="lg:hidden" />
                </button>

                {/* Page Number Items */}
                {getPageItems(pagination.page, pagination.totalPages).map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className={`px-1 lg:px-2 text-lg transition-colors ${isDark ? "text-white/50" : "text-[#727272]/60"}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-10 w-10 lg:h-12 lg:min-w-12 rounded-xl px-2 lg:px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center ${item === pagination.page
                        ? isDark
                          ? "bg-[#E5D5B8] text-black shadow-sm"
                          : "bg-[#E8D1AB] text-black shadow-sm"
                        : isDark
                          ? "text-[#8CA2C5] hover:text-white"
                          : "text-[#727272] hover:text-black"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`h-10 w-10 lg:h-12 lg:min-w-[112px] rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center ${isDark
                    ? "border-white/10 bg-[#131313] text-[#8CA2C5] hover:border-white/20 hover:text-white"
                    : "border-[#D7D7D7] bg-white text-[#727272] hover:border-black/20 hover:text-black"
                    }`}
                >
                  <span className="hidden lg:block px-4">Next</span>
                  <ChevronRight size={16} className="lg:hidden" />
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
            onAccess={selectedFolder?.category !== "Common Event" ? () => setIsAccessModalOpen(true) : undefined}
            onActivity={() => handleOpenActivity(selectedFolder)}
            onDelete={() => setIsDeleteModalOpen(true)}
            onEditVisibility={
              selectedFolder?.category === "Common Event" && selectedFolder
                ? () => openVisibilityModal(selectedFolder)
                : undefined
            }
            onRename={() => openRenameModal(selectedFolder)}
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
          itemName={selectedFolder?.title || "this workspace"}
          itemType="workspace"
          isDeleting={isDeleting}
          isDark={isDark}
        />

        <CreateFolderModal
          isOpen={isCreateCommonEventModalOpen}
          onClose={() => {
            if (!isCreatingEvent) setIsCreateCommonEventModalOpen(false);
          }}
          onCreate={handleCreateCommonEventFolder}
          title="Create Common Event"
          description="Create a common folder for admin uploads and affiliate access"
          showVisibilityUntil
          allowPastVisibleUntil
          submitLabel="Create Folder"
          submittingLabel={isCreatingEvent ? "Creating..." : "Creating..."}
          isDark={isDark}
        />

        <CreateFolderModal
          isOpen={isVisibilityModalOpen}
          onClose={() => {
            if (!isUpdatingVisibility) setIsVisibilityModalOpen(false);
          }}
          onCreate={handleUpdateCommonEventVisibility}
          title="Edit Visibility"
          description="Set how long clients and creative partners can see this event"
          initialName={selectedFolder?.title || ""}
          initialVisibleUntil={selectedFolder?.visibleUntil || null}
          showVisibilityUntil
          allowPastVisibleUntil
          nameDisabled
          submitLabel="Save Date"
          submittingLabel="Saving..."
          isDark={isDark}
        />

        <CreateFolderModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            if (!isRenamingWorkspace) setIsRenameModalOpen(false);
          }}
          onCreate={handleRenameWorkspace}
          title="Rename Folder"
          description="Change the display name shown inside the app"
          initialName={selectedFolder?.title || ""}
          submitLabel="Save Name"
          submittingLabel="Saving..."
          isDark={isDark}
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

        <WorkspaceAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          resource={
            selectedFolder
              ? {
                externalId: String(selectedFolder.id || ""),
                label: selectedFolder.title || "Workspace",
              }
              : null
          }
        />

        {isActivityModalOpen ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-4 sm:py-8">
            <div className={`flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl max-h-[min(760px,calc(100dvh-32px))] sm:max-h-[min(760px,calc(100dvh-64px))] ${isDark ? "border-white/10 bg-[#101010] text-white" : "border-[#D7D7D7] bg-white text-black"}`}>
              <div className={`shrink-0 flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-white/10" : "border-[#E3E3E3]"}`}>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">Folder Activity</h2>
                  <p className={`truncate text-sm ${isDark ? "text-white/50" : "text-[#727272]"}`}>
                    {selectedFolder?.title || "Selected folder"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className={`rounded-full px-3 py-1 text-sm ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  Close
                </button>
              </div>

              <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 [scrollbar-width:thin] ${isDark ? "[scrollbar-color:rgba(255,255,255,0.22)_transparent]" : "[scrollbar-color:rgba(0,0,0,0.18)_transparent]"} [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? "[&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30" : "[&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30"}`}>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-[#BFA780]" size={30} />
                  </div>
                ) : !activityData || activityData.logs.length === 0 ? (
                  <p className={`py-10 text-center text-sm ${isDark ? "text-white/45" : "text-[#727272]"}`}>
                    No upload or delete activity logged yet.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className={`sticky -top-4 z-20 -mx-4 -mt-4 grid grid-cols-1 gap-3 border-b px-4 pb-3 pt-4 sm:-top-5 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5 md:grid-cols-2 ${isDark ? "border-white/10 bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}>
                      {[
                        { label: "Uploads", items: activityData.summary.uploads },
                        { label: "Deletes", items: activityData.summary.deletes },
                      ].map((group) => (
                        <div key={group.label} className={`rounded-xl border p-4 shadow-sm ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E3E3E3] bg-[#FAFAFA]"}`}>
                          <h3 className="text-sm font-semibold">{group.label}</h3>
                          <div className="mt-3 space-y-2">
                            {group.items.length === 0 ? (
                              <p className={`text-xs ${isDark ? "text-white/40" : "text-[#727272]"}`}>No records</p>
                            ) : (
                              group.items.slice(0, 5).map((item) => (
                                <div key={`${group.label}-${item.userId || item.name}`} className="flex items-center justify-between gap-3 text-sm">
                                  <span className="truncate">{item.name || "Unknown"}</span>
                                  <span className="shrink-0 font-semibold text-[#BFA780]">
                                    {item.fileCount} files
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {activityData.logs.map((log) => (
                        <div key={log.id || log._id || `${log.action}-${log.createdAt}`} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {log.actorName || "Unknown"} {log.action === "upload" ? "uploaded" : "deleted"} {log.fileCount} {log.fileCount === 1 ? "file" : "files"}
                              </p>
                              <p className={`mt-1 truncate text-xs ${isDark ? "text-white/45" : "text-[#727272]"}`}>
                                {log.targetName || log.targetPath || log.folderPath}
                              </p>
                            </div>
                            <div className={`shrink-0 text-xs ${isDark ? "text-white/45" : "text-[#727272]"}`}>
                              {formatActivityDate(log.createdAt)}
                            </div>
                          </div>
                          <div className={`mt-3 text-xs ${isDark ? "text-white/45" : "text-[#727272]"}`}>
                            {formatFileSize(log.totalSize)}
                            {log.files?.length ? ` • ${log.files.slice(0, 3).map((file) => file.name || file.path).filter(Boolean).join(", ")}` : ""}
                            {log.files && log.files.length > 3 ? `, +${log.files.length - 3} more` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex items-center justify-center bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => setIsCreateCommonEventModalOpen(true)}
            disabled={isCreatingEvent}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            {isCreatingEvent ? "Creating..." : "Create Common Event"}
          </Button>
        </div>
      </div>
    </>
  );
}
