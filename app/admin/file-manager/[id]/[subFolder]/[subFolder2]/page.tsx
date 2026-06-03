"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useViewMode } from "@/hooks/useViewMode";

import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Link as LinkIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckSquare,
  X as CloseIcon,
  Download as DownloadIcon,
  Trash2 as TrashIcon
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import DeleteConfirmModal from "@/components/admin/file-manager/DeleteConfirmModal";
import ShareResourceModal from "@/components/admin/file-manager/ShareResourceModal";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { FileCard } from "@/components/admin/file-manager/FileCard";
import { FileManagerBoard } from "@/components/admin/file-manager/FileManagerBoard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import Topbar from "@/components/admin/Topbar";
import {
  fileManagerApi,
  getDisplayInitials,
  mapExternalFilesToUi,
  slugToWorkspaceName,
} from "@/lib/fileManagerApi";
import { toast } from "sonner";

const defaultImgSrc = "/images/misc/Data.png";
const STATUSES = ["Linked", "Unlinked"];
const FILES_PAGE_SIZE = 20;
const ADMIN_FILE_MANAGER_VIEW_MODE_KEY = "admin-file-manager-view-mode";
const FILE_BOARD_ORDER = ["image", "video", "pdf", "doc", "ppt", "sheet", "zip", "file"];
const FILE_BOARD_TITLES: Record<string, string> = {
  image: "Images",
  video: "Videos",
  pdf: "PDFs",
  doc: "Documents",
  ppt: "Presentations",
  sheet: "Sheets",
  zip: "Archives",
  file: "Other Files",
};

type AdminUiFile = {
  id: string;
  title: string;
  filepath?: string;
  contentType?: string;
  label?: string;
  size?: number;
  fileSizeBytes?: number;
  updatedAt?: string;
  lastOpened?: string;
  userInitials?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accentClass?: string;
  badgeClass?: string;
};

type RevisionFolderMeta = {
  name?: string;
  fileCount?: number;
  [key: string]: unknown;
};

const tryDecodeURIComponent = (value: string) => {
  const normalizedValue = String(value || "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalizedValue);
  } catch {
    return normalizedValue;
  }
};

const normalizeRelativeFolderPath = (value: string, phaseSlug: string) => {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();
  if (!normalized) return "";

  const segments = normalized.split("/").filter(Boolean);
  const phaseSegment = phaseSlug === "post-production" ? "post-production" : "pre-production";
  const phaseIndex = segments.findIndex((segment) => String(segment || "").trim().toLowerCase() === phaseSegment);
  if (phaseIndex >= 0) {
    return segments.slice(phaseIndex + 1).join("/");
  }

  return normalized;
};

const normalizePathToken = (value?: string) =>
  String(value || "").toLowerCase().replace(/[\s_-]+/g, "");

const isSelectedForEditsPath = (path?: string) =>
  normalizePathToken(path) === "editedfootage/selectedforedits" ||
  normalizePathToken(path) === "editedfootages/selectedforedits";

const isFinalDeliverablesPath = (path?: string) =>
  normalizePathToken(path) === "finaldeliverables";

const isVersionFolderName = (name?: string) =>
  /^v(?:ersion)?[\s_-]*\d+$/i.test(String(name || "").trim());

const getFinalDeliverablesVersionPath = (folder: { name?: string; path?: string }) => {
  const normalizedPath = String(folder?.path || "").replace(/\\/g, "/");
  const finalDeliverablesMatch = normalizedPath.match(/(?:^|\/)(Final Deliverables\/.+)$/i);
  if (finalDeliverablesMatch?.[1]) return finalDeliverablesMatch[1];
  return `Final Deliverables/${folder.name || ""}`;
};

const formatShortDateTime = (value?: string) => {
  if (!value) return "10 Jan, 2026 - 10:00 AM";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "10 Jan, 2026 - 10:00 AM";
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatFileSize = (size?: number) => {
  if (!size || Number.isNaN(size)) return "4.5 MB";
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const isPreviewableFile = (file: any) => {
  const extension = getFileExtension(file?.title || file?.name);
  const contentType = String(file?.contentType || "");
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif", "mp4", "mov", "avi", "mkv", "webm"].includes(extension) ||
    file?.label === "image" ||
    file?.label === "video"
  );
};

const getFileMeta = (file: any) => {
  const extension = getFileExtension(file?.title);
  const contentType = file?.contentType || "";

  if (contentType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }
  if (contentType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]", badgeClass: "bg-[#E8D1AB]/15" };
  }
  if (contentType === "application/pdf" || extension === "pdf") {
    return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]", badgeClass: "bg-[#F04438]/15" };
  }
  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]", badgeClass: "bg-[#3B82F6]/15" };
  }
  if (["ppt", "pptx", "key"].includes(extension)) {
    return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]", badgeClass: "bg-[#F97316]/15" };
  }
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]", badgeClass: "bg-[#10B981]/15" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]", badgeClass: "bg-[#A855F7]/15" };
  }
  return { icon: FileText, label: extension || "file", accentClass: "text-white/80", badgeClass: "bg-white/10" };
};

