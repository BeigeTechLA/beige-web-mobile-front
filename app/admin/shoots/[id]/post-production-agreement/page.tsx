"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Bold,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  Italic,
  List,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import EditorAvatar from "@/components/admin/shoot-details/EditorAvatar";
import AssignmentSuccessAnimation from "@/components/admin/shoot-details/AssignmentSuccessAnimation";
import {
  DEFAULT_SECTIONS,
  createDemoAssignment,
  formatUSD,
  getCompensationTotal,
  getDemoAssignments,
  getEditor,
  upsertDemoAssignment,
  useDemoEditorAssignments,
  hasPendingEditorQueue,
  type AgreementSection,
  type AgreementMode,
  type EditorAssignment,
} from "@/components/admin/shoot-details/postProductionDemoStore";

type Step = "mode" | "details" | "review";

export default function PostProductionAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(
    searchParams.get("view") === "review" ? "review" : "mode",
  );
  const [mode, setMode] = useState<AgreementMode>("individual");
  const [sections, setSections] = useState<AgreementSection[]>(() =>
    DEFAULT_SECTIONS.map((part) => ({ ...part })),
  );
  const [openSection, setOpenSection] = useState<string | null>("scope");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const assignments = useDemoEditorAssignments(id);
  const requestedEditorId = Number(searchParams.get("editor") || "0");
  const editor = getEditor(requestedEditorId) || {
    id: 0,
    name: "Unknown Editor",
    category: "external" as const,
    specialty: "",
    activeShoots: 0,
    availability: "available" as const,
  };
  const projectName = searchParams.get("project") || "Wedding Videography";
  const existing =
    assignments.find((item) => item.editorId === editor.id) ||
    (mounted
      ? getDemoAssignments(id).find((item) => item.editorId === editor.id)
      : undefined);
  const agreementEligible =
    editor.category === "external" &&
    Boolean(existing?.compensation && existing.workflow === "agreement");
  const externalAssignments = assignments.filter(
    (a) =>
      getEditor(a.editorId)?.category === "external" &&
      a.workflow === "agreement" &&
      a.compensation !== null &&
      (a.editorId === editor.id || a.agreementStatus !== "pending"),
  );
  const recipients = useMemo(
    () =>
      mode === "common"
        ? externalAssignments.length
          ? externalAssignments
          : [existing || createDemoAssignment(editor.id)]
        : [existing || createDemoAssignment(editor.id)],
    [mode, existing, externalAssignments, editor.id],
  );
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const total = existing?.compensation
    ? getCompensationTotal(existing.compensation)
    : getCompensationTotal(
        createDemoAssignment(editor.id).compensation || {
          method: "equal",
          rateMethod: "flat",
          base: 5000,
          hourlyRate: 100,
          hours: 50,
          editing: 750,
          travel: 500,
          bonus: 0,
          notes: "",
          totalShootBudget: 50000,
          advance: null,
        },
      );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const found = getDemoAssignments(id).find(
      (item) => item.editorId === editor.id,
    );
    if (found?.agreementSections?.length)
      setSections(found.agreementSections.map((part) => ({ ...part })));
    if (found?.agreementMode) setMode(found.agreementMode);
  }, [id, editor.id]);

  const backToShoot = () =>
    router.push(
      `/admin/shoots/${encodeURIComponent(id)}?tab=Overview${hasPendingEditorQueue(id) ? "&resumeEditorFlow=1" : ""}`,
    );
  const goBack = () => {
    if (step === "review") setStep("details");
    else if (step === "details") setStep("mode");
    else backToShoot();
  };
  const updateSection = (sectionId: string, patch: Partial<AgreementSection>) =>
    setSections((current) =>
      current.map((part) =>
        part.id === sectionId ? { ...part, ...patch } : part,
      ),
    );
  const saveAgreement = (status: "draft" | "pending") => {
    if (!agreementEligible) return;
    for (const recipient of recipients) {
      const value: EditorAssignment = {
        ...recipient,
        editorId: recipient.editorId,
        projectName: projectName || recipient.projectName,
        status: status === "pending" ? "Pending" : recipient.status,
        agreementMode: mode,
        agreementStatus: status,
        agreementVersion: "v1.0",
        agreementSections: sections.map((item) => ({ ...item })),
      };
      upsertDemoAssignment(id, value);
    }
  };
  const handleDraft = () => {
    saveAgreement("draft");
    toast.success("Agreement draft saved in this browser session (demo).");
  };
  const handleSend = () => {
    if (!agreementEligible) {
      toast.error("Compensation and a valid External Editor are required.");
      return;
    }
    saveAgreement("pending");
    setConfirmOpen(false);
    setSuccessOpen(true);
  };
  const advance = () => {
    if (step === "mode") setStep("details");
    else if (step === "details") setStep("review");
  };
  const primary = "bg-[#E8D1AB] text-black hover:bg-[#D9C39F]";
  const secondary = isDark
    ? "border border-[#474747] bg-[#171717] text-white hover:bg-[#292929]"
    : "border border-[#DDDDDD] bg-white text-black hover:bg-[#F5F5F5]";
  const card = isDark
    ? "border-[#303030] bg-[#171717]"
    : "border-[#E5E5E5] bg-white";
  const muted = isDark ? "text-[#919191]" : "text-[#666666]";
  const field = isDark
    ? "border-[#2D2D2D] bg-[#0C0C0C] text-white"
    : "border-[#DDDDDD] bg-[#FAFAFA] text-black";

  if (!mounted) return null;
  if (!agreementEligible)
    return (
      <>
        <Topbar pathname={pathname} title="Shoot Agreement" />
        <main
          className={`min-h-[calc(100dvh-64px)] px-4 py-10 sm:px-8 ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}
        >
          <div className="mx-auto max-w-2xl rounded-xl border border-[#444444] p-6">
            <h1 className="text-xl font-semibold">Agreement not available</h1>
            <p className={`mt-2 text-sm ${muted}`}>
              {editor.id === 0
                ? "Select a valid editor from Shoot Details."
                : editor.category !== "external"
                  ? "Shoot Agreements are only available for External Editors. Internal Editors use the normal assignment flow."
                  : "Complete the External Editor compensation step from Shoot Details before creating an agreement."}
            </p>
            <Button
              type="button"
              onClick={backToShoot}
              className={`mt-6 rounded-lg ${primary}`}
            >
              Back to Shoot
            </Button>
          </div>
        </main>
      </>
    );
  return (
    <>
      <Topbar
        pathname={pathname}
        title="Shoot Agreement"
        actions={
          step === "details" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleDraft}
                className={`h-10 rounded-lg px-4 text-xs sm:text-sm ${secondary}`}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => setStep("review")}
                className={`h-10 rounded-lg px-4 text-xs sm:text-sm ${isDark ? "bg-white text-black" : "bg-[#171717] text-white"}`}
              >
                Preview
              </Button>
            </div>
          ) : undefined
        }
      />
      <main
        className={`min-h-[calc(100dvh-64px)] px-4 py-5 pb-28 sm:px-6 lg:px-10 lg:py-8 ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="mx-auto max-w-[1140px] space-y-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm hover:text-[#E8D1AB]"
          >
            <ArrowLeft size={19} /> Back
          </button>
          {step === "mode" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-[#444444] pb-7">
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">
                    Add Shoot Agreement
                  </h1>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Configure the Shoot Assignment Agreement
                  </p>
                </div>
                <span className="rounded-lg bg-[#E8D1AB] px-4 py-3 text-xs font-semibold text-black sm:text-sm">
                  Version v1.0 (auto-generated)
                </span>
              </div>
              <section className={`overflow-hidden rounded-xl border ${card}`}>
                <header
                  className={`border-b px-5 py-5 ${isDark ? "border-[#333333] bg-[#090909]" : "border-[#E5E5E5]"}`}
                >
                  <h2 className="text-base font-semibold">
                    Agreement Creation
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Choose whether to create separate agreements or one common
                    agreement for the selected editors.
                  </p>
                </header>
                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  {(["individual", "common"] as const).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setMode(option)}
                      aria-pressed={mode === option}
                      className={`space-y-4 rounded-xl border p-4 text-left transition-colors ${mode === option ? (isDark ? "border-[#9A815C] bg-[#1C1A16]" : "border-[#BA9564] bg-[#FFF8ED]") : isDark ? "border-[#484848] bg-[#111111]" : "border-[#DDDDDD] bg-white"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${mode === option ? "border-[#E8D1AB]" : "border-[#777777]"}`}
                          >
                            {mode === option && (
                              <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />
                            )}
                          </span>
                          <strong className="text-sm text-[#E8D1AB]">
                            {option === "individual"
                              ? "Individual Agreements"
                              : "Common Agreement"}
                          </strong>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${isDark ? "bg-[#2C2B29] text-[#B6A58E]" : "bg-[#ECE6DC] text-[#7A674C]"}`}
                        >
                          {option === "individual"
                            ? "Recommended"
                            : "Shared terms"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold">
                        {option === "individual"
                          ? "One agreement per Editor"
                          : "One agreement for multiple Editors"}
                      </p>
                      <p className={`text-xs leading-6 ${muted}`}>
                        {option === "individual"
                          ? "Create separate agreements so compensation, scope and deadlines can be managed individually."
                          : "Create a common agreement covering the selected external editors. Each editor accepts independently."}
                      </p>
                      <div className="flex items-center gap-2 border-t border-[#333333] pt-4">
                        <EditorAvatar name={editor.name} className="h-6 w-6" />
                        <span
                          className={`min-w-0 flex-1 truncate text-xs ${muted}`}
                        >
                          {option === "common"
                            ? `${recipients.length} editor(s)`
                            : editor.name}
                        </span>
                        <span className="rounded-md bg-[#262626] px-2 py-1 text-xs text-[#999999]">
                          Agreement 01
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div
                  className={`mx-4 mb-5 flex flex-wrap gap-4 rounded-lg border p-4 text-xs sm:mx-5 ${isDark ? "border-[#242424] bg-[#0B0B0B]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}
                >
                  <span>
                    Mode:{" "}
                    <strong>
                      {mode === "individual"
                        ? "Individual Agreements"
                        : "Common Agreement"}
                    </strong>
                  </span>
                  <span>
                    External Editor: <strong>{recipients.length}</strong>
                  </span>
                  <span>
                    Agreements to create:{" "}
                    <strong>
                      {mode === "individual" ? recipients.length : 1}
                    </strong>
                  </span>
                  <span>
                    Acceptance: <strong>Each Editor individually</strong>
                  </span>
                </div>
              </section>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={backToShoot}
                  className={`h-12 min-w-[160px] rounded-lg ${secondary}`}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={advance}
                  className={`h-12 rounded-lg px-6 ${primary}`}
                >
                  Continue to Add Agreement
                </Button>
              </div>
            </>
          )}

          {step === "details" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#444444] pb-7">
                <div>
                  <h1 className="text-lg font-semibold sm:text-xl">
                    Agreement for {editor.name}{" "}
                    <span className="text-[#E8D1AB]">
                      (
                      {mode === "individual"
                        ? "Individual Agreement"
                        : "Common Agreement"}
                      )
                    </span>
                  </h1>
                  <p className={`mt-1 text-sm ${muted}`}>
                    External Editor · ASSIGN-{editor.id}
                  </p>
                </div>
                <span className="rounded-lg bg-[#E8D1AB] px-4 py-3 text-xs font-semibold text-black">
                  Version v1.0 (auto-generated)
                </span>
              </div>
              <section className={`overflow-hidden rounded-xl border ${card}`}>
                <div className="border-b border-dashed border-[#454545] px-5 py-5 text-base font-semibold">
                  Project Detail
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 py-6 text-sm">
                  <span>
                    Project Name: <strong>{projectName}</strong>
                  </span>
                  <span className={muted}>|</span>
                  <span>
                    Shoot ID: <strong>#{id}</strong>
                  </span>
                  <span className={muted}>|</span>
                  <span>
                    Assignment ID: <strong>ASN-{editor.id}</strong>
                  </span>
                  <span className={muted}>|</span>
                  <span>
                    Editor Name: <strong>{editor.name}</strong>
                  </span>
                  <span className={muted}>|</span>
                  <span>
                    Role: <strong>External Editor</strong>
                  </span>
                </div>
              </section>
              <section className={`overflow-hidden rounded-xl border ${card}`}>
                <div className="border-b border-dashed border-[#454545] px-5 py-5 text-base font-semibold">
                  Compensation
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6">
                  <div className="flex items-center gap-3">
                    <EditorAvatar name={editor.name} className="h-10 w-10" />
                    <span className="text-sm">{editor.name}</span>
                  </div>
                  <span className="rounded-full bg-[#E8D1AB] px-4 py-1.5 text-xs font-semibold text-black">
                    {formatUSD(total)}{" "}
                    <span className="font-normal">Compensation</span>
                  </span>
                </div>
              </section>
              <div className="space-y-3">
                {sections.map((part, index) => (
                  <section
                    key={part.id}
                    className={`overflow-hidden rounded-xl border ${card}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection(openSection === part.id ? null : part.id)
                      }
                      aria-expanded={openSection === part.id}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left"
                    >
                      <GripVertical size={15} className="text-[#777777]" />
                      <span className="text-xs text-[#E8D1AB]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {part.title}
                        </h3>
                        {openSection !== part.id && (
                          <p className={`truncate text-xs ${muted}`}>
                            {part.content}
                          </p>
                        )}
                      </div>
                      <MoreHorizontal size={18} className="text-[#999999]" />
                      {openSection === part.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                    {openSection === part.id && (
                      <div className="space-y-3 border-t border-[#333333] px-4 py-4">
                        <label className={`block text-xs ${muted}`}>
                          Section Title
                          <Input
                            value={part.title}
                            onChange={(event) =>
                              updateSection(part.id, {
                                title: event.target.value,
                              })
                            }
                            className={`mt-1 w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-[#E8D1AB] ${field}`}
                          />
                        </label>
                        {part.id === "deliverables" && (
                          <label className={`block text-xs ${muted}`}>
                            Deliverable Date
                            <Input
                              type="date"
                              value={part.deliverableDate || ""}
                              onChange={(event) =>
                                updateSection(part.id, {
                                  deliverableDate: event.target.value,
                                })
                              }
                              className={`mt-1 w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-[#E8D1AB] ${field}`}
                            />
                          </label>
                        )}
                        <div
                          className={`flex items-center gap-1 rounded-md border p-2 ${field}`}
                        >
                          <button
                            type="button"
                            aria-label="Insert bold markers"
                            title="Insert bold markers"
                            onClick={() =>
                              updateSection(part.id, {
                                content: `**${part.content}**`,
                              })
                            }
                            className="rounded p-1.5 hover:bg-white/10"
                          >
                            <Bold size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label="Insert italic markers"
                            title="Insert italic markers"
                            onClick={() =>
                              updateSection(part.id, {
                                content: `*${part.content}*`,
                              })
                            }
                            className="rounded p-1.5 hover:bg-white/10"
                          >
                            <Italic size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label="Add list item"
                            title="Add list item"
                            onClick={() =>
                              updateSection(part.id, {
                                content: `${part.content}\n- `,
                              })
                            }
                            className="rounded p-1.5 hover:bg-white/10"
                          >
                            <List size={14} />
                          </button>
                        </div>
                        <Textarea
                          rows={4}
                          value={part.content}
                          onChange={(event) =>
                            updateSection(part.id, {
                              content: event.target.value,
                            })
                          }
                          className={`w-full resize-y rounded-md border px-3 py-3 text-sm leading-6 outline-none focus:border-[#E8D1AB] ${field}`}
                        />
                      </div>
                    )}
                  </section>
                ))}
              </div>
              <div
                className={`rounded-xl px-4 py-3 text-sm text-[#E8D1AB] ${isDark ? "bg-[#21211E]" : "bg-[#F4EBDC]"}`}
              >
                <Info size={17} className="mr-2 inline" /> The system generates
                Beige Sheet Version: v1.0 (demo).
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={goBack}
                  className={`h-12 min-w-[160px] rounded-lg ${secondary}`}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={advance}
                  className={`h-12 min-w-[160px] rounded-lg ${primary}`}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-[#444444] pb-7">
                <div>
                  <h1 className="text-xl font-medium">
                    Review Agreement — {editor.name}
                  </h1>
                  <p className={`mt-1 text-xs ${muted}`}>
                    Agreement-1-of-{mode === "common" ? 1 : recipients.length} ·{" "}
                    {editor.specialty} · ASSIGN-{editor.id} · v1.0
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className={`h-10 rounded-lg px-5 text-xs ${primary}`}
                >
                  <Send size={14} className="mr-2" />
                  Send Agreement to Editor
                </Button>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#2D2922] px-3 py-2 text-xs text-[#E8D1AB]">
                <EditorAvatar name={editor.name} className="h-7 w-7" />
                {editor.name}
              </div>
              <article
                className={`overflow-hidden rounded-xl border ${isDark ? "border-[#303030] bg-[#0C0C0C]" : "border-[#E5E5E5] bg-white"}`}
              >
                <header className="border-b border-[#282828] px-5 py-7 sm:px-7">
                  <p className="border-l-2 border-[#E8D1AB] pl-2 text-[11px] font-medium uppercase tracking-wider text-[#E8D1AB]">
                    {mode === "individual" ? "Individual" : "Common"} Shoot
                    Agreement · Beige Sheet
                  </p>
                  <h2 className="mt-5 text-xl">
                    {projectName} – {editor.name}
                  </h2>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {editor.name} · External Editor
                  </p>
                </header>
                <section className="space-y-2 border-b border-[#282828] px-5 py-8 text-sm sm:px-7">
                  <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-[#E8D1AB]">
                    Project Information
                  </h3>
                  {[
                    ["Project Name", projectName],
                    ["Shoot ID", `#${id}`],
                    ["Assignment ID", `ASSIGN-${editor.id}`],
                    ["Editor Name", editor.name],
                    ["Role", "External Editor"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-3"
                    >
                      <span className={muted}>{label}</span>
                      <strong className="font-medium">{value}</strong>
                    </div>
                  ))}
                </section>
                <section className="border-b border-[#282828] px-5 py-8 sm:px-7">
                  <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#E8D1AB]">
                    Commercial Information
                  </h3>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className={muted}>Compensation</span>
                    <strong className="font-medium text-[#E8D1AB]">
                      {formatUSD(total)} (Fixed)
                    </strong>
                  </div>
                </section>
                {sections.map((part) => (
                  <section
                    key={part.id}
                    className="border-b border-[#282828] px-5 py-8 sm:px-7"
                  >
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#E8D1AB]">
                      {part.title}
                    </h3>
                    <p
                      className={`mt-4 whitespace-pre-wrap text-sm leading-6 ${muted}`}
                    >
                      {part.content || "—"}
                    </p>
                    {part.deliverableDate && (
                      <p className={`mt-2 text-xs ${muted}`}>
                        Deliverable date: {part.deliverableDate}
                      </p>
                    )}
                  </section>
                ))}
                <div className="bg-[#E8D1AB] px-5 py-5 text-xs leading-relaxed text-[#5E4C32] sm:px-7">
                  This Shoot Assignment Agreement is issued under the Beige
                  Creative Partner General Agreement. This UI is a static
                  preview and does not send or sign a legally binding agreement.
                </div>
                <footer className="flex gap-8 px-5 py-6 text-xs sm:px-7">
                  <p className={muted}>
                    Beige Sheet Version{" "}
                    <strong className="block text-white">v1.0</strong>
                  </p>
                  <p className={muted}>
                    Created{" "}
                    <strong className="block text-white">Demo draft</strong>
                  </p>
                </footer>
              </article>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={goBack}
                  className={`h-12 min-w-[160px] rounded-lg ${secondary}`}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleDraft}
                  className={`h-12 min-w-[160px] rounded-lg ${primary}`}
                >
                  Save Draft
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          className={`z-[130] flex max-h-[calc(100dvh_-_20px)] w-[calc(100vw_-_24px)] max-w-[810px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#3B3B3B] bg-black text-white" : "border-[#E5E5E5] bg-white text-black"}`}
        >
          <div
            className={`flex shrink-0 items-center justify-between border-b px-5 py-5 sm:px-7 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}
          >
            <DialogTitle className="text-xl font-semibold sm:text-2xl">
              Send {mode === "individual" ? recipients.length : 1}{" "}
              {mode === "individual" ? "Individual" : "Common"} Agreement
              {mode === "individual" && recipients.length > 1 ? "s" : ""}?
            </DialogTitle>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              aria-label="Close confirmation"
              className={`flex h-10 w-10 items-center justify-center rounded-full ${secondary}`}
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
            <DialogDescription className="text-sm leading-6 text-[#E8D1AB]">
              Agreements will be prepared for{" "}
              {recipients.map((a) => getEditor(a.editorId)?.name).join(", ")}.
              Each External Editor must accept before their assignment is
              confirmed.
            </DialogDescription>
            <div
              className={`space-y-2 rounded-lg p-3 ${isDark ? "bg-[#141414]" : "bg-[#F6F6F6]"}`}
            >
              {recipients.map((a) => (
                <div
                  key={a.editorId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <EditorAvatar
                      name={getEditor(a.editorId)?.name || "Editor"}
                      className="h-7 w-7"
                    />
                    {getEditor(a.editorId)?.name}
                  </div>
                  <span>
                    {a.compensation
                      ? formatUSD(getCompensationTotal(a.compensation))
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
            <p className="rounded-lg border border-[#655000] bg-[#1D190B] p-3 text-xs text-[#E9BE30]">
              <AlertCircle size={16} className="mr-2 inline" /> Assignment
              remains Pending until editor accepts individually. Demo mode: no
              agreement will actually be sent.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-7">
            <Button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className={`h-11 rounded-lg ${secondary}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              className={`h-11 rounded-lg ${primary}`}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={successOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSuccessOpen(false);
            backToShoot();
          }
        }}
      >
        <DialogContent
          className={`z-[140] flex max-h-[calc(100dvh_-_20px)] w-[calc(100vw_-_24px)] max-w-[500px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#3A3A3A] bg-black text-white" : "border-[#E5E5E5] bg-white text-black"}`}
        >
          <DialogTitle className="sr-only">
            Shoot Agreement Saved Successfully
          </DialogTitle>
          <div className="min-h-0 overflow-y-auto px-6 pt-8 text-center sm:px-7 sm:pt-10">
            <AssignmentSuccessAnimation />
            <h2 className="mt-6 text-xl font-medium">
              Shoot Agreement Saved Successfully
            </h2>
            <DialogDescription className={`mt-3 text-sm leading-6 ${muted}`}>
              Individual shoot agreements have been recorded for{" "}
              {recipients.map((a) => getEditor(a.editorId)?.name).join(", ")}.
              External Editor assignments are now Pending in the demo.
            </DialogDescription>
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl p-4 text-left ${isDark ? "bg-[#1E1A16]" : "bg-[#F9F2E8]"}`}
            >
              <Bell size={18} className="shrink-0 text-[#E8D1AB]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#E8D1AB]">
                  Email Preview Only
                </p>
                <p className="mt-1 text-sm">
                  You&apos;ve been assigned as Editor
                </p>
                <p className={`mt-1 text-xs ${muted}`}>
                  {projectName} · #{id}
                </p>
                <p className={`mt-1 text-[11px] ${muted}`}>
                  No emails were sent.
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 px-6 py-6 sm:px-7">
            <Button
              type="button"
              onClick={backToShoot}
              className={`h-12 w-full rounded-lg ${primary}`}
            >
              View Shoot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
