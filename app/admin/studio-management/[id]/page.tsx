"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useParams } from "next/navigation";

import { usePathname, useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

import { Button } from "@/components/ui/button";

import Topbar from "@/components/admin/Topbar";
import { ArrowLeft, Eye, MapPin, SquarePen } from "lucide-react";
import StudioAvailability from "@/components/admin/studios/StudioAvailability";
import { StudioGallery } from "@/components/admin/studios/StudioGallery";
import { StudioInformation } from "@/components/admin/studios/StudioInformation";

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

const STUDIO_MEDIA_BASE_URL = "https://d2jhn32fsulyac.cloudfront.net/";

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

const resolveAddressObject = (raw: any) => {
  const nestedAddress =
    raw?.address && typeof raw.address === "object"
      ? raw.address
      : safeJsonParse<Record<string, any>>(raw?.address, {});

  const locationDetails =
    raw?.location_details && typeof raw.location_details === "object"
      ? raw.location_details
      : safeJsonParse<Record<string, any>>(raw?.location_details, {});

  const locationDetailsCamel =
    raw?.locationDetails && typeof raw.locationDetails === "object"
      ? raw.locationDetails
      : safeJsonParse<Record<string, any>>(raw?.locationDetails, {});

  return {
    ...locationDetails,
    ...locationDetailsCamel,
    ...nestedAddress,
    line1: nestedAddress?.line1 ?? raw?.line1 ?? raw?.address_line1 ?? raw?.street_address ?? locationDetails?.line1 ?? locationDetailsCamel?.line1 ?? "",
    line2: nestedAddress?.line2 ?? raw?.line2 ?? raw?.address_line2 ?? locationDetails?.line2 ?? locationDetailsCamel?.line2 ?? "",
    city: nestedAddress?.city ?? raw?.city ?? locationDetails?.city ?? locationDetailsCamel?.city ?? "",
    state: nestedAddress?.state ?? raw?.state ?? locationDetails?.state ?? locationDetailsCamel?.state ?? "",
    zipCode:
      nestedAddress?.zipCode ??
      raw?.zipCode ??
      raw?.postal_code ??
      raw?.zip_code ??
      locationDetails?.zipCode ??
      locationDetailsCamel?.zipCode ??
      "",
    country: nestedAddress?.country ?? raw?.country ?? locationDetails?.country ?? locationDetailsCamel?.country ?? "",
    latitude:
      nestedAddress?.latitude ??
      raw?.latitude ??
      raw?.lat ??
      locationDetails?.latitude ??
      locationDetailsCamel?.latitude ??
      0,
    longitude:
      nestedAddress?.longitude ??
      raw?.longitude ??
      raw?.lng ??
      locationDetails?.longitude ??
      locationDetailsCamel?.longitude ??
      0,
  };
};

const getFirstValidMediaUrl = (media: unknown) => {
  if (!Array.isArray(media)) return null;

  for (const item of media) {
    const rawUrl = extractMediaUrl(item);
    const normalizedUrl = normalizeMediaUrl(rawUrl);
    if (normalizedUrl) {
      return normalizedUrl;
    }
  }

  return null;
};

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(String(url).split("?")[0] || "");
const getMediaArrayWithCover = (media: any[], coverUrl?: string | null) => {
  const cover = coverUrl ? normalizeMediaUrl(coverUrl) : null;
  const ordered = [...(media || [])].sort((a, b) => {
    const aUrl = normalizeMediaUrl(a?.url);
    const bUrl = normalizeMediaUrl(b?.url);
    if (cover && aUrl === cover) return -1;
    if (cover && bUrl === cover) return 1;
    if (Boolean(a?.is_cover)) return -1;
    if (Boolean(b?.is_cover)) return 1;
    return 0;
  });

  return ordered.map((item, index) => ({
    ...item,
    is_cover: index === 0,
  }));
};

const normalizeStudio = (raw: any) => {
  const address = resolveAddressObject(raw);
  const media = Array.isArray(raw?.media)
    ? raw.media.map((item: any, index: number) =>
        typeof item === "string"
          ? { studio_media_id: index, url: normalizeMediaUrl(item), is_cover: index === 0 }
          : { ...item, url: normalizeMediaUrl(extractMediaUrl(item)) },
      )
    : safeJsonParse<any[]>(raw?.media, []);
  const supportedShootTypes = Array.isArray(raw?.supported_shoot_types)
    ? raw.supported_shoot_types
    : safeJsonParse<string[]>(raw?.supported_shoot_types, []);
  const operatingHours = Array.isArray(raw?.operating_hours)
    ? raw.operating_hours
    : safeJsonParse<any[]>(raw?.operating_hours, []);

  return {
    ...raw,
    address,
    media,
    supported_shoot_types: supportedShootTypes,
    operating_hours: operatingHours,
    latitude: Number(raw?.latitude ?? address?.latitude ?? 0) || 0,
    longitude: Number(raw?.longitude ?? address?.longitude ?? 0) || 0,
    amenities: Array.isArray(raw?.amenities) ? raw.amenities : safeJsonParse<any[]>(raw?.amenities, []),
    access_features: Array.isArray(raw?.access_features) ? raw.access_features : safeJsonParse<any[]>(raw?.access_features, []),
    facility_features: raw?.facility_features && typeof raw.facility_features === "object"
      ? raw.facility_features
      : safeJsonParse<Record<string, any>>(raw?.facility_features, {}),
    space_basics: raw?.space_basics && typeof raw.space_basics === "object"
      ? raw.space_basics
      : safeJsonParse<Record<string, any>>(raw?.space_basics, {}),
  };
};

const formatAddress = (address?: Record<string, any>) => {
  if (!address) return "N/A";

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "N/A";
};

const getLocationLabel = (studio: Record<string, any>) => {
  const directLocation =
    typeof studio.location === "string" && studio.location.trim()
      ? studio.location.trim()
      : typeof studio.location_details === "string" && studio.location_details.trim()
        ? studio.location_details.trim()
        : typeof studio.locationDetails === "string" && studio.locationDetails.trim()
          ? studio.locationDetails.trim()
          : "";

  if (directLocation) return directLocation;

  return formatAddress(studio.address);
};


export default function AdminStudiosDetailsPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("Overview");
  const { id } = useParams();
  const [studioData, setStudioData] = useState<any>(null);
  const [loadingStudio, setLoadingStudio] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudio = async () => {
      const res = await adminApi.getStudioById(id as string);
      if (res?.success && res?.data) {
        const normalized = normalizeStudio(res.data);
        setStudioData(normalized);
        const initialCover =
          getFirstValidMediaUrl(normalized.media?.filter((m: any) => m?.is_cover && isImageUrl(normalizeMediaUrl(m?.url)))) ||
          getFirstValidMediaUrl(normalized.media?.filter((m: any) => isImageUrl(normalizeMediaUrl(m?.url)))) ||
          getFirstValidMediaUrl(normalized.media);
        setCoverImage(initialCover);
      }
      setLoadingStudio(false);
    };
    fetchStudio();
  }, [id]);

    if (loadingStudio) return <p className="text-white text-center py-20">Loading...</p>;
    if (!studioData) return <p className="text-white text-center py-20">Studio not found.</p>;

    const shootTypes = Array.isArray(studioData.supported_shoot_types)
      ? studioData.supported_shoot_types
      : safeJsonParse<string[]>(studioData.supported_shoot_types, []);

    const allImages = studioData.media?.map((m: any) => normalizeMediaUrl(extractMediaUrl(m))).filter(Boolean) || [];
    const imageOnly = allImages.filter(isImageUrl);
    const coverMedia = coverImage || imageOnly[0] || allImages[0] || null;
    const location = getLocationLabel(studioData);

    const handleCoverSelect = async (nextCover: string) => {
      const normalizedCover = normalizeMediaUrl(nextCover);
      if (!normalizedCover) return;

      const nextMedia = getMediaArrayWithCover(studioData.media || [], normalizedCover);
      setCoverImage(normalizedCover);
      setStudioData((prev: any) => ({
        ...prev,
        media: nextMedia,
      }));

      try {
        const response = await adminApi.updateStudio(id as string, {
          ...studioData,
          media: nextMedia,
        });

        if (!response?.success) {
          setCoverImage(coverMedia);
          setStudioData((prev: any) => ({
            ...prev,
            media: getMediaArrayWithCover(prev.media || [], coverMedia),
          }));
        }
      } catch (error) {
        console.error("Failed to update cover image", error);
        setCoverImage(coverMedia);
        setStudioData((prev: any) => ({
          ...prev,
          media: getMediaArrayWithCover(prev.media || [], coverMedia),
        }));
      }
    };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">

            <Button
              type="button"
              onClick={() => router.push(`/admin/studio-management/${id}`)}
              variant="outline"
              className={`h-12
                ${isDark
                  ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50"
                  : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"}`
              }
            >
              Preview Studio
              <Eye size={18} />
            </Button>
            <>
              <Button
                type="button"
                onClick={() => router.push(`/admin/studio-management/add-studio?id=${id}`)}
                className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
              >
                Edit Studio
                <SquarePen size={18} />
              </Button>
            </>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => router.back()}
          className={` transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"}`}>
          {/* Header Section */}
          <div className={`rounded-2xl border-b transition-colors duration-200 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"}`}>
            <div className="flex items-start justify-between px-2.5 pt-2.5 lg:px-5 lg:pt-5">
              <div className="flex gap-6 w-full">
                {/* Avatar */}
                <div className={`w-[67px] h-[67px] lg:w-36 lg:h-36 rounded-lg lg:rounded-xl overflow-hidden relative flex-shrink-0 border ${isDark ? "bg-[#222] border-white/5" : "bg-gray-100 border-gray-200"}`}>
                   {coverMedia ? (
                      <img
                        src={coverMedia}
                        alt={studioData.studio_name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${isDark ? "text-[#444] bg-[#222]" : "text-gray-400 bg-gray-100"}`}>
                      {studioData.studio_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex justify-between items-start w-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>{studioData.studio_name}</h1>
                      {studioData.status === "Active" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M9.78133 3.89125C10.3452 3.41072 10.6271 3.17045 10.9219 3.02956C11.6037 2.70369 12.3963 2.70369 13.0781 3.02956C13.3729 3.17045 13.6548 3.41072 14.2187 3.89125C14.4431 4.0825 14.5553 4.17813 14.6752 4.25845C14.9499 4.44257 15.2584 4.57037 15.5828 4.63442C15.7244 4.66236 15.8713 4.67409 16.1653 4.69755C16.9038 4.75648 17.273 4.78595 17.5811 4.89476C18.2936 5.14643 18.8541 5.70689 19.1058 6.41942C19.2146 6.72748 19.244 7.09674 19.303 7.83524C19.3264 8.12917 19.3382 8.27613 19.3661 8.41767C19.4301 8.74211 19.5579 9.05063 19.7421 9.32534C19.8224 9.44518 19.918 9.55739 20.1093 9.78182C20.5898 10.3457 20.8301 10.6276 20.971 10.9224C21.2968 11.6042 21.2968 12.3968 20.971 13.0786C20.8301 13.3734 20.5898 13.6553 20.1093 14.2192C19.918 14.4436 19.8224 14.5558 19.7421 14.6757C19.5579 14.9504 19.4301 15.2589 19.3661 15.5833C19.3382 15.7249 19.3264 15.8718 19.303 16.1658C19.244 16.9043 19.2146 17.2735 19.1058 17.5816C18.8541 18.2941 18.2936 18.8546 17.5811 19.1062C17.273 19.2151 16.9038 19.2445 16.1653 19.3035C15.8713 19.3269 15.7244 19.3386 15.5828 19.3666C15.2584 19.4306 14.9499 19.5584 14.6752 19.7426C14.5553 19.8229 14.4431 19.9185 14.2187 20.1098C13.6548 20.5903 13.3729 20.8305 13.0781 20.9714C12.3963 21.2973 11.6037 21.2973 10.9219 20.9714C10.6271 20.8305 10.3452 20.5903 9.78133 20.1098C9.55691 19.9185 9.44469 19.8229 9.32485 19.7426C9.05014 19.5584 8.74163 19.4306 8.41718 19.3666C8.27564 19.3386 8.12868 19.3269 7.83475 19.3035C7.09625 19.2445 6.72699 19.2151 6.41893 19.1062C5.7064 18.8546 5.14594 18.2941 4.89427 17.5816C4.78546 17.2735 4.75599 16.9043 4.69706 16.1658C4.6736 15.8718 4.66188 15.7249 4.63393 15.5833C4.56988 15.2589 4.44209 14.9504 4.25796 14.6757C4.17764 14.5558 4.08201 14.4436 3.89076 14.2192C3.41023 13.6553 3.16997 13.3734 3.02907 13.0786C2.7032 12.3968 2.7032 11.6042 3.02907 10.9224C3.16997 10.6276 3.41023 10.3457 3.89076 9.78182C4.08201 9.55739 4.17764 9.44518 4.25796 9.32534C4.44209 9.05063 4.56988 8.74211 4.63393 8.41767C4.66188 8.27613 4.6736 8.12917 4.69706 7.83524C4.75599 7.09674 4.78546 6.72748 4.89427 6.41942C5.14594 5.70689 5.7064 5.14643 6.41893 4.89476C6.72699 4.78595 7.09625 4.75648 7.83475 4.69755C8.12868 4.67409 8.27564 4.66236 8.41718 4.63442C8.74163 4.57037 9.05014 4.44257 9.32485 4.25845C9.4447 4.17813 9.55691 4.0825 9.78133 3.89125Z" fill="#16A34A" stroke="#16A34A" strokeWidth="1.5" />
                          <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm lg:text-base mb-1 lg:mb-3 ${isDark ? "text-[#878787]" : "text-gray-500"}`}>{studioData.description}</p>
                    <div className={`flex items-center gap-1 text-xs mb-2 lg:mb-5 ${isDark ? "text-[#C2C2C2]" : "text-gray-600"}`}>
                      <MapPin size={14} className="shrink-0" />
                      <span>{location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                     {shootTypes.map((type: string) => (
                        <span key={type} className={`px-4 py-1.5 rounded-lg text-xs lg:text-sm border ${isDark ? "bg-[171717] text-[#8C8C8C] border-[#FFFFFF33]" : "text-gray-600 border-gray-300"}`}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="bg-[#D4FFE4] text-[#16A34A] px-9 py-3 rounded-full text-sm lg:text-base font-medium w-fit">
                    {studioData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

            {/* Tabs */}
            <div className="w-full lg:mt-2">
              <div className="flex items-center w-fit overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between px-2.5 lg:px-5">
                {['Overview', 'Availability', 'Gallery'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 lg:pb-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0 lg:w-[200px] ${activeTab === tab
                      ? (isDark ? 'text-[#E5D5B8]' : 'text-black')
                      : (isDark ? 'text-[#666666] hover:text-white' : 'text-[#635F5F] hover:text-black')
                      }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className={`absolute bottom-0 left-0 w-full h-[2px] ${isDark ? "bg-[#E5D5B8]" : "bg-black"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Content Section */}
          <div className="p-2.5 lg:p-5">
            <div className={`${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"} rounded-2xl`}>
              <div className="p-4 lg:p-9">
                <p className="text-lg lg:text-xl fotn-medium">
                  {activeTab === "Overview" ? "Additional Information" : activeTab}
                </p>
              </div>

              {/* Divider */}
              <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
              <div className="p-4 lg:p-9">
                {activeTab === "Overview" ? (
                  <>
                    <StudioInformation information={studioData} isDark={isDark} />
                  </>
                ) : activeTab === "Availability" ? (
                  <>
                    <StudioAvailability isDark={isDark} />
                  </>
                ) : (
                  <>
                    <StudioGallery items={allImages} isDark={isDark} coverImage={coverMedia} onCoverSelect={handleCoverSelect} />
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
