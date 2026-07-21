"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { type PermissionMatrixRow } from "@/components/admin/roles-permissions/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
  mode: string;
  canEditPage: boolean;
  setIsUpdateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  mode,
  canEditPage,
  setIsUpdateModalOpen
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
    // <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F4F5F7] text-[#101010]"}`}>
    <div className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8 no-scrollbar" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      <Button onClick={() => router.back()} className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0`}>
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="w-full flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full flex justify-between ">
          <div className="flex items-center gap-3 lg:gap-6">
            <div className={`flex h-17 w-17 lg:h-20 lg:w-20 items-center justify-center rounded-lg lg:rounded-2xl text-2xl lg:text-3xl font-semibold shadow-lg ${isDark ? "bg-[#F1C7E6] text-black" : "bg-[#E8D1AB] text-[#101010]"}`}>
              {getInitials(title)}
            </div>
            <div>
              <h1 className={`text-base font-semibold lg:text-2xl ${isDark ? "text-white" : "text-[#101010]"}`}>
                {title} <span className={`font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]"}`}>({roleLabel})</span>
              </h1>
              <div className={`mt-2 flex flex-col lg:flex-row items-center gap-2 lg:gap-4 text-xs lg:text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#32323299]"}`}>
                <p>Created : <span className={isDark ? "text-white" : "text-black"}>{created}</span></p>
                <span className={`hidden h-4 w-px md:block ${isDark ? "bg-[#E0E0E0]" : "bg-[#D8D8D8]"}`} />
                <p>Updated : <span className={isDark ? "text-white" : "text-black"}>{currentUpdated}</span></p>
              </div>
              {description ? (
                <p className={`mt-3 max-w-[900px] text-base leading-relaxed ${isDark ? "text-white/55" : "text-[#32323299]"}`}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <span className={`inline-flex h-8 items-center justify-center rounded-full px-4 text-xs lg:text-sm font-medium ${status.toLowerCase() === "active" ? (isDark ? "bg-[#D4F9DB] text-[#1EAD52]" : "bg-[#EAF8EE] text-[#1EAD52]") : (isDark ? "bg-[#2D1E1E] text-[#EA5455]" : "bg-[#FEECEC] text-[#EA5455]")}`}>
            {status}
          </span>
        </div>
      </div>

      <button
        onClick={() => setIsUpdateModalOpen(true)}
        disabled={!canEditPage}
        title={mode === "role" ? "Edit Role" : "Change Role"}
        className="flex lg:hidden w-full h-12 items-center justify-center rounded-lg bg-[#E8D1AB] px-8 text-sm font-semibold text-black transition-all hover:bg-[#d6c29b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mode === "role" ? "Edit Role" : "Change Role"}
      </button>

      <div className={`mt-4 lg:mt-10 rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E3E3E3] shadow-[0_10px_24px_rgba(16,16,16,0.08)]"}`}>
        {isLoading ? (
          <div className={`p-6 lg:p-8 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>Loading details...</div>
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

      <div className="hidden mt-10 lg:flex items-center gap-6">
        <button
          type="button"
          onClick={() => router.back()}
          className={`h-[64px] min-w-[180px] rounded-lg border text-lg font-semibold transition-all ${isDark
            ? "border-white/10 bg-transparent text-white hover:bg-white/5"
            : "border-[#E3E3E3] bg-white text-[#101010] hover:bg-black/[0.03]"
            }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePrimaryAction}
          className={`h-[64px] min-w-[180px] rounded-lg text-lg font-semibold transition-all ${isDark
            ? "bg-[#E8D1AB] text-black hover:bg-[#d6c29b]"
            : "bg-[#E8D1AB] text-[#101010] hover:bg-[#d6c29b]"
            }`}
        >
          {primaryActionLabel}
        </button>
      </div>

      <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
        <button
          type="button"
          onClick={() => router.back()}
          className={`h-[64px] min-w-[180px] rounded-lg border text-lg font-semibold transition-all ${isDark
            ? "border-white/10 bg-transparent text-white hover:bg-white/5"
            : "border-[#E3E3E3] bg-white text-[#101010] hover:bg-black/[0.03]"
            }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePrimaryAction}
          className={`h-[64px] min-w-[180px] rounded-lg text-lg font-semibold transition-all ${isDark
            ? "bg-[#E8D1AB] text-black hover:bg-[#d6c29b]"
            : "bg-[#E8D1AB] text-[#101010] hover:bg-[#d6c29b]"
            }`}
        >
          {primaryActionLabel}
        </button>
      </div>
    </div >
  );
}
