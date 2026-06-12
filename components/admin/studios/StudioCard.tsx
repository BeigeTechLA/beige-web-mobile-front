/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, SquarePen } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Separator } from '@/app/search-results/[creatorId]/components/Separator';

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

const STUDIO_MEDIA_BASE_URL = "https://d2jhn32fsulyac.cloudfront.net/";

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value as T;
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeMediaUrl = (url: unknown) => {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^(blob:|https?:\/\/|data:)/i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.replace(/^assets\/studio\//i, "").replace(/^\/+/, "");
  return `${STUDIO_MEDIA_BASE_URL}${normalizedPath}`;
};

const extractMediaUrl = (item: unknown) => {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  const mediaItem = item as Record<string, unknown>;
  return (
    mediaItem.url ??
    mediaItem.media_url ??
    mediaItem.file_url ??
    mediaItem.path ??
    mediaItem.source_url ??
    ""
  );
};

const resolveStudioMedia = (media: unknown) => {
  const mediaItems = Array.isArray(media)
    ? media
    : safeJsonParse<any[]>(media, []);

  const normalizedItems = Array.isArray(mediaItems)
    ? mediaItems
    : mediaItems && typeof mediaItems === "object"
      ? Object.values(mediaItems as Record<string, unknown>)
      : [];

  return normalizedItems
    .map((item) => {
      const rawUrl = extractMediaUrl(item);
      const normalizedUrl = normalizeMediaUrl(rawUrl);
      const isCover =
        typeof item === "object" &&
        item !== null &&
        Boolean(
          (item as Record<string, unknown>).is_cover ??
          (item as Record<string, unknown>).isCover ??
          (item as Record<string, unknown>).cover ??
          (item as Record<string, unknown>).is_default
        );

      return {
        url: normalizedUrl,
        isCover,
      };
    })
    .filter((item) => Boolean(item.url))
    .sort((a, b) => Number(b.isCover) - Number(a.isCover));
};

const resolveStudioCardImages = (studio: Record<string, unknown>) => {
  const sourceCandidates = [
    studio.media,
    studio.studio_media,
    studio.studioMedia,
    studio.gallery,
    studio.images,
    studio.image,
    studio.thumbnail,
    studio.cover_image,
    studio.coverImage,
    studio.cover_media,
    studio.coverMedia,
  ];

  const resolved = sourceCandidates
    .flatMap((source) => resolveStudioMedia(source).map((item) => item.url))
    .filter(Boolean);

  if (resolved.length > 0) return resolved;

  const directStringCandidates = [
    studio.cover_image,
    studio.coverImage,
    studio.cover_media,
    studio.coverMedia,
    studio.thumbnail,
    studio.image,
  ];

  return directStringCandidates
    .map((candidate) => normalizeMediaUrl(candidate))
    .filter(Boolean);
};

interface StudioCardProps {
  studio: StudioData;
  isDark: boolean;
}

const StudioCard = ({ studio, isDark }: StudioCardProps) => {
  const router = useRouter();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  // Theme-based classes
  const theme = {
    card: isDark ? 'bg-[#101010] text-white border-[#3D3D3D]' : 'bg-white text-zinc-900 border-zinc-200',
    textMuted: isDark ? 'text-[#AAA7A7]' : 'text-zinc-400',
    textLabel: isDark ? 'text-white' : 'text-zinc-500',
    border: isDark ? 'border-[#3D3D3D]' : 'border-zinc-200',
    tag: isDark ? 'bg-[#171717] text-[#8C8C8C] border-[#F5EBDA33]' : 'bg-zinc-100 text-zinc-600 border-zinc-200',
    btnSecondary: isDark ? 'border-[#F5EBDA33] hover:border-[#E8D1AB]' : 'border-zinc-200 hover:bg-zinc-50',
  };

  const allImages = resolveStudioCardImages(studio as any);

  const shootTypes = Array.isArray(studio.supported_shoot_types)
  ? studio.supported_shoot_types
  : JSON.parse(studio.supported_shoot_types || '[]');

  return (
    <div className={`p-6 rounded-2xl border font-sans transition-colors duration-300 ${theme.card}`}>
      <div className="flex flex-col md:flex-row gap-6">

        {/* Image Section with Carousel */}
        <div className="w-full md:w-[360px] overflow-hidden h-full">
          {/* Main Display Image */}
          {allImages.length > 0 ? (
            <>
              <Swiper
                spaceBetween={10}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="rounded-lg aspect-[4/3] mb-3 lg:w-[347px] lg:h-[248px]"
              >
                {allImages.map((url, idx) => (
                  <SwiperSlide key={`main-${idx}`}>
                    <img src={url} alt={studio.studio_name} className="w-full h-full object-cover" />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Thumbnails Carousel (3 visible at a time) */}
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={8}
                slidesPerView={3}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="thumbs-swiper"
              >
                {allImages.map((url, idx) => (
                  <SwiperSlide key={`thumb-${idx}`} className="cursor-pointer opacity-40 [&.swiper-slide-thumb-active]:opacity-100 transition-opacity">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent [.swiper-slide-thumb-active_&]:border-[#e2d1b1]">
                      <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </>
          ) : (
            <div className={`rounded-lg aspect-[4/3] mb-3 lg:w-[347px] lg:h-[248px] flex items-center justify-center border ${isDark ? "bg-[#171717] border-[#3D3D3D] text-[#8C8C8C]" : "bg-[#F5F5F5] border-zinc-200 text-zinc-400"}`}>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">
                  {studio.studio_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div className="text-xs">No preview available</div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between gap-3 lg:gap-5">
          <span className="bg-[#D4FFE4] text-[#16A34A] px-9 py-3 rounded-full text-sm lg:text-base font-medium w-fit">
            {studio.status}
          </span>

          <div className="flex justify-between items-start">
            <h2 className="text-lg lg:text-2xl ">{studio.studio_name}</h2>
            <div className="text-lg lg:text-2xl font-semibold text-[#E8D1AB]">
              ${studio.hourly_rate}/Hour
            </div>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className={`flex gap-4 lg:gap-7 items-center text-xs lg:text-sm`}>
            <div>
              <p className={`${theme.textMuted}`}>Overtime Rate:</p>
              <p className="">${studio.overtime_rate}/hr</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="18" viewBox="0 0 1 18" fill="none">
              <path d="M0.5 0V17.5" stroke="#E0E0E0" />
            </svg>
            <div className={``}>
              <p className={`${theme.textMuted}`}>Minimum Booking:</p>
              <p className="">{studio.minimum_booking_hours} Hrs</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="18" viewBox="0 0 1 18" fill="none">
              <path d="M0.5 0V17.5" stroke="#E0E0E0" />
            </svg>
            <div className="">
              <p className={`${theme.textMuted}`}>Buffer Time:</p>
              <p className="">{studio.buffer_time_minutes} Min</p>
            </div>
          </div>


          <Separator />

          <div className="">
            <p className={`${theme.textLabel} text-xs font-medium mb-3`}>Supported Shoot Types</p>
            <div className="flex flex-wrap gap-2">
            {shootTypes.map((type: string) => (
                <span key={type} className={`px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium border ${theme.tag}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center mt-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/studio-management/${studio.studio_id}`);
              }}
              className={`flex items-center gap-2 p-3.5 rounded-lg text-sm font-medium border transition-colors text-[#E8D1AB] ${theme.btnSecondary}`}
            >
              Preview Studio
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/studio-management/add-studio?id=${studio.studio_id}`);
              }}
              className="flex items-center gap-2 bg-[#E8D1AB] text-[#101010] p-3.5 rounded-lg text-sm font-semibold hover:bg-[#e2d1b1] transition-transform"
            >
              Edit
              <SquarePen size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioCard;
