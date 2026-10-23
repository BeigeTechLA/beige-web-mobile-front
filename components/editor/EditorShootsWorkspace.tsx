"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Grid3X3,
  List,
  MoreVertical,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Types */

export type EditorType = "internal" | "external";

type ShootStatus =
  | "Booked"
  | "Cancelled"
  | "In-Progress"
  | "Initiated"
  | "PreProduction"
  | "Shoot Day"
  | "PostProduction"
  | "Revision"
  | "Completed"
  | "Assets Delivered"
  | "Unknown";

export interface ShootRecord {
  id: string;
  sourceProject?: Record<string, unknown>;
  customerName: string;
  email: string;
  phone: string;
  initials: string;
  date: string;
  location: string;
  rawDate: number;
  category: string;
  price: string;
  rawPrice: number;
  paidAmount: string;
  pendingAmount: string;
  rawPaid: number;
  rawPending: number;
  status: ShootStatus;
  hasAssignedCp: boolean;
  notesCount: number;
  isActive: boolean;
  needsAttention?: {
    required: boolean;
    missing_fields: string[];
  };
}

export type EditingStatus = "not_started" | "in_progress" | "submitted" | "revision_requested" | "approved" | "completed";
export type AgreementStatus = "pending" | "accepted" | "rejected";

/** ShootRecord + the fields only the editor workspace needs */
export interface EditorShootRecord extends ShootRecord {
  producer: string;
  cp: string;
  editingStatus: EditingStatus;
  agreementStatus: AgreementStatus;
  /** Internal editors: assigned to the logged-in editor ("My Editor Shoots") */
  isMine: boolean;
}

/* Status pills */

const EDITING_STATUS: Record<EditingStatus, { label: string; cls: string }> = {
  not_started: { label: "Not Started", cls: "bg-[#302F2E] text-[#ADADAD]" },
  in_progress: { label: "In Progress", cls: "bg-[#CAD5FF] text-[#264ADC]" },
  submitted: { label: "Submitted", cls: "bg-[#FDF4FF] text-[#C026D3]" },
  revision_requested: { label: "Revision Requested", cls: "bg-[#F0E2C9] text-[#C07D0C]" },
  approved: { label: "Approved", cls: "bg-[#D4FFE4] text-[#16A34A]" },
  completed: { label: "Completed", cls: "bg-[#3D3322] text-[#E8D1AB]" },
};

const AGREEMENT_STATUS: Record<AgreementStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-[#F0E2C9] text-[#C07D0C]" },
  accepted: { label: "Accepted", cls: "bg-[#D4FFE4] text-[#16A34A]" },
  rejected: { label: "Rejected", cls: "bg-[#FFD7D7] text-[#FF6467]" },
};

