"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Loader2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RequestStatus = "Pending Deletion" | "Processing" | "Failed" | "Cancelled" | "Completed";
type Verification = "Verified" | "Failed";

interface DeletionRequest {
  requestId: string;
  name: string;
  userId: string;
  initials: string;
  avatarClass: string; // initials avatar colors
  avatar?: string; // photo url, falls back to initials
  type: "Client" | "CP";
  source: "Web" | "App";
  requested: string;
  deletionDate: string;
  remaining: string;
  verification: Verification;
  status: RequestStatus;
}

// Static data (replace with API later)
const PAGE_SIZE = 10;

const REQUESTS: DeletionRequest[] = [
  {
    requestId: "DEL-24091", name: "John Doe", userId: "#12345", initials: "JD",
    avatar: "/avatars/john-doe.jpg",
    avatarClass: "bg-[#DCE6F5] text-[#1E3A5F]", type: "Client", source: "Web",
    requested: "12 Oct 2026", deletionDate: "11 Dec 2026", remaining: "43 Days",
    verification: "Verified", status: "Pending Deletion",
  },
  {
    requestId: "DEL-24091", name: "Rami Guzman", userId: "#12345", initials: "RG",
    avatarClass: "bg-[#DCE9FB] text-[#1E3A5F]", type: "CP", source: "App",
    requested: "11 Oct 2026", deletionDate: "10 Dec 2026", remaining: "42 Days",
    verification: "Verified", status: "Processing",
  },
  {
    requestId: "DEL-24091", name: "Jhas Lee", userId: "#12345", initials: "JL",
    avatarClass: "bg-[#F5E9D6] text-[#3A2A10]", type: "CP", source: "App",
    requested: "8 Oct 2026", deletionDate: "7 Dec 2026", remaining: "39 Days",
    verification: "Failed", status: "Failed",
  },
  {
    requestId: "DEL-24091", name: "Kevin Brooks", userId: "#12345", initials: "KB",
    avatarClass: "bg-[#D9F5C8] text-[#1F4D12]", type: "CP", source: "Web",
    requested: "2 Oct 2026", deletionDate: "1 Dec 2026", remaining: "33 Days",
    verification: "Verified", status: "Cancelled",
  },
  {
    requestId: "DEL-24091", name: "Yuki Tanaka", userId: "#12345", initials: "YT",
    avatar: "/avatars/yuki-tanaka.jpg",
    avatarClass: "bg-[#F5E3D0] text-[#4A2A10]", type: "Client", source: "Web",
    requested: "18 Jul 2026", deletionDate: "16 Sep 2026", remaining: "--",
    verification: "Verified", status: "Completed",
  },
  {
    requestId: "DEL-24092", name: "Ava Patel", userId: "#12346", initials: "AP",
    avatarClass: "bg-[#DCE6F5] text-[#1E3A5F]", type: "Client", source: "Web",
    requested: "6 Oct 2026", deletionDate: "5 Dec 2026", remaining: "37 Days",
    verification: "Verified", status: "Pending Deletion",
  },
  {
    requestId: "DEL-24093", name: "Liam Chen", userId: "#12347", initials: "LC",
    avatarClass: "bg-[#DCE9FB] text-[#1E3A5F]", type: "CP", source: "App",
    requested: "5 Oct 2026", deletionDate: "4 Dec 2026", remaining: "36 Days",
    verification: "Verified", status: "Processing",
  },
  {
    requestId: "DEL-24094", name: "Sara Khan", userId: "#12348", initials: "SK",
    avatarClass: "bg-[#F5E9D6] text-[#3A2A10]", type: "Client", source: "App",
    requested: "4 Oct 2026", deletionDate: "3 Dec 2026", remaining: "35 Days",
    verification: "Failed", status: "Failed",
  },
  {
    requestId: "DEL-24095", name: "Noah Smith", userId: "#12349", initials: "NS",
    avatarClass: "bg-[#D9F5C8] text-[#1F4D12]", type: "CP", source: "Web",
    requested: "3 Oct 2026", deletionDate: "2 Dec 2026", remaining: "34 Days",
    verification: "Verified", status: "Pending Deletion",
  },
  {
    requestId: "DEL-24096", name: "Maya Rossi", userId: "#12350", initials: "MR",
    avatarClass: "bg-[#F5E3D0] text-[#4A2A10]", type: "Client", source: "Web",
    requested: "28 Sep 2026", deletionDate: "27 Nov 2026", remaining: "29 Days",
    verification: "Verified", status: "Cancelled",
  },
  // ---- page 2 ----
  {
    requestId: "DEL-24097", name: "Omar Ali", userId: "#12351", initials: "OA",
    avatarClass: "bg-[#DCE6F5] text-[#1E3A5F]", type: "CP", source: "App",
    requested: "25 Sep 2026", deletionDate: "24 Nov 2026", remaining: "26 Days",
    verification: "Verified", status: "Processing",
  },
  {
    requestId: "DEL-24098", name: "Priya Shah", userId: "#12352", initials: "PS",
    avatarClass: "bg-[#DCE9FB] text-[#1E3A5F]", type: "Client", source: "App",
    requested: "20 Sep 2026", deletionDate: "19 Nov 2026", remaining: "21 Days",
    verification: "Failed", status: "Failed",
  },
  {
    requestId: "DEL-24099", name: "Ethan Cole", userId: "#12353", initials: "EC",
    avatarClass: "bg-[#F5E9D6] text-[#3A2A10]", type: "CP", source: "Web",
    requested: "12 Aug 2026", deletionDate: "11 Oct 2026", remaining: "--",
    verification: "Verified", status: "Completed",
  },
  {
    requestId: "DEL-24100", name: "Zoe Martin", userId: "#12354", initials: "ZM",
    avatarClass: "bg-[#D9F5C8] text-[#1F4D12]", type: "Client", source: "Web",
    requested: "2 Aug 2026", deletionDate: "1 Oct 2026", remaining: "--",
    verification: "Verified", status: "Completed",
  },
  {
    requestId: "DEL-24101", name: "Arjun Mehta", userId: "#12355", initials: "AM",
    avatarClass: "bg-[#F5E3D0] text-[#4A2A10]", type: "CP", source: "App",
    requested: "25 Jul 2026", deletionDate: "23 Sep 2026", remaining: "--",
    verification: "Verified", status: "Completed",
  },
];

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const styles: Record<RequestStatus, { backgroundColor: string; color: string }> = {
    "Pending Deletion": { backgroundColor: "#FFF0C2", color: "#B65C00" },
    Processing: { backgroundColor: "#BDE8FF", color: "#00639B" },
    Failed: { backgroundColor: "#FFD4D8", color: "#CB3038" },
    Cancelled: { backgroundColor: "#2B2B2B", color: "#C7C7C7" },
    Completed: { backgroundColor: "#C9F7DC", color: "#168A45" },
  };
  return (
    <span
      style={styles[status]}
      className="inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium leading-4"
    >
      {status}
    </span>
  );
};

