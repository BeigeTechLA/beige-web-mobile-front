"use client";

import React from 'react';
import { useResolvedTheme } from '@/lib/useResolvedTheme';

import { Button } from '../ui/button';
import { Calendar, Clock, Eye, MapPin } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export interface EarningsCardData {
  id: string;
  name: string;
  company: string;
  status: 'Accepted' | 'Partially Paid' | 'Awaiting Response' | 'Unknown';
  date: string; // Formatted like "Jan 16, 2026"
  address: string;
  time: string; // Formatted like "12:00 PM - 4:00 PM"
  totalCompensation: number;
  advancePaid: number;
  remainingBalance: number;
}

interface EarningsCardProps {
  data: EarningsCardData
  handleClick:() => void;
}

export default function EarningsCard({ data, handleClick }: EarningsCardProps) {
  const { isDark } = useResolvedTheme()
  const hasDate = Boolean(data.date?.trim());
  const hasAddress = Boolean(data.address?.trim());
  const hasTime = Boolean(data.time?.trim());

  return (
    <div className={`transition-colors duration-300 border rounded-2xl p-4 lg:p-8 w-full ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      <div className="space-y-3 lg:space-y-5">
        <div className="flex gap-4 items-start">
          <div className="bg-[#1A1919] text-white rounded-full lg:text-xl p-4">
            {getInitials(data.name)}
          </div>
          <div>
            <p className="text-white lg:text-lg font-medium ">{data.name}</p>
            <p className="text-xs lg:text-sm text-white/40">{data.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 text-[#8C8C8C] text-xs lg:text-sm overflow-hidden">
          {hasDate && (
            <div className="flex shrink-0 gap-1 items-center">
              <Calendar size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{data.date}</span>
            </div>
          )}
          {hasAddress && (
            <div className="flex min-w-0 flex-1 gap-1 items-center">
              <MapPin size={16} className="shrink-0" />
              <span className="truncate" title={data.address}>{data.address}</span>
            </div>
          )}
          {hasTime && (
            <div className="flex shrink-0 gap-1 items-center">
              <Clock size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{data.time}</span>
            </div>
          )}
        </div>
      </div>
      <hr className={`border-t my-4 lg:my-5 ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />
      <div className="space-y-3 lg:space-y-5">
        <div className="flex justify-between items-center">
          <p className={`text-xs lg:text-sm text-[#6B6864]`}>Total Compensation</p>
          <p className={`text-[#E8D1AB] text-lg lg:text-2xl font-semibold`}>${data.totalCompensation}</p>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex justify-between items-center bg-[#011A12] border border-[#10B98133] text-[#10B981] rounded-lg p-4 lg:p-5 w-full">
            <p className={`text-xs`}>Paid Amount</p>
            <p className={`lg:text-lg font-semibold`}>${data.advancePaid}</p>
          </div>
          <div className="flex justify-between items-center bg-[#210402] border border-[#F6605433] text-[#F66054] rounded-lg p-4 lg:p-5 w-full">
            <p className={`text-xs`}>Remaining Balance</p>
            <p className={`lg:text-lg font-semibold`}>${data.remainingBalance}</p>
          </div>
        </div>
      </div>
      <hr className={`border-t my-4 lg:my-5 ${isDark ? "border-[#3D3D3D]" : "border-[#000000]/30"}`} />
      <Button
        className={`w-full flex items-center gap-2 px-4 lg:px-6 py-2 text-sm font-medium transition-all rounded-lg h-10 lg:h-12 shrink-0 whitespace-nowrap border ${isDark
          ? "bg-[#1F1F1F] text-[#E8D1AB] border-[#262626] hover:bg-black/90"
          : "bg-transparent text-[#B1B1B1] hover:bg-black/5 hover:text-black"
          }`}
          onClick={handleClick}
      >
        <Eye />
        View Earnings
      </Button>

    </div>
  );
}
