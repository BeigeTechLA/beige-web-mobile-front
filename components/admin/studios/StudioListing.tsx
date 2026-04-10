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

interface StudioData {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  hourlyRate: number;
  overtimeRate: number;
  minBooking: number;
  bufferTiming: number;
  images: string[];
  supportedTypes: string[];
  isBeta?: boolean;
}

const dummyStudios: StudioData[] = [
  {
    id: "1",
    name: "Sunset Creative Studio",
    status: "Active",
    hourlyRate: 85,
    overtimeRate: 100,
    minBooking: 2,
    bufferTiming: 30,
    images: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
    ],
    supportedTypes: ["Photography", "Videography", "Product"],
  },
  {
    id: "2",
    name: "Industrial Loft 42",
    status: "Active",
    hourlyRate: 120,
    overtimeRate: 150,
    minBooking: 4,
    bufferTiming: 60,
    images: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
    ],
    supportedTypes: ["Commercial", "Fashion", "Podcast"],
  }
];

interface ListingProps {
  externalSelectedDate?: Date | null;
  isDark?: boolean;
}

export default function StudioListing({ externalSelectedDate, isDark = false }: ListingProps) {

  const [range, setRange] = useState('all');
  const [status, setStatus] = useState<string>("all");

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
        {dummyStudios.map((studio) => {
          return <div key={studio.id}>
            <StudioCard studio={studio} isDark={isDark} />
          </div>
        })}

      </div>
    </div>
  );
}