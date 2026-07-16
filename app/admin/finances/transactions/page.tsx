"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpToLine } from "lucide-react";
import { format, parseISO } from "date-fns";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import TransactionsTable, {
  type TransactionDetailRow,
  type TransactionRow,
  type TransactionStatus,
} from "@/components/admin/finances/TransactionsTable";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import PaymentDetailsModal, { PaymentDetailsModalProps } from "@/components/admin/finances/PaymentDetailsModal";
import { useDebounce } from "@/hooks/use-debounce";
import {
  financeTransactionsApi,
  type FinancePagination,
  type FinanceShootApiRow,
  type FinanceTransactionApiRow,
} from "@/lib/api/financeTransactions";

type TransactionView = "Transactions ID" | "Shoot ID";

const ITEMS_PER_PAGE = 20;

const STATUS_OPTIONS: Record<string, string | undefined> = {
  All: undefined,
  Paid: "paid",
  Pending: "pending",
  Failed: "failed",
};

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

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return "N/A";
  const parsed = parseISO(value);
  if (!Number.isFinite(parsed.getTime())) return "N/A";
  return format(parsed, "MMM dd, yyyy");
};

const formatApiDate = (date: Date | null) => {
  if (!date) return undefined;
  return format(date, "yyyy-MM-dd");
};

const getPresetDateRange = (monthFilter: string) => {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");

  if (monthFilter === "Last 30 Days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { date_from: format(start, "yyyy-MM-dd"), date_to: end };
  }

  if (monthFilter === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { date_from: format(start, "yyyy-MM-dd"), date_to: end };
  }

  if (monthFilter === "This Year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { date_from: format(start, "yyyy-MM-dd"), date_to: end };
  }

  return {};
};

const normalizeStatus = (status: string | null | undefined): TransactionStatus => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid" || normalized === "succeeded") return "Paid";
  if (normalized === "failed") return "Failed";
  return "Pending";
};

const normalizePaymentMethod = (method: string | null | undefined) => {
  const value = String(method || "").trim();
  return value || "N/A";
};

const buildInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || name === "N/A") return "NA";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

const avatarColors = ["#F0C4E3", "#F5E4BC", "#F4E5CC", "#CFF3B9", "#E8DDD0", "#E2E2E2", "#D5D9E8"];

const getAvatarColor = (seed: string) => {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
};

const buildFeeNote = (transaction: FinanceTransactionApiRow) => {
  const parts = [
    transaction.invoice_number ? `Invoice: ${transaction.invoice_number}` : null,
    transaction.receipt_number ? `Receipt: ${transaction.receipt_number}` : null,
    transaction.source ? `Source: ${String(transaction.source).replace(/_/g, " ")}` : null,
  ].filter(Boolean);

  return parts.join(" + ") || "Payment receipt";
};

const mapTransactionDetail = (transaction: FinanceTransactionApiRow): TransactionDetailRow => {
  const transactionId =
    transaction.transaction_id ||
    transaction.transaction_code ||
    transaction.receipt_number ||
    `PAY-${transaction.finance_transaction_id || transaction.payment_id || transaction.manual_payment_id || "N/A"}`;

  return {
    id: String(transaction.finance_transaction_id || transactionId),
    transactionId,
    date: formatDateLabel(transaction.transaction_date || transaction.event_date),
    method: normalizePaymentMethod(transaction.payment_method),
    status: normalizeStatus(transaction.status),
    amount: formatCurrency(transaction.total_amount, transaction.currency || "USD"),
    feeNote: buildFeeNote(transaction),
  };
};

const mapTransactionRow = (transaction: FinanceTransactionApiRow, index = 0): TransactionRow => {
  const transactionId =
    transaction.transaction_id ||
    transaction.transaction_code ||
    transaction.receipt_number ||
    `PAY-${transaction.finance_transaction_id || transaction.payment_id || transaction.manual_payment_id || "N/A"}`;
  const bookingId = transaction.booking_id || transaction.shoot_id;
  const shootId = bookingId ? `#${bookingId}` : "N/A";
  const clientName = transaction.client_name || transaction.client_email || "N/A";

  return {
    id: String(transaction.finance_transaction_id || `${transactionId}-${index}`),
    transactionId,
    shootId,
    clientName,
    date: formatDateLabel(transaction.transaction_date || transaction.event_date),
    shootType: transaction.shoot_type || transaction.project_name || "N/A",
    totalAmount: formatCurrency(transaction.total_amount, transaction.currency || "USD"),
    paymentMethod: normalizePaymentMethod(transaction.payment_method),
    status: normalizeStatus(transaction.status),
    initials: buildInitials(clientName),
    avatarColor: getAvatarColor(clientName || transactionId),
    transactionCount: 1,
    transactionDetails: [mapTransactionDetail(transaction)],
  };
};

