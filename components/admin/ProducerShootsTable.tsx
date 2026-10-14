"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types + dummy data                                                  */
/* ------------------------------------------------------------------ */

export type ProducerShootStatus =
  | "Initiated"
  | "Pre Production"
  | "Shoot Day"
  | "Post Production"
  | "Revision"
  | "Completed"
  | "Assets Delivered"
  | "Cancelled";

export interface ProducerShoot {
  id: string;          // "#123456"
  projectName: string; // "Alo Winter Campaign"
  date: string;        // "Jan 13, 2026"
  location: string;
  service: string;     // "Videography" | "Photography" | "Video & Photo"
  status: ProducerShootStatus;
  salesRep: string;
  cp: string;
}

const PROJECTS = [
  "Alo Winter Campaign", "Editorial Portraits", "Wedding Photoshoot", "Music Video",
  "Baby Shower Videography", "Product Photography", "Brand Launch Event", "Corporate Headshots",
  "Real Estate Walkthrough", "Fashion Lookbook", "Restaurant Menu Shoot", "Graduation Portraits",
];
const LOCATIONS = ["Los Angeles, CA", "Queens, NY", "Miami, FL", "Los Angeles, CA", "Los Angeles, CA", "Los Angeles, CA", "Austin, TX", "Chicago, IL"];
const SERVICES = ["Videography", "Photography", "Video & Photo", "Photography", "Photography", "Video & Photo"];
const STATUSES: ProducerShootStatus[] = ["Initiated", "Post Production", "Completed", "Revision", "Pre Production", "Initiated", "Shoot Day", "Assets Delivered"];
const CPS = ["Sarah Miller", "Sarah Miller", "Andre Cole", "Sarah Miller", "Andre Cole", "Aarav Sharma"];
const REPS = ["Noah Williams", "Noah Williams", "Noah Williams", "Emma Davis"];

