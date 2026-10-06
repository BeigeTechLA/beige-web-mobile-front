"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  GripVertical,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { toast } from "sonner";
import {
  getLocalShootAgreement,
  saveLocalShootAgreement,
} from "@/components/admin/agreements/localAgreementStore";

type AgreementMode = "individual" | "common";
type FlowStage = "select" | "edit" | "review";

type AgreementSection = {
  id: string;
  title: string;
  content: string;
  isOpen: boolean;
};

type AgreementCreator = {
  creatorId: number;
  creatorName: string;
  creatorEmail?: string | null;
  role: string;
  rateType: "flat" | "hourly";
  totalCompensation: number;
  basePayout?: number;
  editingPayout?: number;
  travelAdjustment?: number;
  bonusAdjustment?: number;
  notes?: string;
  advanceAmount?: number;
  advancePaymentDate?: string;
  advanceNotes?: string;
};

type ShootAgreementDraft = {
  shootId: string;
  bookingId: number;
  projectName: string;
  projectCode?: string;
  assignmentId?: string;
  productionDate?: string | null;
  location?: string;
  callTime?: string;
  expectedEndTime?: string;
  shootAmount?: number;
  compensationMethod?: string;
  creators: AgreementCreator[];
  createdAt?: string;
  version?: string;
};

type SavedFlowState = {
  mode: AgreementMode;
  stage: FlowStage;
  activeCreatorIndex: number;
  commonSections: AgreementSection[];
  individualSections: Record<string, AgreementSection[]>;
};

const DRAFT_KEY = "beige_shoot_agreement_draft";
const FLOW_KEY_PREFIX = "beige_shoot_agreement_flow_";
const SENT_KEY_PREFIX = "beige_shoot_agreement_sent_";

const DEFAULT_SECTIONS: AgreementSection[] = [
  {
    id: "scope",
    title: "Scope of Services",
    content:
      "<p>Capture photography and video coverage for the production, including agreed event highlights and required creative deliverables.</p>",
    isOpen: true,
  },
  {
    id: "equipment",
    title: "Equipment Requirements",
    content:
      "<p>Use professional production equipment appropriate for the assignment, including camera bodies, lenses, stabilization, lighting, and audio equipment as required.</p>",
    isOpen: false,
  },
  {
    id: "deliverables",
    title: "Deliverables / Media Transfer Requirements",
    content:
      "<p>Upload all required raw media and deliverables to the designated Beige folder within the timeline communicated for this production.</p>",
    isOpen: false,
  },
  {
    id: "expenses",
    title: "Approved Expenses / Travel",
    content:
      "<p>Only pre-approved travel and production expenses are reimbursable. Additional expenses require prior written approval.</p>",
    isOpen: false,
  },
  {
    id: "instructions",
    title: "Special Instructions",
    content:
      "<p>Follow the production brief, call-time instructions, client requirements, confidentiality obligations, and on-site directions provided by Beige.</p>",
    isOpen: false,
  },
];

const cloneSections = () => DEFAULT_SECTIONS.map((section) => ({ ...section }));

const formatCurrency = (value?: number) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "Not specified";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();


