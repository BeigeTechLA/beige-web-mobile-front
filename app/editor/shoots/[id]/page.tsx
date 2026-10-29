"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Clock,
  Folder,
  Grid3X3,
  LayoutGrid,
  Link,
  List,
  MoreVertical,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/src/components/landing/ui/button";

/**
 * Editor – Shoot details page (dummy data, no API calls).
 *
 * Internal and external editors share this page. External editors also get
 * the Shoot Agreement banner at the top.
 * Editor type comes from the logged-in user later; for now it defaults to
 * "internal" and can be previewed with `?editor=external`.
 */

/* ------------------------------------------------------------------ */
/* Types + dummy data                                                  */
/* ------------------------------------------------------------------ */

type EditorType = "internal" | "external";
type AgreementStatus = "pending" | "accepted" | "rejected";
type DetailTab = "overview" | "files" | "review";
type FileView = "grid" | "list" | "tiles";

const DEFAULT_EDITOR_TYPE: EditorType = "internal";

const EDITING_STEPS = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Revision Requested",
  "Resubmitted",
  "Approved",
  "Completed",
] as const;

interface FolderItem {
  id: string;
  name: string;
  count: string;
  tag: string;
  linked: boolean;
  openedBy: string; // initials
  openedAt: string;
}

const DUMMY_SHOOT = {
  id: "123456",
  shootCode: "#123456",
  projectName: "Hotel Brand Film",
  service: "Videography",
  producer: "Sam Rivera",
  creativePartner: "Elena Rossi",
  currentStep: 0, // index into EDITING_STEPS
  agreement: {
    status: "pending" as AgreementStatus,
    createdOn: "Oct 02, 2026",
  },
  editing: {
    requirements: "Campaign master + social cutdowns",
    deliverables: "7 final exports and editable archive",
    format: "4K ProRes + H.264 social",
    dueDate: "29 Oct",
    revisions: "2 rounds included",
    brief: "Match approved treatment and preserve project LUTs, music cues and brand typography across all cutdowns.",
  },
  notification: "You've Been Assigned as Editor — Hotel Brand Film",
};

const DUMMY_FOLDERS: FolderItem[] = [
  { id: "raw", name: "Raw Footage", count: "800 Items", tag: "Holiday Campaign", linked: true, openedBy: "DP", openedAt: "Opened 2 hours ago" },
  { id: "edits", name: "Edits", count: "03 Files", tag: "Holiday Campaign", linked: true, openedBy: "DP", openedAt: "Opened 2 hours ago" },
  { id: "final", name: "Final Deliverables", count: "00 Items", tag: "Holiday Campaign", linked: true, openedBy: "DP", openedAt: "Opened 2 hours ago" },
];

const AGREEMENT_PILL: Record<AgreementStatus, { label: string; cls: string }> = {
  pending: { label: "Pending Acceptance", cls: "bg-[#3A2A12] text-[#E0A23B] border-[#5A4120]" },
  accepted: { label: "Accepted", cls: "bg-[#12301D] text-[#3DD27A] border-[#1F4D30]" },
  rejected: { label: "Rejected", cls: "bg-[#3A1517] text-[#F26B6B] border-[#5A2226]" },
};

