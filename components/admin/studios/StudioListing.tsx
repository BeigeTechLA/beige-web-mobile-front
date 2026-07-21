"use client";

import { Eye, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi, type AdminStudioListItem } from "@/lib/api";

const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");

const resolveStudioMediaUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;

  if (/^https?:\/\//i.test(value)) return value;

  if (!S3_PREFIX) return null;

  return `${S3_PREFIX}/${value.replace(/^\/+/, "")}`;
};

interface ListingProps {
  externalSelectedDate?: Date | null;
  isDark?: boolean;
}

export default function StudioListing({ externalSelectedDate, isDark = false }: ListingProps) {
  const [range, setRange] = useState('all');
  const [status, setStatus] = useState<string>("all");
  const [studios, setStudios] = useState<AdminStudioListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }

    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string");
        }
      } catch {
        return [value];
      }
    }

    return [];
  };

  useEffect(() => {
    let active = true;

    const loadStudios = async () => {
      setLoading(true);
      const response = await adminApi.getStudios({
        page: 1,
        limit: 50,
        status,
      });

      if (!active) return;

      if (response.success) {
        setStudios(response.data || []);
      } else {
        setStudios([]);
        toast.error(response.error || "Failed to load studios");
      }

      setLoading(false);
    };

    loadStudios().catch(() => {
      if (active) {
        setStudios([]);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [status]);

  const normalizedStudios = useMemo(() => {
    return studios.map((studio) => ({
      id: String(studio.studio_id),
      name: studio.studio_name,
      status: studio.status,
      hourlyRate: Number(studio.hourly_rate ?? 0),
      overtimeRate: Number(studio.overtime_rate ?? 0),
      minBooking: Number(studio.minimum_booking_hours ?? 0),
      bufferTiming: Number(studio.buffer_time_minutes ?? 0),
      images: (studio.gallery_preview || [])
        .map((item) => resolveStudioMediaUrl(item.url))
        .filter((url): url is string => Boolean(url)),
      supportedTypes: toStringArray(studio.supported_shoot_types),
      cover: resolveStudioMediaUrl(studio.cover_media?.url)
        || resolveStudioMediaUrl(studio.gallery_preview?.[0]?.url)
        || null,
    }));
  }, [studios]);

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
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading studios...
          </div>
        ) : normalizedStudios.length ? (
          normalizedStudios.map((studio) => (
            <div key={studio.id} className={`p-4 lg:p-6 rounded-2xl border transition-colors duration-300 ${isDark ? "bg-[#101010] text-white border-[#3D3D3D]" : "bg-white text-zinc-900 border-zinc-200"}`}>
              <div className="flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-[280px] aspect-[4/3] relative overflow-hidden rounded-xl bg-zinc-100">
                  {studio.cover ? (
                    <img
                      src={studio.cover}
                      alt={studio.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
                      No cover image
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg lg:text-2xl font-medium">{studio.name}</p>
                      <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                        {studio.hourlyRate ? `$${studio.hourlyRate}/hr` : "Rate unavailable"}
                        {studio.minBooking ? ` • Min ${studio.minBooking} hrs` : ""}
                      </p>
                    </div>
                    <span className="bg-[#D4FFE4] text-[#16A34A] px-4 py-2 rounded-full text-xs lg:text-sm font-medium">
                      {studio.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {studio.supportedTypes.length ? studio.supportedTypes.map((type) => (
                      <span key={type} className={`px-3 py-1.5 rounded-lg text-xs border ${isDark ? "bg-[#171717] text-[#8C8C8C] border-[#3D3D3D]" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {type}
                      </span>
                    )) : (
                      <span className={`text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>No supported shoot types</span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Link href={`/admin/studio-management/${studio.id}`}>
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8D1AB] text-[#E8D1AB]">
                        Preview Studio
                        <Eye size={16} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No studios found.
          </div>
        )}

      </div>
    </div>
  );
}
