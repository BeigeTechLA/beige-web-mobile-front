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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DottedDivider from "@/components/admin/DottedDivider";
import MetricCards from "@/components/admin/OverviewMetricCards";
import OverviewMetricCards from "@/components/admin/OverviewMetricCards";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import { BookingStatus, LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import UsersTable from "@/components/sales/UsersTable";
import LeadsTable from "@/components/sales/BookingLeadsTable";
import { IntentBadge } from "@/components/sales/IntentBadge";
import Topbar from "@/components/admin/Topbar";

type TabType = "Booking" | "Client" | "Creative Partner";
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
  intent?: string;
  bookingStatus?: string;

}

interface LeadData {
  lead_id: number;
  clientName: string;
  email: string;
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Paid" | "In-Progress" | BookingStatus; 
  lastActivity: string;
  date: Date;
  intent: string;
}


const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (
  paymentStatus: string,
): "Paid" | "In-Progress" => {
  if (paymentStatus === "paid") return "Paid";
  return "In-Progress";
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "N/A";
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

const initialMetrics = [
  { id: 'total_active', label: 'Total Active Leads', value: '10', growth: 0, icon: Users, color: 'bg-[#E5D5B8]' },
  { id: 'sales_assisted', label: 'Sales Assisted Leads', value: '5', growth: 0, icon: Target, color: 'bg-zinc-800' },
  { id: 'total_conversion', label: 'Total Conversion Rate', value: '15.4', growth: 0, icon: ChartLine, color: 'bg-zinc-800' },
  { id: 'total_bookings', label: 'Total Bookings', value: '25', growth: 0, icon: Calendar, color: 'bg-zinc-800' },
];

const OverviewFilters = ["All Time", "Month", "Week"];

const tabs: { label: string; value: TabType }[] = [
  { label: "Booking Leads", value: "Booking" },
  { label: "Client Signup", value: "Client" },
  { label: "Creative Partner Signup", value: "Creative Partner" },
];

const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  "Signed Up - Lead Created",
  "Book a shoot - Lead Created",
  "Manual - Lead Created",
  "Booking In Progress",
  "Proposal Sent",
  "Ready for Payment",
  "Payment Sent",
  "Booked",
  "Closed – Lost",
];

