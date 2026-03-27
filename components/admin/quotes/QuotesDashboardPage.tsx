"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import QuotesEmptyState from "@/components/admin/quotes/QuotesEmptyState";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import {
  salesApi,
  type QuotesDashboardData,
  type SalesQuoteListItem,
  type QuotesListResponse,
} from "@/lib/api";
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
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Search,
} from "lucide-react";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
};

type QuotesDashboardPageProps = {
  createHref: string;
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
};

type ChartPoint = {
  name: string;
  value: number;
};

type DisplayQuoteRow = {
  id: string;
  client: string;
  location: string;
  initials: string;
  color: string;
  project: string;
  amount: string;
  status: string;
  statusColor: string;
  validUntil: string;
  salesperson: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number }>;
};

const AVATAR_COLORS = [
  "bg-[#FFF6E9] text-[#101010]",
  "bg-[#D6E6FF] text-[#4A90E2]",
  "bg-[#D6FFE6] text-[#27AE60]",
  "bg-[#FFD6E6] text-[#EB5757]",
  "bg-[#FFD1B6] text-[#D35400]",
  "bg-[#E6DBFF] text-[#9070FF]",
];

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded bg-white px-3 py-1 text-sm font-bold text-black shadow-lg">
      {payload[0].value ?? 0}
    </div>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getNumber = (...values: unknown[]) => {
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

  return 0;
};

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const formatDate = (value: string) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
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

const extractQuoteList = (data: QuotesListResponse["data"]) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const keys = ["quotes", "items", "results", "rows", "list", "data"] as const;
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value as SalesQuoteListItem[];
    }
  }

  return [];
};

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
    "Project details unavailable"
  );
  const salesperson = getText(
    quote.salesperson,
    quote.sales_person,
    quote.sales_rep_name,
    quote.sales_rep,
    quote.created_by_name,
    "N/A"
  );
  const status = getText(quote.quote_status, quote.status, "Draft");

  return {
    id: String(quote.quote_id ?? quote.id ?? index),
    client,
    location: getText(quote.location, quote.client_address, quote.address, "Location not specified"),
    initials: getInitials(client),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    project,
    amount: formatAmount(getNumber(quote.total_amount, quote.total, quote.amount)),
    status,
    statusColor: getStatusColor(status),
    validUntil: formatDate(getText(quote.valid_until, quote.expires_at)),
    salesperson,
  };
};

