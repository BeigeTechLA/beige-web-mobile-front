"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderOpen,
  Grid3X3,
  History,
  LayoutGrid,
  Link,
  List,
  MoreVertical,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import FileActionMenu from "@/components/admin/file-manager/FileActionMenu";
import LinkToShootModal from "@/components/admin/file-manager/LinkToShootModal";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Editor – File Manager landing page (dummy data, no API calls).
 * Based on the creator file-manager page, restyled to the editor design:
 * one workspace card per shoot with its editing status, file progress and due date.
 */

/* Types + dummy data */
type EditingStatus =
  | "in_progress"
  | "submitted"
  | "client_review"
  | "revision_requested"
  | "resubmitted"
  | "approved"
  | "completed";

type FileView = "grid" | "list" | "compact";

interface EditorWorkspace {
  id: string;
  shootCode: string;
  title: string;
  service: string;
  status: EditingStatus;
  filesDone: number;
  filesTotal: number;
  /** 0–100 */
  progress: number;
  dueDate: string; // ISO date
  updatedAt: string; // ISO
  isLinked: boolean;
  isShared: boolean;
  isTrashed: boolean;
  /** Blurred cover tint (swap for a thumbnail later) */
  cover: string;
}

const DUMMY_WORKSPACES: EditorWorkspace[] = [
  { id: "ws-101", shootCode: "#123456", title: "Nike Holiday Campaign", service: "Photos Retouching", status: "in_progress", filesDone: 50, filesTotal: 200, progress: 25, dueDate: "2026-10-26", updatedAt: "2026-10-22T10:00:00", isLinked: true, isShared: false, isTrashed: false, cover: "radial-gradient(60% 90% at 62% 55%, rgba(170,52,44,0.55), transparent 70%), linear-gradient(135deg, #2A1414, #1A1010)" },
  { id: "ws-102", shootCode: "#123457", title: "Aesop Winter Editorial", service: "Photos Retouching", status: "revision_requested", filesDone: 10, filesTotal: 25, progress: 40, dueDate: "2026-10-26", updatedAt: "2026-10-21T15:30:00", isLinked: true, isShared: true, isTrashed: false, cover: "radial-gradient(55% 90% at 50% 70%, rgba(176,128,96,0.55), transparent 70%), linear-gradient(135deg, #2B231E, #1A1614)" },
  { id: "ws-103", shootCode: "#123458", title: "Rimowa City Stories", service: "Video Editing", status: "submitted", filesDone: 48, filesTotal: 48, progress: 100, dueDate: "2026-10-26", updatedAt: "2026-10-20T09:15:00", isLinked: false, isShared: false, isTrashed: false, cover: "radial-gradient(55% 80% at 70% 40%, rgba(86,120,160,0.5), transparent 70%), linear-gradient(135deg, #1A2026, #121619)" },
  { id: "ws-104", shootCode: "#123459", title: "Arc'teryx Field Notes", service: "Photo + Video", status: "client_review", filesDone: 86, filesTotal: 86, progress: 100, dueDate: "2026-10-26", updatedAt: "2026-10-15T12:00:00", isLinked: true, isShared: true, isTrashed: false, cover: "radial-gradient(55% 80% at 40% 50%, rgba(70,110,72,0.45), transparent 70%), linear-gradient(135deg, #18201A, #111512)" },
  { id: "ws-105", shootCode: "#123460", title: "Muuto Spring Objects", service: "Photos Retouching", status: "approved", filesDone: 10, filesTotal: 25, progress: 100, dueDate: "2026-10-26", updatedAt: "2026-10-12T17:40:00", isLinked: false, isShared: false, isTrashed: false, cover: "radial-gradient(55% 85% at 55% 65%, rgba(150,120,70,0.5), transparent 70%), linear-gradient(135deg, #241F17, #171411)" },
];

