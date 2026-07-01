"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { type PermissionMatrixRow } from "@/components/admin/roles-permissions/types";
import { useEffect, useState } from "react";

type RoleEditDetailsPageProps = {
  title: string;
  roleLabel: string;
  status: string;
  created: string;
  updated: string;
  rows: PermissionMatrixRow[];
  readOnly?: boolean;
  isLoading?: boolean;
  description?: string;
  primaryActionLabel?: string;
  onRowsChange?: (rows: PermissionMatrixRow[]) => void;
  onOpenModal?: () => void;
  onPrimaryAction?: () => void;
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

export function RoleEditDetailsPage({
  title,
  roleLabel,
  status,
  created,
  updated: initialUpdated, 
  rows,
  readOnly = false,
  isLoading = false,
  description,
  primaryActionLabel = "Update",
  onRowsChange,
  onOpenModal,
  onPrimaryAction,
}: RoleEditDetailsPageProps) {
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const [currentUpdated, setCurrentUpdated] = useState(initialUpdated);

    useEffect(() => {
    setCurrentUpdated(initialUpdated);
  }, [initialUpdated]);

   const handlePrimaryAction = async () => {
    if (onPrimaryAction) {
      await onPrimaryAction();
      
      const now = new Date().toLocaleString("en-US", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentUpdated(now);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F4F5F7] text-[#101010]"}`}>
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <button
          onClick={() => router.back()}
          className={`mb-8 flex items-center gap-2 transition ${isDark ? "text-white/60 hover:text-white" : "text-[#32323299] hover:text-[#101010]"}`}
        >
          <ArrowLeft size={20} />
          <span className="text-[16px] font-medium">Back</span>
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className={`flex h-20 w-20 items-center justify-center rounded-[24px] text-[28px] font-bold shadow-lg ${isDark ? "bg-[#F1C7E6] text-black" : "bg-[#E5D5B8] text-[#101010]"}`}>
              {getInitials(title)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className={`text-[28px] font-bold lg:text-[32px] ${isDark ? "text-white" : "text-[#101010]"}`}>
                  {title} <span className={`font-semibold ${isDark ? "text-[#E5D5B8]" : "text-[#8E6A2A]"}`}>({roleLabel})</span>
                </h1>
                <span className={`inline-flex h-8 items-center justify-center rounded-full px-4 text-[13px] font-bold ${status.toLowerCase() === "active" ? (isDark ? "bg-[#D4F9DB] text-[#1EAD52]" : "bg-[#EAF8EE] text-[#1EAD52]") : (isDark ? "bg-[#2D1E1E] text-[#EA5455]" : "bg-[#FEECEC] text-[#EA5455]")}`}>
                  {status}
                </span>
              </div>
              <div className={`mt-2 flex flex-wrap items-center gap-4 text-[14px] ${isDark ? "text-white/40" : "text-[#32323299]"}`}>
                <span>Created : {created}</span>
                <span className={`hidden h-4 w-px md:block ${isDark ? "bg-white/10" : "bg-[#D8D8D8]"}`} />
                <span>Updated : {currentUpdated}</span>
              </div>
              {description ? (
                <p className={`mt-3 max-w-[900px] text-[15px] leading-relaxed ${isDark ? "text-white/55" : "text-[#32323299]"}`}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`mt-10 rounded-[32px] p-6 lg:p-8 ${isDark ? "bg-[#111111]/50" : "bg-white border border-[#E3E3E3] shadow-[0_10px_24px_rgba(16,16,16,0.08)]"}`}>
          {isLoading ? (
            <div className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>Loading details...</div>
          ) : (
            <PermissionMatrixTable
              rows={rows}
              onChange={onRowsChange}
              showSelectionColumn
              readOnly={readOnly}
              onReadOnlyClick={onOpenModal}
              className="border-none !bg-transparent"
            />
          )}
        </div>

        <div className="mt-10 flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.back()}
            className={`h-[64px] min-w-[180px] rounded-[16px] border text-[18px] font-bold transition-all ${
              isDark
                ? "border-white/10 bg-transparent text-white hover:bg-white/5"
                : "border-[#E3E3E3] bg-white text-[#101010] hover:bg-black/[0.03]"
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`h-[64px] min-w-[180px] rounded-[16px] text-[18px] font-bold transition-all active:scale-95 ${
              isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#d6c29b]"
                : "bg-[#E5D5B8] text-[#101010] hover:bg-[#d6c29b]"
            }`}
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
