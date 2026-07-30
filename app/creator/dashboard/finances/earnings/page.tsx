"use client";
import React, { useState, useEffect, useMemo } from "react";

import { toast } from "sonner";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";
import EarningsOverviewChart from "@/components/creator-profile/EarningsOverviewChart";
import EarningsCard, { EarningsCardData } from "@/components/creator-profile/EarningsCard";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import EarningsBreakdownModal from "@/components/creator-profile/EarningsBreakdownModal";
import PaymentTimelineModal, { TimelineEvent } from "@/components/creator-profile/PaymentTimelineModal";
import { getCreatorEarningDetails, getCreatorEarningsDashboard, getCreatorEarningsList } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import Topbar from "@/components/admin/Topbar";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import RaiseDisputeModal from "@/components/creator-profile/RaiseDisputeModal";

const EARNINGS_PAGE_LIMIT = 10;

const handleRaiseDisputeSubmit = async (data: RaiseDisputeData) => {
      // TODO: Implement API call to submit dispute
      console.log("Submitting dispute:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, you would:
      // 1. Send data to your backend
      // 2. Get response with dispute ID
      // 3. Update the disputes list
      // 4. Show success modal (already handled in the component)
  };

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekDateRange = (date: Date) => {
  const startDate = new Date(date);
  const day = startDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  startDate.setDate(startDate.getDate() + mondayOffset);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start_date: toLocalDateString(startDate),
    end_date: toLocalDateString(endDate),
  };
};

const getMonthDateRange = (date: Date) => ({
  start_date: toLocalDateString(new Date(date.getFullYear(), date.getMonth(), 1)),
  end_date: toLocalDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});

const buildEarningsDateParams = (range: string, selectedDate: Date | null) => {
  const today = new Date();

  if (range === "week") {
    return { range, ...getWeekDateRange(today) };
  }

  if (range === "month") {
    return { range, ...getMonthDateRange(today) };
  }

  if (range === "custom" && selectedDate) {
    const date_on = toLocalDateString(selectedDate);
    return { range, date_on, start_date: date_on, end_date: date_on };
  }

  return { range: "all" };
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const pages: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let page = 1; page <= totalPages; page++) {
    if (page === 1 || page === totalPages || (page >= left && page < right)) {
      pages.push(page);
    } else if (page === left - 1 || page === right) {
      pages.push("...");
    }
  }

  return pages.filter((item, index, items) => item !== "..." || items[index - 1] !== "...");
};

interface EarningsPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface CompensationItem {
  label: string;
  amount: number;
}

interface CreatorEarningRow {
  creator_earning_id: number | string;
  shoot_name: string;
  client_name: string;
  status?: EarningsCardData["status"];
  status_label?: EarningsCardData["status"];
  event_date?: string;
  shoot_date?: string;
  start_date?: string;
  date?: string;
  event_location: string;
  start_time?: string;
  end_time?: string;
  event_start_time?: string;
  event_end_time?: string;
  total_compensation: number;
  advance_paid: number;
  paid_amount?: number;
  remaining_balance: number;
  compensation_items?: CompensationItem[];
  due_date?: string;
  payment_percent?: number;
}

interface CreatorEarningsDashboardData {
  overview?: {
    upcoming_earnings: number;
    pending_payments: number;
    paid_earnings: number;
    total_lifetime_earnings: number;
    total_received: number;
  };
  chart?: Array<{
    month: string;
    month_number: number;
    upcoming: number;
    pending: number;
    paid: number;
    total: number;
  }>;
}

interface PaymentProofData {
  id?: string | number;
  type?: string | null;
  method?: string | null;
  status?: string | null;
  amount?: number | string | null;
  paid_at?: string | null;
  receipt_url?: string | null;
  receipt_download_url?: string | null;
  proof_file_name?: string | null;
  notes?: string | null;
  transaction_reference?: string | null;
}

