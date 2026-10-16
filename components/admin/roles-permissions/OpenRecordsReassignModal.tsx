"use client";

import { AlertCircle } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type OpenRecordsReassignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  userName: string;
  openLeads: number;
  openQuotes: number;
  openPostProduction?: number;
};

export function OpenRecordsReassignModal({
  isOpen,
  onClose,
  onContinue,
  userName,
  openLeads,
  openQuotes,
  openPostProduction = 0,
}: OpenRecordsReassignModalProps) {
  const { isDark } = useResolvedTheme();

  const total = openLeads + openQuotes + openPostProduction;
  const recordCounts = [
    openLeads > 0 ? `${openLeads} open ${openLeads === 1 ? "lead" : "leads"}` : null,
    openQuotes > 0 ? `${openQuotes} open ${openQuotes === 1 ? "quote" : "quotes"}` : null,
    openPostProduction > 0
      ? `${openPostProduction} active post-production ${openPostProduction === 1 ? "record" : "records"}`
      : null,
  ].filter((count): count is string => count !== null);
  const recordSummary = recordCounts.length < 2
    ? recordCounts[0]
    : `${recordCounts.slice(0, -1).join(", ")} and ${recordCounts[recordCounts.length - 1]}`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`w-[calc(100%-2rem)] max-w-[520px] gap-0 rounded-3xl p-6 shadow-2xl sm:rounded-3xl lg:p-8 [&>button]:hidden ${
          isDark ? "border-[#2A2A2A] bg-black text-white" : "border-[#E3E3E3] bg-white text-[#101010]"
        }`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isDark ? "bg-[#3A2A10]" : "bg-[#FFF3DC]"
            }`}
          >
            <AlertCircle size={24} className="text-[#F5A524]" />
          </div>
          <DialogTitle className="text-xl font-semibold leading-snug lg:text-2xl">
            Open records need to be reassigned
          </DialogTitle>
        </div>

        <DialogDescription asChild>
          <p className={`mt-5 text-base leading-relaxed ${isDark ? "text-[#9A9A9A]" : "text-[#32323299]"}`}>
            This Sales Rep currently has{" "}
            <span className="text-[#F5A524]">{recordSummary}</span> assigned to them. Reassign these records to {openPostProduction > 0 ? "eligible active owners" : "another active Sales Rep"} before deactivating this user.
          </p>
        </DialogDescription>

        <div className={`mt-6 space-y-4 rounded-2xl p-5 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F4F5F7]"}`}>
          <Row label="Open Leads" value={openLeads} isDark={isDark} />
          <Row label="Open Quotes" value={openQuotes} isDark={isDark} accent />
          <Row label="Open Post Production" value={openPostProduction} isDark={isDark} />
          <Row label="Total" value={total} isDark={isDark} />
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className={`h-14 flex-1 rounded-lg border text-base font-semibold transition-all shadow-none ${
              isDark
                ? "border-white/10 bg-[#1E1E1E] text-white hover:bg-white/10"
                : "border-[#E3E3E3] bg-white text-[#101010] hover:bg-black/[0.03]"
            }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="h-14 flex-1 rounded-lg bg-[#E8D1AB] text-base font-semibold text-[#101010] transition-all hover:bg-[#d6c29b] active:scale-95"
          >
            Reassign &amp; Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  isDark,
  accent = false,
}: {
  label: string;
  value: number;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-lg">
      <span className={isDark ? "text-[#9A9A9A]" : "text-[#32323299]"}>{label}</span>
      <span
        className={`font-semibold ${
          accent ? (isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]") : isDark ? "text-white" : "text-[#101010]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
