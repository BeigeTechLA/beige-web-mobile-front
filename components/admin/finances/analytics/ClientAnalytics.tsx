"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { financeTransactionsApi, type FinanceClients } from "@/lib/api/financeTransactions";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight, Info, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientAnalyticsProps = {
  isDark: boolean;
  selectedDate?: Date | null;
};

type ClientMode = "shoots" | "spend";

type SpendActiveDotProps = {
  cx?: number;
  cy?: number;
  value?: number;
  isDark: boolean;
};

function SpendActiveDot({ cx, cy, value, isDark }: SpendActiveDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  const label = `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0))} Spend`;
  const boxWidth = 112;
  const boxHeight = 32;
  const boxX = cx - boxWidth / 2;
  const boxY = cy - 61;

  return (
    <g pointerEvents="none">
      <line
        x1={cx}
        x2={cx}
        y1={boxY + boxHeight}
        y2={cy - 11}
        stroke="#E8D1AB"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <rect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        rx={7}
        fill="#FFFFFF"
      />

      <text
        x={cx}
        y={boxY + 21}
        textAnchor="middle"
        fill="#171717"
        fontSize="13"
        fontWeight="700"
      >
        {label}
      </text>

      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={isDark ? "#101010" : "#FFFFFF"}
        stroke="#E8D1AB"
        strokeWidth={3}
      />
    </g>
  );
}

