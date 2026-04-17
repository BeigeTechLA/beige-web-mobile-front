"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, FolderSearch, Grid3X3, LayoutGrid, List, Loader2, Folder, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import {
  fileManagerApi,
  mapExternalFoldersToUi,
} from "@/lib/fileManagerApi";

export default function SalesPostProductionTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = (searchParams.get("view") as "grid" | "list") || "grid";
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPostProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "post");
      setFolders(
        mapExternalFoldersToUi(
          response?.folders || [],
          (folder) =>
            `/sales/file-manager/${projectId}/post-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load post-production folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadPostProduction();
    }
  }, [projectId]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleViewChange = (mode: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#999999]">
            <FolderSearch size={20} />
          </div>
          <span className="text-[#E0E0E0] text-sm lg:text-lg font-medium">Uploaded Folders</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-lg text-[#E0E0E0] text-sm hover:bg-[#222222] transition-colors">
            <span>Status</span>
            <ChevronDown size={16} />
          </button>

          <div className="md:hidden relative">
            <Button
              onClick={toggleDropdown}
              className="flex items-center gap-2 bg-[#202020] border border-white/10 p-2 h-8 rounded-lg text-white"
            >
              {viewMode === "grid" ? <Grid3X3 size={20} /> : <List size={20} />}
            </Button>

            {isOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden">
                <button
                  onClick={() => handleViewChange("grid")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
                >
                  <Grid3X3 size={18} />
                  Grid View
                </button>
                <button
                  onClick={() => handleViewChange("list")}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
                >
                  <List size={18} />
                  List View
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:flex bg-[#1A1A1A] border border-[#222222] rounded-lg p-1">
            <button
              onClick={() => handleViewChange("grid")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "grid" ? "bg-[#E5D5B8] text-black" : "text-[#666666] hover:text-[#E0E0E0]"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "list" ? "bg-[#E5D5B8] text-black" : "text-[#666666] hover:text-[#E0E0E0]"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      ) : error ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[280px] flex items-center justify-center text-red-300 text-sm">
          {error}
        </div>
      ) : viewMode === "grid" ? (
        folders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => router.push(folder.href)}
                className="text-left cursor-pointer bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden group hover:border-[#333333] transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Folder className="text-[#E5D5B8] w-8 h-8" />
                      <div>
                        <h3 className="text-[#E0E0E0] font-semibold text-base group-hover:text-[#E5D5B8] transition-colors">
                          {folder.title}
                        </h3>
                        <p className="text-[#666666] text-xs mt-0.5">
                          {folder.fileCount} Items
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="text-white/40" size={16} />
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <span className="px-4 py-2 bg-[#1A1A1A] rounded-full text-xs text-[#E0E0E0] border border-[#222222]">
                      {folder.category}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[#222222] bg-[#161616]/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center text-xs font-semibold">
                    {folder.userInitials}
                  </div>
                  <span className="text-[#999999] text-sm">Updated {folder.lastOpened}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
          <table className="hidden lg:table w-full text-left">
            <thead>
              <tr className="border-b border-[#222222]">
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Name</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[20%]">Category</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[10%]">Files</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm w-[30%]">Last Updated</th>
                <th className="px-6 py-4 text-[#888888] font-medium text-sm text-right w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody>
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <tr
                    key={folder.id}
                    onClick={() => router.push(folder.href)}
                    className="cursor-pointer border-b border-[#222222] last:border-0 hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
                          <Folder size={20} className="text-[#999999]" />
                        </div>
                        <span className="text-[#E0E0E0] font-medium">{folder.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-4 py-1.5 bg-[#1A1A1A] text-[#E0E0E0] rounded-full text-xs font-medium">
                        {folder.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#E0E0E0] text-sm">{folder.fileCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#E0E0E0] text-sm">{folder.lastOpened}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ExternalLink className="inline-block text-white/40" size={16} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="lg:hidden p-4 space-y-3">
            {folders.length > 0 ? folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => router.push(folder.href)}
                className="w-full text-left rounded-xl border border-[#222222] bg-[#0A0A0A] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{folder.title}</div>
                    <div className="text-xs text-[#888] mt-1">{folder.fileCount} Items</div>
                  </div>
                  <ExternalLink className="text-white/40" size={16} />
                </div>
              </button>
            )) : <EmptyState />}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <EmptyFileState
      title="No File Uploaded"
      description="No files have been uploaded for this project yet."
    />
  );
}
