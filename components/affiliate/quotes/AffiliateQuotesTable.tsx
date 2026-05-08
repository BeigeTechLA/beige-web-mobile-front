"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { format as formatDateFns } from "date-fns";
import { SortDateButton } from "@/components/admin/SortDateButton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salesApi, type QuotesListResponse, type SalesQuoteListItem } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
};

type AffiliateQuotesTableProps = {
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
};

type PaginationItem = number | "...";

type DisplayQuoteRow = {
  id: string;
  quoteNumber: string;
  client: string;
  location: string;
  initials: string;
  color: string;
  project: string;
  amountValue: number;
  status: string;
  statusKey: string;
  statusColor: string;
  validUntil: string;
  salesperson: string;
  salespersonId: string;
  salespersonKey: string;
  createdAtRaw: string;
  searchValue: string;
};

const AVATAR_COLORS = [
  "bg-[#FFF6E9] text-[#101010]",
  "bg-[#D6E6FF] text-[#4A90E2]",
  "bg-[#D6FFE6] text-[#27AE60]",
  "bg-[#FFD6E6] text-[#EB5757]",
  "bg-[#FFD1B6] text-[#D35400]",
  "bg-[#E6DBFF] text-[#9070FF]",
];

const QUOTES_PER_PAGE = 10;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getOptionalNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const getNumber = (...values: unknown[]) => getOptionalNumber(...values) ?? 0;

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getInitials = (value: string) => {
  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const parseDateValue = (value: string) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const formatDate = (value: string) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = parseDateValue(value);
  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatLabel = (value: string) =>
  value
    .replace(/_quotes$/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "partially paid":
    case "partial_paid":
    case "partially_paid":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
    case "accepted":
    case "confirmed":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "draft":
      return "bg-[#D1D5DB] text-[#4B5563] border-transparent";
    case "pending":
    case "sent":
      return "bg-[#D6E6FF] text-[#4A90E2] border-transparent";
    case "viewed":
      return "bg-[#E6DBFF] text-[#9070FF] border-transparent";
    case "rejected":
    case "cancelled":
      return "bg-[#FFD1D1] text-[#EB5757] border-transparent";
    case "expired":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
    default:
      return "bg-white/10 text-white border-transparent";
  }
};

const extractQuoteRows = (data: QuotesListResponse["data"]) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = getRecord(data);
  const keys = ["quotes", "items", "results", "rows", "list", "data"] as const;

  for (const key of keys) {
    const value = record?.[key];
    if (Array.isArray(value)) {
      return value as SalesQuoteListItem[];
    }
  }

  return [];
};

const matchesStatusFilter = (quoteStatusKey: string, filterValue: string) => {
  if (filterValue === "all") {
    return true;
  }

  if (filterValue === "accepted") {
    return quoteStatusKey === "accepted" || quoteStatusKey === "confirmed";
  }

  if (filterValue === "pending") {
    return quoteStatusKey === "pending" || quoteStatusKey === "sent";
  }

  if (filterValue === "rejected") {
    return quoteStatusKey === "rejected" || quoteStatusKey === "cancelled";
  }

  return quoteStatusKey === filterValue;
};

const buildPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 1) {
    return [1];
  }

  const items: PaginationItem[] = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  items.push(1);

  if (left > 2) {
    items.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("...");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const normalizeQuoteRow = (quote: SalesQuoteListItem, index: number): DisplayQuoteRow => {
  const client = getText(
    quote.client_name,
    quote.client,
    quote.customer_name,
    quote.guest_email,
    quote.client_email,
    "Unknown Client"
  );
  const project = getText(
    quote.project_description,
    quote.project,
    quote.description,
    quote.video_shoot_type,
    "Project details unavailable"
  );
  const salesperson = getText(
    quote.salesperson,
    quote.sales_person,
    quote.sales_rep_name,
    quote.sales_rep,
    quote.created_by_name,
    quote.assigned_sales_rep?.name,
    quote.created_by?.name,
    "N/A"
  );
  const statusKey = getText(quote.quote_status, quote.status, "draft").toLowerCase() || "draft";
  const quoteNumber = getText(quote.quote_number);
  const location = getText(
    quote.location,
    quote.client_address,
    quote.address,
    "Location not specified"
  );
  const amountValue = getNumber(quote.total_amount, quote.total, quote.amount);

  return {
    id: String(quote.sales_quote_id ?? quote.quote_id ?? quote.id ?? index),
    quoteNumber,
    client,
    location,
    initials: getInitials(client),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    project,
    amountValue,
    status: formatLabel(statusKey),
    statusKey,
    statusColor: getStatusColor(statusKey),
    validUntil: formatDate(getText(quote.valid_until, quote.expires_at)),
    salesperson,
    salespersonId: String(quote.assigned_sales_rep?.id ?? quote.created_by?.id ?? ""),
    salespersonKey: salesperson.toLowerCase(),
    createdAtRaw: getText(quote.created_at, quote.updated_at),
    searchValue: [
      client,
      quoteNumber,
      project,
      salesperson,
      location,
      formatLabel(statusKey),
    ]
      .join(" ")
      .toLowerCase(),
  };
};

const rowBelongsToClient = (quote: SalesQuoteListItem, clientUserId: string) => {
  const candidates = [
    quote.client_user_id,
    quote.user_id,
    quote.client_id,
    getRecord(quote.client)?.id,
    getRecord(quote.client)?.user_id,
  ];

  return candidates.some((value) => String(value ?? "") === clientUserId);
};


export default function AffiliateQuotesTable({
  TopbarComponent,
}: AffiliateQuotesTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const { user } = useAuth();

  const [quotes, setQuotes] = useState<SalesQuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const clientUserId = user?.id != null ? String(user.id) : "";

  useEffect(() => {
    let isActive = true;

    const fetchClientQuotes = async () => {
      if (!clientUserId) {
        if (isActive) {
          setQuotes([]);
          setLoading(false);
        }
        return;
      }

      if (hasLoadedOnceRef.current) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      const response = await salesApi.getClientQuotesList(clientUserId, {
        page: 1,
        limit: 100,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(selectedStatusFilter !== "all" ? { status: selectedStatusFilter } : {}),
      });

      if (!isActive) {
        return;
      }

      if (!response.success) {
        setQuotes([]);
        setErrorMessage(response.error || "Failed to fetch quotes.");
        setLoading(false);
        setIsRefreshing(false);
        hasLoadedOnceRef.current = true;

        return;
      }

      const fetchedRows = extractQuoteRows(response.data);
      const scopedRows = fetchedRows.filter((quote) => rowBelongsToClient(quote, clientUserId));

      setQuotes(scopedRows);
      setLoading(false);
      setIsRefreshing(false);
      hasLoadedOnceRef.current = true;
    };

    void fetchClientQuotes();

    return () => {
      isActive = false;
    };
  }, [clientUserId, debouncedSearch, selectedStatusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDate, selectedSalesperson, selectedStatusFilter]);

  const normalizedQuotes = useMemo(
    () => quotes.map((quote, index) => normalizeQuoteRow(quote, index)),
    [quotes]
  );

  const statusOptions = useMemo(
    () =>
      [
        "accepted",
        "draft",
        "pending",
        "rejected",
        "sent",
        ...normalizedQuotes
          .map((quote) => quote.statusKey)
          .filter((status) => !["accepted", "draft", "pending", "rejected", "sent"].includes(status)),
      ].filter((status, index, array) => Boolean(status) && array.indexOf(status) === index),
    [normalizedQuotes]
  );

  const salespersonOptions = useMemo(
    () =>
      normalizedQuotes
        .map((quote) => ({
          id: quote.salespersonId || quote.salespersonKey,
          name: quote.salesperson,
        }))
        .filter((salesperson) => salesperson.id && salesperson.name && salesperson.name !== "N/A")
        .filter(
          (salesperson, index, array) =>
            array.findIndex((item) => item.id === salesperson.id) === index
        ),
    [normalizedQuotes]
  );

  const filteredQuotesData = useMemo(() => {
    return normalizedQuotes.filter((quote) => {
      const matchesSalesperson =
        selectedSalesperson === "all" ||
        (quote.salespersonId || quote.salespersonKey) === selectedSalesperson;
      const matchesCreatedDate =
        !selectedDate ||
        (() => {
          const createdAtDate = parseDateValue(quote.createdAtRaw);
          return (
            createdAtDate !== null &&
            formatDateFns(createdAtDate, "yyyy-MM-dd") ===
              formatDateFns(selectedDate, "yyyy-MM-dd")
          );
        })();

      return (
        matchesSalesperson &&
        matchesCreatedDate &&
        matchesStatusFilter(quote.statusKey, selectedStatusFilter)
      );
    });
  }, [normalizedQuotes, selectedDate, selectedSalesperson, selectedStatusFilter]);

  const totalFilteredQuotes = filteredQuotesData.length;
  const totalListPages = Math.max(1, Math.ceil(totalFilteredQuotes / QUOTES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalListPages);
  const listStartIndex = (safeCurrentPage - 1) * QUOTES_PER_PAGE;

  const paginatedQuotesData = useMemo(
    () => filteredQuotesData.slice(listStartIndex, listStartIndex + QUOTES_PER_PAGE),
    [filteredQuotesData, listStartIndex]
  );

  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalListPages),
    [safeCurrentPage, totalListPages]
  );

  useEffect(() => {
    if (currentPage > totalListPages) {
      setCurrentPage(totalListPages);
    }
  }, [currentPage, totalListPages]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedDate !== null ||
    selectedSalesperson !== "all" ||
    selectedStatusFilter !== "all";

  const showEmptyState =
    !loading && !hasActiveFilters && !errorMessage && normalizedQuotes.length === 0;

  return (
    <div className="min-h-screen">
      <TopbarComponent pathname={pathname} />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className={`text-lg font-semibold lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-[#000]"}`}>
              Quotes
            </h1>
            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              View your client-specific quotes only.
            </p>
          </div>

          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {loading ? (
          <div
            className={`flex min-h-[320px] items-center justify-center rounded-[32px] ${
              isDark ? "border border-[#3D3D3D] bg-[#161616]" : "border border-[#E5E5E5] bg-white"
            }`}
          >
            <div
              className={`flex items-center gap-3 text-sm ${
                isDark ? "text-white/70" : "text-black/70"
              }`}
            >
              <Loader2 size={18} className="animate-spin text-[#E5D5B8]" />
              Loading quotes...
            </div>
          </div>
        ) : showEmptyState ? (
          <div
            className={`rounded-[32px] border px-6 py-20 text-center ${
              isDark ? "border-[#3D3D3D] bg-[#161616]" : "border-[#E5E5E5] bg-white"
            }`}
          >
            <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
              No quotes found
            </h2>
            <p className={`mt-2 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
              Your quotes will appear here once they are available.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    isDark ? "text-zinc-500" : "text-black/70"
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by client name, quote number..."
                  className={`w-full rounded-xl border py-3 pl-12 pr-4 text-sm transition-colors focus:outline-none ${
                    isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E3E3E3] bg-white"
                  }`}
                />
                {isRefreshing && (
                  <Loader2
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#E5D5B8]"
                    size={18}
                  />
                )}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger
                    className={`min-w-[170px] rounded-xl text-sm focus:ring-[#E5D5B8]/40 ${
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white/70"
                        : "border-[#E3E3E3] bg-white text-black/70"
                    }`}
                  >
                    <SelectValue placeholder="All Salesperson" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white"
                        : "border-[#E3E3E3] bg-white text-black"
                    }
                  >
                    <SelectItem value="all">All Salesperson</SelectItem>
                    {salespersonOptions.map((salesperson) => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                  <SelectTrigger
                    className={`min-w-[170px] rounded-xl text-sm focus:ring-[#E5D5B8]/40 ${
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white/70"
                        : "border-[#E3E3E3] bg-white text-black/70"
                    }`}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white"
                        : "border-[#E3E3E3] bg-white text-black"
                    }
                  >
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {errorMessage ? (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-[#5C2B2B] bg-[#2A1313] text-[#FFB4B4]"
                    : "border-[#F5C2C7] bg-[#FFF5F5] text-[#B42318]"
                }`}
              >
                {errorMessage}
              </div>
            ) : null}

            <div
              className={`mb-20 overflow-hidden rounded-2xl md:mb-0 ${
                isDark ? "border border-[#3D3D3D] bg-[#161616]" : "border border-[#E5E5E5] bg-white"
              }`}
            >
              <table className="w-full text-left">
                <thead>
                  <tr
                    className={`hidden rounded-b-lg border-b text-sm capitalize md:table-row ${
                      isDark
                        ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                        : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                  >
                    <th className="w-[25%] px-6 py-4 font-medium">Client Name</th>
                    <th className="w-[18%] px-6 py-4 font-medium">Project</th>
                    <th className="w-[12%] px-6 py-4 font-medium">Amount</th>
                    <th className="w-[15%] px-6 py-4 font-medium">Quote Status</th>
                    <th className="w-[15%] px-6 py-4 font-medium">Valid Until</th>
                    <th className="w-[15%] px-6 py-4 font-medium">Salesperson</th>
                  </tr>
                  <tr
                    className={`border-b text-sm md:hidden ${
                      isDark
                        ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                        : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                  >
                    <th className="px-4 py-4 font-medium">Client Name</th>
                    <th className="px-4 py-4 text-right font-medium">Quote Status</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {paginatedQuotesData.length > 0 ? (
                    paginatedQuotesData.map((quote) => (
                      <tr
                        key={quote.id}
                        onClick={() => router.push(`/affiliate/quotes/${quote.id}`)}
                        className={`border-b transition-colors ${
                          isDark
                            ? "cursor-pointer border-[#3D3D3D]/50 hover:bg-white/5"
                            : "cursor-pointer border-[#E3E3E3] hover:bg-black/5"
                        }`}
                      >
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quote.color} font-bold text-xs`}
                            >
                              {quote.initials}
                            </div>
                            <div>
                              <div className="font-medium">{quote.client}</div>
                              <div
                                className={`text-sm md:block ${
                                  isDark ? "text-white/40" : "text-black/45"
                                }`}
                              >
                                {quote.location}
                              </div>
                              {quote.quoteNumber ? (
                                <div
                                  className={`text-xs md:block ${
                                    isDark ? "text-white/25" : "text-black/30"
                                  }`}
                                >
                                  {quote.quoteNumber}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`hidden max-w-0 w-full px-6 py-4 md:table-cell ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          <p className="truncate">{quote.project}</p>
                        </td>
                        <td className="hidden px-6 py-4 font-medium md:table-cell">
                          {formatCurrency(quote.amountValue)}
                        </td>
                        <td className="px-4 py-4 text-right md:px-6 md:text-left">
                          <span
                            className={`inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium leading-none md:text-sm ${quote.statusColor}`}
                          >
                            {quote.status}
                          </span>
                        </td>
                        <td
                          className={`hidden px-6 py-4 md:table-cell ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {quote.validUntil}
                        </td>
                        <td
                          className={`hidden px-6 py-4 md:table-cell ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {quote.salesperson}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className={`px-6 py-16 text-center text-sm ${
                          isDark ? "text-white/45" : "text-black/45"
                        }`}
                      >
                        No quotes matched the current search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredQuotesData.length > 0 && totalListPages > 1 ? (
              <div
                className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 md:flex-row md:items-center md:justify-between ${
                  isDark ? "border-[#3D3D3D] bg-[#161616]" : "border-[#E5E5E5] bg-[#FFFCF6]"
                }`}
              >
                <div className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                  Showing {listStartIndex + 1} to{" "}
                  {Math.min(listStartIndex + QUOTES_PER_PAGE, totalFilteredQuotes)} of{" "}
                  {totalFilteredQuotes} results
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark
                        ? "border-[#333333] bg-[#101010] text-white/60 hover:bg-white/10 hover:text-white"
                        : "border-[#E5E5E5] bg-white text-[#333333] hover:bg-black/5"
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {paginationItems.map((item, index) =>
                      item === "..." ? (
                        <span
                          key={`pagination-gap-${index}`}
                          className={`px-2 text-xs ${
                            isDark ? "text-white/30" : "text-black/30"
                          }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            safeCurrentPage === item
                              ? "bg-[#E5D5B8] text-black"
                              : isDark
                                ? "text-white/60 hover:bg-white/5 hover:text-white"
                                : "text-[#666666] hover:bg-black/5"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalListPages, prev + 1))}
                    disabled={safeCurrentPage === totalListPages}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      isDark
                        ? "border-[#333333] bg-[#101010] text-white/60 hover:bg-white/10 hover:text-white"
                        : "border-[#E5E5E5] bg-white text-[#333333] hover:bg-black/5"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
