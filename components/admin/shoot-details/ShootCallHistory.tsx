"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, FileText, Play, UserRound } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { adminApi } from "@/lib/api";
import ShootCallDetailsDrawer, {
  type ShootCallRecord,
  type ShootCallTranscriptLine,
} from "@/components/admin/shoot-details/ShootCallDetailsDrawer";

type ShootProjectForCalls = Record<string, unknown> | null | undefined;

const TEMP_SHOOT_CALLS: ShootCallRecord[] = [
  {
    id: "temp-shoot-call-1",
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
      { id: "temp-s-1", timestamp: "00:08", speaker: "John Smith", text: '"Morning Marcus. Just confirming — the location changed to the Westside warehouse, building 4."' },
      { id: "temp-s-2", timestamp: "00:18", speaker: "Marcus Reid (Los Angeles)", text: '"Got it. I’ll update the team now. Any specific notes for the space?"' },
      { id: "temp-s-3", timestamp: "00:29", speaker: "John Smith", text: '"Yes — the natural light comes from the east so we want to start by 7:30 to catch the morning window."' },
      { id: "temp-s-4", timestamp: "00:44", speaker: "Marcus Reid (Los Angeles)", text: '"Perfect. We’ll adjust the call time to 7 AM. I’ll send an updated call sheet tonight."' },
    ],
  },
  {
    id: "temp-shoot-call-2",
    contactName: "Lana Guzman",
    phone: "+1 (424) 555-0182",
    direction: "outgoing",
    dateLabel: "Sep 20, 2026",
    timeLabel: "4:30 PM",
    durationLabel: "03:26",
    handledBy: "Marcus Reid (Los Angeles)",
    status: "Completed",
    summary: "Production requirements confirmation",
    nextSteps: ["Confirm production requirements", "Share the final notes with the production team"],
    transcript: [],
  },
];

type Props = {
  shootId: string;
  project: ShootProjectForCalls;
  previewLimit?: number;
};

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
  return {
    date: date.toDateString() === now.toDateString()
      ? "Today"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
};

const durationLabel = (value: unknown) => {
  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) return value;
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

const normalizeTranscript = (raw: Record<string, unknown>): ShootCallTranscriptLine[] => {
  const rows = firstArray(raw.transcript, raw.transcript_lines, raw.transcription);
  return rows.flatMap((value, index) => {
    const row = asRecord(value);
    if (!row) return [];
    const text = firstText(row.text, row.message, row.content);
    if (!text) return [];
    return [{
      id: firstText(row.id, index),
      timestamp: firstText(row.timestamp, row.time, row.offset, "00:00"),
      speaker: firstText(row.speaker, row.speaker_name, row.name, "Speaker"),
      text,
    }];
  });
};

const normalizeCall = (value: unknown, index: number): ShootCallRecord | null => {
  const raw = asRecord(value);
  if (!raw) return null;

  const contact = asRecord(raw.contact) || asRecord(raw.client) || asRecord(raw.customer);
  const handler = asRecord(raw.handled_by) || asRecord(raw.agent) || asRecord(raw.owner);
  const date = formatCallDate(firstText(raw.started_at, raw.called_at, raw.created_at, raw.timestamp));
  const directionText = firstText(raw.direction, raw.call_type, raw.type).toLowerCase();
  const steps = firstArray(raw.next_steps, raw.action_items, raw.actions);

  return {
    id: firstText(raw.id, raw.call_id, raw.history_id, `shoot-call-${index}`),
    contactName: firstText(raw.contact_name, raw.client_name, raw.customer_name, contact?.name, "Client"),
    phone: firstText(raw.phone, raw.phone_number, raw.from_number, raw.to_number),
    direction: directionText.includes("out") ? "outgoing" : "incoming",
    dateLabel: date.date,
    timeLabel: date.time,
    durationLabel: durationLabel(raw.duration ?? raw.duration_seconds),
    handledBy: firstText(raw.handled_by_name, raw.agent_name, handler?.name, "Unknown"),
    status: firstText(raw.status, "Completed"),
    summary: firstText(raw.summary, raw.call_summary, raw.notes),
    nextSteps: steps.map((item) => firstText(asRecord(item)?.text, asRecord(item)?.title, item)).filter(Boolean),
    recordingUrl: firstText(raw.recording_url, raw.audio_url, raw.recording) || undefined,
    transcript: normalizeTranscript(raw),
  };
};

