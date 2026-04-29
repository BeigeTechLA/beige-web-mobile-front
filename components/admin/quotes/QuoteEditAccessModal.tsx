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

type QuoteEditAccessModalProps = {
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
      <div className="relative max-h-[84vh] w-full max-w-[840px] overflow-y-auto rounded-[16px] border border-[rgba(255,255,255,0.22)] bg-[#000000] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]">
        <div className="flex items-start justify-between gap-5 border-b border-[rgba(255,255,255,0.22)] px-5 py-4 lg:px-7 lg:py-5">
          <h2 className="pr-4 text-[20px] font-semibold leading-[1.06] text-white lg:text-[28px]">
            Restricted Quote Edit Access
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#2E2725] text-white transition-colors hover:bg-[#39312E] lg:h-[54px] lg:w-[54px]"
            aria-label="Close modal"
          >
            <X size={17} strokeWidth={2.1} className="lg:h-6 lg:w-6" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 lg:px-7 lg:py-5">
          <div className="flex items-start gap-4 rounded-[12px] border border-[#E24D4D] bg-[#261010] px-4 py-3.5 lg:px-5 lg:py-4">
            <div className="mt-1 shrink-0 text-[#FF6B6B]">
              <AlertTriangle size={22} strokeWidth={1.9} className="lg:h-8 lg:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-medium text-white lg:text-[17px]">
                Operational Risk Notice
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[#B9A9A9] lg:text-[12px] lg:leading-5">
                Any changes can affect shoot execution, assigned creators, logistics, and client
                communication
              </p>
            </div>
          </div>

          <div className="grid overflow-hidden rounded-[14px] border border-[#373737] bg-[#151515] lg:grid-cols-4">
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
                className={`flex flex-col items-start px-4 py-4 lg:min-h-[116px] lg:px-5 lg:py-4 ${
                  index < 3 ? "border-b border-[#373737] lg:border-b-0 lg:border-r" : ""
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#EED4A7] text-black lg:h-[40px] lg:w-[40px]">
                  <Icon size={16} strokeWidth={1.85} className="lg:h-5 lg:w-5" />
                </div>
                <div className="mt-3 min-w-0">
                  <p className="text-[12px] leading-5 text-[#9E9EA4] lg:text-[13px]">{label}</p>
                  <p
                    className={`mt-1 break-words text-[16px] font-medium leading-[1.18] lg:text-[16px] ${
                      accent ? "text-[#FF7B86]" : "text-white"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`rounded-[14px] border bg-[#000000] px-5 pb-4 pt-0 lg:px-6 lg:pb-4 ${
              reasonError ? "border-[#E24D4D]" : "border-[#5A5A5F]"
            }`}
          >
            <div className="-translate-y-3 px-2 text-[13px] text-[#A7A7AD] lg:text-[14px]">
              <span className="bg-[#000000] px-3">
                Reason to Edit Quote <span className="text-[#EED4A7]">(Required)</span>
              </span>
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Enter reason for urgent quote update..."
              className="min-h-[90px] w-full resize-none border-0 bg-transparent px-0 pt-1 text-[14px] text-white outline-none placeholder:text-[#505057] lg:min-h-[100px] lg:text-[15px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmed((current) => !current)}
            className="flex items-center gap-4 pt-1 text-left"
            aria-pressed={isConfirmed}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors lg:h-10 lg:w-10 ${
                isConfirmed
                  ? "border-[#C9AE7C] bg-[#111111] text-[#EED4A7]"
                  : checkboxError
                    ? "border-[#E24D4D] bg-[#000000] text-transparent"
                    : "border-[#9C8967] bg-[#000000] text-transparent"
              }`}
            >
              {isConfirmed ? <Check size={18} strokeWidth={2.5} /> : null}
            </span>
            <span className="text-[14px] leading-6 text-[#9F9FA4] lg:text-[16px]">
              I confirm Ops team / CP availability has been reviewed.
            </span>
          </button>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-[44px] min-w-[140px] rounded-[12px] border-[#4A4A4F] bg-[#141414] px-5 text-[14px] font-semibold text-white hover:bg-[#1A1A1A] lg:h-[46px] lg:min-w-[150px] lg:text-[15px]"
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
              className="h-[44px] min-w-[190px] rounded-[12px] bg-[#EED4A7] px-5 text-[14px] font-semibold text-black hover:bg-[#EED4A7]/92 lg:h-[46px] lg:min-w-[220px] lg:text-[15px]"
            >
              Proceed to Edit Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
