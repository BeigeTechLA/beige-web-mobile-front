"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { ChevronRight, MoreVertical, Search, ChevronUp, ChevronDown } from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { useRouter } from "next/navigation";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { SalesLead, LeadStatus } from "@/types/sales";
import { useDebounce } from "@/hooks/use-debounce";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

export default function SalesLeadsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [expandedId, setExpandedId] = useState<string | null>(null); // For mobile accordion

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
    clientName: lead.client_name || lead.guest_email || "Unknown Client",
    email: lead.guest_email || "No email",
    leadType: lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted",
    bookingStatus: mapLeadStatusToUI(lead.lead_status),
    lastActivity: formatRelativeTime(lead.last_activity_at),
    date: new Date(lead.created_at),
  }));

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    client: string,
    leadId: number,
  ) => {
    e.stopPropagation(); // Prevent row click
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
    // Navigate to lead detail page in sales portal
    router.push(`/sales/leads/${leadId}`);
  };


  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <div className="text-white">
          <h1 className="text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1">
            Sales Leads Management
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

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
          />
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg lg:rounded-2xl border border-[#3D3D3D] bg-[#171717]">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-10 lg:py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB]"></div>
          </div>
        ) : leadsData.length === 0 ? (
          <div className="flex items-center justify-center py-10 lg:py-20 text-white/60">
            <p>No leads found</p>
          </div>
        ) : (
          <>
            {/* --- MOBILE VIEW (Collapsible Cards) --- */}
            <div className="lg:hidden space-y-1">
              <div className="flex justify-between text-[#E8D1AB] text-sm font-medium p-4 bg-[#101010] rounded-b-2xl border-b border-b-white/5">
                <span>Client Name</span>
                <span>Booking Status</span>
              </div>
              {leadsData.map((lead) => {
                const isExpanded = String(expandedId) === String(lead.lead_id);

                return (
                  <div
                    key={lead.lead_id}
                    className="bg-[#101010] rounded-lg border border-white/5 overflow-hidden"
                  >
                    {/* Header: Always Visible */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleExpand(String(lead.lead_id))}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Chevron Indicator */}
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full border shrink-0 transition-colors ${isExpanded ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'}`}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-lg bg-[#FFF6D9] shrink-0 flex items-center justify-center text-black font-medium text-sm">
                          {lead.clientName.split(" ").map((n) => n[0]).join("")}
                        </div>

                        {/* Client Info - min-w-0 and truncate prevents layout overflow */}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{lead.clientName}</p>
                          <p className="text-white/40 text-[10px]">{format(lead.date, "MMM dd, yyyy")}</p>
                        </div>
                      </div>

                      {/* Status on the Right */}
                      <div className="shrink-0 ml-2">
                        <StatusBadge status={lead.bookingStatus} mobile />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-2 border-t border-white/5 grid grid-cols-2 gap-y-4">
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Email ID</p>
                          <p className="text-white text-sm truncate pr-2">{lead.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Lead Type</p>
                          <p className="text-white text-sm">{lead.leadType}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Last Activity</p>
                          <p className="text-white text-sm">{lead.lastActivity}</p>
                        </div>
                        <div className="text-right flex flex-col justify-end">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">ACTION</p>
                          <button
                            // onClick={() => handleRowClick(lead.lead_id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMenu(e, lead.clientName, lead.lead_id);
                            }}
                            className="text-[#E8D1AB] text-sm font-medium hover:underline text-right"
                          >
                            {/* View Profile */}
                            <MoreVertical className="ml-auto" size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* --- DESKTOP VIEW (Your Original Table) --- */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#101010] text-[#E8D1AB] text-sm font-medium">
                    <th className="rounded-l-2xl py-5 px-6 font-medium border-l border-b border-b-[#333333] border-l-[#333333]">
                      Client Name
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
          basePath="/sales/leads"
        />
      )}
    </>
  );
}
