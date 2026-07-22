"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  FileText,
  MoreVertical,
  Download,
  AlertCircle,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { buildBeigeInvoiceUrl } from "@/lib/invoiceUrl";

import { SortDateButton } from "@/components/admin/SortDateButton";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import AffiliateDisputeDetailsModal, {
  type AffiliateDisputeDetailsRecord,
} from "@/components/affiliate/AffiliateDisputeDetailsModal";
import { affiliateApi } from "@/lib/api";
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
  bookingIdValue: number | null;
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
  invoices: InvoiceDocument[];
  latestInvoice: InvoiceDocument | null;
  receiptUrl: string | null;
  receiptDownloadUrl: string | null;
  rawDateTime: string;
  paymentMethod: string;
  status: PaymentStatus;
  actionType: "menu" | "view";
};

type InvoiceDocument = {
  invoice_send_history_id: number | string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  receipt_url: string | null;
  receipt_download_url: string | null;
  payment_status: string | null;
  sent_at: string | null;
};

type AffiliateTransactionsHistoryProps = {
  onRaiseDispute?: (bookingId?: string) => void;
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

const formatDate = (value: string) => {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return { date: "N/A", time: "" };
  return {
    date: format(parsed, "MMMM d, yyyy"),
    time: format(parsed, "h:mm a"),
  };
};

const formatCurrency = (amount: number | string | null | undefined) => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
};

const formatPaymentMethod = (value?: string | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Manual";
  if (normalized === "bank_transfer" || normalized === "bank transfer") return "Bank Transfer";
  if (normalized === "stripe") return "Stripe";
  if (normalized === "manual") return "Manual";
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
};

const formatStatusLabel = (value?: string | null): PaymentStatus => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "paid" || normalized === "succeeded" || normalized === "success") return "Paid";
  if (normalized === "pending" || normalized === "processing") return "Pending";
  if (normalized === "refunded") return "Refunded";
  if (normalized === "void" || normalized === "cancelled" || normalized === "canceled") return "Refunded";
  if (normalized === "dispute_open" || normalized === "under_review") return "Dispute Open";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "in_progress") return "In-Progress";
  return "Pending";
};

const formatInvoiceLabel = (count?: number | null) => {
  const safeCount = Math.max(Number(count || 0), 0);
  const suffix = safeCount === 1 ? "Invoice" : "Invoices";
  return `${String(safeCount).padStart(2, "0")} ${suffix}`;
};

const formatInvoiceDocumentLabel = (invoice: InvoiceDocument, index: number) => {
  const invoiceNumber = String(invoice.invoice_number || "").trim();
  if (invoiceNumber) return invoiceNumber;
  return `Invoice ${index + 1}`;
};

const normalizeInvoiceDocument = (invoice?: Record<string, any> | null): InvoiceDocument | null => {
  if (!invoice) return null;

  const invoiceNumber = String(invoice.invoice_number || invoice.invoice_id || "").trim() || null;
  const receiptUrl = String(invoice.receipt_url || invoice.invoice_url || "").trim() || null;
  const receiptDownloadUrl = String(invoice.receipt_download_url || invoice.invoice_pdf || "").trim() || null;

  if (!invoiceNumber && !receiptUrl && !receiptDownloadUrl) return null;

  return {
    invoice_send_history_id: invoice.invoice_send_history_id ?? invoice.finance_invoice_payment_id ?? invoice.id ?? null,
    invoice_number: invoiceNumber,
    invoice_url: receiptUrl,
    invoice_pdf: receiptDownloadUrl,
    receipt_url: receiptUrl,
    receipt_download_url: receiptDownloadUrl,
    payment_status: invoice.payment_status || invoice.status || null,
    sent_at: invoice.sent_at || invoice.created_at || invoice.transaction_date || null,
  };
};

