"use client";

import { Eye, Loader2, Pencil } from "lucide-react";
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

// Premium fallback images to ensure 3 thumbnails and cover always look complete
const defaultImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=500&auto=format&fit=crop&q=80",
];

const getThumbnails = (images: string[], cover: string | null): string[] => {
  const pool = new Set<string>();
  if (cover) pool.add(cover);
  images.forEach((img) => pool.add(img));

  const list = Array.from(pool);

  while (list.length < 4) {
    list.push(defaultImages[list.length % defaultImages.length]);
  }

  return list.slice(0, 4);
};

interface ListingProps {
  isDark?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  panelFiltersVisible?: boolean;
}

type StudioSortKey = "created_at" | "name" | "price" | "status";
type StudioSortOrder = "ASC" | "DESC";
type StudioPeriod = "all" | "week" | "month";

const MONTH_OPTIONS = [
  { label: "January", value: "January" },
  { label: "February", value: "February" },
  { label: "March", value: "March" },
  { label: "April", value: "April" },
  { label: "May", value: "May" },
  { label: "June", value: "June" },
  { label: "July", value: "July" },
  { label: "August", value: "August" },
  { label: "September", value: "September" },
  { label: "October", value: "October" },
  { label: "November", value: "November" },
  { label: "December", value: "December" },
] as const;

