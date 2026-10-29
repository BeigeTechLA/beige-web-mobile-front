"use client";

import { useEffect, useState } from "react";
import { ArrowDown, CalendarDays, Folder, Link, Search, Upload, X } from "lucide-react";
import ActionSuccessModal from "@/components/admin/ActionSuccessModal";
import { EditorNextActionIcon } from "@/components/admin/file-manager/EditorNextActionIcon";
import { EditorFileCard, type EditorFileCardData } from "@/components/admin/file-manager/EditorFileCard";
import { EditorFolderCard } from "@/components/admin/file-manager/EditorFolderCard";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import { EditorFileDetailsPanel } from "@/components/admin/file-manager/EditorFileDetailsPanel";
import type { ViewMode } from "@/hooks/useViewMode";
import { toast } from "sonner";

export function EditorReviewStatus({ projectName, files, bookingId, status, nextAction, revisionVersion }: { projectName: string; files: EditorFileCardData[]; bookingId: string; status?: string; nextAction?: string; revisionVersion?: number | null }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EditorFileCardData | null>(null);
  const reviewFiles = files.map((file) => ({ ...file, statusLabel: file.statusLabel || (status === "revision_requested" ? "Revision Requested" : "Waiting for Approval") }));
  const revisionSubmitted = status === "resubmitted";

  return (
    <div className="mt-5 overflow-hidden rounded-[22px] border border-[#252525] bg-[#111]">
      <div className="border-b border-[#292929] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292929] text-white">
            <Folder size={18} />
          </span>
          <h2 className="text-sm font-medium text-[#e8d1ab]">
            {revisionSubmitted
              ? `Revision Version ${revisionVersion || 1} (${reviewFiles.length} Items Uploaded)`
              : `Edited Deliverables (${reviewFiles.length} Items Uploaded)`}
          </h2>
        </div>
        <LinkedProjectInfo projectName={projectName} />
      </div>
      <div 
        className="flex flex-col justify-between gap-3 border-b border-[#292929] px-5 py-4 md:flex-row md:items-center md:px-6">
        <SearchBox />
        <div className="flex items-center justify-end gap-2"><button 
          className="flex h-10 items-center gap-2 rounded-lg border border-[#363636] bg-[#202020] px-3 text-xs text-white"><span className="h-4 w-4 rounded border border-[#666]" />Select All</button><FileManagerViewToggle 
          isOpen={viewMenuOpen} 
          setIsOpen={setViewMenuOpen} 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
          isDark /></div>
      </div>
      <div className="grid grid-cols-1 items-start gap-3 p-4 md:grid-cols-2 md:p-5 2xl:grid-cols-3">{reviewFiles.length === 0 ? <p className="text-sm text-[#aaa]">No files waiting for review.</p> : reviewFiles.map((file, index) => <EditorFileCard 
        key={`${file.title}-${index}`} 
        file={file} 
        onOpen={() => setSelectedFile(file)} />)}</div>
      <NextActionFooter 
        message={nextAction || "No action is currently required."} />
      {selectedFile && <EditorFileDetailsPanel 
        file={selectedFile} 
        bookingId={bookingId}
        onClose={() => setSelectedFile(null)} 
        revisionComparison={revisionSubmitted} />}
    </div>
  );
}