export const DeletionRequestsManagement = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState(REQUESTS);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);
  const isDark = !mounted || theme === "dark";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        r.requestId.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const line = isDark ? "border-white/10" : "border-[#E3E3E3]";
  const selectTrigger = `h-10 w-auto gap-3 rounded-lg px-4 text-[13px] font-medium transition-colors [&>svg]:size-5 [&>svg]:opacity-100 ${
    isDark
      ? "border-white/10 bg-[#202020] text-white hover:bg-[#252525]"
      : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"
  }`;
  const selectContent = isDark
    ? "border-white/20 bg-[#202020] text-white"
    : "border-[#E3E3E3] bg-white text-[#323232]";
  // header cells form one band with rounded bottom corners
  const th = `px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-y first:border-l last:border-r first:rounded-bl-xl last:rounded-br-xl first:pl-5 last:pr-5 ${line} ${
    isDark ? "bg-[#111111] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#101010]"
  }`;
  const td = "px-4 py-3 text-sm whitespace-nowrap first:pl-5 last:pr-5";
  const selectedRequest = selectedRequestIndex === null ? null : requests[selectedRequestIndex] || null;

  const updateSelectedStatus = (status: RequestStatus) => {
    if (selectedRequestIndex === null) return;
    setRequests((current) => current.map((request, index) => index === selectedRequestIndex ? { ...request, status } : request));
  };

  const changePage = (nextPage: number) => {
    if (loading || nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return;
    setLoading(true);
    setPage(nextPage);
    window.setTimeout(() => setLoading(false), 250);
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div>
        <h1 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>
          Account Deletion Requests
        </h1>
        <p className={isDark ? "text-[#888]" : "text-[#666]"}>
          Monitor verification, grace periods, cancellations, and final deletion outcomes.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`}
            size={18}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user or id..."
            className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${
              isDark
                ? "border-white/10 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
                : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40"
            }`}
          />
        </div>
        <button
          type="button"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((visible) => !visible)}
          className={`h-12 px-5 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
            isDark
              ? "border-white/10 bg-[#202020] text-white hover:bg-white/10"
              : "border-[#E3E3E3] bg-[#F0F0F0] text-[#323232] hover:bg-[#E3E3E3]"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {showFilters && (
      <div className={`flex flex-wrap gap-3 rounded-xl p-4 ${isDark ? "bg-[#171717]" : "bg-[#F4F4F5]"}`}>
        <Select defaultValue="all">
          <SelectTrigger className={selectTrigger}><SelectValue placeholder="All Account Type" /></SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="all">All Account Type</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="cp">Creative Partner</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className={selectTrigger}><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className={selectTrigger}><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="pending">Pending Deletion</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className={selectTrigger}><SelectValue placeholder="Verification Status" /></SelectTrigger>
          <SelectContent className={selectContent}>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      )}

      {/* Table card */}
      <div
        className={
          isDark
            ? "overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
            : "overflow-hidden rounded-2xl border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"
        }
      >
        <div className={`border-b px-3 py-3 ${line}`}>
          <div className="border-l-2 border-[#E8D1AB] pl-2">
            <h2 className={`text-base font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>
              Deletion Request History
            </h2>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1350px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className={`${th} text-left`}>Request ID</th>
                <th className={`${th} text-left`}>User</th>
                <th className={`${th} text-left`}>Type</th>
                <th className={`${th} text-left`}>Source</th>
                <th className={`${th} text-left`}>Requested</th>
                <th className={`${th} text-left`}>Deletion Date</th>
                <th className={`${th} text-left`}>Remaining</th>
                <th className={`${th} text-left`}>Verification</th>
                <th className={`${th} text-left`}>Status</th>
                <th className={`${th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className={isDark ? "text-white/90" : "text-[#323232]"}>
              {loading ? (
                <tr>
                  <td colSpan={10} aria-live="polite" className="py-10 text-center">
                    <Loader2 aria-label="Loading deletion requests" className={`mx-auto h-5 w-5 animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
                    No deletion requests found.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={`${r.requestId}-${startIdx + idx}`}
                    className={`transition-colors ${isDark ? "bg-[#171717] hover:bg-[#202020]" : "bg-[#FAFAFA] hover:bg-[#F4F4F4]"}`}
                  >
                    <td className={td}>{r.requestId}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        {r.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.avatar}
                            alt={r.name}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-medium ${r.avatarClass}`}
                          >
                            {r.initials}
                          </div>
                        )}
                        <div>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>
                            {r.name}
                          </p>
                          <p className={`mt-0.5 text-[10px] ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                            User ID: {r.userId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>{r.type}</td>
                    <td className={td}>{r.source}</td>
                    <td className={td}>{r.requested}</td>
                    <td className={td}>{r.deletionDate}</td>
                    <td className={td}>{r.remaining}</td>
                    <td className={td}>
                      <span className={r.verification === "Verified" ? "text-[#4ADE80]" : "text-[#F87171]"}>
                        {r.verification}
                      </span>
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label="Actions"
                        onClick={() => setSelectedRequestIndex(startIdx + idx)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-[#323232]"
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination (static) */}
        {totalPages > 1 && (
          <div className={`flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <p className={`hidden whitespace-nowrap text-sm lg:block ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
              Showing {startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length} results
            </p>
            <div className="flex w-full max-w-full min-w-0 flex-wrap items-center justify-center gap-2 overflow-hidden lg:justify-end">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={loading || currentPage === 1}
              className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {loading ? (
              <Loader2 aria-label="Loading page" className={`mx-3 h-5 w-5 animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
            ) : pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => changePage(pageNumber)}
                className={`flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  pageNumber === currentPage
                    ? isDark
                      ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#111111]"
                      : "border-[#E8D1AB] bg-[#E8D1AB] text-[#111]"
                    : isDark
                    ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                    : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={loading || currentPage === totalPages}
              className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedRequestIndex(null)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Deletion request details"
            className="flex h-full w-full max-w-[650px] flex-col overflow-y-auto border-l border-white/10 bg-black text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-8 py-8">
              <div>
                <h2 className="text-2xl font-semibold">
                  {selectedRequest.name} <span className="text-base font-normal text-[#E8D1AB]">({selectedRequest.requestId})</span>
                </h2>
                <p className="mt-1 text-sm text-white/45">{selectedRequest.userId} - {selectedRequest.type} Account</p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelectedRequestIndex(null)}
                className="rounded-full bg-[#202020] p-3 text-white/80 transition hover:bg-[#303030]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-8 py-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1D1D1D] px-3 py-2.5">
                  <span className="text-sm text-white/50">Days Remaining</span>
                  <span className="text-2xl font-semibold text-[#E8D1AB]">{selectedRequest.remaining.replace(/\D/g, "") || "--"}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#1D1D1D] px-3 py-2.5">
                  <span className="text-sm text-white/50">Current Status</span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>

              <section>
                <h3 className="mb-3 text-sm font-medium">Request Details</h3>
                <div className="rounded-lg bg-[#151515] px-3">
                  {[
                    ["Request Source", selectedRequest.source],
                    ["Requested", selectedRequest.requested],
                    ["Schedule Deletion", selectedRequest.deletionDate],
                    ["Identity Verification", selectedRequest.verification === "Verified" ? "Pass - Email OTP" : "Failed - Email OTP"],
                    ["Legal Hold", "None"],
                    ["Open Booking", "1 Assignment Under Review"],
                  ].map(([label, value], index) => (
                    <div key={label} className={`flex min-h-[48px] items-center justify-between gap-4 text-sm ${index ? "border-t border-white/5" : ""}`}>
                      <span className="text-white/55">{label}</span>
                      <span className="text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-medium">Timeline</h3>
                <div className="space-y-4">
                  {[
                    ["Request Submitted", selectedRequest.requested],
                    ["Identity Verification Completed", selectedRequest.requested],
                    ["Account Access Deactivated", selectedRequest.requested],
                  ].map(([label, date], index) => (
                    <div key={label} className="flex gap-4">
                      <div className="relative flex w-8 shrink-0 justify-center">
                        {index < 2 && <span className="absolute top-8 h-8 w-px bg-white/10" />}
                        <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#202020]">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#E8D1AB]" />
                        </span>
                      </div>
                      <div>
                        <p className="text-sm">{label}</p>
                        <p className="mt-1 text-xs text-white/45">{date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 z-10 mt-auto grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 bg-black px-8 py-5">
              <button
                type="button"
                onClick={() => updateSelectedStatus("Processing")}
                className="h-12 rounded-lg bg-[#E8D1AB] text-sm font-medium text-black transition hover:bg-[#dcc39a]"
              >
                Start Delete Processing
              </button>
              <button
                type="button"
                onClick={() => updateSelectedStatus("Failed")}
                style={{ backgroundColor: "#F04444" }}
                className="h-12 rounded-lg text-sm font-medium text-white transition hover:brightness-90"
              >
                Mark as Failed
              </button>
              <button
                type="button"
                onClick={() => updateSelectedStatus("Cancelled")}
                className="col-span-2 h-12 rounded-lg bg-[#202020] text-sm font-medium text-white transition hover:bg-[#2b2b2b]"
              >
                Cancel Request &amp; Reactivate
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