const AGREEMENT_PILL_LIGHT: Record<AgreementStatus, string> = {
  pending: "bg-[#D68910]/10 text-[#D68910] border-[#D68910]/20",
  accepted: "bg-[#E6F8EC] text-[#18A44B] border-[#BDEBCD]",
  rejected: "bg-[#FDE8E9] text-[#D93A44] border-[#F6C4C7]",
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function EditorShootDetailsPage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const [mounted, setMounted] = useState(false);
  const [editorType, setEditorType] = useState<EditorType>(DEFAULT_EDITOR_TYPE);
  const [tab, setTab] = useState<DetailTab>("overview");

  useEffect(() => {
    setMounted(true);
    const param = new URLSearchParams(window.location.search).get("editor");
    if (param === "internal" || param === "external") setEditorType(param);
  }, []);

  const isDark = !mounted || theme === "dark";
  const isExternal = editorType === "external";
  const shoot = DUMMY_SHOOT;
  const shootId = params?.id ?? shoot.id;

  const card = `rounded-2xl border ${isDark ? "bg-[#111110] border-[#242422]" : "bg-white border-[#E5E5E5]"}`;
  const strong = isDark ? "text-white" : "text-[#111111]";
  const muted = isDark ? "text-white/50" : "text-black/50";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
        <>
          <Button
            onClick={() =>  router.push(`/editor/shoots/${shoot.id.replace(/^#/, "")}/activity`)}
            className={`text-sm font-semibold h-12 px-4 rounded-lg transition-colors ${isDark
              ? "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
              : "bg-black text-white hover:bg-black/80"
              }`}
          >
            <Clock size={16} />
            View Activity
          </Button>
        </>
        }
      />

      <div
        className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-8 space-y-4 lg:space-y-5"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        {/* Back + View Activity */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"}`}
          >
            <ArrowLeft size={18} strokeWidth={1.7} />
            Back
          </button>
        </div>

        {/* External only: Shoot Agreement banner */}
        {isExternal && (
          <AgreementBanner
            isDark={isDark}
            title={`${shoot.projectName} - ${shoot.service}`}
            status={shoot.agreement.status}
            createdOn={shoot.agreement.createdOn}
            onView={() => router.push(`/editor/shoots/${shootId}/shoot-agreement`)}
          />
        )}

        {/* Editing progress */}
        <EditingStepper isDark={isDark} steps={EDITING_STEPS} current={shoot.currentStep} />

        {/* Tabs */}
        <Tabs isDark={isDark} value={tab} onChange={setTab} />

        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
            <div className="space-y-4 min-w-0">
              {/* Shoot Information */}
              <section className={card}>
                <SectionHeader isDark={isDark} title="Shoot Information" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 lg:p-5">
                  <InfoField isDark={isDark} label="Project / Shoot" value={shoot.projectName} />
                  <InfoField isDark={isDark} label="Producer" value={shoot.producer} />
                  <InfoField isDark={isDark} label="Creative Partner" value={shoot.creativePartner} />
                </div>
              </section>

              {/* Editing Information */}
              <section className={card}>
                <SectionHeader isDark={isDark} title="Editing Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-4 lg:px-5 py-4 lg:py-5">
                  <InfoField isDark={isDark} label="Editing Requirements" value={shoot.editing.requirements} />
                  <InfoField isDark={isDark} label="Deliverables" value={shoot.editing.deliverables} />
                  <InfoField isDark={isDark} label="Required Format" value={shoot.editing.format} />
                  <InfoField isDark={isDark} label="Due Date" value={shoot.editing.dueDate} />
                  <InfoField isDark={isDark} label="Revision Requirements" value={shoot.editing.revisions} />
                  <InfoField isDark={isDark} label="Brief / Instructions" value={shoot.editing.brief} truncate />
                </div>
              </section>
            </div>

            {/* Email notification preview */}
            <aside className={`${`bg-[#D9BB83]/5 border border-[#D9BB83]/20 rounded-2xl`} p-4 lg:p-5`}>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#D9BB83]/10 text-[#E8D1AB]" : "bg-[#FBF3E4] text-[#8C6A00]"}`}>
                <Bell size={14} />
              </span>
              <p className={`mt-4 text-[10px] lg:text-xs uppercase tracking-wider ${isDark ? "text-[#848484]" : "text-black/45"}`}>Email Notification Preview</p>
              <p className={`mt-1.5 text-sm font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>{shoot.notification}</p>
            </aside>
          </div>
        )}

        {tab === "files" && <FilesPanel isDark={isDark} folders={DUMMY_FOLDERS} />}

        {tab === "review" && (
          <section className={`${card} px-6 py-16 text-center`}>
            <p className={`text-sm font-medium ${strong}`}>No reviews yet</p>
            <p className={`mt-1 text-xs ${muted}`}>Feedback and revision requests will appear here once you submit your edit.</p>
          </section>
        )}


        {/* --- FLOATING MOBILE BUTTONS --- */}
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f]' : 'bg-[#F4F5F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
          <Button
            onClick={() => console.log("Clicked")}
            className={`text-sm font-semibold h-12 px-4 lg:px- rounded-lg transition-colors ${isDark
              ? "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
              : "bg-black text-white hover:bg-black/80"
              }`}
          >
            <Clock size={16} />
            View Activity
          </Button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function AgreementBanner({
  isDark,
  title,
  status,
  createdOn,
  onView,
}: {
  isDark: boolean;
  title: string;
  status: AgreementStatus;
  createdOn: string;
  onView: () => void;
}) {
  const pill = AGREEMENT_PILL[status];
  return (
    <section
      className={`rounded-2xl border p-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "bg-[#0C0C0C] border-[#252523]" : "bg-white border-[#E5E5E5]"}`}
    >
      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
        <span className="w-1.5 shrink-0 rounded-full h-8 bg-[#E8D1AB]" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] lg:text-xs font-medium uppercase tracking-[0.12em] ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
              Shoot Agreement
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${isDark ? pill.cls : AGREEMENT_PILL_LIGHT[status]}`}>
              {pill.label}
            </span>
          </div>
          <p className={`mt-0.5 text-sm lg:text-base font-semibold truncate ${isDark ? "text-white" : "text-[#111]"}`}>{title}</p>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
        <div className="md:text-right">
          <p className={`text-[10px] lg:text-xs uppercase tracking-wider ${isDark ? "text-[#8E8E8E]" : "text-black/50"}`}>Created On</p>
          <p className={`mt-0.5 text-sm lg:text-sm font-medium ${isDark ? "text-white" : "text-[#111]"}`}>{createdOn}</p>
        </div>
        <button
          type="button"
          onClick={onView}
          className={`h-10 lg:h-11 px-5 lg:px-8 rounded-lg text-xs lg:text-sm font-semibold underline underline-offset-3 inline-flex items-center gap-1 transition-colors ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#111] text-white hover:bg-[#222]"}`}
        >
          View Agreement <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

