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

import { adminApi } from "@/lib/api";
import { useEffect, useState } from "react";

const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-[1100px] min-h-[450px] lg:h-[340px] bg-[#101010] rounded-2xl border border-[#3D3D3D] p-5 text-white overflow-hidden">
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
  chartConfig = [
    { key: "base_revenue", color: "#55BF61", stackId: "a", radius: [0, 0, 6, 6] },
    { key: "margin_revenue", color: "#FF8484", stackId: "a", radius: [6, 6, 0, 0] }
  ]
}: any) => (
  <div className="bg-[#101010] flex flex-col lg:flex-row gap-6 h-full lg:max-h-[300px] items-stretch lg:items-center">
    {/* Left */}
    <div className="lg:w-1/4 flex flex-col justify-between shrink-0">
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
    <div className={`${hasInfoCard ? "lg:w-1/2" : "lg:w-3/4"} bg-[#161616] rounded-2xl p-4 border border-white/5 h-[300px]`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-6 bg-[#E5D5B8]" />
        <h3 className="text-sm lg:text-base ">{graphTitle}</h3>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData.length > 0 ? chartData : []} >
          <XAxis dataKey="name" axisLine={true} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          {/* <Tooltip cursor={{ fill: "transparent" }} /> */}
          {chartConfig.map((config: any, index: number) => (
            <Bar
              key={config.key}
              dataKey={config.key}
              stackId={config.stackId}
              fill={config.color}
              barSize={window?.innerWidth < 768 ? 20 : 30}
              radius={config.radius}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Right */}
    {
      hasInfoCard &&
      <div className="w-full lg:w-1/4">
        <div className="bg-[#ECD7B4] rounded-[28px] p-4 lg:p-6 text-black h-[200px] flex flex-col justify-between">
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

  // New states
  const [payoutTotal, setPayoutTotal] = useState<any>(null);
  const [payoutWeekly, setPayoutWeekly] = useState<any>([]);
  const [payoutPending, setPayoutPending] = useState<any>(null);
  const [cpCount, setCpCount] = useState<any>(null);
  const [cpCategoryCount, setCpCategoryCount] = useState<any>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          totalRes,
          monthlyRes,
          weeklyRes,
          payoutTotalRes,
          payoutWeeklyRes,
          payoutPendingRes,
          cpCountRes,
          cpCategoryCountRes
        ] = await Promise.all([
          adminApi.getTotalRevenue(),
          adminApi.getMonthlyRevenue(),
          adminApi.getWeeklyRevenue(),
          adminApi.getPayoutTotal(),
          adminApi.getPayoutWeeklyGraph(),
          adminApi.getPayoutPending(),
          adminApi.getCPCount(),
          adminApi.getCategoryWiseCPCount()
        ]);

        if (totalRes && totalRes.data) setRevenueData(totalRes.data);

        if (monthlyRes && monthlyRes.data) {
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

        // Process Payout Data
        if (payoutTotalRes && payoutTotalRes.data) setPayoutTotal(payoutTotalRes.data);

        if (payoutWeeklyRes && payoutWeeklyRes.data) {
          const formattedPayout = Array.isArray(payoutWeeklyRes.data)
            ? payoutWeeklyRes.data.map((item: any) => ({
              name: item.day,
              amount: parseFloat(item.amount)
            }))
            : [];
          setPayoutWeekly(formattedPayout);
        }

        if (payoutPendingRes && payoutPendingRes.data) setPayoutPending(payoutPendingRes.data);

        // Process CP Data
        if (cpCountRes && cpCountRes.data) setCpCount(cpCountRes.data);

        if (cpCategoryCountRes && cpCategoryCountRes.data) {
          const formattedCPCats = Array.isArray(cpCategoryCountRes.data)
            ? cpCategoryCountRes.data.map((item: any) => ({
              name: item.role_name,
              count: item.count
            }))
            : [];
          setCpCategoryCount(formattedCPCats);
        }


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

  // Helper to determine top category
  const getTopCategory = () => {
    if (!cpCategoryCount || cpCategoryCount.length === 0) return "N/A";
    const top = [...cpCategoryCount].sort((a, b) => b.count - a.count)[0];
    return top?.name || "N/A";
  };

  return (
    <div className="dashboard-stack-container w-full bg-[#171717] rounded-2xl border border-[#3D3D3D] p-4">
      {/* SIDE MASK */}
      <div className="relative overflow-hidden px-3 lg:px-10">
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
                title="No Of Creative Partners"
                subtitle="This Is Overall Creative Partners Overview"
                graphTitle="Category Wise Creative Partners"
                rightLabel="Top Category"
                rightValue={getTopCategory()}
                value={cpCount?.total_cps || "0"}
                chartData={cpCategoryCount}
                chartConfig={[
                  { key: "count", color: "#55BF61", stackId: "a", radius: [6, 6, 6, 6] }
                ]}
                hasInfoCard={true} // Changed to true to show top category
                isLoading={isLoading}
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
                rightValue={formatCurrency(payoutPending?.pending_payout || 0)}
                value={formatCurrency(payoutTotal?.total_payout || 0)}
                chartData={payoutWeekly}
                chartConfig={[
                  { key: "amount", color: "#FF8484", stackId: "a", radius: [6, 6, 0, 0] }
                  // Adjust key 'amount' based on actual API response for graph
                ]}
                hasInfoCard={true}
                isLoading={isLoading}
              />
            </CardWrapper>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}
