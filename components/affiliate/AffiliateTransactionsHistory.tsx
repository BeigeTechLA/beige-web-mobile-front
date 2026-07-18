"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreVertical,
  Download,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { SortDateButton } from "@/components/admin/SortDateButton";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import AffiliateDisputeDetailsModal, {
  type AffiliateDisputeDetailsRecord,
} from "@/components/affiliate/AffiliateDisputeDetailsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentStatus = "Paid" | "Dispute Open" | "Pending" | "Refunded" | "In-Progress" | "Resolved";

type PaymentRow = {
  id: string;
  bookingId: string;
  shootType: string;
  totalAmount: string;
  breakdown: {
    baseCost: string;
    addOns: string;
    taxes: string;
    discounts: string;
  };
  invoiceLabel: string;
  rawDateTime: string;
  paymentMethod: string;
  status: PaymentStatus;
  actionType: "menu" | "view";
};

type AffiliateTransactionsHistoryProps = {
  onRaiseDispute?: (bookingId?: string) => void;
};

const paymentRows: PaymentRow[] = [
  {
    id: "bk-001-1",
    bookingId: "BK-001",
    shootType: "Wedding Videography",
    totalAmount: "$2,500",
    breakdown: {
      baseCost: "$2,000.00",
      addOns: "$300.00",
      taxes: "$250.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Stripe",
    status: "Paid",
    actionType: "menu",
  },
  {
    id: "bk-001-2",
    bookingId: "BK-001",
    shootType: "Podcast Shoot",
    totalAmount: "$8,000",
    breakdown: {
      baseCost: "$7,200.00",
      addOns: "$500.00",
      taxes: "$350.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Bank Transfer",
    status: "Dispute Open",
    actionType: "view",
  },
  {
    id: "bk-001-3",
    bookingId: "BK-001",
    shootType: "Music Video",
    totalAmount: "$4,000",
    breakdown: {
      baseCost: "$3,300.00",
      addOns: "$400.00",
      taxes: "$350.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "02 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Stripe",
    status: "Pending",
    actionType: "menu",
  },
  {
    id: "bk-001-4",
    bookingId: "BK-001",
    shootType: "Podcast Shoot",
    totalAmount: "$8,000",
    breakdown: {
      baseCost: "$7,150.00",
      addOns: "$650.00",
      taxes: "$300.00",
      discounts: "-$100.00",
    },
    invoiceLabel: "02 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Bank Transfer",
    status: "Refunded",
    actionType: "menu",
  },
  {
    id: "bk-001-5",
    bookingId: "BK-001",
    shootType: "Corporate Photography",
    totalAmount: "$12,000",
    breakdown: {
      baseCost: "$10,900.00",
      addOns: "$850.00",
      taxes: "$350.00",
      discounts: "-$100.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Bank Transfer",
    status: "In-Progress",
    actionType: "view",
  },
  {
    id: "bk-001-6",
    bookingId: "BK-001",
    shootType: "Podcast Shoot",
    totalAmount: "$8,000",
    breakdown: {
      baseCost: "$7,200.00",
      addOns: "$400.00",
      taxes: "$450.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Stripe",
    status: "Resolved",
    actionType: "view",
  },
  {
    id: "bk-001-7",
    bookingId: "BK-001",
    shootType: "Music Video",
    totalAmount: "$10,000",
    breakdown: {
      baseCost: "$8,900.00",
      addOns: "$1,000.00",
      taxes: "$150.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "02 Invoices",
    rawDateTime: "2026-04-15T11:25:00",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    actionType: "menu",
  },
  {
    id: "bk-002-1",
    bookingId: "BK-002",
    shootType: "Event Coverage",
    totalAmount: "$6,500",
    breakdown: {
      baseCost: "$5,500.00",
      addOns: "$600.00",
      taxes: "$450.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-05-02T09:10:00",
    paymentMethod: "Stripe",
    status: "Paid",
    actionType: "menu",
  },
  {
    id: "bk-002-2",
    bookingId: "BK-002",
    shootType: "Brand Film",
    totalAmount: "$14,200",
    breakdown: {
      baseCost: "$12,500.00",
      addOns: "$1,000.00",
      taxes: "$750.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "03 Invoices",
    rawDateTime: "2026-05-02T09:10:00",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    actionType: "view",
  },
  {
    id: "bk-002-3",
    bookingId: "BK-003",
    shootType: "Product Shoot",
    totalAmount: "$3,750",
    breakdown: {
      baseCost: "$3,100.00",
      addOns: "$400.00",
      taxes: "$300.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-05-06T14:45:00",
    paymentMethod: "Stripe",
    status: "Resolved",
    actionType: "menu",
  },
  {
    id: "bk-002-4",
    bookingId: "BK-003",
    shootType: "Corporate Headshots",
    totalAmount: "$2,100",
    breakdown: {
      baseCost: "$1,800.00",
      addOns: "$200.00",
      taxes: "$150.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-05-06T14:45:00",
    paymentMethod: "Manual",
    status: "Refunded",
    actionType: "menu",
  },
  {
    id: "bk-003-1",
    bookingId: "BK-004",
    shootType: "Fashion Shoot",
    totalAmount: "$9,000",
    breakdown: {
      baseCost: "$7,800.00",
      addOns: "$900.00",
      taxes: "$350.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "02 Invoices",
    rawDateTime: "2026-05-10T12:20:00",
    paymentMethod: "Stripe",
    status: "Dispute Open",
    actionType: "view",
  },
  {
    id: "bk-003-2",
    bookingId: "BK-004",
    shootType: "Podcast Shoot",
    totalAmount: "$4,800",
    breakdown: {
      baseCost: "$4,000.00",
      addOns: "$500.00",
      taxes: "$350.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "01 Invoices",
    rawDateTime: "2026-05-10T12:20:00",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    actionType: "menu",
  },
  {
    id: "bk-003-3",
    bookingId: "BK-005",
    shootType: "Music Video",
    totalAmount: "$11,500",
    breakdown: {
      baseCost: "$10,000.00",
      addOns: "$1,000.00",
      taxes: "$550.00",
      discounts: "-$50.00",
    },
    invoiceLabel: "02 Invoices",
    rawDateTime: "2026-05-14T16:05:00",
    paymentMethod: "Stripe",
    status: "In-Progress",
    actionType: "view",
  },
];

const statusStyles: Record<PaymentStatus, string> = {
  Paid: "bg-[#DDF9E7] text-[#178B4A] border-[#DDF9E7]",
  "Dispute Open": "bg-[#FCE8E4] text-[#D6453D] border-[#FCE8E4]",
  Pending: "bg-[#FFF2CF] text-[#B77500] border-[#FFF2CF]",
  Refunded: "bg-[#2C2C2C] text-[#8B8B8B] border-[#3A3A3A]",
  "In-Progress": "bg-[#D7E5FF] text-[#2457D3] border-[#D7E5FF]",
  Resolved: "bg-[#DDFCE6] text-[#159257] border-[#DDFCE6]",
};

const statusOptions = ["All", "Paid", "Dispute Open", "Pending", "Refunded", "In-Progress", "Resolved"] as const;
const monthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"] as const;
const typeOptions = ["All", "Stripe", "Bank Transfer", "Manual"] as const;

const formatDate = (value: string) => {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return { date: "N/A", time: "" };
  return {
    date: format(parsed, "MMMM d, yyyy"),
    time: format(parsed, "h:mm a"),
  };
};

const matchesSearch = (row: PaymentRow, query: string) => {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return [
    row.bookingId,
    row.shootType,
    row.totalAmount,
    row.invoiceLabel,
    row.paymentMethod,
    row.status,
  ].some((value) => value.toLowerCase().includes(normalized));
};

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "..."> => {
  const range: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i);
    } else if (i === left - 1 || i === right) {
      range.push("...");
    }
  }

  return range.filter((value, index, arr) => value !== "..." || arr[index - 1] !== "...");
};

const buildDisputeRecord = (row: PaymentRow): AffiliateDisputeDetailsRecord => {
  const suffix = row.bookingId.replace(/^BK-/, "").padStart(3, "0");
  const parsedDate = parseISO(row.rawDateTime);
  const createdAt = Number.isNaN(parsedDate.getTime())
    ? "20-04-2026"
    : format(parsedDate, "dd-MM-yyyy");

  return {
    id: `DIS-${suffix}`,
    bookingId: row.bookingId,
    invoiceId: `INV-${suffix}-B`,
    raisedBy: row.status === "Dispute Open" ? "Emily Johnson" : "Support Team",
    raisedRole: row.status === "Dispute Open" ? "Client" : "Admin",
    createdAt,
    status: row.status === "Resolved" ? "Resolved" : row.status === "Dispute Open" ? "Dispute - Open" : "Under Review",
    issueType: row.status === "Dispute Open" ? "Quality Issue" : "Payment Review",
    description:
      row.status === "Dispute Open"
        ? "The delivered work does not match the agreed quality standards."
        : "This payment is being reviewed by the support team.",
    timeline: [
      {
        title: "Dispute Created",
        by: row.status === "Dispute Open" ? "Emily Johnson" : "Support Team",
        at: `${createdAt} 10:30`,
        tone: "warning",
      },
      {
        title: row.status === "Resolved" ? "Resolved" : "Under Review",
        by: "Support Team",
        at: `${createdAt} 14:20`,
        tone: row.status === "Resolved" ? "resolved" : "review",
      },
    ],
    attachments: [
      {
        name: "contract.pdf",
        size: "245 KB",
        uploadedBy: "Sarah Chen",
        uploadedAt: createdAt,
      },
      {
        name: "sample-photos.zip",
        size: "12.5 MB",
        uploadedBy: "Sarah Chen",
        uploadedAt: createdAt,
      },
    ],
    comments: [
      {
        author: "Emily Johnson",
        role: "Client",
        message: "The photos are blurry and not as discussed.",
        at: `${createdAt}, 10:35`,
      },
      {
        author: "Support Agent",
        role: "Admin",
        message: "We are reviewing the original contract and deliverables.",
        at: `${createdAt}, 15:35`,
      },
    ],
  };
};

export default function AffiliateTransactionsHistory({
  onRaiseDispute,
}: AffiliateTransactionsHistoryProps) {
  const { isDark } = useResolvedTheme();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [monthFilter, setMonthFilter] = useState<(typeof monthOptions)[number]>("Month");
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<PaymentRow | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<AffiliateDisputeDetailsRecord | null>(null);
  const [openMenuState, setOpenMenuState] = useState<{ rowId: string; direction: "up" | "down" } | null>(null);
  const itemsPerPage = 10;

  const filteredRows = useMemo(() => {
    return paymentRows.filter((row) => {
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesType = typeFilter === "All" || row.paymentMethod === typeFilter;
      return matchesStatus && matchesType && matchesSearch(row, searchValue);
    });
  }, [searchValue, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, monthFilter, typeFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuState(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const closeBreakdown = () => setSelectedRow(null);
  const closeDispute = () => setSelectedDispute(null);

  const openRowMenu = (event: React.MouseEvent, rowId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 180;
    const viewportPadding = 12;
    const shouldOpenUp = rect.bottom + menuHeight + viewportPadding > window.innerHeight;

    setOpenMenuState((current) =>
      current?.rowId === rowId
        ? null
        : { rowId, direction: shouldOpenUp ? "up" : "down" }
    );
  };

  const handleMenuAction = (event: React.MouseEvent, row: PaymentRow, action: "details" | "invoice" | "download" | "dispute") => {
    event.stopPropagation();
    setOpenMenuState(null);

    if (action === "details") {
      setSelectedDispute(buildDisputeRecord(row));
      return;
    }

    if (action === "dispute") {
      onRaiseDispute?.(row.bookingId);
      return;
    }

    // Static UI only: these actions intentionally do not navigate anywhere yet.
    console.log(`${action} clicked for ${row.id}`);
  };

  const openDisputeDetails = (event: React.MouseEvent, row: PaymentRow) => {
    event.stopPropagation();
    setSelectedDispute(buildDisputeRecord(row));
  };

  return (
    <div
      className="space-y-4 overflow-hidden p-4 lg:space-y-8 lg:px-10 lg:py-9"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={`mb-1 text-lg font-semibold lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-[#111]"}`}>
            Payments Management
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
            Manage payments, invoices, and resolve disputes efficiently
          </p>
        </div>

        <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <section className={`overflow-hidden rounded-[22px] border transition-colors ${isDark ? "border-[#2B2B2B] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
        <div className={`border-b p-4 lg:p-5 ${isDark ? "border-[#262626]" : "border-[#E8E8E8]"}`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
                <h2 className={`text-sm font-medium lg:text-[17px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                  Payment History
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger
                    className={`h-8 w-[88px] rounded-full border text-[10px] shadow-none focus:ring-0 lg:w-[90px] ${isDark
                      ? "border-[#343434] bg-[#141414] text-white/75"
                      : "border-[#E4E4E4] bg-white text-[#333]"
                      }`}
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "border-[#343434] bg-[#111111] text-white" : "border-[#E4E4E4] bg-white text-[#111]"}>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={monthFilter} onValueChange={(value) => setMonthFilter(value as typeof monthFilter)}>
                  <SelectTrigger
                    className={`h-8 w-[78px] rounded-full border text-[10px] shadow-none focus:ring-0 lg:w-[80px] ${isDark
                      ? "border-[#343434] bg-[#141414] text-white/75"
                      : "border-[#E4E4E4] bg-white text-[#333]"
                      }`}
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "border-[#343434] bg-[#111111] text-white" : "border-[#E4E4E4] bg-white text-[#111]"}>
                    {monthOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                  <SelectTrigger
                    className={`h-8 w-[68px] rounded-full border text-[10px] shadow-none focus:ring-0 lg:w-[70px] ${isDark
                      ? "border-[#343434] bg-[#141414] text-white/75"
                      : "border-[#E4E4E4] bg-white text-[#333]"
                      }`}
                  >
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "border-[#343434] bg-[#111111] text-white" : "border-[#E4E4E4] bg-white text-[#111]"}>
                    {typeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <Search className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-[#A0A0A0]"}`} size={16} />
              <input
                type="text"
                placeholder="Search by Shoot ID, Name..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className={`h-10 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors ${isDark
                  ? "border-[#303030] bg-[#202020] text-white placeholder:text-white/30 focus:border-[#E8D1AB]"
                  : "border-[#E5E5E5] bg-white text-[#111] placeholder:text-[#999] focus:border-[#E8D1AB]"
                  }`}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className={`border-b text-sm ${isDark ? "border-[#262626] text-[#E8D1AB]" : "border-[#E8E8E8] bg-[#FFFCF6] text-[#111]"}`}>
                <th className="w-[11%] px-4 py-5 font-medium">Booking ID</th>
                <th className="w-[19%] px-4 py-5 font-medium">Shoot Type</th>
                <th className="w-[13%] px-4 py-5 font-medium">Total Amount</th>
                <th className="w-[13%] px-4 py-5 font-medium">Invoices</th>
                <th className="w-[14%] px-4 py-5 font-medium">Date & Time</th>
                <th className="w-[13%] px-4 py-5 font-medium">Payment Method</th>
                <th className="w-[12%] px-4 py-5 font-medium">Status</th>
                <th className="w-[5%] px-4 py-5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
                {paginatedRows.map((row) => {
                  const { date, time } = formatDate(row.rawDateTime);

                return (
                  <tr
                    key={row.id}
                    className={`border-b transition-colors ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F3F3F3] hover:bg-[#FAFAFA]"}`}
                  >
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/85" : "text-[#171717]"}`}>
                      {row.bookingId}
                    </td>
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/85" : "text-[#171717]"}`}>
                      {row.shootType}
                    </td>
                    <td className={`px-4 py-5 text-sm font-medium ${isDark ? "text-white" : "text-[#111]"}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="underline decoration-white/30 underline-offset-4 transition-opacity hover:opacity-80"
                      >
                        {row.totalAmount}
                      </button>
                    </td>
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/75" : "text-[#444]"}`}>
                      <span className={`inline-flex rounded-full px-3 py-2 text-xs font-medium ${isDark ? "bg-[#2D2A25] text-[#D3B98A]" : "bg-[#F4F0E7] text-[#8B6B36]"}`}>
                        {row.invoiceLabel}
                      </span>
                    </td>
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/85" : "text-[#171717]"}`}>
                      <div className="leading-tight">
                        <div>{date}</div>
                        <div className={isDark ? "text-white/60" : "text-[#666]"}>
                          {time}
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/85" : "text-[#171717]"}`}>
                      {row.paymentMethod}
                    </td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex min-w-[88px] justify-center rounded-full border px-3 py-2 text-sm font-medium ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="relative inline-flex">
                        {row.actionType === "view" ? (
                          <button
                            type="button"
                            onClick={(event) => openDisputeDetails(event, row)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/5" : "text-[#171717] hover:bg-black/5"}`}
                            aria-label={`View dispute details for ${row.bookingId}`}
                          >
                            <Eye size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(event) => openRowMenu(event, row.id)}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/5" : "text-[#171717] hover:bg-black/5"}`}
                              aria-label={`Open actions for ${row.bookingId}`}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openMenuState?.rowId === row.id && (
                              <div
                                className={`absolute right-0 z-20 w-[210px] overflow-hidden rounded-[16px] border shadow-[0_14px_24px_rgba(0,0,0,0.32)] ${openMenuState.direction === "up" ? "bottom-11" : "top-11"} ${isDark ? "border-white/15 bg-[#101010]" : "border-black/10 bg-[#111]"}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "details")}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-white transition-colors hover:bg-white/5"
                                >
                                  <FileText size={16} className="shrink-0" />
                                  <span className="font-medium">View Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "invoice")}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-white transition-colors hover:bg-white/5"
                                >
                                  <FileText size={16} className="shrink-0" />
                                  <span className="font-medium">View Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "download")}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-white transition-colors hover:bg-white/5"
                                >
                                  <Download size={16} className="shrink-0" />
                                  <span className="font-medium">Download Invoice</span>
                                </button>
                                <div className="h-px bg-white/10" />
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "dispute")}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-[#FF3B3B] transition-colors hover:bg-white/5"
                                >
                                  <AlertCircle size={16} className="shrink-0" />
                                  <span className="font-medium">Raise Dispute</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {paginatedRows.map((row) => {
            const { date, time } = formatDate(row.rawDateTime);
            return (
              <div key={row.id} className={`border-b p-4 ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#111]"}`}>{row.shootType}</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-[#666]"}`}>{row.bookingId}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[row.status]}`}>
                    {row.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Amount</p>
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className={`mt-1 font-medium underline decoration-white/30 underline-offset-4 transition-opacity hover:opacity-80 ${isDark ? "text-white" : "text-[#111]"}`}
                      >
                        {row.totalAmount}
                      </button>
                    </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Invoices</p>
                    <p className={`mt-1 font-medium ${isDark ? "text-white" : "text-[#111]"}`}>{row.invoiceLabel}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Date</p>
                    <p className={`mt-1 ${isDark ? "text-white/75" : "text-[#171717]"}`}>{date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Time</p>
                    <p className={`mt-1 ${isDark ? "text-white/75" : "text-[#171717]"}`}>{time}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Method</p>
                    <p className={`mt-1 ${isDark ? "text-white/75" : "text-[#171717]"}`}>{row.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/35" : "text-[#777]"}`}>Action</p>
                    <div className="relative mt-1 flex justify-end">
                      {row.actionType === "view" ? (
                        <button
                          type="button"
                          onClick={(event) => openDisputeDetails(event, row)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/70 hover:bg-white/5" : "text-[#444] hover:bg-black/5"}`}
                          aria-label={`View dispute details for ${row.bookingId}`}
                        >
                          <Eye size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(event) => openRowMenu(event, row.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/70 hover:bg-white/5" : "text-[#444] hover:bg-black/5"}`}
                            aria-label={`Open actions for ${row.bookingId}`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuState?.rowId === row.id && (
                            <div
                              className={`absolute right-0 z-20 w-[210px] overflow-hidden rounded-[16px] border shadow-[0_14px_24px_rgba(0,0,0,0.32)] ${openMenuState.direction === "up" ? "bottom-10" : "top-10"} ${isDark ? "border-white/15 bg-[#101010]" : "border-black/10 bg-[#111]"}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(event) => handleMenuAction(event, row, "details")}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
                              >
                                <FileText size={16} className="shrink-0" />
                                <span className="font-medium">View Details</span>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => handleMenuAction(event, row, "invoice")}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
                              >
                                <FileText size={16} className="shrink-0" />
                                <span className="font-medium">View Invoice</span>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => handleMenuAction(event, row, "download")}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
                              >
                                <Download size={16} className="shrink-0" />
                                <span className="font-medium">Download Invoice</span>
                              </button>
                              <div className="h-px bg-white/10" />
                              <button
                                type="button"
                                onClick={(event) => handleMenuAction(event, row, "dispute")}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-[#FF3B3B] transition-colors hover:bg-white/5"
                              >
                                <AlertCircle size={16} className="shrink-0" />
                                <span className="font-medium">Raise Dispute</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`flex flex-col gap-4 border-t p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6 ${isDark ? "border-[#262626]" : "border-[#E8E8E8]"}`}>
          <p className={`text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}>
            Showing {filteredRows.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRows.length)} of {filteredRows.length}
          </p>

          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={safePage === 1}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#343434] bg-[#141414] text-white/60" : "border-[#E5E5E5] bg-white text-[#333]"}`}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span key={`dots-${index}`} className={`px-2 text-sm ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-lg text-sm ${safePage === page
                      ? "border border-[#E8D1AB] bg-[#E8D1AB] font-medium text-black"
                      : isDark
                        ? "text-white/55 hover:bg-white/5"
                        : "text-[#666] hover:bg-black/5"
                      }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={safePage === totalPages}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-[#343434] bg-[#141414] text-white/60" : "border-[#E5E5E5] bg-white text-[#333]"}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {selectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-md"
          onClick={closeBreakdown}
          role="presentation"
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] border border-white/10 bg-[#0B0B0B] text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cost-breakdown-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 id="cost-breakdown-title" className="text-[22px] font-semibold">
                Cost Breakdown
              </h3>
              <button
                type="button"
                onClick={closeBreakdown}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
                aria-label="Close cost breakdown"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Base Cost</span>
                <span className="text-white">{selectedRow.breakdown.baseCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Add-ons</span>
                <span className="text-white">{selectedRow.breakdown.addOns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxes</span>
                <span className="text-white">{selectedRow.breakdown.taxes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discounts</span>
                <span className="text-[#7CFC00]">{selectedRow.breakdown.discounts}</span>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center justify-between rounded-xl bg-[#E8D1AB] px-4 py-3 text-[#111]">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="text-base font-semibold">{selectedRow.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AffiliateDisputeDetailsModal
        isOpen={Boolean(selectedDispute)}
        onClose={closeDispute}
        dispute={selectedDispute}
      />

    </div>
  );
}
