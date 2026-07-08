"use client";

import React, { useState, useEffect } from "react";

import { toast } from "sonner";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";
import EarningsOverviewChart from "@/components/creator-profile/EarningsOverviewChart";
import EarningsCard, { EarningsCardData } from "@/components/creator-profile/EarningsCard";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Search } from "lucide-react";
import EarningsBreakdownModal from "@/components/creator-profile/EarningsBreakdownModal";
import PaymentTimelineModal, { TimelineEvent } from "@/components/creator-profile/PaymentTimelineModal";
import Topbar from "@/components/admin/Topbar";

export const dummyShootCards: EarningsCardData[] = [
  {
    id: "shoot-001",
    name: "Nike Campaign Shoot",
    company: "Nike Inc.",
    status: "Partially Paid",
    date: "Jan 16, 2026",
    address: "Los Angeles, CA",
    time: "12:00 PM - 4:00 PM",
    totalCompensation: 1200,
    advancePaid: 300,
    remainingBalance: 900
  },
  {
    id: "shoot-002",
    name: "Spring Collection Lookbook",
    company: "Zara Global",
    status: "Accepted",
    date: "Feb 05, 2026",
    address: "New York, NY",
    time: "09:00 AM - 5:00 PM",
    totalCompensation: 2500,
    advancePaid: 2000,
    remainingBalance: 500
  },
  {
    id: "shoot-003",
    name: "Commercial Brand Video",
    company: "Apple Production",
    status: "Awaiting Response",
    date: "Mar 12, 2026",
    address: "Cupertino, CA",
    time: "1:00 PM - 6:00 PM",
    totalCompensation: 4500,
    advancePaid: 1000,
    remainingBalance: 3500
  },
  {
    id: "shoot-004",
    name: "Streetwear Editorial",
    company: "Adidas Originals",
    status: "Partially Paid",
    date: "Apr 22, 2026",
    address: "Chicago, IL",
    time: "10:00 AM - 2:00 PM",
    totalCompensation: 1800,
    advancePaid: 600,
    remainingBalance: 1200
  },
  {
    id: "shoot-005",
    name: "Magazine Cover Editorial",
    company: "Vogue Magazine",
    status: "Awaiting Response",
    date: "May 02, 2026",
    address: "Miami, FL",
    time: "08:00 AM - 12:00 PM",
    totalCompensation: 3000,
    advancePaid: 0,
    remainingBalance: 3000
  }
];

const dummyShootData = {
  shootName: "Nike Campaign Shoot",
  clientName: "Ethan Coleman",
  status: "Partially Paid",
  date: "June 18, 2026",
  location: "Los Angeles, CA",
  timeWindow: "12:00 PM - 4:00 PM",
  breakdown: {
    baseShoot: 800,
    editing: 250,
    travel: 100,
    bonus: 50,
  },
  advance: {
    amount: 300,
    date: "June 1, 2026",
  },
  remainingBalance: 900,
  paymentProgress: 25,
};

const dummyTimeline: TimelineEvent[] = [
  {
    id: "ev-1",
    title: "New Shoot Received & Shoot assigned to you",
    date: "May 28, 2026",
    isCompleted: true,
  },
  {
    id: "ev-2",
    title: "Shoot Accepted by you",
    description: "for this new Shoot",
    date: "May 29, 2026",
    isCompleted: true,
  },
  {
    id: "ev-3",
    title: "Advance Payment",
    description: "of $300 Has Been Processed",
    date: "June 01, 2026",
    isCompleted: true,
  },
  {
    id: "ev-4",
    title: "Shoot Completed",
    description: "• Awaiting Completion",
    isCompleted: false,
  },
  {
    id: "ev-5",
    title: "Awaiting Finance Approval",
    isCompleted: false,
  },
  {
    id: "ev-6",
    title: "Final Payment Processed",
    description: "• Remaining Balance Paid",
    isCompleted: false,
  },
];

export default function RequestsShootsPage() {
  const { isDark } = useResolvedTheme()
  const pathname = usePathname();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [range, setRange] = useState('all');
  const [status, setStatus] = useState('all');

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [earnings, setEarnings] = useState<EarningsCardData[]>(dummyShootCards)
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E8D1AB]" />
      </div>
    );
  }

  const handleViewEarnings = () => {
    setIsModalOpen(true)
  }

  const handleViewTimeline = () => {
    setIsPaymentOpen(true)
    setIsModalOpen(false)
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between lg:mb-6">
          <div>
            <h1 className="text-base lg:text-3xl font-bold">Earnings Dashboard</h1>
            <p className={`text-xs lg:text-base ${isDark ? "text-white/60" : "text-black/60"}`}>Monitor upcoming earnings, track payment status, and view detailed compensation breakdowns for your shoots.</p>
          </div>

          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <EarningsOverviewChart />

      <div className={`transition-colors duration-300 border rounded-2xl w-full mt-3 lg:mt-5 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
        <div className="space-y-3 lg:space-y-6 p-3 lg:p-5">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
              <p className="font-medium text-sm lg:text-base">Earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                  }`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={(val) => setRange(val)}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
                  }`}>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
            />
          </div>
        </div>
        <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 p-3 lg:p-5">
          {earnings.map((data, idx) => (
            <EarningsCard key={`key_${idx}`} data={data} handleClick={handleViewEarnings} />
          ))}
        </div>
      </div>

        <EarningsBreakdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          shootData={dummyShootData}
          onDownloadProof={() => console.log("Downloading...")}
          onViewTimeline={() => handleViewTimeline()}
        />

        <PaymentTimelineModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          timelineData={dummyTimeline}
        />
      </div>
    </>
  );
}