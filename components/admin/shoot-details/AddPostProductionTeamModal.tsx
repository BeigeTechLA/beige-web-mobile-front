"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Search, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import EditorAvatar from "./EditorAvatar";
import EditorCompensationPanel from "./EditorCompensationPanel";
import AssignmentSuccessAnimation from "./AssignmentSuccessAnimation";
import {
  DEMO_EDITORS,
  createDefaultCompensation,
  createDemoAssignment,
  getCompensationTotal,
  getDemoAssignments,
  getEditor,
  savePendingEditorQueue,
  upsertDemoAssignment,
  type DemoEditor,
  type EditorCompensation,
} from "./postProductionDemoStore";

type EditorTab = "all" | "internal" | "external";
type Step =
  | "selection"
  | "confirmation"
  | "assignmentSuccess"
  | "compensation"
  | "financeSuccess";

interface Props {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  isDark?: boolean;
  mode?: "add" | "change";
  replaceMemberId?: number | null;
  assignedMemberIds?: number[];
  projectName?: string;
  shootLabel?: string;
  /** The remaining items from an external-editor agreement batch. */
  resumeEditorIds?: number[];
}

const tabs: { id: EditorTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "internal", label: "Internal Editors" },
  { id: "external", label: "External Editors" },
];

export default function AddPostProductionTeamModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  isDark = true,
  mode = "add",
  replaceMemberId = null,
  assignedMemberIds = [],
  projectName,
  shootLabel,
  resumeEditorIds = [],
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("selection");
  const [tab, setTab] = useState<EditorTab>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [compensation, setCompensation] = useState<EditorCompensation>(
    createDefaultCompensation,
  );

  useEffect(() => {
    if (!isOpen) return;
    const restored = resumeEditorIds.filter(
      (id) => Boolean(getEditor(id)) && !assignedMemberIds.includes(id),
    );
    setSelectedIds(restored);
    setStep(restored.length ? "confirmation" : "selection");
    setTab("all");
    setSearch("");
    setQueueIndex(0);
    setCompensation(createDefaultCompensation());
  }, [isOpen, resumeEditorIds.join(",")]);

  const currentEditor = getEditor(selectedIds[queueIndex] || 0);
  const existingIds = useMemo(
    () => new Set(assignedMemberIds),
    [assignedMemberIds],
  );
  const filteredEditors = useMemo(() => {
    const term = search.toLowerCase().trim();
    return DEMO_EDITORS.filter((editor) => {
      if (tab !== "all" && editor.category !== tab) return false;
      return `${editor.name} ${editor.specialty}`.toLowerCase().includes(term);
    });
  }, [tab, search]);

  const hasMore = queueIndex + 1 < selectedIds.length;
  const isReplacing = mode === "change" && replaceMemberId !== null;
  const shell = isDark
    ? "border-[#383838] bg-[#050505] text-white"
    : "border-[#E5E5E5] bg-white text-[#171717]";
  const muted = isDark ? "text-[#A3A3A3]" : "text-[#666666]";
  const secondary = isDark
    ? "bg-[#202020] text-white hover:bg-[#303030]"
    : "bg-[#F1F1F1] text-black hover:bg-[#E5E5E5]";
  const primary =
    "bg-[#E8D1AB] text-black hover:bg-[#D9C39F] disabled:opacity-45";

  const closeFlow = () => onClose();

  const toggleEditor = (editor: DemoEditor) => {
    if (existingIds.has(editor.id) && editor.id !== replaceMemberId) return;
    setSelectedIds((previous) =>
      previous.includes(editor.id)
        ? previous.filter((id) => id !== editor.id)
        : mode === "change"
          ? [editor.id]
          : [...previous, editor.id],
    );
  };

  const nextEditor = () => {
    if (!hasMore) {
      closeFlow();
      return;
    }
    setQueueIndex((previous) => previous + 1);
    setCompensation(createDefaultCompensation());
    setStep("confirmation");
  };

  const saveNormalAssignment = () => {
    if (!currentEditor || currentEditor.category !== "internal") return;
    const next = createDemoAssignment(currentEditor.id);
    next.projectName = projectName;
    next.shootLabel = shootLabel;
    next.status =
      currentEditor.category === "internal" ? "Accepted" : "Assigned";
    next.workflow = "normal";
    upsertDemoAssignment(projectId, next, isReplacing ? replaceMemberId : null);
    void onSuccess?.();
    setStep("assignmentSuccess");
  };

  const saveAgreementDraft = (financeStatus: "not_submitted" | "submitted") => {
    if (!currentEditor || currentEditor.category !== "external") return;
    const existing = getDemoAssignments(projectId).find(
      (item) => item.editorId === currentEditor.id,
    );
    upsertDemoAssignment(
      projectId,
      {
        ...(existing || createDemoAssignment(currentEditor.id)),
        editorId: currentEditor.id,
        projectName: projectName || existing?.projectName,
        shootLabel: shootLabel || existing?.shootLabel,
        status: "Pending",
        workflow: "agreement",
        compensation: { ...compensation },
        financeStatus,
      },
      isReplacing ? replaceMemberId : null,
    );
    void onSuccess?.();
  };

  const openAgreement = () => {
    if (
      !currentEditor ||
      currentEditor.category !== "external" ||
      getCompensationTotal(compensation) <= 0
    )
      return;
    const existing = getDemoAssignments(projectId).find(
      (entry) => entry.editorId === currentEditor.id,
    );
    saveAgreementDraft(existing?.financeStatus || "not_submitted");
    savePendingEditorQueue(projectId, selectedIds.slice(queueIndex + 1));
    const query = new URLSearchParams({
      editor: String(currentEditor.id),
      project: projectName || "this shoot",
    });
    closeFlow();
    router.push(
      `/admin/shoots/${encodeURIComponent(projectId)}/post-production-agreement?${query}`,
    );
  };

  const submitToFinance = () => {
    if (getCompensationTotal(compensation) <= 0) return;
    saveAgreementDraft("submitted");
    setStep("financeSuccess");
  };

  const confirmEditor = () => {
    if (!currentEditor) return;
    if (currentEditor.category === "internal") {
      saveNormalAssignment();
      return;
    }
    // External editors cannot bypass compensation and agreement.
    setStep("compensation");
  };

  if (isOpen && step === "compensation" && currentEditor) {
    return (
      <EditorCompensationPanel
        editor={currentEditor}
        value={compensation}
        onChange={setCompensation}
        onBack={() => setStep("confirmation")}
        onClose={closeFlow}
        onFinance={submitToFinance}
        onAgreement={openAgreement}
        isDark={isDark}
      />
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) closeFlow();
      }}
    >
      <DialogContent
        style={{ fontFamily: "var(--font-instrument-sans)" }}
        className={`z-[125] flex max-h-[calc(100dvh_-_24px)] w-[calc(100vw_-_24px)] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl [&>button]:hidden ${step === "selection" ? "h-[min(800px,calc(100dvh_-_24px))] max-w-[870px]" : "max-w-[465px]"} ${shell}`}
      >
        {step === "selection" && (
          <>
            <header
              className={`flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-7 sm:py-6 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}
            >
              <DialogTitle className="text-xl font-semibold sm:text-2xl">
                {mode === "change" ? "Change Editor" : "Assign Editor"}
              </DialogTitle>
              <button
                type="button"
                onClick={closeFlow}
                aria-label="Close editor selection"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${secondary}`}
              >
                <X size={22} />
              </button>
            </header>
            <DialogDescription className="sr-only">
              Select internal or external editors. Internal editors are assigned
              directly; external editors require compensation and an agreement.
            </DialogDescription>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-4 sm:gap-4 sm:px-7 sm:pt-6">
              <div
                role="tablist"
                aria-label="Editor category"
                className={`grid shrink-0 grid-cols-3 gap-1 rounded-xl border p-1 ${isDark ? "border-[#373737] bg-[#111111]" : "border-[#DDDDDD] bg-[#F6F6F6]"}`}
              >
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    onClick={() => setTab(item.id)}
                    className={`min-w-0 rounded-lg px-1 py-2.5 text-[11px] font-semibold sm:text-sm ${tab === item.id ? "bg-[#E8D1AB] text-black" : muted}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="relative block shrink-0">
                <Search
                  size={18}
                  className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${muted}`}
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search Editor Name..."
                  className={`h-12 w-full rounded-xl border pl-11 pr-4 text-sm outline-none focus:border-[#E8D1AB] ${isDark ? "border-[#333333] bg-[#202020] text-white" : "border-[#D5D5D5] bg-[#F8F8F8] text-black"}`}
                />
              </label>
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pb-4 pr-1 [scrollbar-width:thin]">
                {filteredEditors.length === 0 ? (
                  <p className={`py-10 text-center text-sm ${muted}`}>
                    No editors match this filter.
                  </p>
                ) : (
                  filteredEditors.map((editor) => {
                    const selected = selectedIds.includes(editor.id);
                    const disabled =
                      existingIds.has(editor.id) &&
                      editor.id !== replaceMemberId;
                    return (
                      <button
                        key={editor.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleEditor(editor)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors sm:gap-4 sm:p-4 ${selected ? (isDark ? "border-[#8D7B59] bg-[#1C1814]" : "border-[#D5B985] bg-[#FFF8EB]") : isDark ? "border-[#222222] bg-[#101010] hover:border-[#666666]" : "border-[#E5E5E5] bg-[#FCFCFC] hover:border-[#CFCFCF]"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <EditorAvatar
                          name={editor.name}
                          avatarUrl={editor.avatarUrl}
                          className="h-12 w-12 sm:h-14 sm:w-14"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold sm:text-base">
                              {editor.name}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-[#403B32] bg-[#24211C] text-[#E8D1AB]" : "border-[#E5D5B8] bg-[#F7EDDB] text-[#78572A]"}`}
                            >
                              {editor.category === "internal"
                                ? "Internal"
                                : "External"}
                            </span>
                            {selected && (
                              <span className="rounded-full border border-emerald-700 bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-400">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-xs sm:text-sm ${muted}`}>
                            {editor.specialty} ·{" "}
                            <span className="text-[#C6A675]">
                              {editor.activeShoots} active shoots
                            </span>
                          </p>
                          {disabled && (
                            <p className={`mt-1 text-xs ${muted}`}>
                              Already assigned
                            </p>
                          )}
                        </div>
                        <div
                          className={`hidden shrink-0 items-center gap-2 text-xs sm:flex ${muted}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Available
                        </div>
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${selected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : isDark ? "border-[#666666]" : "border-[#B5B5B5]"}`}
                        >
                          {selected && <Check size={17} />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <footer
              className={`shrink-0 border-t px-4 py-4 sm:px-7 ${isDark ? "border-[#282828] bg-[#050505]" : "border-[#E5E5E5] bg-white"}`}
            >
              <p className={`mb-3 text-xs ${muted}`}>
                Internal: direct assignment · External: compensation and
                agreement · demo data only
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={closeFlow}
                  className={`h-11 rounded-lg ${secondary}`}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => {
                    setQueueIndex(0);
                    setStep("confirmation");
                  }}
                  className={`h-11 rounded-lg ${primary}`}
                >
                  Continue
                </Button>
              </div>
            </footer>
          </>
        )}

        {step === "confirmation" && currentEditor && (
          <>
            <DialogTitle className="sr-only">
              Confirm Editor Assignment
            </DialogTitle>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pt-6 pb-4 sm:px-6 sm:pt-7">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-[#E8D1AB] ${isDark ? "border-[#403A2F] bg-[#201D18]" : "border-[#E7DAC3] bg-[#FFF7E9]"}`}
                >
                  <UsersRound size={20} />
                </span>
                <h2 className="text-xl font-medium">
                  {mode === "change" ? "Change Editor?" : "Assign Editor?"}
                </h2>
              </div>
              <DialogDescription className={`text-sm leading-6 ${muted}`}>
                You&apos;re assigning{" "}
                <span className="font-semibold text-[#C6A675]">
                  {currentEditor.name}
                </span>{" "}
                as Editor for{" "}
                <span className={isDark ? "text-white" : "text-black"}>
                  {projectName || "this shoot"}
                  {shootLabel ? ` · ${shootLabel}` : ""}
                </span>
                .
              </DialogDescription>
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-[#333333] bg-[#101010]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}
              >
                <EditorAvatar
                  name={currentEditor.name}
                  avatarUrl={currentEditor.avatarUrl}
                  className="h-10 w-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {currentEditor.name}
                  </p>
                  <p className={`truncate text-xs ${muted}`}>
                    {currentEditor.specialty}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${isDark ? "bg-[#25221D] text-[#E8D1AB]" : "bg-[#F7EBD7] text-[#876438]"}`}
                >
                  {currentEditor.category === "internal"
                    ? "Internal Editor"
                    : "External Editor"}
                </span>
              </div>
              <p className={`text-xs ${muted}`}>
                {currentEditor.category === "external"
                  ? "Next: compensation, optional advance payment, and a Shoot Agreement."
                  : currentEditor.category === "internal"
                    ? "Internal Editors do not require a Shoot Agreement. Next: assignment success."
                    : "Next: assignment success."}
              </p>
              <p className={`text-xs ${muted}`}>
                Static preview: no API request, email, or account change.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
              <Button
                type="button"
                onClick={() => setStep("selection")}
                className={`h-11 rounded-lg ${secondary}`}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={confirmEditor}
                className={`h-11 rounded-lg ${primary}`}
              >
                {currentEditor.category === "external"
                  ? "Add Compensation"
                  : hasMore
                    ? "Assign & Continue"
                    : "Assign Editor"}
              </Button>
            </div>
          </>
        )}

        {step === "assignmentSuccess" && currentEditor && (
          <>
            <DialogTitle className="sr-only">Editor Assigned</DialogTitle>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-7 text-center sm:px-7 sm:pt-9">
              <AssignmentSuccessAnimation />
              <h2 className="mt-6 text-xl font-medium">
                {currentEditor.category === "internal"
                  ? "Internal Editor Assigned"
                  : "Editor Assigned Successfully"}
              </h2>
              <DialogDescription className={`mt-3 text-sm leading-6 ${muted}`}>
                {currentEditor.name} is now listed as an assigned Editor for
                this shoot in the demo.
                {hasMore ? " Continue with the next selected editor." : ""}
              </DialogDescription>
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-left ${isDark ? "bg-[#1E1A16]" : "bg-[#F8F2E8]"}`}
              >
                <Bell size={18} className="shrink-0 text-[#E8D1AB]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#C6A675]">
                    Notification preview only
                  </p>
                  <p className="mt-1 text-sm">
                    You&apos;ve been assigned as Editor
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {projectName || "Shoot"}
                    {shootLabel ? ` · ${shootLabel}` : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-6">
              <Button
                type="button"
                onClick={closeFlow}
                className={`h-11 rounded-lg ${secondary}`}
              >
                Done
              </Button>
              <Button
                type="button"
                onClick={nextEditor}
                className={`h-11 rounded-lg ${primary}`}
              >
                {hasMore ? "Continue" : "View Shoot"}
              </Button>
            </div>
          </>
        )}

        {step === "financeSuccess" && currentEditor && (
          <>
            <DialogTitle className="sr-only">
              Finance request recorded
            </DialogTitle>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 text-center sm:px-7 sm:py-10">
              <AssignmentSuccessAnimation />
              <h2 className="mt-6 text-xl font-medium">
                Request Sent Successfully
              </h2>
              <DialogDescription className={`mt-3 text-sm leading-6 ${muted}`}>
                A finance request for {currentEditor.name} has been recorded in
                this browser session. Nothing was submitted to Finance.
              </DialogDescription>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-6">
              <Button
                type="button"
                onClick={closeFlow}
                className={`h-11 rounded-lg ${secondary}`}
              >
                Done
              </Button>
              <Button
                type="button"
                onClick={openAgreement}
                className={`h-11 rounded-lg ${primary}`}
              >
                Add Agreement
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
