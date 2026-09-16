"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { QuoteAnalyticsOverview, QuotePipeline } from "./QuoteAnalyticsOverview";
import { quoteAnalyticsRecords } from "./types";

export default function QuoteAnalyticsDetailPage({ quoteId }: { quoteId: string }) {
  const quote = quoteAnalyticsRecords.find((item) => item.id === quoteId) ?? quoteAnalyticsRecords[0];
  const [selectedMetric, setSelectedMetric] = useState("value");
  const dealWonCards = ["QS-1001", "QS-1008", "QS-1012"];
  const overdueCards = ["QS-1014"];
  return <><Topbar pathname={`/admin/quotes/analytics/${quoteId}`} breadcrumbOverrides={{ analytics: "Quote Analytics", [quoteId]: "Quote Details" }} />
    <main className="min-h-full space-y-4 bg-[#101010] p-4 text-white lg:p-8" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <Link href="/admin/quotes/analytics" className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"><ArrowLeft size={15} /> Back</Link>
      <section className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#151515] p-4"><div className="grid h-10 w-10 place-items-center rounded bg-[#c5b7f6] font-semibold text-[#171717]">{quote.client.split(" ").map((name) => name[0]).join("")}</div><div><h1 className="text-sm font-semibold">{quote.client}</h1><p className="text-xs text-white/50">{quote.email}</p></div></section>
      <QuoteAnalyticsOverview selectedMetric={selectedMetric} onMetricClick={setSelectedMetric} />
      <QuotePipeline />
      <section className="grid gap-3 xl:grid-cols-2"><QuoteDealColumn title="Deal Won" count="12" cards={dealWonCards} quoteId={quoteId} /><QuoteDealColumn title="Overdue" count="01" cards={overdueCards} quoteId={quoteId} sent /></section>
    </main></>;
}

function QuoteDealColumn({ title, count, cards, quoteId, sent = false }: { title: string; count: string; cards: string[]; quoteId: string; sent?: boolean }) {
  return <section className="overflow-hidden rounded-xl border border-[#2c2c2c] bg-[#101010]"><header className="flex items-center justify-between border-b border-white/10 bg-[#202020] px-4 py-3 text-xs"><span className="text-[#ead7b0]">{title}</span><span>{count}</span></header><div className="max-h-[540px] space-y-3 overflow-y-auto p-3">{cards.map((id, index) => <Link key={id} href={`/admin/quotes/analytics/${quoteId}`} className="block rounded-xl border border-white/10 bg-[#202020] transition-colors hover:border-[#ead7b0]/50"><div className="flex items-start justify-between border-b border-white/10 p-3"><div className="flex gap-2"><div className="grid h-9 w-9 place-items-center rounded bg-[#f2e7c8] text-sm text-black">EC</div><div><p className="text-xs font-medium">Ethan Carter ({id})</p><p className="mt-1 text-[9px] text-white/45">ethan{index + 1}55@gmail.com</p></div></div><span className={`rounded-full px-4 py-1 text-[10px] ${sent ? "bg-[#a9ccff] text-[#1f568e]" : "bg-[#c7f5d5] text-[#14703a]"}`}>{sent ? "Sent" : "Accepted"}</span></div><div className="grid grid-cols-[1fr_auto] gap-y-2 p-3 text-[10px]"><span className="text-[#ead7b0]">Project</span><span>Corporate video pro...</span><span className="text-[#ead7b0]">Booking Status</span><span className="text-emerald-400">Converted to Booking</span><span className="text-[#ead7b0]">Amount</span><span>$13,475.70</span><span className="text-[#ead7b0]">Paid</span><span>$10,475.70</span><span className="text-[#ead7b0]">Pending</span><span className="text-[#d7b748]">$3000.00</span><span className="text-[#ead7b0]">Validity</span><span>April 15, 2026</span></div></Link>)}</div></section>;
}