export default function AdminSaleRepManagerPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = React.useState("");
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<TabType>("Booking");

  // --- LEADS STATE (Booking Tab) ---
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const leadsLimit = 10;
  const [displayLeads, setDisplayLeads] = useState<LeadData[]>([]);

  // Filters state
  const [leadTypeFilter, setLeadTypeFilter] = useState("All Leads");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [intentFilter, setIntentFilter] = useState<"All" | "Hot" | "Warm" | "Cold">("All");

  // --- USERS STATE (Client/CP Tabs) ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalRecords, setUsersTotalRecords] = useState(0);
  const [usersLimit] = useState(50);
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>("all");

  const [metrics, setMetrics] = useState<any[]>(initialMetrics);
  const [activeMetric, setActiveMetric] = useState('total_active');
  const [isLoading, setIsLoading] = useState(false);
  const [range, setRange] = useState('All Time');

  // --- FILTER CHANGE LOGIC ---
  // Reset pagination when any lead filter changes
  useEffect(() => {
    setLeadsCurrentPage(1);
  }, [leadTypeFilter, statusFilter, intentFilter, debouncedSearch]);

  // --- LEADS API CALL WITH FILTERS ---
  const { data: leadsApiData, isLoading: leadsIsLoading, isFetching: leadsIsFetching } = useGetLeadsQuery({
    page: leadsCurrentPage,
    limit: leadsLimit,
    search: debouncedSearch || undefined,
    // Mapping the filters to API keys
    lead_type: leadTypeFilter === "Self-Serve" ? "self_serve" : leadTypeFilter === "Sales Assisted" ? "sales_assisted" : undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
    // Note: If your API slice interface doesn't include 'intent', you may need to add it there too
    intent: intentFilter === "All" ? undefined : intentFilter, 
  });

  // Fetch users for Client and Creative Partner tabs
  const fetchUsers = async () => {
    if (activeTab === "Booking") return;
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

      if (activeTab === "Client") {
        const clientsRes = await adminApi.getClients(params);
        const clientsPayload = clientsRes?.data?.data || clientsRes?.data || {};
        const clientsList = Array.isArray(clientsPayload)
          ? clientsPayload
          : (clientsPayload.leads || clientsPayload.items || []);

        if (clientsList.length || clientsPayload.pagination) {
          const mappedClients = clientsList.map((client: any) => ({
            id: `#${client.lead_id || client.user_id || client.id}`,
            name: client.client_name || client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown",
            email: client.guest_email || client.email || "No Email",
            type: "Client" as const,
            status: (
              client.lead_status === "signed_up" || client.booking_status === "Signed Up"
                ? "Active"
                : client.status === 1 || client.status === "Active" || client.status === "approved"
                  ? "Active"
                  : client.status === 0 || client.status === "Inactive" || client.status === "rejected"
                    ? "Inactive"
                    : "Pending"
            ) as UserStatus,
            joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            initials: (client.client_name || client.name || "Unknown").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            phoneNumber: client.phone || client.phone_number || "N/A",
            imageUrl: client.profile_image || client.image || null,
            intent: client.intent || "N/A",
            bookingStatus: client.booking_status || mapLeadStatusToUI(client.payment_status),
          }));
          allUsers = mappedClients;
          pagination = clientsPayload.pagination || clientsRes?.pagination;
        }
      } else if (activeTab === "Creative Partner") {
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
              imageUrl: profilePhoto ? `${S3_PREFIX}${profilePhoto.file_path}` : null,
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

  useEffect(() => {
    if (activeTab !== "Booking") {
      fetchUsers();
    }
  }, [activeTab, usersCurrentPage, debouncedSearch, usersStatusFilter]);

  // Smooth transition effect for Leads mapping
  useEffect(() => {
    if (leadsApiData?.leads) {
      const mapped: LeadData[] = (leadsApiData.leads || []).map((lead: any) => ({
        lead_id: lead.lead_id,
        clientName: lead.client_name || lead.guest_email || "Unknown User",
        email: lead.guest_email || "No email",
        leadType: (lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted") as LeadData["leadType"],
        bookingStatus: lead.booking_status || "Unknown",
        lastActivity: formatRelativeTime(lead.last_activity_at),
        date: new Date(lead.created_at),
        intent: lead.intent || "Hot",
      }));
      setDisplayLeads(mapped);
    } else if (leadsApiData) {
        setDisplayLeads([]); // Clear if no leads found
    }
  }, [leadsApiData]);

  const leadsTotalRecords = leadsApiData?.pagination?.total || 0;
  const leadsTotalPages = Math.ceil(leadsTotalRecords / leadsLimit);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleUserRowClick = (user: UserData) => {
    const rawId = user.id.replace('#', '');
    const basePath = activeTab === "Client"
      ? "/admin/sales-representative/client"
      : "/admin/users/creative-partners";
    router.push(`${basePath}/${rawId}`);
  };

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    client: string,
    id: number | string,
  ) => {
    e.stopPropagation();
    setSelectedClient(client);
    setSelectedLeadId(id);

    const rect = e.currentTarget.getBoundingClientRect();
    const isNearRightEdge = window.innerWidth - rect.right < 250;
    const isNearBottomEdge = window.innerHeight - rect.bottom < 150;

    setMenuAnchor({
      x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
      y: isNearBottomEdge ? rect.top - 230 : rect.top - 20,
    });
  };

  const handleRowClick = (leadId: number) => {
    router.push(`/admin/sales-representative/${leadId}`);
  };

  const getGrowthLabel = () => {
    switch (range) {
      case 'Week': return 'from last week';
      case 'Month': return 'from last month';
      case 'All Time': return 'all time';
      default: return 'all time';
    }
  };

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
              <input
                type="text"
                placeholder={activeTab === "Booking" ? "Search leads..." : "Search users..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2.5 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
              />
            </div>
            {/* <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine /> Export
            </Button> */}
            <Button onClick={() => router.push("/admin/sales-representative/create-new-deal")} className="h-12 px-4 lg:px-7 bg-[#E5D5B8] text-black">
              Create new lead
            </Button>
          </>
        }
      />

      <div className="min-h-screen pb-40 p-4 lg:p-6 lg:px-10 lg:py-9">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div className="text-white">
            <h1 className="text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1">
              Sales Representative Management
            </h1>
            <p className="text-xs lg:text-sm text-white/70">
              View activity, manage assignments, and monitor performance across
              your sales team.
            </p>
          </div>
        </div>
        {/* <DottedDivider /> */}

        <OverviewMetricCards
          metrics={metrics}
          activeId={activeMetric}
          onSelect={setActiveMetric}
          isLoading={isLoading}
          getGrowthLabel={() => getGrowthLabel()}
          dropdownLabel="Duration"
          dropdownValue={range}
          dropdownOptions={OverviewFilters}
          onDropdownChange={setRange}
        />

        <div className="flex flex-col gap-6 my-6">
          <div className="flex flex-col lg:flex-row gap-2 justify-between">
            <TabsSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setUsersCurrentPage(1);
                setLeadsCurrentPage(1);
              }}
            />

           {activeTab === "Booking" && (
              <div className="flex flex-wrap gap-2 lg:gap-4">
                <BasicDropdown
                  label="Lead Type"
                  value={leadTypeFilter}
                  options={["All Leads", "Self-Serve", "Sales Assisted"]}
                  onChange={(val) => setLeadTypeFilter(val)}
                />
                <BasicDropdown
                  label="Intent Type"
                  value={intentFilter}
                  options={["All", "Hot", "Warm", "Cold"]}
                  onChange={(val) => setIntentFilter(val as any)}
                />
                <BasicDropdown
                  label="All Statuses"
                  value={statusFilter}
                  options={["All", ...BOOKING_STATUS_OPTIONS]}
                  onChange={(val) => setStatusFilter(val as any)}
                  openAlign={"right"}
                />
              </div>
            )}
          </div>
        </div>

        <DottedDivider className="lg:hidden" />

        {activeTab === "Booking" ? (
          <div className="flex flex-col gap-4">
            <div className="hidden lg:block">
              <LeadsTable
                data={displayLeads}
                loading={leadsIsLoading}
                isFetching={leadsIsFetching}
                currentPage={leadsCurrentPage}
                totalPages={leadsTotalPages}
                totalRecords={leadsTotalRecords}
                limit={leadsLimit}
                onPageChange={(page) => setLeadsCurrentPage(page)}
                onRowClick={handleRowClick}
                onOpenMenu={handleOpenMenu}
              />
            </div>

            <div className="lg:hidden flex flex-col gap-2">
              {displayLeads.map((lead) => (
                <MobileLeadRow
                  key={lead.lead_id}
                  lead={lead}
                  onOpenMenu={(e) => handleOpenMenu(e, lead.clientName, lead.lead_id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <UsersTable<UserData>
            data={users}
            loading={usersLoading}
            currentPage={usersCurrentPage}
            totalPages={usersTotalPages}
            totalRecords={usersTotalRecords}
            limit={usersLimit}
            headers={["User ID", "User Info", "Type", "Intent", "Status", "Contact Info", "Action"]}
            onPageChange={(page) => setUsersCurrentPage(page)}
            renderRow={(user) => (
              <tr
                key={user.id}
                className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0"
                onClick={() => handleUserRowClick(user)}
              >
                <td className="py-5 px-6 text-[#888] text-[14px]">{user.id}</td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5D5D5] flex items-center justify-center text-black font-bold text-sm">
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span>{user.initials}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[#E0E0E0] font-medium text-[15px]">{user.name}</p>
                      <p className="text-[#666666] text-xs mt-0.5">{user.joinDate}</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-[#E0E0E0] text-[14px]">{user.type}</td>
                <td className="py-5 px-6">
                  <IntentBadge intent={(user.intent as any) || "Warm"} />
                </td>
                <td className="py-5 px-6">
                  <LeadsStatusBadge status={(user.bookingStatus as any) || "Booking In Progress"} />
                </td>
                <td className="py-5 px-6 text-[#E0E0E0] text-[14px]">
                  {user.phoneNumber}
                </td>
                <td className="py-5 px-6 text-right">
                  <button
                    className="text-[#666] hover:text-white transition-colors p-1"
                    onClick={(e) => {
                      const rawId = user.id.replace('#', '');
                      handleOpenMenu(e, user.name, rawId as any);
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            )}
            renderMobileDetails={(user) => (
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-[10px] uppercase">Email</p>
                  <p className="text-white text-sm truncate">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase">Type</p>
                  <p className="text-white text-sm">{user.type}</p>
                </div>
                <div className="">
                  <p className="text-white/40 text-[10px] uppercase">Intent</p>
                  <div className="">
                    <IntentBadge intent={(user.intent as any) || "Hot"} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase">Contact Info</p>
                  <p className="text-white text-sm">{user.phoneNumber}</p>
                </div>
              </div>
            )}
          />
        )}

        {menuAnchor && selectedLeadId && (
          <ActionMenu
            client={selectedClient}
            leadId={selectedLeadId as number}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            anchor={menuAnchor}
            basePath={
              activeTab === "Client"
                ? "/admin/sales-representative/client"
                : activeTab === "Creative Partner"
                  ? "/admin/users/creative-partners"
                  : undefined
            }
          />
        )}
      </div>
    </>
  );
}
