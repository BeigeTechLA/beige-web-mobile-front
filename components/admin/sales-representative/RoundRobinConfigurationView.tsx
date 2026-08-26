"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Search, Loader2} from "lucide-react";
import { shiftManagementApi } from "@/lib/api";
import { toast } from "sonner";

type Assignee = {
  id: number | string;
  name: string;
  initials: string;
  position: number;
};

export default function RoundRobinConfigurationView({
  shiftId,
  shiftName,
  onBack,
}: {
  shiftId?: number | string;
  shiftName?: string;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<Assignee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const nextAssignee = rows[0] ?? null;
  const visibleRows = useMemo(
    () => rows.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const dragIdRef = useRef<number | string | null>(null);
  const [draggingId, setDraggingId] = useState<number | string | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | null>(null);

  const moveAssignee = (id: number | string, direction: "up" | "down") => {
    setRows((prev) => {
      const i = prev.findIndex((row) => String(row.id) === String(id));
      const j = direction === "up" ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= prev.length) {return prev;}
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return normalizePositions(next);
    });
  };

  const reorderByDrag = (draggedId: number | string, targetId: number | string) => {
    if (String(draggedId) === String(targetId)) { return;}

    setRows((prev) => {
      const fromIndex = prev.findIndex((row) => String(row.id) === String(draggedId));
      const toIndex = prev.findIndex((row) => String(row.id) === String(targetId));
      if (fromIndex === -1 || toIndex === -1) {return prev;}

      const next = [...prev];
      const [movedItem] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedItem);
      return normalizePositions(next);
    });
  };

  const normalizePositions = (items: Assignee[]) =>
    items.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!shiftId) {
        setRows([]);
        if (isMounted) {setIsLoading(false);}
        return;
      }

      setIsLoading(true);
      try {
        const response = await shiftManagementApi.getRoundRobin(shiftId);
        if (!isMounted) return;
        const data = response?.data?.data || response?.data;
        const list = data?.assignment_order || data?.salespeople || data?.sales_people || data?.items || [];
        if (!Array.isArray(list)) {
          setRows([]);
          return;
        }

        const mappedRows: Assignee[] = list
          .map((item: any, index: number) => {
            const name = item.name || item.salesperson_name || "Unnamed";
            return {
              id: item.sales_rep_id || item.id || item.user_id,
              name,
              initials: item.initials || String(name).trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
              position: Number(item.position || index + 1),
            };}).sort((a, b) => Number(a.position) - Number(b.position));
        setRows(mappedRows);
      } catch (error) {
        console.error("Failed to load round robin configuration", error);
        if (isMounted) {
          setRows([]);
          toast.error("Failed to load round robin configuration");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [shiftId]);

  return (
    <div className="min-h-full bg-[#101010] px-4 py-6 font-[var(--font-geist-sans)] text-white lg:px-9 lg:py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-7 flex items-center gap-2 text-sm text-white/85 transition hover:text-[#E5D5B8]"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Round Robin Configuration</h1>
          {shiftName ? (
            <span className="text-lg font-semibold text-[#E5D5B8] capitalize">{shiftName}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-white/45">Drag to reorder the assignment sequence</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#111]">
        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="flex items-center gap-3 text-base text-[#D4D4D8]">
              <Loader2 size={18} className="animate-spin text-[#E5D5B8]" />
              Loading round robin configuration...
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-[#242424] p-5">
              <div className="mb-8 flex items-center gap-2">
                <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
                <h2 className="text-lg font-medium">Next Assignee</h2>
              </div>

              {nextAssignee ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#303030] text-sm font-semibold text-white/75">
                      {nextAssignee.initials}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">{nextAssignee.name}</p>
                      <p className="mt-1 text-xs text-white/45">Position 1 of {rows.length}</p>
                    </div>
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5D5B8] text-sm font-bold text-black">
                    1
                  </span>
                </div>
              ) : (
                <div className="py-3 text-sm text-white/45">
                  No salesperson assigned to this shift
                </div>
              )}
            </div>

            <div className="p-5">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#2D2D2D] bg-[#242424] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35"
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
                        img.src ="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 1x1 transparent pixel
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
                          ? "border-[#E5D5B8] bg-[#1c1a15] opacity-50 scale-[0.98] z-0"
                          : isOver
                            ? "border-[#E5D5B8] bg-[#242424] -translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.4)] z-10"
                            : "border-[#2D2D2D] bg-[#151515] hover:border-[#E5D5B8]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical
                          size={16}
                          className={`transition-colors ${isDragging ? "text-[#E5D5B8]" : "text-white/20 group-hover:text-white/50"}`}
                        />
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                            index === 0 ? "bg-[#E5D5B8] text-black scale-110" : "bg-[#303030] text-white/55"
                          }`}>
                          {index + 1}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#222] border border-white/5 text-[10px] font-semibold text-white/80">
                          {assignee.initials}
                        </span>
                        <span className={`text-sm font-medium transition-colors ${isDragging ? "text-[#E5D5B8]" : "text-white/90"}`}>
                          {assignee.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* DROP INDICATOR LINE */}
                        {isOver && (
                          <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-[#E5D5B8] rounded-full shadow-[0_0_8px_#E5D5B8]" />
                        )}

                        <div className="flex flex-col gap-0.5 text-white/20">
                          <button
                            type="button"
                            onClick={() => moveAssignee(assignee.id, "up")}
                            disabled={index === 0}
                            className="rounded p-1 hover:bg-white/10 hover:text-white/70 disabled:opacity-0"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAssignee(assignee.id, "down")}
                            disabled={index === visibleRows.length - 1}
                            className="rounded p-1 hover:bg-white/10 hover:text-white/70 disabled:opacity-0"
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
          </>
        )}
      </section>

      <div className="mt-7 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-14 min-w-[150px] rounded-lg border border-[#3D3D3D] bg-[#101010] px-8 text-base font-semibold text-white transition hover:border-[#E5D5B8]/50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={isSaving || isLoading || rows.length === 0}
          onClick={async () => {
            if (!shiftId) {
              onBack();
              return;
            }
            setIsSaving(true);
            const response = await shiftManagementApi.updateRoundRobin(
              shiftId,
              rows.map((row: any, index) => ({ sales_rep_id: row.id, position: index + 1,})),
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
