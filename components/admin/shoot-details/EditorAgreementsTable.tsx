"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

export type EditorAgreementStatus =
  | "Assigned"
  | "Accepted"
  | "Pending"
  | "Rejected"
  | "Draft"
  | "Not Sent"
  | "Cancelled";

export interface EditorAgreementItem {
  id: string;
  assignmentId: number;
  agreementId?: number;
  name: string;
  role: string;            // "Internal Editor" / "External Editor"
  avatarUrl: string;
  avatarBg?: string;
  agreementType: string;
  version: string;
  compensation: string;
  status: EditorAgreementStatus;
  actionLabel: string;     // kept for compatibility (first menu item)
}


/* Dummy data                                                          */


export const DUMMY_EDITOR_AGREEMENTS: EditorAgreementItem[] = [
  { id: "ea_1", assignmentId: 1, name: "Priya Shah", role: "Internal Editor", avatarUrl: "", avatarBg: "#EAFCDB", agreementType: "", version: "", compensation: "$6,250.00", status: "Assigned", actionLabel: "View Details" },
  { id: "ea_2", assignmentId: 2, agreementId: 31, name: "Liam Torres", role: "Internal Editor", avatarUrl: "", avatarBg: "#F6EEDD", agreementType: "Editing Agreement", version: "v1", compensation: "$3,800.00", status: "Pending", actionLabel: "View Agreement" },
  { id: "ea_3", assignmentId: 3, agreementId: 32, name: "Zara Khan", role: "External Editor", avatarUrl: "", avatarBg: "#E3E7EA", agreementType: "Freelance Agreement", version: "v2", compensation: "$4,500.00", status: "Accepted", actionLabel: "View Agreement" },
];


/* Helpers   */


const STATUS_PILL: Record<EditorAgreementStatus, { light: string; dark: string }> = {
  Assigned: { light: "bg-[#DFFBE8] text-[#2E9E4F]", dark: "bg-[#DFFBE8] text-[#2E9E4F]" },
  Accepted: { light: "bg-[#D4FFE4] text-[#16A34A]", dark: "bg-[#D4FFE4] text-[#16A34A]" },
  Pending: { light: "bg-[#FFF4C9] text-[#BA6605]", dark: "bg-[#FFF4C9] text-[#BA6605]" },
  Rejected: { light: "bg-[#FEE2E2] text-[#991B1B]", dark: "bg-[#FEE2E2] text-[#991B1B]" },
  Cancelled: { light: "bg-[#FEE2E2] text-[#991B1B]", dark: "bg-[#FEE2E2] text-[#991B1B]" },
  Draft: { light: "bg-[#E5E7EB] text-[#4B5563]", dark: "bg-[#262626] text-[#A3A3A3]" },
  "Not Sent": { light: "bg-[#E5E7EB] text-[#4B5563]", dark: "bg-[#262626] text-[#D0D0D0]" },
};

const AVAILABLE_STATUSES: ("all" | EditorAgreementStatus)[] = [
  "all", "Assigned", "Not Sent", "Draft", "Pending", "Accepted", "Rejected", "Cancelled",
];

const DEFAULT_ACTIONS = ["View Details", "Send Agreement", "Remove Editor"];

const orDash = (v?: string) => (v && v.trim() ? v : "--");