function EditingStepper({ isDark, steps, current }: { isDark: boolean; steps: readonly string[]; current: number }) {
  return (
    <section
      className={`rounded-2xl border overflow-x-auto no-scrollbar ${isDark ? "bg-[#1D1D1D] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}
      aria-label="Editing progress"
    >
      <ol className="grid grid-cols-7 min-w-[720px] px-2 lg:px-3 py-3.5">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === steps.length - 1;
          return (
            <li key={label} className={`relative flex flex-col gap-1.5 lg:gap-2 items-center text-center`} aria-current={active ? "step" : undefined}>
              {/* connector to the next step */}
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute top-3 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-px ${done ? "bg-[#E8D1AB]" : isDark ? "bg-white/15" : "bg-black/10"}`}
                />
              )}
              <span
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs lg:text-sm transition-colors ${active || done
                  ? "bg-[#E8D1AB] text-black"
                  : isDark ? "bg-[#2A2A2A] text-white/60" : "bg-[#F0F0F0] text-black/50"
                  }`}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-sm lg:text-base whitespace-nowrap ${active ? (isDark ? "text-[#E8D1AB]" : "text-black") : isDark ? "text-white/45" : "text-black/45"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Tabs({ isDark, value, onChange }: { isDark: boolean; value: DetailTab; onChange: (t: DetailTab) => void }) {
  const items: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "files", label: "File Manager" },
    { key: "review", label: "Review" },
  ];
  return (
    <div role="tablist" className={`w-full lg:w-fit flex lg:inline-flex rounded-xl border p-1.5 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#E5E5E5]"}`}>
      {items.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`h-10 px-5 rounded-lg text-sm lg:text-base transition-colors ${active ? "bg-[#E8D1AB] text-[#121212]" : isDark ? "text-[#C4C4C4] hover:text-white" : "text-black/60 hover:text-black"}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ isDark, title, subtitle, action }: { isDark: boolean; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 lg:px-5 py-3 lg:py-4 border-b ${isDark ? "border-[#242422]" : "border-[#EEEEEE]"}`}>
      <div className="min-w-0">
        <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#111]"}`}>{title}</h3>
        {subtitle && <p className={`mt-0.5 text-sm ${isDark ? "text-[#848484]" : "text-black/45"}`}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function InfoField({ isDark, label, value, truncate }: { isDark: boolean; label: string; value: string; truncate?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`text-[10px] lg:text-xs uppercase tracking-wider ${isDark ? "text-[#848484]" : "text-black/45"}`}>{label}</p>
      <p className={`mt-1 text-xs lg:text-sm font-medium ${truncate ? "truncate" : ""} ${isDark ? "text-white" : "text-[#111]"}`} title={truncate ? value : undefined}>
        {value}
      </p>
    </div>
  );
}

