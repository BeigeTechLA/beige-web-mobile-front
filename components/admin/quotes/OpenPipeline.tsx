"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type OpenPipelineItem = {
  id: string;
  clientName: string;
  quoteNo: string;
  email: string;
  project: string;
  bookingStatus: "Converted to Booking" | "Pending";
  amount: string;
  paidAmount?: string;
  pendingAmount?: string;
  quoteStatus: "Sent" | "Accepted" | "Partially Paid";
  validity: string;
  salesRep: string;
  avatarBg: string;
  avatarText: string;
};

const DUMMY_PIPELINE_DATA: OpenPipelineItem[] = [
  {
    id: "1",
    clientName: "Ethan Carter",
    quoteNo: "QT-01",
    email: "ethan155@gmail.com",
    project: "Corporate video pro....",
    bookingStatus: "Converted to Booking",
    amount: "$13,475.70",
    paidAmount: "$10,475.70",
    pendingAmount: "$3000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "John Smith",
    avatarBg: "bg-[#FFF3D6]",
    avatarText: "text-black",
  },
  {
    id: "2",
    clientName: "Rami Guzman",
    quoteNo: "QT-02",
    email: "rami142@gmail.com",
    project: "Product launch....",
    bookingStatus: "Pending",
    amount: "$5000.00",
    pendingAmount: "$5000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "Sarah Johnson",
    avatarBg: "bg-[#D6E8FF]",
    avatarText: "text-black",
  },
  {
    id: "3",
    clientName: "John Lee",
    quoteNo: "QT-03",
    email: "john@gmail.com",
    project: "Commercial shoot....",
    bookingStatus: "Pending",
    amount: "$2000.00",
    paidAmount: "$2000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "Michael Chen",
    avatarBg: "bg-[#E2F0D9]",
    avatarText: "text-black",
  },
  {
    id: "4",
    clientName: "Kevin Brooks",
    quoteNo: "QT-04",
    email: "brookkevin@gmail.com",
    project: "Animated video",
    bookingStatus: "Converted to Booking",
    amount: "$1,400.00",
    paidAmount: "$700.00",
    pendingAmount: "$700.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "Emily Rodriguez",
    avatarBg: "bg-[#D9F2E6]",
    avatarText: "text-black",
  },
  {
    id: "5",
    clientName: "Lisa Anderson",
    quoteNo: "QT-05",
    email: "ethancole@gmail.com",
    project: "Social Media Photo....",
    bookingStatus: "Pending",
    amount: "$5000.00",
    pendingAmount: "$5000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "John Smith",
    avatarBg: "bg-[#F7D6E0]",
    avatarText: "text-black",
  },
  {
    id: "6",
    clientName: "Sukuna Cole",
    quoteNo: "QT-06",
    email: "sukuna@gmail.com",
    project: "Corporate video pro....",
    bookingStatus: "Converted to Booking",
    amount: "$2000.00",
    paidAmount: "$2000.00",
    quoteStatus: "Sent",
    validity: "April 15, 2026",
    salesRep: "Sarah Johnson",
    avatarBg: "bg-[#F3D3BD]",
    avatarText: "text-black",
  },
];

type PaginationItem = number | "...";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];
  const items: PaginationItem[] = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  items.push(1);
  if (left > 2) items.push("...");
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push("...");
  if (totalPages > 1) items.push(totalPages);

  return items;
};

