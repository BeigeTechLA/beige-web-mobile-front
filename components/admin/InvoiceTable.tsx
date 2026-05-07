"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { salesApi } from "@/lib/api";
import apiClient from "@/lib/apiClient";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { useDebounce } from "@/hooks/use-debounce";

interface InvoiceHistoryItem {
  invoice_send_history_id: number;
  lead_id: number | null;
  client_lead_id: number | null;
  booking_id: number | null;
  quote_id: number | null;
  quote_number: string | null;
  client_name: string | null;
  client_email: string | null;
  send_date_time: string | null;
  payment_status: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  sent_by: string | null;
  sales_rep?: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
}

interface InvoiceTableInvoiceRow {
  id: number;
  invoiceHistoryId: string;
  groupKey: string;
  bookingIdValue: number | null;
  bookingId: string;
  detailHref: string | null;
  clientName: string;
  clientEmail: string;
  leadOrQuoteId: string;
  paymentStatus: string;
  invoiceMethod: "manual" | "stripe" | "unknown";
  invoiceSendStatus: "sent" | "not_sent";
  sendDateLabel: string;
  sendDateRaw: number;
  invoicePdf: string | null;
}

interface InvoiceTableGroupRow {
  id: number;
  groupKey: string;
  bookingIdValue: number | null;
  bookingId: string;
  detailHref: string | null;
  clientName: string;
  clientEmail: string;
  leadOrQuoteId: string;
  paymentStatus: string;
  invoiceMethod: "manual" | "stripe" | "unknown";
  invoiceSendStatus: "sent" | "not_sent";
  sendDateLabel: string;
  sendDateRaw: number;
  invoicePdf: string | null;
  latestInvoiceHistoryId: string;
  invoices: InvoiceTableInvoiceRow[];
}

interface InvoiceHistoryResponse {
  success: boolean;
  data?: {
    items?: InvoiceHistoryItem[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      total_pages?: number;
    };
  } | null;
  error?: string;
}

const INVOICE_FILTER_BATCH_SIZE = 200;

