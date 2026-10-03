"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Search, X } from "lucide-react";

export type QuoteCallTranscriptLine = {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
};

export type QuoteCallDetail = {
  id: string;
  contactName: string;
  phone: string;
  direction: "incoming" | "outgoing";
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  handledBy: string;
  status: string;
  summary: string;
  nextSteps: string[];
  recordingUrl?: string;
  transcript: QuoteCallTranscriptLine[];
};

type Props = {
  call: QuoteCallDetail | null;
  onClose: () => void;
};

const formatDirection = (value: QuoteCallDetail["direction"]) =>
  value === "incoming" ? "Incoming" : "Outgoing";

export default function QuoteCallDetailsDrawer({ call, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSearch("");
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [call?.id]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const filteredTranscript = useMemo(() => {
    if (!call) return [];
    const query = search.trim().toLowerCase();
    if (!query) return call.transcript;
    return call.transcript.filter((line) =>
      `${line.speaker} ${line.text} ${line.timestamp}`.toLowerCase().includes(query)
    );
  }, [call, search]);

  if (!call) return null;

  const togglePlayback = () => {
    if (!call.recordingUrl) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        void audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    const nextAudio = new Audio(call.recordingUrl);
    nextAudio.addEventListener("ended", () => setIsPlaying(false));
    audioRef.current = nextAudio;
    void nextAudio.play();
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end bg-black/80 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-[660px] flex-col overflow-hidden border-l border-[#2A2A2A] bg-black text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#252525] px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Call Details</p>
              <h2 className="mt-2 text-xl font-semibold">Call with {call.contactName}</h2>
              <p className="mt-1 text-sm text-white/45">{call.phone || "Phone unavailable"}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#282526] text-white hover:bg-[#343031]"
              aria-label="Close call details"
            >
              <X size={26} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#E8D1AB]">{formatDirection(call.direction)}</p>
              <p className="mt-2 text-sm text-white/60">{call.dateLabel} · {call.timeLabel}</p>
              <span className="mt-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                {call.status || "Completed"}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/35">Duration</p>
              <p className="mt-2 text-sm text-white/60">{call.durationLabel || "--:--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/35">Handled By</p>
              <p className="mt-2 text-sm text-white/60">{call.handledBy || "Unknown"}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <section>
            <h3 className="text-sm font-medium uppercase tracking-[0.08em]">Call Summary</h3>
            <div className="mt-3 rounded-lg border border-[#262626] bg-[#171717] p-4">
              <div className="flex gap-3">
                <span className="mt-0.5 h-6 w-[3px] rounded-full bg-[#9B8362]" />
                <p className="text-sm leading-6 text-white/60">
                  {call.summary || "No call summary is available yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-medium uppercase tracking-[0.08em]">Next Steps</h3>
            <div className="mt-3 space-y-2">
              {call.nextSteps.length > 0 ? call.nextSteps.map((step, index) => (
                <div key={`${step}-${index}`} className="flex items-center gap-3 rounded-lg border border-[#272727] bg-[#171717] px-4 py-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/15 text-[10px] text-white/40">
                    {index + 1}
                  </span>
                  <span className="text-sm text-white/70">{step}</span>
                </div>
              )) : (
                <div className="rounded-lg border border-[#272727] bg-[#171717] px-4 py-4 text-sm text-white/40">
                  No next steps were captured for this call.
                </div>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-lg border border-[#272727] bg-[#171717] p-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.08em]">Call Recording</h3>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!call.recordingUrl}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#765F3E] bg-[#2A251D] text-[#E8D1AB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>
              <span className="text-sm text-white/50">00:00</span>
              <div className="h-[3px] flex-1 rounded-full bg-white/10">
                <div className="h-full w-0 rounded-full bg-[#E8D1AB]" />
              </div>
              <span className="text-sm text-white/70">{call.durationLabel || "--:--"}</span>
              <span className="rounded border border-white/10 px-2 py-1 text-[10px] text-white/40">1×</span>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-lg border border-[#272727] bg-[#171717]">
            <div className="flex flex-col gap-3 border-b border-[#242424] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium uppercase tracking-[0.08em]">Transcript</h3>
              <div className="relative w-full sm:w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transcript..."
                  className="h-9 w-full rounded-md border border-[#2A2A2A] bg-[#111111] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#E8D1AB]/50"
                />
              </div>
            </div>

            {filteredTranscript.length > 0 ? (
              <div className="divide-y divide-[#242424]">
                {filteredTranscript.map((line) => (
                  <div key={line.id} className="grid grid-cols-[46px_1fr] gap-3 px-5 py-4">
                    <span className="text-[11px] text-white/35">{line.timestamp}</span>
                    <div>
                      <p className={`text-xs ${line.speaker === call.handledBy ? "text-[#D8BC87]" : "text-white/45"}`}>
                        {line.speaker}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-white/80">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-white/35">No transcript available.</div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