export default function OpenPipelineWidget({
  isDark = true,
}: {
  isDark?: boolean;
}) {
  const [activeSection, setActiveSection] = useState<
    "sent" | "accepted" | "partiallyPaid" | null
  >(null);
  const [page, setPage] = useState(1);

  const totalPages = 10;
  const paginationItems = buildPaginationItems(page, totalPages);

  const toggleSection = (section: "sent" | "accepted" | "partiallyPaid") => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-lg lg:rounded-2xl border transition-all duration-300 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
    >
      {/* Top Main Section */}
      <div className="p-5 lg:p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-3 lg:mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
              <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
                Open Pipeline
              </span>
            </div>
            <div className={`text-2xl lg:text-4xl font-bold mt-2 capitalize ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              $12.4M
            </div>
            <p className={`text-sm lg:text-base mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>
              Total Active Pipeline Value
            </p>
          </div>

          {/* Active Quotes Badge Box */}
          <div
            className={`px-5 py-4 rouned-lg lg:rounded-2xl border text-center min-w-[120px] ${isDark
              ? "text-white bg-[linear-gradient(180deg,rgba(11,11,11,0.50)_0%,rgba(0,0,0,0.40)_100%)] border-white/5"
              : "bg-zinc-50 border-black/5 text-black"
              }`}
          >
            <div
              className={`text-xl lg:text-[32px] font-semibold`}
            >
              46
            </div>
            <div
              className={`text-base lg:text-xl mt-0.5`}
            >
              Active Quotes
            </div>
          </div>
        </div>

        {/* Pipeline Breakdown Bar Cards */}
        <div
          className={`p-3 lg:p-5 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 ${isDark
            ? "bg-[#101010]"
            : "bg-zinc-50 border border-black/5"
            }`}
        >
          {/* Sent Card */}
          <div className={`p-3 rounded-xl`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className={`text-base lg:text-xl  ${isDark ? "text-white/70" : "text-black/70"}}`}
                >
                  Sent
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#8B85FF] mt-0.5">
                  20 Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("sent")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="h-10 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(213,210,255,0.50)_39%,#7E72FF_100%)]" />
            </div>
          </div>

          {/* Accepted Card */}
         <div className={`p-3 rounded-xl`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className={`text-base lg:text-xl ${isDark ? "text-white/70" : "text-black/70"}}`}
                >
                  Accepted
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#4ADE80] mt-0.5">
                  14 Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("accepted")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="h-10 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(130,245,154,0.50)_39%,#35C653_100%)]" />
            </div>
          </div>

          {/* Partially Paid Card */}
          <div className={`p-3 rounded-xl`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span
                  className={`text-base lg:text-xl  ${isDark ? "text-white/70" : "text-black/70"}}`}
                >
                  Partially Paid
                </span>
                <p className="text-sm lg:text-base font-semibold text-[#E8D1AB] mt-0.5">
                  12 Quotes
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection("partiallyPaid")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 backdrop-blur-[76px] ${isDark
                  ? "bg-white/20 text-white/70 hover:bg-white/20"
                  : "bg-black/10 text-black/70 hover:bg-black/20"
                  }`}
              >
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="h-10 lg:h-14 w-full rounded-lg overflow-hidden flex items-center bg-[#101010] p-1">
              <div className="h-full w-1 bg-white/80 rounded-full mr-2 shrink-0" />
              <div className="h-full w-full rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.00)_0%,rgba(255,237,135,0.50)_39%,#DBC548_100%)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Table Section */}
      {activeSection !== null && (
        <div
          className={`border-t transition-all ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-black/10 bg-white"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs lg:text-sm font-medium ${isDark
                    ? "border-white/10 bg-[#101010] text-[#E8D1AB]"
                    : "border-black/10 bg-zinc-100 text-black/70"
                    }`}
                >
                  <th className="px-5 py-4">Client Name & Quote No</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Booking Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Quote Status</th>
                  <th className="p-4">Validity</th>
                  <th className="p-4">Sales Rep</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="text-sm lg:text-base">
                {DUMMY_PIPELINE_DATA.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isDark
                      ? "bg-[#171717] hover:bg-white/[0.02] text-white"
                      : "bg-black/10 hover:bg-black/[0.02] text-black"
                      }`}
                  >
                    {/* Client Name & Avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center font-medium text-sm lg:text-xl shrink-0 ${item.avatarBg} ${item.avatarText}`}
                        >
                          {getInitials(item.clientName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                              {item.clientName}
                            </span>
                            <span className={`text-[10px] lg:text-xs ${isDark ? "text-[#E8D1AB]" : "text-black/40"}`}>
                              ({item.quoteNo})
                            </span>
                          </div>
                          <div className={`text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className={`p-4 truncate max-w-[150px]`}>
                      {item.project}
                    </td>

                    {/* Booking Status Badge */}
                    <td className="p-4">
                      {item.bookingStatus === "Converted to Booking" ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#D4FFE4] text-[#16A34A]">
                          Converted to Booking
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#FFF0CF] text-[#C06D24]">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <div className={`font-medium ${isDark ? "text-white" : "text-black"}`}
                      >
                        {item.amount}
                      </div>
                      {item.paidAmount && (
                        <div className="text-[10px] lg:text-xs text-[#14BC52]">
                          PAID - {item.paidAmount}
                        </div>
                      )}
                      {item.pendingAmount && (
                        <div className="text-[10px] lg:text-xs text-[#F29831]">
                          PENDING - {item.pendingAmount}
                        </div>
                      )}
                    </td>

                    {/* Quote Status Badge */}
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center px-3 py-1 lg:px-5 lg:py-3 rounded-full text-xs lg:text-sm font-medium bg-[#AAD0FF] text-[#0C52A8]">
                        Sent
                      </span>
                    </td>

                    {/* Validity */}
                    <td className={`p-4 whitespace-nowrap`}>
                      {item.validity}
                    </td>

                    {/* Sales Rep */}
                    <td className={`p-4 whitespace-nowrap ${isDark ? "text-white/90" : "text-black/90"}`}>
                      {item.salesRep}
                    </td>

                    {/* Action Menu */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        className={`p-1.5 rounded-lg transition-colors ${isDark
                          ? "hover:text-white/80"
                          : "hover:text-black/80"
                          }`}
                      >
                        <MoreVertical size={30} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div
            className={`p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark
              ? "border-white/10 bg-[#101010]"
              : "border-black/10 bg-zinc-50"
              }`}
          >
            <div className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black" }`}>
              Page {page} to {totalPages}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  : "bg-white text-black/60 border-black/10 hover:bg-black/5"
                  }`}
              >
                <ChevronLeft size={20} />
              </button>

              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={`px-2 text-xs lg:text-sm ${isDark ? "text-white/40" : "text-black/40"}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`w-8 h-8 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all ${page === item
                      ? "bg-[#E5D5B8] text-black font-bold"
                      : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-black/60 hover:bg-black/5"
                      }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className={`p-2 rounded-lg border transition-all disabled:opacity-30 ${isDark
                  ? "bg-[#111] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  : "bg-white text-black/60 border-black/10 hover:bg-black/5"
                  }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}