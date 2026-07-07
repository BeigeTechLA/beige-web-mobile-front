"use client";
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo

import { toast } from "sonner";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EarningsOverviewChart from "@/components/creator-profile/EarningsOverviewChart";
import EarningsCard, { EarningsCardData } from "@/components/creator-profile/EarningsCard";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Search } from "lucide-react";
import EarningsBreakdownModal from "@/components/creator-profile/EarningsBreakdownModal";
import PaymentTimelineModal, { TimelineEvent } from "@/components/creator-profile/PaymentTimelineModal";
import { getCreatorEarningDetails, getCreatorEarningsDashboard, getCreatorEarningsList } from "@/lib/api";

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const formatDate = (dateStr: string, style: 'short' | 'long' = 'short') => {
  if (!dateStr) return "";
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (style === 'long') {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapRowToCard = (row: any): EarningsCardData => ({
  id: row.creator_earning_id.toString(),
  name: row.shoot_name,
  company: row.client_name,
  status: row.status || row.status_label,
  date: formatDate(row.event_date, 'short'),
  address: row.event_location,
  time: `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
  totalCompensation: row.total_compensation,
  advancePaid: row.advance_paid,
  remainingBalance: row.remaining_balance,
});

const mapRowToShootData = (row: any) => {
  const items = row.compensation_items || [];
  return {
    shootName: row.shoot_name,
    clientName: row.client_name,
    status: row.status || row.status_label,
    date: formatDate(row.event_date, 'long'),
    location: row.event_location,
    timeWindow: `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
    breakdown: {
      baseShoot: items.find((i: any) => i.label === "Base Payout")?.amount || 0,
      editing: items.find((i: any) => i.label === "Editing Payout")?.amount || 0,
      travel: items.find((i: any) => i.label === "Travel Adjustment")?.amount || 0,
      bonus: items.find((i: any) => i.label === "Bonus/Other Adjustment")?.amount || 0,
    },
    advance: {
      amount: row.advance_paid,
      date: formatDate(row.due_date, 'long') || "N/A",
    },
    remainingBalance: row.remaining_balance,
    paymentProgress: row.payment_percent,
  };
};

export default function RequestsShootsPage() {
  const { isDark } = useResolvedTheme()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [range, setRange] = useState('all');
  const [status, setStatus] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [rawEarnings, setRawEarnings] = useState<any[]>([]);
  const [selectedShootData, setSelectedShootData] = useState<any>(null);

  const [selectedEarningId, setSelectedEarningId] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboard = await getCreatorEarningsDashboard();
        if (dashboard?.success && dashboard?.data) {
          setDashboardData(dashboard.data);
        }

        const earningsList = await getCreatorEarningsList({
          page: 1,
          limit: 10,
          status: "all",
          search: "",
        });

        if (earningsList?.success && earningsList?.data?.rows) {
          setRawEarnings(earningsList.data.rows);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- NEW: Filter Logic for the Earnings List ---
  const filteredEarnings = useMemo(() => {
    let filtered = [...rawEarnings];

    // Helper to safely parse dates without timezone shifting
    const parseDate = (dateStr: string) => {
      if (!dateStr) return new Date();
      return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    };

    // 1. Filter by Status
    if (status !== 'all') {
      filtered = filtered.filter(row => {
        const rowStatus = row.status_label || row.status;
        return rowStatus === status;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.shoot_name?.toLowerCase().includes(query) ||
        row.client_name?.toLowerCase().includes(query) ||
        row.event_location?.toLowerCase().includes(query)
      );
    }

    // 3. Filter by Range / Date
    if (range === 'week') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      filtered = filtered.filter(row => {
        const eventDate = parseDate(row.event_date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      });
    } else if (range === 'month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      filtered = filtered.filter(row => {
        const eventDate = parseDate(row.event_date);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      });
    } else if (range === 'custom' && selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filtered = filtered.filter(row => {
        const eventDate = parseDate(row.event_date);
        return eventDate >= startOfDay && eventDate <= endOfDay;
      });
    }

    return filtered;
  }, [rawEarnings, status, searchQuery, range, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }

  const handleViewEarnings = (row: any) => {
    setSelectedShootData(mapRowToShootData(row));
    setSelectedEarningId(row.creator_earning_id);
    setIsModalOpen(true);
  }

  const handleViewTimeline = async () => {
    if (!selectedEarningId) {
      console.error("No earning ID selected");
      return;
    }
    setIsModalOpen(false);

    try {
      const details = await getCreatorEarningDetails(selectedEarningId);

      if (details?.success && details?.data?.timeline) {
        const mappedTimeline: TimelineEvent[] = details.data.timeline.map((event: any) => ({
          id: event.timeline_event_id.toString(),
          title: event.label || event.event_type,
          description: event.sub_label || undefined,
          date: event.event_date ? formatDate(event.event_date, 'long') : undefined,
          isCompleted: event.is_completed,
        }));
        setTimelineData(mappedTimeline);
      } else {
        setTimelineData([]);
      }
    } catch (error) {
      console.error("Error fetching timeline details:", error);
      toast.error("Failed to load payout timeline");
      setTimelineData([]);
    } finally {
      setIsPaymentOpen(true);
    }
  }

  return (
    <div className="mx-auto space-y-4 lg:space-y-8 pb-12 text-white">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between lg:mb-6">
        <div>
          <h1 className="text-base lg:text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-xs lg:text-base text-white/60">Monitor upcoming earnings, track payment status, and view detailed compensation breakdowns for your shoots.</p>
        </div>
        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Pass selectedDate to the chart so it can handle the 'custom' filter */}
      <EarningsOverviewChart
        overviewData={dashboardData?.overview}
        chartData={dashboardData?.chart}
        selectedDate={selectedDate}
      />

      <div className={`transition-colors duration-300 border rounded-2xl w-full mt-3 lg:mt-5 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
        <div className="space-y-3 lg:space-y-6 p-3 lg:p-5">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
              <p className="font-medium text-sm lg:text-base">Earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={(val) => setRange(val)}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
            />
          </div>
        </div>
        <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />

        {/* Use filteredEarnings instead of rawEarnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 p-3 lg:p-5">
          {filteredEarnings.length > 0 ? (
            filteredEarnings.map((row) => (
              <EarningsCard
                key={`key_${row.creator_earning_id}`}
                data={mapRowToCard(row)}
                handleClick={() => handleViewEarnings(row)}
              />
            ))
          ) : (
            <p className="col-span-2 text-center text-white/50 py-10">No earnings found.</p>
          )}
        </div>
      </div>

      <EarningsBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shootData={selectedShootData}
        onDownloadProof={() => console.log("Downloading...")}
        onViewTimeline={() => handleViewTimeline()}
      />

      <PaymentTimelineModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        timelineData={timelineData}
      />
    </div>
  );
}