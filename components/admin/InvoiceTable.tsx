"use client";

import React, { useEffect, useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
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

interface InvoiceTableRow {
  id: number;
  invoiceHistoryId: string;
  bookingId: string;
  detailHref: string | null;
  clientName: string;
  clientEmail: string;
  leadOrQuoteId: string;
  paymentStatus: string;
  sendDateLabel: string;
  sendDateRaw: number;
  invoicePdf: string | null;
}

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

export const InvoiceTable = () => {
  const { theme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<InvoiceTableRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const itemsPerPage = 20;
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, paymentFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchInvoiceHistory = async () => {
      setLoading(true);

      try {
        const response = await salesApi.getInvoiceHistory({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch || undefined,
          status:
            paymentFilter === "Paid"
              ? "paid"
              : paymentFilter === "Unpaid"
                ? "pending"
                : undefined,
        });

        const items: InvoiceHistoryItem[] = response?.data?.items || [];
        const pagination = response?.data?.pagination;
        const isSalesRoute = pathname?.startsWith("/sales");

        const itemsWithLiveStatus = await Promise.all(
          items.map(async (item) => ({
            item,
            livePaymentStatus: await resolveLivePaymentStatus(item),
          }))
        );

        const mappedRows = itemsWithLiveStatus.map(({ item, livePaymentStatus }) => {
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

          return {
            id: item.invoice_send_history_id,
            invoiceHistoryId: item.invoice_send_history_id ? `#${item.invoice_send_history_id}` : "N/A",
            bookingId: item.booking_id ? `#${item.booking_id}` : "N/A",
            detailHref,
            clientName: item.client_name || "N/A",
            clientEmail: item.client_email || "N/A",
            leadOrQuoteId: getLeadOrQuoteValue(item),
            paymentStatus: normalizeStatus(livePaymentStatus),
            sendDateLabel: formatDateLabel(sendDate),
            sendDateRaw: getDateValue(sendDate),
            invoicePdf: item.invoice_pdf,
          };
        });

        setRows(mappedRows);
        setTotalPages(pagination?.total_pages || 1);
        setTotalItems(pagination?.total || mappedRows.length);
      } catch (error) {
        console.error("Failed to fetch invoice history:", error);
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchInvoiceHistory();
  }, [currentPage, debouncedSearch, pathname, paymentFilter]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const handleDownload = (invoicePdf: string | null) => {
    if (!invoicePdf || typeof window === "undefined") return;

    const link = document.createElement("a");
    link.href = invoicePdf;
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

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div className={`border-b p-4 lg:p-6 ${isDark ? "border-[#222222]" : "border-[#F2F2F2]"}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
              label="Payment"
              value={paymentFilter}
              options={["All Payments", "Paid", "Unpaid"]}
              onChange={setPaymentFilter}
              openAlign="right"
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
                key={row.id}
                className={`p-4 space-y-3 ${row.detailHref ? "cursor-pointer" : ""}`}
                onClick={() => handleRowNavigation(row.detailHref)}
                onKeyDown={(event) => handleRowKeyDown(event, row.detailHref)}
                role={row.detailHref ? "button" : undefined}
                tabIndex={row.detailHref ? 0 : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      Invoice ID {row.invoiceHistoryId}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-[#555]"}`}>{row.sendDateLabel}</p>
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
                      handleDownload(row.invoicePdf);
                    }}
                    disabled={!row.invoicePdf}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-[#FFFCF6] text-black hover:bg-[#F6EFD9]"}`}
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                  <th className="py-5 px-6 font-medium">Invoice ID</th>
                  <th className="py-5 px-6 font-medium">Booking ID</th>
                  <th className="py-5 px-6 font-medium">Client Name</th>
                  <th className="py-5 px-6 font-medium">Email</th>
                  <th className="py-5 px-6 font-medium">Lead ID/Quote ID</th>
                  <th className="py-5 px-6 font-medium">Status</th>
                  <th className="py-5 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b transition-colors last:border-0 ${row.detailHref ? "cursor-pointer" : ""} ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                    onClick={() => handleRowNavigation(row.detailHref)}
                    onKeyDown={(event) => handleRowKeyDown(event, row.detailHref)}
                    role={row.detailHref ? "button" : undefined}
                    tabIndex={row.detailHref ? 0 : undefined}
                  >
                    <td className="py-5 px-6">
                      <p className={`text-base font-medium ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.invoiceHistoryId}</p>
                    </td>
                    <td className={`py-5 px-6 text-base ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.bookingId}</td>
                    <td className={`py-5 px-6 text-base ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.clientName}</td>
                    <td className={`py-5 px-6 text-base break-all ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.clientEmail}</td>
                    <td className={`py-5 px-6 text-base ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{row.leadOrQuoteId}</td>
                    <td className="py-5 px-6">
                      <LeadsStatusBadge status={row.paymentStatus} />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownload(row.invoicePdf);
                        }}
                        disabled={!row.invoicePdf}
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-40 ${isDark ? "bg-[#1A1A1A] text-white hover:bg-[#242424]" : "bg-[#FFFCF6] text-black hover:bg-[#F6EFD9]"}`}
                        aria-label="Download invoice pdf"
                        title="Download invoice pdf"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
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
