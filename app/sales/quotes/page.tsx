"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,

  Download,
  Plus,
  Calendar,
  Search,
  ChevronDown,
  MoreVertical,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  BadgeCheck
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
import DottedDivider from "@/components/admin/DottedDivider";

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
    project: "Corporate video production....",
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
    project: "Commercial shoot for new brand....",
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
    project: "Animated explainer video",
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black px-3 py-1 rounded text-sm font-bold shadow-lg">
        {payload[0].value}
      </div>
    );
  }
  return null;
};

export default function QuotesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStat, setSelectedStat] = useState("Total Quotes");

  const stats = [
    {
      title: "Total Quotes",
      value: "26",
      change: "+3%",
      icon: (isSelected: boolean) => <CircleDollarSign className={isSelected ? "text-black" : "text-[#E5D5B8]"} size={20} />,
    },
    {
      title: "Accepted Quotes",
      value: "10",
      change: "+3%",
      icon: (isSelected: boolean) => <BadgeCheck className={isSelected ? "text-black" : "text-[#E5D5B8]"} size={20} />,
    },
    {
      title: "Pending Quotes",
      value: "16",
      change: "+3%",
      icon: (isSelected: boolean) => <Clock className={isSelected ? "text-black" : "text-[#E5D5B8]"} size={20} />,
    },
    {
      title: "Draft Quotes",
      value: "08",
      change: "+3%",
      icon: (isSelected: boolean) => <Calendar className={isSelected ? "text-black" : "text-[#E5D5B8]"} size={20} />,
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-800">
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <Link href="/sales/quotes/create">
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
          <div>
            <h1 className="text-2xl font-semibold mb-2">Quotes Module</h1>
            <p className="text-zinc-500 text-sm">Manage and track all your client quotations.</p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* content area with border */}
        <div className="border border-zinc-800 rounded-3xl p-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-4 bg-[#E5D5B8] rounded-full"></div>
            <span className="text-sm font-medium">Overview</span>
            <div className="ml-auto">
              <button className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400">
                Month <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => {
              const isSelected = selectedStat === stat.title;
              const bgColor = isSelected ? "bg-[#E5D5B8]" : "bg-[#161616]";
              const textColor = isSelected ? "text-[#101010]" : "text-white";
              const iconBg = isSelected ? "bg-black/10" : "bg-white/5";

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedStat(stat.title)}
                  className={`${bgColor} ${textColor} p-6 rounded-2xl flex flex-col justify-between h-40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium opacity-80">{stat.title}</span>
                    <div className={`${iconBg} p-2 rounded-full`}>
                      {stat.icon(isSelected)}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="flex items-center gap-1">
                      <span className={isSelected ? 'text-green-700 font-bold' : 'text-green-500'}>{stat.change}</span>
                      <span className="text-[10px] opacity-60">from last month</span>
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
                    <stop offset="5%" stopColor="#E5D5B8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E5D5B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#555', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#555', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5D5B8', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#E5D5B8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  activeDot={{ r: 6, fill: '#fff', stroke: '#E5D5B8', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search by client name or project..."
              className="w-full bg-[#161616] border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#E5D5B8]/50 transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-3 bg-[#161616] border border-zinc-800 rounded-xl text-sm text-zinc-400 min-w-[150px] justify-between">
              All Salesperson <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-[#161616] border border-zinc-800 rounded-xl text-sm text-zinc-400 min-w-[150px] justify-between">
              All Status <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#161616] rounded-2xl border border-zinc-800 overflow-hidden mb-20 md:mb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4 font-medium">Client Name</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Quote Status</th>
                  <th className="px-6 py-4 font-medium">Valid Until</th>
                  <th className="px-6 py-4 font-medium">Salesperson</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-800/50">
                {quotesData.map((quote) => (
                  <tr key={quote.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${quote.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {quote.initials}
                        </div>
                        <div>
                          <div className="font-medium">{quote.client}</div>
                          <div className="text-[10px] text-zinc-500">{quote.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{quote.project}</td>
                    <td className="px-6 py-4 font-medium">${quote.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium border ${quote.statusColor}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{quote.validUntil}</td>
                    <td className="px-6 py-4 text-zinc-400">{quote.salesperson}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-500 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