function FilesPanel({ isDark, folders }: { isDark: boolean; folders: FolderItem[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<FileView>("grid");
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest("[data-folder-actions]")) setMenuId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  }, [folders, query]);

  const panel = isDark ? "bg-[#202020]" : "bg-[#FAFAFA] border border-[#ECECEC]";
  const strong = isDark ? "text-white" : "text-[#111]";
  const viewButtons: [FileView, typeof Grid3X3, string][] = [
    ["grid", Grid3X3, "Card view"],
    ["list", List, "List view"],
    ["tiles", LayoutGrid, "Tile view"],
  ];

  const folderMenu = (f: FolderItem) => (
    <div className="relative shrink-0" data-folder-actions>
      <button
        type="button"
        aria-label={`${f.name} actions`}
        onClick={() => setMenuId((cur) => (cur === f.id ? null : f.id))}
        className={`transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/50 hover:text-black"}`}
      >
        <MoreVertical size={24} />
      </button>
      {menuId === f.id && (
        <div className={`absolute right-0 top-8 z-30 min-w-[150px] rounded-xl border p-1 shadow-xl ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
          {["Open", "Download", "Copy link"].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setMenuId(null);
                toast(`${action}: ${f.name}`);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222] hover:bg-[#F8F4EA]"}`}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const tagPills = (f: FolderItem) => (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-full text-xs font-medium ${isDark ? "bg-[#171717] text-white" : "bg-white border border-[#E5E5E5] text-[#222]"}`}>{f.tag}</span>
      {f.linked && (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-full text-xs font-medium bg-[#D4FFE4] text-[#16A34A]">
          <Link size={16} /> Linked
        </span>
      )}
    </div>
  );

  const openedBy = (f: FolderItem) => (
    <div className="flex items-center gap-2">
      <span className="w-10 h-10 rounded-full bg-[#C8E1FF] text-[#000] text-sm lg:text-base font-medium flex items-center justify-center">{f.openedBy}</span>
      <span className={`text-xs lg:text-sm ${isDark ? "text-[#CDC5C5]" : "text-black/60"}`}>{f.openedAt}</span>
    </div>
  );

  return (
    <section className={`rounded-2xl border ${isDark ? "bg-[#0C0C0C] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
      <SectionHeader
        isDark={isDark}
        title="Files & Versions"
        subtitle="Access follows existing File Manager permissions. Important project files cannot be deleted."
        action={
          <button
            type="button"
            onClick={() => toast("Upload coming soon")}
            className={`shrink-0 inline-flex items-center gap-2 h-10 px-3 lg:px-4 rounded-lg border text-xs font-semibold transition-colors ${isDark ? "bg-[#171716] border-[#2B2B28] text-[#E8E8E7] hover:bg-[#1C1C1C]" : "bg-white border-[#E5E5E5] text-[#111] hover:bg-[#F7F7F7]"}`}
          >
            <Upload size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Upload Deliverables</span>
            <span className="sm:hidden">Upload</span>
          </button>
        }
      />

      <div className="p-4 lg:p-5 space-y-4">
        {/* Search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40" : "text-black/40"}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className={`w-full h-10 rounded-lg border pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-[#202020] border-white/20 text-white placeholder:text-white/40 " : "bg-white border-[#E5E5E5] text-black placeholder:text-black/40 "}`}
            />
          </div>
          <div className={`shrink-0 flex items-center rounded-lg border overflow-hidden ${isDark ? "bg-[#202020] border-white/20" : "bg-[#FAFAFA] border-[#E5E5E5]"}`}>
            {viewButtons.map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-label={label}
                title={label}
                aria-pressed={view === mode}
                className={`px-5 py-2.5 transition-colors ${view === mode ? "bg-[#E8D1AB] text-black" : isDark ? "text-white hover:text-white/90" : "text-[#666] hover:text-black"}`}
              >
                <Icon size={20} strokeWidth={1} />
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className={`py-12 text-center text-base ${isDark ? "text-white" : "text-black"}`}>No folders match “{query}”.</p>
        ) : view === "list" ? (
          /* List */
          <div className={`rounded-xl overflow-visible divide-y ${isDark ? "divide-white/10 bg-[#202020]" : "divide-[#EEEEEE] border border-[#ECECEC]"}`}>
            {visible.map((f) => (
              <div key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0 sm:w-[30%]">
                  <Folder size={20} className="shrink-0 fill-[#CFCFCF] text-[#CFCFCF]" />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${strong}`}>{f.name}</p>
                    <p className="text-xs text-[#E8D1AB]">{f.count}</p>
                  </div>
                </div>
                <div className="sm:flex-1">{tagPills(f)}</div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {openedBy(f)}
                  {folderMenu(f)}
                </div>
              </div>
            ))}
          </div>
        ) : view === "tiles" ? (
          /* Compact tiles */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {visible.map((f) => (
              <div key={f.id} className={`rounded-xl p-4 ${panel}`}>
                <div className="flex items-start justify-between">
                  <Folder size={34} className="fill-[#CFCFCF] text-[#CFCFCF]" />
                  {folderMenu(f)}
                </div>
                <p className={`mt-3 text-sm font-medium truncate ${strong}`}>{f.name}</p>
                <p className="text-xs text-[#E8D1AB]">{f.count}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Cards (design default) */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {visible.map((f) => (
              <div key={f.id} className={`rounded-xl ${panel}`}>
                <div className="p-3 lg:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Folder size={24} className="shrink-0 mt-0.5 fill-[#E8D1AB] text-[#E8D1AB]" />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${strong}`}>{f.name}</p>
                        <p className="text-xs text-[#E8D1AB]">{f.count}</p>
                      </div>
                    </div>
                    {folderMenu(f)}
                  </div>
                  {tagPills(f)}
                </div>
                <div className={`border-t p-3 lg:p-5 ${isDark ? "border-white/50" : "border-[#ECECEC]"}`}>{openedBy(f)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