function FilterSelect({
  value,
  onChange,
  width,
  items,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  width: string;
  items: Array<{ value: string; label: string }>;
  isDark: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 rounded-full text-[10px] shadow-none focus:ring-0 lg:text-xs ${width} ${
          isDark
            ? "border-[#3D3D3D] bg-zinc-900 text-white/70"
            : "border-[#E3E3E3] bg-white text-[#323232]"
        }`}
      >
        <SelectValue placeholder="Status" />
      </SelectTrigger>

      <SelectContent
        className={
          isDark
            ? "border-[#3D3D3D] bg-[#111111] text-white"
            : "border-[#E3E3E3] bg-white text-black"
        }
      >
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ClientAnalytics({
  isDark,
  selectedDate,
}: ClientAnalyticsProps) {
  const [mode, setMode] = useState<ClientMode>("shoots");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<FinanceClients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, mode, selectedDate, status]);

  useEffect(() => {
    let cancelled = false;
    const selected = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

    setLoading(true);
    setError(null);

    void financeTransactionsApi.getFinanceClients({
      date_from: selected,
      date_to: selected,
      sort_by: mode === "shoots" ? "shoot" : "spend",
      status: status ? Number(status) : undefined,
      search: debouncedSearch.trim() || undefined,
      page: currentPage,
      limit: 10,
    }).then((response) => {
      if (!cancelled) setData(response.data);
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load client analytics.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [currentPage, debouncedSearch, mode, selectedDate, status]);

  const clients = data?.top_clients.rows ?? [];
  const spendTrend = data?.avg_client_spend_per_shoot.graph ?? [];
  const distribution = data?.shoot_distribution ?? [];
  const pagination = data?.top_clients.pagination;
  const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);

  return (
    <section
      className={`w-full rounded-2xl border p-5 transition-colors duration-300 lg:p-6 ${
        isDark
          ? "border-[#3D3D3D] bg-[#171717] text-white"
          : "border-[#E5E5E5] bg-white text-[#202020]"
      }`}
    >
      <div className="mb-5 flex items-center gap-2 lg:mb-6">
        <span className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
        <p className="text-sm font-medium lg:text-base">Client Analytics</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div
          className={`self-start overflow-hidden rounded-xl border ${
            isDark ? "border-white/5 bg-[#101010]" : "border-[#E3E3E3] bg-white"
          }`}
        >
          <div
            className={`border-b p-5 ${
              isDark
                ? "border-[#3D3D3D] bg-[#101010]"
                : "border-[#E3E3E3] bg-[#FFFCF6]"
            }`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium lg:text-base">
                    Top Clients
                  </span>
                  <Info size={11} className="text-[#E8D1AB]" />
                </div>

                <div
                  className={`inline-flex rounded-full border p-0.5 ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#171717]"
                      : "border-[#E3E3E3] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setMode("shoots")}
                    className={`rounded-full px-3 py-1 text-[10px] transition-colors lg:text-xs ${
                      mode === "shoots"
                        ? "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/50 hover:text-white"
                          : "text-black/50 hover:text-black"
                    }`}
                  >
                    By Shoot
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("spend")}
                    className={`rounded-full px-3 py-1 text-[10px] transition-colors lg:text-xs ${
                      mode === "spend"
                        ? "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/50 hover:text-white"
                          : "text-black/50 hover:text-black"
                    }`}
                  >
                    By Spend
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  value={status}
                  onChange={(value) => setStatus(value === "all" ? "" : value)}
                  width="w-[92px]"
                  isDark={isDark}
                  items={[
                    { value: "all", label: "Status" },
                    { value: "0", label: "0" },
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3", label: "3" },
                    { value: "4", label: "4" },
                    { value: "5", label: "5" },
                  ]}
                />
              </div>
            </div>

            <div className="relative mt-4 flex items-center">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-[#666]" : "text-[#999]"
                }`}
                size={16}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by Client Name..."
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-xs outline-none transition-colors lg:text-sm ${
                  isDark
                    ? "border-[#3D3D3D] bg-[#1A1A1A] text-white placeholder:text-white/30 focus:border-white/25"
                    : "border-[#E3E3E3] bg-white text-black placeholder:text-black/35 focus:border-[#D6C19D]"
                }`}
              />
            </div>
          </div>

          <div
            className={`grid grid-cols-[1fr_82px_105px] border-b px-5 py-3.5 text-xs ${
              isDark
                ? "border-white/5 text-[#E8D1AB]"
                : "border-[#E3E3E3] text-[#8D6F3F]"
            }`}
          >
            <span>Client Name</span>
            <span className="text-right">Shoots</span>
            <span className="text-right">Total Spend</span>
          </div>

          <div>
            {loading ? (<p className="p-8 text-center text-sm">Loading…</p>) : error ? (<p className="p-8 text-center text-sm text-red-500">{error}</p>) : clients.length === 0 ? (<p className="p-8 text-center text-sm">No data found</p>) : clients.map((client) => (
              <div
                key={client.client_key}
                className={`grid min-h-[58px] grid-cols-[1fr_82px_105px] items-center px-5 py-2 transition-colors ${
                  isDark ? "hover:bg-white/[0.025]" : "hover:bg-black/[0.02]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-medium text-black"
                    style={{ backgroundColor: "#F0E4CF" }}
                  >
                    {initials(client.client_name)}
                  </div>
                  <span className="truncate text-sm">{client.client_name}</span>
                </div>

                <span
                  className={`text-right text-sm ${
                    isDark ? "text-white/80" : "text-black/70"
                  }`}
                >
                  {client.shoots_count.toString().padStart(2, "0")}
                </span>

                <span
                  className={`text-right text-sm ${
                    isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                  }`}
                >
                  {formatMoney(client.total_spend)}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`flex items-center justify-between border-t p-5 text-sm ${
              isDark
                ? "border-t-white/5 bg-[#141414] text-white/60"
                : "border-t-[#E3E3E3] bg-white text-[#666]"
            }`}
          >
            <span>Page {pagination?.page ?? 1} to {Math.min((pagination?.page ?? 1) * (pagination?.limit ?? 10), pagination?.total ?? 0)}</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className={`flex items-center justify-center rounded-lg border p-2 transition-all ${
                  isDark
                    ? "border-[#333] bg-[#1A1A1A] text-white/60 hover:bg-white/10"
                    : "border-[#E5E5E5] bg-white text-[#333] hover:bg-zinc-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                    currentPage === page
                      ? "border-[#E5D5B8] bg-[#E5D5B8] text-black"
                      : isDark
                        ? "border-[#333] text-white/60 hover:bg-white/5"
                        : "border-[#E5E5E5] text-[#666] hover:bg-zinc-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className="px-1">...</span>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pagination?.total_pages ?? page, page + 1))}
                className={`flex items-center justify-center rounded-lg border p-2 transition-all ${
                  isDark
                    ? "border-[#333] bg-[#1A1A1A] text-white/60 hover:bg-white/10"
                    : "border-[#E5E5E5] bg-white text-[#333] hover:bg-zinc-50"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-xl border ${
              isDark
                ? "border-white/5 bg-[#101010]"
                : "border-[#E3E3E3] bg-white"
            }`}
          >
            <div
              className={`border-b px-5 py-4 ${
                isDark
                  ? "border-[#3D3D3D] bg-[#101010]"
                  : "border-[#E3E3E3] bg-[#FFFCF6]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium lg:text-base">
                  Average Client Spend Per Shoot
                </span>
                <Info size={11} className="text-[#E8D1AB]" />
              </div>
            </div>

            <div className="p-5">
              <p className="text-xl font-semibold lg:text-[26px]">{formatMoney(data?.avg_client_spend_per_shoot.total_avg ?? 0)}</p>
              <p
                className={`mt-1 text-xs ${
                  isDark ? "text-white/45" : "text-black/45"
                }`}
              >
                Total across all active clients
              </p>

              <div
                className={`my-4 h-px ${
                  isDark ? "bg-white/10" : "bg-black/10"
                }`}
              />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className={isDark ? "text-white/45" : "text-black/45"}>
                  <p>Top client</p>
                  <p className="mt-2">Top spend</p>
                </div>
                <div className="text-right">
                  <p>{data?.avg_client_spend_per_shoot.top_client ?? "-"}</p>
                  <p className="mt-2 text-[#E8D1AB]">{formatMoney(data?.avg_client_spend_per_shoot.top_spend ?? 0)}</p>
                </div>
              </div>

              <div className="mt-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={spendTrend}
                    margin={{ top: 14, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="clientSpendArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#E8D1AB"
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="95%"
                          stopColor="#E8D1AB"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    {/* Invisible tooltip activates the custom hover marker. */}
                    <Tooltip content={() => null} cursor={false} />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#E8D1AB"
                      strokeWidth={2}
                      fill="url(#clientSpendArea)"
                      dot={false}
                      activeDot={(props: any) => (
                        <SpendActiveDot
                          cx={props.cx}
                          cy={props.cy}
                          value={props.value}
                          isDark={isDark}
                        />
                      )}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-xl border ${
              isDark
                ? "border-white/5 bg-[#101010]"
                : "border-[#E3E3E3] bg-white"
            }`}
          >
            <div
              className={`border-b px-5 py-4 text-sm font-medium lg:text-base ${
                isDark
                  ? "border-[#3D3D3D] bg-[#101010]"
                  : "border-[#E3E3E3] bg-[#FFFCF6]"
              }`}
            >
              Shoot Distribution
            </div>

            <div className="space-y-3.5 p-5">
              {distribution.map((item) => (
                <div key={item.client_key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-xs">{item.client_name}</span>
                    <span className="text-[11px] text-[#E8D1AB]">
                      {item.shoots_count} shoots
                    </span>
                  </div>

                  <div
                    className={`h-[2px] ${
                      isDark ? "bg-white/20" : "bg-black/10"
                    }`}
                  >
                    <div
                      className="h-full bg-[#E8D1AB]"
                      style={{ width: `${item.bar_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
