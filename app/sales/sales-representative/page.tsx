"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { ChevronRight, MoreVertical, Search, Loader2, Target, ChartLine, Calendar, ArrowUpRight, User, Camera, Users, Check, X, ArrowUpToLine } from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { LeadStatus, SalesLead, LEAD_TYPE_LABELS } from "@/types/sales";
import { useDebounce } from "@/hooks/use-debounce";
import { MobileLeadRow } from "@/components/admin/sales-representative/MobileDetailsBlock";

// placeholder data

interface LeadData {
  lead_id: number;
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Booked" | "Cancelled" | "In-Progress";
  lastActivity: string;
  date: Date;
}

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (
  status: LeadStatus,
): "Booked" | "Cancelled" | "In-Progress" => {
  if (status === "booked") return "Booked";
  if (status === "abandoned") return "Cancelled";
  return "In-Progress";
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `${minutes} minutes ago`;
  }
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "1 day ago";
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  return date.toLocaleDateString();
};

const StatusBadge = ({ status }: { status: LeadData["bookingStatus"] }) => {
  const styles = {
    Booked: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
    Cancelled: "bg-[#fbd9d3] text-red-500 border-[#fbd9d3]",
    "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
  };

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap px-4 lg:px-7 py-3 rounded-full text-xs lg:text-base font-medium border ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default function SalesSalesRepManagerPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch real leads from API
  const { data, isLoading, isFetching } = useGetLeadsQuery({
    page: 1,
    limit: 50,
    search: debouncedSearch || undefined,
    start_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    end_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  // Map backend data to UI format
  const leadsData: LeadData[] = (data?.leads || []).map((lead: SalesLead) => ({
    lead_id: lead.lead_id,
    clientName: lead.client_name || lead.guest_email || "Unknown User",
    email: lead.guest_email || "No email",
    leadType: lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted",
    bookingStatus: mapLeadStatusToUI(lead.lead_status),
    lastActivity: formatRelativeTime(lead.last_activity_at),
    date: new Date(lead.created_at),
  }));

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    client: string,
    leadId: number,
  ) => {
    e.stopPropagation();
    setSelectedClient(client);
    setSelectedLeadId(leadId);
    const rect = e.currentTarget.getBoundingClientRect();

    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20,
    });
  };

  const handleRowClick = (leadId: number) => {
    router.push(`/sales/sales-representative/${leadId}`);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-center mb-3 lg:mb-6">
        <div className="text-white">
          <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">
            Sales Representative Management
          </h1>
          <p className="text-xs lg:text-sm text-white/70">
            View activity, manage assignments, and monitor performance across
            your sales team.
          </p>
        </div>

        {/* Sort By Date component to be added */}
        <div className="flex gap-2 ">
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>
      </div>

      <div
        className="lg:hidden h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px', // 30px is the total dash + gap width
          backgroundRepeat: 'repeat-x'
        }}
      />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#555] transition-colors"
          />
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB]"></div>
          </div>
        ) : leadsData.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-white/60">
            <p>No leads found</p>
          </div>
        ) : (
          <>

            {/* MOBILE LIST VIEW (lg:hidden) */}
            <div className="lg:hidden flex flex-col gap-2">
              {leadsData.map((lead) => (
                <MobileLeadRow
                  key={lead.lead_id}
                  lead={lead}
                  onOpenMenu={(e) => handleOpenMenu(e, lead.clientName, lead.lead_id)}
                />
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (hidden lg:block) */}
            <div className="hidden lg:block w-full overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#101010] text-[#E8D1AB] text-sm font-medium">
                    <th className="rounded-l-2xl py-5 px-6 font-medium border-l border-b border-b-[#333333] border-l-[#333333]">
                      User Name
                    </th>
                    <th className="py-5 px-6 font-medium border-b border-[#333333]">
                      Email ID
                    </th>
                    <th className="py-5 px-6 font-medium border-b border-[#333333]">
                      Lead Type
                    </th>
                    <th className="py-5 px-6 font-medium border-b border-[#333333]">
                      Booking Status
                    </th>
                    <th className="py-5 px-6 font-medium border-b border-[#333333]">
                      Last Activity
                    </th>
                    <th className="py-5 px-6 font-medium text-right rounded-r-2xl border-r border-b border-b-[#333333] border-r-[#333333]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadsData.map((lead) => (
                    <tr
                      key={lead.lead_id}
                      onClick={() => handleRowClick(lead.lead_id)}
                      className=" hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      {/* Client Name & Date */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-[50px] h-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-xl">
                            {lead.clientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-white font-medium text-base">
                              {lead.clientName}
                            </p>
                            <p className="text-white/40 text-sm mt-1.5">
                              {format(lead.date, "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-5 px-6 text-white text-base">
                        {lead.email}
                      </td>

                      {/* Lead Type */}
                      <td className="py-5 px-6">
                        <span className="text-white text-base">
                          {lead.leadType}
                        </span>
                      </td>

                      {/* Booking Status */}
                      <td className="py-5 px-6">
                        <StatusBadge status={lead.bookingStatus} />
                      </td>

                      {/* Last Activity */}
                      <td className="py-5 px-6 text-white text-base">
                        {lead.lastActivity}
                      </td>

                      {/* Action */}
                      <td className="py-5 px-6 text-right">
                        <Button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) =>
                            handleOpenMenu(e, lead.clientName, lead.lead_id)
                          }
                        >
                          <MoreVertical size={20} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {menuAnchor && selectedLeadId && (
        <ActionMenu
          client={selectedClient}
          leadId={selectedLeadId}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          anchor={menuAnchor}
        />
      )}
    </>
  );
}