const extractShootCalls = (project: ShootProjectForCalls) => {
  const record = asRecord(project);
  const rows = firstArray(record?.call_history, record?.callHistory, record?.calls, record?.phone_calls);
  return rows.map(normalizeCall).filter((call): call is ShootCallRecord => Boolean(call));
};

export default function ShootCallHistory({ shootId, project, previewLimit = 2 }: Props) {
  const { isDark } = useResolvedTheme();
  const projectCalls = useMemo(() => extractShootCalls(project), [project]);
  const [apiCalls, setApiCalls] = useState<ShootCallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<ShootCallRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    const optionalCallApi = (adminApi as unknown as {
      getProjectCallHistory?: (id: string) => Promise<{ data?: unknown; success?: boolean }>;
    }).getProjectCallHistory;

    if (typeof optionalCallApi !== "function" || !shootId) return;

    void optionalCallApi.call(adminApi, shootId)
      .then((response) => {
        if (cancelled) return;
        const payload = asRecord(response?.data);
        const rows = firstArray(payload?.history, payload?.calls, payload?.items, response?.data);
        const normalized = rows.map(normalizeCall).filter((call): call is ShootCallRecord => Boolean(call));
        setApiCalls(normalized);
      })
      .catch((error) => {
        console.error("Shoot call-history endpoint failed; using project detail payload", error);
      });

    return () => { cancelled = true; };
  }, [shootId]);

  const calls = apiCalls.length > 0
    ? apiCalls
    : projectCalls.length > 0
      ? projectCalls
      : TEMP_SHOOT_CALLS;
  const visibleCalls = calls.slice(0, previewLimit);

  if (calls.length === 0) return null;

  return (
    <section className={`border-t ${isDark ? "border-[#2D2D2D]" : "border-[#E5E5E5]"}`}>
      <div className="px-5 py-5 lg:px-6">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">Call History</h3>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#E8D1AB] px-2 text-xs font-semibold text-black">{calls.length}</span>
        </div>
        <p className={`mt-1 text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>View customer conversations related to this shoot.</p>
      </div>

      <div className="space-y-3 px-5 pb-5 lg:px-6">
        {visibleCalls.map((call) => (
          <div key={call.id} className={`rounded-lg border px-4 py-4 ${isDark ? "border-[#252525] bg-[#0E0E0E]" : "border-black/10 bg-white"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${call.direction === "incoming" ? "bg-[#2A2419] text-[#E8D1AB]" : isDark ? "bg-[#242424] text-white/45" : "bg-[#F0F0F0] text-black/45"}`}>
                  {call.direction === "incoming" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                </div>
                <div>
                  <p className="text-sm font-medium">{call.contactName}</p>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-xs">
                    <span className="text-[#D8BC87]">{call.direction === "incoming" ? "Incoming call" : "Outgoing call"}</span>
                    <span className="text-emerald-400">· {call.dateLabel}</span>
                    <span className={isDark ? "text-white/40" : "text-black/45"}>· {call.timeLabel}</span>
                  </div>
                  <p className={`mt-2 text-xs ${isDark ? "text-white/40" : "text-black/50"}`}>{call.summary || "No summary available"}</p>
                  <p className={`mt-3 flex items-center gap-1.5 text-[11px] ${isDark ? "text-white/35" : "text-black/45"}`}>
                    <UserRound size={13} /> Handled by <span className={isDark ? "text-white/65" : "text-black/65"}>{call.handledBy}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={`text-[11px] ${isDark ? "text-white/40" : "text-black/45"}`}>{call.phone}</span>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-400">{call.status}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#4F4432] bg-[#211E18] px-2 py-1 text-[11px] text-[#E8D1AB]"><Play size={10} /> Recording</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${call.transcript.length ? "border-white/10 text-white/50" : "border-white/5 text-white/20"}`}><FileText size={10} /> Transcript</span>
                <button type="button" onClick={() => setSelectedCall(call)} className={`inline-flex items-center gap-1 text-xs ${isDark ? "text-white/80 hover:text-white" : "text-black/75 hover:text-black"}`}>View call <ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ShootCallDetailsDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
    </section>
  );
}