function RowActions({
  item,
  isDark,
  actions,
  onSelect,
}: {
  item: EditorAgreementItem;
  isDark: boolean;
  actions: string[];
  onSelect: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number; up: boolean }>({ top: 0, right: 0, up: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The table scrolls sideways (overflow-x-auto), which would clip a normal dropdown,
  // so the menu is portalled to <body> and positioned next to the ⋮ button.
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = 48 * actions.length + 8;
    const up = window.innerHeight - r.bottom < menuH + 12 && r.top > menuH + 12;
    setPos({ top: up ? r.top - 4 : r.bottom + 4, right: window.innerWidth - r.right, up });
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  return (
    <div className="relative inline-flex justify-end">
      <button
        ref={btnRef}
        type="button"
        aria-label={`Actions for ${item.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) place();
          setOpen((v) => !v);
        }}
        className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
      >
        <MoreVertical size={22} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, right: pos.right, transform: pos.up ? "translateY(-100%)" : undefined }}
          className={`z-[200] min-w-[180px] rounded-xl border p-1 shadow-xl text-left ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
        >
          {actions.map((action) => {
            const danger = /remove|cancel|delete/i.test(action);
            return (
              <button
                key={action}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect(action);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${danger
                  ? (isDark ? "text-red-400 hover:bg-white/10" : "text-red-600 hover:bg-red-50")
                  : (isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]")}`}
              >
                {action}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

/* Component */

interface EditorAgreementsTableProps {
  agreements?: EditorAgreementItem[];
  onActionClick?: (agreement: EditorAgreementItem, action: string) => void;
  actions?: string[];
  title?: string;
}

export default function EditorAgreementsTable({
  agreements = DUMMY_EDITOR_AGREEMENTS,
  onActionClick,
  actions = DEFAULT_ACTIONS,
  title = "Editor Assignment",
}: EditorAgreementsTableProps) {
  const { isDark } = useResolvedTheme();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAgreements =
    statusFilter && statusFilter !== "all"
    ? agreements.filter((item) => item.status === statusFilter)
    : agreements;

  const menuFor = (item: EditorAgreementItem) =>
    item.actionLabel && !actions.includes(item.actionLabel) ? [item.actionLabel, ...actions] : actions;

  return (
    <div
      className={`w-full overflow-hidden transition-colors ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E5E7EB]"}`}
    >
      {/* Table Header Controls */}
      <div className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h3 className={`w-full text-base lg:text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
          {title}
        </h3>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className={`max-w-[170px] ${isDark
              ? "border-white/20 bg-[#202020] text-white data-[placeholder]:text-white/50"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] data-[placeholder]:text-black/50"
              }`}
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent
            className={`${isDark
              ? "bg-[#3D3D3D] border-white/10 text-white"
              : "bg-white border-[#E5E7EB] text-[#323232]"
              }`}
          >
            {AVAILABLE_STATUSES.map((status) => (
              <SelectItem
                key={status}
                value={status}
                className={isDark ? "focus:bg-[#262626] focus:text-white" : "focus:bg-[#F3F4F6] focus:text-black"}
              >
                {status === "all" ? "All Status" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          {/* Table Header */}
          <thead>
            <tr
              className={`border-y text-sm font-medium ${isDark
                ? "border-[#3D3D3D] bg-[#171717] text-[#E8D1AB]"
                : "border-[#E5E7EB] bg-[#FAFAFA] text-[#8C7A58]"
                }`}
            >
              <th className="p-5 w-[28%]">Creative Partner</th>
              <th className="py-5 px-3 w-[18%]">Agreement Type</th>
              <th className="py-5 px-3 w-[11%]">Version</th>
              <th className="py-5 px-3 w-[16%]">Compensation</th>
              <th className="py-5 px-3 w-[17%]">Status</th>
              <th className="p-5 text-right w-[10%]">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredAgreements.map((item) => {
              const pill = STATUS_PILL[item.status] ?? STATUS_PILL["Not Sent"];
              return (
              <tr
                key={item.id}
                className={`transition-colors group text-sm ${isDark ? "hover:bg-[#141414]" : "hover:bg-[#F9FAFB]"}`}
              >
                  {/* Creative Partner */}
                <td className="p-5">
                    <div className="flex items-center gap-2 min-w-0">
                    <div className={`relative w-10 h-10 rounded-lg overflow-hidden shrink-0 p-2.5 flex items-center justify-center ${isDark ? "bg-[#FFF4C9] text-black" : "bg-[#E5E7EB]"}`}>
                        {item.avatarUrl
                          ? <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : getInitials(item.name)}
                    </div>
                      <div className="flex flex-col min-w-0">
                      <span className={`whitespace-nowrap font-medium text-base tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                        {item.name}
                      </span>
                        <span className={`truncate text-xs ${isDark ? "text-white/40" : "text-[#666666]"}`}>
                        {item.role}
                      </span>
                    </div>
                  </div>
                </td>

                  {/* Agreement Type */}
                  <td className={`py-5 px-3 text-base truncate ${isDark ? "text-[#D0D0D0]" : "text-[#4B5563]"}`}>
                    {orDash(item.agreementType)}
                </td>

                {/* Version Column */}
                <td className="py-5 px-3">
                    {item.version ? (
                  <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${isDark ? "bg-[#EDE5D5] text-[#18150F]" : "bg-[#F3F4F6] text-[#374151]"}`}
                  >
                    {item.version}
                  </span>
                    ) : (
                      <span className={`text-base lg:text-lg ${isDark ? "text-[#D0D0D0]" : "text-[#4B5563]"}`}>--</span>
                    )}
                </td>

                  {/* Compensation */}
                <td className={`text-base lg:text-lg ${isDark ? "text-white" : "text-black"}`}>
                    {orDash(item.compensation)}
                </td>

                {/* Status Column */}
                <td className="py-5 px-3">
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap px-5 py-3 rounded-full text-sm lg:text-base font-medium ${isDark ? pill.dark : pill.light}`}
                    >
                      {item.status}
                    </span>
                </td>

                  {/* Action */}
                  <td className="py-4 px-5 lg:px-6 text-right">
                    <RowActions
                      item={item}
                      isDark={isDark}
                      actions={menuFor(item)}
                      onSelect={(action) => onActionClick?.(item, action)}
                    />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAgreements.length === 0 && (
          <p className={`px-5 py-8 text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
            {statusFilter === "all"
              ? "No editors are assigned to this shoot yet."
              : `No editors with status "${statusFilter}".`}
          </p>
        )}
      </div>
    </div>
  );
}
