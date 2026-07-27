"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
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
import {
  financeTransactionsApi,
  type ClientFinanceDisputeDetailsApiRow,
  type ClientFinancePaymentApiRow,
  type FinanceTransactionApiRow,
} from "@/lib/api/financeTransactions";

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
  invoiceUrl?: string | null;
  invoiceDownloadUrl?: string | null;
  canRaiseDispute?: boolean;
  transactionDetails?: TransactionDetail[];
  dispute?: ClientFinancePaymentApiRow["dispute"];
};

type AffiliateTransactionsHistoryProps = {
  onRaiseDispute?: (bookingId?: string) => void;
  refreshKey?: number;
};

type TransactionDetail = {
  id: string;
  transactionId: string;
  date: string;
  amount: string;
  method: string;
  status: string;
  receiptUrl?: string | null;
  note?: string;
};

const formatShootId = (value: number | string | null | undefined) => {
  const normalized = String(value || "").replace(/^BK-/i, "").replace(/^#/, "").trim();
  return normalized ? `#${normalized}` : "#N/A";
};

const buildParentInvoiceUrl = (bookingId: string) => {
  const normalized = String(bookingId || "").replace(/^#/, "").trim();
  return normalized ? `/beige_invoice/${encodeURIComponent(normalized)}?manual=1&t=${Date.now()}` : null;
};

const getActorRole = (
  user: { id?: number | string | null; role?: string | null; user_type?: number | string | null } | null | undefined,
  dispute?: ClientFinanceDisputeDetailsApiRow | null
) => {
  const userId = String(user?.id || "");
  const raisedById = String(dispute?.raised_by?.id || "");
  if (userId && raisedById && userId === raisedById) return String(dispute?.raised_by?.type || "Client").replace(/\b\w/g, (char) => char.toUpperCase());
  const role = String(user?.role || "").toLowerCase();
  if (role.includes("admin")) return "Admin";
  if (role.includes("client") || role.includes("affiliate")) return "Client";
  if (role.includes("creator") || role.includes("cp")) return "CP";
  const userType = String(user?.user_type || "");
  if (userType === "1") return "Admin";
  return "Admin";
};

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

const formatCurrency = (value: number | string | null | undefined, currency = "USD") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value: string) => {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return { date: "N/A", time: "" };
  return {
    date: format(parsed, "MMMM d, yyyy"),
    time: format(parsed, "h:mm a"),
  };
};

const formatShortDate = (value: string | null | undefined) => {
  if (!value) return "N/A";
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return format(parsed, "MMM d, yyyy");
};

const normalizePaymentStatus = (value: string | null | undefined): PaymentStatus => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["paid", "succeeded", "success", "completed", "complete"].includes(normalized)) return "Paid";
  if (normalized === "dispute_open" || normalized === "open") return "Dispute Open";
  if (normalized === "in_progress" || normalized === "in-progress" || normalized === "in_review" || normalized === "escalated") return "In-Progress";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "refunded") return "Refunded";
  return "Pending";
};

const normalizePaymentMethod = (value: string | null | undefined) => {
  const method = String(value || "").trim();
  if (!method) return "N/A";
  const normalized = method.toLowerCase();
  if (normalized.includes("stripe") || normalized.includes("online") || normalized.includes("card")) return "Stripe";
  if (normalized.includes("bank")) return "Bank Transfer";
  if (normalized.includes("manual")) return "Manual";
  return method;
};

const formatInvoiceLabel = (count: number | null | undefined) => {
  const normalizedCount = Math.max(Number(count || 0), 0);
  return `${String(normalizedCount).padStart(2, "0")} ${normalizedCount === 1 ? "Invoice" : "Invoices"}`;
};

const buildTransactionId = (transaction: FinanceTransactionApiRow) =>
  transaction.transaction_id ||
  transaction.transaction_code ||
  transaction.receipt_number ||
  `PAY-${transaction.finance_transaction_id || transaction.payment_id || transaction.manual_payment_id || "N/A"}`;

const mapTransactionDetail = (transaction: FinanceTransactionApiRow): TransactionDetail => {
  const transactionId = buildTransactionId(transaction);

  return {
    id: String(transaction.finance_transaction_id || transaction.payment_id || transaction.manual_payment_id || transactionId),
    transactionId,
    date: formatShortDate(transaction.transaction_date || transaction.event_date),
    amount: formatCurrency(transaction.total_amount, transaction.currency || "USD"),
    method: normalizePaymentMethod(transaction.payment_method),
    status: normalizePaymentStatus(transaction.status),
    receiptUrl: transaction.receipt_url || transaction.receipt_download_url || null,
    note: transaction.invoice_number || transaction.receipt_number || transaction.source || undefined,
  };
};

