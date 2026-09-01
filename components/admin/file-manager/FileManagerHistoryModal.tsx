"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { BasicDropdown, type DropdownOption } from "@/components/admin/BasicDropdown";
import DatePicker from "@/components/ui/Datepicker";
import {
  fileManagerApi,
  type FileManagerHistoryAction,
  type FileManagerHistoryItem,
  type FileManagerHistoryStage,
} from "@/lib/fileManagerApi";

const HISTORY_PAGE_SIZE = 10;
const STAGE_OPTIONS: DropdownOption[] = [
  { label: "All Stages", value: "" },
  { label: "Pre-Production", value: "pre_production" },
  { label: "Post-Production", value: "post_production" },
];
const ACTION_OPTIONS: DropdownOption[] = [
  { label: "All Actions", value: "" },
  { label: "Created", value: "created" },
  { label: "Deleted", value: "deleted" },
];

interface FileManagerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const formatDateValue = (value: Date | null) => {
  if (!value) return undefined;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatStage = (value?: string | null) => {
  if (value === "pre_production") return "Pre-Production";
  if (value === "post_production") return "Post-Production";
  return value ? value.replace(/_/g, " ") : "-";
};

const formatAction = (value?: string) => {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const getClientName = (item: FileManagerHistoryItem) =>
  item.clientName || item.client_name || item.client?.name || item.client?.fullName || item.client?.full_name || item.client?.email || "-";

const getFolderName = (item: FileManagerHistoryItem) => item.folderName || item.folder_name || "-";

const getTimestamp = (item: FileManagerHistoryItem) =>
  item.createdAt || item.created_at || item.deletedAt || item.deleted_at || item.updatedAt || item.updated_at || item.timestamp || item.date || null;

const formatTimestamp = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function FileManagerHistoryModal({
  isOpen,
  onClose,
  isDark = true,
}: FileManagerHistoryModalProps) {
  const [history, setHistory] = useState<FileManagerHistoryItem[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientOptions, setClientOptions] = useState<DropdownOption[]>([{ label: "All Clients", value: "" }]);
  const [stage, setStage] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: HISTORY_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const loadHistory = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.listHistory({
        clientId: clientId || undefined,
        stage: (stage || undefined) as FileManagerHistoryStage | undefined,
        action: (action || undefined) as FileManagerHistoryAction | undefined,
        startDate: formatDateValue(startDate),
        endDate: formatDateValue(endDate),
        page,
        limit: HISTORY_PAGE_SIZE,
      });

      if (requestId !== requestRef.current) return;
      setHistory(response.history);
      setPagination(response.pagination);
    } catch (err: unknown) {
      if (requestId !== requestRef.current) return;
      setHistory([]);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [action, clientId, endDate, page, stage, startDate]);

  useEffect(() => {
    if (!isOpen) return;
    loadHistory();
  }, [isOpen, loadHistory]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(async () => {
      try {
        const clients = await fileManagerApi.searchRegisteredClients(clientSearch);
        setClientOptions([
          { label: "All Clients", value: "" },
          ...clients.map((client) => ({
            label: client.name || client.email || `Client ${client.clientId}`,
            value: String(client.clientId),
            subLabel: client.email || undefined,
          })),
        ]);
      } catch {
        setClientOptions([{ label: "All Clients", value: "" }]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [clientSearch, isOpen]);

  const resetFilters = () => {
    setClientId("");
    setClientSearch("");
    setStage("");
    setAction("");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border shadow-2xl transition-colors duration-200 ${
              isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-[#D7D7D7]"
            }`}
          >
            <div className={`flex items-start justify-between border-b p-5 transition-colors duration-200 ${
              isDark ? "border-white/5" : "border-[#D7D7D7]"
            }`}>
              <div>
                <h2 className={`mb-1 text-xl font-bold transition-colors lg:text-2xl ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  Folder History
                </h2>
                <p className={`text-sm transition-colors ${isDark ? "text-white/40" : "text-[#727272]"}`}>
                  Create and delete activity logs from file manager folders.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full p-2 transition-colors ${
                  isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <BasicDropdown
                    label="Client"
                    value={clientId}
                    options={clientOptions}
                    searchable
                    searchPlaceholder="Search client..."
                    onChange={(value) => {
                      setClientId(value);
                      setPage(1);
                    }}
                    width="w-full"
                  />
                  <div className={`relative mt-2 rounded-lg border ${
                    isDark ? "border-white/10 bg-[#18181b]" : "border-[#D7D7D7] bg-white"
                  }`}>
                    <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      isDark ? "text-white/40" : "text-black/40"
                    }`} />
                    <input
                      value={clientSearch}
                      onChange={(event) => setClientSearch(event.target.value)}
                      placeholder="Search clients"
                      className={`h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none ${
                        isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
                      }`}
                    />
                  </div>
                </div>
                <BasicDropdown
                  label="Stage"
                  value={stage}
                  options={STAGE_OPTIONS}
                  onChange={(value) => {
                    setStage(value);
                    setPage(1);
                  }}
                  width="w-full"
                />
                <BasicDropdown
                  label="Action"
                  value={action}
                  options={ACTION_OPTIONS}
                  onChange={(value) => {
                    setAction(value);
                    setPage(1);
                  }}
                  width="w-full"
                />
                <DatePicker label="Start Date" value={startDate} onChange={(value) => {
                  setStartDate(value);
                  setPage(1);
                }} isDark={isDark} />
                <DatePicker label="End Date" value={endDate} onChange={(value) => {
                  setEndDate(value);
                  setPage(1);
                }} isDark={isDark} minDate={startDate || undefined} />
              </div>

              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`h-10 rounded-lg px-4 text-sm font-medium transition-colors ${
                    isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
                  }`}
                >
                  Clear Filters
                </button>
              </div>

              <div className={`overflow-hidden rounded-xl border transition-colors ${
                isDark ? "border-white/10" : "border-[#D7D7D7]"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left">
                    <thead>
                      <tr className={`text-sm font-normal transition-colors duration-200 ${
                        isDark ? "bg-[#202020] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"
                      }`}>
                        <th className="px-5 py-4 font-medium">Client Name</th>
                        <th className="px-5 py-4 font-medium">Action</th>
                        <th className="px-5 py-4 font-medium">Folder Name</th>
                        <th className="px-5 py-4 font-medium">Stage</th>
                        <th className="px-5 py-4 font-medium">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? "bg-[#171717]" : "bg-white"} transition-colors duration-200`}>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-16 text-center">
                            <Loader2 className="mx-auto animate-spin text-[#BFA780]" size={34} />
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-sm text-red-300">{error}</td>
                        </tr>
                      ) : history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`px-5 py-8 text-center text-sm ${
                            isDark ? "text-white/50" : "text-[#727272]"
                          }`}>
                            No history found
                          </td>
                        </tr>
                      ) : (
                        history.map((item, index) => (
                          <tr
                            key={String(item.id || `${getFolderName(item)}-${getTimestamp(item)}-${index}`)}
                            className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                          >
                            <td className={`px-5 py-4 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                              {getClientName(item)}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                item.action === "deleted"
                                  ? "bg-[#FFF1F2] text-[#F43F5E]"
                                  : "bg-[#D4FFE4] text-[#16A34A]"
                              }`}>
                                {formatAction(item.action)}
                              </span>
                            </td>
                            <td className={`px-5 py-4 text-sm ${isDark ? "text-white/80" : "text-black/80"}`}>
                              {getFolderName(item)}
                            </td>
                            <td className={`px-5 py-4 text-sm ${isDark ? "text-white/70" : "text-[#727272]"}`}>
                              {formatStage(item.stage)}
                            </td>
                            <td className={`px-5 py-4 text-sm ${isDark ? "text-white/70" : "text-[#727272]"}`}>
                              {formatTimestamp(getTimestamp(item))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!loading && !error && pagination.totalPages > 1 ? (
                <div className="mt-6 flex w-full items-center justify-center">
                  <div className={`flex items-center justify-center gap-2 rounded-2xl border p-2 transition-colors duration-200 ${
                    isDark ? "border-white/10 bg-[#0E0E0E]" : "border-[#D7D7D7] bg-white"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 lg:min-w-[112px] ${
                        isDark
                          ? "border-white/10 bg-[#131313] text-white/55 hover:border-white/20 hover:text-white"
                          : "border-[#D7D7D7] bg-white text-[#727272] hover:border-black/20 hover:text-black"
                      }`}
                    >
                      <span className="hidden px-4 lg:block">Previous</span>
                      <ChevronLeft size={16} className="lg:hidden" />
                    </button>
                    <span className={`px-3 text-sm ${isDark ? "text-white/60" : "text-[#727272]"}`}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 lg:min-w-[112px] ${
                        isDark
                          ? "border-white/10 bg-[#131313] text-[#8CA2C5] hover:border-white/20 hover:text-white"
                          : "border-[#D7D7D7] bg-white text-[#727272] hover:border-black/20 hover:text-black"
                      }`}
                    >
                      <span className="hidden px-4 lg:block">Next</span>
                      <ChevronRight size={16} className="lg:hidden" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