const STATUS: Record<EditingStatus, { label: string; cls: string; dot: string }> = {
  in_progress: { label: "In Progress", cls: "border-[#8FA4F8] bg-[#8FA4F8]/10 text-[#8FA4F8]", dot: "bg-[#8FA4F8]" },
  submitted: { label: "Submitted for Approval", cls: "border-[#ED76FB] bg-[#ED76FB]/10 text-[#ED76FB]", dot: "bg-[#ED76FB]" },
  client_review: { label: "Client Review", cls: "border-[#24AFB9] bg-[#24AFB9]/10 text-[#24AFB9]", dot: "bg-[#24AFB9]" },
  revision_requested: { label: "Revision Requested", cls: "border-[#EF7B7B] bg-[#EF7B7B]/10 text-[#EF7B7B]", dot: "bg-[#EF7B7B]" },
  resubmitted: { label: "Resubmitted", cls: "border-[#EF7B7B] bg-[#8FA4F8]/10 text-[#8FA4F8]", dot: "bg-[#F5BE5C]" },
  approved: { label: "Approved", cls: "border-[#1EC35B] bg-[#1EC35B]/10 text-[#1EC35B]", dot: "bg-[#1EC35B]" },
  completed: { label: "Completed", cls: "border-[#EF7B7B] bg-[#8FA4F8]/10 text-[#8FA4F8]", dot: "bg-[#E8D1AB]" },
};

/** Order of the status chips (Client Review isn't a filter chip in the design, but appears via "All") */
const STATUS_CHIPS: EditingStatus[] = ["in_progress", "submitted", "revision_requested", "resubmitted", "approved", "completed"];

const STORAGE = { usedGb: 24.5, totalGb: 100 };

const formatDue = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).replace(/(\d+) (\w+) (\d+)/, "$1 $2, $3");

const isRecent = (iso: string, days = 5) => Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;

const sameDay = (iso: string, d: Date) => {
  const x = new Date(`${iso}T00:00:00`);
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
};


