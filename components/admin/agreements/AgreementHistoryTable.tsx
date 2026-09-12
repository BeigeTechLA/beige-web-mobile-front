"use client";

import React, { useEffect, useState } from "react";
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

  // Optional row actions.
  // The table still works without these callbacks.
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

export default function AgreementHistoryTable({
  agreements,
  isDark,
  agreementType,
  onAgreementTypeChange,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  onEditAgreement,
  onResendAgreement,
  onViewVersionHistory,
  onDeleteAgreement,
}: AgreementHistoryTableProps) {
  const [openActionId, setOpenActionId] = useState<
    AgreementHistoryItem["id"] | null
  >(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-agreement-actions]")) {
        return;
      }

      setOpenActionId(null);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const closeActions = () => {
    setOpenActionId(null);
  };

  return (
    <section
      className={`mt-5 overflow-hidden rounded-2xl border transition-colors ${
        isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${
          isDark ? "border-[#2A2A2A]" : "border-[#EAEAEA]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="h-7 w-[3px] rounded-full bg-[#E8D1AB]" />

          <h2
            className={`text-base font-medium lg:text-lg ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            Shoot Agreement History
          </h2>
        </div>

        <div
          className={`inline-flex w-fit rounded-lg border p-1 ${
            isDark
              ? "border-[#2E2E2E] bg-[#191919]"
              : "border-[#E5E5E5] bg-[#F7F7F7]"
          }`}
        >
          <button
            type="button"
            onClick={() => onAgreementTypeChange("general")}
            className={`rounded-md px-4 py-2 text-[11px] font-medium transition-colors ${
              agreementType === "general"
                ? "bg-[#E8D1AB] text-black"
                : isDark
                  ? "text-white/60 hover:bg-white/5 hover:text-white"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
            }`}
          >
            General Agreement
          </button>

          <button
            type="button"
            onClick={() => onAgreementTypeChange("shoot")}
            className={`rounded-md px-4 py-2 text-[11px] font-medium transition-colors ${
              agreementType === "shoot"
                ? "bg-[#E8D1AB] text-black"
                : isDark
                  ? "text-white/60 hover:bg-white/5 hover:text-white"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
            }`}
          >
            Shoot Agreement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] border-collapse text-left">
          <thead>
            <tr
              className={`border-b text-sm ${
                isDark
                  ? "border-[#2A2A2A] bg-[#101010] text-[#E8D1AB]"
                  : "border-[#E3E3E3] bg-[#FFFCF6] text-[#8D6F3F]"
              }`}
            >
              <th className="px-6 py-4 font-medium">Creative Partner</th>

              <th className="px-6 py-4 font-medium">Project Name &amp; ID</th>

              <th className="px-6 py-4 font-medium">Role</th>

              <th className="px-6 py-4 font-medium">Version</th>

              <th className="px-6 py-4 font-medium">Status</th>

              <th className="px-6 py-4 font-medium">Send Date</th>

              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {agreements.length > 0 ? (
              agreements.map((agreement, index) => {
                const isMenuOpen = openActionId === agreement.id;
                const shouldOpenUpward = index >= agreements.length - 2;

                return (
                  <tr
                    key={agreement.id}
                    onClick={() => {
                      closeActions();
                      onRowClick(agreement);
                    }}
                    className={`group relative cursor-pointer transition-colors ${
                      isMenuOpen ? "z-[100]" : "z-0"
                    } ${
                      isDark
                        ? "hover:bg-white/[0.025]"
                        : "hover:bg-black/[0.02]"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-medium text-black ${agreement.avatarTone}`}
                        >
                          {agreement.cpInitials}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDark ? "text-white" : "text-[#171717]"
                            }`}
                          >
                            {agreement.cpName}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              isDark ? "text-white/35" : "text-black/40"
                            }`}
                          >
                            {agreement.cpDate}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-white/90" : "text-[#323232]"
                        }`}
                      >
                        {agreement.projectName}
                      </p>

                      <p
                        className={`mt-1 text-[11px] ${
                          isDark ? "text-[#E8D1AB]/80" : "text-[#8D6F3F]"
                        }`}
                      >
                        {agreement.projectId}
                      </p>
                    </td>

                    <td
                      className={`px-6 py-4 text-sm ${
                        isDark ? "text-white/85" : "text-[#323232]"
                      }`}
                    >
                      {agreement.role}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                          isDark
                            ? "bg-[#EDE8DE] text-black"
                            : "bg-[#F2EBDD] text-[#323232]"
                        }`}
                      >
                        {agreement.version}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex min-w-[112px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold ${statusClass(
                          agreement.status,
                          isDark,
                        )}`}
                      >
                        {agreement.status}
                      </span>
                    </td>

                    <td
                      className={`px-6 py-4 text-sm whitespace-nowrap ${
                        isDark ? "text-white/55" : "text-black/55"
                      }`}
                    >
                      {agreement.sendDate}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div
                        className="relative flex justify-end"
                        data-agreement-actions
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setOpenActionId((current) =>
                              current === agreement.id ? null : agreement.id,
                            );
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

                        {isMenuOpen && (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className={`absolute right-0 z-[200] min-w-[205px] rounded-xl border p-1.5 text-left shadow-xl ${
                              shouldOpenUpward ? "bottom-10" : "top-10"
                            } ${
                              isDark
                                ? "border-[#3A3A3A] bg-[#171717]"
                                : "border-[#E5E5E5] bg-white"
                            }`}
                          >
                            {/* Open details */}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                closeActions();
                                onRowClick(agreement);
                              }}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                isDark
                                  ? "text-white hover:bg-white/10"
                                  : "text-[#222222] hover:bg-[#F8F4EA]"
                              }`}
                            >
                              <Eye size={16} />
                              Open details
                            </button>

                            {/* Version history */}
                            {onViewVersionHistory && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  closeActions();
                                  onViewVersionHistory(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                  isDark
                                    ? "text-white hover:bg-white/10"
                                    : "text-[#222222] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <History size={16} />
                                Version history
                              </button>
                            )}

                            {/* Edit */}
                            {onEditAgreement && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  closeActions();
                                  onEditAgreement(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                  isDark
                                    ? "text-[#E8D1AB] hover:bg-white/10"
                                    : "text-[#8C6A00] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <Pencil size={16} />
                                Edit agreement
                              </button>
                            )}

                            {/* Resend */}
                            {onResendAgreement && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  closeActions();
                                  onResendAgreement(agreement);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                  isDark
                                    ? "text-white hover:bg-white/10"
                                    : "text-[#222222] hover:bg-[#F8F4EA]"
                                }`}
                              >
                                <Send size={16} />
                                Resend agreement
                              </button>
                            )}

                            {/* Delete */}
                            {onDeleteAgreement && (
                              <>
                                <div
                                  className={`my-1 h-px ${
                                    isDark ? "bg-white/10" : "bg-black/5"
                                  }`}
                                />

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    closeActions();
                                    onDeleteAgreement(agreement);
                                  }}
                                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                    isDark
                                      ? "text-red-400 hover:bg-white/10"
                                      : "text-red-600 hover:bg-red-50"
                                  }`}
                                >
                                  <Trash2 size={16} />
                                  Delete agreement
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p
                    className={`text-sm ${
                      isDark ? "text-white/45" : "text-black/45"
                    }`}
                  >
                    No agreements found matching your filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className={`flex flex-col gap-4 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
          isDark ? "border-[#2A2A2A]" : "border-[#E3E3E3]"
        }`}
      >
        <p className={`text-sm ${isDark ? "text-white/75" : "text-black/65"}`}>
          Page 1 to 10
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
              isDark
                ? "text-white/60 hover:bg-white/5 hover:text-white"
                : "text-black/50 hover:bg-black/5 hover:text-black"
            }`}
          >
            <ChevronLeft size={17} />
          </button>

          {Array.from(
            {
              length: Math.min(totalPages, 3),
            },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm transition-colors ${
                currentPage === page
                  ? isDark
                    ? "border border-[#E8D1AB]/50 bg-[#202020] text-white"
                    : "border border-[#D6C19D] bg-[#F7F0E4] text-black"
                  : isDark
                    ? "text-white/50 hover:bg-white/5 hover:text-white"
                    : "text-black/45 hover:bg-black/5 hover:text-black"
              }`}
            >
              {page}
            </button>
          ))}

          {totalPages > 3 ? (
            <span
              className={`px-1 text-sm ${
                isDark ? "text-white/40" : "text-black/35"
              }`}
            >
              ...
            </span>
          ) : null}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
              isDark
                ? "text-white/60 hover:bg-white/5 hover:text-white"
                : "text-black/50 hover:bg-black/5 hover:text-black"
            }`}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
