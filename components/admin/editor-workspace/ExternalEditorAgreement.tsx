"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AssignmentSuccessAnimation from "@/components/admin/shoot-details/AssignmentSuccessAnimation";
import {
  formatUSD,
  getEditor,
} from "@/components/admin/shoot-details/postProductionDemoStore";
import {
  getWorkspaceShoot,
  getPreviewEditorId,
  useWorkspaceRecord,
} from "./editorWorkspaceDemoStore";
import { editorWorkspaceDemoGateway } from "./editorWorkspaceAdapter";
import {
  EditorWorkspaceTopbar,
  StatusPill,
  useEditorWorkspaceTheme,
  workspaceUrl,
  workspaceMuted,
  workspaceSurface,
  WorkspaceTextarea,
  workspaceAccent,
  workspaceSecondary,
} from "./EditorWorkspaceShared";

type Result = "accepted" | "rejected" | null;

export default function ExternalEditorAgreement({
  id,
  role,
}: {
  id: string;
  role: "internal" | "external";
}) {
  const router = useRouter();
  const { isDark, mounted } = useEditorWorkspaceTheme();
  const record = useWorkspaceRecord(id, "external");
  const shoot = getWorkspaceShoot(id, "external");
  const [acknowledged, setAcknowledged] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const status = shoot?.agreementStatus || record.agreementStatus || "Pending";
  const back = () => router.push(workspaceUrl("external", id));

  if (!mounted)
    return (
      <>
        <EditorWorkspaceTopbar title="Review Agreement" />
        <div className="p-8 text-sm">Loading agreement...</div>
      </>
    );

  if (role !== "external")
    return (
      <>
        <EditorWorkspaceTopbar title="Review Agreement" />
        <div className="p-8 text-sm">
          Only External Editors can access the agreement flow.
          <button
            type="button"
            onClick={() => router.push(workspaceUrl("internal"))}
            className="ml-2 underline text-[#E8D1AB]"
          >
            Back to Shoots
          </button>
        </div>
      </>
    );

  if (!shoot || !shoot.externalAssignment)
    return (
      <>
        <EditorWorkspaceTopbar title="Review Agreement" />
        <div className="p-8 text-sm">
          This agreement is unavailable for the selected demo editor.
        </div>
      </>
    );

  const accept = async () => {
    if (!acknowledged || status !== "Pending") return;
    if (busy) return;
    setBusy(true);
    try {
      const response = await editorWorkspaceDemoGateway.decideAgreement(
        id,
        "accept",
      );
      if (!response.success)
        toast.error(response.message || "Unable to accept the agreement.");
      else {
        setResult("accepted");
        toast.success("Agreement accepted in this browser tab (demo only).");
      }
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (reason.trim().length < 10) {
      toast.error("Enter at least 10 characters explaining your rejection.");
      return;
    }
    if (status !== "Pending") return;
    if (busy) return;
    setBusy(true);
    try {
      const response = await editorWorkspaceDemoGateway.decideAgreement(
        id,
        "reject",
        reason.trim(),
      );
      if (!response.success)
        toast.error(response.message || "Unable to reject the agreement.");
      else {
        setRejectOpen(false);
        setResult("rejected");
      }
    } finally {
      setBusy(false);
    }
  };

  const lines: Array<[string, string]> = [
    ["Project Name", `${shoot.name} – ${shoot.service}`],
    ["Shoot ID", `#${shoot.id}`],
    ["Assignment ID", `ASN-${shoot.id}`],
    [
      "Editor Name",
      getEditor(getPreviewEditorId("external"))?.name || "External Editor",
    ],
    ["Role", "External Editor"],
  ];

  return (
    <>
      <EditorWorkspaceTopbar title="Review Agreement" />
      <main className="mx-auto w-full max-w-[1220px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 py-1 text-sm"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <article
          className={`overflow-hidden rounded-2xl border ${
            isDark
              ? "border-[#313131] bg-[#1B1B1B]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          <header
            className={`flex flex-wrap items-start justify-between gap-3 px-6 py-6 ${
              isDark ? "bg-[#232323]" : "bg-[#F3F3F3]"
            }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${workspaceMuted(isDark)}`}
              >
                Shoot Assignment Agreement
              </p>
              <h1 className="mt-2 text-2xl font-medium">
                {shoot.name}
              </h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-[14px] ${
                  isDark
                    ? "bg-[#3B3B3B] text-[#EAEAEA]"
                    : "bg-[#E0E0E0] text-[#454545]"
                }`}
              >
                {shoot.agreementVersion}
              </span>
              <StatusPill status={status} className="py-1 text-xs" />
            </div>
          </header>

          <section
            className={`border-b border-dashed px-6 py-6 ${
              isDark ? "border-[#444444]" : "border-[#E8E8E8]"
            }`}
          >
            <h2 className="text-base font-medium">Project Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {lines.map(([name, value]) => (
                <p key={name} className="min-w-0">
                  <span className={workspaceMuted(isDark)}>{name}: </span>
                  <span className="font-medium">{value}</span>
                </p>
              ))}
            </div>
          </section>

          <section
            className={`border-b border-dashed px-6 py-6 ${
              isDark ? "border-[#444444]" : "border-[#E8E8E8]"
            }`}
          >
            <h2 className="mb-4 text-base font-medium">Compensation</h2>
            <div
              className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-5 ${
                isDark
                  ? "border-[#615647] bg-[#292723]"
                  : "border-[#D7C2A1] bg-[#FBF3E5]"
              }`}
            >
              <span className="text-sm">Total Compensation</span>
              <span className="text-xl font-semibold text-[#E8D1AB]">
                {formatUSD(shoot.compensation)}
              </span>
            </div>
          </section>

          {shoot.agreementSections
            .filter((part) => part.id !== "version")
            .map((part) => (
              <section
                key={part.id}
                className={`border-b border-dashed px-6 py-7 ${
                  isDark ? "border-[#444444]" : "border-[#E8E8E8]"
                }`}
              >
                <h2 className="text-base font-medium">{part.title}</h2>
                <div
                  className={`mt-3 rounded-lg border px-4 py-3 text-sm leading-6 ${
                    isDark
                      ? "border-[#675D50] bg-[#292723] text-[#AFAFAF]"
                      : "border-[#D3C4AE] bg-[#F9F4EC] text-[#5D5D5D]"
                  }`}
                >
                  {part.content}
                  {part.deliverableDate && (
                    <div className="mt-1 text-xs text-[#E8D1AB]">
                      Deliver by: {part.deliverableDate}
                    </div>
                  )}
                </div>
              </section>
            ))}

          <footer className="space-y-4 px-6 py-7">
            <p className={`text-sm leading-6 ${workspaceMuted(isDark)}`}>
              This Shoot Assignment Agreement is issued under the Beige Creative
              Partner General Agreement. The static preview does not create a
              binding signature or send any email. Backend verification and an
              authenticated signature will be required in production.
            </p>
            <div className="flex flex-wrap gap-5 text-xs">
              <p>
                <span className="block text-[#E8D1AB]">
                  Beige Sheet Version
                </span>
                {shoot.agreementVersion}
              </p>
              <p>
                <span className="block text-[#E8D1AB]">Created</span>
                15 Sep 2026, 12:20 PM
              </p>
            </div>
          </footer>
        </article>

        <section
          className={`rounded-xl border p-5 ${workspaceSurface(isDark)}`}
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#E8D1AB]">
            Assignment Acceptance
          </h2>
          {status === "Pending" ? (
            <>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="assignment-acceptance-checkbox"
                  checked={acknowledged}
                  onCheckedChange={(checked) =>
                    setAcknowledged(checked === true)
                  }
                  disabled={busy}
                  aria-label="I agree to the Shoot Assignment Agreement terms"
                  className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border bg-transparent transition-colors hover:border-[#E8D1AB] focus-visible:ring-[#E8D1AB]/40 focus-visible:ring-offset-0 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-[#101010] ${
                    isDark
                      ? "border-white/30"
                      : "border-[#A9A9A9]"
                  }`}
                />
                <Label
                  htmlFor="assignment-acceptance-checkbox"
                  className={`min-w-0 flex-1 cursor-pointer text-xs font-normal leading-5 sm:leading-6 ${
                    isDark ? "text-[#EAEAEA]" : "text-[#323232]"
                  }`}
                >
                  By selecting “Accept Assignment,” I confirm that I have
                  reviewed this Beige Sheet and agree to perform this Assignment
                  according to its terms and the Beige Creative Partner
                  Agreement. This is a static UI preview and no legally binding
                  acceptance occurs.
                </Label>
              </div>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <button
                  type="button"
                  disabled={!acknowledged || busy}
                  onClick={() => void accept()}
                  className="h-11 rounded-lg bg-[#11B886] px-4 text-sm font-semibold text-white hover:bg-[#0B9F75] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Accept Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  className="h-11 rounded-lg bg-[#ED3B4B] px-5 text-sm font-medium text-white hover:bg-[#D83442]"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill status={status} />
                <p className={`mt-2 text-sm ${workspaceMuted(isDark)}`}>
                  {status === "Accepted"
                    ? "This agreement has already been accepted in the demo."
                    : `Reason: ${record.rejectionReason || "Agreement rejected"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={back}
                className={`h-11 rounded-lg px-4 ${workspaceAccent}`}
              >
                View Shoot
              </button>
            </div>
          )}
        </section>
      </main>

      {rejectOpen && (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-reason-title"
          onClick={() => setRejectOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[calc(100dvh-24px)] w-full max-w-[610px] flex-col overflow-hidden rounded-2xl border ${
              isDark
                ? "border-[#3B3B3B] bg-black"
                : "border-[#E5E5E5] bg-white"
            }`}
          >
            <div className="min-h-0 space-y-4 overflow-y-auto px-5 pt-6 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#311B1B] p-2 text-[#EF5B64]">
                  <AlertCircle size={20} />
                </span>
                <h2 id="reject-reason-title" className="text-lg font-semibold">
                  Why are you rejecting this agreement?
                </h2>
              </div>
              <p className={`text-sm leading-6 ${workspaceMuted(isDark)}`}>
                Your reason will be saved in this demo activity history and
                available to the assignment team after future API integration.
              </p>
              <label className={`block text-sm ${workspaceMuted(isDark)}`}>
                Rejection reason*
                <WorkspaceTextarea
                  isDark={isDark}
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Explain why you cannot accept the agreement"
                  className="mt-2 w-full resize-y px-3 py-3"
                />
              </label>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 p-5 sm:px-6">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className={`h-11 rounded-lg border ${workspaceSecondary(isDark)}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim().length < 10 || busy}
                onClick={() => void reject()}
                className={`h-11 rounded-lg disabled:opacity-40 ${workspaceAccent}`}
              >
                Reject Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agreement-result-title"
        >
          <div
            className={`flex max-h-[calc(100dvh-24px)] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border px-6 py-9 text-center ${
              isDark
                ? "border-[#414141] bg-black"
                : "border-[#E6E6E6] bg-white"
            }`}
          >
            <div className="min-h-0 overflow-y-auto">
              <AssignmentSuccessAnimation />
              <h2
                id="agreement-result-title"
                className="mt-7 text-2xl font-medium"
              >
                {result === "accepted"
                  ? "Assignment Accepted Successfully"
                  : "Agreement Rejected"}
              </h2>
              <p
                className={`mx-auto mt-3 max-w-[380px] text-sm leading-6 ${workspaceMuted(isDark)}`}
              >
                {result === "accepted"
                  ? "The agreement is now accepted in your browser preview. The editing workspace is unlocked."
                  : "Your rejection reason was saved to this browser preview. The assignment team can review it after API integration."}
              </p>
            </div>
            <button
              type="button"
              onClick={back}
              className={`mt-7 h-12 shrink-0 rounded-lg ${workspaceAccent}`}
            >
              View Shoot
            </button>
          </div>
        </div>
      )}
    </>
  );
}
