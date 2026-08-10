"use client";


import React, { useEffect, useMemo, useState } from "react";
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
  const [rows, setRows] = useState(assignees.map((item, index) => ({ ...item, id: index + 1 })));
  const [nextAssigneeId, setNextAssigneeId] = useState<number | string | undefined>(1);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nextAssignee = rows.find((item: any) => String(item.id) === String(nextAssigneeId)) || rows[0];
  const visibleRows = useMemo(
    () => rows.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

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
            <span className="text-lg font-semibold text-[#E5D5B8]">{shiftName}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-white/45">Drag to reorder the assignment sequence</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#111]">
        <div className="border-b border-[#242424] p-5">
          <div className="mb-8 flex items-center gap-2">
            <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
            <h2 className="text-lg font-medium">Next Assignee</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#303030] text-sm font-semibold text-white/75">
                {nextAssignee.initials}
              </span>
              <div>
                <p className="text-base font-semibold text-white">{nextAssignee.name}</p>
                <p className="mt-1 text-xs text-white/45">Position 1 of 4</p>
              </div>
            </div>

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5D5B8] text-sm font-bold text-black">
              1
            </span>
          </div>
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
            {visibleRows.map((assignee, index) => (
              <div
                key={assignee.name}
                className="flex h-[52px] items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#151515] px-4"
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-white/55" />
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                    index === 0 ? "bg-[#E5D5B8] text-black" : "bg-[#303030] text-white/55"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#303030] text-[10px] font-semibold text-white/60">
                    {assignee.initials}
                  </span>
                  <span className="text-sm text-white/75">{assignee.name}</span>
                </div>

                <div className="flex items-center gap-3">
                  {index === 0 ? (
                    <span className="rounded-full bg-[#E5D5B8] px-3 py-1 text-[10px] font-semibold text-black">
                      Next
                    </span>
                  ) : null}
                  <div className="flex flex-col text-white/35">
                    <ChevronUp size={13} />
                    <ChevronDown size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
