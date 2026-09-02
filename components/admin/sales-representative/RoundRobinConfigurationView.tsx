"use client";


import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Search } from "lucide-react";
import { shiftManagementApi } from "@/lib/api";
import { toast } from "sonner";

type Assignee = {
  name: string;
  initials: string;
};

const assignees: Assignee[] = [
  { name: "Amit Sharma", initials: "AS" },
  { name: "Dhruv Patel", initials: "DP" },
  { name: "Raj Verma", initials: "RV" },
  { name: "Priya Mehta", initials: "PM" },
];

export default function RoundRobinConfigurationView({
  shiftId,
  shiftName,
  onBack,
}: {
  shiftId?: number | string;
  shiftName?: string;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState(assignees.map((item, index) => ({ ...item, id: index + 1 })));
  const [nextAssigneeId, setNextAssigneeId] = useState<number | string | undefined>(1);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nextAssignee = rows.find((item: any) => String(item.id) === String(nextAssigneeId)) || rows[0];
 const visibleRows = useMemo(
    () => rows.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const dragIdRef = useRef<number | string | null>(null);
  const [draggingId, setDraggingId] = useState<number | string | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | null>(null);

  const moveAssignee = (id: number | string, direction: "up" | "down") => {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

const reorderByDrag = (draggedId: number | string, targetId: number | string) => {
    if (draggedId === targetId) return;
    setRows((prev) => {
      const fromIndex = prev.findIndex((r) => r.id === draggedId);
      const toIndex = prev.findIndex((r) => r.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [movedItem] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedItem);
      return next;
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    const load = async () => {
      if (!shiftId) return;
      const response = await shiftManagementApi.getRoundRobin(shiftId);
      const data = response?.data?.data || response?.data;
      const list = data?.assignment_order || data?.salespeople || data?.sales_people || data?.items || [];
      if (Array.isArray(list) && list.length) {
        setRows(list.map((item: any, index: number) => ({
          id: item.sales_rep_id || item.id || item.user_id,
          name: item.name || item.salesperson_name || "Unnamed",
          initials: item.initials || String(item.name || "NA").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
          position: item.position || index + 1,
        })).sort((a: any, b: any) => Number(a.position) - Number(b.position)));
      }
      setNextAssigneeId(data?.next_assignee_sales_rep_id || data?.next_assignee?.sales_rep_id || data?.next_assignee?.id || list?.[0]?.sales_rep_id);
    };
    void load();
  }, [shiftId]);

  return (
    <div className={`min-h-full px-4 py-6 font-[var(--font-geist-sans)] transition-colors duration-300 lg:px-9 lg:py-8 ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-[#323232]"}`}>
      <button
        type="button"
        onClick={onBack}
        className={`mb-7 flex items-center gap-2 text-sm transition hover:text-[#BFA780] ${isDark ? "text-white/85" : "text-[#323232]"}`}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-[#323232]"}`}>Round Robin Configuration</h1>
          {shiftName ? (
            <span className={`text-lg font-semibold capitalize ${isDark ? "text-[#E5D5B8]" : "text-[#8B6F3D]"}`}>{shiftName}</span>
          ) : null}
        </div>
        <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-[#32323266]"}`}>Drag to reorder the assignment sequence</p>
      </div>

      <section className={`overflow-hidden rounded-2xl border transition-colors ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
        <div className={`border-b p-5 ${isDark ? "border-[#242424] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
          <div className="mb-8 flex items-center gap-2">
            <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
            <h2 className="text-lg font-medium">Next Assignee</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${isDark ? "bg-[#303030] text-white/75" : "bg-[#F4F5F7] text-[#323232]"}`}>
                {nextAssignee.initials}
              </span>
              <div>
                <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#323232]"}`}>{nextAssignee.name}</p>
                <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-[#32323266]"}`}>Position 1 of 4</p>
              </div>
            </div>

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5D5B8] text-sm font-bold text-black">
              1
            </span>
          </div>
        </div>

        <div className="p-5">
          <label className="relative block">
            <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-white/28" : "text-[#999]"}`} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`h-11 w-full rounded-lg border pl-11 pr-4 text-sm outline-none transition-colors ${isDark ? "border-[#2D2D2D] bg-[#242424] text-white placeholder:text-white/35" : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#999]"}`}
              placeholder="Search Members..."
            />
          </label>

          <div className="mt-5 flex items-center gap-2">
            <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
            <h2 className="text-lg font-medium">Assignment Order - Drag To Reorder</h2>
          </div>

          <div className="mt-4 space-y-3">
          {visibleRows.map((assignee, index) => {
            const isDragging = draggingId === assignee.id;
            const isOver = dragOverId === assignee.id && !isDragging;

            return (
              <div
                key={assignee.id}
                draggable
                onDragStart={(e) => {
                  dragIdRef.current = assignee.id;
                  setDraggingId(assignee.id);
                  
                  const img = new Image();
                  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent pixel
                  e.dataTransfer.setDragImage(img, 0, 0);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== assignee.id) setDragOverId(assignee.id);
                  if (draggingId && draggingId !== assignee.id) {
                    reorderByDrag(draggingId, assignee.id);
                  }
                }}
                onDragLeave={() => setDragOverId(null)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                  dragIdRef.current = null;
                }}
                className={`group relative flex h-[58px] items-center justify-between rounded-xl border px-4 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? isDark
                      ? "border-[#E5D5B8] bg-[#1c1a15] opacity-50 scale-[0.98] z-0"
                      : "border-[#E5D5B8] bg-[#FFFCE8] opacity-50 scale-[0.98] z-0"
                    : isOver
                      ? isDark
                        ? "border-[#E5D5B8] bg-[#242424] -translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.4)] z-10"
                        : "border-[#E5D5B8] bg-[#FFFCF6] -translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.10)] z-10"
                      : isDark
                        ? "border-[#2D2D2D] bg-[#151515] hover:border-[#E5D5B8]/30"
                        : "border-[#E3E3E3] bg-white hover:border-[#E5D5B8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical 
                    size={16} 
                    className={`transition-colors ${isDragging ? "text-[#E5D5B8]" : isDark ? "text-white/20 group-hover:text-white/50" : "text-[#32323233] group-hover:text-[#32323299]"}`} 
                  />
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                    index === 0 ? "bg-[#E5D5B8] text-black scale-110" : isDark ? "bg-[#303030] text-white/55" : "bg-[#F4F5F7] text-[#32323299]"
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold ${isDark ? "bg-[#222] border-white/5 text-white/80" : "bg-[#FFFCF6] border-[#E3E3E3] text-[#323232]"}`}>
                    {assignee.initials}
                  </span>
                  <span className={`text-sm font-medium transition-colors ${isDragging ? "text-[#E5D5B8]" : isDark ? "text-white/90" : "text-[#323232]"}`}>
                    {assignee.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* DROP INDICATOR LINE */}
                  {isOver && (
                    <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-[#E5D5B8] rounded-full shadow-[0_0_8px_#E5D5B8]" />
                  )}

                  <div className={`flex flex-col gap-0.5 ${isDark ? "text-white/20" : "text-[#32323266]"}`}>
                    <button
                      type="button"
                      onClick={() => moveAssignee(assignee.id, "up")}
                      disabled={index === 0}
                      className={`rounded p-1 disabled:opacity-0 ${isDark ? "hover:bg-white/10 hover:text-white/70" : "hover:bg-black/5 hover:text-[#323232]"}`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAssignee(assignee.id, "down")}
                      disabled={index === visibleRows.length - 1}
                      className={`rounded p-1 disabled:opacity-0 ${isDark ? "hover:bg-white/10 hover:text-white/70" : "hover:bg-black/5 hover:text-[#323232]"}`}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <div className="mt-7 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          className={`h-14 min-w-[150px] rounded-lg border px-8 text-base font-semibold transition hover:border-[#E5D5B8]/60 ${isDark ? "border-[#3D3D3D] bg-[#101010] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}`}
        >
          Back
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            if (!shiftId) {
              onBack();
              return;
            }
            setIsSaving(true);
            const response = await shiftManagementApi.updateRoundRobin(
              shiftId,
              rows.map((row: any, index) => ({ sales_rep_id: row.id, position: index + 1 }))
            );
            setIsSaving(false);
            if (!response.success) {
              toast.error(response.error || "Failed to save order");
              return;
            }
            toast.success("Round robin order saved");
          }}
          className="h-14 min-w-[150px] rounded-lg bg-[#E5D5B8] px-8 text-base font-semibold text-black transition hover:bg-[#D9C49E]"
        >
          {isSaving ? "Saving..." : "Save Order"}
        </button>
      </div>
    </div>
  );
}