const mapClientPaymentRow = (row: ClientFinancePaymentApiRow): PaymentRow => {
  const currency = row.currency || row.cost_breakdown?.currency || "USD";
  const bookingId = formatShootId(row.booking_id || row.shoot_id);
  const transactionDetails = (row.transactions || []).map(mapTransactionDetail);

  return {
    id: String(row.booking_id || row.shoot_id || bookingId),
    bookingId,
    shootType: row.project_name || row.shoot_type || "N/A",
    totalAmount: formatCurrency(row.total_amount || row.cost_breakdown?.total_amount, currency),
    breakdown: {
      baseCost: formatCurrency(row.cost_breakdown?.base_cost, currency),
      addOns: formatCurrency(row.cost_breakdown?.add_ons, currency),
      taxes: formatCurrency(row.cost_breakdown?.taxes, currency),
      discounts: `-${formatCurrency(Math.abs(Number(row.cost_breakdown?.discounts || 0)), currency)}`,
    },
    invoiceLabel: formatInvoiceLabel(row.invoices_count),
    rawDateTime: row.date_time || row.event_date || new Date(0).toISOString(),
    paymentMethod: normalizePaymentMethod(row.payment_method || transactionDetails[0]?.method),
    status: normalizePaymentStatus(row.status || row.payment_status),
    actionType: row.dispute ? "view" : "menu",
    invoiceUrl: buildParentInvoiceUrl(bookingId) || row.latest_invoice?.invoice_url || row.latest_invoice?.invoice_pdf || null,
    invoiceDownloadUrl: buildParentInvoiceUrl(bookingId) || row.latest_invoice?.invoice_pdf || row.latest_invoice?.invoice_url || null,
    canRaiseDispute: row.actions?.can_raise_dispute !== false,
    transactionDetails,
    dispute: row.dispute || null,
  };
};