const resolveInvoiceDocumentUrl = (
  invoice: InvoiceDocument | null,
  bookingIdValue: number | null,
  download = false
) => {
  if (typeof window === "undefined") return null;

  const rawUrl = String(
    download
      ? invoice?.receipt_download_url || invoice?.invoice_pdf || invoice?.receipt_url || invoice?.invoice_url || ""
      : invoice?.receipt_url || invoice?.invoice_url || invoice?.invoice_pdf || ""
  ).trim();
  if (!rawUrl && !bookingIdValue) return null;

  if (rawUrl) {
    const parsedUrl = new URL(rawUrl, window.location.origin);
    const invoicePdfPathMatch = parsedUrl.pathname.match(/\/sales\/invoice-pdf\/([^/]+)$/);

    if (invoicePdfPathMatch) {
      const proxiedUrl = new URL(
        `/beige_invoice/${encodeURIComponent(invoicePdfPathMatch[1])}`,
        window.location.origin
      );
      parsedUrl.searchParams.forEach((value, key) => {
        if (key === "download") return;
        proxiedUrl.searchParams.set(key, value);
      });
      proxiedUrl.searchParams.set("t", String(Date.now()));
      return `${proxiedUrl.pathname}${proxiedUrl.search}`;
    }

    if (parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith("/beige_invoice/")) {
      parsedUrl.searchParams.set("t", String(Date.now()));
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    }

    return rawUrl;
  }

  return bookingIdValue
    ? buildBeigeInvoiceUrl(bookingIdValue, { manual: true, cacheBust: true })
    : null;
};

const buildRangeParams = (monthFilter: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (monthFilter === "Last 30 Days") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return {
      date_from: from.toISOString(),
      date_to: now.toISOString(),
    };
  }

  if (monthFilter === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      date_from: new Date(now.getFullYear(), quarterStartMonth, 1).toISOString(),
      date_to: now.toISOString(),
    };
  }

  if (monthFilter === "This Year") {
    return {
      date_from: new Date(now.getFullYear(), 0, 1).toISOString(),
      date_to: now.toISOString(),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    date_from: monthStart.toISOString(),
    date_to: now.toISOString(),
  };
};