const normalizeStatus = (status: string | null) => {
  if (!status) return "Unknown";

  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const formatDateLabel = (dateValue: string | null) => {
  if (!dateValue) return "N/A";

  const parsed = parseISO(dateValue);
  if (!Number.isFinite(parsed.getTime())) return "N/A";

  return format(parsed, "MMM dd, yyyy hh:mm a");
};

const getDateValue = (dateValue: string | null) => {
  if (!dateValue) return 0;

  const parsed = parseISO(dateValue);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
};

const getLeadOrQuoteValue = (item: InvoiceHistoryItem) => {
  if (item.quote_id) {
    return `Quote Id : ${item.quote_id}`;
  }

  if (item.client_lead_id) {
    return `Client Lead Id : ${item.client_lead_id}`;
  }

  if (item.lead_id) {
    return `Lead Id : ${item.lead_id}`;
  }
  
  return "N/A";
};

const getStatusLookupKey = (item: InvoiceHistoryItem) => {
  if (item.client_lead_id) {
    return `client:${item.client_lead_id}`;
  }

  if (item.lead_id) {
    return `lead:${item.lead_id}`;
  }

  return null;
};

const getInvoiceGroupKey = (item: InvoiceHistoryItem) => {
  if (item.booking_id && item.quote_id) {
    return `booking:${item.booking_id}|quote:${item.quote_id}`;
  }

  return `history:${item.invoice_send_history_id}`;
};

const matchesPaymentFilter = (paymentStatus: string, paymentFilter: string) => {
  const normalizedStatus = String(paymentStatus || "").trim().toLowerCase();

  if (paymentFilter === "Paid") {
    return normalizedStatus === "paid";
  }

  if (paymentFilter === "Unpaid") {
    return normalizedStatus !== "paid";
  }

  return true;
};

const matchesInvoiceMethodFilter = (
  method: "manual" | "stripe" | "unknown",
  methodFilter: string
) => {
  if (methodFilter === "Manual") {
    return method === "manual";
  }

  if (methodFilter === "Stripe") {
    return method === "stripe";
  }

  return true;
};

const matchesInvoiceSendFilter = (
  sendStatus: "sent" | "not_sent",
  sendFilter: string
) => {
  if (sendFilter === "Sent") {
    return sendStatus === "sent";
  }

  if (sendFilter === "Not Sent") {
    return sendStatus === "not_sent";
  }

  return true;
};

const resolveLivePaymentStatus = async (item: InvoiceHistoryItem) => {
  const currentStatus = String(item.payment_status || "").trim().toLowerCase();
  if (currentStatus === "paid") {
    return item.payment_status;
  }

  try {
    if (item.client_lead_id) {
      const response = await apiClient.get<{ success: boolean; data?: { payment_status?: string | null } }>(
        `sales/client-leads/${item.client_lead_id}`
      );
      return response?.data?.payment_status || item.payment_status;
    }

    if (item.lead_id) {
      const response = await apiClient.get<{ success: boolean; data?: { payment_status?: string | null } }>(
        `sales/leads/${item.lead_id}`
      );
      return response?.data?.payment_status || item.payment_status;
    }
  } catch (error) {
    console.error("Failed to resolve live invoice payment status:", error);
  }

  return item.payment_status;
};

const resolveItemsWithLivePaymentStatus = async (items: InvoiceHistoryItem[]) => {
  const requestCache = new Map<string, Promise<string | null>>();

  return Promise.all(
    items.map(async (item) => {
      const lookupKey = getStatusLookupKey(item);

      if (!lookupKey) {
        return {
          item,
          livePaymentStatus: item.payment_status,
        };
      }

      if (!requestCache.has(lookupKey)) {
        requestCache.set(lookupKey, resolveLivePaymentStatus(item));
      }

      return {
        item,
        livePaymentStatus: (await requestCache.get(lookupKey)) || item.payment_status,
      };
    })
  );
};

const mapInvoiceHistoryItemsToRows = (
  items: Awaited<ReturnType<typeof resolveItemsWithLivePaymentStatus>>,
  isSalesRoute: boolean
): InvoiceTableInvoiceRow[] =>
  items.map(({ item, livePaymentStatus }) => {
    const sendDate = item.send_date_time || item.created_at;
    const detailHref = item.client_lead_id
      ? isSalesRoute
        ? `/sales/client/${item.client_lead_id}`
        : `/admin/sales-representative/client/${item.client_lead_id}`
      : item.lead_id
        ? isSalesRoute
          ? `/sales/leads/${item.lead_id}`
          : `/admin/sales-representative/${item.lead_id}`
        : null;

    const invoiceUrl = item.invoice_url || "";
    const invoicePdf = item.invoice_pdf || "";
    const invoiceNumber = item.invoice_number || "";
    const isManualInvoice =
      /[?&]manual=(1|true)\b/i.test(invoiceUrl) ||
      /[?&]manual=(1|true)\b/i.test(invoicePdf) ||
      /^INVBEIGE-M-/i.test(invoiceNumber);
    const invoiceMethod: "manual" | "stripe" | "unknown" = isManualInvoice
      ? "manual"
      : (invoiceUrl || invoicePdf || invoiceNumber)
        ? "stripe"
        : "unknown";
    const hasInvoiceSendHistoryId =
      Number.isInteger(item.invoice_send_history_id) && item.invoice_send_history_id > 0;
    const invoiceSendStatus: "sent" | "not_sent" = hasInvoiceSendHistoryId ? "sent" : "not_sent";

    return {
      id: item.invoice_send_history_id,
      invoiceHistoryId:
        item.invoice_send_history_id && item.invoice_send_history_id > 0
          ? `#${item.invoice_send_history_id}`
          : item.booking_id
            ? `BOOKING-${item.booking_id}`
            : "N/A",
      groupKey: getInvoiceGroupKey(item),
      bookingIdValue: item.booking_id ?? null,
      bookingId: item.booking_id ? `#${item.booking_id}` : "N/A",
      detailHref,
      clientName: item.client_name || "N/A",
      clientEmail: item.client_email || "N/A",
      leadOrQuoteId: getLeadOrQuoteValue(item),
      paymentStatus: normalizeStatus(livePaymentStatus),
      invoiceMethod,
      invoiceSendStatus,
      sendDateLabel: formatDateLabel(sendDate),
      sendDateRaw: getDateValue(sendDate),
      invoicePdf: item.invoice_pdf,
    };
  });

const groupInvoiceRows = (rows: InvoiceTableInvoiceRow[]): InvoiceTableGroupRow[] => {
  const groupedRows = new Map<string, InvoiceTableInvoiceRow[]>();

  rows.forEach((row) => {
    const existingRows = groupedRows.get(row.groupKey) || [];
    existingRows.push(row);
    groupedRows.set(row.groupKey, existingRows);
  });

  return Array.from(groupedRows.entries())
    .map(([groupKey, invoiceRows]) => {
      const sortedInvoices = [...invoiceRows].sort((left, right) => {
        if (right.sendDateRaw !== left.sendDateRaw) {
          return right.sendDateRaw - left.sendDateRaw;
        }

        return right.id - left.id;
      });

      const latestInvoice = sortedInvoices[0];

      return {
        id: latestInvoice.id,
        groupKey,
        bookingIdValue: latestInvoice.bookingIdValue,
        bookingId: latestInvoice.bookingId,
        detailHref: latestInvoice.detailHref,
        clientName: latestInvoice.clientName,
        clientEmail: latestInvoice.clientEmail,
        leadOrQuoteId: latestInvoice.leadOrQuoteId,
        paymentStatus: latestInvoice.paymentStatus,
        invoiceMethod: latestInvoice.invoiceMethod,
        invoiceSendStatus: latestInvoice.invoiceSendStatus,
        sendDateLabel: latestInvoice.sendDateLabel,
        sendDateRaw: latestInvoice.sendDateRaw,
        invoicePdf: latestInvoice.invoicePdf,
        latestInvoiceHistoryId: latestInvoice.invoiceHistoryId,
        invoices: sortedInvoices,
      };
    })
    .sort((left, right) => {
      if (right.sendDateRaw !== left.sendDateRaw) {
        return right.sendDateRaw - left.sendDateRaw;
      }

      return right.id - left.id;
    });
};

const matchesSearchQuery = (group: InvoiceTableGroupRow, searchQuery: string) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    group.bookingId,
    group.clientName,
    group.clientEmail,
    group.leadOrQuoteId,
    group.latestInvoiceHistoryId,
    ...group.invoices.map((invoice) => invoice.invoiceHistoryId),
  ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
};

