"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import Topbar from "@/components/admin/Topbar";
import { QuoteAnalyticsOverview } from "./QuoteAnalyticsOverview";
import { OpenPipelineCard } from "./OpenPipelineCard";
import { QuotePipelineCard } from "./QuotePipelineCard";
import { QuoteAnalyticsTable } from "./QuoteAnalyticsTable";
import { quoteAnalyticsRecords } from "./types";

export type AnalyticsFilters = Record<
  "date" | "salesRep" | "shootType" | "quoteStatus" | "paymentStatus" | "leadSource" | "customerType",
  string
>;

const fields: Array<[keyof AnalyticsFilters, string, string[]]> = [
  ["date", "Date", ["All time", "This month", "Last 90 days"]],
  ["salesRep", "Sales Rep", ["All reps", "John Smith", "Michael Chen", "Olivia Brown", "Lisa Smith"]],
  ["shootType", "Shoot Type", ["All types", "Photography", "Videography"]],
  ["quoteStatus", "Quote Status", ["All statuses", "Accepted", "Sent", "Partially Paid", "Overdue"]],
  ["paymentStatus", "Payment Status", ["All payments", "Paid", "Pending", "Overdue"]],
  ["leadSource", "Lead Source", ["All sources", "Website", "Referral", "Instagram"]],
  ["customerType", "Customer Type", ["All customers", "Corporate", "Individual"]],
];

export const initialAnalyticsFilters: AnalyticsFilters = {
  date: "All time",
  salesRep: "All reps",
  shootType: "All types",
  quoteStatus: "All statuses",
  paymentStatus: "All payments",
  leadSource: "All sources",
  customerType: "All customers",
};

export default function QuoteAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(initialAnalyticsFilters);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("value");
  const filteredRows = useMemo(
    () =>
      quoteAnalyticsRecords.filter(
        (record) => filters.quoteStatus === "All statuses" || record.status === filters.quoteStatus
      ),
    [filters.quoteStatus]
  );
  const updateFilter = (key: keyof AnalyticsFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <Topbar pathname="/admin/quotes/analytics" breadcrumbOverrides={{ analytics: "Quote Analytics" }} />
      <main
        className="min-h-full space-y-4 bg-[#101010] p-4 text-white lg:p-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div>
          <h1 className="text-xl font-semibold">Quote Analytics</h1>
          <p className="mt-1 text-md text-white/50">
            Monitor quote performance, conversion, revenue, and pipeline health.
          </p>
        </div>
        <div className="pb-5">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setFiltersVisible((visible) => !visible)}
              className="flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-[#202020] px-4 text-sm text-white hover:bg-white/10"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          {filtersVisible && (
            <div className="flex flex-wrap gap-2">
              {fields.map(([key, label, options]) => (
                <BasicDropdown
                  key={key}
                  label={label}
                  value={filters[key]}
                  options={options}
                  onChange={(value) => updateFilter(key, value)}
                  styles="!h-11 !px-4 !text-[12px] !text-white"
                />
              ))}
            </div>
          )}
        </div>
        <QuoteAnalyticsOverview selectedMetric={selectedMetric} onMetricClick={setSelectedMetric} />
        <OpenPipelineCard />
        <QuotePipelineCard />
        <QuoteAnalyticsTable records={filteredRows} />
      </main>
    </>
  );
}


