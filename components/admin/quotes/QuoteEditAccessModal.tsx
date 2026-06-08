"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export type QuoteEditAccessModalProps = {
  open: boolean;
  onClose: () => void;
  onProceed: (payload: { reason: string; opsReviewConfirmed: boolean }) => void;
  quoteNumber: string;
  clientName: string;
  shootDateValue?: string | null;
  isSubmitting?: boolean;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateValue = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalizedValue = DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00` : value;
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const formatShootDate = (value?: string | null) => {
  const parsedDate = parseDateValue(value);
  if (!parsedDate) {
    return "Schedule pending";
  }

  return parsedDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTimeRemaining = (value?: string | null) => {
  const parsedDate = parseDateValue(value);
  if (!parsedDate) {
    return "Pending";
  }

  const diffMs = parsedDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return "Started";
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    return `${totalHours} Hours`;
  }

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays} Days`;
};

export default function QuoteEditAccessModal({
  open,
  onClose,
  onProceed,
  quoteNumber,
  clientName,
  shootDateValue,
  isSubmitting = false,
}: QuoteEditAccessModalProps) {
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { isDark } = useResolvedTheme();

  useEffect(() => {
    if (!open) {
      setReason("");
      setIsConfirmed(false);
      setShowErrors(false);
    }
  }, [open]);

  const shootDateLabel = useMemo(() => formatShootDate(shootDateValue), [shootDateValue]);
  const timeRemainingLabel = useMemo(
    () => formatTimeRemaining(shootDateValue),
    [shootDateValue]
  );

  if (!open) {
    return null;
  }

  const reasonError = showErrors && !reason.trim();
  const checkboxError = showErrors && !isConfirmed;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div className={`relative max-h-[84vh] w-full max-w-[840px] overflow-y-auto rounded-[16px] border transition-colors duration-200 ${isDark
        ? "border-[#2E2E2E] bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>

        {/* Header Block Panel */}
        <div className={`flex items-center justify-between gap-5 border-b px-5 py-4 lg:px-7 lg:py-5 ${isDark ? "border-[#2E2E2E]" : "border-[#D7D7D7]"}`}>
          <h2 className={`pr-4 text-[20px] font-semibold leading-[1.06] lg:text-[28px] ${isDark ? "text-white" : "text-black"}`}>
            Restricted Quote Edit Access
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors lg:h-[54px] lg:w-[54px] ${isDark ? "bg-[#2E2725] text-white hover:bg-[#39312E]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            aria-label="Close modal"
          >
            <X size={17} strokeWidth={2.1} className="lg:h-6 lg:w-6" />
          </button>
        </div>

        <div className="space-y-4 lg:space-y-6 px-5 py-4 lg:px-7 lg:py-5">
          {/* Operational Critical Risk Notice */}
          <div className={`flex items-start gap-4 rounded-xl border px-4 py-3.5 lg:px-5 lg:py-4 ${isDark ? "border-[#E24D4D] bg-[#261010]" : "border-red-300 bg-red-50"
            }`}>
            <div className={isDark ? "mt-1 shrink-0 text-[#FF6B6B]" : "mt-1 shrink-0 text-red-600"}>
              <AlertTriangle size={22} strokeWidth={1.9} className="lg:h-8 lg:w-8" />
            </div>
            <div className="min-w-0">
              <p className={`text-base font-medium lg:text-lg ${isDark ? "text-white" : "text-red-950"}`}>
                Operational Risk Notice
              </p>
              <p className={`mt-1 text-xs leading-5 lg:text-xs lg:leading-5 ${isDark ? "text-[#B9A9A9]" : "text-red-800"
                }`}>
                Any changes can affect shoot execution, assigned creators, logistics, and client
                communication
              </p>
            </div>
          </div>

          {/* Reference Meta Overview Columns */}
          <div className={`grid overflow-hidden rounded-2xl border lg:grid-cols-4 ${isDark ? "border-[#373737] bg-[#151515]" : "border-[#D7D7D7] bg-[#FAFAFA]"
            }`}>
            {[
              { icon: ClipboardList, label: "Quote ID:", value: quoteNumber || "Pending" },
              { icon: UserRound, label: "Client Name:", value: clientName || "Client" },
              { icon: CalendarDays, label: "Shoot Date:", value: shootDateLabel },
              {
                icon: Clock3,
                label: "Time Remaining:",
                value: timeRemainingLabel,
                accent: true,
              },
            ].map(({ icon: Icon, label, value, accent }, index) => (
              <div
                key={label}
                className={`flex lg:flex-col items-start gap-3 p-4 lg:min-h-[116px] lg:px-5 lg:py-4 ${index < 3
                  ? isDark ? "border-b border-[#373737] lg:border-b-0 lg:border-r" : "border-b border-[#D7D7D7] lg:border-b-0 lg:border-r"
                  : ""
                  }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] lg:h-[40px] lg:w-[40px] ${isDark ? "bg-[#EED4A7] text-black" : "bg-[#FFF7E6] text-[#B38F43] border border-[#EED4A7]"
                  }`}>
                  <Icon size={16} strokeWidth={1.85} className="lg:h-5 lg:w-5" />
                </div>
                <div className="lg:mt-3 min-w-0">
                  <p className={`text-xs leading-5 lg:text-sm ${isDark ? "text-[#9E9EA4]" : "text-[#727272]"}`}>{label}</p>
                  <p
                    className={`mt-1 break-words text-base font-medium leading-[1.18] lg:text-base ${accent ? "text-[#FF7B86]" : isDark ? "text-white" : "text-black"
                      }`}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`rounded-2xl border px-5 pb-4 pt-0 relative mt-6 lg:px-6 lg:pb-4 transition-colors ${reasonError
              ? "border-[#E24D4D]"
              : isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"
              }`}
          >
            <div className="absolute -top-3 left-3 px-2 text-xs lg:text-sm z-10">
              <span className={`px-2 font-medium ${isDark ? "bg-black text-[#A7A7AD]" : "bg-white text-[#727272]"}`}>
                Reason to Edit Quote <span className={isDark ? "text-[#EED4A7]" : "text-[#B38F43]"}>*(Required)</span>
              </span>
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Enter reason for urgent quote update..."
              className={`min-h-[90px] w-full resize-none border-0 bg-transparent px-0 pt-2 text-sm outline-none lg:min-h-[100px] lg:text-base ${isDark ? "text-white placeholder:text-[#505057]" : "text-black placeholder:text-[#9F9FA9]"}`}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmed((current) => !current)}
            className="flex items-center gap-4 pt-1 text-left"
            aria-pressed={isConfirmed}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors lg:h-10 lg:w-10 ${isConfirmed
                ? isDark ? "border-[#C9AE7C] bg-[#111111] text-[#EED4A7]" : "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                : checkboxError
                  ? "border-[#E24D4D] bg-transparent text-transparent"
                  : isDark
                    ? "border-[#9C8967] bg-transparent text-transparent group-hover:border-[#C9AE7C]"
                    : "border-[#D7D7D7] bg-transparent text-transparent group-hover:border-[#B38F43]"
                }`}
            >
              {isConfirmed ? <Check size={18} strokeWidth={2.5} /> : null}
            </span>
            <span className={`text-sm leading-6 lg:text-base ${isDark ? "text-[#9F9FA4]" : "text-[#727272]"}`}>
              I confirm Ops team / CP availability has been reviewed.
            </span>
          </button>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`h-11 min-w-[140px] rounded-xl border px-5 text-sm font-semibold transition-colors lg:h-[46px] lg:min-w-[150px] lg:text-base ${isDark
                ? "border-[#4A4A4F] bg-[#141414] text-white hover:bg-[#1A1A1A]"
                : "border-[#D7D7D7] bg-white text-black hover:bg-[#F4F5F7]"
                }`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (!reason.trim() || !isConfirmed) {
                  setShowErrors(true);
                  return;
                }

                onProceed({
                  reason: reason.trim(),
                  opsReviewConfirmed: isConfirmed,
                });
              }}
              className="h-11 min-w-[190px] rounded-xl bg-[#EED4A7] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7]/92 lg:h-[46px] lg:min-w-[220px] lg:text-base"
            >
              Proceed to Edit Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}