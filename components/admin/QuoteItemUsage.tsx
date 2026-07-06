"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Crown, TrendingUp, Package } from "lucide-react";
import { useTheme } from "next-themes";
import { adminApi } from "@/lib/api";

type QuoteUsageCategory = "all" | "services" | "addons" | "logistics";

type QuoteUsageItem = {
  label: string;
  count: number;
  percentage: number;
  color: string;
};

type QuoteUsageResponseCategory = {
  total_count?: number;
  items?: Array<{
    label?: string;
    name?: string;
    count?: number;
    value?: number;
    percentage?: number;
    color?: string;
  }>;
};

type QuoteUsageResponseData = Partial<Record<QuoteUsageCategory, QuoteUsageResponseCategory>>;

const COLORS = ["#E8D1AB", "#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B", "#06B6D4", "#EC4899", "#EF4444", "#6366F1"];

const TABS: Array<{ label: string; value: QuoteUsageCategory }> = [
  { label: "All", value: "all" },
  { label: "Services", value: "services" },
  { label: "Add-ons", value: "addons" },
  { label: "Logistics", value: "logistics" },
];

const CATEGORIES: Exclude<QuoteUsageCategory, "all">[] = ["services", "addons", "logistics"];

const toUsageItem = (
  item: NonNullable<QuoteUsageResponseCategory["items"]>[number],
  index: number,
  total?: number,
): QuoteUsageItem => {
  const count = item.count || item.value || 0;
  return {
    label: item.label || item.name || "Untitled item",
    count,
    percentage: total && total > 0 ? Math.round((count / total) * 100) : item.percentage || 0,
    color: item.color || COLORS[index % COLORS.length],
  };
};

export default function QuoteItemUsage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<QuoteUsageCategory>("all");
  const [items, setItems] = useState<QuoteUsageItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getQuoteItemUsage(activeTab === "all" ? undefined : activeTab);

        if (!response.error && response.data) {
          const data = response.data as QuoteUsageResponseData & QuoteUsageResponseCategory;
          const allItems = CATEGORIES.flatMap((category) => data[category]?.items || []);
          const categoryData = activeTab === "all" ? {} : data[activeTab] || (Array.isArray(data.items) ? data : {});
          const rawItems = activeTab === "all" ? allItems : categoryData.items || [];
          const total = activeTab === "all"
            ? rawItems.reduce((sum, item) => sum + (item.count || item.value || 0), 0)
            : categoryData.total_count || rawItems.reduce((sum, item) => sum + (item.count || item.value || 0), 0);
          const mappedItems = rawItems
            .map((item, index) => toUsageItem(item, index, activeTab === "all" ? total : undefined))
            .sort((a, b) => b.count - a.count);

          setItems(mappedItems);
          setTotalCount(total);
        } else {
          setItems([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch quote item usage:", error);
        setItems([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const isDark = !mounted || theme === "dark";
  const usedItems = items.filter((i) => i.count > 0);
  const unusedItems = items.filter((i) => i.count === 0);
  const topItem = usedItems[0];
  const orderedItems = [...usedItems, ...unusedItems];

  return (
    <div className={`border rounded-2xl w-full max-w-md h-[520px] flex flex-col transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-[#FFF] border-[#E5E5E5] text-[#323232]"
      }`}>
      {/* Header */}
      <div className={`rounded-t-2xl shrink-0 ${isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}`}>
        <div className={`flex items-center justify-between gap-2 p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-5 bg-[#E5D5B8]" />
            <h2 className="text-sm font-medium">Quote Item Usage</h2>
          </div>
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-[#101010] bg-[#E8D1AB] px-2.5 py-1 rounded-full font-medium">
              <Package size={11} />
              {items.length}
            </div>
          )}
        </div>

        <div className={`flex px-2 border-b rounded-b-2xl ${isDark ? "border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E5E5E5]"}`}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 pt-3.5 pb-2.5 px-2 text-xs font-medium transition-all border-b-[3px] ${activeTab === tab.value
                  ? (isDark ? "text-[#E8D1AB] border-[#E8D1AB]" : "text-[#000000] border-[#000000]")
                  : (isDark ? "text-white/30 hover:text-white/60" : "text-[#00000080] hover:text-[#323232]") + " border-b-transparent"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden min-h-0">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="animate-spin text-[#E5D5B8]" size={28} />
          </div>
        ) : items.length > 0 ? (
          <>
            {/* Compact summary row: total + top item side by side */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <div className={`rounded-lg p-3 ${isDark ? "bg-white/[0.05]" : "bg-black/[0.03]"}`}>
                <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                  Total
                </p>
                <p className="text-xl font-bold leading-none">{totalCount.toLocaleString()}</p>
              </div>
              {topItem ? (
                <div className={`rounded-lg p-3 border ${isDark ? "bg-[#E8D1AB]/[0.08] border-[#E8D1AB]/20" : "bg-[#FDEFD9] border-[#E8D1AB]/30"}`}>
                  <p className={`flex items-center gap-1 text-[10px] uppercase tracking-wide mb-0.5 ${isDark ? "text-[#E8D1AB]/70" : "text-[#a9884f]"}`}>
                    <Crown size={10} /> Top
                  </p>
                  <p className="text-xs font-semibold truncate leading-tight">{topItem.label}</p>
                </div>
              ) : (
                <div className={`rounded-lg p-3 ${isDark ? "bg-white/[0.05]" : "bg-black/[0.03]"}`} />
              )}
            </div>

            {/* Dense scrollable list */}
              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar min-h-0">
              {orderedItems.map((item, index) => {
                const isUnused = item.count === 0;
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className={`flex items-center gap-2 py-1.5 transition-opacity ${isUnused ? "opacity-35" : "opacity-100"}`}
                  >
                    <span className={`text-[10px] w-4 shrink-0 text-right ${isDark ? "text-white/25" : "text-[#32323240]"}`}>
                      {index + 1}
                    </span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className={`text-xs truncate flex-1 min-w-0 ${isDark ? "text-white/85" : "text-[#323232]"}`}>
                      {item.label}
                    </span>
                    <div className={`h-1 w-12 rounded-full overflow-hidden shrink-0 ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-8 text-right shrink-0 ${isDark ? "text-white" : "text-[#323232]"}`}>
                      {isUnused ? "—" : item.count}
                    </span>
                    <span className={`text-[10px] w-8 text-right shrink-0 ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                      {isUnused ? "0%" : `${item.percentage}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex flex-col justify-center items-center text-center gap-2 ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
            <TrendingUp size={24} className="opacity-40" />
            <span className="text-sm">No quote items found for this category</span>
          </div>
        )}
      </div>
    </div>
  );
}