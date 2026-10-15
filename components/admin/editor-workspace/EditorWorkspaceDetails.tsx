"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  EDITING_STAGES,
  getWorkspaceShoot,
  getWorkspaceActivity,
  setWorkspaceEditingStage,
  updateWorkspaceRecord,
  appendWorkspaceActivity,
  useWorkspaceRecord,
  type EditorWorkspaceRole,
  type EditingStage,
} from "./editorWorkspaceDemoStore";
import {
  EditorWorkspaceTopbar,
  StatusPill,
  useEditorWorkspaceTheme,
  workspaceUrl,
  workspaceMuted,
  workspaceSurface,
  workspaceAccent,
  workspaceSecondary,
  WorkspaceTextarea,
} from "./EditorWorkspaceShared";
import EditorWorkspaceFileManager from "./EditorWorkspaceFileManager";
import { editorWorkspaceDemoGateway } from "./editorWorkspaceAdapter";

type Section = "Overview" | "File Manager" | "Review";

export default function EditorWorkspaceDetails({
  id,
  role,
}: {
  id: string;
  role: EditorWorkspaceRole;
}) {
  const router = useRouter();
  const { isDark, mounted } = useEditorWorkspaceTheme();
  const record = useWorkspaceRecord(id, role);
  const shoot = getWorkspaceShoot(id, role);
  const [tab, setTab] = useState<Section>("Overview");
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDemoReview, setShowDemoReview] = useState(false);
  const accessible = shoot && (role === "internal" || shoot.externalAssignment);
  const own =
    role === "external"
      ? Boolean(shoot?.externalAssignment)
      : Boolean(shoot?.internalAssignment);
  const accepted = role === "internal" || shoot?.agreementStatus === "Accepted";
  const canWork = Boolean(own && accepted);
  const stage = (record.editingStatus ||
    shoot?.editingStatus ||
    "Not Started") as EditingStage;
  const isPending = role === "external" && shoot?.agreementStatus === "Pending";
  const isRejected =
    role === "external" && shoot?.agreementStatus === "Rejected";
  const activity = getWorkspaceActivity(id, role);

  if (!mounted)
    return (
      <>
        <EditorWorkspaceTopbar title="Shoot Details" />
        <div className="p-8 text-sm">Loading shoot details...</div>
      </>
    );
  if (!shoot || !accessible)
    return (
      <>
        <EditorWorkspaceTopbar title="Shoot Details" />
        <div className="p-8">
          <p>This shoot is unavailable for the selected demo editor.</p>
          <button
            className="mt-4 text-[#E8D1AB]"
            onClick={() => router.push(workspaceUrl(role))}
          >
            Back to workspace
          </button>
        </div>
      </>
    );

  const move = async (next: EditingStage) => {
    if (!canWork)
      return toast.error("Accept the agreement before starting work.");
    const allowed: Partial<Record<EditingStage, EditingStage[]>> = {
      "Not Started": ["In Progress"],
      "In Progress": ["Submitted"],
      "Revision Requested": ["Resubmitted"],
      Approved: ["Completed"],
    };
    if (!(allowed[stage] || []).includes(next))
      return toast.error("This transition is not available to the editor.");
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await editorWorkspaceDemoGateway.changeEditingStatus(
        role,
        id,
        next,
      );
      if (!result.success)
        toast.error(result.message || "Unable to update the status.");
      else toast.success(`Editing status updated to ${next} (demo).`);
    } finally {
      setIsUpdating(false);
    }
  };

  const review = (decision: "Revision Requested" | "Approved") => {
    if (!canWork || !(stage === "Submitted" || stage === "Resubmitted")) return;
    if (decision === "Revision Requested" && !note.trim()) {
      toast.error("Enter reviewer feedback first.");
      return;
    }
    updateWorkspaceRecord(
      id,
      { reviewerNotes: note.trim(), reviewedAt: new Date().toISOString() },
      role,
    );
    setWorkspaceEditingStage(id, decision, role);
    appendWorkspaceActivity(
      id,
      decision === "Approved"
        ? "Editor work approved (simulated)."
        : "Revision requested (simulated).",
      note.trim() || "No additional notes",
      "editing",
      role,
    );
    setShowDemoReview(false);
    setNote("");
    toast.success("Demo reviewer feedback recorded.");
  };

  const action = (() => {
    if (stage === "Not Started")
      return { text: "Start Editing", to: "In Progress" as EditingStage };
    if (stage === "In Progress")
      return { text: "Submit for Review", to: "Submitted" as EditingStage };
    if (stage === "Revision Requested")
      return { text: "Resubmit Work", to: "Resubmitted" as EditingStage };
    if (stage === "Approved")
      return { text: "Mark Completed", to: "Completed" as EditingStage };
    return null;
  })();
  const tabs: Section[] = ["Overview", "File Manager", "Review"];
  return (
    <>
      <EditorWorkspaceTopbar
        title={`Shoot Details - ${shoot.name}`}
        showActivity
        onActivity={() => router.push(workspaceUrl(role, id, "activity"))}
      />
      <main className="mx-auto w-full max-w-[1700px] space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(workspaceUrl(role))}
            className="inline-flex items-center gap-2 py-1 text-sm transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="button"
            onClick={() => router.push(workspaceUrl(role, id, "activity"))}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#E8D1AB] px-3 text-xs font-medium text-black lg:hidden"
          >
            <Clock3 size={15} />
            View Activity
          </button>
        </div>
        {role === "external" && (
          <div
            className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 ${workspaceSurface(isDark)}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-1 h-7 w-1 shrink-0 rounded-full bg-[#E8D1AB]" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#E8D1AB]">
                  Shoot Agreement{" "}
                  <StatusPill
                    status={shoot.agreementStatus}
                    className="ml-2 px-2 py-1 text-[10px]"
                  />
                </p>
                <p className="mt-1 text-sm font-medium">
                  {shoot.name} – {shoot.service}
                </p>
                {isRejected && (
                  <p className="mt-2 text-xs text-red-400">
                    Rejected: {record.rejectionReason || "Agreement declined"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs ${workspaceMuted(isDark)}`}>
                {shoot.agreementVersion} · Demo agreement
              </span>
              <button
                type="button"
                onClick={() =>
                  router.push(workspaceUrl("external", id, "agreement"))
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-5 text-xs font-semibold text-black hover:bg-[#ECECEC]"
              >
                View Agreement <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        <div
          className={`overflow-x-auto rounded-xl border p-4 ${isDark ? "border-[#222222] bg-[#1E1E1E]" : "border-[#E7E7E7] bg-white"}`}
        >
          <div className="flex min-w-[770px] items-start gap-0">
            {EDITING_STAGES.map((label, index) => (
              <React.Fragment key={label}>
                <div
                  className="flex shrink-0 flex-col items-center gap-2 text-center"
                  style={{ width: index === 0 ? 86 : 119 }}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${index <= EDITING_STAGES.indexOf(stage) ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#111111]" : "border-[#333333] text-[#707070]"}`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-xs ${index === EDITING_STAGES.indexOf(stage) ? "text-[#E8D1AB]" : workspaceMuted(isDark)}`}
                  >
                    {label}
                  </span>
                </div>
                {index < EDITING_STAGES.length - 1 && (
                  <div
                    className={`mt-3 h-px min-w-[27px] flex-1 ${isDark ? "bg-[#424242]" : "bg-[#D8D8D8]"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <nav
          role="tablist"
          aria-label="Editor shoot details"
          className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border p-1 no-scrollbar ${workspaceSurface(isDark)}`}
        >
          {tabs.map((label) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={`editor-shoot-tab-${label.replace(/\s+/g, "-").toLowerCase()}`}
              aria-selected={tab === label}
              aria-controls="editor-shoot-tab-content"
              onClick={() => setTab(label)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition-colors ${
                tab === label
                  ? "bg-[#E8D1AB] text-black"
                  : workspaceMuted(isDark)
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div
          id="editor-shoot-tab-content"
          role="tabpanel"
          aria-labelledby={`editor-shoot-tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
          className="min-w-0"
        >
          {tab === "Overview" && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <div className="space-y-4">
                <section
                  className={`overflow-hidden rounded-xl border ${workspaceSurface(isDark)}`}
                >
                  <h2
                    className={`border-b px-4 py-4 text-sm font-semibold ${isDark ? "border-[#252525]" : "border-[#ECECEC]"}`}
                  >
                    Shoot Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4 px-4 py-4 text-sm sm:grid-cols-3">
                    {[
                      ["PROJECT / SHOOT", shoot.name],
                      ["PRODUCER", shoot.producer],
                      ["CREATIVE PARTNER", shoot.creativePartner],
                    ].map(([title, value]) => (
                      <div key={title}>
                        <p
                          className={`text-[11px] uppercase ${workspaceMuted(isDark)}`}
                        >
                          {title}
                        </p>
                        <p className="mt-1 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section
                  className={`overflow-hidden rounded-xl border ${workspaceSurface(isDark)}`}
                >
                  <h2
                    className={`border-b px-4 py-4 text-sm font-semibold ${isDark ? "border-[#252525]" : "border-[#ECECEC]"}`}
                  >
                    Editing Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4 px-4 py-5 text-sm sm:grid-cols-2">
                    {[
                      ["EDITING REQUIREMENTS", shoot.editingRequirements],
                      ["DELIVERABLES", shoot.deliverables],
                      ["REQUIRED FORMAT", shoot.requiredFormat],
                      ["DUE DATE", shoot.dueDate],
                      ["REVISION REQUIREMENTS", shoot.revisionRequirements],
                      ["BRIEF / INSTRUCTIONS", shoot.brief],
                    ].map(([title, value]) => (
                      <div key={title}>
                        <p
                          className={`text-[11px] uppercase ${workspaceMuted(isDark)}`}
                        >
                          {title}
                        </p>
                        <p
                          className="mt-1 line-clamp-3 font-medium"
                          title={value}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-4 ${workspaceSurface(isDark)}`}
                >
                  <div className="flex items-center gap-2">
                    <StatusPill status={stage} />
                    <span className={`text-xs ${workspaceMuted(isDark)}`}>
                      {canWork
                        ? "Assignment available for editing"
                        : isPending
                          ? "Agreement acceptance is required"
                          : isRejected
                            ? "Agreement was rejected"
                            : "Read-only shoot"}
                    </span>
                  </div>
                  {action && (
                    <button
                      type="button"
                      disabled={!canWork || isUpdating}
                      onClick={() => void move(action.to)}
                      className={`h-10 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${workspaceAccent}`}
                    >
                      {action.text}
                    </button>
                  )}
                </div>
              </div>
              <aside
                className={`h-fit rounded-xl border p-5 ${isDark ? "border-[#333028] bg-[#1D1B18]" : "border-[#E5DECF] bg-[#FFF9F0]"}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3A3227] text-[#E8D1AB]">
                  <Bell size={16} />
                </div>
                <p
                  className={`mt-4 text-xs uppercase tracking-wider ${workspaceMuted(isDark)}`}
                >
                  Email Notification Preview
                </p>
                <p className="mt-2 text-sm font-semibold">
                  You&apos;ve Been Assigned as Editor – {shoot.name}
                </p>
                <p
                  className={`mt-3 text-xs leading-5 ${workspaceMuted(isDark)}`}
                >
                  Sample content only. No actual email has been sent.
                </p>
              </aside>
            </div>
          )}
          {tab === "File Manager" && (
            <EditorWorkspaceFileManager
              shootId={id}
              role={role}
              isDark={isDark}
              canUpload={canWork}
            />
          )}
          {tab === "Review" && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(270px,1fr)]">
              <section
                className={`rounded-xl border p-5 ${workspaceSurface(isDark)}`}
              >
                <h2 className="text-base font-semibold">Editing Review</h2>
                <p className={`mt-2 text-sm ${workspaceMuted(isDark)}`}>
                  Editing status and feedback for this shoot. Final approval is
                  owned by the reviewer, not the editor.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <StatusPill status={stage} />
                  <span className={`text-xs ${workspaceMuted(isDark)}`}>
                    {record.reviewedAt
                      ? `Last review: ${new Date(record.reviewedAt).toLocaleString()}`
                      : "No recorded review yet"}
                  </span>
                </div>
                <div
                  className={`mt-4 rounded-lg border px-4 py-4 ${isDark ? "border-[#333333] bg-[#171717]" : "border-[#E5E5E5] bg-[#F7F7F7]"}`}
                >
                  <p className="text-sm font-semibold">Reviewer Feedback</p>
                  <p className={`mt-2 text-sm ${workspaceMuted(isDark)}`}>
                    {record.reviewerNotes ||
                      "No reviewer feedback has been submitted."}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {action && (
                    <button
                      disabled={!canWork || isUpdating}
                      onClick={() => void move(action.to)}
                      className={`h-10 rounded-lg px-4 text-sm disabled:opacity-40 ${workspaceAccent}`}
                    >
                      {action.text}
                    </button>
                  )}
                  {canWork &&
                    (stage === "Submitted" || stage === "Resubmitted") && (
                      <button
                        type="button"
                        onClick={() => setShowDemoReview(!showDemoReview)}
                        className={`h-10 rounded-lg border px-4 text-xs ${workspaceSecondary(isDark)}`}
                      >
                        Simulate Reviewer Decision
                      </button>
                    )}
                </div>
                {showDemoReview && (
                  <div
                    className={`mt-4 space-y-3 rounded-xl border p-4 ${workspaceSurface(isDark)}`}
                  >
                    <p className="text-xs font-semibold text-[#E8D1AB]">
                      Static demo reviewer controls (not available to editors in
                      production)
                    </p>
                    <WorkspaceTextarea
                      isDark={isDark}
                      aria-label="Reviewer feedback"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Feedback for requested revisions"
                      className="w-full px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => review("Revision Requested")}
                        className={`rounded-lg border px-4 py-2 text-xs ${workspaceSecondary(isDark)}`}
                      >
                        <RotateCcw size={14} className="mr-1 inline" />
                        Request Revision
                      </button>
                      <button
                        onClick={() => review("Approved")}
                        className={`rounded-lg px-4 py-2 text-xs ${workspaceAccent}`}
                      >
                        <CheckCircle2 size={14} className="mr-1 inline" />
                        Approve
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <aside
                className={`h-fit rounded-xl border p-5 ${workspaceSurface(isDark)}`}
              >
                <h3 className="text-sm font-semibold">Recent Activity</h3>
                <div className="mt-4 space-y-4">
                  {activity.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="border-l-2 border-[#E8D1AB] pl-3"
                    >
                      <p className="text-xs font-medium">{item.title}</p>
                      <p
                        className={`mt-1 text-[11px] ${workspaceMuted(isDark)}`}
                      >
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(workspaceUrl(role, id, "activity"))
                  }
                  className="mt-5 inline-flex items-center gap-2 text-xs text-[#E8D1AB]"
                >
                  View all activity <ChevronRight size={14} />
                </button>
              </aside>
            </div>
          )}
        </div>
        {!canWork && role === "external" && (
          <div
            className={`flex items-start gap-2 rounded-xl border p-4 text-xs ${workspaceSurface(isDark)}`}
          >
            <LockKeyhole size={17} className="shrink-0 text-[#E8D1AB]" />
            <p>
              {isPending
                ? "To start editing or upload files, review and accept your assignment agreement first."
                : "This agreement was rejected. The producer must send a new agreement before editing can begin."}{" "}
              <button
                onClick={() =>
                  router.push(workspaceUrl("external", id, "agreement"))
                }
                className="ml-1 underline text-[#E8D1AB]"
              >
                View agreement
              </button>
            </p>
          </div>
        )}
      </main>
    </>
  );
}
