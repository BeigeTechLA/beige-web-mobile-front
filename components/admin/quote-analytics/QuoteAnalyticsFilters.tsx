"use client";

import { SlidersHorizontal } from "lucide-react";
import { BasicDropdown } from "@/components/admin/BasicDropdown";

export type AnalyticsFilters = Record<"date" | "salesRep" | "shootType" | "quoteStatus" | "paymentStatus" | "leadSource" | "customerType", string>;
const fields: Array<[keyof AnalyticsFilters, string, string[]]> = [["date", "Date", ["All time", "This month", "Last 90 days"]], ["salesRep", "Sales Rep", ["All reps", "John Smith", "Michael Chen", "Olivia Brown", "Lisa Smith"]], ["shootType", "Shoot Type", ["All types", "Photography", "Videography"]], ["quoteStatus", "Quote Status", ["All statuses", "Accepted", "Sent", "Partially Paid", "Overdue"]], ["paymentStatus", "Payment Status", ["All payments", "Paid", "Pending", "Overdue"]], ["leadSource", "Lead Source", ["All sources", "Website", "Referral", "Instagram"]], ["customerType", "Customer Type", ["All customers", "Corporate", "Individual"]]];
export const initialAnalyticsFilters: AnalyticsFilters = { date: "All time", salesRep: "All reps", shootType: "All types", quoteStatus: "All statuses", paymentStatus: "All payments", leadSource: "All sources", customerType: "All customers" };

export function QuoteAnalyticsFilters({ filters, visible, onToggle, onChange }: { filters: AnalyticsFilters; visible: boolean; onToggle: () => void; onChange: (key: keyof AnalyticsFilters, value: string) => void }) {
  return <div className="border-b border-dashed border-white/15 pb-5"><div className="mb-4 flex justify-end"><button onClick={onToggle} className="flex h-8 items-center gap-2 rounded-lg border border-white/15 bg-[#202020] px-3 text-xs text-white hover:bg-white/10"><SlidersHorizontal size={14} /> Filters</button></div>{visible && <div className="flex flex-wrap gap-2">{fields.map(([key, label, options]) => <BasicDropdown key={key} label={label} value={filters[key]} options={options} onChange={(value) => onChange(key, value)} styles="!h-9 !px-3 !text-[10px] !text-white" />)}</div>}</div>;
}
