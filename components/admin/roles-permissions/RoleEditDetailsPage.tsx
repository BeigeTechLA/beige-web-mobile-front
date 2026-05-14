"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";

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
  onInvalidAccessAttempt?: (row: PermissionMatrixRow, key: PermissionColumnKey) => void;
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
  updated,
  rows,
  readOnly = false,
  isLoading = false,
  description,
  primaryActionLabel = "Update",
  onRowsChange,
  onOpenModal,
  onPrimaryAction,
  onInvalidAccessAttempt,
}: RoleEditDetailsPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={20} />
          <span className="text-[16px] font-medium">Back</span>
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F1C7E6] text-[28px] font-bold text-black shadow-lg">
              {getInitials(title)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-[28px] font-bold text-white lg:text-[32px]">
                  {title} <span className="font-semibold text-[#E5D5B8]">({roleLabel})</span>
                </h1>
                <span className="inline-flex h-8 items-center justify-center rounded-full bg-[#D4F9DB] px-4 text-[13px] font-bold text-[#1EAD52]">
                  {status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[14px] text-white/40">
                <span>Created : {created}</span>
                <span className="hidden h-4 w-px bg-white/10 md:block" />
                <span>Updated : {updated}</span>
              </div>
              {description ? (
                <p className="mt-3 max-w-[900px] text-[15px] leading-relaxed text-white/55">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[32px] bg-[#111111]/50 p-6 lg:p-8">
          {isLoading ? (
            <div className="py-10 text-center text-white/50">Loading details...</div>
          ) : (
            <PermissionMatrixTable
              rows={rows}
              onChange={onRowsChange}
              readOnly={readOnly}
              onReadOnlyClick={onOpenModal}
              onInvalidAccessAttempt={onInvalidAccessAttempt}
              className="border-none !bg-transparent"
            />
          )}
        </div>

        <div className="mt-10 flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[64px] min-w-[180px] rounded-[16px] border border-white/10 bg-transparent text-[18px] font-bold text-white transition-all hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onPrimaryAction}
            className="h-[64px] min-w-[180px] rounded-[16px] bg-[#E5D5B8] text-[18px] font-bold text-black transition-all hover:bg-[#d6c29b] active:scale-95"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
