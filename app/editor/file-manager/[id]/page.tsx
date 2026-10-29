"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActivityTimeline,
  BrowserToolbar,
  Checkbox,
  CURRENT_EDITOR,
  DeliverableProgress,
  DUMMY_SHOOT_FOLDER,
  EDITS_SUBFOLDERS,
  EmptyUploadState,
  FileCard,
  FilePreviewDrawer,
  FileSection,
  FolderCard,
  FolderHeader,
  FolderInfoCard,
  fmTheme,
  InfoGridCard,
  ItemsLayout,
  JOHN,
  LatestBadge,
  NextActionBar,
  ProjectTimeline,
  ProjectTimelineDrawer,
  ROOT_FOLDERS,
  SEED_ACTIVITY,
  SegmentedTabs,
  SELECTED_FILES,
  StatusTag,
  SubmitForApprovalModal,
  UploadFilesModal,
  showUploadSuccess,
  type ActivityEntry,
  type EditingStep,
  type FileItem,
  type FileStatus,
  type FolderItem,
  type NextAction,
  type TagTone,
  type ViewMode,
} from "@/components/editor/file-manager"; // adjust path
import SuccessModal from "@/components/admin/finances/SuccessModal";

/**
 * Editor – Folder details (dummy data, no API calls).
 *
 * Tabs: Overview · File Manager · Review Status · Activity
 * File Manager flow:
 *   File Manager → Edits → Selected for Edits (download / start editing)
 *   → Edited Deliverables (upload) → Submit for Approval → success → Review Status
 * Review / revision flow:
 *   Review Status (waiting) → [revision requested] → Edits › Revision → Version N (download)
 *   → Version N+1 (upload) → Submit Revision → success → Review Status (waiting) → [approved]
 * The review outcome (revision requested / approved) comes from the internal team via the API:
 * set reviewStage, revisionCycle and revisionFiles from that response.
 */

type DetailTab = "overview" | "files" | "review" | "activity";
type Screen = "root" | "edits" | "selected" | "deliverables" | "revisions" | "revision_source" | "revision_upload";
type ReviewStage = "none" | "pending" | "revision_requested" | "resubmitted" | "approved";
type UploadTarget = "deliverables" | "revision";

const TABS: { key: DetailTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "files", label: "File Manager" },
  { key: "review", label: "Review Status" },
  { key: "activity", label: "Activity" },
];

const PAGE_CHUNK = 24;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pad2 = (n: number) => String(n).padStart(2, "0");
const humanSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const matches = (q: string, ...fields: (string | undefined)[]) =>
  !q.trim() || fields.join(" ").toLowerCase().includes(q.trim().toLowerCase());

