"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

export type AgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

export type AgreementType = "general" | "shoot";

export type AgreementHistoryItem = {
  id: number | string;
  cpName: string;
  cpInitials: string;
  cpDate: string;
  avatarTone: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  status: AgreementStatus;
  agreementType: AgreementType;
  admin: string;
  sendDate: string;
};

type AgreementHistoryTableProps = {
  agreements: AgreementHistoryItem[];
  isDark: boolean;
  agreementType: AgreementType;
  onAgreementTypeChange: (type: AgreementType) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (agreement: AgreementHistoryItem) => void;
  pageSize?: number;
  totalItems?: number;
  onEditAgreement?: (agreement: AgreementHistoryItem) => void;
  onResendAgreement?: (agreement: AgreementHistoryItem) => void;
  onViewVersionHistory?: (agreement: AgreementHistoryItem) => void;
  onDeleteAgreement?: (agreement: AgreementHistoryItem) => void;
};

const statusClass = (status: AgreementStatus, isDark: boolean) => {
  switch (status) {
    case "Accepted":
      return isDark
        ? "border-emerald-400/20 bg-[#C9F8DD] text-[#169348]"
        : "border-emerald-200 bg-[#D8FBE6] text-[#169348]";
    case "Expired":
    case "Pending":
      return isDark
        ? "border-amber-300/20 bg-[#FFF1B7] text-[#C56A00]"
        : "border-amber-200 bg-[#FFF1B7] text-[#C56A00]";
    case "Rejected":
    case "Cancelled":
    case "Not Accepted":
      return isDark
        ? "border-red-300/20 bg-[#FFC7C7] text-[#B51F28]"
        : "border-red-200 bg-[#FFD2D2] text-[#B51F28]";
    default:
      return "";
  }
};

const visiblePageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);
  return [...pages].sort((a, b) => a - b);
};

