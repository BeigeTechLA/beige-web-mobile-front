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

type StudioDashboardBooking = {
  studio_booking_id?: number;
  studio_id?: string | number | null;
  studio_name?: string | null;
  stream_project_booking_id?: number | null;
  user_id?: number | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_hours?: string | number | null;
  time_zone?: string | null;
  status?: string | null;
  base_amount?: string | number | null;
  overtime_amount?: string | number | null;
  platform_fee?: string | number | null;
  net_amount?: string | number | null;
  source?: string | null;
  metadata?: string | Record<string, unknown> | null;
  contact_name?: string | null;
  contact_email?: string | null;
  customer_name?: string | null;
  user_name?: string | null;
  image_url?: string | null;
  space_name?: string | null;
  project_name?: string | null;
  cast_and_crew_count?: number | null;
};

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
      upcoming?: StudioDashboardBooking[];
      completed?: StudioDashboardBooking[];
      cancelled?: StudioDashboardBooking[];
    };
    earnings_ledger?: Array<Record<string, unknown>>;
  } | null;
};

type StudioDashboardEntry = StudioDashboardBooking & {
  metadata?: Record<string, unknown> | null;
};

const safeParseMetadata = (metadata: StudioDashboardBooking["metadata"]): Record<string, unknown> | null => {
  if (!metadata) return null;
  if (typeof metadata === "object") return metadata;
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export default function AdminStudiosPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Operations");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dashboard, setDashboard] = useState<StudioDashboardResponse["data"]>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const dashboardMonth = useMemo(() => {
    const source = selectedDate || new Date();
    return format(source, "yyyy-MM");
  }, [selectedDate]);

  const dashboardBookings = useMemo<StudioDashboardEntry[]>(() => {
    const upcoming = dashboard?.bookings?.upcoming || [];
    const completed = dashboard?.bookings?.completed || [];
    const cancelled = dashboard?.bookings?.cancelled || [];
    return [...upcoming, ...completed, ...cancelled].map((booking) => ({
      ...booking,
      metadata: safeParseMetadata(booking.metadata),
    }));
  }, [dashboard]);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setIsDashboardLoading(true);
      try {
        const response = (await adminApi.getStudioDashboard(dashboardMonth)) as StudioDashboardResponse;
        if (!active) return;
        setDashboard(response?.data || null);
      } finally {
        if (active) {
          setIsDashboardLoading(false);
        }
      }
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

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
                <OverallBookingsStack isDark={isDark} cards={dashboardBookings} />
                <EarningsTable isDark={isDark} records={dashboard?.earnings_ledger || []} />
              </div>
            ) : activeTab === "Beige Studios" ? (
              <>
                <StudioListing
                  isDark={isDark}
                  searchQuery={debouncedSearchQuery}
                  statusFilter={statusFilter}
                  panelFiltersVisible={false}
                />
              </>
            ) : (
              <>
                <StudioRequestsTable
                  isDark={isDark}
                  searchQuery={debouncedSearchQuery}
                  selectedDate={selectedDate}
                  showRangeFilter={false}
                />
              </>
            )
          }
        </div>

      </div>
    </>
  );
}