export function EditorRevisionFlow({ projectName, files: liveFiles = [], folders = [], progress: liveProgress, currentVersion = 1, nextAction, bookingId, stage, onStageChange, onUpload, onSubmitRevision, onReturnToReview }: { projectName: string; files?: EditorFileCardData[]; folders?: Array<{ name: string; path: string; fileCount?: number; updatedAt?: string }>; progress?: { uploaded: number; required: number; percent: number }; currentVersion?: number; nextAction?: { code?: string; text?: string } | null; bookingId: string; stage: "folders" | "version-one" | "version-two"; onStageChange: (stage: "folders" | "version-one" | "version-two") => void; onUpload: () => void; onSubmitRevision: (notes?: string) => Promise<number>; onReturnToReview: () => void }) {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EditorFileCardData | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    if (!submitted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSubmitted(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitted]);

  const completed = stage === "version-two";
  const canSubmitRevision = completed && liveProgress?.uploaded && nextAction?.code === "upload_revision";
  const displayedVersion = currentVersion;
  const title = completed
    ? `Version ${displayedVersion} (${liveProgress?.uploaded || liveFiles.length} Items Uploaded)`
    : `Version 1 (${liveProgress?.required || liveFiles.length} Items Need to be Revised)`;
  const files = liveFiles.map((file, index) => ({
    ...file,
    versionLabel: `V${displayedVersion} Latest`,
    statusLabel: completed ? "Waiting for Approval" : "Revision Requested",
    uploadedAt: index === 0 ? "10 Jan, 2026 - 10:00 AM" : "10 Jan, 2026 - 10:15 AM",
  }));

  const footerMessage = stage === "folders"
    ? "Download the file, make the requested changes, and upload the revised Version 1 to Version 2."
    : stage === "version-one"
    ? `Revision requested for ${liveProgress?.required || liveFiles.length} photos`
      : `${liveProgress?.uploaded || liveFiles.length} files have been revised and uploaded.`;
  const buttonLabel = stage === "folders" ? "Start Revision" : stage === "version-one" ? "Continue Revision" : "Submit Revision";
  const advance = () => {
    if (stage === "folders") onStageChange("version-one");
    else if (stage === "version-one") onUpload();
    else if (canSubmitRevision) setApprovalOpen(true);
  };

  return (
    <div className="mt-8 space-y-5 pb-28">
      {stage !== "folders" && <ProgressCard 
        progress={liveProgress?.percent || 0} 
        title={`Revised photography - ${liveProgress?.required || liveFiles.length} affected files`}
        uploaded={liveProgress?.uploaded || 0}
        required={liveProgress?.required || liveFiles.length}
        status={completed ? "Completed" : "Not Started"} />}
      <section className="overflow-hidden rounded-[22px] border border-[#252525] bg-[#111]">
        <div className="border-b border-[#292929] p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292929] text-white">
              <Folder size={18} />
            </span>
            <h2 className="text-sm font-medium text-[#e8d1ab]">
              {stage === "folders" ? `Revision (${folders.length} Folders)` : title}
            </h2>
            {stage === "folders" && (
              <span className="rounded-full border border-[#315342] bg-[#17221c] px-3 py-0.5 text-[10px] text-[#54cc83]">
                Latest
              </span>
            )}
          </div>
          <LinkedProjectInfo projectName={projectName} />
        </div>
        {stage === "folders" ? (
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {folders.map((folder) => <EditorFolderCard 
              key={folder.path}
              title={folder.name}
              fileCount={folder.fileCount || 0}
              lastOpened={folder.updatedAt ? new Date(folder.updatedAt).toLocaleString() : "-"} 
              userInitials="-" 
              hoverMessage={folder.name.replace(/\s/g, "") === "Version1" ? "Revision Requested" : undefined}
              onOpen={() => onStageChange(folder.name.replace(/\s/g, "") === "Version1" ? "version-one" : "version-two")} />)}
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 border-b border-[#292929] px-5 py-4 md:flex-row md:items-center md:px-6">
              <SearchBox />
              <div className="flex items-center justify-end gap-2">
                <button className="flex h-10 items-center gap-2 rounded-lg border border-[#363636] bg-[#202020] px-3 text-xs text-white">
                  <span className="h-4 w-4 rounded border border-[#666]" />
                  Select All
                </button>
                {completed && (
                  <button onClick={onUpload} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#e8d1ab] px-4 text-xs font-semibold text-black">
                    <Upload size={15} />
                    Upload Files
                  </button>
                )}
                <FileManagerViewToggle
                  isOpen={viewMenuOpen}
                  setIsOpen={setViewMenuOpen}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isDark
                />
              </div>
            </div>
            <div className="grid grid-cols-1 items-start gap-3 p-4 md:grid-cols-2 md:p-5 2xl:grid-cols-3">
              {files.map((file, index) => (
                <EditorFileCard
                  key={`${file.title}-${index}`}
                  file={file}
                  onOpen={() => setSelectedFile(file)}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <NextActionFooter 
        message={nextAction?.text || footerMessage} 
        buttonLabel={stage === "version-one" || (stage === "version-two" && !canSubmitRevision) ? undefined : buttonLabel} 
        onAction={advance} />
      {selectedFile && <EditorFileDetailsPanel 
        file={selectedFile} 
        bookingId={bookingId}
        onClose={() => setSelectedFile(null)} 
        revisionComparison={completed} />}
      {approvalOpen && <RevisionApprovalModal 
        onClose={() => setApprovalOpen(false)} 
        pending={submitPending}
        progress={liveProgress}
        onSubmit={async (notes) => {
          if (submitPending) return;
          setSubmitPending(true);
          try { setSubmittedCount(await onSubmitRevision(notes)); setApprovalOpen(false); setSubmitted(true); }
          catch (caught) { toast.error((caught as Error).message || "Unable to submit revision"); }
          finally { setSubmitPending(false); }
        }} />}
      <ActionSuccessModal
        isOpen={submitted}
        onSubmit={() => {
          setSubmitted(false);
          onReturnToReview();
        }}
        title={`${submittedCount} Photos Submitted for Review`}
        subtext="Your revised photos have been successfully submitted to the internal team for review. You'll be notified when the review is complete."
        buttonText="Review Files"
      />
    </div>
  );
}

export function EditorTimelineDrawer({ onClose, activeStepIndex = 1, timeline }: { onClose: () => void; activeStepIndex?: number; timeline?: Array<{ status?: string; done?: boolean; current?: boolean }> }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const steps = [
    "Not Started",
    "In Progress",
    "Submitted",
    "Revision Requested",
    "Resubmitted",
    "Approved",
    "Completed",
  ];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-[4px]"
      onMouseDown={onClose}
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-[min(350px,88vw)] flex-col overflow-hidden rounded-l-xl border border-[#393939] bg-black"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#333] bg-[#111] px-4">
          <h2 className="text-sm font-semibold">Project Timeline</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#292526] p-0"
            aria-label="Close timeline"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        <ol className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {steps.map((step, index) => {
            const state = timeline?.find((item) => item.status === ["not_started", "in_progress", "submitted", "revision_requested", "resubmitted", "approved", "completed"][index]);
            const active = state ? Boolean(state.done || state.current) : index <= activeStepIndex;
            return (
            <li key={step} className="relative flex min-h-[90px] items-start gap-3.5 pt-1">
              <span
                className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${active ? "bg-[#e8d1ab] text-black" : "bg-[#111] text-[#aaa]"}`}
              >
                {index + 1}
              </span>
              <span className={`pt-2 text-sm leading-5 ${active ? "text-[#e8d1ab]" : "text-[#aaa]"}`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="absolute left-[17px] top-[38px] flex h-[43px] w-px flex-col items-center border-l border-dashed border-[#777] text-[#aaa]">
                  <ArrowDown size={10} className="absolute -bottom-1 -left-[5px] bg-black" />
                </span>
              )}
            </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

function ProgressCard({ progress, title, uploaded, required, status }: { progress: number; title: string; uploaded: number; required: number; status: string }) {
  return (
    <section className="rounded-[22px] border border-[#252525] bg-[#0b0b0b] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#e8d1ab]">
            Revision Progress
          </p>
          <h2 className="mt-1 text-sm font-semibold">{title}</h2>
        </div>
        <span className="text-3xl font-medium text-[#e8d1ab]">{progress}%</span>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#343434]">
        <div className="h-full rounded-full bg-[#e8d1ab]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Required" value={String(required)} />
        <Stat label="Uploaded" value={String(uploaded)} />
        <Stat label="Remaining" value={String(Math.max(required - uploaded, 0))} />
        <Stat label="Status" value={status} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#292929] pl-3 first:border-0 first:pl-0">
      <p className="text-[10px] uppercase text-[#888]">{label}</p>
      <p className="mt-1 text-xs text-white">{value}</p>
    </div>
  );
}
function SearchBox() {
  return (
    <div className="flex h-10 w-full max-w-[380px] items-center gap-3 rounded-lg border border-[#363636] bg-[#202020] px-4">
      <Search size={17} className="shrink-0 text-[#777]" />
      <input
        aria-label="Search files"
        placeholder="Search"
        className="w-full bg-transparent text-xs outline-none placeholder:text-[#777]"
      />
    </div>
  );
}
function LinkedProjectInfo({ projectName }: { projectName: string }) {
  return (
    <div className="rounded-md border border-[#383838] bg-[#191919] px-3 py-3.5 text-xs leading-4 text-[#d8d8d8]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#09264d]">
          <Link size={18} />
        </span>
        <div>
          <p className="text-sm leading-5">Linked to: {projectName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs leading-4 text-[#bcbcbc]">
            <CalendarDays size={14} />
            -
          </p>
        </div>
      </div>
    </div>
  );
}
function NextActionFooter({ message, buttonLabel, onAction }: { message: string; buttonLabel?: string; onAction?: () => void }) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 flex h-24 min-h-24 items-center justify-between gap-4 overflow-hidden border-t border-[#292929] bg-[#171717]/95 px-5 py-4 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur md:px-8 lg:left-64">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <EditorNextActionIcon className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[#e8d1ab]">Next Action</p>
          <p className="mt-1 line-clamp-2 text-sm md:text-base">{message}</p>
        </div>
      </div>
      {buttonLabel && (
        <button
          onClick={onAction}
          className="h-12 shrink-0 rounded-lg bg-[#e8d1ab] px-7 text-sm font-semibold text-[#171717]"
        >
          {buttonLabel}
        </button>
      )}
    </footer>
  );
}

function RevisionApprovalModal({ onClose, onSubmit, pending, progress }: { onClose: () => void; onSubmit: (notes?: string) => Promise<void>; pending: boolean; progress?: { uploaded: number; required: number } }) {
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[815px] overflow-hidden rounded-2xl border border-[#383838] bg-black"
      >
        <header className="flex items-center justify-between border-b border-[#333] px-7 py-6">
          <h2 className="text-2xl font-semibold">Submit for Approval</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#292526] text-2xl"
          >
            &times;
          </button>
        </header>
        <div className="space-y-6 p-7">
          <div className="flex items-center gap-5">
            <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-[#c9e0ff] text-3xl font-bold text-black">
              NH
            </div>
            <div>
              <h3 className="text-xl font-semibold">Submit Revision</h3>
              <p className="mt-1 text-sm font-semibold text-[#e8d1ab]">
                Revision submission
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#333] rounded-xl border border-[#333] py-4">
            {[["Required", String(progress?.required || 0)], ["Uploaded Files", String(progress?.uploaded || 0)], ["Remaining Files", String(Math.max((progress?.required || 0) - (progress?.uploaded || 0), 0))]].map(([label, value]) => (
              <div key={label} className="px-4">
                <p className="text-xs uppercase text-[#888]">{label}</p>
                <p className="mt-1 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <fieldset className="rounded-xl border border-[#444] px-4 pb-4">
            <legend className="px-2 text-sm text-[#999]">
              Submission Notes <span className="text-[#e8d1ab]">(Optional)</span>
            </legend>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-28 w-full resize-none bg-transparent pt-2 text-sm outline-none"
            />
          </fieldset>
          <div className="rounded-xl bg-[#191711] px-5 py-4 text-xs uppercase tracking-wide text-[#e8d1ab]">
            Maya Chen and the post production team will be notified. Your editor status will update automatically
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button disabled={pending} onClick={onClose} className="rounded-lg bg-[#202020] py-3 text-sm">
              Cancel
            </button>
            <button disabled={pending} onClick={() => void onSubmit(notes || undefined)} className="rounded-lg bg-[#e8d1ab] py-3 text-sm font-semibold text-black">
              {pending ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
