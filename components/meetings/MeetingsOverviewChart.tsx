"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { meetingsApi, type MeetingItem } from "@/lib/meetingsApi";
import { useTheme } from "next-themes";

interface MeetingsOverviewChartProps {
  orderId?: string | number | null;
}

interface ChartBucket {
  month: string;
  orderValue: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  change_request: number;
  completed: number;
  cancelled: number;
}

const SERIES = [
  { key: "pending", label: "Pending", color: "#FF9800" },
  { key: "confirmed", label: "Confirmed", color: "#22C55E" },
  { key: "in_progress", label: "In Progress", color: "#06B6D4" },
  { key: "change_request", label: "Change Request", color: "#A855F7" },
  { key: "completed", label: "Completed", color: "#3B82F6" },
  { key: "cancelled", label: "Cancelled", color: "#EF4444" },
];

const Legend = () => (
  <div className="flex flex-wrap items-center gap-5">
    {SERIES.map((item) => (
      <div key={item.key} className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
        <span className="text-sm text-[#888888]">{item.label}</span>
      </div>
    ))}
  </div>
);

const getMonthKey = (value?: string) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}`;
};

export default function MeetingsOverviewChart({ orderId }: MeetingsOverviewChartProps) {
  const params = useParams<{ id?: string }>();
  const resolvedOrderId = orderId ?? params?.id ?? null;
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);

  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!resolvedOrderId) {
        if (isMounted) setMeetings([]);
        return;
      }

      try {
        const response = await meetingsApi.getByOrderId(resolvedOrderId, {
          sortBy: "meeting_date_time:asc",
          limit: 100,
          page: 1,
        });
        if (isMounted) setMeetings(response?.results || []);
      } catch {
        if (isMounted) setMeetings([]);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [resolvedOrderId]);

  const chartData = useMemo(() => {
    const monthMap = new Map<string, ChartBucket>();

    meetings.forEach((meeting) => {
      const key = getMonthKey(meeting.meeting_date_time);
      const date = meeting.meeting_date_time ? new Date(meeting.meeting_date_time) : null;
      if (!key || !date || Number.isNaN(date.getTime())) return;

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: date.toLocaleDateString([], { month: "short" }),
          orderValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          pending: 0,
          confirmed: 0,
          in_progress: 0,
          change_request: 0,
          completed: 0,
          cancelled: 0,
        });
      }

      const target = monthMap.get(key);
      const status = String(meeting.meeting_status || "pending").toLowerCase();
      if (status in target) {
        target[status] += 1;
      }
    });

    const values = Array.from(monthMap.values()).sort((left, right) => left.orderValue - right.orderValue);
    return values.slice(-6);
  }, [meetings]);

  if (!chartData.length) {
    return null;
  }

  return (
    <div className={`mt-6 rounded-2xl border p-6 ${isDark ? "border-[#222222] bg-[#111111]" : "bg-[#F4F5F7] border-[#F4F5F7]"}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-6 w-1 rounded-full ${isDark ? "bg-[#E5D5B8]" : "bg-[#000000]"}`} />
          <h3 className={`${isDark ? "text-white" : "text-black"}`}>Meeting Overview</h3>
        </div>
        <button className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${isDark ? "border-[#222222] bg-[#1A1A1A] text-[#E0E0E0] hover:bg-[#222222]" : "border-[#E3E3E3] bg-[#FFFFFF] text-[#323232] hover:bg-[#F4F5F7]"}`}>
          Last 6 months <ChevronDown size={14} />
        </button>
      </div>

      <div className="mb-6">
        <Legend />
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={36} barGap={6} margin={{ top: 20, right: 20, bottom: 12, left: -12 }}>
            <CartesianGrid strokeDasharray="0" stroke="#222222" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#666666", fontSize: 13 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666666", fontSize: 13 }} />
            {SERIES.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                stackId="meetings"
                fill={series.color}
                radius={index === SERIES.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
