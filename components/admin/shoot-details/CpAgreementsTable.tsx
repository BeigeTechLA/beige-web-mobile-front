"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

export interface CPAgreementItem {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  agreementType: string;
  version: string;
  compensation: string;
  status: "Accepted" | "Pending" | "Rejected" | "Draft";
}

const DEFAULT_AGREEMENTS: CPAgreementItem[] = [
  {
    id: "1",
    name: "Ethan Cole",
    role: "Lead Photographer",
    avatarUrl: "/images/avatars/ethan.jpg",
    agreementType: "Individual",
    version: "v1.0",
    compensation: "$6,250.00",
    status: "Accepted",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Videographer",
    avatarUrl: "/images/avatars/michael.jpg",
    agreementType: "Individual",
    version: "v1.0",
    compensation: "$6,250.00",
    status: "Pending",
  },
];

interface CpAgreementsTableProps {
  agreements?: CPAgreementItem[];
  onActionClick?: (agreement: CPAgreementItem) => void;
}

export default function CpAgreementsTable({
  agreements = DEFAULT_AGREEMENTS,
  onActionClick,
}: CpAgreementsTableProps) {
  const { isDark } = useResolvedTheme();
  const [statusFilter, setStatusFilter] = useState("all");

  const availableStatuses = ["all", "Accepted", "Pending", "Rejected", "Draft"];

  // Filter agreements based on selected status
  const filteredAgreements = statusFilter && statusFilter !== "all"
    ? agreements.filter((item) => item.status === statusFilter)
    : agreements;

  return (
    <div
      className={`w-full overflow-hidden transition-colors ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E5E7EB]"
        }`}
    >
      {/* Table Header Controls */}
      <div className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h3
          className={`w-full text-base lg:text-lg font-bold ${isDark ? "text-white" : "text-black"
            }`}
        >
          Creative Partner Assignment
        </h3>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className={`max-w-[170px] ${isDark
                ? "border-white/20 bg-[#202020] text-white data-[placeholder]:text-white/50"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] data-[placeholder]:text-black/50"
              }`}
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent
            className={`${isDark
                ? "bg-[#3D3D3D] border-white/10 text-white"
                : "bg-white border-[#E5E7EB] text-[#323232]"
              }`}
          >
            {availableStatuses.map((status) => (
              <SelectItem
                key={status}
                value={status}
                className={
                  isDark
                    ? "focus:bg-[#262626] focus:text-white"
                    : "focus:bg-[#F3F4F6] focus:text-black"
                }
              >
                {status === "all" ? "All Status" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          {/* Table Header */}
          <thead>
            <tr
              className={`border-y text-sm font-medium ${isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-[#E8D1AB]"
                  : "border-[#E5E7EB] bg-[#FAFAFA] text-[#8C7A58]"
                }`}
            >
              <th className="p-5 w-[25%]">Creative Partner</th>
              <th className="py-5 px-3 w-[18%]">Agreement Type</th>
              <th className="py-5 px-3 w-[10%]">Version</th>
              <th className="py-5 px-3 w-[20%]">Compensation</th>
              <th className="py-5 px-3 w-[17%]">Agreement Status</th>
              <th className="p-5 text-right w-[10%]">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredAgreements.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors group text-sm ${isDark ? "hover:bg-[#141414]" : "hover:bg-[#F9FAFB]"    }`}
              >
                {/* Creative Partner Column */}
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <div className={`relative w-10 h-10 rounded-lg overflow-hidden shrink-0 p-2.5 flex items-center justify-center ${isDark? "bg-[#FFF4C9] text-black": "bg-[#E5E7EB]"}`}>
                      {getInitials(item.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`whitespace-nowrap font-medium text-base tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                        {item.name}
                      </span>
                      <span className={`whitespace-nowrap text-xs ${isDark ? "text-white/40" : "text-[#666666]"}`}>
                        {item.role}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Agreement Type Column */}
                <td className={`text-base py-5 px-3 ${isDark ? "text-[#D0D0D0]" : "text-[#4B5563]"}`}>
                  {item.agreementType}
                </td>

                {/* Version Column */}
                <td className="py-5 px-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${isDark
                        ? "bg-[#EDE5D5] text-[#18150F]"
                        : "bg-[#F3F4F6] text-[#374151]"
                      }`}
                  >
                    {item.version}
                  </span>
                </td>

                {/* Compensation Column */}
                <td className={`text-base tracking-tight py-5 px-3 ${isDark ? "text-white" : "text-black"}`}>
                  {item.compensation}
                </td>

                {/* Status Column */}
                <td className="py-5 px-3">
                  {item.status === "Accepted" && (
                    <span className="inline-flex items-center justify-center px-5 py-1.5 rounded-full text-sm lg:text-base font-medium bg-[#D4FFE4] text-[#16A34A]">
                      Accepted
                    </span>
                  )}
                  {item.status === "Pending" && (
                    <span className="inline-flex items-center justify-center px-5 py-1.5 rounded-full text-sm lg:text-base font-medium bg-[#FFF4C9] text-[#BA6605]">
                      Pending
                    </span>
                  )}
                  {item.status === "Rejected" && (
                    <span className="inline-flex items-center justify-center px-5 py-1.5 rounded-full text-sm lg:text-base font-medium bg-[#FEE2E2] text-[#991B1B]">
                      Rejected
                    </span>
                  )}
                  {item.status === "Draft" && (
                    <span
                      className={`inline-flex items-center justify-center px-5 py-1.5 rounded-full text-sm lg:text-base font-medium ${isDark
                          ? "bg-[#262626] text-[#A3A3A3]"
                          : "bg-[#E5E7EB] text-[#4B5563]"
                        }`}
                    >
                      Draft
                    </span>
                  )}
                </td>

                {/* Action Column */}
                <td className="p-5 text-right">
                  <button
                    onClick={() => onActionClick?.(item)}
                    type="button"
                    className={`p-2 rounded-lg transition-colors inline-flex items-center justify-center ${isDark
                        ? "text-white hover:text-white/80"
                        : "text-black hover:text-black/80"
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
    </div>
  );
}