export default function QuotesDashboardPage({
  createHref,
  TopbarComponent,
}: QuotesDashboardPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStat, setSelectedStat] = useState("Total Quotes");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dashboardData, setDashboardData] = useState<QuotesDashboardData | null>(null);
  const [quotes, setQuotes] = useState<SalesQuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotesData = async () => {
      setLoading(true);

      try {
        const [dashboardResponse, listResponse] = await Promise.all([
          salesApi.getQuotesDashboard(),
          salesApi.getQuotesList(),
        ]);

        setDashboardData(dashboardResponse.success ? dashboardResponse.data : null);
        setQuotes(listResponse.success ? extractQuoteList(listResponse.data) : []);
      } catch (error) {
        console.error("Failed to fetch quotes data", error);
        setDashboardData(null);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotesData();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const statsIcons: Record<string, React.ReactNode> = {
    "Total Quotes": <FileText className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Accepted Quotes": <BadgeCheck className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Pending Quotes": <Clock className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Draft Quotes": <Calendar className="fill-[#E8D1AB] stroke-black" size={20} />,
  };

  const displayStats = dashboardData?.overview
    ? [
        { title: "Total Quotes", value: String(dashboardData.overview.total_quotes ?? 0) },
        { title: "Accepted Quotes", value: String(dashboardData.overview.accepted_quotes ?? 0) },
        { title: "Pending Quotes", value: String(dashboardData.overview.pending_quotes ?? 0) },
        { title: "Draft Quotes", value: String(dashboardData.overview.draft_quotes ?? 0) },
      ]
    : [
        { title: "Total Quotes", value: "0" },
        { title: "Accepted Quotes", value: "0" },
        { title: "Pending Quotes", value: "0" },
        { title: "Draft Quotes", value: "0" },
      ];

  const displayChartData = useMemo<ChartPoint[]>(
    () =>
      (dashboardData?.chart ?? []).map((item, index) => ({
        name: item.label || `Item ${index + 1}`,
        value: Number(item.quote_count ?? 0),
      })),
    [dashboardData]
  );

  const displayQuotesData = useMemo(
    () => quotes.map((quote, index) => normalizeQuoteRow(quote, index)),
    [quotes]
  );

  const hasOverviewData = Boolean(
    (dashboardData?.overview &&
      (
        Number(dashboardData.overview.total_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.accepted_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.pending_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.draft_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.rejected_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.expired_quotes ?? 0) > 0 ||
        Number(dashboardData.overview.total_amount ?? 0) > 0
      )) ||
      displayChartData.length > 0
  );

  const overviewMeta = dashboardData?.overview
    ? [
        { label: "Rejected Quotes", value: String(dashboardData.overview.rejected_quotes ?? 0) },
        { label: "Expired Quotes", value: String(dashboardData.overview.expired_quotes ?? 0) },
        {
          label: "Total Amount",
          value: formatCurrency(Number(dashboardData.overview.total_amount ?? 0)),
        },
      ]
    : [];

  const showEmptyState = !loading && !hasOverviewData && displayQuotesData.length === 0;

  return (
    <div className="min-h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <TopbarComponent
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50"
            >
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <Link href={createHref}>
              <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Create New Quote
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 lg:p-10">
        <div className="mb-8 flex items-start justify-between">
          <div className="max-w-1/2">
            <h1 className="mb-2 font-semibold lg:text-2xl">Quotes Module</h1>
            <p className="text-xs text-[#FFFFFFB2] lg:text-sm">
              Manage and track all your client quotations.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {hasOverviewData && (
          <div className="rounded-3xl border border-[#3D3D3D] bg-[#171717] p-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#E5D5B8]" />
              <span className="text-sm font-medium">Overview</span>
              <div className="ml-auto">
                <button className="flex items-center gap-2 rounded-full border border-[#807E7E] bg-zinc-900 px-3 py-1 text-[10px] text-zinc-400">
                  Month <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-4">
              {displayStats.map((stat) => {
                const isSelected = selectedStat === stat.title;
                const bgColor = isSelected ? "bg-[#E5D5B8]" : "bg-[#161616]";
                const textColor = isSelected ? "text-[#101010]" : "text-white";
                const iconBg = isSelected ? "bg-[#171717]" : "bg-white/5";

                return (
                  <div
                    key={stat.title}
                    onClick={() => setSelectedStat(stat.title)}
                    className={`${bgColor} ${textColor} flex h-40 cursor-pointer flex-col justify-between rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium opacity-80">{stat.title}</span>
                      <div className={`${iconBg} rounded-full p-2 text-[#E8D1AB]`}>
                        {statsIcons[stat.title]}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-2xl font-bold lg:text-4xl">{stat.value}</div>
                      <span className={`text-xs ${isSelected ? "text-[#101010]/70" : "text-white/60"}`}>
                        Live data
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {overviewMeta.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-3">
                {overviewMeta.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-[#3D3D3D] bg-[#101010] px-3 py-1 text-xs text-white/70"
                  >
                    <span>{item.label}: </span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 h-80 w-full">
              {displayChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayChartData}>
                    <defs>
                      <linearGradient id="quotesChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E5D5B8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E5D5B8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#555", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#555", fontSize: 12 }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#E5D5B8", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#E5D5B8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#quotesChartFill)"
                      activeDot={{ r: 6, fill: "#fff", stroke: "#E5D5B8", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#3D3D3D] bg-[#101010] text-sm text-white/45">
                  No chart data available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[32px] border border-[#3D3D3D] bg-[#161616]">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Loader2 size={18} className="animate-spin text-[#E5D5B8]" />
              Loading quotes...
            </div>
          </div>
        ) : showEmptyState ? (
          <QuotesEmptyState createHref={createHref} />
        ) : displayQuotesData.length > 0 ? (
          <>
            <div className="mb-6 mt-8 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by client name or project..."
                  className="w-full rounded-xl border border-[#FFFFFF33] bg-[#202020] py-3 pl-12 pr-4 text-sm transition-colors focus:border-[#E5D5B8]/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button className="flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-[#3D3D3D] bg-[#161616] px-4 py-3 text-sm text-zinc-400">
                  All Salesperson <ChevronDown size={16} />
                </button>
                <button className="flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-[#3D3D3D] bg-[#161616] px-4 py-3 text-sm text-zinc-400">
                  All Status <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <div className="mb-20 overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#161616] md:mb-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="hidden rounded-b-lg border-b border-[#3D3D3D] bg-[#101010] text-sm capitalize text-[#E8D1AB] md:table-row">
                    <th className="px-6 py-4 font-medium">Client Name</th>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Quote Status</th>
                    <th className="px-6 py-4 font-medium">Valid Until</th>
                    <th className="px-6 py-4 font-medium">Salesperson</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                  <tr className="border-b border-[#3D3D3D] bg-[#101010] text-sm text-[#E8D1AB] md:hidden">
                    <th className="px-4 py-4 font-medium">Client Name</th>
                    <th className="px-4 py-4 text-right font-medium">Quote Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {displayQuotesData.map((quote) => {
                    const isExpanded = Boolean(expandedRows[quote.id]);

                    return (
                      <React.Fragment key={quote.id}>
                        <tr
                          onClick={() => window.innerWidth < 768 && toggleRow(quote.id)}
                          className={`
                            group cursor-pointer border-b border-[#3D3D3D]/50 transition-colors md:cursor-default md:border-none md:hover:bg-white/5
                            ${isExpanded ? "bg-[#202020] md:bg-[#171717]" : "hover:bg-white/5"}
                          `}
                        >
                          <td className="px-4 py-4 md:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`md:hidden rounded-full border p-1 ${isExpanded ? "border-[#E8D1AB] text-[#E8D1AB]" : "border-[#777674] text-[#777674]"}`}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quote.color} font-bold text-xs`}
                              >
                                {quote.initials}
                              </div>
                              <div>
                                <div className="font-medium">{quote.client}</div>
                                <div className="hidden text-sm text-white/40 md:block">
                                  {quote.location}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-6 py-4 text-white md:table-cell">
                            <p className="truncate">{quote.project}</p>
                          </td>
                          <td className="hidden px-6 py-4 font-medium md:table-cell">${quote.amount}</td>
                          <td className="px-4 py-4 text-right md:px-6 md:text-left">
                            <span
                              className={`rounded-full border px-3 py-1 text-[12px] font-medium md:text-base ${quote.statusColor}`}
                            >
                              {quote.status}
                            </span>
                          </td>
                          <td className="hidden px-6 py-4 text-white md:table-cell">
                            {quote.validUntil}
                          </td>
                          <td className="hidden px-6 py-4 text-white md:table-cell">
                            {quote.salesperson}
                          </td>
                          <td className="hidden px-6 py-4 text-right md:table-cell">
                            <button className="text-[#E8D1AB] transition-colors hover:text-white">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-[#3D3D3D]/50 bg-[#202020] md:hidden">
                            <td colSpan={2} className="space-y-4 px-4 py-6">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                  <p className="mb-1 text-xs uppercase tracking-wider text-[#F5F5F5]">
                                    Project
                                  </p>
                                  <p className="truncate whitespace-nowrap text-sm leading-snug text-[#A1A1A1]">
                                    {quote.project}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="mb-1 text-xs uppercase tracking-wider text-[#F5F5F5]">
                                    Amount
                                  </p>
                                  <p className="text-sm text-[#A1A1A1]">${quote.amount}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                                <div>
                                  <p className="mb-1 text-xs uppercase tracking-wider text-[#F5F5F5]">
                                    Valid Until
                                  </p>
                                  <p className="text-sm text-[#A1A1A1]">{quote.validUntil}</p>
                                </div>
                                <div>
                                  <p className="mb-1 text-xs uppercase tracking-wider text-[#F5F5F5]">
                                    Sales Person
                                  </p>
                                  <p className="text-xs text-[#A1A1A1]">{quote.salesperson}</p>
                                </div>
                                <div className="text-right">
                                  <p className="mb-1 text-xs uppercase tracking-wider text-[#F5F5F5]">
                                    Action
                                  </p>
                                  <div className="flex justify-end">
                                    <button className="rounded-lg p-2 text-[#E8D1AB] transition-colors hover:bg-[#2a2a2a]">
                                      <MoreHorizontal size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      {!loading && !showEmptyState && (
        <div className="fixed bottom-0 left-0 right-0 z-[40] flex gap-2 bg-[#0f0f0f] px-6 pb-6 lg:hidden">
          <Button
            onClick={() => router.push(createHref)}
            className="h-14 w-full rounded-md border border-white/20 bg-[#E5D5B8] text-sm font-semibold text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-transform hover:bg-[#d4c3a3] active:scale-[0.98]"
          >
            Create New Quote
          </Button>
        </div>
      )}
    </div>
  );
}