const StatusPill = ({ label, cls, size = "md" }: { label: string; cls: string; size?: "sm" | "md" }) => (
  <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium ${size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"} ${cls}`}>
    {label}
  </span>
);

/* Dummy data */
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const getInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

type DummyInput = Pick<
  EditorShootRecord,
  "id" | "customerName" | "category" | "producer" | "cp" | "editingStatus" | "agreementStatus" | "isMine" | "status"
> & { isoDate: string; rawPrice: number; rawPaid: number };

const makeShoot = ({ isoDate, rawPrice, rawPaid, ...rest }: DummyInput): EditorShootRecord => {
  const d = new Date(`${isoDate}T00:00:00`);
  const rawPending = Math.max(0, rawPrice - rawPaid);
  return {
    ...rest,
    email: "client@example.com",
    phone: "+10000000000",
    initials: getInitials(rest.customerName),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    rawDate: d.getTime(),
    location: "Los Angeles, CA",
    price: money(rawPrice),
    rawPrice,
    paidAmount: money(rawPaid),
    pendingAmount: money(rawPending),
    rawPaid,
    rawPending,
    hasAssignedCp: true,
    notesCount: 0,
    isActive: true,
    needsAttention: { required: false, missing_fields: [] },
  };
};

const DUMMY_SHOOTS: EditorShootRecord[] = [
  makeShoot({ id: "#123456", customerName: "Hotel Brand Film", isoDate: "2026-10-21", category: "Videography", producer: "Sam Rivera", cp: "Elena Rossi", editingStatus: "not_started", agreementStatus: "pending", isMine: true, status: "PostProduction", rawPrice: 4200, rawPaid: 2100 }),
  makeShoot({ id: "#123457", customerName: "Editorial Portraits", isoDate: "2026-01-13", category: "Photography", producer: "Noah Williams", cp: "Sarah Miller", editingStatus: "in_progress", agreementStatus: "accepted", isMine: true, status: "PostProduction", rawPrice: 1800, rawPaid: 1800 }),
  makeShoot({ id: "#123458", customerName: "Wedding Photo & Film Package", isoDate: "2026-01-13", category: "Video & Photo", producer: "Noah Williams", cp: "Andre Cole", editingStatus: "submitted", agreementStatus: "rejected", isMine: true, status: "Revision", rawPrice: 6500, rawPaid: 3000 }),
  makeShoot({ id: "#123459", customerName: "Music Video", isoDate: "2026-01-13", category: "Photography", producer: "Sam Rivera", cp: "Sarah Miller", editingStatus: "revision_requested", agreementStatus: "pending", isMine: true, status: "Revision", rawPrice: 3200, rawPaid: 3200 }),
  makeShoot({ id: "#123460", customerName: "Baby Shower Video Highlights", isoDate: "2026-01-13", category: "Photography", producer: "Sam Rivera", cp: "Andre Cole", editingStatus: "approved", agreementStatus: "accepted", isMine: true, status: "Completed", rawPrice: 1200, rawPaid: 600 }),
  makeShoot({ id: "#123461", customerName: "Product Photography – Spring", isoDate: "2026-01-13", category: "Video & Photo", producer: "Noah Williams", cp: "Aarav Sharma", editingStatus: "completed", agreementStatus: "pending", isMine: true, status: "Assets Delivered", rawPrice: 2600, rawPaid: 2600 }),
  makeShoot({ id: "#123462", customerName: "Corporate Headshots", isoDate: "2026-02-04", category: "Photography", producer: "Maya Chen", cp: "Leo Martins", editingStatus: "in_progress", agreementStatus: "accepted", isMine: false, status: "PostProduction", rawPrice: 1500, rawPaid: 750 }),
  makeShoot({ id: "#123463", customerName: "Restaurant Launch Reel", isoDate: "2026-02-11", category: "Videography", producer: "Sam Rivera", cp: "Nora Blake", editingStatus: "not_started", agreementStatus: "pending", isMine: false, status: "PostProduction", rawPrice: 2800, rawPaid: 1400 }),
  makeShoot({ id: "#123464", customerName: "Fashion Lookbook", isoDate: "2026-02-18", category: "Video & Photo", producer: "Maya Chen", cp: "Elena Rossi", editingStatus: "submitted", agreementStatus: "accepted", isMine: false, status: "Revision", rawPrice: 5400, rawPaid: 5400 }),
  makeShoot({ id: "#123465", customerName: "Real Estate Walkthrough", isoDate: "2026-02-22", category: "Videography", producer: "Noah Williams", cp: "Leo Martins", editingStatus: "approved", agreementStatus: "pending", isMine: false, status: "Completed", rawPrice: 1900, rawPaid: 950 }),
  makeShoot({ id: "#123466", customerName: "Startup Pitch Video", isoDate: "2026-03-02", category: "Videography", producer: "Maya Chen", cp: "Nora Blake", editingStatus: "revision_requested", agreementStatus: "accepted", isMine: false, status: "Revision", rawPrice: 3600, rawPaid: 1800 }),
];


/* Helpers */
type SortKey = "id" | "customerName" | "producer";

const PAGE_SIZE = 6;

/** Column widths (table-fixed, so these are respected) */
const COLUMN_WIDTHS: Record<EditorType, string[]> = {
  //          Shoot ID  Project   Service   Status    Producer  CP        Action
  internal: ["w-[12%]", "w-[18%]", "w-[15%]", "w-[20%]", "w-[15%]", "w-[12%]", "w-[8%]"],
  // External needs room for Accept / Reject in the Action column
  external: ["w-[10%]", "w-[17%]", "w-[15%]", "w-[13%]", "w-[13%]", "w-[12%]", "w-[20%]"],
};

/* Component  */
interface EditorShootsWorkspaceProps {
  isDark: boolean;
  editorType: EditorType;
  /** Defaults to dummy data */
  shoots?: EditorShootRecord[];
  /** Where a row / card goes */
  getShootHref?: (shoot: EditorShootRecord) => string;
}

export default function EditorShootsWorkspace({
  isDark,
  editorType,
  shoots: initialShoots = DUMMY_SHOOTS,
  getShootHref = (shoot) => `/editor/shoots/${shoot.id.replace(/^#/, "")}`,
}: EditorShootsWorkspaceProps) {
  const router = useRouter();
  const isInternal = editorType === "internal";

  const [shoots, setShoots] = useState<EditorShootRecord[]>(initialShoots);
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [producerFilter, setProducerFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openCardActionId, setOpenCardActionId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  // Board drag-to-pan (same behaviour as ShootsTable)
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const gridPanStateRef = useRef({ startX: 0, scrollLeft: 0, isActive: false, moved: false });
  const [isGridPanning, setIsGridPanning] = useState(false);

  useEffect(() => setShoots(initialShoots), [initialShoots]);

  // Close the ⋮ menus on outside click
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-card-actions]")) return;
      setOpenCardActionId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // External editors only see their own shoots (no "All Shoots" tab)
  const activeTab = isInternal ? tab : "mine";
  const mineCount = shoots.filter((s) => s.isMine).length;
  const othersCount = shoots.filter((s) => !s.isMine).length;

  const statusOf = (s: EditorShootRecord): string => (isInternal ? s.editingStatus : s.agreementStatus);
  const statusOptions = isInternal
    ? (Object.entries(EDITING_STATUS) as [EditingStatus, { label: string }][])
    : (Object.entries(AGREEMENT_STATUS) as [AgreementStatus, { label: string }][]);
  const services = useMemo(() => Array.from(new Set(shoots.map((s) => s.category))), [shoots]);
  const producers = useMemo(() => Array.from(new Set(shoots.map((s) => s.producer))), [shoots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shoots
      .filter((s) => (activeTab === "mine" ? s.isMine : (s.isMine || !s.isMine)))
      .filter((s) => statusFilter === "all" || statusOf(s) === statusFilter)
      .filter((s) => serviceFilter === "all" || s.category === serviceFilter)
      .filter((s) => producerFilter === "all" || s.producer === producerFilter)
      .filter((s) => !q || [s.id, s.customerName, s.producer, s.cp, s.category].join(" ").toLowerCase().includes(q))
      .sort((a, b) => {
        if (!sort) return 0;
        const cmp = a[sort.key].localeCompare(b[sort.key], undefined, { numeric: true });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoots, activeTab, statusFilter, serviceFilter, producerFilter, search, isInternal, sort]);

  // Back to page 1 whenever the result set changes
  useEffect(() => setPage(1), [activeTab, statusFilter, serviceFilter, producerFilter, search, editorType]);
  useEffect(() => setStatusFilter("all"), [editorType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Board view: one column per status (ShootsTable kanban)
  const kanbanColumns = useMemo(() => {
    const entries = isInternal
      ? (Object.entries(EDITING_STATUS) as [string, { label: string }][])
      : (Object.entries(AGREEMENT_STATUS) as [string, { label: string }][]);
    return entries
      .filter(([key]) => statusFilter === "all" || key === statusFilter)
      .map(([key, s]) => {
        const items = filtered.filter((shoot) => statusOf(shoot) === key);
        return { status: key, label: s.label, items, totalItems: items.length };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, isInternal, statusFilter]);

  const requestSort = (key: SortKey) =>
    setSort((cur) => (cur?.key === key ? (cur.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  const getSortIcon = (key: SortKey) => {
    if (sort?.key !== key) {
      return <ArrowUpDown size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
    }
    return sort.dir === "asc"
      ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
      : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setServiceFilter("all");
    setProducerFilter("all");
    setSort(null);
  };

  const handleRowClick = (shoot: EditorShootRecord) => {
    if (!shoot.isActive) return;
    router.push(getShootHref(shoot));
  };

  /* --- board panning --- */
  const handleGridMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, [data-card-actions]")) return;
    const container = gridScrollRef.current;
    if (!container) return;
    gridPanStateRef.current = { startX: event.clientX, scrollLeft: container.scrollLeft, isActive: true, moved: false };
    setIsGridPanning(true);
  };

  const handleGridMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gridPanStateRef.current.isActive) return;
    const container = gridScrollRef.current;
    if (!container) return;
    const deltaX = event.clientX - gridPanStateRef.current.startX;
    if (Math.abs(deltaX) > 5) gridPanStateRef.current.moved = true;
    container.scrollLeft = gridPanStateRef.current.scrollLeft - deltaX;
    event.preventDefault();
  };

  const handleGridMouseEnd = () => {
    gridPanStateRef.current.isActive = false;
    setIsGridPanning(false);
  };

  const handleCardClick = (shoot: EditorShootRecord) => {
    // A drag-to-pan shouldn't count as opening the card
    if (gridPanStateRef.current.moved) {
      gridPanStateRef.current.moved = false;
      return;
    }
    handleRowClick(shoot);
  };

  // Dummy accept / reject (swap for the API later)
  const respond = (shoot: EditorShootRecord, status: Exclude<AgreementStatus, "pending">) => {
    setShoots((prev) => prev.map((s) => (s.id === shoot.id ? { ...s, agreementStatus: status } : s)));
    toast.success(status === "accepted" ? `Accepted ${shoot.customerName}` : `Rejected ${shoot.customerName}`);
  };

  const statusPill = (shoot: EditorShootRecord, size?: "sm" | "md") => {
    const s = isInternal ? EDITING_STATUS[shoot.editingStatus] : AGREEMENT_STATUS[shoot.agreementStatus];
    return <StatusPill label={s.label} cls={s.cls} size={size} />;
  };

  const respondButtons = (shoot: EditorShootRecord) =>
    !isInternal && shoot.agreementStatus === "pending" ? (
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => respond(shoot, "accepted")}
          className="h-8 px-4.5 rounded-md border border-[#16A34A] bg-[#EBFFF0] text-[#16A34A] text-xs font-medium hover:bg-[#DAF7E4] transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => respond(shoot, "rejected")}
          className="text-xs font-medium text-[#F98A84] underline underline-offset-2 hover:text-[#E04545] transition-colors"
        >
          Reject
        </button>
      </div>
    ) : null;

  /** ⋮ menu items (same look as ShootsTable menus) */
  const cardMenuItems = (shoot: EditorShootRecord) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpenCardActionId(null);
        handleRowClick(shoot);
      }}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"}`}
    >
      <ChevronRight size={16} />
      Open details
    </button>
  );

  /* --- styles   --- */
  const strong = isDark ? "text-white" : "text-[#202020]";
  const selectTrigger = isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]";
  const selectContent = isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-black";
  const statusHeader = isInternal ? "Editing Status" : "Agreement Status";
  const widths = COLUMN_WIDTHS[editorType];

  const emptyText = search || statusFilter !== "all" || serviceFilter !== "all" || producerFilter !== "all"
    ? "No shoots match these filters."
    : "No shoots found.";

  return (
    <section className="space-y-4 lg:space-y-5">
      {/* Title + tabs */}
      <div className="space-y-3 lg:space-y-4">
        <h2 className={`text-lg lg:text-xl font-medium ${strong}`}>
          {isInternal ? "Internal Editor Workspace" : "External Editor Workspace"}
        </h2>

        <div role="tablist" className={`inline-flex rounded-xl border p-1.5 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#E5E5E5]"}`}>
          {[
            { key: "mine" as const, label: `My Editor Shoots (${mineCount})` },
            ...(isInternal ? [{ key: "all" as const, label: `All Shoots (${othersCount})` }] : []),
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(t.key)}
                className={`h-10 px-4 lg:px-6 rounded-lg text-sm lg:text-base transition-colors ${active ? "bg-[#E8D1AB] text-black" : isDark ? "text-[#C4C4C4] hover:text-white" : "text-black/60 hover:text-black"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full flex items-center">
          <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shoots, Clients, or IDs..."
            className={`w-full border rounded-lg h-12 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
          />
        </div>

        <div className="flex items-center gap-2 lg:gap-3 justify-between lg:justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[150px] rounded-lg h-10 lg:h-12 text-xs lg:text-sm focus:ring-0 ${selectTrigger}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={selectContent}>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map(([value, s]) => (
                <SelectItem key={value} value={value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`h-10 lg:h-12 text-xs lg:text-sm px-3 lg:px-5 transition-colors lg:font-medium border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#333]" : "border-[#E5E5E5] bg-[#FFFCF6] text-black hover:bg-[#E8D1AB]"}`}
          >
            <SlidersHorizontal size={20} className={`mr-1 ${isDark ? "text-white" : "text-black"}`} />
            Filters
          </Button>

          <div className={`hidden md:flex items-center rounded-lg lg:rounded-xl border overflow-hidden ${isDark ? "bg-[#202020] border-[#FFFFFF33]" : "bg-[#FFFCF6] border-[#E5E5E5]"}`}>
            {([["list", List, "List view"], ["grid", Grid3X3, "Board view"]] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                title={label}
                aria-pressed={viewMode === mode}
                className={`px-4 py-3.5 transition-colors ${viewMode === mode
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-[#666] hover:text-black"}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extra filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className={`w-[160px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 ${selectTrigger}`}>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent className={selectContent}>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={producerFilter} onValueChange={setProducerFilter}>
            <SelectTrigger className={`w-[170px] rounded-lg h-8 lg:h-12 text-xs lg:text-sm focus:ring-0 ${selectTrigger}`}>
              <SelectValue placeholder="Producer" />
            </SelectTrigger>
            <SelectContent className={selectContent}>
              <SelectItem value="all">All Producers</SelectItem>
              {producers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={resetFilters}
            aria-label="Reset filters"
            title="Reset filters"
            className={`h-8 lg:h-12 w-8 lg:w-12 p-0 rounded-lg flex items-center justify-center ${isDark ? "bg-[#202020] text-white border border-white/10 hover:bg-[#2a2a2a]" : "bg-white text-[#333] border border-[#E5E5E5] hover:bg-[#F7F7F7]"}`}
          >
            <RotateCcw size={18} />
          </Button>
        </div>
      )}

      {/* --- RESULTS (ShootsTable) --- */}
      <div className={`w-full overflow-visible transition-all duration-300 ${viewMode === "list"
        ? `rounded-2xl border ${isDark ? "bg-[#111111] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`
        : "bg-transparent border-transparent"}`}
      >
        {filtered.length === 0 ? (
          <div className={`py-20 text-center ${isDark ? "text-white/50" : "text-[#999]"}`}>{emptyText}</div>
        ) : (
          <>
            {/* --- MOBILE (card accordion) --- */}
            {viewMode === "list" && (
              <div className={`lg:hidden transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#111111]" : ""}`}>
                <div className={`flex justify-between px-5 py-3 text-sm font-medium border-b rounded-t-2xl rounded-b-xl ${isDark ? "border-b-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "bg-[#FFFCF6] text-[#000000] border-b-[#E5E5E5]"}`}>
                  <span>Project Name</span>
                  <span>{statusHeader}</span>
                </div>

                <div className="flex flex-col">
                  {rows.map((shoot) => {
                    const open = expandedId === shoot.id;
                    const label = `text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-white/50" : "text-black/50"}`;
                    return (
                      <div
                        key={shoot.id}
                        className={`border-b last:border-b-0 transition-colors ${shoot.isActive ? "" : "opacity-30"} ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"} ${open ? (isDark ? "bg-[#202020]" : "bg-[#F9F9F9]") : (isDark ? "bg-[#171717]" : "bg-white")}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : shoot.id)}
                          aria-expanded={open}
                          className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
                        >
                          <span className="min-w-0 flex items-center gap-3">
                            <span className={`shrink-0 border rounded-full w-6 h-6 flex items-center justify-center transition-colors ${open
                              ? isDark ? "border-[#E8D1AB] text-[#E8D1AB]" : "border-black text-black"
                              : isDark ? "border-white/20 text-white/60" : "border-black/20 text-black/60"}`}
                            >
                              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <span className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                              {shoot.initials}
                            </span>
                            <span className="min-w-0">
                              <span className={`block truncate font-medium text-sm ${isDark ? "text-white" : "text-black"}`}>{shoot.customerName}</span>
                              <span className={`block truncate text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>{shoot.date}</span>
                            </span>
                          </span>
                          {statusPill(shoot, "sm")}
                        </button>

                        {open && (
                          <div className={`px-4 pb-4 pt-1 ${isDark ? "text-white" : "text-black"}`}>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <div className="min-w-0"><p className={label}>Shoot ID</p><p className="font-medium text-sm">{shoot.id}</p></div>
                              <div className="min-w-0 text-right"><p className={label}>Service</p><p className="font-medium text-sm">{shoot.category}</p></div>
                              <div className="min-w-0"><p className={label}>Producer</p><p className="font-medium text-sm truncate">{shoot.producer}</p></div>
                              <div className="min-w-0 text-right"><p className={label}>CP</p><p className="font-medium text-sm truncate">{shoot.cp}</p></div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              {respondButtons(shoot) ?? <span />}
                              <button
                                type="button"
                                onClick={() => handleRowClick(shoot)}
                                disabled={!shoot.isActive}
                                className="h-9 px-4 rounded-lg bg-[#E8D1AB] text-black text-xs font-semibold flex items-center gap-1 disabled:cursor-not-allowed"
                              >
                                Open details <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "grid" ? (
              /* --- BOARD (ShootsTable kanban) --- */
              <div className="relative block pt-0">
                <div
                  ref={gridScrollRef}
                  className={`block w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-6 custom-scrollbar ${isGridPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
                  onMouseDown={handleGridMouseDown}
                  onMouseMove={handleGridMouseMove}
                  onMouseUp={handleGridMouseEnd}
                  onMouseLeave={handleGridMouseEnd}
                >
                  <div className="flex items-start gap-5 w-max min-w-full px-4">
                    {kanbanColumns.map((column) => (
                      <div
                        key={column.status}
                        className={`w-[calc(100vw-48px)] md:w-auto md:basis-[340px] lg:basis-[360px] md:grow shrink-0 rounded-3xl border h-fit ${isDark ? "bg-[#0A0A0A] border-[#FFFFFF33]" : "bg-[#FBF7EF] border-[#E8E0D2]"}`}
                      >
                        <div className={`shrink-0 flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 border-b ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E8E0D2] bg-[#FBF7EF]"}`}>
                          <h4 className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                            {column.label}
                          </h4>
                          <span className={`text-sm font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                            {column.totalItems}
                          </span>
                        </div>

                        <div className="max-h-[max(620px,calc(100vh-420px))] overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
                          {column.items.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/35" : "border-[#E3D9C8] text-[#9A8F7C]"}`}>
                              No shoots in this stage
                            </div>
                          ) : column.items.map((shoot) => (
                            <div
                              key={`${column.status}-${shoot.id}`}
                              onClick={() => handleCardClick(shoot)}
                              className={`group rounded-2xl transition-all duration-200 ${shoot.isActive ? "cursor-pointer" : "cursor-not-allowed"} ${isDark
                                ? "bg-[#202020] hover:bg-[#1A1A1A]"
                                : "border border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"}`}
                            >
                              <div className="flex items-start justify-between gap-3 p-5">
                                <div className={`flex min-w-0 flex-1 items-center gap-3 ${shoot.isActive ? "opacity-100" : "opacity-30"}`}>
                                  <div className="shrink-0 w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl">
                                    {shoot.initials}
                                  </div>
                                  <div className="min-w-0 pt-1">
                                    <h4 className={`text-xs font-semibold leading-snug break-words whitespace-normal ${isDark ? "text-white" : "text-[#111111]"}`}>
                                      {shoot.customerName}
                                    </h4>
                                    <p className={`mt-1 text-sm font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
                                      {shoot.date}
                                    </p>
                                  </div>
                                </div>
                                <div className="relative shrink-0" data-card-actions>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenCardActionId((current) => (current === shoot.id ? null : shoot.id));
                                    }}
                                    className={`shrink-0 cursor-pointer p-1 transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                                    aria-label="Card actions"
                                  >
                                    <MoreVertical size={24} />
                                  </button>

                                  {openCardActionId === shoot.id && (
                                    <div
                                      className={`absolute right-0 top-9 z-20 min-w-[150px] rounded-xl border p-1 shadow-xl ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {cardMenuItems(shoot)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* DIVIDER */}
                              <div className={`h-[1px] w-full ${shoot.isActive ? "opacity-100" : "opacity-30"} ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                              {/* BODY */}
                              <div className={`space-y-4 p-5 ${shoot.isActive ? "opacity-100" : "opacity-30"}`}>
                                {[
                                  ["Shoot ID", shoot.id],
                                  ["Service", shoot.category],
                                  ["Producer", shoot.producer],
                                  ["CP", shoot.cp],
                                ].map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between gap-3">
                                    <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>{label}</p>
                                    <p className={`text-sm text-right font-medium ${isDark ? "text-white" : "text-[#222222]"}`}>{value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* DIVIDER */}
                              <div className={`h-[1px] w-full ${shoot.isActive ? "opacity-100" : "opacity-30"} ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                              {/* FOOTER */}
                              <div
                                className={`flex items-center justify-between gap-3 p-5 ${shoot.isActive ? "opacity-100" : "opacity-30 pointer-events-none select-none"}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {statusPill(shoot, "sm")}
                                {respondButtons(shoot)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* --- DESKTOP (ShootsTable table) --- */
              <div className="hidden lg:block w-full">
                <table className="w-full table-fixed text-left border-collapse rounded-2xl border-spacing-0">
                  <thead>
                    <tr className={`text-sm font-medium border-b transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB] border-[#3D3D3D]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                      <th className={`rounded-2xl p-5 font-medium cursor-pointer group hover:text-opacity-70 transition-colors ${widths[0]}`} onClick={() => requestSort("id")}>
                        <div className="flex items-center">Shoot ID {getSortIcon("id")}</div>
                      </th>
                      <th className={`p-5 font-medium cursor-pointer group hover:text-opacity-70 transition-colors ${widths[1]}`} onClick={() => requestSort("customerName")}>
                        <div className="flex items-center">Project Name {getSortIcon("customerName")}</div>
                      </th>
                      <th className={`p-5 font-medium ${widths[2]}`}>Service</th>
                      <th className={`p-5 font-medium ${widths[3]}`}>{statusHeader}</th>
                      <th className={`p-5 font-medium cursor-pointer group hover:text-opacity-70 transition-colors ${widths[4]}`} onClick={() => requestSort("producer")}>
                        <div className="flex items-center">Producer {getSortIcon("producer")}</div>
                      </th>
                      <th className={`p-5 font-medium ${widths[5]}`}>CP</th>
                      <th className={`rounded-2xl p-5 font-medium text-right ${widths[6]}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((shoot, idx) => {
                      const isMenuOpen = openCardActionId === shoot.id;
                      const shouldOpenUpward = idx >= rows.length - 2;
                      const borderClass = isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]";
                      const actionBorderClass = shoot.isActive
                        ? borderClass
                        : isDark
                          ? "border-[#3D3D3D]/30"
                          : "border-[#E5E5E5]/30";
                      const rowBgClass = isDark
                        ? `bg-[#171717] hover:bg-[#141516] ${shoot.isActive ? "cursor-pointer" : "cursor-not-allowed"}`
                        : `bg-white hover:bg-zinc-50 ${shoot.isActive ? "cursor-pointer" : "cursor-not-allowed"}`;
                      const inactiveOpacityClass = shoot.isActive ? "" : "opacity-30";
                      const textClass = isDark ? "text-white" : "text-[#333]";
                      const shootDetailHref = getShootHref(shoot);
                      const rowLink = shoot.isActive && (
                        <Link
                          href={shootDetailHref}
                          className="absolute inset-0 z-20"
                          aria-label={`Open shoot ${shoot.customerName}`}
                          prefetch={false}
                        />
                      );

                      return (
                        <tr
                          key={shoot.id}
                          className={`group transition-colors relative ${isMenuOpen ? "z-[100]" : "z-0"} ${isDark ? `border-[#222222] ${rowBgClass}` : `border-[#F5F5F5] ${rowBgClass}`}`}
                        >
                          <td className={`relative p-5 text-base ${borderClass} ${textClass}`}>
                            {rowLink}
                            <span className={`relative z-10 pointer-events-none truncate block ${inactiveOpacityClass}`}>{shoot.id}</span>
                          </td>
                          <td className={`relative p-5 ${inactiveOpacityClass} ${borderClass}`}>
                            {rowLink}
                            <div className="relative z-10 pointer-events-none flex items-center gap-3 min-w-0">
                              {/* <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                                {shoot.initials}
                            </div> */}
                              <div className="min-w-0">
                                <p className={`font-medium text-base truncate ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`} title={shoot.customerName}>
                                  {shoot.customerName}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <p className={`text-sm ${isDark ? "text-white/40" : "text-[#999]"}`}>{shoot.date}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`relative p-5 text-base ${inactiveOpacityClass} ${borderClass} ${textClass}`}>
                            {rowLink}
                            <div className="relative z-10 pointer-events-none truncate">{shoot.category}</div>
                          </td>
                          <td className={`relative p-5 ${inactiveOpacityClass} ${borderClass}`}>
                            {rowLink}
                            <div className="relative z-10 pointer-events-none">{statusPill(shoot)}</div>
                          </td>
                          <td className={`relative p-5 text-base ${inactiveOpacityClass} ${borderClass} ${textClass}`}>
                            {rowLink}
                            <div className="relative z-10 pointer-events-none truncate">{shoot.producer}</div>
                          </td>
                          <td className={`relative p-5 text-base ${inactiveOpacityClass} ${borderClass} ${textClass}`}>
                            {rowLink}
                            <div className="relative z-10 pointer-events-none truncate">{shoot.cp}</div>
                          </td>
                          <td className={`p-5 text-right ${actionBorderClass}`}>
                            <div className="relative flex items-center justify-end gap-3" data-card-actions>
                              {respondButtons(shoot)}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenCardActionId((current) => (current === shoot.id ? null : shoot.id));
                                }}
                                className={`cursor-pointer p-1 transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                                aria-label="Actions"
                              >
                                <MoreVertical size={24} />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className={`absolute right-0 z-[200] min-w-[180px] rounded-xl border p-1 shadow-xl text-left ${shouldOpenUpward ? "bottom-9" : "top-9"} ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {cardMenuItems(shoot)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination (ShootsTable; hidden on the board view) */}
        {viewMode === "list" && filtered.length > 0 && (
          <div className={`p-4 lg:p-6 border-t rounded-b-2xl w-full overflow-hidden transition-colors duration-300 min-w-0 ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E5E5E5]"}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between w-full overflow-hidden min-w-0">
              <div className={`hidden lg:block shrink-0 whitespace-nowrap text-sm lg:text-base ${isDark ? "text-white" : "text-[#999]"}`}>
                {`Showing ${startIndex + 1} to ${Math.min(startIndex + PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
              </div>

              <div className="flex gap-2 items-center justify-center sm:justify-end w-full sm:w-auto max-w-full min-w-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
                >
                  <span className="hidden lg:inline">Previous</span>
                  <ChevronLeft className="w-4 h-4 lg:hidden" />
                </button>

                {/* Page numbers (same range logic as ShootsTable) */}
                <div className="flex-1 sm:flex-none flex gap-1 items-center justify-center overflow-x-auto no-scrollbar min-w-0 px-1 py-0.5">
                  {(() => {
                    const rangeArr: (number | "...")[] = [];
                    const delta = 1;
                    const left = safePage - delta;
                    const right = safePage + delta + 1;
                    for (let i = 1; i <= totalPages; i++) {
                      if (i === 1 || i === totalPages || (i >= left && i < right)) rangeArr.push(i);
                      else if (i === left - 1 || i === right) rangeArr.push("...");
                    }
                    return rangeArr
                      .filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...")
                      .map((p, index) =>
                        p === "..." ? (
                          <span key={`dots-${index}`} className={`px-1 text-center text-xs font-semibold select-none shrink-0 min-w-[16px] ${isDark ? "text-white/30" : "text-[#999]"}`}>...</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            aria-current={p === safePage ? "page" : undefined}
                            className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all shrink-0 ${p === safePage
                              ? isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black"
                              : isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100"}`}
                          >
                            {p}
                          </button>
                        )
                      );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight className="w-4 h-4 lg:hidden" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