const matchesSelectedDate = (row: PaymentRow, selectedDate: Date | null) => {
  if (!selectedDate) return true;
  const parsed = parseISO(row.rawDateTime);
  if (Number.isNaN(parsed.getTime())) return false;
  return format(parsed, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
};

const matchesMonthPreset = (row: PaymentRow, monthFilter: (typeof monthOptions)[number]) => {
  if (monthFilter === "Month") return true;
  const parsed = parseISO(row.rawDateTime);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  if (monthFilter === "Last 30 Days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return parsed >= start && parsed <= now;
  }

  if (monthFilter === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    return parsed >= start && parsed <= now;
  }

  if (monthFilter === "This Year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return parsed >= start && parsed <= now;
  }

  return true;
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
  const suffix = row.bookingId.replace(/^#/, "").padStart(3, "0");
  const parsedDate = parseISO(row.rawDateTime);
  const createdAt = Number.isNaN(parsedDate.getTime())
    ? "20-04-2026"
    : format(parsedDate, "dd-MM-yyyy");
  const status = normalizePaymentStatus(row.dispute?.status || row.status);

  return {
    id: row.dispute?.dispute_code || `DIS-${suffix}`,
    bookingId: row.bookingId,
    invoiceId: row.invoiceLabel,
    raisedBy: status === "Dispute Open" ? "Client" : "Support Team",
    raisedRole: status === "Dispute Open" ? "Client" : "Admin",
    createdAt,
    status: status === "Resolved" ? "Resolved" : status === "Dispute Open" ? "Dispute - Open" : "Under Review",
    issueType: row.dispute?.category || row.dispute?.subject || (status === "Dispute Open" ? "Quality Issue" : "Payment Review"),
    description:
      row.dispute?.subject ||
      (status === "Dispute Open"
        ? "This payment dispute is currently open."
        : "This payment is being reviewed by the support team."),
    timeline: [
      {
        title: "Dispute Created",
        by: status === "Dispute Open" ? "Client" : "Support Team",
        at: `${createdAt} 10:30`,
        tone: "warning",
      },
      {
        title: status === "Resolved" ? "Resolved" : "Under Review",
        by: "Support Team",
        at: `${createdAt} 14:20`,
        tone: status === "Resolved" ? "resolved" : "review",
      },
    ],
    attachments: [],
    comments: [],
    invoiceUrl: row.invoiceUrl || row.invoiceDownloadUrl || null,
  };
};

const mapClientDisputeDetails = (
  dispute: ClientFinanceDisputeDetailsApiRow,
  fallbackRow?: PaymentRow | null
): AffiliateDisputeDetailsRecord => {
  const createdAt = formatShortDate(dispute.created_at);
  const status = normalizePaymentStatus(dispute.status);
  return {
    id: dispute.dispute_code || (dispute.dispute_id ? `DIS-${dispute.dispute_id}` : "DIS"),
    bookingId: formatShootId(dispute.booking_id || fallbackRow?.bookingId),
    invoiceId: dispute.invoice?.invoice_number || fallbackRow?.invoiceLabel || "-",
    raisedBy: "Client",
    raisedRole: "Client",
    createdAt,
    status: status === "Resolved" ? "Resolved" : status === "In-Progress" ? "Under Review" : "Dispute - Open",
    issueType: dispute.category || dispute.subject || "Dispute",
    description: dispute.description || dispute.subject || "This dispute is being reviewed.",
    invoiceUrl: buildParentInvoiceUrl(formatShootId(dispute.booking_id || fallbackRow?.bookingId)) || dispute.invoice?.invoice_url || dispute.invoice?.invoice_pdf || fallbackRow?.invoiceUrl || fallbackRow?.invoiceDownloadUrl || null,
    timeline: (dispute.timeline || []).map((event) => ({
      title: String(event.action || "Updated").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      by: event.performed_by?.name || "Support Team",
      at: formatShortDate(event.created_at),
      tone: event.to_status === "resolved" ? "resolved" : event.to_status === "in_review" || event.to_status === "escalated" ? "review" : "warning",
    })),
    attachments: (dispute.attachments || []).map((file) => ({
      name: file.file_name || "Attachment",
      size: "-",
      uploadedBy: getActorRole(file.uploaded_by, dispute),
      uploadedAt: "-",
      url: file.file_url || file.file_path || null,
    })),
    comments: (dispute.internal_comments || []).map((comment) => ({
      author: comment.created_by?.name || comment.created_by_creator?.name || "Support",
      role: comment.created_by_creator ? "CP" : getActorRole(comment.created_by, dispute),
      message: comment.body || "-",
      at: formatShortDate(comment.created_at),
    })),
  };
};

export default function AffiliateTransactionsHistory({
  onRaiseDispute,
  refreshKey = 0,
}: AffiliateTransactionsHistoryProps) {
  const { isDark } = useResolvedTheme();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [monthFilter, setMonthFilter] = useState<(typeof monthOptions)[number]>("Month");
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PaymentRow | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<AffiliateDisputeDetailsRecord | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | number | null>(null);
  const [disputeActionLoading, setDisputeActionLoading] = useState<"comment" | "attachment" | null>(null);
  const [openMenuState, setOpenMenuState] = useState<{ rowId: string; direction: "up" | "down" } | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const itemsPerPage = 10;

  React.useEffect(() => {
    let isCancelled = false;

    const fetchPayments = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await financeTransactionsApi.listClientPayments({
          page: 1,
          limit: 100,
          search: searchValue.trim() || undefined,
        });
        const mappedRows = (response.data?.rows || []).map(mapClientPaymentRow);

        if (isCancelled) return;
        setRows(mappedRows);
      } catch (error) {
        console.error("Failed to fetch client payments:", error);
        if (isCancelled) return;
        setRows([]);
        setErrorMessage(error instanceof Error ? error.message : "Failed to fetch payments");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void fetchPayments();
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [refreshKey, searchValue]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesType = typeFilter === "All" || row.paymentMethod === typeFilter;
      return (
        matchesStatus &&
        matchesType &&
        matchesSelectedDate(row, selectedDate) &&
        matchesMonthPreset(row, monthFilter) &&
        matchesSearch(row, searchValue)
      );
    });
  }, [monthFilter, rows, searchValue, selectedDate, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedDate, statusFilter, monthFilter, typeFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    setExpandedRowId(null);
  }, [currentPage, searchValue, selectedDate, statusFilter, monthFilter, typeFilter]);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuState(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const closeBreakdown = () => setSelectedRow(null);
  const closeDispute = () => {
    setSelectedDispute(null);
    setSelectedDisputeId(null);
  };
  const toggleRow = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

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

  const openUrl = (url: string | null | undefined) => {
    const targetUrl = String(url || "").trim();
    if (!targetUrl) return false;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return true;
  };

  const handleMenuAction = (event: React.MouseEvent, row: PaymentRow, action: "details" | "invoice" | "download" | "dispute") => {
    event.stopPropagation();
    setOpenMenuState(null);

    if (action === "details") {
      toggleRow(row.id);
      return;
    }

    if (action === "invoice") {
      openUrl(row.invoiceUrl);
      return;
    }

    if (action === "download") {
      openUrl(row.invoiceDownloadUrl || row.invoiceUrl);
      return;
    }

    if (action === "dispute") {
      onRaiseDispute?.(row.bookingId);
      return;
    }
  };

  const openDisputeDetails = async (event: React.MouseEvent, row: PaymentRow) => {
    event.stopPropagation();
    if (row.dispute) {
      setSelectedDispute(buildDisputeRecord(row));
      setSelectedDisputeId(row.dispute.dispute_id || null);
      if (row.dispute.dispute_id) {
        try {
          const response = await financeTransactionsApi.getClientDisputeDetails(row.dispute.dispute_id);
          setSelectedDispute(mapClientDisputeDetails(response.data, row));
        } catch (error) {
          console.error("Failed to fetch client dispute details:", error);
        }
      }
      return;
    }
    toggleRow(row.id);
  };

  const refreshClientDisputeDetails = async () => {
    if (!selectedDisputeId) return;
    const response = await financeTransactionsApi.getClientDisputeDetails(selectedDisputeId);
    setSelectedDispute(mapClientDisputeDetails(response.data));
  };

  const addClientDisputeComment = async (_dispute: AffiliateDisputeDetailsRecord, body: string) => {
    if (!selectedDisputeId) return;
    setDisputeActionLoading("comment");
    try {
      await financeTransactionsApi.addClientDisputeComment(selectedDisputeId, body);
      await refreshClientDisputeDetails();
    } catch (error) {
      console.error("Failed to add client dispute comment:", error);
    } finally {
      setDisputeActionLoading(null);
    }
  };

  const addClientDisputeAttachment = async (_dispute: AffiliateDisputeDetailsRecord, files: File[]) => {
    if (!selectedDisputeId || !files.length) return;
    setDisputeActionLoading("attachment");
    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("attachments", file));
      await financeTransactionsApi.addClientDisputeAttachment(selectedDisputeId, payload);
      await refreshClientDisputeDetails();
    } catch (error) {
      console.error("Failed to add client dispute attachment:", error);
    } finally {
      setDisputeActionLoading(null);
    }
  };

  const DetailPanelContent = ({ row }: { row: PaymentRow }) => (
    <div className={`p-5 lg:px-5 lg:py-6 ${isDark ? "bg-[#0A0A0A]" : "bg-[#FAFAFA]"}`}>
      <div className="mb-4 flex items-center gap-2">
        <FileText size={16} className={isDark ? "text-[#D3B98A]" : "text-[#8B6B36]"} />
        <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
          Transactions for {row.bookingId}
        </p>
      </div>

      {(row.transactionDetails || []).length > 0 ? (
        <div className="space-y-3">
          {(row.transactionDetails || []).map((transaction) => {
            const displayStatus = normalizePaymentStatus(transaction.status);
            return (
              <button
                key={transaction.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openUrl(transaction.receiptUrl);
                }}
                className={`flex w-full flex-col gap-3 rounded-lg border p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  transaction.receiptUrl ? "cursor-pointer" : "cursor-default"
                } ${isDark ? "border-[#262626] bg-[#141414] hover:border-[#3A3A3A]" : "border-[#E5E5E5] bg-white hover:border-[#CFCFCF]"}`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium sm:text-base ${isDark ? "text-white" : "text-[#171717]"}`}>
                    {transaction.transactionId}
                  </p>
                  <p className={`mt-1 text-xs sm:text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}>
                    {transaction.date} · {transaction.method}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
                    <p className={`text-base font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transaction.amount}
                    </p>
                    {transaction.note ? (
                      <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>
                        {transaction.note}
                      </p>
                    ) : null}
                  </div>
                  <span className={`inline-flex min-w-[88px] justify-center rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyles[displayStatus]}`}>
                    {displayStatus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-lg border p-4 text-sm ${isDark ? "border-[#262626] bg-[#141414] text-white/50" : "border-[#E5E5E5] bg-white text-[#777]"}`}>
          No transactions found for this shoot.
        </div>
      )}
    </div>
  );

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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-12 text-center text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}>
                    Loading payment history...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-12 text-center text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}>
                    {errorMessage || "No transactions found."}
                  </td>
                </tr>
              ) : (
                paginatedRows.flatMap((row) => {
                  const { date, time } = formatDate(row.rawDateTime);
                  const isExpanded = expandedRowId === row.id;

                return [
                  <tr
                    key={row.id}
                    onClick={() => toggleRow(row.id)}
                    className={`cursor-pointer border-b transition-colors ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F3F3F3] hover:bg-[#FAFAFA]"}`}
                  >
                    <td className={`px-4 py-5 text-sm ${isDark ? "text-white/85" : "text-[#171717]"}`}>
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          size={20}
                          className={`shrink-0 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                        />
                        <span>{row.bookingId}</span>
                      </div>
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
                                  disabled={!row.invoiceUrl}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-white transition-colors hover:bg-white/5"
                                >
                                  <FileText size={16} className="shrink-0" />
                                  <span className="font-medium">View Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "download")}
                                  disabled={!row.invoiceDownloadUrl && !row.invoiceUrl}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-white transition-colors hover:bg-white/5"
                                >
                                  <Download size={16} className="shrink-0" />
                                  <span className="font-medium">Download Invoice</span>
                                </button>
                                <div className="h-px bg-white/10" />
                                {row.canRaiseDispute !== false && (
                                  <button
                                    type="button"
                                    onClick={(event) => handleMenuAction(event, row, "dispute")}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-[#FF3B3B] transition-colors hover:bg-white/5"
                                  >
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span className="font-medium">Raise Dispute</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>,
                  ...(isExpanded ? [
                    <tr key={`${row.id}-details`}>
                      <td colSpan={8}>
                        <DetailPanelContent row={row} />
                      </td>
                    </tr>
                  ] : []),
                ];
              }))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {isLoading ? (
            <div className={`border-b p-6 text-center text-sm ${isDark ? "border-[#222222] text-white/55" : "border-[#F0F0F0] text-[#777]"}`}>
              Loading payment history...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className={`border-b p-6 text-center text-sm ${isDark ? "border-[#222222] text-white/55" : "border-[#F0F0F0] text-[#777]"}`}>
              {errorMessage || "No transactions found."}
            </div>
          ) : (
          paginatedRows.map((row) => {
            const { date, time } = formatDate(row.rawDateTime);
            const isExpanded = expandedRowId === row.id;
            return (
              <div
                key={row.id}
                onClick={() => toggleRow(row.id)}
                className={`cursor-pointer border-b p-4 ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-2">
                    <ChevronDown
                      size={18}
                      className={`mt-0.5 shrink-0 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                    />
                    <div className="min-w-0">
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#111]"}`}>{row.shootType}</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-[#666]"}`}>{row.bookingId}</p>
                    </div>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRow(row);
                        }}
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
                                disabled={!row.invoiceUrl}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
                              >
                                <FileText size={16} className="shrink-0" />
                                <span className="font-medium">View Invoice</span>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => handleMenuAction(event, row, "download")}
                                disabled={!row.invoiceDownloadUrl && !row.invoiceUrl}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
                              >
                                <Download size={16} className="shrink-0" />
                                <span className="font-medium">Download Invoice</span>
                              </button>
                              <div className="h-px bg-white/10" />
                              {row.canRaiseDispute !== false && (
                                <button
                                  type="button"
                                  onClick={(event) => handleMenuAction(event, row, "dispute")}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-[#FF3B3B] transition-colors hover:bg-white/5"
                                >
                                  <AlertCircle size={16} className="shrink-0" />
                                  <span className="font-medium">Raise Dispute</span>
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="-mx-4 mt-4">
                    <DetailPanelContent row={row} />
                  </div>
                )}
              </div>
            );
          }))}
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
        actionLoading={disputeActionLoading}
        onAddComment={addClientDisputeComment}
        onAddAttachment={addClientDisputeAttachment}
        onOpenInvoice={(dispute) => openUrl(dispute.invoiceUrl)}
      />

    </div>
  );
}
