"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Grid3X3,
  History,
  Link,
  LinkIcon,
  List,
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
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { MobileFolderRow } from "@/components/admin/file-manager/MobileFolderRow";
import Topbar from "@/components/admin/Topbar";
import { apiClient } from "@/lib/apiClient";
import {
  fileManagerApi,
  isRecentWithinHours,
  mapExternalWorkspaceToFolderCard,
  type UiFolderItem,
} from "@/lib/fileManagerApi";
import type { SalesLead } from "@/types/sales";
import { toast } from "sonner";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";

const STATUSES = ["Linked", "Unlinked"];

interface SalesLeadsResponse {
  success: boolean;
  data: {
    leads: SalesLead[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
    };
  };
}

export default function SalesFolderManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<UiFolderItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState<UiFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { name: "All Files", icon: FolderOpen },
    { name: "Linked to folders", icon: Link },
    { name: "Recent", icon: History },
    { name: "Shared", icon: Share2 },
    { name: "Trash", icon: Trash2 },
  ];

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workspaceData, leadsResponse] = await Promise.all([
        fileManagerApi.listExternalWorkspaces(),
        apiClient.get<SalesLeadsResponse>("sales/leads", { page: 1, limit: 500 }),
      ]);

      const assignedBookingIds = new Set(
        (leadsResponse?.data?.leads || [])
          .map((lead) => lead.booking_id || lead.booking?.stream_project_booking_id)
          .filter(Boolean)
          .map((value) => String(value))
      );

      const filteredWorkspaces = workspaceData.filter((workspace) =>
        assignedBookingIds.has(String(workspace.externalId))
      );

      setProjects(
        filteredWorkspaces.map((workspace) =>
          mapExternalWorkspaceToFolderCard(workspace, "/sales/file-manager")
        )
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load sales file manager projects");
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
    } else if (selectedTab === "Recent") {
      items = items.filter((item) => isRecentWithinHours(item.updatedAtRaw, 24 * 5));
    } else if (selectedTab === "Shared" || selectedTab === "Trash") {
      items = [];
    }

    if (status === "Linked") {
      items = items.filter((item) => item.isLinked);
    } else if (status === "Unlinked") {
      items = items.filter((item) => !item.isLinked);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.category || "").toLowerCase().includes(query)
      );
    }

    return items;
  }, [projects, searchTerm, selectedTab, status]);

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
      await loadProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9">
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <div className="text-white">
            <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">File Manager</h1>
            <p className="text-xs lg:text-sm text-white/70">
              File manager folders for shoots assigned to you.
            </p>
          </div>

          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
              <span className="text-[#E8D1AB]">{projects.length}</span>
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
              <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} />

              <div className="md:hidden relative">
                <Button
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
                >
                  {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
                </Button>

                {isOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <Grid3X3 size={18} />
                      Grid View
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <List size={18} />
                      List View
                    </button>
                  </div>
                )}
              </div>

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

          {loading ? (
            <div className="text-white/70 text-sm">Loading projects...</div>
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
                  onRename={() => toast.info("Workspace rename will be the next safe step.")}
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
                        <td className="py-5 px-6 text-white flex gap-2 items-center">
                          <div className="h-10 w-10 bg-white/10 flex items-center justify-center rounded-md">
                            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
                          </div>
                          <span className="text-sm font-semibold">{folder.title}</span>
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
        </div>

        {menuAnchor && (
          <FileActionMenu
            folderName={selectedFolder?.title || null}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            onOpenLinkModal={() => {}}
            anchor={menuAnchor}
            href={selectedFolder?.href}
            onDownload={handleDownloadSelectedFolder}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRename={() => toast.info("Workspace rename will be the next safe step.")}
          />
        )}

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSelectedFolder}
          itemName={selectedFolder?.title || "this workspace"}
          itemType="workspace"
          isDeleting={isDeleting}
        />
      </div>
    </>
  );
}
