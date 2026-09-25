"use client";

import React, { useState, useEffect } from "react";
import { MoreVertical, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";

export interface AgreementData {
  id: string;
  creativePartnerName: string;
  avatarUrl?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  date: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  compensation?: number;
  status: "Accepted" | "Expired" | "Not Accepted" | "Pending";
}

const DEFAULT_DUMMY_AGREEMENTS: AgreementData[] = [
  {
    id: "1",
    creativePartnerName: "John Doe",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    date: "Jan 13, 2026",
    projectName: "ABC Corporate Shoot",
    projectId: "ASN-2012",
    role: "Videographer",
    version: "v1.0",
    compensation: 2000.0,
    status: "Accepted",
  },
  {
    id: "2",
    creativePartnerName: "Rami Guzman",
    avatarInitials: "RG",
    avatarBgColor: "bg-[#BAC7D5]",
    date: "Jan 13, 2026",
    projectName: "Fashion Editorial",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    compensation: 1200.0,
    status: "Pending",
  },
  {
    id: "3",
    creativePartnerName: "Jhas Lee",
    avatarInitials: "JL",
    avatarBgColor: "bg-[#EFE6DB]",
    date: "Jan 13, 2026",
    projectName: "Product Shoot — Skincare",
    projectId: "ASN-2001",
    role: "Editor",
    version: "v1.0",
    compensation: 5000.0,
    status: "Pending",
  },
  {
    id: "4",
    creativePartnerName: "Kevin Brooks",
    avatarInitials: "KB",
    avatarBgColor: "bg-[#DDE2B6]",
    date: "Jan 13, 2026",
    projectName: "Podcast Shoot",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    compensation: 3000.0,
    status: "Accepted",
  },
  {
    id: "5",
    creativePartnerName: "Yuki Tanaka",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    date: "Jan 13, 2026",
    projectName: "Corporate Photography",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    compensation: 1000.0,
    status: "Pending",
  },
  {
    id: "6",
    creativePartnerName: "Lisa Anderson",
    avatarInitials: "LA",
    avatarBgColor: "bg-[#E8C5D8]",
    date: "Jan 13, 2026",
    projectName: "Music Video",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    compensation: 2000.0,
    status: "Accepted",
  },
];

interface AgreementHistoryTableProps {
  data?: AgreementData[];
  onActionClick?: (item: AgreementData, e: React.MouseEvent) => void;
}

export default function GeneralAgreementHistoryTable({
  data = DEFAULT_DUMMY_AGREEMENTS,
  onActionClick,
}: AgreementHistoryTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "shoot">("general");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const totalPages = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (status: AgreementData["status"]) => {
    switch (status) {
      case "Accepted":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#D4FFE4] text-[#16A34A] border border-[#D4FFE4]"
              : "bg-[#E6F8ED] text-[#0D894F] border border-[#A3E6C1]"
              }`}
          >
            Accepted
          </span>
        );
      case "Expired":
      case "Pending":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#FFF4C9] text-[#BA6605] border border-[#FFF4C9]"
              : "bg-[#FEF6E7] text-[#B7791F] border border-[#FCD34D]"
              }`}
          >
            {status}
          </span>
        );
      case "Not Accepted":
        return (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm lg:text-base font-medium ${isDark
              ? "bg-[#FFD4D4] text-[#A31616] border border-[#FFD4D4]"
              : "bg-[#FDE8E8] text-[#E53E3E] border border-[#F87171]"
              }`}
          >
            Not Accepted
          </span>
        );
      default:
        return null;
    }
  };

  const renderCreativePartnerCell = (item: AgreementData) => (
    <div className="flex items-center gap-3">
      {item.avatarUrl ? (
        <img
          src={item.avatarUrl}
          alt={item.creativePartnerName}
          className="w-10 h-10 rounded-lg object-cover"
        />
      ) : (
        <div
          className={`w-10 h-10 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center text-black font-semibold text-sm lg:text-base ${
            item.avatarBgColor || "bg-[#EFE6DB]"
          }`}
        >
          {item.avatarInitials}
        </div>
      )}
      <div>
        <p className={`font-medium text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>
          {item.creativePartnerName}
        </p>
        <p className={`text-xs lg:text-sm mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
          {item.date}
        </p>
      </div>
    </div>
  );

  const renderProjectCell = (item: AgreementData) => (
    <div>
      <p className={`text-sm lg:text-base leading-snug ${isDark ? "text-white" : "text-black"}`}>
        {item.projectName}
      </p>
      <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-black/50"}`}>
        {item.projectId}
      </p>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className={`w-full border rounded-xl font-sans transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-6 gap-4 border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
          <h2 className={`text-base ${isDark ? "text-white" : "text-black"}`}>
            {activeTab === "general" ? "General Agreement History" : "Shoot Agreement History"}
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center p-1 rounded-lg border w-full sm:w-auto ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F8F8F8] border-[#E5E5E5]"}`}>
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs rounded-md transition-all ${
              activeTab === "general"
              ? "bg-[#E5D5B8] text-black font-semibold shadow-xs"
              : isDark
                ? "text-white/60 hover:text-white"
                : "text-black/60 hover:text-black"
              }`}
          >
            General Agreement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shoot")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs rounded-md transition-all ${
              activeTab === "shoot"
              ? "bg-[#E5D5B8] text-black font-semibold shadow-xs"
              : isDark
                ? "text-white/60 hover:text-white"
                : "text-black/60 hover:text-black"
              }`}
          >
            Shoot Agreement
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b text-sm font-medium rounded-b-xl ${
                isDark ? "border-[#3D3D3D] text-[#E8D1AB]" : "border-[#E5E5E5] text-[#8C6B30]"
              }`}
            >
              {activeTab === "general" ? (
                <>
              <th className="py-4 px-6">Creative Partner</th>
              <th className="py-4 px-6">Project Name & ID</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Version</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
                </>
              ) : (
                <>
                  <th className="py-4 px-6">Project Name & ID</th>
                  <th className="py-4 px-6">Creative Partner</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Version</th>
                  <th className="py-4 px-6">Compensation</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={isDark ? "bg-[#171717]" : ""}>
            {data.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors ${
                  isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"
                }`}
              >
                {activeTab === "general" ? (
                  <>
                    <td className="py-4 px-6">{renderCreativePartnerCell(item)}</td>
                    <td className="py-4 px-6">{renderProjectCell(item)}</td>
                    <td className={`py-4 px-6 text-sm lg:text-base ${isDark ? "text-white/80" : "text-black/80"}`}>
                      {item.role}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-sm border ${isDark
                      ? "text-[#18150F] bg-[#EDE5D5] border-[#3D3D3D]"
                      : "text-black/80 bg-[#F8F8F8] border-[#E5E5E5]"
                      }`}
                  >
                    {item.version}
                  </span>
                </td>
                    <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-6">{renderProjectCell(item)}</td>
                    <td className="py-4 px-6">{renderCreativePartnerCell(item)}</td>
                    <td className={`py-4 px-6 text-sm lg:text-base ${isDark ? "text-white/80" : "text-black/80"}`}>
                      {item.role}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded border ${
                          isDark
                            ? "text-white bg-[#222222] border-white/10"
                            : "text-black/80 bg-[#F8F8F8] border-[#E5E5E5]"
                        }`}
                      >
                        {item.version}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                      ${item.compensation ? item.compensation.toFixed(2) : "0.00"}
                    </td>
                <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                  </>
                )}

                {/* Action Column */}
                <td className="py-4 px-6 text-right">
                  <button
                    type="button"
                    onClick={(e) => onActionClick?.(item, e)}
                    className={`transition-colors ${
                      isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
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

      {/* Mobile Responsive View */}
      <div className="block lg:hidden w-full">
        <div
          className={`flex items-center justify-between px-4 py-3 border-b text-xs uppercase tracking-wider font-medium ${
            isDark ? "border-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "border-[#E5E5E5] text-[#8C6B30] bg-[#F8F8F8]"
          }`}
        >
          <span>{activeTab === "general" ? "Creative Partner" : "Project"}</span>
          <span>Status</span>
        </div>

        {/* Mobile Rows */}
        <div className={`divide-y ${isDark ? "divide-[#3D3D3D]" : "divide-[#E5E5E5]"}`}>
          {data.map((item) => {
            const isExpanded = !!expandedRows[item.id];
            return (
              <div key={item.id} className="transition-colors">
                {/* Main Visible Row */}
                <div
                  onClick={() => toggleRowExpand(item.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`p-0.5 rounded transition-colors ${isDark ? "text-white/60" : "text-black/60"
                        }`}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.creativePartnerName}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-xs shrink-0 ${item.avatarBgColor || "bg-[#EFE6DB]"
                          }`}
                      >
                        {item.avatarInitials}
                      </div>
                    )}
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-black"}`}>
                        {item.creativePartnerName}
                      </p>
                      <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {item.projectName}
                      </p>
                    </div>
                  </div>

                    <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Collapsible Expanded Details */}
                {isExpanded && (
                  <div
                    className={`px-4 pb-4 pt-1 grid grid-cols-2 gap-2.5 text-xs ${
                      isDark ? "bg-[#171717]" : "bg-[#F8F8F8]/50"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={isDark ? "text-white/50" : "text-black/50"}>Project ID</span>
                      <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {item.projectId}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 items-end">
                      <span className={isDark ? "text-white/50" : "text-black/50"}>Role</span>
                      <span className={`font-medium ${isDark ? "text-white/90" : "text-black/90"}`}>
                        {item.role}
                      </span>
                    </div>

                    {activeTab === "shoot" && (
                    <div className="flex flex-col gap-0.5">
                        <span className={isDark ? "text-white/50" : "text-black/50"}>Compensation</span>
                        <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                          ${item.compensation ? item.compensation.toFixed(2) : "0.00"}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col gap-0.5 ${activeTab === "general" ? "" : "items-end"}`}>
                      <span className={isDark ? "text-white/50" : "text-black/50"}>Version</span>
                      <span
                        className={`w-fit px-2.5 py-0.5 text-xs font-medium rounded-sm border ${
                          isDark
                          ? "text-[#18150F] bg-[#EDE5D5] border-[#3D3D3D]"
                          : "text-black/80 bg-[#F8F8F8] border-[#E5E5E5]"
                          }`}
                      >
                        {item.version}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-2 pt-2 border-t border-white/10 flex-row justify-between items-center">
                    <div className="flex flex-col gap-0.5 items-end">
                      <span className={isDark ? "text-white/50" : "text-black/50"}>Date</span>
                      <span className={isDark ? "text-white/80" : "text-black/80"}>{item.date}</span>
                    </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionClick?.(item, e);
                        }}
                        className={`p-1.5 rounded-lg ${isDark ? "text-white" : "text-black/70"}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Pagination */}
      <div className={`flex flex-col sm:flex-row items-center justify-between p-4 lg:p-6 border-t gap-4 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
        <p className={`hidden lg:block text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
          Page {currentPage} of {totalPages}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-30 ${isDark
              ? "border-[#3D3D3D] text-white/70 hover:text-white"
              : "border-[#E5E5E5] text-black/70 hover:text-black"
              }`}
          >
            <ChevronLeft size={16} />
          </button>

          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg border transition-all ${currentPage === page
                ? isDark
                  ? "border-[#E5D5B8] bg-[#E5D5B8] text-black font-semibold"
                  : "border-[#E8D1AB] bg-[#E8D1AB] text-black font-semibold"
                : isDark
                  ? "border-[#3D3D3D] text-white/60 hover:text-white"
                  : "border-[#E5E5E5] text-black/60 hover:text-black"
                }`}
            >
              {page}
            </button>
          ))}

          <span className={`px-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>...</span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-30 ${isDark
              ? "border-[#3D3D3D] text-white/70 hover:text-white"
              : "border-[#E5E5E5] text-black/70 hover:text-black"
              }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}