const mapShootRow = (shoot: FinanceShootApiRow, index = 0): TransactionRow => {
  const bookingId = shoot.booking_id || shoot.shoot_id;
  const shootId = bookingId ? `#${bookingId}` : "N/A";
  const transactions = Array.isArray(shoot.transactions) ? shoot.transactions : [];
  const primaryTransaction = transactions[0];
  const clientName =
    shoot.customer?.name ||
    shoot.client?.name ||
    primaryTransaction?.client_name ||
    shoot.customer?.email ||
    primaryTransaction?.client_email ||
    "N/A";
  const currency = shoot.currency || shoot.cost_breakdown?.currency || primaryTransaction?.currency || "USD";
  const paidAmount = transactions.reduce((sum, transaction) => {
    const amount = Number(transaction.total_amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const amount = paidAmount > 0
    ? paidAmount
    : shoot.cost_breakdown?.collected_amount ?? shoot.total_amount ?? shoot.cost_breakdown?.total_amount ?? primaryTransaction?.total_amount;

  return {
    id: String(bookingId || `shoot-${index}`),
    transactionId: primaryTransaction?.transaction_id || primaryTransaction?.transaction_code || "N/A",
    shootId,
    clientName,
    date: formatDateLabel(shoot.date_time || shoot.event_date || primaryTransaction?.transaction_date),
    shootType: shoot.shoot_type || shoot.project_name || primaryTransaction?.shoot_type || "N/A",
    totalAmount: formatCurrency(amount, currency),
    paymentMethod: normalizePaymentMethod(shoot.payment_method || primaryTransaction?.payment_method),
    status: normalizeStatus(shoot.status || shoot.payment_status || primaryTransaction?.status),
    initials: buildInitials(clientName),
    avatarColor: getAvatarColor(clientName || String(bookingId || index)),
    transactionCount: transactions.length,
    transactionDetails: transactions.map(mapTransactionDetail),
  };
};

const buildPayoutData = (row: TransactionRow | null): PaymentDetailsModalProps["payoutData"] => ({
  accountHolder: row?.clientName || "N/A",
  accountNumber: row?.transactionId || "N/A",
  payoutAmount: row?.totalAmount || "$0.00",
  phoneNumber: row?.shootId || "N/A",
  date: row?.date || "N/A",
  accountType: row?.paymentMethod || "N/A",
  branchName: row?.shootType || "N/A",
  status: row?.status || "Pending",
  initialsLeft: row?.initials?.[0] || "B",
  initialsRight: row?.initials?.[1] || "G",
});

export default function AdminTransactionsPage() {
  const pathname = usePathname();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<TransactionView>("Transactions ID");
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [pagination, setPagination] = useState<FinancePagination>({ page: 1, limit: ITEMS_PER_PAGE, total: 0, total_pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<TransactionRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const { isDark } = useResolvedTheme();

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDate, statusFilter, monthFilter, typeFilter, view]);

  const paymentMethodFilter = useMemo(() => {
    if (typeFilter === "Stripe") return "Stripe";
    if (typeFilter === "Bank Transfer") return "Bank Transfer";
    if (typeFilter === "Manual") return "Manual";
    return undefined;
  }, [typeFilter]);

  useEffect(() => {
    let isCancelled = false;

    const fetchRows = async () => {
      setLoading(true);

      try {
        const exactDate = formatApiDate(selectedDate);
        const presetRange = selectedDate ? {} : getPresetDateRange(monthFilter);
        const baseParams = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch.trim() || undefined,
        };

        if (view === "Transactions ID") {
          const response = await financeTransactionsApi.listTransactions({
            ...baseParams,
            status: STATUS_OPTIONS[statusFilter],
            transaction_type: undefined,
            payment_method: paymentMethodFilter,
            date_from: exactDate || presetRange.date_from,
            date_to: exactDate || presetRange.date_to,
          });
          const mappedRows = (response.data?.rows || []).map(mapTransactionRow);

          if (isCancelled) return;
          setRows(mappedRows);
          setPagination(response.data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: mappedRows.length, total_pages: 1 });
          return;
        }

        const response = await financeTransactionsApi.listShoots({
          ...baseParams,
          payment_status: STATUS_OPTIONS[statusFilter],
          payment_method: paymentMethodFilter,
        });
        const mappedRows = (response.data?.rows || []).map(mapShootRow);

        if (isCancelled) return;
        setRows(mappedRows);
        setPagination(response.data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: mappedRows.length, total_pages: 1 });
      } catch (error) {
        console.error("Failed to fetch finance transactions:", error);
        if (isCancelled) return;
        setRows([]);
        setPagination({ page: 1, limit: ITEMS_PER_PAGE, total: 0, total_pages: 1 });
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchRows();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearch, monthFilter, paymentMethodFilter, selectedDate, statusFilter, view]);

  const handleAction = (row: TransactionRow, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button
            variant="outline"
            className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
              ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
            }`}
          >
            <ArrowUpToLine /> Export
          </Button>
        }
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Transactions
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage your transactions, and payment history
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <TransactionsTable
          rows={rows}
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          monthValue={monthFilter}
          onMonthChange={setMonthFilter}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          viewValue={view}
          onViewChange={setView}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          totalPages={pagination.total_pages || 1}
          totalItems={pagination.total || rows.length}
          onPageChange={setCurrentPage}
          action={handleAction}
        />

        <PaymentDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          payoutData={buildPayoutData(selectedRow)}
        />
      </div>
    </>
  );
}
