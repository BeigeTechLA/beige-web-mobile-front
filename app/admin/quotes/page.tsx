"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  FileText,
  Download,
  Plus,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  BadgeCheck,
  MoreHorizontal,
  AlarmClock
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from "recharts";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";

const chartData = [
  { name: "Jan", value: 35 },
  { name: "Feb", value: 38 },
  { name: "Mar", value: 30 },
  { name: "Apr", value: 65 },
  { name: "May", value: 75 },
  { name: "Jun", value: 45 },
  { name: "Jul", value: 60 },
];

const quotesData = [
  {
    id: 1,
    client: "Ethan Carter",
    location: "New York, NY",
    initials: "EC",
    color: "bg-[#FFF6E9] text-[#101010]",
    project: "Corporate video production project for the new headquarters.",
    amount: "13,475.70",
    status: "Sent",
    statusColor: "bg-[#D6E6FF] text-[#4A90E2] border-transparent",
    validUntil: "April 15, 2026",
    salesperson: "John Smith",
  },
  {
    id: 2,
    client: "Rami Guzman",
    location: "San Francisco, CA",
    initials: "RG",
    color: "bg-[#D6E6FF] text-[#4A90E2]",
    project: "Product launch video campaign",
    amount: "10,840.50",
    status: "Viewed",
    statusColor: "bg-[#E6DBFF] text-[#9070FF] border-transparent",
    validUntil: "April 20, 2026",
    salesperson: "Sarah Johnson",
  },
  {
    id: 3,
    client: "Jhas Lee",
    location: "Los Angeles, CA",
    initials: "JL",
    color: "bg-[#FFF6E9] text-[#785E3D]",
    project: "Commercial shoot for new brand campaign.",
    amount: "3,410.00",
    status: "Accepted",
    statusColor: "bg-[#D6FFE6] text-[#27AE60] border-transparent",
    validUntil: "April 10, 2026",
    salesperson: "Michael Chen",
  },
  {
    id: 4,
    client: "Kevin Brooks",
    location: "Austin, TX",
    initials: "KB",
    color: "bg-[#D6FFE6] text-[#27AE60]",
    project: "Animated explainer video for SaaS product.",
    amount: "34,964.75",
    status: "Draft",
    statusColor: "bg-[#D1D5DB] text-[#4B5563] border-transparent",
    validUntil: "April 25, 2026",
    salesperson: "Emily Rodriguez",
  },
  {
    id: 5,
    client: "Lisa Anderson",
    location: "New York, NY",
    initials: "LA",
    color: "bg-[#FFD6E6] text-[#EB5757]",
    project: "Social media content package",
    amount: "2,712.50",
    status: "Rejected",
    statusColor: "bg-[#FFD1D1] text-[#EB5757] border-transparent",
    validUntil: "March 20, 2026",
    salesperson: "John Smith",
  },
  {
    id: 6,
    client: "Ethan Cole",
    location: "Austin, TX",
    initials: "EC",
    color: "bg-[#FFD1B6] text-[#D35400]",
    project: "Podcast recording and editing",
    amount: "1,533.00",
    status: "Expired",
    statusColor: "bg-[#FFF6E9] text-[#D4A017] border-transparent",
    validUntil: "March 10, 2026",
    salesperson: "Sarah Johnson",
  },
];

const CustomTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? "bg-white" : "bg-[#E8D1AB] "} text-black px-3 py-1 rounded text-sm font-bold shadow-lg`}>
        {payload[0].value}
      </div>
    );
  }
  return null;
};

export default function QuotesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStat, setSelectedStat] = useState("Total Quotes");

  const [selectedSP, setSelectedSP] = useState("All Salespersons")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")

  // State for expandable rows on mobile
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const stats = [
    {
      title: "Total Quotes",
      value: "26",
      change: "+3%",
      icon: (isSelected: boolean) => <CircleDollarSign className={"fill-[#E8D1AB] stroke-black"} size={20} strokeWidth={1} />,
    },
    {
      title: "Accepted Quotes",
      value: "10",
      change: "+3%",
      icon: (isSelected: boolean) => <BadgeCheck className={"fill-[#E8D1AB] stroke-black"} size={20} strokeWidth={1} />,
    },
    {
      title: "Pending Quotes",
      value: "16",
      change: "+3%",
      icon: (isSelected: boolean) => <AlarmClock className={"fill-[#E8D1AB] stroke-black"} size={20} strokeWidth={1} />,
    },
    {
      title: "Draft Quotes",
      value: "08",
      change: "+3%",
      icon: (isSelected: boolean) => <Calendar className={"fill-[#E8D1AB] stroke-black"} size={20} strokeWidth={1} />,
    }
  ];

  useEffect(() => setMounted(true), []);
  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  // Chart white theme colors
  const stopColor = isDark ? "#E5D5B8" : "#000000";
  const stopOpacityStart = isDark ? 0.3 : 0.4;

  return (
    <div className={`min-h-screen overflow-hidden ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className={`border ${isDark ? "bg-[#202020] border-[#FFFFFF33] text-white hover:bg-[#202020]/50" : "bg-[#F0F0F0] hover:bg-[#A4A5A6]/60 border-[#E3E3E3] text-black"}`}>
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <Link href="/admin/quotes/create">
              <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Create New Quote
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 lg:p-10">
        {/* Module Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="max-w-1/2">
            <h1 className="lg:text-2xl font-semibold mb-2">Quotes Module</h1>
            <p className={`${isDark ? "text-[#FFFFFFB2]" : "text-[#000000B2]"} text-xs lg:text-sm`}>Manage and track all your client quotations.</p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* content area with border */}
        <div className={`border rounded-3xl p-6 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFFFFF] border-[#E5E5E5]"}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-4 bg-[#E5D5B8] rounded-full"></div>
            <span className="text-sm font-medium">Overview</span>
            <div className="ml-auto">
              <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] border ${isDark ? "bg-zinc-900 text-zinc-400 border-[#807E7E]":"bg-[#FFFFFF] border-[#E5E5E5] text-[#C4C4C4]"}`}>
                Month <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 rounded-xl ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
            {stats.map((stat, idx) => {
              const isSelected = selectedStat === stat.title;
              const bgColor = isSelected ? (isDark ? "bg-[#E5D5B8]" : "bg-[#ECD7B4]") : (isDark ? "bg-[#161616]" : "bg-[#F4F5F7]")
              const textColor = isSelected ? (isDark ? "text-[#101010]" : "text-black") : (isDark ? "text-white" : "text-black")
              const iconBg = isSelected ? "bg-[#171717]" : (isDark ? "bg-white/5" : "bg-[#FFF]");

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedStat(stat.title)}
                  className={`${bgColor} ${textColor} p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium opacity-80">{stat.title}</span>
                    <div className={`${iconBg} text-[#E8D1AB] p-2 rounded-full`}>
                      {stat.icon(isSelected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="flex items-center gap-1">
                      <span className={isSelected ? 'text-green-700 font-bold' : 'text-green-500'}>{stat.change}</span>
                      <span className="text-xs opacity-60">from last month</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="h-80 w-full mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stopColor} stopOpacity={stopOpacityStart} />
                    <stop offset="95%" stopColor={stopColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={isDark ? "#27272a" : "#E3E3E3"} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
                />
                <Tooltip
                  content={(props) => <CustomTooltip {...props} isDark={isDark} />}
                  cursor={{ stroke: '#E5D5B8', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isDark ? '#E5D5B8' : '#00000066'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  activeDot={{ r: 6, fill: isDark ? '#121212' : '#FFFFFF', stroke: '#E5D5B8', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2  ${isDark ? "text-zinc-500" : "text-black/70"}`} size={18} />
            <input
              type="text"
              placeholder="Search by client name or project..."
              className={`w-full border rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-[#202020] border-[#FFFFFF33] focus:border-[#E5D5B8]/50" : "bg-[#fff] border-[#E3E3E3] focus:border-[#A4A5A6]"}`}
            />
          </div>
          <div className="flex gap-4">
            {/* <button className="flex items-center gap-2 px-4 py-3 bg-[#161616] border border-[#3D3D3D] rounded-xl text-sm text-zinc-400 min-w-[150px] justify-between">
              All Salesperson <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-[#161616] border border-[#3D3D3D] rounded-xl text-sm text-zinc-400 min-w-[150px] justify-between">
              All Status <ChevronDown size={16} />
            </button> */}
            <BasicDropdown
              label="Salesperson"
              value={selectedSP}
              options={["All Salesperson", "XYZ", "ABC"]}
              onChange={(val) => setSelectedSP(val)}
            />
            <BasicDropdown
              label="Status"
              value={selectedStatus}
              options={["All Statuses", "Sent", "Viewed", "Accepted", "Draft", "Rejected", "Expired"]}
              onChange={(val) => setSelectedStatus(val)}
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className={`rounded-2xl border overflow-hidden mb-20 md:mb-0 ${isDark ? "bg-[#161616] border-[#3D3D3D]" : "bg-[#FFFFFF] border-[#E5E5E5]"}`}>
          {/* <div className="overflow-x-auto"> */}
          <table className="w-full text-left">
            <thead>
              <tr className={`hidden md:table-row border-b rounded-b-lg text-sm capitalize ${isDark ? "border-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "border-[#e5e5e5] text-[#000] bg-[#FFFCF6]"}`}>
                <th className="px-6 py-4 font-medium">Client Name</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Quote Status</th>
                <th className="px-6 py-4 font-medium">Valid Until</th>
                <th className="px-6 py-4 font-medium">Salesperson</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
              {/* Mobile Head */}
              <tr className={`md:hidden border-b text-sm ${isDark ? "border-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "border-[#e5e5e5] text-[#000] bg-[#FFFCF6]"}`}>
                <th className="px-4 py-4 font-medium">Client Name</th>
                <th className="px-4 py-4 font-medium text-right">Quote Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {quotesData.map((quote) => {
                const isExpanded = !!expandedRows[quote.id];
                return (
                  <React.Fragment key={quote.id}>
                    {/* Main Row */}
                    <tr
                      onClick={() => window.innerWidth < 768 && toggleRow(quote.id)}
                      className={`transition-colors group border-b cursor-pointer md:cursor-default ${isDark ? 'border-[#3D3D3D]/50' : 'border-[#E3E3E3]'} ${isExpanded ? (isDark ? 'bg-[#202020] md:bg-[#171717]' : 'bg-[#F9F9F9]'): (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}
                    >
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Chevron for mobile */}
                          <div className={`md:hidden rounded-full border p-1 transition-colors ${isExpanded ? (isDark ?  "text-[#E8D1AB] border-[#E8D1AB]":" text-black border-black") : (isDark ? "text-[#777674] border-[#777674]" : "text-[#777674] border-[#D9D9D9]")}`}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                          <div className={`w-10 h-10 rounded-xl ${quote.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {quote.initials}
                          </div>
                          <div>
                            <div className={`font-medium ${isDark ? 'text-[#FFFFFF66]' : 'text-[#000000]'}`}>{quote.client}</div>
                            <div className={`hidden md:block text-sm ${isDark ? 'text-white/40' : 'text-[#00000066]'}`}>{quote.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`hidden md:table-cell px-6 py-4 ${isDark ? 'text-white' : 'text-[#000000]'}`}>{quote.project}</td>
                      <td className={`hidden md:table-cell px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-[#000000]'}`}>${quote.amount}</td>
                      <td className="px-4 md:px-6 py-4 text-right md:text-left">
                        <span className={`px-3 py-1 rounded-full text-[12px] md:text-base font-medium border ${quote.statusColor}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className={`hidden md:table-cell px-6 py-4 ${isDark ? 'text-white' : 'text-[#000000]'}`}>{quote.validUntil}</td>
                      <td className={`hidden md:table-cell px-6 py-4 ${isDark ? 'text-white' : 'text-[#000000]'}`}>{quote.salesperson}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-right">
                        <button className={`transition-colors ${isDark ? 'text-[#E8D1AB] hover:text-white' : 'text-zinc-400 hover:text-[#171717]'}`}>
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>

                    {/* Mobile Expandable Row */}
                    {isExpanded && (
                      <tr className={`md:hidden border-b ${isDark ? 'bg-[#202020] border-[#3D3D3D]/50' : 'bg-[#F9F9F9] border-[#E3E3E3]'}`}>
                        <td colSpan={2} className="px-4 pt-6 pb-4 space-y-4">
                          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div className="">
                              <p className={`text-xs font-medium capitalize mb-1 ${isDark ? 'text-[#F5F5F5]' : 'text-[#000]'}`}>Project</p>
                              <p className={`text-sm leading-snug truncate whitespace-nowrap ${isDark ? 'text-[#A1A1A1]' : 'text-[#505050]'}`}>{quote.project}</p>
                            </div>

                            <div className="text-right">
                              <p className={`text-xs font-medium capitalize mb-1 ${isDark ? 'text-[#F5F5F5]' : 'text-[#000]'}`}>Amount</p>
                              <p className={`text-sm leading-snug truncate whitespace-nowrap ${isDark ? 'text-[#A1A1A1]' : 'text-[#505050]'}`}>${quote.amount}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                            <div>
                              <p className={`text-xs font-medium capitalize mb-1 ${isDark ? 'text-[#F5F5F5]' : 'text-[#000]'}`}>Valid Until</p>
                              <p className={`text-sm leading-snug truncate whitespace-nowrap ${isDark ? 'text-[#A1A1A1]' : 'text-[#505050]'}`}>{quote.validUntil}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium capitalize mb-1 ${isDark ? 'text-[#F5F5F5]' : 'text-[#000]'}`}>Sales Person</p>
                              <p className={`text-sm leading-snug truncate whitespace-nowrap ${isDark ? 'text-[#A1A1A1]' : 'text-[#505050]'}`}>{quote.salesperson}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs font-medium capitalize mb-1 ${isDark ? 'text-[#F5F5F5]' : 'text-[#000]'}`}>Action</p>
                              <div className="flex justify-end">
                                <button className="p-2 text-[#E8D1AB] hover:bg-[#2a2a2a] rounded-lg transition-colors">
                                  <MoreHorizontal size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] ${isDark ? "bg-[#0f0f0f]":"bg-[#F3F4F6]"}`}>
        <Button
          onClick={() => router.push('/admin/quotes/create')}
          className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          Create New Quote
        </Button>
      </div>
    </div>
  );
}