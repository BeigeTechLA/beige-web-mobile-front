"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { AnalyticsFilters, initialAnalyticsFilters, QuoteAnalyticsFilters } from "./QuoteAnalyticsFilters";
import { QuoteAnalyticsOverview, QuotePipeline } from "./QuoteAnalyticsOverview";
import { currency, quoteAnalyticsRecords } from "./types";

const rowsPerPage = 4;

export default function QuoteAnalyticsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<AnalyticsFilters>(initialAnalyticsFilters);
  const [page, setPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("value");
  const filteredRows = useMemo(() => quoteAnalyticsRecords.filter((record) => filters.quoteStatus === "All statuses" || record.status === filters.quoteStatus), [filters.quoteStatus]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const rows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const updateFilter = (key: keyof AnalyticsFilters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };

  return <><Topbar pathname="/admin/quotes/analytics" breadcrumbOverrides={{ analytics: "Quote Analytics" }} />
    <main className="min-h-full space-y-4 bg-[#101010] p-4 text-white lg:p-8" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div><h1 className="text-xl font-semibold">Quote Analytics</h1><p className="mt-1 text-xs text-white/50">Monitor quote performance, conversion, revenue, and pipeline health.</p></div>
      <QuoteAnalyticsFilters filters={filters} visible={filtersVisible} onToggle={() => setFiltersVisible((visible) => !visible)} onChange={updateFilter} />
      <QuoteAnalyticsOverview selectedMetric={selectedMetric} onMetricClick={setSelectedMetric} />
      <QuotePipeline />
      <section className="overflow-x-auto rounded-xl border border-[#2c2c2c] bg-[#171717]"><table className="min-w-[900px] w-full text-left text-xs"><thead className="border-b border-white/10 text-[10px] text-[#ead7b0]"><tr>{["Rep", "Quote Sent", "Quote Value", "Deal Won", "Win Rate", "Won Revenue", "Avg. Deal Size", "Open Pipeline", "Follow-ups", ""].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{rows.map((record) => <tr key={record.id} onClick={() => router.push(`/admin/quotes/analytics/${record.id}`)} className="cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.04]"><td className="px-4 py-3 font-medium">{record.client}</td><td className="px-4 py-3">{record.dealWon + 30}</td><td className="px-4 py-3">{currency(record.quoteValue)}</td><td className="px-4 py-3">{record.dealWon}</td><td className="px-4 py-3">{record.winRate}%</td><td className="px-4 py-3">{currency(record.wonRevenue)}</td><td className="px-4 py-3">{currency(record.averageDealSize)}</td><td className="px-4 py-3">{currency(record.openPipeline)}</td><td className="px-4 py-3"><span className="rounded-full bg-[#f2deb8] px-3 py-1 text-[10px] text-black">{record.followUps} overdue</span></td><td className="px-4 py-3"><Link onClick={(event) => event.stopPropagation()} aria-label={`View ${record.client} details`} href={`/admin/quotes/analytics/${record.id}`} className="text-[#E8D1AB] hover:text-white"><ExternalLink size={15} /></Link></td></tr>)}</tbody><tfoot><tr className="border-t border-white/10 bg-[#101010]"><td colSpan={10} className="px-4 py-3"><div className="flex items-center justify-between"><span className="text-xs text-white/55">Page {currentPage} to {Math.min(currentPage * rowsPerPage, filteredRows.length)}</span><div className="flex items-center gap-1"><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="p-2 text-white/50 disabled:opacity-30"><ChevronLeft size={14} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button key={item} onClick={() => setPage(item)} className={`grid h-7 w-7 place-items-center rounded border text-[10px] ${currentPage === item ? "border-[#8b7b5f] text-[#ead7b0]" : "border-transparent text-white/45 hover:text-white"}`}>{item}</button>)}<button aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="p-2 text-white/50 disabled:opacity-30"><ChevronRight size={14} /></button></div></div></td></tr></tfoot></table></section>
    </main></>;
}
