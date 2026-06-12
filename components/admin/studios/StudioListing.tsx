"use client";

import { Eye } from "lucide-react";
import React, { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudioCard from "./StudioCard";
import { adminApi } from "@/lib/api";

interface StudioData {
  studio_id: number;
  studio_name: string;
  status: 'Active' | 'Inactive';
  hourly_rate: number;
  overtime_rate: number;
  minimum_booking_hours: number;
  buffer_time_minutes: number;
  media: { studio_media_id: number; url: string; is_cover: boolean }[];
  supported_shoot_types: string | string[];
  isBeta?: boolean;
}
interface ListingProps {
  externalSelectedDate?: Date | null;
  isDark?: boolean;
}

export default function StudioListing({ externalSelectedDate, isDark = false }: ListingProps) {

  const [range, setRange] = useState('all');
  const [status, setStatus] = useState<string>("all");
  const [studios, setStudios] = useState<StudioData[]>([]);
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchStudios = async () => {
    setLoading(true);
    const res = await adminApi.getStudios({ status: status !== 'all' ? status : undefined });
    if (res?.success && res?.data) {
      setStudios(res.data);
    }
    setLoading(false);
  };
  fetchStudios();
}, [status]);

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden min-h-[400px] h-full flex flex-col ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFF] border-[#E3E3E3]"
      }`}>
      {/* Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Studio Listing</h3>
        </div>

        {/* Dropdown filters */}
        <div className="flex gap-3">
          {/* <Select value={range} onValueChange={(val) => setRange(val)}>
            <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="week"></SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select> */}

          <Select value={range} onValueChange={(val) => setRange(val)}>
            <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-2 lg:p-5 flex flex-col gap-2.5">
        <div className="p-2 lg:p-5 flex flex-col gap-2.5">
          {loading ? (
            <p className={`text-center py-10 ${isDark ? "text-white/50" : "text-zinc-400"}`}>Loading...</p>
          ) : studios.length === 0 ? (
            <p className={`text-center py-10 ${isDark ? "text-white/50" : "text-zinc-400"}`}>No studios found.</p>
          ) : (
           studios.map((studio) => (
              <div
                key={studio.studio_id}
                onClick={() => window.location.href = `/admin/studio-management/${studio.studio_id}`}
                className="block cursor-pointer"
              >
                <StudioCard studio={studio} isDark={isDark} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}