/** "photos" when every file is an image, otherwise "files" */
const nounFor = (files: FileItem[], plural = true) => {
  const word = files.length > 0 && files.every((f) => f.kind === "image") ? "photo" : "file";
  return plural ? `${word}s` : word;
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function EditorFolderDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();
  const t = fmTheme(isDark);

  const shoot = DUMMY_SHOOT_FOLDER;

  /* ---------- navigation ---------- */
  const [tab, setTab] = useState<DetailTab>("overview");
  const [stack, setStack] = useState<Screen[]>(["root"]);
  const screen = stack[stack.length - 1];

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [folderFilter, setFolderFilter] = useState<"all" | "action" | "none">("all");
  const [timelineOpen, setTimelineOpen] = useState(false);

  /* ---------- editing state (dummy) ---------- */
  const [step, setStep] = useState<EditingStep>("not_started");
  const [sourceFiles, setSourceFiles] = useState<FileItem[]>(SELECTED_FILES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_CHUNK);
  const [deliverables, setDeliverables] = useState<FileItem[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<UploadTarget | null>(null);
  const [success, setSuccess] = useState<{ count: number; noun: string; revision: boolean } | null>(null);
  /** Which folder the Upload Files modal is uploading to (null = closed) */
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);

  /* ---------- review / revision state (dummy) ---------- */
  const [reviewStage, setReviewStage] = useState<ReviewStage>("none");
  /** Revision cycle: files to fix live in Version {cycle}, the fixes go to Version {cycle + 1} */
  // set from the review API when the internal team requests a revision
  const [revisionCycle] = useState(0);
  const [revisionFiles, setRevisionFiles] = useState<FileItem[]>([]);
  const [revisionUploads, setRevisionUploads] = useState<FileItem[]>([]);
  const [revisionDownloaded, setRevisionDownloaded] = useState(false);

  /* ---------- activity log ---------- */
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const logActivity = (title: string, tag?: { label: string; tone: TagTone }) =>
    setActivity((a) => [...a, { id: `a-${Date.now()}-${a.length}`, title, at: new Date().toISOString(), tag }]);

  // Fresh search / filters / selection on every screen change
  useEffect(() => {
    setSearch("");
    setFolderFilter("all");
    setSelectedIds(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen, tab]);

  const push = (s: Screen) => setStack((st) => [...st, s]);
  const goBack = () => (stack.length > 1 ? setStack((st) => st.slice(0, -1)) : router.back());
  const goToTab = (next: DetailTab) => {
    setStack(["root"]);
    setTab(next);
  };

  // Revoke object URLs created for uploads when leaving the page
  const urlsRef = useRef<string[]>([]);
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const pendingCount = deliverables.filter((f) => f.status === "ready_for_approval").length;
  const submittedCount = deliverables.filter((f) => f.status === "submitted_for_approval").length;
  const uploadedCount = deliverables.length;

  const revisionRequired = revisionFiles.length;
  const revisionPending = revisionUploads.filter((f) => f.status === "ready_for_approval").length;
  const revisionSubmitted = revisionUploads.filter((f) => f.status !== "ready_for_approval").length;
  const revisionNoun = nounFor(revisionFiles);

  const previewFile = useMemo(
    () => [...sourceFiles, ...deliverables, ...revisionFiles, ...revisionUploads].find((f) => f.id === previewId) ?? null,
    [previewId, sourceFiles, deliverables, revisionFiles, revisionUploads]
  );

  /* ---------- folders (counts follow state) ---------- */
  const editsSubfolders: FolderItem[] = useMemo(
    () =>
      EDITS_SUBFOLDERS.map((f) => {
        if (f.id === "selected") return { ...f, countLabel: `${sourceFiles.length} Items` };
        if (f.id === "deliverables") {
          return {
            ...f,
            countLabel: `${uploadedCount} File${uploadedCount === 1 ? "" : "s"}`,
            callout: pendingCount > 0 ? "Submit for Approval" : submittedCount > 0 || reviewStage !== "none" ? undefined : f.callout,
          };
        }
        if (f.id === "revisions") {
          return {
            ...f,
            countLabel: revisionCycle ? `${pad2(2)} Folders` : "0 Folders",
            callout: reviewStage === "revision_requested" ? "Revision Requested" : undefined,
          };
        }
        return f;
      }),
    [sourceFiles.length, uploadedCount, pendingCount, submittedCount, reviewStage, revisionCycle]
  );

  const revisionVersionFolders: FolderItem[] = useMemo(
    () => [
      {
        id: "revision_source",
        name: `Version ${revisionCycle}`,
        countLabel: `${revisionFiles.length} Items`,
        callout: reviewStage === "revision_requested" ? "Revision Requested" : undefined,
        info: "Files sent back with reviewer feedback",
        uploaded: { by: JOHN, at: revisionFiles[0]?.uploadedAt ?? new Date().toISOString() },
      },
      {
        id: "revision_upload",
        name: `Version ${revisionCycle + 1}`,
        countLabel: `${revisionUploads.length} Items`,
        info: "Upload your revised files here",
        uploaded: { by: CURRENT_EDITOR, at: revisionUploads[0]?.uploadedAt ?? new Date().toISOString() },
      },
    ],
    [revisionCycle, revisionFiles, revisionUploads, reviewStage]
  );

  /* ---------- actions (dummy) ---------- */
  const downloadFiles = (files: FileItem[]) => {
    toast.success(files.length === 1 ? `Downloading ${files[0].name}` : `Downloading ${files.length} files`);
  };

  const shareFile = async (file: FileItem) => {
    const link = `${window.location.origin}${pathname}?file=${file.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast("Couldn't copy the link");
    }
  };

  const addComment = (file: FileItem, text: string) => {
    const comment = { id: `c-${Date.now()}`, author: CURRENT_EDITOR, text, at: new Date().toISOString() };
    const update = (list: FileItem[]) => list.map((f) => (f.id === file.id ? { ...f, comments: [...f.comments, comment] } : f));
    setSourceFiles(update);
    setDeliverables(update);
    setRevisionFiles(update);
    setRevisionUploads(update);
  };

  const openRootFolder = (folder: FolderItem) => {
    if (folder.id === "edits") return push("edits");
    toast(`${folder.name} opens in the shared File Manager`);
  };

  const openEditsFolder = (folder: FolderItem) => {
    if (folder.id === "selected") return push("selected");
    if (folder.id === "deliverables") return push("deliverables");
    if (revisionCycle > 0) return push("revisions");
    toast("No revision requests yet");
  };

  const openRevisionFolder = (folder: FolderItem) => push(folder.id === "revision_source" ? "revision_source" : "revision_upload");

  const startEditing = () => {
    const chosen = selectedIds.size ? sourceFiles.filter((f) => selectedIds.has(f.id)) : sourceFiles;
    downloadFiles(chosen);
    if (step === "not_started") {
      setStep("in_progress");
      logActivity("Editing Started Automatically");
    }
    setSelectedIds(new Set());
    setStack(["root", "edits", "deliverables"]);
  };

  const triggerUpload = (target: UploadTarget) => setUploadTarget(target);

  const handleUpload = (fileList: FileList | File[] | null, target: UploadTarget) => {
    if (!fileList?.length) return;
    const now = new Date().toISOString();
    const isRevision = target === "revision";
    const start = isRevision ? revisionUploads.length : deliverables.length;
    const versionNumber = isRevision ? revisionCycle + 1 : 1;

    const added: FileItem[] = Array.from(fileList).map((file, i) => {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other";
      const url = kind === "other" ? undefined : URL.createObjectURL(file);
      if (url) urlsRef.current.push(url);
      return {
        id: `${isRevision ? `rv${versionNumber}` : "del"}-${Date.now()}-${i}`,
        code: `#${(isRevision ? 32345 : 22345) + start + i}`,
        name: file.name,
        version: `EDIT_V${versionNumber}`,
        versionNumber,
        isLatest: true,
        sizeLabel: humanSize(file.size),
        kind,
        previewUrl: url,
        status: "ready_for_approval",
        uploadedBy: CURRENT_EDITOR,
        uploadedAt: now,
        updatedAt: now,
        comments: [],
        // Revised file N replaces file N of the version sent back → Before / After in the preview
        original: isRevision && revisionFiles[start + i]
          ? { previewUrl: revisionFiles[start + i].previewUrl, kind: revisionFiles[start + i].kind, version: revisionFiles[start + i].version }
          : undefined,
      };
    });

    if (isRevision) setRevisionUploads((d) => [...d, ...added]);
    else setDeliverables((d) => [...d, ...added]);
    if (step === "not_started") setStep("in_progress");
    showUploadSuccess();
  };

  /** Upload Files modal → "Upload File" */
  const uploadFromModal = async (files: File[]) => {
    if (!uploadTarget) return;
    await wait(600); // swap for the real upload request
    handleUpload(files, uploadTarget);
    setUploadTarget(null);
  };

  const submitForApproval = async (notes: string) => {
    await wait(700); // swap for the API call (send `notes`)
    const isRevision = submitMode === "revision";
    const list = isRevision ? revisionUploads : deliverables;
    const pending = list.filter((f) => f.status === "ready_for_approval");
    const markSubmitted = (d: FileItem[]) =>
      d.map((f) =>
        f.status === "ready_for_approval"
          ? { ...f, status: "submitted_for_approval" as FileStatus, revisionNotes: isRevision ? notes || f.revisionNotes : f.revisionNotes }
          : f
      );

    if (isRevision) {
      setRevisionUploads(markSubmitted);
      setReviewStage("resubmitted");
      setStep("resubmitted");
      logActivity(`${pending.length} Revision Files Uploaded to Version ${revisionCycle + 1}`, { label: "Waiting for Approval", tone: "blue" });
    } else {
      setDeliverables(markSubmitted);
      setReviewStage("pending");
      setStep("submitted");
      logActivity(`${pending.length} Edited Files Uploaded`, { label: "Waiting for Approval", tone: "blue" });
    }

    setSubmitMode(null);
    setSuccess({ count: pending.length, noun: nounFor(pending), revision: isRevision });
    return notes;
  };

  const continueRevision = () => {
    const chosen = selectedIds.size ? revisionFiles.filter((f) => selectedIds.has(f.id)) : revisionFiles;
    downloadFiles(chosen);
    if (!revisionDownloaded) {
      setRevisionDownloaded(true);
      logActivity(`${chosen.length} Revision Files Downloaded from Version ${revisionCycle}`);
    }
    setSelectedIds(new Set());
    setStack(["root", "edits", "revisions", "revision_upload"]);
  };

  /* ---------- per-screen data ---------- */
  const filteredRoot = ROOT_FOLDERS.filter((f) => matches(search, f.name, f.tag));
  const filteredEdits = editsSubfolders
    .filter((f) => matches(search, f.name))
    .filter((f) => folderFilter === "all" || (folderFilter === "action" ? !!f.callout : !f.callout));
  const filteredSource = sourceFiles.filter((f) => matches(search, f.name, f.code));
  const filteredDeliverables = deliverables.filter((f) => matches(search, f.name, f.code));
  const filteredRevisionFolders = revisionVersionFolders.filter((f) => matches(search, f.name));
  const filteredRevisionFiles = revisionFiles.filter((f) => matches(search, f.name, f.code));
  const filteredRevisionUploads = revisionUploads.filter((f) => matches(search, f.name, f.code));

  // Review tab shows the latest batch under review
  const reviewFiles: FileItem[] =
    reviewStage === "revision_requested"
      ? revisionFiles
      : reviewStage === "resubmitted"
        ? revisionUploads.filter((f) => f.status === "submitted_for_approval")
        : reviewStage === "pending"
          ? deliverables.filter((f) => f.status === "submitted_for_approval")
          : reviewStage === "approved"
            ? (revisionUploads.length ? revisionUploads : deliverables).filter((f) => f.status === "approved")
            : [];
  const filteredReview = reviewFiles.filter((f) => matches(search, f.name, f.code));
  const reviewTitle =
    reviewStage === "revision_requested"
      ? `Revision Version ${revisionCycle} (${reviewFiles.length} Items)`
      : reviewStage === "resubmitted" || (reviewStage === "approved" && revisionCycle > 0)
        ? `Revision Version ${revisionCycle + 1} (${reviewFiles.length} Items Uploaded)`
        : `Edited Deliverables (${reviewFiles.length} Items Uploaded)`;

  /** Select-all scoped to whatever file list the current screen shows */
  const selectableList =
    screen === "selected"
      ? filteredSource
      : screen === "revision_source"
        ? filteredRevisionFiles
        : screen === "root" && tab === "review"
          ? filteredReview
          : [];
  const allSelected = selectableList.length > 0 && selectableList.every((f) => selectedIds.has(f.id));
  const toggleSelectAll = (v: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectableList.forEach((f) => (v ? next.add(f.id) : next.delete(f.id)));
      return next;
    });
  const toggleOne = (id: string, v: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });

  /* ---------- next action per screen ---------- */
  const deliverableStatus =
    pendingCount === 0 && submittedCount > 0
      ? "Submitted for Approval"
      : uploadedCount === 0
        ? "In Progress"
        : uploadedCount >= shoot.requiredDeliverables
          ? "Complete"
          : "Uploading";
  const revisionStatus =
    revisionSubmitted > 0 && revisionPending === 0
      ? reviewStage === "approved" ? "Approved" : "Submitted"
      : revisionUploads.length === 0
        ? "Not Started"
        : revisionUploads.length >= revisionRequired
          ? "Completed"
          : "In Progress";
  const revisionLabel = `Revised ${revisionNoun === "photos" ? "photography" : "files"} - ${revisionRequired} affected files · Cycle ${pad2(revisionCycle)}`;

  const reviewWaitMessage = "Wait for the remaining files to be reviewed and after files are approved it will move to final deliverables.";

  let nextAction: { eyebrow?: string; message: React.ReactNode; actions: NextAction[] } | null = null;
  if (screen === "root" && tab === "overview") {
    nextAction = {
      message: `${shoot.photosToEdit} photos and ${shoot.videosToEdit} videos need editing for this shoot.`,
      actions: [{ label: "View Files to Edit", icon: ArrowRight, onClick: () => setTab("files") }],
    };
  } else if (screen === "root" && tab === "files") {
    nextAction = {
      eyebrow: "Files Ready to Edit",
      message: "The selected files are ready. Start editing and upload your work when you’re done.",
      actions: [{ label: "Download & Start Editing", icon: ArrowRight, onClick: () => push("edits") }],
    };
  } else if (screen === "root" && tab === "review") {
    if (reviewStage === "pending" || reviewStage === "resubmitted") {
      nextAction = { message: reviewWaitMessage, actions: [] };
    } else if (reviewStage === "revision_requested") {
      nextAction = {
        eyebrow: "Revision Requested",
        message: "Changes have been requested for your edited files. Review the feedback and upload the revised versions.",
        actions: [{ label: "Review Feedback & Revise", icon: ArrowRight, onClick: () => setStack(["root", "edits", "revisions"]) }],
      };
    } else if (reviewStage === "approved") {
      nextAction = { message: "Your edited files have been approved. No further action is needed.", actions: [] };
    }
  } else if (screen === "edits") {
    nextAction =
      reviewStage === "revision_requested"
        ? {
          eyebrow: "Revision Requested",
          message: `Revision requested for ${revisionRequired} ${revisionNoun}. Open the Revision folder to see the feedback.`,
          actions: [{ label: "View Folder", onClick: () => push("revisions") }],
        }
        : pendingCount > 0
          ? {
            message: `${pendingCount} edited file${pendingCount === 1 ? " is" : "s are"} ready to send for approval.`,
            actions: [{ label: "View Folder", onClick: () => push("deliverables") }],
          }
          : {
            message: "Download Files from Edits Folder Selected by Client which are Ready for Edits",
            actions: [{ label: "View Folder", onClick: () => push("selected") }],
          };
  } else if (screen === "selected") {
    nextAction = {
      eyebrow: "Files Ready to Edit",
      message: selectedIds.size
        ? `${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"} selected. Download and start editing, then upload your work when you’re done.`
        : "Download and start editing and upload your work when you’re done.",
      actions: [{ label: selectedIds.size ? `Start Editing (${selectedIds.size})` : "Start Editing", icon: ArrowRight, onClick: startEditing }],
    };
  } else if (screen === "deliverables") {
    if (pendingCount > 0) {
      nextAction = {
        message: `${uploadedCount} out of ${shoot.requiredDeliverables} Edited Files are Uploaded and Ready to Send for Approval`,
        actions: [
          { label: "Continue Editing", icon: ArrowRight, variant: "secondary", onClick: () => setStack(["root", "edits", "selected"]) },
          { label: "Submit for Approval", icon: ArrowRight, onClick: () => setSubmitMode("deliverables") },
        ],
      };
    } else if (submittedCount > 0 || reviewStage !== "none") {
      nextAction = {
        message: "Your edited files are with the internal team for review. You’ll be notified once the review is complete.",
        actions: [
          { label: "Upload More", icon: Upload, variant: "secondary", onClick: () => triggerUpload("deliverables") },
          { label: "View Review Status", icon: ArrowRight, onClick: () => goToTab("review") },
        ],
      };
    } else {
      nextAction = {
        message: "After Downloading Files You need to Upload Files in Edited Deliverables Folder",
        actions: [{ label: "Upload Files", icon: Upload, onClick: () => triggerUpload("deliverables") }],
      };
    }
  } else if (screen === "revisions") {
    nextAction =
      reviewStage === "revision_requested"
        ? {
          message: "Download the file, make the requested changes, and upload the updated version.",
          actions: [{ label: "Start Revision", icon: ArrowRight, onClick: () => push("revision_source") }],
        }
        : { message: reviewWaitMessage, actions: [{ label: "View Review Status", icon: ArrowRight, onClick: () => goToTab("review") }] };
  } else if (screen === "revision_source") {
    nextAction = {
      message: (
        <span className="flex flex-wrap items-center lg:justify-between gap-2 flex-1">
          Revision requested for {revisionRequired} {revisionNoun}
          <StatusTag label="● In Progress" tone="blue" />
        </span>
      ),
      actions: [{ label: selectedIds.size ? `Continue Revision (${selectedIds.size})` : "Continue Revision", onClick: continueRevision }],
    };
  } else if (screen === "revision_upload") {
    if (revisionPending > 0) {
      nextAction = {
        message: `${revisionUploads.length} out of ${revisionRequired} Files have been revised and uploaded in Version ${revisionCycle + 1} of Revision file`,
        actions: [{ label: "Submit Revision", onClick: () => setSubmitMode("revision") }],
      };
    } else if (revisionSubmitted > 0) {
      nextAction = {
        message: reviewStage === "approved" ? "Your revised files have been approved. No further action is needed." : reviewWaitMessage,
        actions: [{ label: "View Review Status", icon: ArrowRight, onClick: () => goToTab("review") }],
      };
    } else {
      nextAction = {
        message: `Upload the revised versions of the ${revisionRequired} ${revisionNoun} to Version ${revisionCycle + 1}.`,
        actions: [{ label: "Upload Files", icon: Upload, onClick: () => triggerUpload("revision") }],
      };
    }
  }

  /* ---------- render helpers ---------- */
  const uploadButton = (target: UploadTarget) => (
    <button
      type="button"
      onClick={() => triggerUpload(target)}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8D1AB] px-4 text-sm font-semibold text-black transition-colors hover:bg-[#EEDCBC]"
    >
      <Upload size={16} /> Upload Files
    </button>
  );

  const selectAllControl = () => {
    const disabled = selectableList.length === 0;
    return (
      <label className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs ${t.control} ${disabled ? "opacity-50" : "cursor-pointer"}`}>
        <Checkbox isDark={isDark} checked={allSelected} onChange={(v) => !disabled && toggleSelectAll(v)} label="Select all files" />
        Select All
      </label>
    );
  };

  const downloadSelectedButton = (list: FileItem[]) =>
    selectedIds.size > 0 && (
      <button
        type="button"
        onClick={() => downloadFiles(list.filter((f) => selectedIds.has(f.id)))}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs ${t.control}`}
      >
        <Download size={14} /> Download ({selectedIds.size})
      </button>
    );

  const noMatch = <p className={`py-12 text-center text-sm ${t.faint}`}>No files match “{search}”.</p>;

  const fileGrid = (files: FileItem[], opts: { selectable?: boolean; removable?: (f: FileItem) => (() => void) | undefined } = {}) => (
    <ItemsLayout isDark={isDark} view={view}>
      {files.map((f) => {
        const remove = opts.removable?.(f);
        return (
          <FileCard
            key={f.id}
            isDark={isDark}
            file={f}
            view={view}
            selectable={opts.selectable}
            selected={selectedIds.has(f.id)}
            onToggleSelect={(v) => toggleOne(f.id, v)}
            onOpen={() => setPreviewId(f.id)}
            onDownload={() => downloadFiles([f])}
            extraActions={remove ? [{ label: "Remove", danger: true, onSelect: remove }] : []}
          />
        );
      })}
    </ItemsLayout>
  );

  const folderGrid = (folders: FolderItem[], onOpen: (f: FolderItem) => void) => (
    <ItemsLayout isDark={isDark} view={view}>
      {folders.map((f) => (
        <FolderCard
          key={f.id}
          isDark={isDark}
          folder={f}
          view={view}
          onOpen={() => onOpen(f)}
          actions={[
            { label: "Open", onSelect: () => onOpen(f) },
            { label: "Download", icon: Download, onSelect: () => toast.success(`Preparing ${f.name}.zip`) },
          ]}
        />
      ))}
    </ItemsLayout>
  );

  const revisionProgress = (
    <DeliverableProgress
      isDark={isDark}
      eyebrow="Revision Progress"
      label={revisionLabel}
      required={revisionRequired}
      uploaded={revisionUploads.length}
      status={revisionStatus}
    />
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <button
            type="button"
            onClick={() => setTimelineOpen(true)}
            className={`h-10 rounded-lg px-4 text-xs lg:text-sm font-semibold transition-colors ${t.secondaryBtn}`}
          >
            View Project Timeline
          </button>} />


      <div className="flex min-h-[calc(100vh-80px)] flex-col px-4 pt-6 lg:px-10 lg:pt-8" style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <div className="flex-1 space-y-5 lg:space-y-6">
          <FolderHeader isDark={isDark} shoot={shoot} onBack={goBack} />

          {/*---- ROOT (tabs) ----*/}
          {screen === "root" && (
            <>
              <SegmentedTabs isDark={isDark} value={tab} onChange={setTab} items={TABS} />

              {tab === "overview" && (
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(316px,1fr)]">
                  <InfoGridCard
                    isDark={isDark}
                    title="Editing Information"
                    fields={[
                      { label: "Editing Requirements", value: shoot.editing.requirements },
                      { label: "Deliverables", value: shoot.editing.deliverables },
                      { label: "Required Format", value: shoot.editing.format },
                      {
                        label: "Due Date",
                        value: new Date(`${shoot.editing.dueDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/(\w+) (\d+)$/, "$1, $2"),
                        highlight: true,
                      },
                      { label: "Revision Requirements", value: shoot.editing.revisions },
                      { label: "Brief / Instructions", value: shoot.editing.brief, truncate: true },
                    ]}
                  />
                  <ProjectTimeline isDark={isDark} current={step} />
                </div>
              )}

              {tab === "files" && (
                <section className={`rounded-2xl border ${isDark ? "bg-[#0C0C0C] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
                  <div className={`border-b p-4 lg:p-5 ${isDark ? "border-[#242422]" : "border-[#E5E5E5]"}`}>
                    <h2 className={`text-sm font-medium ${isDark ? "text-[#F0F0EF]" : "text-[#111111]"}`}>Files &amp; Versions</h2>
                    <p className={`mt-0.5 text-xs lg:text-sm ${t.faint}`}>Access follows existing File Manager permissions. Important project files cannot be deleted.</p>
                  </div>
                  <div className="space-y-4 p-4 lg:p-5">
                    <BrowserToolbar isDark={isDark} search={search} onSearch={setSearch} view={view} onView={setView} />
                    {filteredRoot.length === 0 ? (
                      <p className={`py-12 text-center text-sm ${t.faint}`}>No folders match “{search}”.</p>
                    ) : (
                      folderGrid(filteredRoot, openRootFolder)
                    )}
                  </div>
                </section>
              )}

              {/* ---- REVIEW STATUS ---- */}
              {tab === "review" &&
                (reviewStage === "none" ? (
                <section className={`rounded-2xl border px-6 py-16 text-center ${t.panel}`}>
                    <p className={`text-sm font-medium ${t.strong}`}>Nothing to review yet</p>
                    <p className={`mt-1 text-xs ${t.faint}`}>Submit your edited deliverables for approval and their review status will appear here.</p>
                    <button
                      type="button"
                      onClick={() => setStack(["root", "edits", "deliverables"])}
                      className={`mt-5 h-10 rounded-lg px-5 text-xs font-semibold transition-colors ${t.primaryBtn}`}
                    >
                      Go to Edited Deliverables
                    </button>
                  </section>
                ) : (
                  <>
                    <FileSection
                      isDark={isDark}
                      title={reviewTitle}
                      linkedTo={shoot.projectName}
                      linkedOn={shoot.linkedOn}
                      search={search}
                      onSearch={setSearch}
                      view={view}
                      onView={setView}
                      toolbar={<>{selectAllControl()}{downloadSelectedButton(reviewFiles)}</>}
                    >
                      {filteredReview.length === 0 ? noMatch : fileGrid(filteredReview, { selectable: true })}
                    </FileSection>
                  </>
                ))}

              {/* ---- ACTIVITY ---- */}
              {tab === "activity" && <ActivityTimeline isDark={isDark} entries={activity} />}
            </>
          )}

          {/* ---- EDITS FOLDER ---- */}
          {screen === "edits" && (
            <section className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
              <FolderInfoCard
                isDark={isDark}
                title={`Edits (${editsSubfolders.length} Folders)`}
                badge={<LatestBadge />}
                linkedTo={shoot.projectName}
                linkedOn={shoot.linkedOn}
              />
              <div className="p-4 lg:p-5 space-y-4 lg:space-y-5">
                <BrowserToolbar isDark={isDark} search={search} onSearch={setSearch} view={view} onView={setView}>
                  <Select value={folderFilter} onValueChange={(v) => setFolderFilter(v as typeof folderFilter)}>
                    <SelectTrigger className={`h-10 w-[150px] rounded-lg text-xs lg:text-sm focus:ring-0 ${t.control}`}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#111111] border-[#333333] text-white" : "bg-white border-[#E5E5E5] text-black"}>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="action">Needs Action</SelectItem>
                      <SelectItem value="none">No Action</SelectItem>
                    </SelectContent>
                  </Select>
                </BrowserToolbar>
                {filteredEdits.length === 0 ? (
                  <p className={`py-12 text-center text-sm ${t.faint}`}>No folders match these filters.</p>
                ) : (
                  folderGrid(filteredEdits, openEditsFolder)
                )}
              </div>
            </section>
          )}

          {/* ---- SELECTED FOR EDITS ---- */}
          {screen === "selected" && (
            <FileSection
                isDark={isDark}
                title={`Selected for Edits (${sourceFiles.length} Files)`}
                badge={selectedIds.size ? <span className={`text-xs ${t.gold}`}>{selectedIds.size} selected</span> : undefined}
                linkedTo={shoot.projectName}
                linkedOn={shoot.linkedOn}
              search={search}
              onSearch={(v) => {
                setSearch(v);
                setVisibleCount(PAGE_CHUNK);
              }}
              view={view}
              onView={setView}
              toolbar={<>{selectAllControl()}{downloadSelectedButton(sourceFiles)}</>}
            >
                {filteredSource.length === 0 ? (
                noMatch
                ) : (
                  <>
                  {fileGrid(filteredSource.slice(0, visibleCount), { selectable: true })}
                    {visibleCount < filteredSource.length && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((c) => c + PAGE_CHUNK)}
                          className={`h-10 rounded-lg px-5 text-xs font-semibold transition-colors ${t.ghostBtn}`}
                        >
                          Show more ({filteredSource.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
            </FileSection>
          )}

          {/* ---- EDITED DELIVERABLES ---- */}
          {screen === "deliverables" && (
            <>
              <DeliverableProgress
                isDark={isDark}
                label={shoot.deliverableLabel}
                required={shoot.requiredDeliverables}
                uploaded={uploadedCount}
                status={deliverableStatus}
              />

              <FileSection
                  isDark={isDark}
                  title={uploadedCount ? `Edited Deliverables (${uploadedCount} Items Uploaded)` : "Edited Deliverables (0 Files)"}
                badge={
                  uploadedCount > 0
                    ? pendingCount > 0
                      ? <StatusTag label="● In Progress" tone="blue" />
                      : <StatusTag label="Waiting for Approval" tone="blue" />
                    : undefined
                }
                  linkedTo={shoot.projectName}
                  linkedOn={shoot.linkedOn}
                search={search}
                onSearch={setSearch}
                view={view}
                onView={setView}
                toolbar={uploadedCount > 0 && uploadButton("deliverables")}
              >
                  {uploadedCount === 0 ? (
                  <EmptyUploadState isDark={isDark} onFiles={(files) => handleUpload(files, "deliverables")} />
                  ) : filteredDeliverables.length === 0 ? (
                  noMatch
                ) : (
                  fileGrid(filteredDeliverables, {
                    removable: (f) => (f.status === "ready_for_approval" ? () => setDeliverables((d) => d.filter((x) => x.id !== f.id)) : undefined),
                  })
                )}
              </FileSection>
            </>
          )}

          {/* ---- REVISION (version folders) ---- */}
          {screen === "revisions" && (
            <section className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
              <FolderInfoCard isDark={isDark} title="Revision (2 Folders)" linkedTo={shoot.projectName} linkedOn={shoot.linkedOn} />
              <div className="p-4 lg:p-5 space-y-4 lg:space-y-5">
                <BrowserToolbar isDark={isDark} search={search} onSearch={setSearch} view={view} onView={setView} />
                {filteredRevisionFolders.length === 0 ? (
                  <p className={`py-12 text-center text-sm ${t.faint}`}>No folders match “{search}”.</p>
                  ) : (
                  folderGrid(filteredRevisionFolders, openRevisionFolder)
                )}
              </div>
            </section>
          )}

          {/* ---- REVISION · VERSION N (files to revise) ---- */}
          {screen === "revision_source" && (
            <>
              {revisionProgress}
              <FileSection
                          isDark={isDark}
                title={`Version ${revisionCycle} (${revisionRequired} Items Need to be Revised)`}
                linkedTo={shoot.projectName}
                linkedOn={shoot.linkedOn}
                search={search}
                onSearch={setSearch}
                          view={view}
                onView={setView}
                toolbar={<>{selectAllControl()}{downloadSelectedButton(revisionFiles)}</>}
              >
                {filteredRevisionFiles.length === 0 ? noMatch : fileGrid(filteredRevisionFiles, { selectable: true })}
              </FileSection>
            </>
          )}

          {/* ---- REVISION · VERSION N+1 (upload revised files) ---- */}
          {screen === "revision_upload" && (
            <>
              {revisionProgress}
              <FileSection
                isDark={isDark}
                title={`Version ${revisionCycle + 1} (${revisionUploads.length} Items Uploaded)`}
                badge={
                  revisionSubmitted > 0 && revisionPending === 0 ? (
                    <StatusTag label={reviewStage === "approved" ? "Approved" : "Waiting for Approval"} tone={reviewStage === "approved" ? "green" : "blue"} />
                  ) : undefined
                }
                linkedTo={shoot.projectName}
                linkedOn={shoot.linkedOn}
                search={search}
                onSearch={setSearch}
                view={view}
                onView={setView}
                toolbar={revisionUploads.length > 0 && uploadButton("revision")}
              >
                {revisionUploads.length === 0 ? (
                  <EmptyUploadState
                    isDark={isDark}
                    title="Upload your Revised Files"
                    subtitle={`Upload the revised versions of the ${revisionRequired} ${revisionNoun} sent back for changes.`}
                    onFiles={(files) => handleUpload(files, "revision")}
                  />
                ) : filteredRevisionUploads.length === 0 ? (
                  noMatch
                ) : (
                  fileGrid(filteredRevisionUploads, {
                    removable: (f) => (f.status === "ready_for_approval" ? () => setRevisionUploads((d) => d.filter((x) => x.id !== f.id)) : undefined),
                  })
                  )}
              </FileSection>
            </>
          )}
        </div>

        {nextAction && <NextActionBar isDark={isDark} eyebrow={nextAction.eyebrow} message={nextAction.message} actions={nextAction.actions} />}
        {!nextAction && <div className="h-10" />}
      </div>

      {/* ---- OVERLAYS ---- */}
      <FilePreviewDrawer
        isDark={isDark}
        file={previewFile}
        onClose={() => setPreviewId(null)}
        onDownload={(f) => downloadFiles([f])}
        onShare={shareFile}
        onRequestRevision={previewFile?.status === "selected_for_edits" ? (f) => toast(`Revision request for ${f.name} sent to the producer`) : undefined}
        onAddComment={addComment}
      />

      <UploadFilesModal
        open={uploadTarget !== null}
        isDark={isDark}
        folderName={shoot.title}
        onClose={() => setUploadTarget(null)}
        onUpload={uploadFromModal}
      />

      <ProjectTimelineDrawer isDark={isDark} open={timelineOpen} current={step} onClose={() => setTimelineOpen(false)} />

      <SubmitForApprovalModal
        open={submitMode !== null}
        isDark={isDark}
        shoot={shoot}
        required={submitMode === "revision" ? revisionRequired : shoot.requiredDeliverables}
        uploaded={submitMode === "revision" ? revisionUploads.length : uploadedCount}
        onClose={() => setSubmitMode(null)}
        onSubmit={submitForApproval}
      />

      <SuccessModal
        isOpen={!!success}
        onSubmit={() => {
          setSuccess(null);
          goToTab("review");
        }}
        title={
          success
            ? `${success.count} ${success.revision ? "" : "Edited "}${cap(success.count === 1 ? success.noun.replace(/s$/, "") : success.noun)} Submitted for Review`
            : ""
        }
        subtext={`Your ${success?.revision ? "revised" : "edited"} ${success?.noun ?? "files"} have been successfully submitted to the internal team for review. You’ll be notified once the review is complete.`}
        buttonText="Review Files"
      />
    </>
  );
}