interface SelectedShootData {
  shootName: string;
  clientName: string;
  status: EarningsCardData["status"];
  date: string;
  location: string;
  timeWindow: string;
  breakdown: {
    baseShoot: number;
    editing: number;
    travel: number;
    bonus: number;
  };
  advance: {
    amount: number;
    date: string;
  };
  remainingBalance: number;
  paymentProgress: number;
}

interface TimelineApiEvent {
  timeline_event_id: number | string;
  label?: string;
  event_type: string;
  sub_label?: string;
  event_date?: string;
  is_completed: boolean;
}

interface PaymentReceiptItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: string;
  dateLabel: string;
  downloadUrl?: string | null;
  fileName?: string | null;
}

interface CreatorEarningDetailsData {
  timeline?: TimelineApiEvent[];
  payment_history?: PaymentProofData[];
}

const joinAssetUrl = (baseUrl: string | undefined, pathValue: string) => {
  const base = String(baseUrl || "").trim();
  if (!base) return "";
  return `${base.replace(/\/+$/, "")}/${pathValue.replace(/^\/+/, "")}`;
};

const getReceiptFileName = (value?: string | null) => {
  const raw = String(value || "").split("?")[0];
  return raw.split("/").filter(Boolean).pop() || "payment-proof.pdf";
};

const resolveReceiptUrl = (value?: string | null, fallbackFileName?: string | null) => {
  const raw = String(value || fallbackFileName || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalizedPath = raw.replace(/^beige\//i, "");
  return (
    joinAssetUrl(process.env.NEXT_PUBLIC_IMG_URL_CDN, normalizedPath) ||
    joinAssetUrl(process.env.NEXT_PUBLIC_IMG_URL, normalizedPath) ||
    raw
  );
};

const buildProofDownloadUrl = (url: string, filename: string) => {
  const params = new URLSearchParams({
    url,
    filename,
    disposition: "attachment",
  });
  return `/api/cp-compensation-receipt?${params.toString()}`;
};

const formatPaymentType = (value?: string | null) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("advance") || normalized.includes("partial")) return "Applied as partial payment";
  if (normalized.includes("final")) return "Final payment";
  return "Payment received";
};

const mapPaymentHistoryToReceipts = (paymentHistory: PaymentProofData[] = []): PaymentReceiptItem[] => (
  paymentHistory.map((payment, index) => {
    const rawProofUrl = payment.receipt_download_url || payment.receipt_url || null;
    const fileName = payment.proof_file_name || (rawProofUrl ? getReceiptFileName(rawProofUrl) : "payment-proof.pdf");
    const resolvedProofUrl = resolveReceiptUrl(rawProofUrl, fileName);
    const method = String(payment.method || "").trim();
    const reference = String(payment.transaction_reference || "").trim();
    const notes = String(payment.notes || "").trim();
    const subtitle = [
      method ? `via ${method}` : "",
      reference ? `ref ${reference}` : "",
      notes,
    ].filter(Boolean).join(" - ");

    return {
      id: String(payment.id || `payment-${index}`),
      title: formatPaymentType(payment.type),
      subtitle,
      amount: formatCurrency(Number(payment.amount || 0)),
      dateLabel: formatDate(payment.paid_at || undefined, "long") || "Date not available",
      downloadUrl: resolvedProofUrl ? buildProofDownloadUrl(resolvedProofUrl, fileName) : null,
      fileName,
    };
  })
);

const mapDetailsToPayoutTimeline = (detailsData: CreatorEarningDetailsData): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const financeApproval = (detailsData?.timeline || []).find((event: TimelineApiEvent) => (
    event.event_type === "awaiting_finance_approval"
  ));

  if (financeApproval) {
    events.push({
      id: String(financeApproval.timeline_event_id || "finance-approval"),
      title: financeApproval.label || "Finance Approval",
      description: financeApproval.sub_label || undefined,
      date: financeApproval.event_date ? formatDate(financeApproval.event_date, "long") : undefined,
      isCompleted: financeApproval.is_completed,
    });
  }

  const paymentEvents = (detailsData?.payment_history || []).map((payment: PaymentProofData, index: number) => {
    const method = String(payment.method || "").trim();
    const notes = String(payment.notes || "").trim();
    const description = [
      `${formatCurrency(Number(payment.amount || 0))} paid`,
      method ? `via ${method}` : "",
      notes,
    ].filter(Boolean).join(" - ");

    return {
      id: String(payment.id || `payment-${index}`),
      title: formatPaymentType(payment.type),
      description,
      date: payment.paid_at ? formatDate(payment.paid_at, "long") : undefined,
      isCompleted: true,
    };
  });

  return [...events, ...paymentEvents];
};

