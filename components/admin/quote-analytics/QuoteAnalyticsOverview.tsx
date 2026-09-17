"use client";

import { ConversionPerformanceCard } from "./ConversionPerformanceCard";
import { QuotePerformanceCard } from "./QuotePerformanceCard";

type QuoteAnalyticsOverviewProps = {
  selectedMetric?: string;
  onMetricClick?: (metric: string) => void;
};

export function QuoteAnalyticsOverview({
  selectedMetric,
  onMetricClick,
}: QuoteAnalyticsOverviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.9fr_.75fr]">
      <QuotePerformanceCard selectedMetric={selectedMetric} onMetricClick={onMetricClick} />
      <ConversionPerformanceCard />
    </div>
  );
}

