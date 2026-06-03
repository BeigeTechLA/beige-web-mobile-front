"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompensationDetailsModal from "./CompensationDetailsModal";

interface CPCompensationTableProps {
  type: "shoots" | "creators";
}

const SHOOT_DATA = [
  { id: 1, name: "Corporate Shoot", type: "Videography", totalCP: "02 CPs", customer: { name: "Alex Morgan", initials: "AM" }, budget: "$50,000", payout: "$12,500", margin: "18.5%", status: "Pending" },
  { id: 2, name: "Podcast Shoot", type: "Videography + Photography", totalCP: "04 CPs", customer: { name: "Ethan Carter", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan" }, budget: "$20,000", payout: "$10,000", margin: "16.2%", status: "Partially Paid" },
  { id: 3, name: "Music Video Shoot", type: "Videography", totalCP: "01 CPs", customer: { name: "Maya Ross", initials: "MR" }, budget: "$45,000", payout: "$25,000", margin: "8.5%", status: "Finance Approval" },
  { id: 4, name: "Product Shoot", type: "Photography", totalCP: "03 CPs", customer: { name: "John Lee", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" }, budget: "$10,000", payout: "$5,000", margin: "18.5%", status: "Approved" },
  { id: 5, name: "Wedding Shoot", type: "Videography + Photography", totalCP: "02 CPs", customer: { name: "Raj Yadhav", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raj" }, budget: "$1,00,000", payout: "$64,000", margin: "18.5%", status: "Fully Paid" },
  { id: 6, name: "Concert Shoot", type: "Videography + Photography", totalCP: "04 CPs", customer: { name: "Daniel Roberts", initials: "DR" }, budget: "$2,00,000", payout: "$1,10,000", margin: "18.5%", status: "Pending" },
];

const CREATOR_DATA = [
  { id: 1, name: "Raj Verma", type: "Videographer", totalShoots: "02 Shoots", customer: { name: "Alex Morgan", initials: "AM" }, budget: "$50,000", payout: "$12,500", margin: "18.5%", status: "Pending" },
  { id: 2, name: "Daniel Foster", type: "Videographer + Photographer", totalShoots: "04 Shoots", customer: { name: "Ethan Carter", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan" }, budget: "$20,000", payout: "$10,000", margin: "16.2%", status: "Partially Paid" },
  { id: 3, name: "Liam Parker", type: "Videographer", totalShoots: "01 Shoots", customer: { name: "Maya Ross", initials: "MR" }, budget: "$45,000", payout: "$25,000", margin: "8.5%", status: "Finance Approval" },
  { id: 4, name: "Noah Bennett", type: "Photographer", totalShoots: "03 Shoots", customer: { name: "John Lee", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" }, budget: "$10,000", payout: "$5,000", margin: "18.5%", status: "Approved" },
  { id: 5, name: "James Carter", type: "Videographer + Photographer", totalShoots: "02 Shoots", customer: { name: "Raj Yadhav", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raj" }, budget: "$1,00,000", payout: "$64,000", margin: "18.5%", status: "Fully Paid" },
  { id: 6, name: "Lucas Reed", type: "Videographer + Photographer", totalShoots: "04 Shoots", customer: { name: "Daniel Roberts", initials: "DR" }, budget: "$2,00,000", payout: "$1,10,000", margin: "18.5%", status: "Pending" },
];

const STATUS_STYLES: Record<string, string> = {
  "Pending": "bg-[#453A26]/30 text-[#E8D1AB] border-[#E8D1AB]/30",
  "Partially Paid": "bg-[#253A4C]/30 text-[#85C1E9] border-[#85C1E9]/30",
  "Finance Approval": "bg-[#453A26]/30 text-[#E8D1AB] border-[#E8D1AB]/30",
  "Approved": "bg-[#102A24] text-[#17D8A2] border-[#17D8A2]/30",
  "Fully Paid": "bg-[#2D2A4C]/30 text-[#C39BD3] border-[#C39BD3]/30",
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const range: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) range.push(i);
    else if (i === left - 1 || i === right) range.push("...");
  }
  return range.filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...");
};

export default function CPCompensationTable({ type }: CPCompensationTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const data = type === "shoots" ? SHOOT_DATA : CREATOR_DATA;

  // Simulate loading on type change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [type]);

  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  return (
    <section className={`w-full rounded-2xl border overflow-hidden ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}>
      {/* Search and Filters */}
      <div className={`p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <h3 className={isDark ? "text-white text-[18px]" : "text-[#323232] text-[18px]"}>
              {type === "shoots" ? "Shoots" : "Creators"} Compensation History
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Fully Paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="Month">Month</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder={`Search by ${type === "shoots" ? "Shoot Name, CP, Customer..." : "Creator Name, Customer..."}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
              isDark
                ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
            }`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-base font-medium border-b ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
              <th className="py-5 px-6 font-medium whitespace-nowrap">{type === "shoots" ? "SHOOT NAME" : "CREATOR NAME"}</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap text-center">{type === "shoots" ? "TOTAL CP" : "TOTAL SHOOTS"}</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap">CUSTOMER</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap">SHOOT BUDGET</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap">CP PAYOUT</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap text-center">MARGIN</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap text-center">STATUS</th>
              <th className="py-5 px-6 font-medium whitespace-nowrap text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <Loader2 className="animate-spin text-[#E8D1AB] mx-auto" size={32} />
                </td>
              </tr>
            ) : visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRecord(row)}
                  className={`border-b cursor-pointer transition-colors ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                >
                  <td className="py-6 px-6">
                    <div className="flex flex-col">
                      <span className={`text-[18px] font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.name}</span>
                      <span className={`text-sm ${isDark ? "text-white/40" : "text-[#777]"} mt-1`}>{row.type}</span>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center text-[18px] text-white/70">
                    {type === "shoots" ? row.totalCP : row.totalShoots}
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-3">
                      {row.customer.image ? (
                        <img src={row.customer.image} alt={row.customer.name} className="w-10 h-10 rounded-full object-cover bg-white/5" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                          {row.customer.initials}
                        </div>
                      )}
                      <span className={`text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.customer.name}</span>
                    </div>
                  </td>
                  <td className={`py-6 px-6 text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.budget}</td>
                  <td className={`py-6 px-6 text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.payout}</td>
                  <td className="py-6 px-6 text-center">
                    <span className={`text-[18px] font-semibold ${parseFloat(row.margin) < 10 ? "text-[#FF4D4F]" : "text-[#17D8A2]"}`}>
                      {row.margin}
                    </span>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <span className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold ${STATUS_STYLES[row.status] || "bg-white/5 text-white/45 border-white/10"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-6 px-6 text-right text-white/40">
                    <ChevronRight size={22} className="ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className={`py-12 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredRows.length > 0 && (
        <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Page {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRows.length)}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span key={`dots-${index}`} className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      safePage === page
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-[#666] hover:bg-zinc-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedRecord && (
        <CompensationDetailsModal 
          isOpen={true} 
          onClose={() => setSelectedRecord(null)} 
          data={selectedRecord} 
        />
      )}
    </section>
  );
}


