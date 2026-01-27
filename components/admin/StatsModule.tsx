"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CircleDollarSign, DollarSign, TrendingUp } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-cards";

const CHART_DATA = [
  { name: "Jan", green: 2000, red: 1500 },
  { name: "Feb", green: 3500, red: 3000 },
  { name: "Mar", green: 6000, red: 3500 },
  { name: "Apr", green: 3000, red: 3000 },
  { name: "May", green: 300, red: 300 },
];

import { adminApi } from "@/lib/api";
import { useEffect, useState } from "react";

const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-[1100px] h-[340px] bg-[#101010] rounded-2xl border border-[#3D3D3D] p-5 text-white">
    {children}
  </div>
);

const StatsLayout = ({
  title,
  subtitle,
  graphTitle,
  rightLabel,
  rightValue,
  value,
  chartData = [],
  growth = 0,
  growthLabel = "Last 30 Days",
  hasInfoCard = false,
  isLoading = false,
}: any) => (
  <div className="bg-[#101010] flex gap-6 h-full max-h-[300px] items-center">
    {/* Left */}
    <div className="w-1/4 flex flex-col justify-between h-full">
      <div className="flex items-center gap-2">
        <div className="w-[3px] h-6 bg-[#E5D5B8]" />
        <h3 className="">{title}</h3>
      </div>
      <div>
        <h2 className="text-[26px] font-semibold mb-2">
          {isLoading ? (
            <div className="h-8 w-32 bg-white/10 animate-pulse rounded" />
          ) : (
            value || "$0"
          )}
        </h2>
        <p className="text-white/40 text-base">{subtitle}</p>
      </div>
    </div>

    {/* Chart */}
    <div className={`${hasInfoCard ? "w-1/2" : "w-3/4"} bg-[#161616] rounded-2xl p-4 border border-white/5 h-[300px]`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-6 bg-[#E5D5B8]" />
        <h3 className="">{graphTitle}</h3>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData.length > 0 ? chartData : [
          { name: "No Data", base_revenue: 0, margin_revenue: 0 }
        ]} >
          <XAxis dataKey="name" axisLine={true} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          {/* <Tooltip cursor={{ fill: "transparent" }} /> */}
          <Bar
            dataKey="base_revenue"
            stackId="a"
            fill="#55BF61"
            barSize={30}
            radius={[0, 0, 6, 6]}
          />
          <Bar
            dataKey="margin_revenue"
            stackId="a"
            fill="#FF8484"
            radius={[6, 6, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Right */}
    {
      hasInfoCard &&
      <div className="w-1/4">
        <div className="bg-[#ECD7B4] rounded-[28px] p-6 text-black h-[200px] flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black p-3 rounded-full text-white shrink-0">
              <CircleDollarSign size={30} />
            </div>
            <span className="text-[#101010] text-base">{rightLabel}</span>
          </div>

          <div>
            <h4 className="text-[26px] font-semibold font-black">
              {isLoading ? (
                <div className="h-8 w-24 bg-black/10 animate-pulse rounded" />
              ) : (
                rightValue || "$0"
              )}
            </h4>
            <div className="flex items-center gap-1 font-bold">
              <TrendingUp size={24} className={growth >= 0 ? "text-[#047726]" : "text-red-500"} />
              <span className="text-sm"> {growth >= 0 ? "+" : ""}{growth}%</span>
              <span className="text-[#101010]/70 text-xs font-normal">{growthLabel}</span>
            </div>
          </div>
        </div>
      </div>
    }

  </div>
);

export default function StackedDashboard() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [totalRes, monthlyRes, weeklyRes] = await Promise.all([
          adminApi.getTotalRevenue(),
          adminApi.getMonthlyRevenue(),
          adminApi.getWeeklyRevenue(),
        ]);

        if (totalRes && totalRes.data) setRevenueData(totalRes.data);

        if (monthlyRes && monthlyRes.data) {
          // Map API response to chart format
          // Expecting data to be an array or object with months
          // Example: { Jan: { base: 100, margin: 50 }, ... } or [{ name: 'Jan', base: 100, margin: 50 }]
          const formattedMonthly = Array.isArray(monthlyRes.data)
            ? monthlyRes.data.map((item: any) => ({
              name: item.month || item.name,
              base_revenue: item.base_revenue || item.base || 0,
              margin_revenue: item.margin_revenue || item.margin || 0
            }))
            : Object.entries(monthlyRes.data).map(([month, values]: [string, any]) => ({
              name: month,
              base_revenue: values.base_revenue || values.base || 0,
              margin_revenue: values.margin_revenue || values.margin || 0
            }));
          setMonthlyData(formattedMonthly);
        }

        if (weeklyRes && weeklyRes.data) setWeeklyData(weeklyRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(val);
  };

  return (
    <div className="dashboard-stack-container w-full bg-[#171717] rounded-2xl border border-[#3D3D3D] p-4">
      {/* SIDE MASK */}
      <div className="relative overflow-hidden px-10">
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          className="dashboard-stack-swiper"
          cardsEffect={{
            slideShadows: false,
            perSlideOffset: 8,
            perSlideRotate: 0,
          }}
        >
          <SwiperSlide>
            <CardWrapper>
              <StatsLayout
                title="Total Revenue"
                subtitle="This Is Sales Revenue Overview"
                graphTitle="Month On Month Revenue Growth"
                rightLabel="Weekly Revenue"
                rightValue={formatCurrency(weeklyData?.weekly_revenue || revenueData?.weekly_revenue || 0)}
                value={formatCurrency(revenueData?.total_revenue || 0)}
                growth={weeklyData?.growth_percent || 0}
                growthLabel="Last 7 Days"
                chartData={monthlyData}
                hasInfoCard={true}
                isLoading={isLoading}
              />
            </CardWrapper>
          </SwiperSlide>

          <SwiperSlide>
            <CardWrapper>
              <StatsLayout
                title="No Of CPs"
                subtitle="This Is Overall CPs Overview"
                graphTitle="Category Wise CPs"
                rightLabel="Top Category"
                rightValue="Photo"
                value="33" // Handled in overview chart but also here? Assuming user wants both dynamic.
              />
            </CardWrapper>
          </SwiperSlide>

          <SwiperSlide>
            <CardWrapper>
              <StatsLayout
                title="Total Pay-Out"
                subtitle="This Is Overall Payout Overview"
                graphTitle="Weekly Graph Payments"
                rightLabel="Pending Payments"
                rightValue="$184,200"
                value="$521,400" // Placeholder
                hasInfoCard={true}
              />
            </CardWrapper>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