export const DUMMY_PRODUCER_SHOOTS: ProducerShoot[] = Array.from({ length: 24 }, (_, i) => ({
  id: `#${123456 + i}`,
  projectName: PROJECTS[i % PROJECTS.length],
  date: new Date(2026, 0, 13 + i * 3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  location: LOCATIONS[i % LOCATIONS.length],
  service: SERVICES[i % SERVICES.length],
  status: STATUSES[i % STATUSES.length],
  salesRep: REPS[i % REPS.length],
  cp: CPS[i % CPS.length],
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Pastel pills from the design (same in light + dark)
const STATUS_PILL: Record<ProducerShootStatus, string> = {
  "Initiated": "bg-[#FFF2C6] text-[#C06D24]",
  "Pre Production": "bg-[#FBF1FF] text-[#B13CD8]",
  "Shoot Day": "bg-[#FFE4D6] text-[#C2410C]",
  "Post Production": "bg-[#E4D4FF] text-[#5B21B6]",
  "Revision": "bg-[#CFDAFF] text-[#2E4FD1]",
  "Completed": "bg-[#D4FFE4] text-[#16A34A]",
  "Assets Delivered": "bg-[#CCF5F1] text-[#0F766E]",
  "Cancelled": "bg-[#FFD6D6] text-[#DC2626]",
};

const StatusPill = ({ status, mobile = false }: { status: ProducerShootStatus; mobile?: boolean }) => (
  <span
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium ${mobile ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm lg:text-base"} ${STATUS_PILL[status] ?? "bg-[#E5E5E5] text-[#525252]"}`}
  >
    {status}
  </span>
);

// 1 2 3 … 10  /  1 … 4 5 6 … 10
const pageList = (current: number, total: number): (number | "...")[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

/* ------------------------------------------------------------------ */
/* Grid view: Kanban board by shoot status (ported from ShootsTable)   */
/* ------------------------------------------------------------------ */

const KANBAN_STATUS_ORDER: ProducerShootStatus[] = [
  "Initiated",
  "Pre Production",
  "Shoot Day",
  "Post Production",
  "Revision",
  "Completed",
  "Assets Delivered",
  "Cancelled",
];

const initialsOf = (name: string) =>
  name
    .split(/[\s\-–—]+/)
    .filter((part) => /[a-zA-Z0-9]/.test(part))
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

function ProducerShootsBoard({
  isDark,
  shoots,
  onOpen,
}: {
  isDark: boolean;
  shoots: ProducerShoot[];
  onOpen: (id: string) => void;
}) {
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef({ startX: 0, scrollLeft: 0, isActive: false, moved: false });
  const [isPanning, setIsPanning] = useState(false);

  // Card order per column (drag a card within its column to reorder, like ShootsTable)
  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [dragged, setDragged] = useState<{ id: string; status: ProducerShootStatus } | null>(null);

  const columns = useMemo(() => {
    return KANBAN_STATUS_ORDER.map((status) => {
      const items = shoots.filter((s) => s.status === status);
      const saved = order[status] || [];
      const byId = new Map(items.map((s) => [s.id, s]));
      const ordered = [
        ...saved.filter((id) => byId.has(id)),
        ...items.map((s) => s.id).filter((id) => !saved.includes(id)),
      ].map((id) => byId.get(id)!);
      return { status, items: ordered };
    });
  }, [shoots, order]);

  const reorder = (status: ProducerShootStatus, draggedId: string, targetId?: string) => {
    if (draggedId === targetId) return;
    const ids = (columns.find((c) => c.status === status)?.items || []).map((s) => s.id);
    const from = ids.indexOf(draggedId);
    if (from === -1) return;
    ids.splice(from, 1);
    const to = targetId ? ids.indexOf(targetId) : ids.length;
    ids.splice(to === -1 ? ids.length : to, 0, draggedId);
    setOrder((prev) => ({ ...prev, [status]: ids }));
  };

  // Click-and-drag on empty board space pans horizontally
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, [draggable='true']")) return;
    const el = gridScrollRef.current;
    if (!el) return;
    panRef.current = { startX: e.clientX, scrollLeft: el.scrollLeft, isActive: true, moved: false };
    setIsPanning(true);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panRef.current.isActive || !gridScrollRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    gridScrollRef.current.scrollLeft = panRef.current.scrollLeft - dx;
    e.preventDefault();
  };
  const endPan = () => {
    panRef.current.isActive = false;
    setIsPanning(false);
  };

  const gold = isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]";
  const value = isDark ? "text-white" : "text-[#222222]";
  const dividerCls = `h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`;

  return (
    <div className="relative block pt-0">
      <div
        ref={gridScrollRef}
        className={`block w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-6 custom-scrollbar ${isPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
      >
        <div className="flex items-start gap-5 w-max min-w-full px-4">
          {columns.map((column) => (
            <div
              key={column.status}
              className={`w-[calc(100vw-48px)] md:w-auto md:basis-[340px] lg:basis-[360px] md:grow shrink-0 rounded-3xl border h-fit ${isDark ? "bg-[#0A0A0A] border-[#FFFFFF33]" : "bg-[#FBF7EF] border-[#E8E0D2]"}`}
            >
              {/* Column header */}
              <div className={`shrink-0 flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 border-b ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E8E0D2] bg-[#FBF7EF]"}`}>
                <h4 className={`text-sm font-medium ${gold}`}>{column.status}</h4>
                <span className={`text-sm font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>{column.items.length}</span>
              </div>

              {/* Cards */}
              <div
                className="max-h-[max(620px,calc(100vh-420px))] overflow-y-auto no-scrollbar px-4 py-4 space-y-3"
                onDragOver={(e) => { if (dragged?.status === column.status) e.preventDefault(); }}
                onDrop={(e) => {
                  if (!dragged || dragged.status !== column.status) return;
                  e.preventDefault();
                  reorder(column.status, dragged.id);
                  setDragged(null);
                }}
              >
                {column.items.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/35" : "border-[#E3D9C8] text-[#9A8F7C]"}`}>
                    No shoots in this stage
                  </div>
                ) : column.items.map((shoot) => (
                  <div
                    key={shoot.id}
                    onClick={() => onOpen(shoot.id)}
                    draggable
                    onDragStart={() => setDragged({ id: shoot.id, status: column.status })}
                    onDragEnd={() => setDragged(null)}
                    onDragOver={(e) => { if (dragged?.status === column.status) { e.preventDefault(); e.stopPropagation(); } }}
                    onDrop={(e) => {
                      if (!dragged || dragged.status !== column.status) return;
                      e.preventDefault();
                      e.stopPropagation();
                      reorder(column.status, dragged.id, shoot.id);
                      setDragged(null);
                    }}
                    className={`group cursor-pointer rounded-2xl transition-all duration-200 ${isDark
                      ? "bg-[#202020] hover:bg-[#1A1A1A]"
                      : "border border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
                      } ${dragged?.id === shoot.id ? "opacity-50 scale-95" : "opacity-100"}`}
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-3 p-5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="shrink-0 w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl">
                          {initialsOf(shoot.projectName)}
                        </div>
                        <div className="min-w-0 pt-1">
                          <h4 className={`text-xs font-semibold leading-snug break-words whitespace-normal ${isDark ? "text-white" : "text-[#111111]"}`}>
                            {shoot.projectName}
                          </h4>
                          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>{shoot.date}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Open ${shoot.projectName}`}
                        onClick={(e) => { e.stopPropagation(); onOpen(shoot.id); }}
                        className={`shrink-0 p-1 transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                      >
                        <ChevronRight size={22} />
                      </button>
                    </div>

                    <div className={dividerCls} />

                    {/* BODY */}
                    <div className="space-y-4 p-5">
                      {([
                        ["Shoot ID", shoot.id],
                        ["Location", shoot.location],
                        ["Service", shoot.service],
                        ["Sales Rep", shoot.salesRep],
                        ["CP", shoot.cp],
                      ] as const).map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <p className={`text-sm font-medium shrink-0 ${gold}`}>{label}</p>
                          <p className={`text-sm text-right font-medium truncate ${value}`} title={val}>{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className={dividerCls} />

                    {/* FOOTER */}
                    <div className="flex items-center justify-between p-5">
                      <StatusPill status={shoot.status} mobile />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface ProducerShootsTableProps {
  isDark: boolean;
  /** Search box on the page (matches project name, shoot ID, location, CP, sales rep) */
  searchQuery?: string;
  /** Pass real data later; falls back to dummy data */
  data?: ProducerShoot[];
  pageSize?: number;
  detailBasePath?: string;
  viewMode?: "grid" | "list";
}

export function ProducerShootsTable({
  isDark,
  searchQuery = "",
  viewMode = "list",
  data,
  pageSize = 10,
  detailBasePath = "/admin/shoots",
}: ProducerShootsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Simulated first load (dummy data) so the loading state matches the rest of the page
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Back to page 1 when the search changes
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [searchQuery]);

  // Simulated page fetch: rows stay visible and fade slightly (project pattern)
  const goToPage = (next: number) => {
    setIsFetching(true);
    setPage(next);
    setExpandedId(null);
    setTimeout(() => setIsFetching(false), 250);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = data ?? DUMMY_PRODUCER_SHOOTS;
    if (!q) return rows;
    return rows.filter((s) =>
      [s.projectName, s.id, s.location, s.cp, s.salesRep, s.service]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openShoot = (id: string) => router.push(`${detailBasePath}/${id.replace(/^#/, "")}`);

  // Colours
  const cardCls = isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]";
  const headCls = isDark ? "bg-[#0A0A0A] text-[#E8D1AB] border-[#333333]" : "bg-[#FFFCF6] text-[#000000] border-[#E5E5E5]";
  const cellText = isDark ? "text-white" : "text-[#333]";
  const mutedText = isDark ? "text-[#666666]" : "text-[#999]";
  const rowHover = isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]";
  const divider = isDark ? "border-[#333333]" : "border-[#E5E5E5]";

  return (
    <div className={`w-full transition-colors duration-300 ${viewMode === "list" ? `overflow-hidden rounded-2xl border ${cardCls}` : "bg-transparent"}`}>
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`py-20 text-center ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
      ) : viewMode === "grid" ? (
        <ProducerShootsBoard isDark={isDark} shoots={filtered} onOpen={openShoot} />
      ) : (
        <>
          {/*  MOBILE VIEW (Card Accordion)  */}
          <div className="lg:hidden">
            <div className={`flex justify-between text-sm font-medium px-4 py-3 rounded-b-2xl border-b ${headCls}`}>
              <span>Project Client</span>
              <span>Status</span>
            </div>

            <div className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
              {rows.map((shoot) => {
                const isExpanded = expandedId === shoot.id;
                return (
                  <div
                    key={shoot.id}
                    onClick={() => openShoot(shoot.id)}
                    className={`cursor-pointer px-4 py-3.5 border-b last:border-b-0 transition-colors ${isDark ? "border-white/5" : "border-[#F0F0F0]"} ${rowHover}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={isExpanded ? "Hide details" : "Show details"}
                          aria-expanded={isExpanded}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : shoot.id);
                          }}
                          className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full border ${isExpanded ? "border-[#E8D1AB] text-[#E8D1AB]" : "border-[#777674] text-[#777674]"}`}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#000000]"}`}>{shoot.projectName}</p>
                          <p className={`text-xs mt-0.5 ${mutedText}`}>Date : {shoot.date}</p>
                        </div>
                      </div>
                      <StatusPill status={shoot.status} mobile />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-3 pl-9">
                        <div className="min-w-0">
                          <p className="text-[#666] text-[10px] uppercase tracking-wider">Shoot ID</p>
                          <p className={`text-sm ${cellText}`}>{shoot.id}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-[#666] text-[10px] uppercase tracking-wider">Service</p>
                          <p className={`text-sm ${cellText}`}>{shoot.service}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#666] text-[10px] uppercase tracking-wider">Location</p>
                          <p className={`text-sm truncate ${cellText}`}>{shoot.location}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-[#666] text-[10px] uppercase tracking-wider">Sales Rep</p>
                          <p className={`text-sm truncate ${cellText}`}>{shoot.salesRep}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#666] text-[10px] uppercase tracking-wider">CP</p>
                          <p className={`text-sm truncate ${cellText}`}>{shoot.cp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/*  DESKTOP VIEW (Standard Table)  */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left table-fixed border-separate border-spacing-0">
              <thead>
                <tr className={`text-base font-medium ${headCls}`}>
                  <th className={`w-[10%] py-5 px-6 font-medium border-b rounded-bl-2xl ${divider}`}>Shoot ID</th>
                  <th className={`w-[17%] py-5 px-4 font-medium border-b ${divider}`}>Project Client</th>
                  <th className={`w-[12%] py-5 px-4 font-medium border-b ${divider}`}>Location</th>
                  <th className={`w-[12%] py-5 px-4 font-medium border-b ${divider}`}>Service</th>
                  <th className={`w-[17%] py-5 px-4 font-medium border-b ${divider}`}>Shoot Status</th>
                  <th className={`w-[12%] py-5 px-4 font-medium border-b ${divider}`}>Sale Rep</th>
                  <th className={`w-[12%] py-5 px-4 font-medium border-b ${divider}`}>CP</th>
                  <th className={`w-[8%] py-5 px-6 font-medium text-right border-b rounded-br-2xl ${divider}`}>Action</th>
                </tr>
              </thead>
              <tbody className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
                {/* spacer under the header, like the design */}
                <tr aria-hidden="true"><td colSpan={8} className="h-3 p-0" /></tr>
                {rows.map((shoot) => (
                  <tr
                    key={shoot.id}
                    onClick={() => openShoot(shoot.id)}
                    className={`group cursor-pointer transition-colors ${rowHover}`}
                  >
                    <td className={`py-3.5 px-6 text-base ${cellText}`}>{shoot.id}</td>
                    <td className="py-3.5 px-4">
                      <p className={`font-medium text-base truncate ${isDark ? "text-white" : "text-[#000000]"}`} title={shoot.projectName}>
                        {shoot.projectName}
                      </p>
                      <p className={`text-sm mt-0.5 ${mutedText}`}>Date : {shoot.date}</p>
                    </td>
                    <td className={`py-3.5 px-4 text-base truncate ${cellText}`} title={shoot.location}>{shoot.location}</td>
                    <td className={`py-3.5 px-4 text-base truncate ${cellText}`}>{shoot.service}</td>
                    <td className="py-3.5 px-4"><StatusPill status={shoot.status} /></td>
                    <td className={`py-3.5 px-4 text-base truncate ${cellText}`}>{shoot.salesRep}</td>
                    <td className={`py-3.5 px-4 text-base truncate ${cellText}`}>{shoot.cp}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        aria-label={`Open ${shoot.projectName}`}
                        onClick={(e) => { e.stopPropagation(); openShoot(shoot.id); }}
                        className={`inline-flex items-center justify-center p-1 rounded-md transition-colors ${isDark ? "text-white hover:text-[#E8D1AB]" : "text-black/60 hover:text-black"}`}
                      >
                        <ChevronRight size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr aria-hidden="true"><td colSpan={8} className="h-3 p-0" /></tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between gap-3 border-t px-4 lg:px-6 py-4 ${divider}`}>
            <p className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>
              Page {safePage} of {totalPages}
            </p>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                onClick={() => goToPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5"}`}
              >
                <ChevronLeft size={18} />
              </button>
              {pageList(safePage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className={`w-6 lg:w-9 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`w-8 h-8 lg:w-11 lg:h-11 rounded-lg text-sm lg:text-base tabular-nums transition-colors ${p === safePage
                      ? (isDark ? "border border-white/30 bg-[#1F1F1F] text-white" : "border border-[#CFAF78] bg-[#FFF8EC] text-black")
                      : (isDark ? "text-white/50 hover:bg-white/5" : "text-black/50 hover:bg-black/5")}`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5"}`}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

export default ProducerShootsTable;