/* Page */
export default function EditorFileManagerPage({
  basePath = "/editor/dashboard/file-manager",
}: {
  /** Workspace links go to `${basePath}/${id}` */
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [workspaces] = useState<EditorWorkspace[]>(DUMMY_WORKSPACES);
  const [selectedTab, setSelectedTab] = useState("All Files");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EditingStatus>("all");
  const [viewMode, setViewMode] = useState<FileView>("grid");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<EditorWorkspace | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  /* ---------- tabs ---------- */
  const linkedCount = workspaces.filter((w) => w.isLinked && !w.isTrashed).length;
  const tabs = [
    { name: "All Files", icon: FolderOpen },
    { name: "Linked to Shoots", icon: Link, badge: linkedCount },
    { name: "Recent", icon: History },
    { name: "Shared", icon: Share2 },
    { name: "Trash", icon: Trash2 },
  ];

  /* ---------- filtering ---------- */
  // Tab + search + date (status chips are applied after, so their counts reflect this set)
  const baseItems = useMemo(() => {
    let items = workspaces.filter((w) => (selectedTab === "Trash" ? w.isTrashed : !w.isTrashed));
    if (selectedTab === "Linked to Shoots") items = items.filter((w) => w.isLinked);
    if (selectedTab === "Recent") items = items.filter((w) => isRecent(w.updatedAt));
    if (selectedTab === "Shared") items = items.filter((w) => w.isShared);

    const q = searchTerm.trim().toLowerCase();
    if (q) items = items.filter((w) => [w.title, w.shootCode, w.service].join(" ").toLowerCase().includes(q));
    if (selectedDate) items = items.filter((w) => sameDay(w.dueDate, selectedDate));

    return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [workspaces, selectedTab, searchTerm, selectedDate]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<EditingStatus, number>;
    (Object.keys(STATUS) as EditingStatus[]).forEach((s) => (counts[s] = 0));
    baseItems.forEach((w) => (counts[w.status] += 1));
    return counts;
  }, [baseItems]);

  const visible = statusFilter === "all" ? baseItems : baseItems.filter((w) => w.status === statusFilter);

  // Close the moreActions menu whenever the list changes
  useEffect(() => setMenuAnchor(null), [selectedTab, searchTerm, statusFilter, viewMode, selectedDate]);

  /* ---------- actions (dummy) ---------- */
  const openWorkspace = (w: EditorWorkspace) => router.push(`${basePath}/${w.id}`);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, w: EditorWorkspace) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelected(w);
    const nearRight = window.innerWidth - rect.right < 250;
    const nearBottom = window.innerHeight - rect.bottom < 150;
    setMenuAnchor({
      x: nearRight ? rect.left - 210 : rect.right - 10,
      y: nearBottom ? rect.top - 230 : rect.top - 20,
    });
  };

  /* ---------- styles ---------- */
  const t = {
    standard: isDark ? "text-white" : "text-[#111]",
    muted: isDark ? "text-white/60" : "text-black/60",
    faint: isDark ? "text-[#8F8F8F]" : "text-black/45",
    gold: isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]",
    shell: isDark ? "bg-[#171717] border-[#171717]" : "bg-white border-black/5",
    card: isDark ? "bg-[#171717] border-white/10" : "bg-white border-[#E5E5E5]",
    control: isDark ? "bg-[#202020] border-white/20 text-white" : "bg-white border-[#E5E5E5] text-black",
  };

  const statusPill = (s: EditingStatus, small = false) => (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border ${small ? "px-2 py-0.5 text-[10px]" : "px-3.5 py-2 text-xs"} ${STATUS[s].cls}`}>
      <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} aria-hidden="true" />
      {STATUS[s].label}
    </span>
  );

  const progressBar = (w: EditorWorkspace) => (
    <div className="flex items-center gap-3 lg:gap-4">
      <div
        className={`h-2.5 flex-1 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}
        role="progressbar"
        aria-valuenow={w.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${w.title} progress`}
      >
        <div className="h-full rounded-full bg-[#E8D1AB]" style={{ width: `${Math.min(100, Math.max(0, w.progress))}%` }} />
      </div>
      <span className={`w-9 text-right text-xs lg:text-sm font-bold ${t.gold}`}>{w.progress}%</span>
    </div>
  );

  const moreActions = (w: EditorWorkspace) => (
    <button
      type="button"
      onClick={(e) => handleOpenMenu(e, w)}
      aria-label={`${w.title} actions`}
      className={`-mr-1 shrink-0 rounded-md p-1 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black/60 hover:bg-black/5 hover:text-black"}`}
    >
      <MoreVertical className="w-4 h-4 lg:w-6 lg:h-6" />
    </button>
  );

  const viewButtons: [FileView, typeof Grid3X3, string][] = [
    ["grid", Grid3X3, "Card view"],
    ["list", List, "List view"],
    ["compact", LayoutGrid, "Compact view"],
  ];

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-5 lg:space-y-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl font-semibold ${t.standard}`}>File Manager</h1>
            <p className={`mt-0.5 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Here&apos;s what&apos;s happening with your shoots and requests today.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Tabs + storage */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className={`flex w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border p-1 no-scrollbar lg:w-fit ${t.shell}`}>
            {tabs.map((tab) => {
              const active = selectedTab === tab.name;
              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => setSelectedTab(tab.name)}
                  aria-pressed={active}
                  className={`flex h-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs lg:text-sm font-medium transition-colors ${active
                    ? isDark ? "bg-white text-black" : "bg-[#E8D1AB] text-black"
                    : isDark ? "text-[#B1B1B1] hover:bg-white/10 hover:text-white" : "text-black/60 hover:bg-black/5 hover:text-black"}`}
                >
                  <tab.icon size={16} className="shrink-0" />
                  {tab.name}
                  {!!tab.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8D1AB] px-1 text-xs font-semibold text-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className={`text-sm lg:text-base space-x-1 ${t.faint}`}>
            <span>Storage Used</span> <span className={`${t.gold}`}>{STORAGE.usedGb} GB</span>
            <span>/ {STORAGE.totalGb} GB</span>
          </p>
        </div>

        {/* Search + status + view toggle */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full">
            <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#727272]" : "text-black/50"}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Project or Shoot ID..."
              className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs lg:text-sm focus:outline-none transition-colors ${isDark ? "bg-[#202020] border-white/20 text-white placeholder:text-[#727272]" : "bg-white border-[#E5E5E5] text-black placeholder:text-black/40"}`}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 md:gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | EditingStatus)}>
              <SelectTrigger className={`h-10 w-[130px] md:w-[150px] rounded-lg text-xs lg:text-sm focus:ring-0 px-5 ${t.control}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#202020] border-[#333333] text-white" : "bg-white border-[#E5E5E5] text-black"}>
                <SelectItem value="all">All Status</SelectItem>
                {(Object.keys(STATUS) as EditingStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className={`h-10 flex items-center overflow-hidden rounded-lg border ${isDark ? "bg-[#202020] border-white/20" : "bg-white border-[#E5E5E5]"}`}>
              {viewButtons.map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-label={label}
                  title={label}
                  aria-pressed={viewMode === mode}
                  className={`h-10 px-3.5 lg:px-5 transition-colors rounded-lg ${viewMode === mode
                    ? "bg-[#E8D1AB] text-black"
                    : isDark ? "text-white hover:text-white/80" : "text-[#666] hover:text-black"}`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status chips */}
        <div className={`w-full flex flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border p-1.5 no-scrollbar ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-black/5"}`}>
          {[{ key: "all" as const, label: "All" }, ...STATUS_CHIPS.map((s) => ({ key: s, label: `${STATUS[s].label} (${statusCounts[s]})` }))].map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                aria-pressed={active}
                className={`flex-1 h-10 shrink-0 whitespace-nowrap rounded-lg px-3 lg:px-5 text-sm lg:text-base transition-colors duration-100 ${active
                  ? "bg-[#E8D1AB] text-black"
                  : isDark ? "text-[#C4C4C4] hover:bg-white/5 hover:text-white" : "text-black/60 hover:bg-black/5 hover:text-black"}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {visible.length === 0 ? (
          <EmptyFolderState isDark={isDark} />
        ) : viewMode === "list" ? (
          <>
            {/* Mobile rows */}
            <div className={`lg:hidden overflow-hidden rounded-xl border divide-y ${isDark ? "border-white/10 divide-white/10 bg-[#171717]" : "border-[#E5E5E5] divide-[#EEEEEE] bg-white"}`}>
              {visible.map((w) => (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openWorkspace(w)}
                  onKeyDown={(e) => e.key === "Enter" && openWorkspace(w)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                >
                  <div className="h-10 w-10 shrink-0 rounded-md" style={{ background: w.cover }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${t.standard}`}>{w.title}</p>
                        <p className={`text-[11px] ${t.gold}`}>{w.service} · {w.shootCode}</p>
                      </div>
                      {moreActions(w)}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {statusPill(w.status, true)}
                      <span className={`text-[11px] ${t.muted}`}>{w.filesDone}/{w.filesTotal} files</span>
                    </div>
                    <div className="mt-2">{progressBar(w)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className={`hidden lg:block overflow-x-auto rounded-xl border ${isDark ? "bg-[#111] border-white/10" : "bg-white border-[#E5E5E5]"}`}>
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${isDark ? "bg-white/[0.03] text-white/40 border-white/10" : "bg-black/[0.04] text-black/45 border-[#E5E5E5]"}`}>
                    <th className="w-[28%] px-5 py-4 font-medium">Project</th>
                    <th className="w-[11%] px-5 py-4 font-medium">Shoot ID</th>
                    <th className="w-[20%] px-5 py-4 font-medium">Status</th>
                    <th className="w-[9%] px-5 py-4 font-medium">Files</th>
                    <th className="w-[14%] px-5 py-4 font-medium">Due Date</th>
                    <th className="w-[13%] px-5 py-4 font-medium">Progress</th>
                    <th className="w-[5%] px-5 py-4" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => openWorkspace(w)}
                      className={`cursor-pointer border-b last:border-0 transition-colors ${isDark ? "border-white/5 hover:bg-white/[0.03]" : "border-black/5 hover:bg-black/[0.02]"}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-md" style={{ background: w.cover }} aria-hidden="true" />
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${t.standard}`} title={w.title}>{w.title}</p>
                            <p className={`truncate text-xs ${t.gold}`}>{w.service}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-4 text-sm ${t.muted}`}>{w.shootCode}</td>
                      <td className="px-5 py-4">{statusPill(w.status)}</td>
                      <td className={`px-5 py-4 text-sm ${t.standard}`}>{w.filesDone}/{w.filesTotal}</td>
                      <td className={`px-5 py-4 text-sm ${t.muted}`}>{formatDue(w.dueDate)}</td>
                      <td className="px-5 py-4">{progressBar(w)}</td>
                      <td className="px-5 py-4 text-right">{moreActions(w)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : viewMode === "compact" ? (
          /* Compact tiles */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {visible.map((w) => (
              <div
                key={w.id}
                role="button"
                tabIndex={0}
                onClick={() => openWorkspace(w)}
                onKeyDown={(e) => e.key === "Enter" && openWorkspace(w)}
                className={`cursor-pointer overflow-hidden rounded-xl border transition-colors ${t.card} ${isDark ? "hover:border-[#E8D1AB]/40" : "hover:border-[#D9C7A0]"}`}
              >
                <div className="h-16" style={{ background: w.cover }} aria-hidden="true" />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`line-clamp-2 text-xs font-semibold ${t.standard}`}>{w.title}</p>
                    {moreActions(w)}
                  </div>
                  {statusPill(w.status, true)}
                  {progressBar(w)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Cards (design default) */
          <div className="grid grid-cols-1 gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visible.map((w) => (
              <article key={w.id} className={`group overflow-hidden rounded-xl border ${isDark ? "bg-[#202020] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
                {/* Cover */}
                <div className="relative h-[100px] lg:h-[150px]" style={{ background: w.cover }}>
                  <div className="relative flex items-start justify-between gap-2 p-3">
                    <span className="rounded-md border border-white/30 bg-black/30 p-2 text-xs text-white">{w.shootCode}</span>
                    {statusPill(w.status)}
                  </div>
                </div>

                {/* Body */}
                <div className={`space-y-4 border-t p-4 ${isDark ? "border-[#3D3D3D]" : "border-[#EEEEEE]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <h3 className={`truncate text-sm font-semibold ${t.standard}`}>{w.title}</h3>
                      <p className={`text-xs ${t.gold}`}>{w.service}</p>
                    </div>
                    {moreActions(w)}
                  </div>

                  <dl className="flex gap-5">
                    <div>
                      <dt className={`text-xs uppercase tracking-wider ${isDark ? "text-[#939393]" : "text-black/45"}`}>Files</dt>
                      <dd className={`mt-0.5 text-sm ${t.standard}`}>{w.filesDone}/{w.filesTotal}</dd>
                    </div>
                    <div>
                      <dt className={`text-xs uppercase tracking-wider ${isDark ? "text-[#939393]" : "text-black/45"}`}>Due Date</dt>
                      <dd className={`mt-0.5 text-sm ${t.standard}`}>{formatDue(w.dueDate)}</dd>
                    </div>
                  </dl>

                  {progressBar(w)}

                  <button
                    type="button"
                    onClick={() => openWorkspace(w)}
                    className={`h-12 w-full rounded-lg text-sm font-semibold transition-colors ${isDark
                      ? "bg-[#2D2D2D] text-white hover:bg-[#E8D1AB] hover:text-black border border-[#3D3D3D]"
                      : "bg-[#F2F2F2] text-[#111] hover:bg-[#E8D1AB]"}`}
                  >
                    View Workspace
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Kebab menu (shared file-manager menu) */}
      {menuAnchor && selected && (
        <FileActionMenu
          folderName={selected.title}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={() => setIsLinkModalOpen(true)}
          anchor={menuAnchor}
          href={`${basePath}/${selected.id}`}
          onOpen={() => openWorkspace(selected)}
          onDownload={() => toast.success(`Preparing ${selected.title}.zip`)}
          onShare={() => toast("Sharing coming soon")}
          onDelete={undefined}
          onRename={() => toast.info("Folder rename is the next safe step.")}
          isDark={isDark}
        />
      )}

      <LinkToShootModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        folderName={selected?.title || ""}
        isDark={isDark}
      />
    </>
  );
}
