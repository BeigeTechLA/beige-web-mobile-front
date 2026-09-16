"use client";

import { useState } from "react";
import { Info } from "lucide-react";

type ConversionMetricProps = {
  id: string;
  value: string;
  label: string;
  tone: string;
  dotColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function ConversionMetric({ id, value, label, tone, dotColor, isSelected, onSelect }: ConversionMetricProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full rounded-[18px] border p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_8px_24px_rgba(0,0,0,0.16)] transition-colors ${
        isSelected ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#171717]" : "border-white/[0.06] bg-[#0E0E0E]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <b className={`text-[21px] leading-none ${isSelected ? "text-[#171717]" : tone}`}>{value}</b>
        <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full shadow-[0_0_10px_rgba(243,221,184,0.18)] ${isSelected ? "bg-black text-[#E8D1AB]" : "bg-[#F3DDB8] text-[#171717]"}`}>
          <Info size={10} strokeWidth={2.5} />
        </span>
      </div>
      <p className={`mt-2 flex items-center gap-1.5 text-[11px] tracking-[0.01em] ${isSelected ? "text-black" : "text-white/60"}`}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        {label}
      </p>
    </button>
  );
}

const arcDetails = {
  winRate: { value: "25%", label: "Win rate" },
  averageDeal: { value: "$27,188", label: "Avg. deal value" },
  cashConversion: { value: "35.5%", label: "Quote-to-cash" },
} as const;

type MetricId = keyof typeof arcDetails;

export function ConversionPerformanceCard() {
  const [hoveredArc, setHoveredArc] = useState<MetricId | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);

  const selectedSummaries: Record<MetricId, [string, string][]> = {
    winRate: [["32", "DEALS WON"], ["128", "QUOTES SENT"]],
    averageDeal: [["$27,188", "AVG. DEAL VALUE"], ["128", "QUOTES SENT"]],
    cashConversion: [["35.5%", "CONVERSION"], ["32", "DEALS WON"]],
  };

  const toggleMetric = (id: string) => {
    const metricId = id as MetricId;
    setSelectedMetric((current) => current === metricId ? null : metricId);
  };

  return (
    <section className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#171717] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.025)] xl:h-[520px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[55px] h-[300px] rounded-b-[30px] opacity-90"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(232,209,171,0.5) 0px, rgba(232,209,171,0.5) 1px, transparent 1px, transparent 4px)",
          maskImage:
            "radial-gradient(circle 116px at 50% 145px, transparent 0, transparent 97%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle 116px at 50% 145px, transparent 0, transparent 97%, black 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[55px] z-[1] h-[300px] bg-gradient-to-b from-[#171717] via-[#171717]/45 to-transparent"
      />

      <div className="relative z-10 mb-2 flex items-center gap-3 text-[14px] font-medium text-white/90">
        <span className="h-6 w-px bg-[#F1DBB4] shadow-[0_0_8px_rgba(241,219,180,0.22)]" />
        Conversion Performance
      </div>

      <div className="relative z-10 flex min-h-5 items-center justify-center gap-4 text-[10px] font-medium">
        {selectedMetric && selectedSummaries[selectedMetric].map(([value, label], index) => (
          <span key={label} className={index === 0 ? "text-[#4CD66B]" : "text-[#D68AE6]"}>
            • {value} {label}
          </span>
        ))}
      </div>

      <div
        className="relative z-10 mx-auto grid h-[245px] w-full max-w-[340px] place-items-center"
        onMouseLeave={() => setHoveredArc(null)}
      >
        <div className="absolute h-[232px] w-[232px] rounded-full bg-[repeating-radial-gradient(circle_at_center,transparent_0,transparent_13px,#292929_14px,#292929_15px)] shadow-[0_18px_45px_rgba(0,0,0,0.35)]" />
        <svg className="relative h-[232px] w-[232px] -rotate-[105deg] drop-shadow-[0_4px_9px_rgba(0,0,0,0.28)]" viewBox="0 0 140 140">
          <circle className="cursor-pointer" onMouseEnter={() => setHoveredArc("winRate")} cx="70" cy="70" r="57" fill="none" stroke="#42C7D9" strokeWidth="12" strokeLinecap="round" strokeDasharray="125 233" />
          <circle className="cursor-pointer" onMouseEnter={() => setHoveredArc("averageDeal")} cx="70" cy="70" r="41" fill="none" stroke="#9F91ED" strokeWidth="12" strokeLinecap="round" strokeDasharray="91 167" />
          <circle className="cursor-pointer" onMouseEnter={() => setHoveredArc("cashConversion")} cx="70" cy="70" r="25" fill="none" stroke="#F1E681" strokeWidth="12" strokeLinecap="round" strokeDasharray="56 101" />
        </svg>

        <div
            className={`pointer-events-none absolute flex items-center rounded-[14px] bg-white px-4 py-2.5 text-black shadow-[0_12px_35px_rgba(0,0,0,0.38)] transition-all duration-150 before:absolute before:-left-2 before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rotate-45 before:bg-white ${
              hoveredArc
                ? "translate-x-0 opacity-100"
                : "translate-x-2 opacity-0"
            } ${
              hoveredArc === "winRate"
                ? "right-[-5px] top-[35px]"
                : hoveredArc === "averageDeal"
                  ? "right-[-5px] top-[75px]"
                  : "right-[-5px] top-[115px]"
            }`}
          >
          <b className="relative text-[22px] leading-none">{hoveredArc ? arcDetails[hoveredArc].value : ""}</b>
          <span className="relative ml-1 text-[11px] text-black/60">{hoveredArc ? arcDetails[hoveredArc].label : ""}</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3">
        <ConversionMetric id="winRate" value="25%" label="WIN RATE" tone="text-[#f2e781]" dotColor="#f2e781" isSelected={selectedMetric === "winRate"} onSelect={toggleMetric} />
        <ConversionMetric id="averageDeal" value="$27,188" label="AVG. DEAL VALUE" tone="text-[#b6a1ef]" dotColor="#b6a1ef" isSelected={selectedMetric === "averageDeal"} onSelect={toggleMetric} />
      </div>
      <div className="relative z-10 mt-3">
        <ConversionMetric id="cashConversion" value="35.5%" label="QUOTE-TO-CASH CONVERSION" tone="text-[#42d0df]" dotColor="#42d0df" isSelected={selectedMetric === "cashConversion"} onSelect={toggleMetric} />
      </div>
    </section>
  );
}
