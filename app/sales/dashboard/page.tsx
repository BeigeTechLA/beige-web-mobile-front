"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import {
  MoreVertical,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  User,
  Camera,
} from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { useRouter } from "next/navigation";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { SalesLead, LeadStatus } from "@/types/sales";
import { useDebounce } from "@/hooks/use-debounce";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

// placeholder data

type TabType = "booking_leads" | "client_signup" | "creative_partner_signup";
type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

interface UserData {
  id: string;
  name: string;
  email: string;
  type: "Client" | "Creative Partner";
  status: UserStatus;
  joinDate: string;
  initials: string;
  phoneNumber?: string;
  role?: string;
  imageUrl?: string | null;
}

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
  const [activeTab, setActiveTab] = useState<TabType>("booking_leads");

  // Users state for Client and Creative Partner tabs
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalRecords, setUsersTotalRecords] = useState(0);
  const [usersLimit] = useState(50);
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>("all");

  // Fetch users for Client and Creative Partner tabs
  const fetchUsers = async () => {
    if (activeTab === "booking_leads") return;
    setUsersLoading(true);
    try {
      const params: any = {
        page: usersCurrentPage,
        limit: usersLimit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (usersStatusFilter !== "all") params.status = usersStatusFilter;

      let allUsers: UserData[] = [];
      let pagination: any = null;

      if (activeTab === "client_signup") {
        const clientsRes = await adminApi.getClients(params);
        if (clientsRes?.data) {
          const mappedClients = (Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.items || [])).map((client: any) => ({
            id: `#${client.user_id || client.id}`,
            name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown",
            email: client.email || "No Email",
            type: "Client" as const,
            status: (client.status === 1 || client.status === "Active" || client.status === "approved" ? "Active" :
              client.status === 0 || client.status === "Inactive" || client.status === "rejected" ? "Inactive" : "Pending") as UserStatus,
            joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            initials: (client.name || "Unknown").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            phoneNumber: client.phone_number || "N/A",
            imageUrl: client.profile_image || client.image || null,
          }));
          allUsers = mappedClients;
          pagination = clientsRes.pagination;
        }
      } else if (activeTab === "creative_partner_signup") {
        const creativeRes = await adminApi.getPendingCP(params);
        if (creativeRes?.data) {
          const mappedCreatives = (Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || [])).map((member: any) => {
            const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || "Unknown";
            const profilePhoto = member.crew_member_files?.find((file: any) => file.file_type === 'profile_photo');
            return {
              id: `#${member.crew_member_id || member.id}`,
              name: fullName,
              email: member.email || "No Email",
              type: "Creative Partner" as const,
              status: (member.status?.toLowerCase() === "approved" ? "Approved" :
                member.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as UserStatus,
              joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
              initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
              role: member.role?.role_name || member.category_name || "N/A",
              phoneNumber: member.phone_number || "N/A",
              imageUrl: profilePhoto ? `https://beigexmemehouse.s3.amazonaws.com/beige/${profilePhoto.file_path}` : null,
            };
          });
          allUsers = mappedCreatives;
          pagination = creativeRes.pagination;
        }
      }

      setUsers(allUsers);
      if (pagination) {
        setUsersTotalRecords(pagination.total_records || allUsers.length);
        setUsersTotalPages(pagination.total_pages || 1);
      } else {
        setUsersTotalRecords(allUsers.length);
        setUsersTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab !== "booking_leads") {
      fetchUsers();
    }
  }, [activeTab, usersCurrentPage, debouncedSearch, usersStatusFilter]);

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

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
          <input
            type="text"
            placeholder={activeTab === "booking_leads" ? "Search leads..." : "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl w-fit border border-[#333]">
          {(["booking_leads", "client_signup", "creative_partner_signup"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setUsersCurrentPage(1);
              }}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${activeTab === tab
                ? "bg-[#E5D5B8] text-black shadow-lg"
                : "text-[#777] hover:text-white"
                }`}
            >
              {tab === "creative_partner_signup" ? "CreativePartner_Signup" : tab === "booking_leads" ? "Booking_Leads" : "User_Signup"}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg lg:rounded-2xl border border-[#3D3D3D] bg-[#171717]">
        {activeTab === "booking_leads" ? (
          <>
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
                    <span>User Name</span>
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
                          <td className="py-5 px-6 whitespace-nowrap w-px">
                            <div className="flex items-center min-w-max">
                              <StatusBadge status={lead.bookingStatus} />
                            </div>
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
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-full bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[#888] text-sm font-normal border-b border-[#333]">
                      <th className="py-5 px-6 font-medium">User ID</th>
                      <th className="py-5 px-6 font-medium">User Info</th>
                      <th className="py-5 px-6 font-medium">Type</th>
                      <th className="py-5 px-6 font-medium">Contact / Role</th>
                      <th className="py-5 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#888]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-[#E8D1AB] border-t-transparent rounded-full animate-spin" />
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#888]">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((user, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            const cleanId = user.id.replace('#', '');
                            if (user.type === "Client") {
                              router.push(`/sales/users/clients/${cleanId}`);
                            } else {
                              router.push(`/sales/users/creative-partners/${cleanId}`);
                            }
                          }}
                          className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                        >
                          <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.id}</td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] overflow-hidden flex items-center justify-center text-[#E5D5B8] font-semibold text-sm border border-white/5 relative">
                                {user.imageUrl ? (
                                  <img
                                    src={user.imageUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      if (target.parentElement) {
                                        target.parentElement.textContent = user.initials;
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-zinc-400">{user.initials}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-[#E0E0E0] font-medium text-[15px]">{user.name}</p>
                                <p className="text-[#666666] text-xs mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2 text-sm text-[#888]">
                              {user.type === "Client" ? <User size={14} /> : <Camera size={14} />}
                              <span>{user.type}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">
                            <div className="flex flex-col gap-1">
                              {user.phoneNumber && user.phoneNumber !== "N/A" && (
                                <span className="text-zinc-500">{user.phoneNumber}</span>
                              )}
                              {user.type === "Creative Partner" && (
                                <span className="w-fit px-2 py-0.5 bg-[#E5D5B8]/10 text-[#E5D5B8] rounded text-xs">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <button className="text-[#666] hover:text-white transition-colors">
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination for Users */}
            {!usersLoading && usersTotalPages > 1 && (
              <div className="flex justify-between items-center p-6 border-t border-[#333333]">
                <div className="text-sm text-[#666666]">
                  Showing {((usersCurrentPage - 1) * usersLimit) + 1} to {Math.min(usersCurrentPage * usersLimit, usersTotalRecords)} of {usersTotalRecords} results
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setUsersCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={usersCurrentPage === 1}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setUsersCurrentPage(pageNum)}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${usersCurrentPage === pageNum
                            ? "bg-[#E5D5B8] text-black"
                            : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setUsersCurrentPage(prev => Math.min(usersTotalPages, prev + 1))}
                    disabled={usersCurrentPage === usersTotalPages}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {menuAnchor && selectedLeadId && (
        <ActionMenu
          client={selectedClient}
          leadId={selectedLeadId as number}
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          anchor={menuAnchor as { x: number; y: number }}
          basePath="/sales/leads"
        />
      )}
    </>
  );
}
