"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Loader2,
  Play,
  UserRound,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import QuoteCallDetailsDrawer, {
  type QuoteCallDetail,
  type QuoteCallTranscriptLine,
} from "@/components/admin/quotes/history/QuoteCallDetailsDrawer";

type Props = { quoteId: string };

type RawCall = Record<string, unknown>;

const TEMP_QUOTE_CALLS: QuoteCallDetail[] = [
  {
    id: "temp-quote-call-1",
    contactName: "Lana Guzman",
    phone: "+1 (424) 555-0182",
    direction: "incoming",
    dateLabel: "Today",
    timeLabel: "9:10 AM",
    durationLabel: "05:48",
    handledBy: "Marcus Reid (Los Angeles)",
    status: "Completed",
    summary: "Location change and crew briefing",
    nextSteps: [
      "Update shoot location to Westside Warehouse",
      "Send morning call sheet by 8 PM tonight",
      "Brief CP team on new lighting requirements",
      "Arrange parking passes for crew",
    ],
    transcript: [
      { id: "temp-q-1", timestamp: "00:08", speaker: "John Smith", text: '"Morning Marcus. Just confirming — the location changed to the Westside warehouse, building 4."' },
      { id: "temp-q-2", timestamp: "00:18", speaker: "Marcus Reid (Los Angeles)", text: '"Got it. I’ll update the team now. Any specific notes for the space?"' },
      { id: "temp-q-3", timestamp: "00:29", speaker: "John Smith", text: '"Yes — the natural light comes from the east so we want to start by 7:30 to catch the morning window."' },
      { id: "temp-q-4", timestamp: "00:44", speaker: "Marcus Reid (Los Angeles)", text: '"Perfect. We’ll adjust the call time to 7 AM. I’ll send an updated call sheet tonight."' },
    ],
  },
  {
    id: "temp-quote-call-2",
    contactName: "Lana Guzman",
    phone: "+1 (424) 555-0182",
    direction: "outgoing",
    dateLabel: "Sep 20, 2026",
    timeLabel: "4:30 PM",
    durationLabel: "03:26",
    handledBy: "Marcus Reid (Los Angeles)",
    status: "Completed",
    summary: "Production requirements confirmation",
    nextSteps: ["Confirm final production requirements", "Share updated production notes with the crew"],
    transcript: [],
  },
  {
    id: "temp-quote-call-3",
    contactName: "Lana Guzman",
    phone: "+1 (424) 555-0182",
    direction: "outgoing",
    dateLabel: "Sep 20, 2026",
    timeLabel: "4:30 PM",
    durationLabel: "04:11",
    handledBy: "Marcus Reid (Los Angeles)",
    status: "Completed",
    summary: "Production requirements confirmation",
    nextSteps: [],
    transcript: [],
  },
  {
    id: "temp-quote-call-4",
    contactName: "Lana Guzman",
    phone: "+1 (424) 555-0182",
    direction: "outgoing",
    dateLabel: "Sep 20, 2026",
    timeLabel: "4:30 PM",
    durationLabel: "02:54",
    handledBy: "Marcus Reid (Los Angeles)",
    status: "Completed",
    summary: "Production requirements confirmation",
    nextSteps: [],
    transcript: [],
  },
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const firstArray = (...values: unknown[]) => {
  for (const value of values) if (Array.isArray(value)) return value;
  return [];
};

const formatCallDate = (value: string) => {
  if (!value) return { date: "Date unavailable", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value, time: "" };

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return {
    date: isToday
      ? "Today"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
};

const secondsToDuration = (value: unknown) => {
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) return value;
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

const normalizeTranscript = (raw: RawCall): QuoteCallTranscriptLine[] => {
  const lines = firstArray(raw.transcript, raw.transcript_lines, raw.transcription);
  return lines.flatMap((value, index) => {
    const row = asRecord(value);
    if (!row) return [];
    const text = firstText(row.text, row.message, row.content);
    if (!text) return [];
    return [{
      id: firstText(row.id, `${index}`),
      timestamp: firstText(row.timestamp, row.time, row.offset, "00:00"),
      speaker: firstText(row.speaker, row.speaker_name, row.name, "Speaker"),
      text,
    }];
  });
};

const normalizeCall = (value: unknown, index: number): QuoteCallDetail | null => {
  const raw = asRecord(value);
  if (!raw) return null;

  const createdAt = firstText(raw.started_at, raw.called_at, raw.created_at, raw.timestamp);
  const formatted = formatCallDate(createdAt);
  const directionText = firstText(raw.direction, raw.call_type, raw.type).toLowerCase();
  const direction: QuoteCallDetail["direction"] = directionText.includes("out") ? "outgoing" : "incoming";
  const handledByRecord = asRecord(raw.handled_by) || asRecord(raw.agent) || asRecord(raw.owner);
  const contactRecord = asRecord(raw.contact) || asRecord(raw.client) || asRecord(raw.customer);
  const nextStepsRaw = firstArray(raw.next_steps, raw.action_items, raw.actions);

  return {
    id: firstText(raw.id, raw.call_id, raw.history_id, `call-${index}`),
    contactName: firstText(raw.contact_name, raw.client_name, raw.customer_name, contactRecord?.name, "Client"),
    phone: firstText(raw.phone, raw.phone_number, raw.from_number, raw.to_number),
    direction,
    dateLabel: formatted.date,
    timeLabel: formatted.time,
    durationLabel: secondsToDuration(raw.duration ?? raw.duration_seconds),
    handledBy: firstText(raw.handled_by_name, raw.agent_name, handledByRecord?.name, "Unknown"),
    status: firstText(raw.status, "Completed"),
    summary: firstText(raw.summary, raw.call_summary, raw.notes),
    nextSteps: nextStepsRaw.map((item) => firstText(asRecord(item)?.text, asRecord(item)?.title, item)).filter(Boolean),
    recordingUrl: firstText(raw.recording_url, raw.audio_url, raw.recording) || undefined,
    transcript: normalizeTranscript(raw),
  };
};

const extractCalls = (quote: SalesQuoteDetailData | null): QuoteCallDetail[] => {
  const record = asRecord(quote);
  const source = firstArray(record?.call_history, record?.callHistory, record?.calls, record?.phone_calls);
  return source.map(normalizeCall).filter((item): item is QuoteCallDetail => Boolean(item));
};

export default function QuoteCallHistoryPage({ quoteId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();
  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCall, setSelectedCall] = useState<QuoteCallDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salesApi.getQuoteDetail(quoteId);
      const detail = unwrapSalesQuoteDetail(response?.data ?? null);
      if (!detail) throw new Error("Quote details are unavailable");

      const optionalCallApi = (salesApi as unknown as {
        getQuoteCallHistory?: (id: string) => Promise<{ data?: unknown; success?: boolean }>;
      }).getQuoteCallHistory;

      if (typeof optionalCallApi === "function") {
        try {
          const callResponse = await optionalCallApi.call(salesApi, quoteId);
          const callPayload = asRecord(callResponse?.data);
          const rows = firstArray(
            callPayload?.history,
            callPayload?.calls,
            callPayload?.items,
            callResponse?.data
          );
          if (rows.length > 0) {
            setQuote({ ...(detail as SalesQuoteDetailData), call_history: rows } as SalesQuoteDetailData);
            return;
          }
        } catch (callError) {
          console.error("Quote call-history endpoint failed; using quote detail payload", callError);
        }
      }

      setQuote(detail);
    } catch (loadError) {
      console.error("Failed to load quote call history", loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load call history");
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => { void load(); }, [load]);

  const calls = useMemo(() => {
    const realCalls = extractCalls(quote);
    return realCalls.length > 0 ? realCalls : TEMP_QUOTE_CALLS;
  }, [quote]);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0D0D0D] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <div className="sticky top-0 z-40">
        <Topbar
          pathname={pathname}
          breadcrumbOverrides={{ quotes: "Quotes Details", [quoteId]: "Quotes Details", "call-history": "Call History" }}
        />
      </div>

      <main className="px-4 pb-12 pt-7 lg:px-10 lg:pt-10">
        <button
          type="button"
          onClick={() => router.push(`/admin/quotes/${quoteId}`)}
          className={`mb-8 inline-flex items-center gap-2 text-sm ${isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"}`}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <section className={`overflow-hidden rounded-2xl border ${isDark ? "border-[#323232] bg-[#171717]" : "border-black/10 bg-white"}`}>
          <div className="px-6 py-7 lg:px-8 lg:py-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium">Call History</h1>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#E8D1AB] px-2 text-sm font-semibold text-black">{calls.length}</span>
            </div>
            <p className={`mt-1 text-sm ${isDark ? "text-white/35" : "text-black/45"}`}>View customer conversations related to this quote.</p>
          </div>
          <div className={`border-t border-dashed ${isDark ? "border-white/20" : "border-black/15"}`} />

          <div className="p-5 lg:p-8">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm text-white/45">
                <Loader2 size={20} className="animate-spin text-[#E8D1AB]" /> Loading call history...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-10 text-center text-sm text-red-400">{error}</div>
            ) : calls.length === 0 ? (
              <div className={`rounded-xl border px-6 py-16 text-center ${isDark ? "border-white/10 bg-[#0E0E0E] text-white/40" : "border-black/10 bg-[#F8F8F8] text-black/45"}`}>
                No call history is available for this quote.
              </div>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <div key={call.id} className={`rounded-lg border px-5 py-5 ${isDark ? "border-[#242424] bg-[#0E0E0E]" : "border-black/10 bg-white"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${call.direction === "incoming" ? "bg-[#2A2419] text-[#E8D1AB]" : "bg-[#242424] text-white/45"}`}>
                          {call.direction === "incoming" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{call.contactName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="text-[#D8BC87]">{call.direction === "incoming" ? "Incoming call" : "Outgoing call"}</span>
                            <span className="text-white/25">·</span>
                            <span className="text-emerald-400">{call.dateLabel}</span>
                            <span className="text-white/25">·</span>
                            <span className={isDark ? "text-white/45" : "text-black/45"}>{call.timeLabel}</span>
                          </div>
                          <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/50"}`}>{call.summary || "No summary available"}</p>
                          <p className={`mt-3 flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>
                            <UserRound size={14} /> Handled by <span className={isDark ? "text-white/70" : "text-black/70"}>{call.handledBy}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 lg:max-w-[390px]">
                        <span className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{call.phone}</span>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">{call.status}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#4F4432] bg-[#211E18] px-2.5 py-1 text-xs text-[#E8D1AB]"><Play size={11} /> Recording</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${call.transcript.length > 0 ? "border-white/10 text-white/55" : "border-white/5 text-white/20"}`}><FileText size={11} /> Transcript</span>
                        <button type="button" onClick={() => setSelectedCall(call)} className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
                          View call <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <QuoteCallDetailsDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  );
}