export default function SubFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string; subFolder: string; subFolder2: string }>();
  const projectId = params.id;
  const phaseSlug = params.subFolder;
  const nestedSlug = params.subFolder2;
  const editView = searchParams.get("editView") || "";
  const isEditedFootageRoot = phaseSlug === "post-production" && nestedSlug === "edited-footage" && !editView;
  const isSelectedForEditsView = editView === "selected-for-edits";
  const isRevisionsView = editView === "revisions";
  const revisionVersionMatch = editView.match(/^revision-version-(\d+)$/);
  const activeRevisionVersion = revisionVersionMatch ? Number(revisionVersionMatch[1]) : 1;
  const isRevisionVersionView = Boolean(revisionVersionMatch);
  const canUpload = true;
  const canDelete = phaseSlug !== "post-production";
  const folderPath = useMemo(() => {
    const queryPath = searchParams.get("path");
    const rawPath = queryPath ? tryDecodeURIComponent(queryPath).trim() : slugToWorkspaceName(nestedSlug);
    return normalizeRelativeFolderPath(rawPath, phaseSlug);
  }, [nestedSlug, phaseSlug, searchParams]);
  const folderName = useMemo(() => {
    const queryName = searchParams.get("name");
    if (queryName) return tryDecodeURIComponent(queryName).trim();
    const fallbackFromPath = folderPath.split("/").filter(Boolean).pop();
    return fallbackFromPath || slugToWorkspaceName(nestedSlug);
  }, [folderPath, nestedSlug, searchParams]);
  const activeFolderPath = useMemo(() => {
    if (phaseSlug === "post-production" && nestedSlug === "edited-footage") {
      if (isSelectedForEditsView) return "Edited Footage/Selected for Edits";
      if (isRevisionsView) return "Edited Footage/Revisions";
      if (isRevisionVersionView) {
        return activeRevisionVersion <= 1 ? "Edited Footage" : `Edited Footage/V${activeRevisionVersion}`;
      }
    }

    return folderPath;
  }, [activeRevisionVersion, folderPath, isRevisionVersionView, isRevisionsView, isSelectedForEditsView, nestedSlug, phaseSlug]);
  const activeRevisionUploadVersion = useMemo(() => {
    if (phaseSlug !== "post-production") return null;
    const isEditedFootageVersionPath = /(?:^|\/)Edited Footages?\/V\d+$/i.test(activeFolderPath);
    if (nestedSlug !== "edited-footage" && !isEditedFootageVersionPath) return null;
    if (isRevisionVersionView) return activeRevisionVersion;

    const versionPathMatch = activeFolderPath.match(/(?:^|\/)V(\d+)$/i);
    if (versionPathMatch) return Number(versionPathMatch[1]);

    const versionNameMatch = folderName.match(/^V(?:ersion\s*)?(\d+)$/i);
    if (versionNameMatch) return Number(versionNameMatch[1]);

    return null;
  }, [activeFolderPath, activeRevisionVersion, folderName, isRevisionVersionView, nestedSlug, phaseSlug]);
  const canUploadRevisionFromCurrentView = activeRevisionUploadVersion != null;

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspaceConsoleUrl, setWorkspaceConsoleUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [revisionFolders, setRevisionFolders] = useState<RevisionFolderMeta[]>([]);
  const [selectedForEditsCount, setSelectedForEditsCount] = useState(0);
  const [revisionVersionCounts, setRevisionVersionCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode(ADMIN_FILE_MANAGER_VIEW_MODE_KEY);

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPathOverride, setUploadPathOverride] = useState<string | null>(null);
  const [uploadFolderNameOverride, setUploadFolderNameOverride] = useState<string | null>(null);
  const [uploadTargetEditView, setUploadTargetEditView] = useState<string | null>(null);
  const [newVersionComment, setNewVersionComment] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(FILES_PAGE_SIZE);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    resourceType: "workspace" | "folder" | "file";
    externalId: string;
    phase?: string;
    path?: string;
    filepath?: string;
    label?: string;
  } | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const phase = phaseSlug === "post-production" ? "post" : "pre";
      const candidatePaths =
        phaseSlug === "post-production" && nestedSlug === "raw-footage"
          ? Array.from(new Set([activeFolderPath, "Raw Footages", "Raw Footage"].filter(Boolean)))
          : phaseSlug === "post-production" && isSelectedForEditsPath(activeFolderPath)
            ? Array.from(
                new Set(
                  [
                    activeFolderPath,
                    "Edited Footage/Selected for Edits",
                    "Edited Footages/Selected for Edits",
                    "Edited Footage/Selected For Edits",
                    "Edited Footages/Selected For Edits",
                    "Selected for Edits",
                    "Selected For Edits",
                    "Edited Footage",
                    "Edited Footages",
                  ].filter(Boolean)
                )
              )
          : isRevisionVersionView && activeRevisionVersion <= 1
            ? Array.from(new Set(["Edited Footage", "Edited Footages"].filter(Boolean)))
            : isRevisionVersionView
              ? Array.from(
                  new Set(
                    [
                      activeFolderPath,
                      `Edited Footage/V${activeRevisionVersion}`,
                      `Edited Footages/V${activeRevisionVersion}`,
                    ].filter(Boolean)
                  )
                )
              : [activeFolderPath];

      let workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
        projectId,
        phase,
        candidatePaths[0]
      );

      for (const candidatePath of candidatePaths.slice(1)) {
        if ((workspaceData.files || []).length > 0) break;
        workspaceData = await fileManagerApi.getExternalWorkspaceFiles(
          projectId,
          phase,
          candidatePath
        );
      }

      setWorkspaceName(workspaceData.workspace.folderName);
      setWorkspaceCode(workspaceData.workspace.externalId);
      setWorkspaceConsoleUrl(workspaceData.workspace.consoleUrl || null);
      let nextFiles = workspaceData.files || [];
      let nextFolders = workspaceData.folders || [];

      if (phaseSlug === "post-production" && isFinalDeliverablesPath(activeFolderPath)) {
        const versionFolders = nextFolders.filter((folder: RevisionFolderMeta) => isVersionFolderName(folder?.name));
        if (versionFolders.length > 0) {
          const versionFileGroups = await Promise.all(
            versionFolders.map((folder: RevisionFolderMeta) =>
              fileManagerApi
                .getExternalWorkspaceFiles(projectId, phase, getFinalDeliverablesVersionPath(folder))
                .then((data) => data.files || [])
                .catch(() => [])
            )
          );
          nextFiles = [...nextFiles, ...versionFileGroups.flat()];
          nextFolders = nextFolders.filter((folder: RevisionFolderMeta) => !isVersionFolderName(folder?.name));
        }
      }

      setFiles(nextFiles);
      setRevisionFolders(nextFolders);

      if (phaseSlug === "post-production" && nestedSlug === "edited-footage") {
        const [selectedData, revisionRootData] = await Promise.all([
          fileManagerApi.getExternalWorkspaceFiles(projectId, phase, "Edited Footage/Selected for Edits").catch(() => null),
          fileManagerApi.getExternalWorkspaceFiles(projectId, phase, "Edited Footage").catch(() => null),
        ]);

        setSelectedForEditsCount(selectedData?.files?.length || revisionRootData?.files?.length || 0);

        const nextVersionCounts: Record<number, number> = {
          1: revisionRootData?.files?.length || 0,
        };
        const versionFolders = ((revisionRootData?.folders || []) as RevisionFolderMeta[]).filter((folder) =>
          /^V\d+$/i.test(String(folder?.name || ""))
        );
        const versionCountEntries = await Promise.all(
          versionFolders.map(async (folder) => {
            const version = Number(String(folder.name).replace(/\D/g, ""));
            if (version <= 1) return null;
            const versionData = await fileManagerApi
              .getExternalWorkspaceFiles(projectId, phase, `Edited Footage/V${version}`)
              .catch(() => null);
            return [version, versionData?.files?.length ?? Number(folder.fileCount || 0)] as const;
          })
        );
        versionCountEntries.forEach((entry) => {
          if (!entry) return;
          const [version, count] = entry;
          nextVersionCounts[version] = count;
        });
        if (isRevisionVersionView && activeRevisionVersion > 1 && nextVersionCounts[activeRevisionVersion] === undefined) {
          nextVersionCounts[activeRevisionVersion] = workspaceData.files?.length || 0;
        }
        versionFolders.forEach((folder) => {
          const version = Number(String(folder.name).replace(/\D/g, ""));
          if (version > 1 && nextVersionCounts[version] === undefined) {
            nextVersionCounts[version] = Number(folder.fileCount || 0);
          }
        });
        setRevisionVersionCounts(nextVersionCounts);
        if (isRevisionsView || isEditedFootageRoot) {
          setRevisionFolders(versionFolders);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadFiles();
    };

    if (projectId) load();
    return () => {
      mounted = false;
    };
  }, [activeFolderPath, activeRevisionVersion, isEditedFootageRoot, isRevisionVersionView, isRevisionsView, phaseSlug, projectId]);

  const folderTitle = useMemo(() => {
    if (isSelectedForEditsView) return "Selected for Edits";
    if (isRevisionsView) return "Revision";
    if (isRevisionVersionView) return `Revision Version ${activeRevisionVersion}`;
    if (nestedSlug === "raw-footage") return "Raw Footages";
    if (nestedSlug === "edited-footage") return "Edited Footages";
    if (nestedSlug === "final-deliverables") return "Final Deliverables";
    return folderName || "Files";
  }, [activeRevisionVersion, folderName, isRevisionVersionView, isRevisionsView, isSelectedForEditsView, nestedSlug]);

  const folderFiles = useMemo(() => {
    return mapExternalFilesToUi(files).map((file) => ({
      ...file,
     ...getFileMeta(file),
      src: defaultImgSrc,
    }));
  }, [files]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return folderFiles;
    const query = searchTerm.toLowerCase();
    return folderFiles.filter((item) => item.title.toLowerCase().includes(query));
  }, [folderFiles, searchTerm]);
  const visibleFiles = useMemo(
    () => filteredData.slice(0, visibleFileCount),
    [filteredData, visibleFileCount]
  );
  const hasMoreFiles = filteredData.length > visibleFileCount;
  const allVisibleFilesSelected = useMemo(
    () =>
      visibleFiles.length > 0 &&
      visibleFiles.every((file) => selectedFilePaths.includes(file.filepath || "")),
    [selectedFilePaths, visibleFiles]
  );
  const revisionVersions = useMemo(() => {
    const versions = new Set<number>([1]);
    Object.keys(revisionVersionCounts).forEach((version) => versions.add(Number(version)));
    revisionFolders.forEach((folder) => {
      const match = String(folder?.name || "").match(/^V(\d+)$/i);
      if (match) versions.add(Number(match[1]));
    });
    if (activeRevisionVersion > 1) versions.add(activeRevisionVersion);
    return Array.from(versions).filter((version) => Number.isFinite(version) && version > 0).sort((a, b) => a - b);
  }, [activeRevisionVersion, revisionFolders, revisionVersionCounts]);
  const nextRevisionVersion = useMemo(
    () => Math.max(1, ...revisionVersions) + 1,
    [revisionVersions]
  );

  const fileBoardColumns = useMemo(() => {
    const labels = Array.from(new Set(filteredData.map((file) => file.label || "file")));
    const orderedLabels = [
      ...FILE_BOARD_ORDER.filter((label) => labels.includes(label)),
      ...labels.filter((label) => !FILE_BOARD_ORDER.includes(label)),
    ];

    return orderedLabels.map((label) => ({
      id: label,
      title: FILE_BOARD_TITLES[label] || `${String(label).charAt(0).toUpperCase()}${String(label).slice(1)} Files`,
      items: filteredData.filter((file) => (file.label || "file") === label),
    }));
  }, [filteredData]);

  const openEditView = (view: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("editView", view);
    router.push(`${pathname}?${next.toString()}`);
  };

  const openUploadModal = (options?: {
    pathOverride?: string;
    folderNameOverride?: string;
    targetEditView?: string;
  }) => {
    setUploadPathOverride(options?.pathOverride || null);
    setUploadFolderNameOverride(options?.folderNameOverride || null);
    setUploadTargetEditView(options?.targetEditView || null);
    setNewVersionComment("");
    setIsUploadModalOpen(true);
  };

  const ensureRevisionVersionFolder = async (version: number) => {
    if (phaseSlug !== "post-production") return true;
    try {
      await fileManagerApi.createExternalFolder(projectId, `V${version}`, {
        phase: "post",
        path: "Edited Footage",
      });
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to prepare Version ${version} folder`);
      return false;
    }
  };

  const openCreateNewVersionUpload = async () => {
    const version = nextRevisionVersion;
    const folderReady = await ensureRevisionVersionFolder(version);
    if (!folderReady) return;
    openUploadModal({
      pathOverride: `Edited Footage/V${version}`,
      folderNameOverride: `Version ${version}`,
      targetEditView: `revision-version-${version}`,
    });
  };

  const openRevisionUploadFromFile = async (file: AdminUiFile) => {
    if (!canUploadRevisionFromCurrentView || activeRevisionUploadVersion == null) return false;
    if (!isPreviewableFile(file)) return false;

    const targetVersion = activeRevisionUploadVersion + 1;
    const folderReady = await ensureRevisionVersionFolder(targetVersion);
    if (!folderReady) return true;
    setUploadPathOverride(`Edited Footage/V${targetVersion}`);
    setUploadFolderNameOverride(`Version ${targetVersion}`);
    setUploadTargetEditView(`revision-version-${targetVersion}`);
    setNewVersionComment(`Revision upload for ${file.title}`);
    setIsUploadModalOpen(true);
    return true;
  };

  const renderLinkedPanelHeader = (title: string, countLabel: string, action?: React.ReactNode) => (
    <div className="rounded-xl border border-white/10 bg-[#101010] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <FolderOpen className="h-4 w-4 text-[#E8D1AB]" />
          </div>
          <h2 className="text-sm font-semibold text-[#E8D1AB]">
            {title} <span className="text-white">({countLabel})</span>
          </h2>
        </div>
        {action}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-white/15 bg-[#171717] px-4 py-3 text-xs text-white/80">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-[#19437D]">
          <LinkIcon size={15} />
        </span>
        <div>
          <p>Linked to: Corporate Event 2026</p>
          <p className="mt-0.5 flex items-center gap-1 text-white/65">
            <CalendarDays size={12} /> Jan 15, 2024
          </p>
        </div>
      </div>
    </div>
  );

  const renderEditToolbar = (showVersion = false) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-9 w-full rounded-md border border-white/10 bg-[#202020] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/35"
        />
      </div>
      <div className="flex items-center gap-2">
        {showVersion ? (
          <BasicDropdown
            label="Version"
            value={`Version ${activeRevisionVersion}`}
            onChange={(value) => {
              const version = Number(String(value).replace(/\D/g, ""));
              if (version > 0) openEditView(`revision-version-${version}`);
            }}
            options={revisionVersions.map((version) => `Version ${version}`)}
          />
        ) : null}
        <BasicDropdown label="Status" value="" onChange={() => {}} options={STATUSES} />
        <FileManagerViewToggle
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );

  const renderEditFolderTile = (
    title: string,
    fileCount: number,
    onOpen: () => void,
    centered = false
  ) => (
    <button
      type="button"
      onClick={onOpen}
      className="relative min-h-[260px] overflow-hidden rounded-[28px] border border-white/15 bg-[#18181b] text-left shadow-xl transition hover:border-white/25 hover:bg-[#1c1c20]"
    >
      <div className="flex h-full flex-col">
        <div className={`flex flex-1 px-7 py-7 ${centered ? "items-center justify-center text-center" : "items-start justify-between gap-3"}`}>
          {centered ? (
            <div>
              <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
                <Plus size={24} />
              </span>
              <p className="text-base font-semibold text-[#E8D1AB]">{title}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <FolderOpen className="mt-0.5 h-7 w-7 fill-[#E8D1AB]/20 text-[#E8D1AB]" />
                <div>
                  <p className="text-lg font-semibold text-white">{title}</p>
                  <p className="mt-2 text-lg text-[#E8D1AB]">
                    {String(fileCount).padStart(2, "0")} Files
                  </p>
                </div>
              </div>
              <MoreVertical className="h-6 w-6 text-white/70" />
              <div className="absolute mt-24 flex gap-3">
                <span className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">Folder</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#D4FFE4] px-4 py-2 text-sm font-medium text-[#16A34A]">
                  <LinkIcon size={16} />
                  Linked
                </span>
              </div>
            </>
          )}
        </div>
        {!centered ? (
          <div className="flex items-center gap-5 border-t border-white/20 px-7 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8E1FF] text-lg font-medium text-black">
              {getDisplayInitials(title)}
            </div>
            <div className="min-w-0 text-lg">
              <p className="truncate text-white/90">Updated 3 mins ago</p>
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );

  const renderEditFileCard = (file: AdminUiFile) => (
    <div
      key={file.id}
      onClick={() => handleOpenFile(file)}
      className={`group overflow-hidden rounded-lg border bg-[#171717] outline-none transition hover:border-white/25 cursor-pointer ${
        selectedFilePaths.includes(file.filepath || "") ? "border-[#22C55E] ring-1 ring-[#22C55E]/40" : "border-white/10"
      }`}
    >
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-white/20" />
            <span>ID : #12345</span>
          </div>
          <span>{formatFileSize(file.size ?? file.fileSizeBytes)}</span>
        </div>
        <div className="flex aspect-[1.15] items-center justify-center overflow-hidden rounded bg-[#232323]">
          {previewUrls[file.id] && file.label === "image" ? (
            <img src={previewUrls[file.id]} alt={file.title} className="h-full w-full object-cover" />
          ) : previewUrls[file.id] && file.label === "video" ? (
            <video src={previewUrls[file.id]} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <Download className="h-12 w-12 rounded-2xl bg-white/40 p-3 text-white" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-white">
            {file.title}{isRevisionVersionView ? ` - V${activeRevisionVersion}` : " - RAW_V1"}
          </p>
          <span className="rounded border border-white/10 bg-[#252525] px-2 py-0.5 text-[10px] text-[#32D174]">
            V{isRevisionVersionView ? activeRevisionVersion : 1} Latest
          </span>
        </div>
        <span className="mt-2 inline-flex rounded-full bg-[#6F2DBD]/35 px-2 py-1 text-[10px] text-[#D8B4FE]">
          {isRevisionVersionView ? `Revision V${activeRevisionVersion}` : "File Selected For Edits"}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8E1FF] text-xs font-semibold text-black">
            {file.userInitials || getDisplayInitials(workspaceName)}
          </div>
          <div className="text-xs">
            <p className="text-white/80">Uploaded by {workspaceName || "Unknown"}</p>
            <p className="text-[10px] text-white/45">{formatShortDateTime(file.updatedAt || file.lastOpened)}</p>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 text-white/70" />
      </div>
    </div>
  );

  const renderEditedFootageVirtualView = () => {
    if (isEditedFootageRoot) {
      const revisionFilesCount = Object.values(revisionVersionCounts).reduce((sum, count) => sum + Number(count || 0), 0);
      return (
        <div className="space-y-5">
          {renderLinkedPanelHeader("Edits", "2 Folders")}
          {renderEditToolbar()}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {renderEditFolderTile("Selected for Edits", selectedForEditsCount, () => openEditView("selected-for-edits"))}
            {renderEditFolderTile("Revisions", revisionFilesCount, () => openEditView("revisions"))}
          </div>
        </div>
      );
    }

    if (isRevisionsView) {
      const availableVersions = revisionVersions.length ? revisionVersions : [1];
      return (
        <div className="space-y-5">
          {renderLinkedPanelHeader("Revision", `${availableVersions.length} Folder${availableVersions.length === 1 ? "" : "s"}`)}
          {renderEditToolbar(true)}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {availableVersions.map((version) => (
              <React.Fragment key={`revision-version-${version}`}>
                {renderEditFolderTile(
                  `Version ${version}`,
                  revisionVersionCounts[version] || 0,
                  () => openEditView(`revision-version-${version}`)
                )}
              </React.Fragment>
            ))}
            <React.Fragment key="revision-create-new-version">
              {renderEditFolderTile("Create New Version", 0, openCreateNewVersionUpload, true)}
            </React.Fragment>
          </div>
        </div>
      );
    }

    if (isSelectedForEditsView || isRevisionVersionView) {
      const title = isRevisionVersionView ? `Revision Version ${activeRevisionVersion}` : "Selected for Edits";
      return (
        <div className="space-y-5">
          {renderLinkedPanelHeader(
            title,
            `${filteredData.length} Files`,
            null
          )}
          {renderEditToolbar(isRevisionVersionView)}
          {filteredData.length === 0 ? (
            <EmptyFileState actionLabel={undefined} />
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {visibleFiles.map((file) => renderEditFileCard(file as AdminUiFile))}
            </div>
          )}
          {hasMoreFiles ? (
            <div className="flex justify-center">
              <Button
                type="button"
                className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
              >
                View More
              </Button>
            </div>
          ) : null}
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    setVisibleFileCount(FILES_PAGE_SIZE);
  }, [activeFolderPath, phaseSlug, projectId, searchTerm, folderFiles.length]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  }, [activeFolderPath, phaseSlug, projectId]);

  useEffect(() => {
    const previewableFiles = visibleFiles.filter(
      (file: any) => file.filepath && isPreviewableFile(file)
    );
    if (!previewableFiles.length) return;

    let active = true;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        previewableFiles.map(async (file: any) => {
          try {
            const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
            return [file.id, result.url] as const;
          } catch {
            return [file.id, ""] as const;
          }
        })
      );

      if (!active) return;
      setPreviewUrls((prev) => ({
        ...prev,
        ...Object.fromEntries(entries.filter(([, url]) => !!url)),
      }));
    };

    loadPreviews();
    return () => {
      active = false;
    };
  }, [visibleFiles]);

  const handleOpenFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      setOpeningFileId(file.id);
      const result = await fileManagerApi.getExternalFileViewUrl(file.filepath);
      if (result?.url) {
        setViewerFile(file);
        setViewerUrl(result.url);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!file?.filepath) return;
    try {
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      if (result?.url) {
        const link = document.createElement("a");
        link.href = result.url;
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download file");
    }
  };

  const triggerBatchFileDownload = (url: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      iframe.remove();
    }, 5000);
  };

  const handleDeleteFile = async (file: any) => {
    if (!canDelete) return;
    const targetFile = file || selectedFile;
    if (!targetFile?.filepath) return;

    try {
      setIsDeleting(true);
      await fileManagerApi.deleteExternalEntry(targetFile.filepath);
      toast.success("File deleted");
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFileSelection = (filepath: string) => {
    setSelectedFilePaths(prev => 
      prev.includes(filepath) 
        ? prev.filter(p => p !== filepath) 
        : [...prev, filepath]
    );
  };

  const handleBatchDownload = async () => {
    if (selectedFilePaths.length === 0) return;
    toast.info(`Starting download for ${selectedFilePaths.length} files...`);
    for (const path of selectedFilePaths) {
      try {
        const result = await fileManagerApi.getExternalFileDownloadUrl(path);
        if (result?.url) {
          triggerBatchFileDownload(result.url);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to download file");
      }
      await new Promise(r => setTimeout(r, 300));
    }
    setSelectedFilePaths([]);
    setIsSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedFilePaths.length === 0) return;
    if (!canDelete) return;

    try {
      setIsDeleting(true);
      let count = 0;
      for (const path of selectedFilePaths) {
        await fileManagerApi.deleteExternalEntry(path);
        count++;
      }
      toast.success(`Deleted ${count} file(s)`);
      setSelectedFilePaths([]);
      setIsSelectionMode(false);
      setIsDeleteModalOpen(false);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete files");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          canUpload ? (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#202020] border border-white/20 text-white hover:bg-white/10"
            >
              <Upload size={18} />
              Upload Files
            </Button>
          ) : null
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 bg-[#101010]">
        <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {loading ? (
<div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 border-[#3D3D3D] bg-[#171717]" 
        }`}>
        <Loader2 className={`animate-spin text-[#BFA780]`} size={40} />
      </div>        
      ) : error ? (
          <div className="text-red-300 text-sm">{error || "Folder not found"}</div>
        ) : (
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <div className="bg-[#101010] flex flex-col gap-5 p-5 border-b border-b-[#3D3D3D] rounded-2xl">
              <div className="flex flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="bg-[#1A1A1A] flex h-12 w-12 items-center justify-center rounded-full shrink-0">
                    <span className="text-white text-xl font-semibold">{getDisplayInitials(workspaceName)}</span>
                  </div>
                  <h1 className="text-base text-[#E8D1AB] font-semibold">
                    {folderTitle} ({filteredData.length} Items)
                  </h1>
                </div>
              </div>

              <div className="bg-[#171717] border border-white/20 rounded-lg p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 ">
                <div>
                  <p className="text-sm lg:text-base">Project: {workspaceName}</p>
                  <p className="text-xs lg:text-base text-white/60 mt-0.5">Project Code: {workspaceCode}</p>
                  {/* {workspaceConsoleUrl ? (
                    <a
                      href={workspaceConsoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs text-[#E8D1AB] underline underline-offset-4"
                    >
                      Open Storage Folder
                    </a>
                  ) : null} */}
                </div>
                {/* <Button
                  onClick={() => setIsLinkModalOpen(true)}
                  variant="link"
                  className="text-sm lg:text-base text-white font-medium underline underline-offset-4 hover:text-[#E8D1AB] p-0 h-auto"
                >
                  Change Shoot
                </Button> */}
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-row items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 ">
                   {filteredData.length > 0 && (
                     <Button
                        variant="ghost"
                      onClick={() => {
                          const next = !isSelectionMode;
                          setIsSelectionMode(next);
                          if (!next) setSelectedFilePaths([]);
                      }}
                        className={`gap-2 h-10 px-4 rounded-lg border transition-all ${
                          isSelectionMode 
                            ? 'bg-[#E8D1AB] text-black border-[#E8D1AB] hover:bg-[#E8D1AB]/90' 
                            : 'bg-[#202020] text-white/70 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <CheckSquare size={18} />
                        <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
                      </Button>
                   )}
                  {/* <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} /> */}
                  <FileManagerViewToggle
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                  />
                </div>
              </div>

              {isEditedFootageRoot || isSelectedForEditsView || isRevisionsView || isRevisionVersionView ? (
                renderEditedFootageVirtualView()
              ) : viewMode === "board" ? (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <FileManagerBoard
                    columns={fileBoardColumns}
                    emptyMessage="No files in this column"
                    getItemId={(file) => String(file.id)}
                    renderCard={(file) => (
                      <FileCard
                        file={{ ...file, previewUrl: previewUrls[file.id] }}
                        onOpen={() => handleOpenFile(file)}
                        onDownload={() => handleDownloadFile(file)}
                        onDelete={() => {
                          if (!canDelete) return;
                          setSelectedFile(file);
                          setIsDeleteModalOpen(true);
                        }}
                        onShare={() => {
                          setSelectedFile(file);
                          setShareResource({
                            resourceType: "file",
                            externalId: String(projectId || ""),
                            phase: phaseSlug === "post-production" ? "post" : "pre",
                            filepath: file.filepath,
                            label: file.title,
                          });
                          setIsShareModalOpen(true);
                        }}
                        isSelected={isSelectionMode && selectedFilePaths.includes(file.filepath || "")}
                        onSelect={isSelectionMode ? () => toggleFileSelection(file.filepath || "") : undefined}
                      />
                    )}
                  />
                )
              ) : viewMode === "grid" ? (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {visibleFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`bg-[#111111] border rounded-xl p-4 lg:p-[19px] hover:border-white/20 transition-all group relative cursor-pointer ${
                            (isSelectionMode && selectedFilePaths.includes(file.filepath || "")) ? 'border-[#E8D1AB] ring-1 ring-[#E8D1AB]/50' : 'border-white/10'
                          }`}
                          onClick={() => handleOpenFile(file)}
                        >
                          {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                checked={selectedFilePaths.includes(file.filepath || "")}
                                onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                                className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                />
                            </div>
                          )}
                          <div className={`flex items-center justify-between mb-3 ${isSelectionMode ? 'ml-7' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <file.icon size={16} className={`${file.accentClass} shrink-0`} />
                              <span className="truncate text-sm lg:text-base text-white">{file.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="text-white/70 hover:text-white" onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}>
                                <Download size={16} />
                              </button>
                              <button className="text-white/70 hover:text-[#E8D1AB]" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setShareResource({
                                  resourceType: "file",
                                  externalId: String(projectId || ""),
                                  phase: phaseSlug === "post-production" ? "post" : "pre",
                                  filepath: file.filepath,
                                  label: file.title,
                                });
                                setIsShareModalOpen(true);
                              }}>
                                Share
                              </button>
                              <button className="text-white/70 hover:text-[#F04438]" onClick={(e) => {
                                e.stopPropagation();
                                if (!canDelete) return;
                                setSelectedFile(file);
                                setIsDeleteModalOpen(true);
                              }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="aspect-square bg-[#1A1A1A] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                            {file.label === "image" && previewUrls[file.id] ? (
                              <img
                                src={previewUrls[file.id]}
                                alt={file.title || "Preview"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : 
                            file.label === "video" && previewUrls[file.id] ? (
                              <div className="relative h-full w-full">
                                <video
                                  src={previewUrls[file.id]}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                                    <Play size={18} className="ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${file.badgeClass}`}>
                                <file.icon 
                                  className={`${file.accentClass} opacity-80 group-hover:scale-110 transition-transform`} 
                                  size={48} 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreFiles ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                          onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                        >
                          View More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                filteredData.length === 0 ? (
                  <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                      <thead className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal cursor-pointer">
                        <tr>
                          {isSelectionMode && (
                            <th className="rounded-l-xl py-5 px-6 font-medium w-10">
                                <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                    checked={visibleFiles.length > 0 && visibleFiles.every(f => selectedFilePaths.includes(f.filepath || ""))}
                                    onCheckedChange={(checked: boolean | "indeterminate") => {
                                    if (checked === true) {
                                        const allVisible = visibleFiles.map(f => f.filepath || "").filter(Boolean);
                                        setSelectedFilePaths(prev => Array.from(new Set([...prev, ...allVisible])));
                                    } else {
                                        const allVisible = visibleFiles.map(f => f.filepath || "");
                                        setSelectedFilePaths(prev => prev.filter(p => !allVisible.includes(p)));
                                    }
                                    }}
                                    className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                />
                                </div>
                            </th>
                          )}
                          <th className={`${!isSelectionMode ? 'rounded-l-xl' : ''} py-5 px-6 font-medium`}>File title</th>
                          <th className="py-5 px-6 font-medium">Type</th>
                          <th className="py-5 px-6 font-medium">Last Opened</th>
                          <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFiles.map((file) => (
                          <tr
                            key={file.id}
                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${(isSelectionMode && selectedFilePaths.includes(file.filepath || "")) ? 'bg-white/[0.04]' : ''}`}
                            onClick={() => handleOpenFile(file)}
                          >
                            {isSelectionMode && (
                                <td className="py-5 px-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                    checked={selectedFilePaths.includes(file.filepath || "")}
                                    onCheckedChange={() => toggleFileSelection(file.filepath || "")}
                                    className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
                                />
                                </td>
                            )}
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-white/5 bg-[#1A1A1A] flex items-center justify-center">
                                  {file.label === "image" && previewUrls[file.id] ? (
                                    <img
                                      src={previewUrls[file.id]}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className={`flex h-full w-full items-center justify-center ${file.badgeClass}`}>
                                      <file.icon className={file.accentClass} size={20} />
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium text-white truncate max-w-[200px]">{file.title}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-white/60 capitalize">
                               {file.label}
                              </div>
                            </td>
                            <td className="py-5 px-6 whitespace-nowrap text-white/40 italic text-xs">{file.lastOpened}</td>
                            <td className="py-5 px-6 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(file);
                                }}>
                                  <Download size={16} />
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-[#E8D1AB] transition-colors" onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(file);
                                  setShareResource({
                                    resourceType: "file",
                                    externalId: String(projectId || ""),
                                    phase: phaseSlug === "post-production" ? "post" : "pre",
                                    filepath: file.filepath,
                                    label: file.title,
                                  });
                                  setIsShareModalOpen(true);
                                }}>
                                  Share
                                </button>
                                <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-[#F04438] transition-colors" onClick={(e) => {
                                  e.stopPropagation();
                                  if (!canDelete) return;
                                  setSelectedFile(file);
                                  setIsDeleteModalOpen(true);
                                }}>
                                  {openingFileId === file.id ? <span className="text-[10px]">...</span> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    {hasMoreFiles ? (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          className="border border-white/20 bg-[#202020] text-white hover:bg-white/10"
                          onClick={() => setVisibleFileCount((prev) => prev + FILES_PAGE_SIZE)}
                        >
                          View More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadPathOverride(null);
            setUploadFolderNameOverride(null);
            setUploadTargetEditView(null);
            setNewVersionComment("");
          }}
          folderName={uploadFolderNameOverride || folderTitle}
          requireVersionComment={Boolean(uploadTargetEditView)}
          versionComment={newVersionComment}
          onVersionCommentChange={setNewVersionComment}
          uploadPath={
            workspaceName
              ? `${workspaceName}/${phaseSlug === "post-production" ? "Post-Production" : "Pre-Production"}/${uploadPathOverride || activeFolderPath}`
              : undefined
          }
          onUploadComplete={async () => {
            await loadFiles();
            if (uploadTargetEditView) {
              toast.success(`${uploadFolderNameOverride || "New version"} created`);
              openEditView(uploadTargetEditView);
            }
            setUploadPathOverride(null);
            setUploadFolderNameOverride(null);
            setUploadTargetEditView(null);
            setNewVersionComment("");
          }}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (selectedFilePaths.length > 0) {
              handleBatchDelete();
            } else {
              handleDeleteFile(selectedFile);
            }
          }}
          itemName={selectedFilePaths.length > 0 ? `${selectedFilePaths.length} selected files` : selectedFile?.title || "this file"}
          itemType="file"
          isDeleting={isDeleting}
        />

        <FileViewerModal
          isOpen={!!viewerFile}
          onClose={() => {
            setViewerFile(null);
            setViewerUrl(null);
          }}
          fileName={viewerFile?.title}
          fileUrl={viewerUrl}
          contentType={viewerFile?.contentType}
          fileMetaId={viewerFile?.filepath || null}
          uploadAction={
            viewerFile &&
            canUploadRevisionFromCurrentView &&
            isPreviewableFile(viewerFile)
              ? {
                  label: "Upload Files",
                  onClick: async () => {
                    const file = viewerFile;
                    setViewerFile(null);
                    setViewerUrl(null);
                    await openRevisionUploadFromFile(file);
                  },
                }
              : undefined
          }
        />

        <ShareResourceModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareResource(null);
          }}
          resource={shareResource}
        />

        {/* Batch Action Toolbar */}
        {selectedFilePaths.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4">
            <div className="bg-[#171717] border border-[#E8D1AB]/50 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#E8D1AB] text-black h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedFilePaths.length}
                </div>
                <span className="text-white font-medium">Files selected</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  className="text-white/70 hover:text-white gap-2"
                  onClick={() => setSelectedFilePaths([])}
                >
                  Clear
                </Button>
                
                <div className="h-6 w-[1px] bg-white/10 mx-1" />
                
                <Button 
                  className="bg-white/10 text-white hover:bg-white/20 gap-2 border border-white/10"
                  onClick={handleBatchDownload}
                >
                  <DownloadIcon size={18} />
                  Download
                </Button>
                
                {canDelete && (
                  <Button 
                    className="bg-[#F04438] text-white hover:bg-[#F04438]/90 gap-2"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <TrashIcon size={18} />
                    Delete
                  </Button>
                )}
              </div>

              <button 
                onClick={() => setSelectedFilePaths([])}
                className="text-white/40 hover:text-white"
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