const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeAgreementHtml = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const agreementHtmlToText = (value: string) => {
  if (!value) return "";
  if (typeof window !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = normalizeAgreementHtml(value);
    return (div.textContent || div.innerText || "").trim();
  }
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const hasAgreementContent = (value: string) => agreementHtmlToText(value).length > 0;

const agreementRichTextClassName =
  "[&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#D9BD85] [&_a]:underline [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic";

type RichTextCommand = "bold" | "italic" | "bullet" | "numbered" | "link";

function AgreementRichTextEditor({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const normalized = normalizeAgreementHtml(value);
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized;
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(editor.innerHTML);
  };

  const runCommand = (command: RichTextCommand) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (command === "bold") document.execCommand("bold", false);
    if (command === "italic") document.execCommand("italic", false);
    if (command === "bullet") document.execCommand("insertUnorderedList", false);
    if (command === "numbered") document.execCommand("insertOrderedList", false);

    if (command === "link") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        toast.error("Select text first, then click the link button.");
        return;
      }

      const enteredUrl = window.prompt("Enter link URL", "https://");
      if (!enteredUrl?.trim()) return;
      const trimmedUrl = enteredUrl.trim();
      const safeUrl = /^(https?:\/\/|mailto:)/i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`;
      document.execCommand("createLink", false, safeUrl);
      editor.querySelectorAll("a").forEach((anchor) => {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      });
    }

    syncValue();
  };

  const toolbarItems: Array<{
    label: string;
    icon: React.ElementType;
    command: RichTextCommand;
  }> = [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Bulleted list", icon: List, command: "bullet" },
    { label: "Numbered list", icon: ListOrdered, command: "numbered" },
    { label: "Link", icon: Link2, command: "link" },
  ];

  return (
    <>
      <div
        className={`mt-3 flex h-10 items-center gap-1 rounded-md border px-2 ${
          isDark
            ? "border-[#2F2F2F] bg-[#0F0F0F]"
            : "border-[#E5E5E5] bg-[#FAFAFA]"
        }`}
      >
        {toolbarItems.map(({ label, icon: Icon, command }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => {
              event.preventDefault();
              runCommand(command);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isDark
                ? "text-white/45 hover:bg-white/10 hover:text-white"
                : "text-black/45 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Add section content..."
        onInput={syncValue}
        onBlur={syncValue}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          syncValue();
        }}
        className={`mt-3 min-h-[112px] w-full rounded-md border p-3 text-sm leading-6 outline-none transition-colors empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] focus:border-[#E8D1AB]/70 ${agreementRichTextClassName} ${
          isDark
            ? "border-[#2F2F2F] bg-[#0F0F0F] text-white/80 empty:before:text-white/20"
            : "border-[#E5E5E5] bg-[#FAFAFA] text-black/75 empty:before:text-black/30"
        }`}
      />
    </>
  );
}

const nextAgreementVersion = (value?: string) => {
  const match = String(value || "v1.0").match(/(\d+)\.(\d+)/);
  if (!match) return "v1.1";
  return `v${match[1]}.${Number(match[2]) + 1}`;
};

function VersionBadge({ isDark, version }: { isDark: boolean; version: string }) {
  return (
    <div
      className={`rounded-lg px-4 py-3 text-xs font-medium ${
        isDark ? "bg-[#E8D1AB] text-black" : "bg-[#E8D1AB] text-black"
      }`}
    >
      Version {version} (auto-generated)
    </div>
  );
}

function FieldCard({
  label,
  value,
  isDark,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      className={`relative min-h-[74px] rounded-xl border px-5 pb-4 pt-6 ${
        isDark ? "border-[#4A4A4A] bg-[#171717]" : "border-[#DADADA] bg-white"
      }`}
    >
      <span
        className={`absolute -top-2.5 left-4 px-2 text-xs ${
          isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/50"
        }`}
      >
        {label}
      </span>
      <div className={`text-sm ${isDark ? "text-white/90" : "text-black/80"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionEditor({
  sections,
  onChange,
  isDark,
}: {
  sections: AgreementSection[];
  onChange: (sections: AgreementSection[]) => void;
  isDark: boolean;
}) {
  const [sectionMenuId, setSectionMenuId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<AgreementSection>) => {
    onChange(sections.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    const index = sections.findIndex((section) => section.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
    setSectionMenuId(null);
  };

  const duplicateSection = (id: string) => {
    const sourceIndex = sections.findIndex((section) => section.id === id);
    if (sourceIndex < 0) return;
    const source = sections[sourceIndex];
    const next = [...sections];
    next.splice(sourceIndex + 1, 0, {
      ...source,
      id: `${source.id}-copy-${Date.now()}`,
      title: `${source.title || "Untitled Section"} Copy`,
      isOpen: true,
    });
    onChange(next);
    setSectionMenuId(null);
  };

  const removeSection = (id: string) => {
    if (sections.length === 1) {
      toast.error("An agreement needs at least one section.");
      return;
    }
    onChange(sections.filter((section) => section.id !== id));
    setSectionMenuId(null);
  };

  const reorderSection = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) return;
    const sourceIndex = sections.findIndex((section) => section.id === draggedSectionId);
    const targetIndex = sections.findIndex((section) => section.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...sections];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDraggedSectionId(null);
  };

  const addSection = () => {
    onChange([
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: "New Section",
        content: "",
        isOpen: true,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <section
          key={section.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => reorderSection(section.id)}
          className={`relative overflow-visible rounded-xl border ${
            isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E2E2E2] bg-white"
          }`}
        >
          <div
            className={`flex w-full items-center gap-3 px-4 py-4 text-left ${
              section.isOpen ? (isDark ? "border-b border-[#2D2D2D]" : "border-b border-[#EEEEEE]") : ""
            }`}
          >
            <span
              draggable
              onDragStart={(event) => {
                event.stopPropagation();
                setDraggedSectionId(section.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDraggedSectionId(null)}
              className="inline-flex cursor-grab active:cursor-grabbing"
              title="Drag to reorder section"
            >
              <GripVertical size={15} className={isDark ? "text-white/30" : "text-black/30"} />
            </span>

            <span className={`w-7 text-xs ${isDark ? "text-[#E8D1AB]" : "text-[#8A6D40]"}`}>
              {String(index + 1).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={() => update(section.id, { isOpen: !section.isOpen })}
              className="min-w-0 flex-1 text-left"
            >
              <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                {section.title || "Untitled Section"}
              </p>
              {!section.isOpen ? (
                <p className={`mt-0.5 truncate text-[11px] ${isDark ? "text-white/35" : "text-black/40"}`}>
                  {agreementHtmlToText(section.content) || "Add section content..."}
                </p>
              ) : null}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSectionMenuId((current) => (current === section.id ? null : section.id))}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isDark
                    ? "text-white/45 hover:bg-white/10 hover:text-white"
                    : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
                aria-label="Section actions"
                aria-expanded={sectionMenuId === section.id}
              >
                <MoreHorizontal size={17} />
              </button>

              {sectionMenuId === section.id ? (
                <div
                  className={`absolute right-0 top-9 z-50 min-w-[180px] rounded-lg border p-1.5 shadow-xl ${
                    isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(section.id, -1)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs disabled:opacity-35 ${
                      isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
                    }`}
                  >
                    <ArrowUp size={14} /> Move up
                  </button>
                  <button
                    type="button"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(section.id, 1)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs disabled:opacity-35 ${
                      isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
                    }`}
                  >
                    <ArrowDown size={14} /> Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateSection(section.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${
                      isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"
                    }`}
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-black/5"}`} />
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${
                      isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 size={14} /> Delete section
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => update(section.id, { isOpen: !section.isOpen })}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                isDark
                  ? "text-white/70 hover:bg-white/5 hover:text-white"
                  : "text-black/55 hover:bg-black/5 hover:text-black"
              }`}
              aria-label={section.isOpen ? "Collapse section" : "Expand section"}
            >
              {section.isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
          </div>

          {section.isOpen ? (
            <div className="px-4 pb-5 pt-4">
              <label className={`mb-2 block text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                Section Title
              </label>
              <input
                value={section.title}
                onChange={(event) => update(section.id, { title: event.target.value })}
                className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-[#E8D1AB]/70 ${
                  isDark
                    ? "border-[#2F2F2F] bg-[#0F0F0F] text-white"
                    : "border-[#E5E5E5] bg-[#FAFAFA] text-black"
                }`}
              />

              <AgreementRichTextEditor
                value={section.content}
                onChange={(value) => update(section.id, { content: value })}
                isDark={isDark}
              />
            </div>
          ) : null}
        </section>
      ))}

      <Button
        type="button"
        onClick={addSection}
        className="h-12 w-full gap-2 rounded-lg bg-[#E8D1AB] text-sm font-medium text-black hover:bg-[#D8C39E]"
      >
        <Plus size={17} /> Add Section
      </Button>
    </div>
  );
}

function DocumentRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(0,2fr)] gap-4 py-1.5 text-sm">
      <span className={isDark ? "text-white/40" : "text-black/45"}>{label}</span>
      <span className={`text-right ${isDark ? "text-white/75" : "text-black/75"}`}>{value}</span>
    </div>
  );
}

export default function ShootAgreementPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();

  const routeSource = searchParams.get("from");
  const sourceAgreementId = searchParams.get("agreementId");
  const cameFromCompensation = routeSource === "compensation";
  const cameFromAgreement = routeSource === "agreement";
  const shootDetailsRoute = `/admin/shoots/${params.id}`;
  const assignedCpRoute = `/admin/shoots/${params.id}/add-creatives`;
  const shootAgreementDetailId = sourceAgreementId || `shoot-${params.id}`;
  const shootAgreementDetailRoute = `/admin/agreements/${encodeURIComponent(shootAgreementDetailId)}?from=shoot&shootId=${encodeURIComponent(String(params.id))}`;
  const agreementEditorBackRoute = `/admin/agreements/${encodeURIComponent(shootAgreementDetailId)}?from=shoot&shootId=${encodeURIComponent(String(params.id))}`;

  const [draft, setDraft] = useState<ShootAgreementDraft | null>(null);
  const [mode, setMode] = useState<AgreementMode>("individual");
  const [stage, setStage] = useState<FlowStage>("select");
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0);
  const [commonSections, setCommonSections] = useState<AgreementSection[]>(cloneSections());
  const [individualSections, setIndividualSections] = useState<Record<string, AgreementSection[]>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);

  useEffect(() => {
    try {
      let hasDraftForShoot = false;
      const raw = window.localStorage.getItem(DRAFT_KEY) || window.sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ShootAgreementDraft;
        if (String(parsed.shootId) === String(params.id)) {
          hasDraftForShoot = true;
          setDraft(parsed);
          setIndividualSections(
            parsed.creators.reduce<Record<string, AgreementSection[]>>((acc, creator) => {
              acc[String(creator.creatorId)] = cloneSections();
              return acc;
            }, {}),
          );
        }
      }

      // Edit/New-version flow can be opened from Agreement Detail after the
      // original compensation draft has already been removed. Rebuild the
      // editor from persistent local agreement storage first, then fall back
      // to the legacy session record for older browser sessions.
      if (!hasDraftForShoot && cameFromAgreement) {
        const stored = getLocalShootAgreement(sourceAgreementId || params.id);
        const sentRaw = window.sessionStorage.getItem(`${SENT_KEY_PREFIX}${params.id}`);
        const sent = stored || (sentRaw ? JSON.parse(sentRaw) as ShootAgreementDraft & {
          mode?: AgreementMode;
          commonSections?: AgreementSection[];
          individualSections?: Record<string, AgreementSection[]>;
        } : null);

        if (sent && String(sent.shootId) === String(params.id) && Array.isArray(sent.creators) && sent.creators.length > 0) {
          setDraft(sent as ShootAgreementDraft);
          setMode(sent.mode || "individual");
          setStage("edit");

          if (Array.isArray(sent.commonSections) && sent.commonSections.length > 0) {
            setCommonSections(
              sent.commonSections.map((section) => ({
                ...section,
                isOpen: section.isOpen ?? false,
                content: normalizeAgreementHtml(section.content || ""),
              })),
            );
          }

          if (sent.individualSections && Object.keys(sent.individualSections).length > 0) {
            setIndividualSections(
              Object.fromEntries(
                Object.entries(sent.individualSections).map(([creatorId, creatorSections]) => [
                  creatorId,
                  creatorSections.map((section) => ({
                    ...section,
                    isOpen: section.isOpen ?? false,
                    content: normalizeAgreementHtml(section.content || ""),
                  })),
                ]),
              ),
            );
          } else {
            setIndividualSections(
              sent.creators.reduce<Record<string, AgreementSection[]>>((acc, creator) => {
                acc[String(creator.creatorId)] = cloneSections();
                return acc;
              }, {}),
            );
          }
        }
      }

      const newVersionRaw = window.sessionStorage.getItem("beige_agreement_new_version");
      if (newVersionRaw) {
        const newVersionState = JSON.parse(newVersionRaw) as { agreementId?: string; shootId?: string | number; createNewVersion?: boolean };
        if (newVersionState.createNewVersion && (
          String(newVersionState.shootId || "") === String(params.id) ||
          String(newVersionState.agreementId || "") === String(sourceAgreementId || "")
        )) {
          setIsCreatingNewVersion(true);
        }
      }

      const savedFlow = window.localStorage.getItem(`${FLOW_KEY_PREFIX}${params.id}`) || window.sessionStorage.getItem(`${FLOW_KEY_PREFIX}${params.id}`);
      if (savedFlow) {
        const parsed = JSON.parse(savedFlow) as SavedFlowState;
        setMode(parsed.mode || "individual");
        setStage(parsed.stage || "select");
        setActiveCreatorIndex(parsed.activeCreatorIndex || 0);
        if (Array.isArray(parsed.commonSections) && parsed.commonSections.length) {
          setCommonSections(
            parsed.commonSections.map((section) => ({
              ...section,
              content: normalizeAgreementHtml(section.content || ""),
            })),
          );
        }
        if (parsed.individualSections && Object.keys(parsed.individualSections).length) {
          setIndividualSections(
            Object.fromEntries(
              Object.entries(parsed.individualSections).map(([creatorId, creatorSections]) => [
                creatorId,
                creatorSections.map((section) => ({
                  ...section,
                  content: normalizeAgreementHtml(section.content || ""),
                })),
              ]),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Failed to load shoot agreement draft", error);
    } finally {
      setLoaded(true);
    }
  }, [cameFromAgreement, params.id, sourceAgreementId]);

  useEffect(() => {
    if (!loaded || !draft) return;
    const state: SavedFlowState = {
      mode,
      stage,
      activeCreatorIndex,
      commonSections,
      individualSections,
    };
    window.localStorage.setItem(`${FLOW_KEY_PREFIX}${params.id}`, JSON.stringify(state));
    window.sessionStorage.setItem(`${FLOW_KEY_PREFIX}${params.id}`, JSON.stringify(state));
  }, [activeCreatorIndex, commonSections, draft, individualSections, loaded, mode, params.id, stage]);

  const creators = draft?.creators || [];
  const activeCreator = creators[activeCreatorIndex] || creators[0];
  const activeCreatorSections = activeCreator
    ? individualSections[String(activeCreator.creatorId)] || cloneSections()
    : cloneSections();

  const reviewSections = mode === "common" ? commonSections : activeCreatorSections;
  const totalCompensation = useMemo(
    () => creators.reduce((total, creator) => total + Number(creator.totalCompensation || 0), 0),
    [creators],
  );
  const displayVersion = isCreatingNewVersion
    ? nextAgreementVersion(draft?.version)
    : draft?.version || "v1.0";

  const saveDraft = async () => {
    if (!draft || isSavingDraft) return;

    const sectionsToValidate =
      mode === "common"
        ? commonSections
        : creators.flatMap((creator) => individualSections[String(creator.creatorId)] || []);

    const invalidSection = sectionsToValidate.length === 0 || sectionsToValidate.some(
      (section) => !section.title.trim() || !hasAgreementContent(section.content),
    );

    if (invalidSection) {
      toast.error("Please complete every agreement section before saving.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const state: SavedFlowState = {
        mode,
        stage,
        activeCreatorIndex,
        commonSections,
        individualSections,
      };
      window.localStorage.setItem(`${FLOW_KEY_PREFIX}${params.id}`, JSON.stringify(state));
      window.sessionStorage.setItem(`${FLOW_KEY_PREFIX}${params.id}`, JSON.stringify(state));
      const savedAt = new Date().toISOString();
      setLastSavedAt(savedAt);
      toast.success("Shoot agreement draft saved successfully.");
    } catch (error) {
      console.error("Failed to save shoot agreement draft", error);
      toast.error("Unable to save the shoot agreement draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const selectMode = (nextMode: AgreementMode) => {
    setMode(nextMode);
  };

  const continueFromMode = () => {
    setActiveCreatorIndex(0);
    setStage("edit");
  };

  const continueFromEdit = () => {
    const currentSections = mode === "common" ? commonSections : activeCreatorSections;
    const invalidSection = currentSections.some(
      (section) => !section.title.trim() || !hasAgreementContent(section.content),
    );

    if (invalidSection) {
      toast.error("Please complete every agreement section before continuing.");
      return;
    }

    if (mode === "individual" && activeCreatorIndex < creators.length - 1) {
      setActiveCreatorIndex((current) => current + 1);
      return;
    }
    setActiveCreatorIndex(0);
    setStage("review");
  };

  const previewFromEdit = () => {
    const sectionsToValidate = mode === "common"
      ? commonSections
      : creators.flatMap((creator) => individualSections[String(creator.creatorId)] || []);
    const invalidSection = sectionsToValidate.length === 0 || sectionsToValidate.some(
      (section) => !section.title.trim() || !hasAgreementContent(section.content),
    );

    if (invalidSection) {
      toast.error("Please complete every agreement section before previewing.");
      return;
    }

    setActiveCreatorIndex(0);
    setStage("review");
  };

  const backFromEdit = () => {
    if (mode === "individual" && activeCreatorIndex > 0) {
      setActiveCreatorIndex((current) => current - 1);
      return;
    }

    if (cameFromAgreement) {
      router.push(agreementEditorBackRoute);
      return;
    }

    setStage("select");
  };

  const openSentAgreement = () => {
    if (!draft) return;

    const primaryCreator = creators[0];
    try {
      window.sessionStorage.setItem(
        "beige_selected_agreement",
        JSON.stringify({
          id: shootAgreementDetailId,
          shootId: String(params.id),
          cpName: primaryCreator?.creatorName || "Creative Partner",
          projectName: draft.projectName,
          projectId: draft.assignmentId || `ASSIGN-${params.id}`,
          role: primaryCreator?.role || "Creative Partner",
          version: displayVersion,
          status: "Pending",
          agreementType: "shoot",
          admin: "Admin",
          sendDate: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error("Failed to prepare shoot agreement detail navigation", error);
    }

    router.replace(shootAgreementDetailRoute);
  };

  const handleSend = () => {
    if (!draft) return;

    const sectionsToValidate = mode === "common"
      ? commonSections
      : creators.flatMap((creator) => individualSections[String(creator.creatorId)] || []);
    const invalidSection = sectionsToValidate.length === 0 || sectionsToValidate.some(
      (section) => !section.title.trim() || !hasAgreementContent(section.content),
    );
    if (invalidSection) {
      setConfirmOpen(false);
      toast.error("Please complete every agreement section before sending.");
      setStage("edit");
      return;
    }

    setConfirmOpen(false);
    setSuccessOpen(true);

    const savedRecord = saveLocalShootAgreement(
      {
        agreementId: sourceAgreementId || `shoot-${params.id}`,
        shootId: String(params.id),
        bookingId: draft.bookingId,
        projectName: draft.projectName,
        projectCode: draft.projectCode,
        assignmentId: draft.assignmentId,
        productionDate: draft.productionDate,
        location: draft.location,
        callTime: draft.callTime,
        expectedEndTime: draft.expectedEndTime,
        shootAmount: draft.shootAmount,
        compensationMethod: draft.compensationMethod,
        creators,
        mode,
        commonSections,
        individualSections,
        version: draft.version || "v1.0",
        status: "Pending",
        createdAt: draft.createdAt,
      },
      { createNewVersion: isCreatingNewVersion },
    );

    const sentRecord = {
      ...savedRecord,
      recipients: creators.map((creator) => ({
        creatorId: creator.creatorId,
        creatorName: creator.creatorName,
        role: creator.role,
        compensation: creator.totalCompensation,
        status: "Pending",
      })),
    };

    setDraft((current) => current ? { ...current, version: savedRecord.version } : current);
    setIsCreatingNewVersion(false);
    window.localStorage.setItem(`${SENT_KEY_PREFIX}${params.id}`, JSON.stringify(sentRecord));
    window.sessionStorage.setItem(`${SENT_KEY_PREFIX}${params.id}`, JSON.stringify(sentRecord));
    window.localStorage.removeItem(`${FLOW_KEY_PREFIX}${params.id}`);
    window.sessionStorage.removeItem(`${FLOW_KEY_PREFIX}${params.id}`);
    window.sessionStorage.removeItem("beige_agreement_new_version");
  };

  if (!loaded) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? "text-white" : "text-black"}`}>
        Loading agreement...
      </div>
    );
  }

  if (!draft || creators.length === 0) {
    return (
      <>
        <Topbar pathname={pathname} breadcrumbOverrides={{ "shoot-agreement": "Shoot Agreement" }} />
        <main
          className={`min-h-screen p-4 lg:p-10 ${isDark ? "bg-transparent text-white" : "bg-[#F4F5F7] text-black"}`}
          style={{ fontFamily: "var(--font-instrument-sans)" }}
        >
          <button
            type="button"
            onClick={() => router.replace(assignedCpRoute)}
            className="mb-8 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className={`mx-auto max-w-2xl rounded-2xl border p-8 ${isDark ? "border-[#303030] bg-[#171717]" : "border-[#E4E4E4] bg-white"}`}>
            <CircleAlert className="mb-4 text-[#E8D1AB]" />
            <h1 className="text-xl font-semibold">Compensation details are required first.</h1>
            <p className={`mt-2 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
              Open Assigned CP, continue to Add Compensation, configure the selected creative partners, and choose Add Shoot Agreement.
            </p>
            <Button
              type="button"
              onClick={() => router.replace(assignedCpRoute)}
              className="mt-6 h-11 bg-[#E8D1AB] px-5 text-black hover:bg-[#D8C39E]"
            >
              Go to Assigned CP
            </Button>
          </div>
        </main>
      </>
    );
  }

  const topActions =
    stage === "edit" ? (
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void saveDraft()}
          disabled={isSavingDraft}
          className={`h-11 rounded-lg px-5 disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-[#3A3A3A] bg-[#171717] text-white hover:bg-[#202020]" : "border-[#DDD] bg-white text-black"}`}
        >
          {isSavingDraft ? <><Loader2 size={15} className="mr-2 animate-spin" /> Saving...</> : "Save Draft"}
        </Button>
        <Button
          type="button"
          onClick={previewFromEdit}
          className={`h-11 rounded-lg px-6 ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/85"}`}
        >
          Preview
        </Button>
      </div>
    ) : null;

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          shoots: "Shoots Details",
          [String(params.id)]: "",
          "shoot-agreement": "Shoot Agreement",
        }}
        actions={topActions}
      />

      <main
        className={`min-h-screen px-4 py-6 pb-24 lg:px-10 lg:py-9 ${isDark ? "bg-transparent text-white" : "bg-[#F4F5F7] text-black"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        {stage === "select" ? (
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  cameFromAgreement
                    ? agreementEditorBackRoute
                    : cameFromCompensation
                      ? assignedCpRoute
                      : shootDetailsRoute,
                )
              }
              className={`mb-8 inline-flex items-center gap-2 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex flex-col gap-5 border-b border-dashed border-white/15 pb-8 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Add Shoot Agreement</h1>
                <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Configure the Shoot Assignment Agreement
                </p>
              </div>
              <VersionBadge isDark={isDark} version={displayVersion} />
            </div>

            <section className={`mt-8 overflow-hidden rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}>
              <div className={`border-b px-6 py-5 ${isDark ? "border-[#2D2D2D]" : "border-[#EEEEEE]"}`}>
                <h2 className="text-lg font-semibold">Agreement Creation</h2>
                <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                  Choose whether to create separate agreements or one common agreement for the selected CPs.
                </p>
              </div>

              <div className="grid gap-4 p-6 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectMode("individual")}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    mode === "individual"
                      ? isDark
                        ? "border-[#E8D1AB] bg-[#1B1915]"
                        : "border-[#C9A76F] bg-[#FFF9F0]"
                      : isDark
                        ? "border-[#3A3A3A] bg-[#171717]"
                        : "border-[#DDDDDD] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${mode === "individual" ? "border-[#E8D1AB]" : "border-white/30"}`}>
                        {mode === "individual" ? <span className="h-2.5 w-2.5 rounded-full bg-[#E8D1AB]" /> : null}
                      </span>
                      <span className="font-semibold text-[#E8D1AB]">Individual Agreements</span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] ${isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/50"}`}>
                      Recommended
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium">One agreement per CP</p>
                  <p className={`mt-2 text-xs leading-5 ${isDark ? "text-white/40" : "text-black/45"}`}>
                    Create a separate agreement for each selected creative partner. Compensation, role, scope, and details can be managed individually.
                  </p>
                  <div className="mt-5 space-y-2">
                    {creators.map((creator, index) => (
                      <div key={creator.creatorId} className="flex items-center gap-2 text-xs">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8D1AB] text-[9px] font-semibold text-black">
                          {initials(creator.creatorName)}
                        </span>
                        <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                        <span className={`rounded px-2 py-1 ${isDark ? "bg-white/5 text-white/35" : "bg-black/5 text-black/40"}`}>
                          Agreement {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selectMode("common")}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    mode === "common"
                      ? isDark
                        ? "border-[#E8D1AB] bg-[#1B1915]"
                        : "border-[#C9A76F] bg-[#FFF9F0]"
                      : isDark
                        ? "border-[#3A3A3A] bg-[#171717]"
                        : "border-[#DDDDDD] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${mode === "common" ? "border-[#E8D1AB]" : "border-white/30"}`}>
                        {mode === "common" ? <span className="h-2.5 w-2.5 rounded-full bg-[#E8D1AB]" /> : null}
                      </span>
                      <span className="font-semibold text-[#E8D1AB]">Common Agreement</span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] ${isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/50"}`}>
                      Shared terms
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium">One agreement for multiple CPs</p>
                  <p className={`mt-2 text-xs leading-5 ${isDark ? "text-white/40" : "text-black/45"}`}>
                    Create one agreement shared with all selected creative partners. Use this when agreement terms are common to everyone.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs">
                    <div className="flex -space-x-1">
                      {creators.map((creator) => (
                        <span key={creator.creatorId} className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#E8D1AB] text-[8px] font-semibold text-black">
                          {initials(creator.creatorName)}
                        </span>
                      ))}
                    </div>
                    <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                    <span className={`rounded px-2 py-1 ${isDark ? "bg-white/5 text-white/35" : "bg-black/5 text-black/40"}`}>1 Agreement</span>
                  </div>
                </button>

                <div className={`lg:col-span-2 flex flex-wrap items-center gap-x-7 gap-y-2 rounded-xl border px-5 py-4 text-sm ${isDark ? "border-[#2D2D2D] bg-black" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}>
                  <span className={isDark ? "text-white/35" : "text-black/40"}>Mode: <strong className="text-white">{mode === "common" ? "Common Agreement" : "Individual Agreements"}</strong></span>
                  <span className={isDark ? "text-white/35" : "text-black/40"}>CPs: <strong className="text-white">{creators.length}</strong></span>
                  <span className={isDark ? "text-white/35" : "text-black/40"}>Agreements to create: <strong className="text-white">{mode === "common" ? 1 : creators.length}</strong></span>
                  <span className={isDark ? "text-white/35" : "text-black/40"}>Acceptance: <strong className="text-white">Each CP individually</strong></span>
                </div>
              </div>
            </section>

            <div className="mt-7 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(
                    cameFromAgreement
                      ? agreementEditorBackRoute
                      : cameFromCompensation
                        ? assignedCpRoute
                        : shootDetailsRoute,
                  )
                }
                className={`h-14 min-w-44 rounded-lg text-base ${isDark ? "border-[#444] bg-transparent text-white" : "border-[#DDD] bg-white text-black"}`}
              >
                Back
              </Button>
              <Button type="button" onClick={continueFromMode} className="h-14 min-w-80 rounded-lg bg-[#E8D1AB] px-8 text-base text-black hover:bg-[#D8C39E]">
                Continue to Add Agreement
              </Button>
            </div>
          </div>
        ) : null}

        {stage === "edit" ? (
          <div>
            <button type="button" onClick={backFromEdit} className={`mb-7 inline-flex items-center gap-2 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex flex-col gap-5 border-b border-dashed border-white/15 pb-7 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold lg:text-2xl">
                  {mode === "common"
                    ? "Create Common Shoot Agreement"
                    : `Agreement for ${activeCreator?.creatorName || "Creative Partner"} (Individual Agreement)`}
                </h1>
                <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                  {mode === "common"
                    ? "Create one agreement to be shared with the selected creative partners."
                    : `${activeCreator?.role || "Creative Partner"} - ASSIGN-${draft.bookingId}`}
                </p>
              </div>
              <VersionBadge isDark={isDark} version={displayVersion} />
            </div>

            {mode === "common" ? (
              <section className={`mt-7 rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
                <div className={`border-b px-6 py-5 ${isDark ? "border-[#2D2D2D]" : "border-[#EEEEEE]"}`}>
                  <h2 className="text-lg font-semibold">Agreement Recipients</h2>
                </div>
                <div className="flex flex-wrap items-center gap-5 p-6">
                  {creators.map((creator) => (
                    <div key={creator.creatorId} className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-[#292929] text-white/70" : "bg-[#EEE] text-black/70"}`}>
                        {initials(creator.creatorName)}
                      </span>
                      <span className="text-sm font-medium">{creator.creatorName}</span>
                      <span className="text-xs text-[#E8D1AB]">{creator.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className={`mt-7 overflow-hidden rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
                <div className={`border-b px-6 py-5 ${isDark ? "border-dashed border-white/15" : "border-[#EEEEEE]"}`}>
                  <h2 className="text-lg font-semibold">Project Detail</h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 p-6">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-xl text-xl font-semibold ${isDark ? "bg-[#35312B] text-[#E8D1AB]" : "bg-[#EFE5D5] text-[#7D6235]"}`}>
                    {initials(activeCreator?.creatorName || "CP")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold">{activeCreator?.creatorName} ({activeCreator?.role})</h3>
                      <span className="rounded-full bg-[#E8D1AB] px-4 py-2 text-sm font-semibold text-black">
                        {formatCurrency(activeCreator?.totalCompensation)} <span className="ml-1 text-xs font-normal text-black/50">Total Compensation</span>
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                      Project Name : {draft.projectName} &nbsp; | &nbsp; Project ID : {draft.projectCode || `PRJ-${draft.bookingId}`} &nbsp; | &nbsp; Assignment ID : {draft.assignmentId || `ASSIGN-${draft.bookingId}`}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {mode === "common" ? (
              <section className={`mt-4 rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
                <div className={`border-b px-6 py-5 ${isDark ? "border-dashed border-white/15" : "border-[#EEEEEE]"}`}>
                  <h2 className="text-lg font-semibold">Project Detail</h2>
                </div>
                <div className={`p-6 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Project Name : <span className={isDark ? "text-white/85" : "text-black/80"}>{draft.projectName}</span>
                  &nbsp; | &nbsp; Project ID : <span className={isDark ? "text-white/85" : "text-black/80"}>{draft.projectCode || `PRJ-${draft.bookingId}`}</span>
                  &nbsp; | &nbsp; Assignment ID : <span className={isDark ? "text-white/85" : "text-black/80"}>{draft.assignmentId || `ASSIGN-${draft.bookingId}`}</span>
                  <div className="mt-3">Creative Partner : {creators.map((creator) => `${creator.creatorName} (${creator.role})`).join(", ")}</div>
                </div>
              </section>
            ) : null}

            <section className={`mt-4 rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
              <div className={`border-b px-6 py-5 ${isDark ? "border-dashed border-white/15" : "border-[#EEEEEE]"}`}>
                <h2 className="text-lg font-semibold">Production Information</h2>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <FieldCard label="Production Date" value={formatDate(draft.productionDate)} isDark={isDark} />
                <FieldCard label="Location" value={draft.location || "Not specified"} isDark={isDark} />
                <FieldCard label="Call Time" value={formatTime(draft.callTime)} isDark={isDark} />
                <FieldCard label="Expected End Time / Duration" value={formatTime(draft.expectedEndTime)} isDark={isDark} />
              </div>
            </section>

            {mode === "common" ? (
              <section className={`mt-4 rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
                <div className={`border-b px-6 py-5 ${isDark ? "border-dashed border-white/15" : "border-[#EEEEEE]"}`}>
                  <h2 className="text-lg font-semibold">Compensation</h2>
                </div>
                <div className="space-y-3 p-6">
                  {creators.map((creator) => (
                    <div key={creator.creatorId} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-[#242424] text-white/60" : "bg-[#EEE] text-black/60"}`}>{initials(creator.creatorName)}</span>
                        <span>{creator.creatorName}</span>
                      </div>
                      <span className="rounded-full bg-[#E8D1AB] px-4 py-1.5 font-semibold text-black">{formatCurrency(creator.totalCompensation)} <span className="text-[10px] font-normal text-black/50">Compensation</span></span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-4">
              <SectionEditor
                sections={mode === "common" ? commonSections : activeCreatorSections}
                onChange={(next) => {
                  if (mode === "common") {
                    setCommonSections(next);
                    return;
                  }
                  if (!activeCreator) return;
                  setIndividualSections((current) => ({ ...current, [String(activeCreator.creatorId)]: next }));
                }}
                isDark={isDark}
              />
            </div>

            <div className={`mt-4 rounded-lg px-4 py-3 text-xs ${isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFF6E7] text-[#7D6235]"}`}>
              <CircleAlert size={15} className="mr-2 inline" /> The system automatically generates: Beige Sheet Version: {displayVersion}
            </div>
            {lastSavedAt ? (
              <p className={`mt-2 text-right text-[11px] ${isDark ? "text-white/30" : "text-black/40"}`}>
                Draft saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : null}

            <div className="mt-7 flex gap-4">
              <Button type="button" variant="outline" onClick={backFromEdit} className={`h-14 min-w-40 rounded-lg ${isDark ? "border-[#444] bg-transparent text-white" : "border-[#DDD] bg-white text-black"}`}>
                Back
              </Button>
              <Button type="button" onClick={continueFromEdit} className="h-14 min-w-40 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D8C39E]">
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {stage === "review" ? (
          <div>
            <button type="button" onClick={() => setStage("edit")} className={`mb-7 inline-flex items-center gap-2 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex flex-col gap-5 border-b border-dashed border-white/15 pb-7 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold lg:text-2xl">
                  {mode === "common" ? "Review Common Shoot Agreement" : `Review Agreement - ${activeCreator?.creatorName}`}
                </h1>
                <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                  {mode === "common"
                    ? `${creators.map((creator) => creator.creatorName).join(" - ")} - ${displayVersion}`
                    : `Agreement ${activeCreatorIndex + 1} of ${creators.length} - ${activeCreator?.role} - ASSIGN-${draft.bookingId} - ${displayVersion}`}
                </p>
              </div>
              <Button type="button" onClick={() => setConfirmOpen(true)} className="h-11 gap-2 rounded-lg bg-[#E8D1AB] px-5 text-sm font-semibold text-black hover:bg-[#D8C39E]">
                <Send size={16} /> Send Agreement To CP
              </Button>
            </div>

            {mode === "individual" ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {creators.map((creator, index) => (
                  <button
                    key={creator.creatorId}
                    type="button"
                    onClick={() => setActiveCreatorIndex(index)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                      activeCreatorIndex === index
                        ? isDark
                          ? "border-[#695D48] bg-[#2A251C] text-[#E8D1AB]"
                          : "border-[#C6A46D] bg-[#FFF6E7] text-[#7D6235]"
                        : isDark
                          ? "border-[#2D2D2D] bg-[#171717] text-white/40"
                          : "border-[#E5E5E5] bg-white text-black/45"
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${activeCreatorIndex === index ? "bg-[#E8D1AB] text-black" : isDark ? "bg-[#282828]" : "bg-[#EEE]"}`}>{initials(creator.creatorName)}</span>
                    {creator.creatorName}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`mt-6 rounded-xl border p-5 ${isDark ? "border-[#252525] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-[#332C21] text-[#E8D1AB]" : "bg-[#FFF2DC] text-[#8A6D40]"}`}><Users size={16} /></span>
                  <div>
                    <p className="text-sm font-semibold">Common Shoot Agreement</p>
                    <p className={`text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>Agreement Version: {displayVersion} - {creators.length} Recipients</p>
                  </div>
                </div>
                <p className={`mt-3 text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>This agreement will be sent to all selected CPs. Each recipient must accept individually.</p>
              </div>
            )}

            <article className={`mt-5 overflow-hidden rounded-xl border ${isDark ? "border-[#242424] bg-[#0D0D0D]" : "border-[#E5E5E5] bg-white"}`}>
              <header className={`border-b px-7 py-7 ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                <p className="border-l-4 border-[#E8D1AB] pl-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#E8D1AB]">
                  {mode === "common" ? "Common Shoot Agreement - Beige Sheet" : "Individual Shoot Agreement - Beige Sheet"}
                </p>
                <h2 className="mt-5 text-2xl font-medium">{draft.projectName}</h2>
                {mode === "individual" ? <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{activeCreator?.creatorName} - {activeCreator?.role}</p> : null}
              </header>

              <section className={`border-b px-7 py-7 ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8D1AB]">Project Information</h3>
                <DocumentRow label="Project Name" value={draft.projectName} isDark={isDark} />
                <DocumentRow label="Project ID" value={draft.projectCode || `SHOOT-${draft.bookingId}`} isDark={isDark} />
                <DocumentRow label="Assignment ID" value={draft.assignmentId || `ASSIGN-${draft.bookingId}`} isDark={isDark} />
                <DocumentRow label="Creative Partner" value={mode === "common" ? creators.map((creator) => `${creator.creatorName} (${creator.role})`).join(", ") : activeCreator?.creatorName} isDark={isDark} />
                {mode === "individual" ? <DocumentRow label="Role" value={activeCreator?.role} isDark={isDark} /> : null}
              </section>

              <section className={`border-b px-7 py-7 ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8D1AB]">Production Details</h3>
                <DocumentRow label="Production Date" value={formatDate(draft.productionDate)} isDark={isDark} />
                <DocumentRow label="Location" value={draft.location || "Not specified"} isDark={isDark} />
                <DocumentRow label="Call Time" value={formatTime(draft.callTime)} isDark={isDark} />
                <DocumentRow label="Expected End Time / Duration" value={formatTime(draft.expectedEndTime)} isDark={isDark} />
              </section>

              <section className={`border-b px-7 py-7 ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8D1AB]">Commercial Information</h3>
                {mode === "common" ? (
                  <div className={`overflow-hidden rounded-md border ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                    <div className={`grid grid-cols-[1fr_1fr_auto] gap-4 border-b px-4 py-2 text-[10px] uppercase tracking-[0.1em] ${isDark ? "border-[#242424] text-white/35" : "border-[#EEEEEE] text-black/35"}`}>
                      <span>Creative Partner</span><span>Role</span><span>Compensation</span>
                    </div>
                    {creators.map((creator) => (
                      <div key={creator.creatorId} className={`grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2 text-xs ${isDark ? "text-white/65" : "text-black/65"}`}>
                        <span>{creator.creatorName}</span><span>{creator.role}</span><span>{formatCurrency(creator.totalCompensation)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DocumentRow label="Compensation" value={<strong className="text-[#E8D1AB]">{formatCurrency(activeCreator?.totalCompensation)} ({activeCreator?.rateType === "hourly" ? "Hourly" : "Fixed"})</strong>} isDark={isDark} />
                )}
              </section>

              {reviewSections.map((section) => (
                <section key={section.id} className={`border-b px-7 py-7 ${isDark ? "border-[#242424]" : "border-[#EEEEEE]"}`}>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8D1AB]">{section.title}</h3>
                  <div
                    className={`text-sm leading-6 ${agreementRichTextClassName} ${isDark ? "text-white/45" : "text-black/55"}`}
                    dangerouslySetInnerHTML={{ __html: normalizeAgreementHtml(section.content) }}
                  />
                </section>
              ))}

              <div className="bg-[#E8D1AB] px-7 py-5 text-[10px] leading-4 text-black/70">
                This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting, the Creative Partner confirms their ability to perform the assignment as described and agrees to the terms herein and the governing Beige Creative Partner Agreement. Each recipient acknowledges that acceptance creates a binding commitment for the specified production.
              </div>

              <footer className="flex flex-wrap gap-10 px-7 py-6 text-xs">
                <div><p className={isDark ? "text-white/40" : "text-black/40"}>Beige Sheet Version</p><strong className="mt-1 block">{displayVersion}</strong></div>
                <div><p className={isDark ? "text-white/40" : "text-black/40"}>Created</p><strong className="mt-1 block">{new Date(draft.createdAt || Date.now()).toLocaleString()}</strong></div>
              </footer>
            </article>

            <div className="mt-7 flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStage("edit")} className={`h-14 min-w-40 rounded-lg ${isDark ? "border-[#444] bg-transparent text-white" : "border-[#DDD] bg-white text-black"}`}>Back</Button>
              <Button type="button" onClick={() => void saveDraft()} disabled={isSavingDraft} className="h-14 min-w-40 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D8C39E] disabled:cursor-not-allowed disabled:opacity-60">{isSavingDraft ? <><Loader2 size={15} className="mr-2 animate-spin" /> Saving...</> : "Save"}</Button>
            </div>
          </div>
        ) : null}
      </main>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-[820px] overflow-hidden rounded-2xl border ${isDark ? "border-white/25 bg-black text-white" : "border-[#DDD] bg-white text-black"}`}>
            <div className={`flex items-center justify-between border-b px-7 py-6 ${isDark ? "border-white/25" : "border-[#EEE]"}`}>
              <h2 className="text-2xl font-semibold">
                {mode === "common" ? `Send Common Agreement to ${creators.length} CPs?` : `Send ${creators.length} Individual Agreement${creators.length === 1 ? "" : "s"}?`}
              </h2>
              <button type="button" onClick={() => setConfirmOpen(false)} className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? "bg-[#2A2626]" : "bg-[#EEE]"}`}><X /></button>
            </div>
            <div className="p-7">
              <p className="text-lg leading-7 text-[#E8D1AB]">
                {mode === "common"
                  ? `One common agreement will be sent to ${creators.map((creator) => creator.creatorName).join(" and ")}. Each CP must review and accept the agreement individually.`
                  : `Separate agreements will be sent to ${creators.map((creator) => creator.creatorName).join(" and ")}. Each CP will receive their own agreement and must accept it before their assignment is confirmed.`}
              </p>

              <div className={`mt-5 rounded-lg border p-4 ${isDark ? "border-[#242424] bg-[#101010]" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}>
                {mode === "common" ? (
                  <div className={`mb-3 grid grid-cols-2 gap-3 border-b pb-3 text-sm ${isDark ? "border-[#242424]" : "border-[#E5E5E5]"}`}>
                    <div className={isDark ? "text-white/35" : "text-black/40"}>Agreement Type<br /><span className="text-white">Common</span></div>
                    <div className="text-right">Recipients<br /><strong>{creators.length} CPs</strong></div>
                  </div>
                ) : null}
                {creators.map((creator) => (
                  <div key={creator.creatorId} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${isDark ? "bg-[#242424]" : "bg-[#EEE]"}`}>{initials(creator.creatorName)}</span>{creator.creatorName}</div>
                    <strong>{formatCurrency(creator.totalCompensation)}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#735A00] bg-[#1A1400] px-4 py-3 text-xs text-[#E9C400]">
                <CircleAlert size={15} /> Assignments will remain pending until each CP accepts the agreement individually.
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} className={`h-12 rounded-lg ${isDark ? "border-white/30 bg-transparent text-white" : "border-[#DDD]"}`}>Cancel</Button>
                <Button type="button" onClick={handleSend} className="h-12 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D8C39E]">Submit</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className={`w-full max-w-[500px] rounded-2xl border p-7 text-center ${isDark ? "border-white/30 bg-black text-white" : "border-[#DDD] bg-white text-black"}`}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8D1AB] text-black shadow-[0_0_40px_rgba(232,209,171,0.25)]">
              <Check size={42} strokeWidth={2.5} />
            </div>
            <h2 className="mt-7 text-2xl font-semibold">Shoot Agreement Sent Successfully</h2>
            <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${isDark ? "text-white/55" : "text-black/55"}`}>
              {mode === "common"
                ? "The common shoot agreement has been sent to all selected CPs. Each CP must accept the agreement individually before their assignment is confirmed."
                : `Individual shoot agreements have been sent to ${creators.length} creative partner${creators.length === 1 ? "" : "s"}. Each CP must accept their agreement before their assignment is confirmed.`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" onClick={() => router.replace(shootDetailsRoute)} className={`h-12 rounded-lg ${isDark ? "border-white/30 bg-transparent text-white" : "border-[#DDD]"}`}>Back to Shoot Detail</Button>
              <Button type="button" onClick={openSentAgreement} className="h-12 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D8C39E]">View Agreement</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
