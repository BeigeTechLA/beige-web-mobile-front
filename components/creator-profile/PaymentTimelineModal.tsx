"use client";

import React from "react";
import { X } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date?: string;
  isCompleted: boolean;
}

interface PaymentTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineData: TimelineEvent[];
}

export default function PaymentTimelineModal({
  isOpen,
  onClose,
  timelineData,
}: PaymentTimelineModalProps) {
  const { isDark } = useResolvedTheme();

  if (!isOpen) return null;

  const data = timelineData;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-[#101010CC] backdrop-blur-sm animate-in fade-in duration-200 p-0">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container Card Frame */}
      <div className={`relative h-full w-full lg:max-w-3xl max-h-[80vh] lg:h-[80vh] flex flex-col border rounded-lg lg:rounded-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        {/* Header Block Section */}
        <div className="flex items-center justify-between p-4 lg:p-9">
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">Payout Timeline</h2>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white hover:text-white/90 transition-colors border border-[#2B2626]"
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        <div className="p-6 lg:p-8 overflow-y-auto no-scrollbar">
          {data.length === 0 ? (
            <div className={`flex min-h-[240px] items-center justify-center rounded-lg border text-sm ${isDark ? "border-white/10 bg-white/[0.03] text-white/50" : "border-black/10 bg-black/[0.03] text-black/50"}`}>
              No payout timeline is available yet.
            </div>
          ) : (
          <div className="relative space-y-6 lg:space-y-12">
            {data.map((event, idx) => {
              const isLast = idx === data.length - 1;

              return (
                <div key={event.id} className="relative flex items-start lg:items-center gap-4 group">
                  {/* Vertical Connective Connector Indicator Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-14 lg:top-11 bottom-[-28px] lg:bottom-[-60px] w-0.5 border-l-2 border-dashed ${event.isCompleted && data[idx + 1]?.isCompleted
                        ? "border-[#10B981]/40"
                        : (isDark ? "border-white/10" : "border-black/10")
                        }`}
                    />
                  )}

                  {/* Node Icon Circle Representation Bullet */}
                  <div className="relative z-10 pt-1 shrink-0">
                    {event.isCompleted ? (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#26BF94]/20">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#10B981]" />
                      </div>
                    ) : (
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                        <div className={`w-3.5 h-3.5 rounded-full ${isDark ? "bg-white/20" : "bg-black/20"}`} />
                      </div>
                    )}
                  </div>

                  {/* Description Context & Time Fields Row Content */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 min-w-0">
                    <div className="text-base lg:text-xl tracking-wide">
                      <span
                        className={`font-medium ${isDark ? "text-white" : "text-black"}`}
                      >
                        {event.title}
                      </span>
                      {event.description && (
                        <span className={`font-normal ml-1 ${isDark ? "text-white/70" : "text-black/60"}`}>
                          {event.description}
                        </span>
                      )}
                    </div>

                    {event.date && (
                      <span className={`text-sm lg:text-lg font-normal whitespace-nowrap pt-0.5 sm:text-right ${isDark ? "text-[#8C9097]" : "text-black/40"}`}>
                        {event.date}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
