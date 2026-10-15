"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileIcon,
  Folder,
  Grid2X2,
  Grip,
  Link2,
  List,
  MoreVertical,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WORKSPACE_FOLDERS,
  useWorkspaceRecord,
  type EditorWorkspaceRole,
  type WorkspaceFile,
  type WorkspaceFileView,
  type WorkspaceFolder,
} from "./editorWorkspaceDemoStore";
import { editorWorkspaceDemoGateway } from "./editorWorkspaceAdapter";
import {
  WorkspaceInput,
  WorkspaceSelect,
  workspaceAccent,
  workspaceMuted,
  workspaceSecondary,
  workspaceSurface,
} from "./EditorWorkspaceShared";

interface EditorWorkspaceFileManagerProps {
  shootId: string;
  role: EditorWorkspaceRole;
  isDark: boolean;
  canUpload: boolean;
}

const MAX_DEMO_FILE_SIZE = 100 * 1024 * 1024;

export default function EditorWorkspaceFileManager({
  shootId,
  role,
  isDark,
  canUpload,
}: EditorWorkspaceFileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const record = useWorkspaceRecord(shootId, role);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<WorkspaceFileView>("grid");
  const [activeFolder, setActiveFolder] = useState<WorkspaceFolder | null>(
    null,
  );
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailFolder, setDetailFolder] = useState<WorkspaceFolder | null>(
    null,
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFolder, setTargetFolder] = useState("post");

  const files = record.files || [];
  const query = search.trim().toLowerCase();
  const shownFolders = WORKSPACE_FOLDERS.filter((folder) =>
    folder.name.toLowerCase().includes(query),
  );
  const shownFiles = files.filter(
    (file) =>
      file.folderId === activeFolder?.id &&
      file.name.toLowerCase().includes(query),
  );

  const folderFileCount = (folder: WorkspaceFolder) =>
    folder.files + files.filter((file) => file.folderId === folder.id).length;

  const closeUpload = () => {
    if (isUploading) return;
    setIsUploadOpen(false);
    setSelectedFile(null);
  };

  const openFolder = (folder: WorkspaceFolder) => {
    setActiveFolder(folder);
    setMenuId(null);
    setSearch("");
  };

  const handleSaveUpload = async () => {
    if (!canUpload || !selectedFile || isUploading) return;

    if (selectedFile.size > MAX_DEMO_FILE_SIZE) {
      toast.error("Select a file smaller than 100 MB for this preview.");
      return;
    }

    const file: WorkspaceFile = {
      id: `${Date.now()}-${selectedFile.name}`,
      name: selectedFile.name,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      folderId: targetFolder,
      date: new Date().toISOString(),
      uploadedBy: "Demo Editor",
      isDemo: true,
    };

    setIsUploading(true);
    try {
      const result = await editorWorkspaceDemoGateway.uploadDeliverable(
        role,
        shootId,
        file,
      );
      if (!result.success) {
        toast.error(result.message || "Could not save the file preview.");
        return;
      }

      setIsUploadOpen(false);
      setSelectedFile(null);
      setActiveFolder(
        WORKSPACE_FOLDERS.find((folder) => folder.id === targetFolder) || null,
      );
      setSearch("");
      toast.success(
        "File metadata saved in this browser tab. No file was uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const renderFolderCard = (folder: WorkspaceFolder) => (
    <div
      key={folder.id}
      className={`min-w-0 overflow-visible rounded-xl border transition-colors hover:border-[#C9B28C] ${
        isDark
          ? "border-[#303030] bg-[#202020]"
          : "border-[#E7E7E7] bg-[#F7F7F7]"
      }`}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => openFolder(folder)}
            className="flex min-w-0 flex-1 items-start gap-2 text-left"
          >
            <Folder
              size={21}
              className="shrink-0 fill-[#E8D1AB] text-[#E8D1AB]"
            />
            <span className="min-w-0">
              <span
                className="block truncate text-sm font-medium"
                title={folder.name}
              >
                {folder.name}
              </span>
              <span
                className={`mt-1 block text-xs ${isDark ? "text-[#E8D1AB]" : "text-[#856638]"}`}
              >
                {folderFileCount(folder)} items
              </span>
            </span>
          </button>

          <Popover
            open={menuId === folder.id}
            onOpenChange={(open) => setMenuId(open ? folder.id : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${folder.name}`}
                className="shrink-0 rounded-md p-1 hover:bg-white/10"
              >
                <MoreVertical size={19} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className={`z-[75] w-[165px] space-y-1 rounded-lg border p-1 shadow-xl ${
                isDark
                  ? "border-[#393939] bg-[#121212] text-white"
                  : "border-[#DEDEDE] bg-white text-black"
              }`}
            >
              <button
                type="button"
                onClick={() => openFolder(folder)}
                className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-black/10 dark:hover:bg-white/10"
              >
                Open folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailFolder(folder);
                  setMenuId(null);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-black/10 dark:hover:bg-white/10"
              >
                Folder details
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <span
            className={`rounded-full px-2 py-2 text-center text-xs ${isDark ? "bg-[#151515]" : "bg-[#EAEAEA]"}`}
          >
            Project Files
          </span>
          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-[#CDF8E2] px-2 py-2 text-xs text-[#0B9D4D]">
            <Link2 size={13} /> Linked
          </span>
        </div>
      </div>
      <div
        className={`flex items-center gap-2 border-t px-4 py-3 text-xs ${isDark ? "border-[#4A4A4A]" : "border-[#DFDFDF]"}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C7E1FF] text-sm font-medium text-black">
          FM
        </span>
        <span className={workspaceMuted(isDark)}>Linked demo folder</span>
      </div>
    </div>
  );

  const folderTable = (
    <div className="overflow-x-auto rounded-lg border border-[#333333]">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm">
        <thead
          className={
            isDark
              ? "bg-[#191919] text-[#E8D1AB]"
              : "bg-[#F6F1E7] text-[#715A3D]"
          }
        >
          <tr>
            <th className="px-4 py-3 font-medium">Folder Name</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Link Status</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {shownFolders.map((folder) => (
            <tr
              key={folder.id}
              className={
                isDark
                  ? "border-t border-[#333333]"
                  : "border-t border-[#E5E5E5]"
              }
            >
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => openFolder(folder)}
                  className="flex items-center gap-2 text-left hover:text-[#BA9864]"
                >
                  <Folder size={18} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                  {folder.name}
                </button>
              </td>
              <td className="px-4 py-3">{folderFileCount(folder)}</td>
              <td className="px-4 py-3 text-[#10A85A]">Linked</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => setDetailFolder(folder)}
                  className={`rounded-md border px-3 py-1 text-xs ${workspaceSecondary(isDark)}`}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!shownFolders.length && (
        <p className={`py-10 text-center text-sm ${workspaceMuted(isDark)}`}>
          No folders found.
        </p>
      )}
    </div>
  );

  const viewOptions: {
    value: WorkspaceFileView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "table", label: "Table view", icon: <Grip size={17} /> },
    { value: "list", label: "List view", icon: <List size={17} /> },
    { value: "grid", label: "Grid view", icon: <Grid2X2 size={17} /> },
  ];

  return (
    <>
      <section
        className={`overflow-hidden rounded-2xl border ${workspaceSurface(isDark)}`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-5 ${isDark ? "border-[#292929]" : "border-[#EAEAEA]"}`}
        >
          <div>
            <h2 className="text-sm font-semibold">Files &amp; Versions</h2>
            <p className={`mt-1 text-xs ${workspaceMuted(isDark)}`}>
              Files follow the shoot folder structure. Important project folders
              are protected.
            </p>
          </div>
          <Button
            type="button"
            disabled={!canUpload}
            onClick={() => setIsUploadOpen(true)}
            className={`h-10 rounded-lg border px-4 text-xs font-medium disabled:opacity-40 ${workspaceSecondary(isDark)}`}
          >
            <UploadCloud size={16} /> Upload Deliverables
          </Button>
        </div>

        <div className="p-4">
          {activeFolder && (
            <button
              type="button"
              onClick={() => {
                setActiveFolder(null);
                setSearch("");
              }}
              className={`mb-4 inline-flex items-center gap-2 text-xs ${workspaceMuted(isDark)}`}
            >
              <ArrowLeft size={15} /> Back to folders / {activeFolder.name}
            </button>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[160px] flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]"
              />
              <WorkspaceInput
                isDark={isDark}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search files and folders"
                placeholder="Search"
                className="h-10 pl-10"
              />
            </div>
            <div
              className={`inline-flex h-10 items-center rounded-lg border p-1 ${workspaceSurface(isDark)}`}
            >
              {viewOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  aria-label={option.label}
                  aria-pressed={view === option.value}
                  onClick={() => setView(option.value)}
                  className={`flex h-full items-center rounded-md px-3 ${view === option.value ? "bg-[#E8D1AB] text-black" : workspaceMuted(isDark)}`}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>

          {!activeFolder ? (
            view === "table" ? (
              folderTable
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    : "grid grid-cols-1 gap-3"
                }
              >
                {shownFolders.map(renderFolderCard)}
                {!shownFolders.length && (
                  <p
                    className={`col-span-full py-14 text-center text-sm ${workspaceMuted(isDark)}`}
                  >
                    No folders found.
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-xs ${workspaceSurface(isDark)}`}
              >
                <ShieldCheck size={19} className="shrink-0 text-[#E8D1AB]" />
                <p className={workspaceMuted(isDark)}>
                  {activeFolder.name} is linked and protected. This preview only
                  stores new file metadata.
                </p>
              </div>
              <div
                className={
                  view === "grid"
                    ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    : "space-y-2"
                }
              >
                {shownFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex min-w-0 items-start gap-3 rounded-lg border p-4 ${workspaceSurface(isDark)}`}
                  >
                    <FileIcon size={20} className="shrink-0 text-[#E8D1AB]" />
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className={`mt-1 text-xs ${workspaceMuted(isDark)}`}>
                        {file.size} · Local demo file
                      </p>
                    </div>
                  </div>
                ))}
                {!shownFiles.length && (
                  <p
                    className={`col-span-full rounded-lg py-14 text-center text-sm ${workspaceMuted(isDark)}`}
                  >
                    No uploaded demo files in this folder. Existing project
                    files are not loaded in static mode.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={detailFolder !== null}
        onOpenChange={(open) => {
          if (!open) setDetailFolder(null);
        }}
      >
        <DialogContent
          className={`w-[calc(100vw-24px)] max-w-[450px] gap-0 rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#424242] bg-black text-white" : "border-[#DEDEDE] bg-white text-black"}`}
        >
          <div
            className={`flex items-center justify-between border-b px-5 py-5 ${isDark ? "border-[#343434]" : "border-[#E5E5E5]"}`}
          >
            <DialogTitle className="text-lg font-semibold">
              {detailFolder?.name || "Folder Details"}
            </DialogTitle>
            <button
              type="button"
              aria-label="Close folder details"
              onClick={() => setDetailFolder(null)}
              className={`rounded-full p-2 ${workspaceSecondary(isDark)}`}
            >
              <X size={19} />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Project folder information and access status.
          </DialogDescription>
          <div className="space-y-3 px-5 py-5 text-sm">
            <p>
              <span className={workspaceMuted(isDark)}>Folder: </span>
              {detailFolder?.name}
            </p>
            <p>
              <span className={workspaceMuted(isDark)}>Linked: </span>Yes
            </p>
            <p>
              <span className={workspaceMuted(isDark)}>
                Protected from deletion:{" "}
              </span>
              Yes
            </p>
            <p>
              <span className={workspaceMuted(isDark)}>Total items: </span>
              {detailFolder && folderFileCount(detailFolder)}
            </p>
          </div>
          <div className="px-5 pb-5">
            <Button
              type="button"
              onClick={() => setDetailFolder(null)}
              className={`h-11 w-full rounded-lg ${workspaceAccent}`}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUpload();
        }}
      >
        <DialogContent
          className={`z-[150] grid max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[560px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#444444] bg-black text-white" : "border-[#DEDEDE] bg-white text-black"}`}
        >
          <header
            className={`flex shrink-0 items-center justify-between border-b p-5 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}
          >
            <DialogTitle className="text-xl font-semibold">
              Upload Deliverables
            </DialogTitle>
            <button
              type="button"
              aria-label="Close upload"
              disabled={isUploading}
              onClick={closeUpload}
              className={`rounded-full p-2 ${workspaceSecondary(isDark)}`}
            >
              <X size={19} />
            </button>
          </header>
          <DialogDescription className="sr-only">
            Choose a file and destination folder to save its metadata in the
            static preview.
          </DialogDescription>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-5">
            <p className={`text-sm ${workspaceMuted(isDark)}`}>
              Choose a destination and file. This preview saves only its name
              and size in the browser tab.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Destination Folder</p>
              <WorkspaceSelect
                label="Destination folder"
                value={targetFolder}
                onValueChange={setTargetFolder}
                options={WORKSPACE_FOLDERS.filter((folder) =>
                  ["post", "versions"].includes(folder.id),
                ).map((folder) => ({ value: folder.id, label: folder.name }))}
                isDark={isDark}
                triggerClassName="h-11"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-4 ${workspaceSecondary(isDark)}`}
            >
              <UploadCloud size={25} />
              <span className="mt-2 max-w-full break-all text-sm">
                {selectedFile?.name || "Choose a deliverable"}
              </span>
              {selectedFile && (
                <span className="mt-1 text-xs">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Choose deliverable file"
              className="sr-only"
              onChange={(event) =>
                setSelectedFile(event.currentTarget.files?.[0] || null)
              }
            />
          </div>
          <footer
            className={`grid shrink-0 grid-cols-2 gap-3 border-t p-5 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}
          >
            <Button
              type="button"
              disabled={isUploading}
              onClick={closeUpload}
              className={`h-11 rounded-lg ${workspaceSecondary(isDark)}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={() => void handleSaveUpload()}
              className={`h-11 rounded-lg ${workspaceAccent}`}
            >
              {isUploading ? "Saving..." : "Save Demo File"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}
