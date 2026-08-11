"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { format } from "date-fns";

import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfDay,
  format as formatDateFns,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Copy,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Search,
  SearchAlert,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

import Topbar from "@/components/admin/Topbar";
import { StudioRequestsTable } from "@/components/admin/studios/StudioRequestsTable";
import { EarningsTable } from "@/components/admin/studios/EarningsTable";
import OverviewChart from "@/components/admin/studios/OverviewChart";
import OverallBookingsStack from "@/components/admin/studios/OverallBookings";
import StudioListing from "@/components/admin/studios/StudioListing";
import { adminApi } from "@/lib/api";

type StudioDashboardResponse = {
  success: boolean;
  data?: {
    summary?: {
      total_revenue?: number;
      total_bookings?: number;
      average_booking_value?: number;
      overtime_revenue?: number;
      platform_fees?: number;
      net_earnings?: number;
    };
    chart?: Array<{ period?: string; total_revenue?: number; net_earnings?: number; bookings?: number }>;
    bookings?: {
      upcoming?: any[];
      completed?: any[];
      cancelled?: any[];
    };
    earnings_ledger?: any[];
  } | null;
};

export default function AdminStudiosPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Operations");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dashboard, setDashboard] = useState<StudioDashboardResponse["data"]>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const dashboardMonth = useMemo(() => {
    const source = selectedDate || new Date();
    return format(source, "yyyy-MM");
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setIsDashboardLoading(true);
      const response = (await adminApi.getStudioDashboard(dashboardMonth)) as StudioDashboardResponse;
      if (!active) return;
      setDashboard(response?.data || null);
      setIsDashboardLoading(false);
    };

    loadDashboard().catch(() => {
      if (active) {
        setDashboard(null);
        setIsDashboardLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [dashboardMonth]);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
              <input
                type="text"
                placeholder="Search Studio by name or shoot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors h-12 ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                // setCurrentPage(1); 
              }}>
              <SelectTrigger className={`w-[130px] rounded-lg h-12 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Initiated">Accepted</SelectItem>
                <SelectItem value="PreProduction">Rejected</SelectItem>
                <SelectItem value="Shoot Day">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className={`h-12
                ${isDark
                  ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50"
                  : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"}`
              }
            >
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <Link href={"/admin/studio-management/add-studio"}>
              <Button className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Create or Add Studio
              </Button>
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-6 lg:px-10 lg:py-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Studio Management</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Manage availability, bookings, and studio operations in one place.</p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <div className={`flex items-center gap-1 p-1.5 rounded-full w-fit border transition-colors mt-6 lg:mt-12 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"
          }`}>
          {(["Operations", "Beige Studios", "Studio Leads"] as string[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab) }}
              className={`py-4 lg:px-8 py-2.5 rounded-full text-sm lg:text-base transition-all ${activeTab === tab
                ? "bg-[#E5D5B8] text-black shadow-lg"
                : isDark ? "text-[#777] hover:text-white" : "text-[#666] hover:text-black"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {
            activeTab === "Operations" ? (
              <div className="space-y-3 lg:space-y-5">
                <OverviewChart isDark={isDark} loading={isDashboardLoading} dashboard={dashboard} externalSelectedDate={selectedDate} />
                <OverallBookingsStack isDark={isDark} cards={dashboard?.bookings ? [...(dashboard.bookings.upcoming || []), ...(dashboard.bookings.completed || []), ...(dashboard.bookings.cancelled || [])] : []} />
                <EarningsTable isDark={isDark} records={dashboard?.earnings_ledger || []} />
              </div>
            ) : activeTab === "Beige Studios" ? (
              <>
                <StudioListing isDark={isDark} />
              </>
            ) : (
              <>
                <StudioRequestsTable isDark={isDark} searchQuery={searchQuery} selectedDate={selectedDate} />
              </>
            )
          }
        </div>

      </div>
    </>
  );
}