const getInvoiceHistoryPage = async (page: number, limit: number) => {
  const response = await salesApi.getInvoiceHistory({
    page,
    limit,
  });

  return response as InvoiceHistoryResponse;
};

const getAllInvoiceHistoryItems = async () => {
  let currentPage = 1;
  let totalPages = 1;
  const items: InvoiceHistoryItem[] = [];

  do {
    const response = await getInvoiceHistoryPage(currentPage, INVOICE_FILTER_BATCH_SIZE);
    const responseItems = response?.data?.items || [];
    const pagination = response?.data?.pagination;

    items.push(...responseItems);
    totalPages = Math.max(pagination?.total_pages || 1, 1);
    currentPage += 1;
  } while (currentPage <= totalPages);

  return items;
};

export const InvoiceTable = () => {
  const { theme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<InvoiceTableGroupRow[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const [invoiceMethodFilter, setInvoiceMethodFilter] = useState("All Methods");
  const [invoiceSendFilter, setInvoiceSendFilter] = useState("All");
  const itemsPerPage = 20;
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, paymentFilter, invoiceMethodFilter, invoiceSendFilter]);

  useEffect(() => {
    setExpandedGroups([]);
  }, [debouncedSearch, paymentFilter, invoiceMethodFilter, invoiceSendFilter, currentPage]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchInvoiceHistory = async () => {
      setLoading(true);

      try {
        const isSalesRoute = pathname?.startsWith("/sales");
        const allItems = await getAllInvoiceHistoryItems();
        const groupedRows = groupInvoiceRows(
          mapInvoiceHistoryItemsToRows(
            await resolveItemsWithLivePaymentStatus(allItems),
            Boolean(isSalesRoute)
          )
        );
        const filteredRows = groupedRows.filter((row) =>
          matchesPaymentFilter(row.paymentStatus, paymentFilter) &&
          matchesInvoiceMethodFilter(row.invoiceMethod, invoiceMethodFilter) &&
          matchesInvoiceSendFilter(row.invoiceSendStatus, invoiceSendFilter) &&
          matchesSearchQuery(row, debouncedSearch)
        );
        const nextTotalPages = Math.max(Math.ceil(filteredRows.length / itemsPerPage), 1);
        const safePage = Math.min(currentPage, nextTotalPages);
        const paginatedRows = filteredRows.slice(
          (safePage - 1) * itemsPerPage,
          safePage * itemsPerPage
        );

        if (isCancelled) return;

        setRows(paginatedRows);
        setTotalPages(nextTotalPages);
        setTotalItems(filteredRows.length);

        if (safePage !== currentPage) {
          setCurrentPage(safePage);
        }
      } catch (error) {
        console.error("Failed to fetch invoice history:", error);
        if (isCancelled) return;
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchInvoiceHistory();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearch, pathname, paymentFilter, invoiceMethodFilter, invoiceSendFilter]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const handleDownload = (invoicePdf: string | null, bookingIdValue: number | null) => {
    if (typeof window === "undefined") return;

    const isManualInvoice = typeof invoicePdf === "string" && /[?&]manual=(1|true)\b/i.test(invoicePdf);
    const apiBase = (process.env.NEXT_PUBLIC_API_ENDPOINT || "").replace(/\/$/, "");
    const dynamicManualDownloadUrl =
      isManualInvoice && bookingIdValue
        ? `${apiBase}/sales/invoice-pdf/${bookingIdValue}?manual=1&download=1&t=${Date.now()}`
        : null;
    const resolvedUrl = dynamicManualDownloadUrl || invoicePdf;
    if (!resolvedUrl) return;

    const link = document.createElement("a");
    link.href = resolvedUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowNavigation = (detailHref: string | null) => {
    if (!detailHref) return;

    router.push(detailHref);
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((currentGroups) =>
      currentGroups.includes(groupKey)
        ? currentGroups.filter((currentGroupKey) => currentGroupKey !== groupKey)
        : [...currentGroups, groupKey]
    );
  };

  const handleGroupAction = (row: InvoiceTableGroupRow) => {
    if (row.invoices.length > 1) {
      toggleGroup(row.groupKey);
      return;
    }

    handleRowNavigation(row.detailHref);
  };

  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    detailHref: string | null
  ) => {
    if (!detailHref) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(detailHref);
    }
  };

  const handleGroupKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    row: InvoiceTableGroupRow
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleGroupAction(row);
  };

  if (!mounted) {
    return null;
  }

 return (
  <div
    className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}
    style={{ fontFamily: "var(--font-instrument-sans)" }}
  >
    <div className={`border-b p-4 lg:p-6 ${isDark ? "border-[#222222]" : "border-[#F2F2F2]"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Search Input Section */}
        <div className="relative w-full lg:max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-white/35" : "text-black/35"}`} />
          <input
            type="text"
            placeholder="Search invoice ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={`h-10 w-full rounded-lg border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-1 ${isDark
              ? "border-white/10 bg-[#18181b] text-white placeholder:text-white/35 focus:ring-[#E8D1AB]"
              : "border-black/10 bg-white text-black placeholder:text-black/35 focus:ring-[#E8D1AB]"
              }`}
          />
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <BasicDropdown
            label="Method"
            value={invoiceMethodFilter}
            options={["All Methods", "Manual", "Stripe"]}
            onChange={setInvoiceMethodFilter}
            openAlign={typeof window !== 'undefined' && window.innerWidth < 1024 ? "left" : "right"}
          />
          <BasicDropdown
            label="Send"
            value={invoiceSendFilter}
            options={["All", "Sent", "Not Sent"]}
            onChange={setInvoiceSendFilter}
            openAlign={typeof window !== 'undefined' && window.innerWidth < 1024 ? "left" : "right"}
          />
          <BasicDropdown
            label="Payment"
            value={paymentFilter}
            options={["All Payments", "Paid", "Unpaid"]}
            onChange={setPaymentFilter}
            openAlign={typeof window !== 'undefined' && window.innerWidth < 1024 ? "left" : "right"}
          />
        </div>
      </div>
    </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={32} />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className={`py-20 text-center ${isDark ? "text-white/50" : "text-[#999]"}`}>No invoice history found.</div>
      ) : (
        <>
          <div className={`lg:hidden divide-y ${isDark ? "divide-[#222222]" : "divide-[#F3F3F3]"}`}>
            {rows.map((row) => (
              <div
                key={row.groupKey}
                className={`p-4 space-y-3 ${(row.detailHref || row.invoices.length > 1) ? "cursor-pointer" : ""}`}
                onClick={() => handleGroupAction(row)}
                onKeyDown={(event) => handleGroupKeyDown(event, row)}
                role={row.detailHref || row.invoices.length > 1 ? "button" : undefined}
                tabIndex={row.detailHref || row.invoices.length > 1 ? 0 : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex w-4 shrink-0 items-center justify-center ${
                        isDark ? "text-white/55" : "text-[#666]"
                      }`}
                      aria-hidden="true"
                    >
                      {row.invoices.length > 1
                        ? (expandedGroups.includes(row.groupKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
                        : null}
                    </span>
                    <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      Invoice ID {row.latestInvoiceHistoryId}
                    </p>
                    {row.invoices.length > 1 && (
                      <p className={`text-xs mt-1 ${isDark ? "text-white/45" : "text-[#777]"}`}>
                        {row.invoices.length} invoices in this booking/quote
                      </p>
                    )}
                    <p className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-[#555]"}`}>{row.sendDateLabel}</p>
                    </div>
                  </div>
                  <LeadsStatusBadge status={row.paymentStatus} />
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#888]"}>Booking ID</p>
                    <p className={isDark ? "text-white/80" : "text-[#333]"}>{row.bookingId}</p>
                  </div>
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#888]"}>Client Name</p>
                    <p className={isDark ? "text-white/80" : "text-[#333]"}>{row.clientName}</p>
                  </div>
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#888]"}>Email</p>
                    <p className={`break-all ${isDark ? "text-white/80" : "text-[#333]"}`}>{row.clientEmail}</p>
                  </div>
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#888]"}>Lead ID/Quote ID</p>
                    <p className={isDark ? "text-white/80" : "text-[#333]"}>{row.leadOrQuoteId}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDownload(row.invoicePdf, row.bookingIdValue);
                    }}
                    disabled={!row.invoicePdf}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-[#FFFCF6] text-black hover:bg-[#F6EFD9]"}`}
                  >
                    <Download size={14} />
                  </button>
                </div>

                {row.invoices.length > 1 && expandedGroups.includes(row.groupKey) && (
                  <div className={`mt-3 rounded-xl border overflow-hidden ${isDark ? "border-white/10 bg-white/[0.02]" : "border-[#ECE6D8] bg-[#FFFCF6]"}`}>
                    {row.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className={`flex items-center justify-between gap-3 px-4 py-3 border-t first:border-t-0 ${invoice.detailHref ? "cursor-pointer" : ""} ${isDark ? "border-white/10 hover:bg-white/[0.03]" : "border-[#EFE7D6] hover:bg-[#FFF7E8]"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRowNavigation(invoice.detailHref);
                        }}
                        onKeyDown={(event) => handleRowKeyDown(event, invoice.detailHref)}
                        role={invoice.detailHref ? "button" : undefined}
                        tabIndex={invoice.detailHref ? 0 : undefined}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{invoice.invoiceHistoryId}</p>
                          <p className={`text-xs mt-1 ${isDark ? "text-white/60" : "text-[#666]"}`}>{invoice.sendDateLabel}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <LeadsStatusBadge status={invoice.paymentStatus} />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(invoice.invoicePdf, invoice.bookingIdValue);
                            }}
                            disabled={!invoice.invoicePdf}
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-white text-black hover:bg-[#F6EFD9]"}`}
                            aria-label="Download invoice pdf"
                            title="Download invoice pdf"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[17%]" />
                <col className="w-[15%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className={`border-b text-xs font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#8A6A3D] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Invoice ID</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Booking ID</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Client Name</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Email</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Lead ID/Quote ID</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Payment Status</th>
                  <th className="py-4 px-6 font-medium text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isExpanded = expandedGroups.includes(row.groupKey);
                  const hasChildren = row.invoices.length > 1;

                  return (
                    <React.Fragment key={row.groupKey}>
                      <tr
                        className={`border-b align-top transition-colors ${(row.detailHref || hasChildren) ? "cursor-pointer" : ""} ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                        onClick={() => handleGroupAction(row)}
                        onKeyDown={(event) => handleGroupKeyDown(event, row)}
                        role={row.detailHref || hasChildren ? "button" : undefined}
                        tabIndex={row.detailHref || hasChildren ? 0 : undefined}
                      >
                        <td className="py-5 px-6 align-top">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-1 inline-flex w-4 shrink-0 items-center justify-center ${
                                isDark ? "text-white/55" : "text-[#666]"
                              }`}
                              aria-hidden="true"
                            >
                              {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : null}
                            </span>
                            <div className="min-w-0">
                              <p className={`truncate text-base font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.latestInvoiceHistoryId}</p>
                              <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>{row.sendDateLabel}</p>
                              {hasChildren && (
                                <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-[#777]"}`}>
                                  {row.invoices.length} invoices in this booking/quote
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`py-5 px-6 align-top text-base ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                          <p className="truncate" title={row.bookingId}>{row.bookingId}</p>
                        </td>
                        <td className={`py-5 px-6 align-top text-base ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                          <p className="truncate" title={row.clientName}>{row.clientName}</p>
                        </td>
                        <td className={`py-5 px-6 align-top text-base ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                          <p className="truncate" title={row.clientEmail}>{row.clientEmail}</p>
                        </td>
                        <td className={`py-5 px-6 align-top text-base ${isDark ? "text-[#666666]" : "text-[#777]"}`}>
                          <p className="truncate" title={row.leadOrQuoteId}>{row.leadOrQuoteId}</p>
                        </td>
                        <td className="py-5 px-6 align-top">
                          <LeadsStatusBadge status={row.paymentStatus} />
                        </td>
                        <td className="py-5 px-6 align-top">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDownload(row.invoicePdf, row.bookingIdValue);
                              }}
                              disabled={!row.invoicePdf}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-[#FFFCF6] text-black hover:bg-[#F6EFD9]"}`}
                              aria-label="Download invoice pdf"
                              title="Download invoice pdf"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {hasChildren && isExpanded && row.invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className={`border-b transition-colors ${invoice.detailHref ? "cursor-pointer" : ""} ${isDark ? "border-[#1D1D1D] bg-white/[0.015] hover:bg-white/[0.03]" : "border-[#F5F0E7] bg-[#FFFDF8] hover:bg-[#FFF7E8]"}`}
                          onClick={() => handleRowNavigation(invoice.detailHref)}
                          onKeyDown={(event) => handleRowKeyDown(event, invoice.detailHref)}
                          role={invoice.detailHref ? "button" : undefined}
                          tabIndex={invoice.detailHref ? 0 : undefined}
                        >
                          <td className="py-4 pl-14 pr-6 align-top">
                            <p className={`truncate text-sm font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{invoice.invoiceHistoryId}</p>
                            <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-[#777]"}`}>{invoice.sendDateLabel}</p>
                          </td>
                          <td className={`py-4 px-6 align-top text-sm ${isDark ? "text-[#D0D0D0]" : "text-[#444]"}`}>
                            <p className="truncate" title={invoice.bookingId}>{invoice.bookingId}</p>
                          </td>
                          <td className={`py-4 px-6 align-top text-sm ${isDark ? "text-[#D0D0D0]" : "text-[#444]"}`}>
                            <p className="truncate" title={invoice.clientName}>{invoice.clientName}</p>
                          </td>
                          <td className={`py-4 px-6 align-top text-sm ${isDark ? "text-[#D0D0D0]" : "text-[#444]"}`}>
                            <p className="truncate" title={invoice.clientEmail}>{invoice.clientEmail}</p>
                          </td>
                          <td className={`py-4 px-6 align-top text-sm ${isDark ? "text-[#777]" : "text-[#888]"}`}>
                            <p className="truncate" title={invoice.leadOrQuoteId}>{invoice.leadOrQuoteId}</p>
                          </td>
                          <td className="py-4 px-6 align-top">
                            <LeadsStatusBadge status={invoice.paymentStatus} />
                          </td>
                          <td className="py-4 px-6 align-top">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDownload(invoice.invoicePdf, invoice.bookingIdValue);
                                }}
                                disabled={!invoice.invoicePdf}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-white text-black hover:bg-[#F6EFD9]"}`}
                                aria-label="Download invoice pdf"
                                title="Download invoice pdf"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && rows.length > 0 && (
        <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Showing page {currentPage} of {totalPages} ({totalItems} total entries)
          </div>

          <div className="flex gap-2 items-center ml-auto">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page ? (isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black") : (isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100")}`}
                  >
                    {page}
                  </button>
                ))}
             </div>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