export default function StudioListing({ isDark = false, searchQuery = "", statusFilter = "all", panelFiltersVisible = true }: ListingProps) {
  const [period, setPeriod] = useState<StudioPeriod>("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState<StudioSortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<StudioSortOrder>("DESC");
  const [studios, setStudios] = useState<AdminStudioListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // State to track active clicked thumbnail for each studio ID
  const [activeImageMap, setActiveImageMap] = useState<Record<string, string>>({});

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
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
        period,
        ...(monthFilter !== "all" ? { month: monthFilter } : {}),
        sort_by: sortBy,
        sort_order: sortOrder,
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
  }, [monthFilter, period, searchQuery, sortBy, sortOrder, statusFilter]);

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
      cover:
        resolveStudioMediaUrl(studio.cover_media?.url) ||
        resolveStudioMediaUrl(studio.gallery_preview?.[0]?.url) ||
        null,
    }));
  }, [studios]);

  return (
    <div
      className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden min-h-[400px] h-full flex flex-col ${
        isDark ? "bg-[#101010] border-[#222222]" : "bg-[#FFF] border-[#E3E3E3]"
      }`}
    >
      {/* Header Controls */}
      <div
        className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${
          isDark ? "bg-[#101010] border-b-[#222222]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={`font-semibold text-lg ${isDark ? "text-white" : "text-[#323232]"}`}>
            Studio Listing
          </h3>
        </div>

        {/* Dropdown filters matching user screenshot */}
        {panelFiltersVisible ? (
          <div className="flex gap-2">
          {/* Dropdown 1: Range */}
          <Select value={period} onValueChange={(val) => setPeriod(val as StudioPeriod)}>
            <SelectTrigger
              className={`w-[85px] lg:w-[100px] rounded-full h-8 text-[11px] lg:text-xs focus:ring-0 ${
                isDark
                  ? "bg-[#151515] border-[#2c2c2c] text-zinc-400 hover:text-white"
                  : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-100"
              }`}
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark ? "bg-[#151515] border-[#2c2c2c] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}
            >
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Dropdown 2: Month */}
          <Select value={monthFilter} onValueChange={(val) => setMonthFilter(val)}>
            <SelectTrigger
              className={`w-[85px] lg:w-[100px] rounded-full h-8 text-[11px] lg:text-xs focus:ring-0 ${
                isDark
                  ? "bg-[#151515] border-[#2c2c2c] text-zinc-400 hover:text-white"
                  : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-100"
              }`}
            >
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark ? "bg-[#151515] border-[#2c2c2c] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}
            >
              <SelectItem value="all">Month</SelectItem>
              {MONTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={`${sortBy}:${sortOrder}`} onValueChange={(val) => {
            const [nextSortBy, nextSortOrder] = val.split(":") as [StudioSortKey, StudioSortOrder];
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
          }}>
            <SelectTrigger
              className={`w-[110px] lg:w-[120px] rounded-full h-8 text-[11px] lg:text-xs focus:ring-0 ${
                isDark
                  ? "bg-[#151515] border-[#2c2c2c] text-zinc-400 hover:text-white"
                  : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-100"
              }`}
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark ? "bg-[#151515] border-[#2c2c2c] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}
            >
              <SelectItem value="created_at:DESC">Newest</SelectItem>
              <SelectItem value="name:ASC">Name A-Z</SelectItem>
              <SelectItem value="price:ASC">Price Low-High</SelectItem>
              <SelectItem value="status:ASC">Status</SelectItem>
            </SelectContent>
          </Select>

        </div>
        ) : null}
      </div>

      <div className="p-4 lg:p-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading studios...
          </div>
        ) : normalizedStudios.length ? (
          normalizedStudios.map((studio) => {
            const studioImages = getThumbnails(studio.images, studio.cover);
            const mainImage = activeImageMap[studio.id] || studioImages[0];
            const thumbnails = studioImages.slice(1, 4);
            const finalSupportedTypes =
              studio.supportedTypes.length > 0
                ? studio.supportedTypes
                : ["Photography", "Videography", "Product"];

            return (
              <div
                key={studio.id}
                className={`p-5 lg:p-6 rounded-2xl border transition-colors duration-300 ${
                  isDark ? "bg-[#101010] text-white border-[#222222]" : "bg-white text-zinc-900 border-zinc-200"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Image Gallery (1 Large + 3 Thumbnails below) */}
                  <div className="w-full md:w-[347px] flex flex-col gap-3">
                    {/* Main Image */}
                    <div
                      className={`relative aspect-[16/10] w-full overflow-hidden rounded-xl border ${
                        isDark ? "bg-zinc-900 border-[#222222]" : "bg-zinc-100 border-zinc-200"
                      }`}
                    >
                      <img
                        src={mainImage}
                        alt={studio.name}
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
                      />
                    </div>
                    {/* Thumbnails row */}
                    <div className="flex gap-3 justify-between">
                      {thumbnails.map((thumbUrl, idx) => {
                        const isActive = mainImage === thumbUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setActiveImageMap((prev) => ({
                                ...prev,
                                [studio.id]: thumbUrl,
                              }))
                            }
                            className={`flex-1 aspect-[4/3] relative overflow-hidden rounded-lg cursor-pointer border-2 transition-all ${
                              isActive
                                ? "border-[#E5D5B8] opacity-100"
                                : isDark
                                ? "border-[#222222] opacity-60 hover:opacity-100"
                                : "border-zinc-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={thumbUrl}
                              alt={`thumb-${idx}`}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Studio Information & Actions */}
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    {/* Top Row: Active badge and Price */}
                    <div className="flex justify-between items-start">
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                          studio.status?.toLowerCase() === "rejected"
                            ? "bg-[#FEE2E2] text-[#EF4444]"
                            : studio.status?.toLowerCase() === "pending"
                            ? "bg-[#FEF3C7] text-[#D97706]"
                            : "bg-[#E5F9ED] text-[#22C55E]"
                        }`}
                      >
                        {studio.status || "Active"}
                      </span>
                      <div className="text-xl lg:text-2xl font-bold text-[#E5D5B8]">
                        ${studio.hourlyRate || 85}/Hour
                      </div>
                    </div>

                    {/* Title */}
                    <div className="-mt-2">
                      <h2 className="text-lg lg:text-2xl font-semibold text-white">
                        {studio.name}
                      </h2>
                    </div>

                    {/* Horizontal Stats Row */}
                    <div
                      className={`flex items-center gap-6 py-2 border-y ${
                        isDark ? "border-[#222222]" : "border-zinc-200"
                      }`}
                    >
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Overtime Rate
                        </div>
                        <div className="text-sm font-semibold text-white/90">
                          ${studio.overtimeRate || 100}/hour
                        </div>
                      </div>
                      <div className={`h-8 w-[1px] ${isDark ? "bg-[#222222]" : "bg-zinc-200"}`} />
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Minimum Booking
                        </div>
                        <div className="text-sm font-semibold text-white/90">
                          {studio.minBooking || 2} Hours
                        </div>
                      </div>
                      <div className={`h-8 w-[1px] ${isDark ? "bg-[#222222]" : "bg-zinc-200"}`} />
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          Buffer Timing
                        </div>
                        <div className="text-sm font-semibold text-white/90">
                          {studio.bufferTiming || 30} Minutes
                        </div>
                      </div>
                    </div>

                    {/* Supported Shoot Types */}
                    <div>
                      <p className={`text-xs font-semibold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        Supported Shoot Types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {finalSupportedTypes.map((type) => (
                          <span
                            key={type}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                              isDark
                                ? "bg-[#151515] text-[#8C8C8C] border-[#222222]"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex justify-between items-center mt-3 pt-3">
                      <Link href={`/admin/studio-management/${studio.id}`}>
                        <button
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            isDark
                              ? "border-[#222222] text-zinc-300 hover:bg-[#151515] hover:border-zinc-700"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                          }`}
                        >
                          Preview Studio
                          <Eye size={14} />
                        </button>
                      </Link>

                      <Link href={`/admin/studio-management/edit-studio/${studio.id}`}>
                        <button className="flex items-center gap-2 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] px-5 py-2 rounded-lg text-xs font-semibold transition-colors">
                          Edit
                          <Pencil size={14} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center text-sm text-zinc-500">
            No studios found.
          </div>
        )}
      </div>
    </div>
  );
}