const getEarningStatus = (row: CreatorEarningRow): EarningsCardData["status"] =>
  row.status || row.status_label || "Unknown";

const getRowDate = (row: CreatorEarningRow) =>
  row.event_date || row.shoot_date || row.start_date || row.date || "";

const getRowStartTime = (row: CreatorEarningRow) =>
  row.start_time || row.event_start_time || "";

const getRowEndTime = (row: CreatorEarningRow) =>
  row.end_time || row.event_end_time || "";

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const formatTimeRange = (startTime?: string, endTime?: string) => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (start && end) return `${start} - ${end}`;
  return start || end || "";
};

const formatDate = (dateStr?: string, style: 'short' | 'long' = 'short') => {
  if (!dateStr) return "";
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return "";
  if (style === 'long') {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapRowToCard = (row: CreatorEarningRow): EarningsCardData => ({
  id: row.creator_earning_id.toString(),
  name: row.shoot_name,
  company: row.client_name,
  status: getEarningStatus(row),
  date: formatDate(getRowDate(row), 'short'),
  address: row.event_location,
  time: formatTimeRange(getRowStartTime(row), getRowEndTime(row)),
  totalCompensation: row.total_compensation,
  advancePaid: row.paid_amount ?? row.advance_paid,
  remainingBalance: row.remaining_balance,
});

const mapRowToShootData = (row: CreatorEarningRow): SelectedShootData => {
  const items = row.compensation_items || [];
  return {
    shootName: row.shoot_name,
    clientName: row.client_name,
    status: getEarningStatus(row),
    date: formatDate(getRowDate(row), 'long'),
    location: row.event_location,
    timeWindow: formatTimeRange(getRowStartTime(row), getRowEndTime(row)),
    breakdown: {
      baseShoot: items.find((i) => i.label === "Base Payout")?.amount || 0,
      editing: items.find((i) => i.label === "Editing Payout")?.amount || 0,
      travel: items.find((i) => i.label === "Travel Adjustment")?.amount || 0,
      bonus: items.find((i) => i.label === "Bonus/Other Adjustment")?.amount || 0,
    },
    advance: {
      amount: row.paid_amount ?? row.advance_paid,
      date: formatDate(row.due_date, 'long') || "N/A",
    },
    remainingBalance: row.remaining_balance,
    paymentProgress: row.payment_percent || 0,
  };
};

export default function RequestsShootsPage() {
  const { isDark } = useResolvedTheme()
  const pathname = usePathname();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [range, setRange] = useState('all');
  const [status] = useState('all');

  const [isRaiseDisputeOpen, setIsRaiseDisputeOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEarningsLoading, setIsEarningsLoading] = useState(true);
  const [pagination, setPagination] = useState<EarningsPagination>({
    page: 1,
    limit: EARNINGS_PAGE_LIMIT,
    total: 0,
    total_pages: 1,
  });

  const [dashboardData, setDashboardData] = useState<CreatorEarningsDashboardData | null>(null);
  const [rawEarnings, setRawEarnings] = useState<CreatorEarningRow[]>([]);
  const [selectedShootData, setSelectedShootData] = useState<SelectedShootData | null>(null);

  const [selectedEarningId, setSelectedEarningId] = useState<number | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceiptItem[]>([]);

  const earningsDateParams = useMemo(
    () => buildEarningsDateParams(range, selectedDate),
    [range, selectedDate]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboard = await getCreatorEarningsDashboard();
        if (dashboard?.success && dashboard?.data) {
          setDashboardData(dashboard.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      setIsEarningsLoading(true);
      try {
        const earningsList = await getCreatorEarningsList({
          page: currentPage,
          limit: EARNINGS_PAGE_LIMIT,
          status,
          search: debouncedSearchQuery,
          ...earningsDateParams,
        });

        const rows = earningsList?.data?.rows || [];
        const nextPagination = earningsList?.data?.pagination;

        setRawEarnings(rows);
        setPagination({
          page: Number(nextPagination?.page || currentPage),
          limit: Number(nextPagination?.limit || EARNINGS_PAGE_LIMIT),
          total: Number(nextPagination?.total || rows.length),
          total_pages: Math.max(1, Number(nextPagination?.total_pages || 1)),
        });
      } catch (error) {
        console.error("Error fetching earnings:", error);
        setRawEarnings([]);
        setPagination({
          page: currentPage,
          limit: EARNINGS_PAGE_LIMIT,
          total: 0,
          total_pages: 1,
        });
      } finally {
        setIsEarningsLoading(false);
      }
    };

    fetchEarnings();
  }, [currentPage, debouncedSearchQuery, status, earningsDateParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, status, range, selectedDate]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setRange(date ? "custom" : "all");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }

  const handleViewEarnings = async (row: CreatorEarningRow) => {
    setSelectedShootData(mapRowToShootData(row));
    setSelectedEarningId(Number(row.creator_earning_id));
    setPaymentReceipts([]);
    setIsModalOpen(true);

    try {
      const details = await getCreatorEarningDetails(Number(row.creator_earning_id));
      if (details?.success && details?.data?.payment_history) {
        setPaymentReceipts(mapPaymentHistoryToReceipts(details.data.payment_history));
      }
    } catch (error) {
      console.error("Error fetching payment receipts:", error);
    }
  }

  const totalPages = Math.max(1, pagination.total_pages);
  const safeCurrentPage = Math.min(Math.max(pagination.page || currentPage, 1), totalPages);
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);
  const showingFrom = pagination.total > 0 ? ((safeCurrentPage - 1) * pagination.limit) + 1 : 0;
  const showingTo = Math.min(safeCurrentPage * pagination.limit, pagination.total);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  };

  const handleViewTimeline = async () => {
    if (!selectedEarningId) {
      console.error("No earning ID selected");
      return;
    }
    setIsModalOpen(false);

    try {
      const details = await getCreatorEarningDetails(selectedEarningId);

      if (details?.success && details?.data) {
        setTimelineData(mapDetailsToPayoutTimeline(details.data));
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

  const handleDownloadProof = async () => {
    if (!selectedEarningId) {
      toast.error("Select an earning first");
      return;
    }

    try {
      const details = await getCreatorEarningDetails(selectedEarningId);
      const receipts = mapPaymentHistoryToReceipts(details?.data?.payment_history || []);
      setPaymentReceipts(receipts);
      const latestReceipt = receipts.find((receipt) => receipt.downloadUrl);

      if (!latestReceipt?.downloadUrl) {
        toast.error("No payment proof is attached for this earning yet");
        return;
      }

      if (receipts.filter((receipt) => receipt.downloadUrl).length > 1) {
        toast.message("Multiple receipts found. Use the receipt list to download each payment proof.");
      }

      window.open(latestReceipt.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error downloading payment proof:", error);
      toast.error("Failed to download payment proof");
    }
  };

  return (
    <>
    <Topbar pathname={pathname}
     actions={
      <Button
          onClick={() => setIsRaiseDisputeOpen(true)}
          className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
      >
          Raise New Dispute
      </Button>
      } />
    <div 
  className={`mx-4 lg:mx-8 mt-6 mb-20 rounded-[40px] transition-all duration-700 overflow-hidden
    ${isDark 
      ? `bg-[#0A0A0A] 
         border border-[#E8D1AB]/30 
         shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]` 
      : "bg-white border-zinc-200 shadow-sm"
    }`}
>
  {/* Inner Padding - p-10 lg:p-16 ensures cards don't hit the 40px rounded corners */}
  <div className="p-8 lg:p-16 space-y-8 lg:space-y-12 pb-24">
    <div className="mx-auto w-full max-w-[1800px] space-y-4 lg:space-y-8">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between lg:mb-6">
        <div>
          <h1 className="text-base lg:text-3xl font-bold">Earnings Dashboard</h1>
          <p className="text-xs lg:text-base text-white/60">Monitor upcoming earnings, track payment status, and view detailed compensation breakdowns for your shoots.</p>
        </div>
        {/* <SortDateButton selectedDate={selectedDate} onDateChange={handleDateChange} /> */}
      </div>

      <EarningsOverviewChart
        overviewData={dashboardData?.overview}
        chartData={dashboardData?.chart}
      />

      <div className={`transition-colors duration-300 border rounded-2xl w-full mt-3 lg:mt-5 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
        <div className="space-y-3 lg:space-y-6 p-3 lg:p-5">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
              <p className="font-medium text-sm lg:text-base">Earnings</p>
            </div>
            <div className="flex items-center gap-3">
              {/* <Select value={status} onValueChange={(val) => { setStatus(val); setCurrentPage(1); }}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                </SelectContent>
              </Select> */}
              {/* <Select value={range} onValueChange={(val) => { setRange(val); setCurrentPage(1); }}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                </SelectContent>
              </Select> */}
            </div>
          </div>
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
            />
          </div>
        </div>
        <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 p-3 lg:p-5">
          {isEarningsLoading ? (
            <div className="col-span-full flex items-center justify-center py-14">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]" />
            </div>
          ) : rawEarnings.length > 0 ? (
            rawEarnings.map((row) => (
              <EarningsCard
                key={`key_${row.creator_earning_id}`}
                data={mapRowToCard(row)}
                handleClick={() => handleViewEarnings(row)}
                onRaiseDispute={(e) => {
                  e.stopPropagation(); // Prevents triggering any card-level clicks
                  setSelectedEarningId(Number(row.creator_earning_id));
                  setIsRaiseDisputeOpen(true);
                }}
              />
            ))
          ) : (
            <p className="col-span-2 text-center text-white/50 py-10">No earnings found.</p>
          )}
        </div>

        {!isEarningsLoading && pagination.total > EARNINGS_PAGE_LIMIT && (
          <div className={`p-4 lg:p-6 border-t w-full overflow-hidden transition-colors duration-300 min-w-0 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between w-full overflow-hidden min-w-0">
              <div className={`hidden lg:block text-sm truncate max-w-xs shrink ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
                Showing {showingFrom} to {showingTo} of {pagination.total} entries
              </div>

              <div className="flex gap-2 items-center justify-center sm:justify-end w-full max-w-full min-w-0 overflow-hidden">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark
                    ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                    : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                    }`}
                >
                  <span className="hidden lg:inline">Previous</span>
                  <ChevronLeft className="w-4 h-4 lg:hidden" />
                </button>

                <div className="flex-1 sm:flex-none flex gap-1 items-center justify-center overflow-x-auto no-scrollbar min-w-0 px-1 py-0.5">
                  {paginationItems.map((page, index) => (
                    page === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className={`px-1 text-center text-xs font-semibold select-none shrink-0 min-w-[16px] ${isDark ? "text-white/30" : "text-[#999]"}`}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all shrink-0 ${safeCurrentPage === page
                          ? (isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black")
                          : (isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100")
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark
                    ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                    : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                    }`}
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight className="w-4 h-4 lg:hidden" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <EarningsBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shootData={selectedShootData}
        paymentReceipts={paymentReceipts}
        onDownloadProof={handleDownloadProof}
        onViewTimeline={() => handleViewTimeline()}
      />

      <PaymentTimelineModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        timelineData={timelineData}
      />
    </div>
    </div>
    </div>
      <RaiseDisputeModal
        open={isRaiseDisputeOpen}
        onOpenChange={setIsRaiseDisputeOpen}
        onSubmit={handleRaiseDisputeSubmit}
      />
    </>
  );
}