const mapTransactionToRow = (transaction: Record<string, any>, index: number): PaymentRow => {
  const bookingIdValue = Number(transaction.booking_id ?? transaction.shoot_id ?? transaction.bookingId ?? transaction.shootId ?? 0) || null;
  const bookingLabel = bookingIdValue ? `BK-${String(bookingIdValue).padStart(3, "0")}` : `TX-${String(index + 1).padStart(3, "0")}`;
  const transactionDate = transaction.transaction_date || transaction.created_at || transaction.updated_at || null;
  const parsedDate = transactionDate ? new Date(transactionDate) : new Date();
  const safeDateTime = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const status = formatStatusLabel(transaction.status);
  const backendInvoices = Array.isArray(transaction.invoices) ? transaction.invoices : [];
  const normalizedInvoices = backendInvoices
    .map((invoice) => normalizeInvoiceDocument(invoice))
    .filter((invoice): invoice is InvoiceDocument => Boolean(invoice));
  const latestInvoice =
    normalizeInvoiceDocument(transaction.latest_invoice) ||
    normalizedInvoices[0] ||
    normalizeInvoiceDocument({
      invoice_send_history_id: transaction.invoice_send_history_id ?? null,
      invoice_number: transaction.invoice_number || null,
      invoice_url: transaction.receipt_url || transaction.invoice_url || null,
      invoice_pdf: transaction.receipt_download_url || transaction.invoice_pdf || null,
      receipt_url: transaction.receipt_url || transaction.invoice_url || null,
      receipt_download_url: transaction.receipt_download_url || transaction.invoice_pdf || null,
      payment_status: transaction.payment_status || transaction.status || null,
      sent_at: transaction.sent_at || transaction.transaction_date || transaction.created_at || null,
    });
  const invoices = normalizedInvoices.length > 0 ? normalizedInvoices : latestInvoice ? [latestInvoice] : [];
  const invoiceCount = Math.max(
    Number(transaction.invoices_count || 0),
    invoices.length,
    latestInvoice ? 1 : 0
  );

  return {
    id: String(transaction.finance_transaction_id ?? transaction.transaction_id ?? `${bookingLabel}-${index}`),
    bookingIdValue,
    bookingId: bookingLabel,
    shootType: transaction.shoot_type || transaction.project_name || "Transaction",
    totalAmount: formatCurrency(transaction.total_amount ?? transaction.gross_amount ?? 0),
    breakdown: {
      baseCost: formatCurrency(transaction.gross_amount ?? transaction.total_amount ?? 0),
      addOns: formatCurrency(transaction.metadata?.add_ons_amount ?? 0),
      taxes: formatCurrency(transaction.metadata?.tax_amount ?? 0),
      discounts: formatCurrency(-(Number(transaction.metadata?.discount_amount ?? 0))),
    },
    invoiceLabel: formatInvoiceLabel(invoiceCount || transaction.metadata?.invoices_count || 0),
    invoices,
    latestInvoice,
    receiptUrl: latestInvoice?.receipt_url || null,
    receiptDownloadUrl: latestInvoice?.receipt_download_url || null,
    rawDateTime: safeDateTime,
    paymentMethod: formatPaymentMethod(transaction.payment_method),
    status,
    actionType: status === "Dispute Open" ? "view" : "menu",
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
  const [openInvoiceState, setOpenInvoiceState] = useState<{ rowId: string; direction: "up" | "down" } | null>(null);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    let active = true;

    const loadTransactions = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchValue.trim() || undefined,
          status: statusFilter !== "All" ? statusFilter.toLowerCase().replace(/[\s-]+/g, "_") : undefined,
          payment_method: typeFilter !== "All" ? typeFilter.toLowerCase() : undefined,
          ...buildRangeParams(monthFilter),
        };

        if (selectedDate) {
          const start = new Date(selectedDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(selectedDate);
          end.setHours(23, 59, 59, 999);
          params.date_from = start.toISOString();
          params.date_to = end.toISOString();
        }

        const response = await affiliateApi.getTransactions(params);
        const rows = Array.isArray(response?.data?.rows) ? response.data.rows : [];

        if (!active) return;

        setPaymentRows(
          rows.map((row, index) => {
            return mapTransactionToRow(row as Record<string, any>, index);
          })
        );
        setTotalRows(Number(response?.data?.pagination?.total || rows.length || 0));
        setTotalPages(Math.max(Number(response?.data?.pagination?.total_pages || 1), 1));
      } catch (error) {
        console.error("Failed to fetch finance transactions:", error);
        if (!active) return;
        setPaymentRows([]);
        setTotalRows(0);
        setTotalPages(1);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTransactions();

    return () => {
      active = false;
    };
  }, [currentPage, itemsPerPage, monthFilter, searchValue, selectedDate, statusFilter, typeFilter]);

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedRows = paymentRows;
  const paginationItems = buildPaginationItems(safePage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, monthFilter, typeFilter, selectedDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const handleClickOutside = () => closeMenus();
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const closeBreakdown = () => setSelectedRow(null);
  const closeDispute = () => setSelectedDispute(null);

  const closeMenus = () => {
    setOpenMenuState(null);
    setOpenInvoiceState(null);
  };

  const openRowMenu = (event: React.MouseEvent, rowId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 180;
    const viewportPadding = 12;
    const shouldOpenUp = rect.bottom + menuHeight + viewportPadding > window.innerHeight;

    setOpenInvoiceState(null);
    setOpenMenuState((current) =>
      current?.rowId === rowId
        ? null
        : { rowId, direction: shouldOpenUp ? "up" : "down" }
    );
  };

  const openInvoiceMenu = (event: React.MouseEvent, rowId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 240;
    const viewportPadding = 12;
    const shouldOpenUp = rect.bottom + menuHeight + viewportPadding > window.innerHeight;

    setOpenMenuState(null);
    setOpenInvoiceState((current) =>
      current?.rowId === rowId
        ? null
        : { rowId, direction: shouldOpenUp ? "up" : "down" }
    );
  };

  const handleInvoiceDocumentView = (row: PaymentRow, invoice: InvoiceDocument | null) => {
    const resolvedUrl = resolveInvoiceDocumentUrl(invoice, row.bookingIdValue);
    if (!resolvedUrl) return;
    window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  };

  const handleInvoiceDocumentDownload = (row: PaymentRow, invoice: InvoiceDocument | null) => {
    const resolvedUrl = resolveInvoiceDocumentUrl(invoice, row.bookingIdValue, true);
    if (!resolvedUrl) return;

    const downloadName = String(invoice?.invoice_number || row.bookingId || "invoice").replace(/[^\w.-]+/g, "_");
    const link = document.createElement("a");
    link.href = resolvedUrl;
    link.download = `${downloadName}.pdf`;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getInvoiceDocuments = (row: PaymentRow) => row.invoices.length > 0 ? row.invoices : row.latestInvoice ? [row.latestInvoice] : [];

  const handleMenuAction = (event: React.MouseEvent, row: PaymentRow, action: "details" | "invoice" | "download" | "dispute") => {
    event.stopPropagation();
    closeMenus();

    if (action === "details") {
      setSelectedDispute(buildDisputeRecord(row));
      return;
    }

    if (action === "dispute") {
      onRaiseDispute?.(row.bookingId);
      return;
    }

    const invoice = getInvoiceDocuments(row)[0] || null;
    if (!invoice) return;

    if (action === "invoice") {
      handleInvoiceDocumentView(row, invoice);
      return;
    }

    if (action === "download") {
      handleInvoiceDocumentDownload(row, invoice);
    }
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
              {loading ? (
                <tr>
                  <td colSpan={8} className={`px-4 py-14 text-center ${isDark ? "text-white/65" : "text-[#777]"}`}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8D1AB] border-t-transparent" />
                      <span className="text-sm">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className={`px-4 py-10 text-center text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
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
                      <div className="min-w-0 overflow-hidden">
                        <span className="block truncate" title={row.shootType} aria-label={row.shootType}>
                          {row.shootType}
                        </span>
                      </div>
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
                      <div className="relative inline-flex">
                        <button
                          type="button"
                          onClick={(event) => openInvoiceMenu(event, row.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${isDark ? "bg-[#2D2A25] text-[#D3B98A] hover:bg-[#3a3328]" : "bg-[#F4F0E7] text-[#8B6B36] hover:bg-[#ece3cf]"}`}
                          aria-label={`Open invoices for ${row.bookingId}`}
                        >
                          <span>{row.invoiceLabel}</span>
                          <ChevronDown size={12} className={`transition-transform ${openInvoiceState?.rowId === row.id ? "rotate-180" : ""}`} />
                        </button>

                        {openInvoiceState?.rowId === row.id && (
                          <div
                            className={`absolute left-0 top-11 z-30 w-[292px] overflow-hidden rounded-[16px] border shadow-[0_14px_24px_rgba(0,0,0,0.32)] ${isDark ? "border-white/15 bg-[#101010]" : "border-black/10 bg-white"}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className={`flex items-center justify-between border-b px-3 py-2 text-xs font-medium ${isDark ? "border-white/10 text-white/70" : "border-black/10 text-black/60"}`}>
                              <span>Available Invoices</span>
                              <span>{row.invoiceLabel}</span>
                            </div>

                            <div className="max-h-[280px] overflow-y-auto">
                              {getInvoiceDocuments(row).length > 0 ? (
                                getInvoiceDocuments(row).map((invoice, index) => {
                                  const sentDate = invoice.sent_at ? formatDate(invoice.sent_at) : null;
                                  return (
                                    <div
                                      key={`${invoice.invoice_send_history_id || invoice.invoice_number || index}`}
                                      className={`flex items-center justify-between gap-3 px-3 py-2.5 ${isDark ? "border-white/10 hover:bg-white/5" : "border-black/5 hover:bg-black/5"} border-b last:border-b-0`}
                                    >
                                      <div className="min-w-0">
                                        <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                          {formatInvoiceDocumentLabel(invoice, index)}
                                        </p>
                                        <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                                          {sentDate?.date || invoice.payment_status || "Invoice"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            closeMenus();
                                            handleInvoiceDocumentView(row, invoice);
                                          }}
                                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black hover:bg-black/10"}`}
                                          aria-label={`View ${formatInvoiceDocumentLabel(invoice, index)}`}
                                          title="View invoice"
                                        >
                                          <ExternalLink size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            closeMenus();
                                            handleInvoiceDocumentDownload(row, invoice);
                                          }}
                                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black hover:bg-black/10"}`}
                                          aria-label={`Download ${formatInvoiceDocumentLabel(invoice, index)}`}
                                          title="Download invoice"
                                        >
                                          <Download size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className={`px-3 py-4 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                                  No invoices available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {loading ? (
            <div className={`border-b p-6 text-center text-sm ${isDark ? "border-[#222222] text-white/65" : "border-[#F0F0F0] text-[#777]"}`}>
              <div className="flex items-center justify-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8D1AB] border-t-transparent" />
                <span>Loading transactions...</span>
              </div>
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className={`border-b p-6 text-center text-sm ${isDark ? "border-[#222222] text-white/55" : "border-[#F0F0F0] text-[#777]"}`}>
              No records found.
            </div>
          ) : (
            paginatedRows.map((row) => {
              const { date, time } = formatDate(row.rawDateTime);
              return (
                <div key={row.id} className={`border-b p-4 ${isDark ? "border-[#222222]" : "border-[#F0F0F0]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#111]"}`} title={row.shootType} aria-label={row.shootType}>
                        {row.shootType}
                      </p>
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
                      <div className="relative mt-1 inline-flex">
                        <button
                          type="button"
                          onClick={(event) => openInvoiceMenu(event, row.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${isDark ? "bg-[#2D2A25] text-[#D3B98A] hover:bg-[#3a3328]" : "bg-[#F4F0E7] text-[#8B6B36] hover:bg-[#ece3cf]"}`}
                          aria-label={`Open invoices for ${row.bookingId}`}
                        >
                          <span>{row.invoiceLabel}</span>
                          <ChevronDown size={12} className={`transition-transform ${openInvoiceState?.rowId === row.id ? "rotate-180" : ""}`} />
                        </button>

                        {openInvoiceState?.rowId === row.id && (
                          <div
                            className={`absolute right-0 top-11 z-30 w-[292px] overflow-hidden rounded-[16px] border shadow-[0_14px_24px_rgba(0,0,0,0.32)] ${isDark ? "border-white/15 bg-[#101010]" : "border-black/10 bg-white"}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className={`flex items-center justify-between border-b px-3 py-2 text-xs font-medium ${isDark ? "border-white/10 text-white/70" : "border-black/10 text-black/60"}`}>
                              <span>Available Invoices</span>
                              <span>{getInvoiceDocuments(row).length}</span>
                            </div>

                            <div className="max-h-[280px] overflow-y-auto">
                              {getInvoiceDocuments(row).length > 0 ? (
                                getInvoiceDocuments(row).map((invoice, index) => {
                                  const sentDate = invoice.sent_at ? formatDate(invoice.sent_at) : null;
                                  return (
                                    <div
                                      key={`${invoice.invoice_send_history_id || invoice.invoice_number || index}`}
                                      className={`flex items-center justify-between gap-3 px-3 py-2.5 ${isDark ? "border-white/10 hover:bg-white/5" : "border-black/5 hover:bg-black/5"} border-b last:border-b-0`}
                                    >
                                      <div className="min-w-0">
                                        <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                          {formatInvoiceDocumentLabel(invoice, index)}
                                        </p>
                                        <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                                          {sentDate?.date || invoice.payment_status || "Invoice"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            closeMenus();
                                            handleInvoiceDocumentView(row, invoice);
                                          }}
                                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black hover:bg-black/10"}`}
                                          aria-label={`View ${formatInvoiceDocumentLabel(invoice, index)}`}
                                          title="View invoice"
                                        >
                                          <ExternalLink size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            closeMenus();
                                            handleInvoiceDocumentDownload(row, invoice);
                                          }}
                                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "text-white/80 hover:bg-white/10" : "text-black hover:bg-black/10"}`}
                                          aria-label={`Download ${formatInvoiceDocumentLabel(invoice, index)}`}
                                          title="Download invoice"
                                        >
                                          <Download size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className={`px-3 py-4 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                                  No invoices available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
            })
          )}
        </div>

        <div className={`flex flex-col gap-4 border-t p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6 ${isDark ? "border-[#262626]" : "border-[#E8E8E8]"}`}>
          <p className={`text-sm ${isDark ? "text-white/55" : "text-[#777]"}`}>
            Showing {paymentRows.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + paymentRows.length, totalRows || paymentRows.length)} of {totalRows}
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
