"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { CircleDollarSign, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";

import { adminApi } from "@/lib/api";

/**
 * Custom CSS for Vertical Stacking
 */
const customSwiperStyles = `
  .dashboard-stack-swiper {
    width: 100%;
    height: 420px !important; 
    padding-top: 30px !important; /* Space for the stacked cards at the top */
    padding-bottom: 30px !important; /* Space for the stacked cards at the bottom */
    overflow: visible !important;
  }

  .dashboard-stack-swiper .swiper-slide {
    border-radius: 16px;
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Adjust the Cards effect for vertical peeking */
  .swiper-slide-shadow {
    display: none !important;
  }
`;

const CardWrapper = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div className={`w-full max-w-[1100px] lg:h-[340px] rounded-2xl border p-5 overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-[#F4F5F7] border-[#D7D7D7] text-[#323232]"
    }`}>
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
  isDark = true,
  chartConfig = [
    { key: "total_revenue", color: "#55BF61", stackId: "a", radius: [6, 6, 6, 6] }
  ]
}: any) => (
  <div className={`flex flex-col lg:flex-row gap-6 h-full items-stretch lg:items-center ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
    {/* Left */}
    <div className="lg:w-1/4 flex flex-col justify-between shrink-0 h-full lg:py-5">
      <div className="flex items-center gap-2">
        <div className="w-[3px] h-6 bg-[#E5D5B8]" />
        <h3>{title}</h3>
      </div>
      <div>
        <h2 className="text-[26px] font-semibold mb-2">
          {isLoading ? (
            <div className={`h-8 w-32 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
          ) : (
            value || "$0"
          )}
        </h2>
        <p className={`text-base ${isDark ? "text-white/40" : "text-[#36363666]"}`}>{subtitle}</p>
      </div>
    </div>

    {/* Chart */}
    <div className={`${hasInfoCard ? "lg:w-1/2" : "lg:w-3/4"} rounded-2xl p-4 border h-[300px] transition-colors ${isDark ? "bg-[#161616] border-white/5" : "bg-[#FFFFFF] border-[#E3E3E3]"
      }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-6 bg-[#E5D5B8]" />
        <h3 className="text-sm lg:text-base ">{graphTitle}</h3>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} stroke={isDark ? "#27272a" : "#E3E3E3"} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
          />
          {chartConfig.map((config: any) => (
            <Bar
              key={config.key}
              dataKey={config.key}
              stackId={config.stackId}
              fill={config.color}
              barSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 30}
              radius={config.radius}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Right Info Card */}
    {hasInfoCard && (
      <div className="w-full lg:w-1/4">
        <div className="bg-[#ECD7B4] rounded-[28px] p-6 lg:p-3 text-black h-[180px] flex flex-col justify-between">
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
    )}
  </div>
);

export default function StackedDashboard() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [payoutTotal, setPayoutTotal] = useState<any>(null);
  const [payoutWeekly, setPayoutWeekly] = useState<any>([]);
  const [payoutPending, setPayoutPending] = useState<any>(null);
  const [cpCount, setCpCount] = useState<any>(null);
  const [cpCategoryCount, setCpCategoryCount] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
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
              total_revenue: parseFloat(
                item.total_revenue ??
                (Number(item.base_revenue || item.base || 0) + Number(item.margin_revenue || item.margin || 0))
              ) || 0
            }))
            : Object.entries(monthlyRes.data).map(([month, values]: [string, any]) => ({
              name: month,
              total_revenue: parseFloat(
                values.total_revenue ??
                (Number(values.base_revenue || values.base || 0) + Number(values.margin_revenue || values.margin || 0))
              ) || 0
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

  const isDark = !mounted || theme === "dark";

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
    <div className={`dashboard-stack-container w-full rounded-2xl border p-3 lg:p-5 transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFF] border-[#E3E3E3]"}`}>
      <style>{customSwiperStyles}</style>
      <div className="relative overflow-hidden px-3 lg:px-10">
        <Swiper
          direction="vertical"
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          className="dashboard-stack-swiper"
          loop={true}
          speed={800}
          cardsEffect={{
            slideShadows: false,
            perSlideOffset: 10,
            perSlideRotate: 0,
          }}
        >
          <SwiperSlide>
            <CardWrapper isDark={isDark}>
              <StatsLayout
                isDark={isDark}
                title="Total Revenue"
                subtitle="This Is Sales Revenue Overview"
                graphTitle="Month On Month Revenue Growth"
                rightLabel="Weekly Revenue"
                rightValue={formatCurrency(weeklyData?.weekly_revenue || revenueData?.weekly_revenue || 0)}
                value={formatCurrency(revenueData?.total_revenue || 0)}
                growth={weeklyData?.growth_percent || 0}
                growthLabel="Last 7 Days"
                chartData={monthlyData}
                chartConfig={[
                  { key: "total_revenue", color: "#55BF61", stackId: "a", radius: [6, 6, 6, 6] }
                ]}
                hasInfoCard={true}
                isLoading={isLoading}
              />
            </CardWrapper>
          </SwiperSlide>

          <SwiperSlide>
            <CardWrapper isDark={isDark}>
              <StatsLayout
                isDark={isDark}
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
            <CardWrapper isDark={isDark}>
              <StatsLayout
                isDark={isDark}
                title="Total Pay-Out"
                subtitle="This Is Overall Payout Overview"
                graphTitle="Weekly Graph Payments"
                rightLabel="Pending Payments"
                rightValue={formatCurrency(payoutPending?.pending_payout || 0)}
                value={formatCurrency(payoutTotal?.total_payout || 0)}
                chartData={payoutWeekly}
                chartConfig={[
                  { key: "amount", color: "#FF8484", stackId: "a", radius: [6, 6, 0, 0] }
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