export default function AgreementHistoryTable({
  agreements,
  isDark,
  agreementType,
  onAgreementTypeChange,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  pageSize = 10,
  totalItems = agreements.length,
  onEditAgreement,
  onResendAgreement,
  onViewVersionHistory,
  onDeleteAgreement,
}: AgreementHistoryTableProps) {
  const [openActionId, setOpenActionId] = useState<AgreementHistoryItem["id"] | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-agreement-actions]")) return;
      setOpenActionId(null);
      setActionMenuPosition(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  useEffect(() => {
    setOpenActionId(null);
    setActionMenuPosition(null);
  }, [agreementType, currentPage, agreements]);

  useEffect(() => {
    if (openActionId === null) return;

    const closeMenu = () => {
      setOpenActionId(null);
      setActionMenuPosition(null);
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openActionId]);

  const pages = useMemo(
    () => visiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <section
      className={`mt-5 overflow-visible rounded-2xl border transition-colors ${
        isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"
      }`}
    >
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${
          isDark ? "border-[#2A2A2A]" : "border-[#EAEAEA]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="h-7 w-[3px] rounded-full bg-[#E8D1AB]" />
          <h2 className={`text-base font-medium lg:text-lg ${isDark ? "text-white" : "text-[#171717]"}`}>
            {agreementType === "general" ? "General Agreement History" : "Shoot Agreement History"}
          </h2>
        </div>

        <div
          className={`inline-flex w-fit rounded-lg border p-1 ${
            isDark ? "border-[#2E2E2E] bg-[#191919]" : "border-[#E5E5E5] bg-[#F7F7F7]"
          }`}
        >
          {(["general", "shoot"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAgreementTypeChange(type)}
              className={`rounded-md px-4 py-2 text-[11px] font-medium transition-colors ${
                agreementType === type
                  ? "bg-[#E8D1AB] text-black"
                  : isDark
                    ? "text-white/60 hover:bg-white/5 hover:text-white"
                    : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              {type === "general" ? "General Agreement" : "Shoot Agreement"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[1040px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[25%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[17%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr
              className={`border-b text-sm ${
                isDark
                  ? "border-[#2A2A2A] bg-[#101010] text-[#E8D1AB]"
                  : "border-[#E3E3E3] bg-[#FFFCF6] text-[#8D6F3F]"
              }`}
            >
              <th className="px-5 py-4 font-medium">Creative Partner</th>
              <th className="px-5 py-4 font-medium">Project Name &amp; ID</th>
              <th className="px-5 py-4 font-medium">Role</th>
              <th className="px-5 py-4 font-medium">Version</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {agreements.length > 0 ? (
              agreements.map((agreement, index) => {
                const isMenuOpen = openActionId === agreement.id;
                return (
                  <tr
                    key={agreement.id}
                    onClick={() => {
                      setOpenActionId(null);
                      onRowClick(agreement);
                    }}
                    className={`group relative cursor-pointer border-b transition-colors last:border-b-0 ${
                      isMenuOpen ? "z-[100]" : "z-0"
                    } ${
                      isDark
                        ? "border-[#252525] hover:bg-white/[0.025]"
                        : "border-[#EEEEEE] hover:bg-black/[0.02]"
                    }`}
                  >
                    <td className="px-5 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-medium text-black ${agreement.avatarTone}`}
                        >
                          {agreement.cpInitials}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                            {agreement.cpName}
                          </p>
                          <p
                            className={`mt-1 whitespace-nowrap text-xs leading-4 ${
                              isDark ? "text-white/35" : "text-black/40"
                            }`}
                          >
                            {agreement.cpDate}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <div className="min-w-0">
                        <p className={`truncate text-sm ${isDark ? "text-white/85" : "text-[#252525]"}`}>
                          {agreement.projectName}
                        </p>
                        <p className={`mt-1 truncate text-xs ${isDark ? "text-[#E8D1AB]/70" : "text-[#8D6F3F]"}`}>
                          {agreement.projectId}
                        </p>
                      </div>
                    </td>

                    <td className={`px-5 py-4 align-middle text-sm ${isDark ? "text-white/80" : "text-black/75"}`}>
                      <span className="block truncate">{agreement.role}</span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium ${
                          isDark ? "bg-[#EDE8DE] text-black" : "bg-[#F2EBDD] text-[#323232]"
                        }`}
                      >
                        {agreement.version}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex min-w-[106px] items-center justify-center whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium ${statusClass(
                          agreement.status,
                          isDark,
                        )}`}
                      >
                        {agreement.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right align-middle">
                      <div className="relative flex justify-end" data-agreement-actions>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            if (openActionId === agreement.id) {
                              setOpenActionId(null);
                              setActionMenuPosition(null);
                              return;
                            }

                            const rect = event.currentTarget.getBoundingClientRect();
                            const menuWidth = 220;
                            const estimatedMenuHeight = 245;
                            const viewportPadding = 12;
                            const gap = 8;
                            const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
                            const top = availableBelow >= estimatedMenuHeight
                              ? rect.bottom + gap
                              : Math.max(viewportPadding, rect.top - estimatedMenuHeight - gap);
                            const right = Math.max(
                              viewportPadding,
                              window.innerWidth - rect.right,
                            );

                            setActionMenuPosition({ top, right });
                            setOpenActionId(agreement.id);
                          }}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            isDark
                              ? "text-white/70 hover:bg-white/10 hover:text-white"
                              : "text-black/50 hover:bg-black/5 hover:text-black"
                          }`}
                          aria-label={`Open actions for ${agreement.cpName}`}
                          aria-expanded={isMenuOpen}
                        >
                          <MoreVertical size={19} />
                        </button>

                        {isMenuOpen && actionMenuPosition && typeof document !== "undefined"
                          ? createPortal(
                              <div
                                data-agreement-actions
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                  top: actionMenuPosition.top,
                                  right: actionMenuPosition.right,
                                }}
                                className={`fixed z-[9999] w-[220px] overflow-hidden rounded-xl border p-1.5 text-left shadow-2xl ${
                                  isDark
                                    ? "border-[#3A3A3A] bg-[#171717]"
                                    : "border-[#E5E5E5] bg-white"
                                }`}
                              >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionId(null);
                                onRowClick(agreement);
                              }}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                                isDark ? "text-white hover:bg-white/10" : "text-[#222] hover:bg-[#F8F4EA]"
                              }`}
                            >
                              <Eye size={16} /> Open details
                            </button>

                            {onViewVersionHistory ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId(null);
                                  onViewVersionHistory(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                                  isDark ? "text-white hover:bg-white/10" : "text-[#222] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <History size={16} /> Version history
                              </button>
                            ) : null}

                            {onEditAgreement && agreement.agreementType === "general" ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId(null);
                                  onEditAgreement(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                                  isDark ? "text-[#E8D1AB] hover:bg-white/10" : "text-[#8C6A00] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <Pencil size={16} /> Edit agreement
                              </button>
                            ) : null}

                            {onResendAgreement ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId(null);
                                  onResendAgreement(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                                  isDark ? "text-white hover:bg-white/10" : "text-[#222] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <Send size={16} /> Resend agreement
                              </button>
                            ) : null}

                            {onDeleteAgreement ? (
                              <>
                                <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-black/5"}`} />
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenActionId(null);
                                    onDeleteAgreement(agreement);
                                  }}
                                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
                                    isDark ? "text-red-400 hover:bg-white/10" : "text-red-600 hover:bg-red-50"
                                  }`}
                                >
                                  <Trash2 size={16} /> Delete agreement
                                </button>
                              </>
                            ) : null}
                              </div>,
                              document.body,
                            )
                          : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                    No agreements found matching your filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className={`flex flex-col gap-4 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
          isDark ? "border-[#2A2A2A]" : "border-[#E3E3E3]"
        }`}
      >
        <p className={`text-sm ${isDark ? "text-white/75" : "text-black/65"}`}>
          {totalItems === 0 ? "0 results" : `${startItem}-${endItem} of ${totalItems}`}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={`flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30 ${
              isDark ? "text-white/60 hover:bg-white/5" : "text-black/50 hover:bg-black/5"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={17} />
          </button>

          {pages.map((page, index) => {
            const previous = pages[index - 1];
            return (
              <React.Fragment key={page}>
                {previous && page - previous > 1 ? (
                  <span className={`px-1 text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>...</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm ${
                    currentPage === page
                      ? isDark
                        ? "border border-[#E8D1AB]/50 bg-[#202020] text-white"
                        : "border border-[#D6C19D] bg-[#F7F0E4] text-black"
                      : isDark
                        ? "text-white/50 hover:bg-white/5"
                        : "text-black/45 hover:bg-black/5"
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={`flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30 ${
              isDark ? "text-white/60 hover:bg-white/5" : "text-black/50 hover:bg-black/5"
            }`}
            aria-label="Next page"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
