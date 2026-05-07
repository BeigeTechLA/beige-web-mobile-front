"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (source: JsonRecord, key: string) => (isRecord(source[key]) ? source[key] : undefined);

const getText = (value: unknown) => (typeof value === "string" ? value : "");

const toNumber = (value: unknown) => {
  const numericValue = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatMoney = (value: unknown, sign: "none" | "plus" | "minus" = "none") => {
  const amount = Math.abs(toNumber(value));
  if (!amount) return sign === "none" ? moneyFormatter.format(0) : "-";
  const prefix = sign === "plus" ? "+" : sign === "minus" ? "-" : "";
  return `${prefix}${moneyFormatter.format(amount)}`;
};

export default function StudioOperationsLedger({ rows, loading = false }: { rows: JsonRecord[]; loading?: boolean }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <section className={`rounded-xl border p-4 lg:p-5 ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-[#101010]"}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2 className="text-sm font-medium lg:text-base">Earnings Ledger</h2>
        </div>
        <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>{rows.length} entries</p>
      </div>

      {loading ? (
        <div className={`rounded-xl py-12 text-center text-sm ${isDark ? "bg-[#101010] text-white/40" : "bg-[#F4F5F7] text-black/40"}`}>
          Loading ledger...
        </div>
      ) : rows.length === 0 ? (
        <div className={`rounded-xl py-12 text-center text-sm ${isDark ? "bg-[#101010] text-white/40" : "bg-[#F4F5F7] text-black/40"}`}>
          No ledger entries found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className={isDark ? "text-white/60" : "text-black/60"}>
                <tr className={`border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
                  {["Date", "Studio Name", "Booking ID", "Hours", "Base Revenue", "Overtime", "Platform Fee", "Net Earnings"].map((heading) => (
                    <th key={heading} className="pb-4 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const studio = getRecord(row, "studio");
                  const studioInfo = studio ? getRecord(studio, "info") : undefined;
                  const bookingId = row.booking_id || row.id || row.studio_booking_id || `row-${index}`;
                  return (
                    <tr key={bookingId} className={`border-b last:border-b-0 ${isDark ? "border-white/5" : "border-black/5"}`}>
                      <td className="py-5">{formatDate(row.date || row.booking_date || row.created_at)}</td>
                      <td className="py-5 font-medium">{getText(row.studio_name) || getText(studioInfo?.space_title) || getText(studio?.name) || "-"}</td>
                      <td className="py-5">#{bookingId}</td>
                      <td className="py-5">{String(row.hours ?? "-")}{row.hours ? "h" : ""}</td>
                      <td className="py-5">{formatMoney(row.base_revenue)}</td>
                      <td className="py-5 text-[#E5A34D]">{formatMoney(row.overtime_amount ?? row.overtime, "plus")}</td>
                      <td className="py-5 text-[#E05252]">{formatMoney(row.platform_fee, "minus")}</td>
                      <td className="py-5 font-medium">{formatMoney(row.net_earnings ?? row.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {rows.map((row, index) => {
              const studio = getRecord(row, "studio");
              const studioInfo = studio ? getRecord(studio, "info") : undefined;
              const bookingId = row.booking_id || row.id || row.studio_booking_id || `row-${index}`;
              return (
                <div key={bookingId} className={`rounded-lg border p-4 text-xs ${isDark ? "border-white/10 bg-[#101010]" : "border-black/10 bg-[#F4F5F7]"}`}>
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{getText(row.studio_name) || getText(studioInfo?.space_title) || getText(studio?.name) || "Studio"}</p>
                      <p className={isDark ? "text-white/45" : "text-black/45"}>{formatDate(row.date || row.booking_date || row.created_at)} - #{bookingId}</p>
                    </div>
                    <p className="font-semibold text-[#E5D5B8]">{formatMoney(row.net_earnings ?? row.net)}</p>
                  </div>
                  <div className={`grid grid-cols-2 gap-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
                    <p>Hours: <span className={isDark ? "text-white" : "text-black"}>{String(row.hours ?? "-")}{row.hours ? "h" : ""}</span></p>
                    <p>Base: <span className={isDark ? "text-white" : "text-black"}>{formatMoney(row.base_revenue)}</span></p>
                    <p>Overtime: <span className="text-[#E5A34D]">{formatMoney(row.overtime_amount ?? row.overtime, "plus")}</span></p>
                    <p>Fee: <span className="text-[#E05252]">{formatMoney(row.platform_fee, "minus")}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
