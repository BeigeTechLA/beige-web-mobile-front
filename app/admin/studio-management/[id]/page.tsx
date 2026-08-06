"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, SquarePen } from "lucide-react";
import { toast } from "react-hot-toast";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { adminApi, type AdminStudioDetail } from "@/lib/api";
import StudioAvailability from "@/components/admin/studios/StudioAvailability";
import { StudioGallery } from "@/components/admin/studios/StudioGallery";
import { StudioInformation } from "@/components/admin/studios/StudioInformation";

const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");

const resolveStudioMediaUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;

  if (/^https?:\/\//i.test(value)) return value;

  if (!S3_PREFIX) return null;

  return `${S3_PREFIX}/${value.replace(/^\/+/, "")}`;
};

export default function AdminStudiosDetailsPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [studio, setStudio] = useState<AdminStudioDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const studioId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    let active = true;

    const loadStudio = async () => {
      if (!studioId) return;

      setLoading(true);
      const response = await adminApi.getStudioById(studioId);

      if (!active) return;

      if (response.success && response.data) {
        setStudio(response.data);
      } else {
        setStudio(null);
        toast.error(response.error || "Failed to load studio details");
      }

      setLoading(false);
    };

    loadStudio().catch(() => {
      if (active) {
        setStudio(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [studioId]);

  const images = useMemo(() => {
    const mediaImages = (studio?.media || [])
      .map((item) => resolveStudioMediaUrl(item.url))
      .filter((url): url is string => Boolean(url));

    return mediaImages.length > 0 ? mediaImages : [];
  }, [studio]);

  const supportedTypes = useMemo(() => {
    const value = studio?.supported_shoot_types;

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
  }, [studio?.supported_shoot_types]);

  const coverLabel = studio?.brand_name || studio?.studio_name || "Studio";
  const locationLabel = [studio?.city, studio?.state, studio?.country].filter(Boolean).join(", ") || studio?.location || "N/A";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`h-12 ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50" : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"}`}
              onClick={() => router.back()}
            >
              Back
              <ArrowLeft size={18} />
            </Button>
            <Button
              variant="outline"
              className={`h-12 ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50" : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"}`}
              onClick={() => window.location.reload()}
            >
              Refresh
              <Loader2 size={18} />
            </Button>
            <Link href="#">
              <Button className="h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Edit Studio
                <SquarePen size={18} />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-9" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {loading ? (
          <div className={`rounded-2xl border p-10 flex items-center justify-center gap-3 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-[#FFFCF6] border-[#E5E5E5] text-black"}`}>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading studio details...
          </div>
        ) : !studio ? (
          <div className={`rounded-2xl border p-10 text-center ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white/70" : "bg-[#FFFCF6] border-[#E5E5E5] text-black/70"}`}>
            Studio not found.
          </div>
        ) : (
          <div className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"}`}>
            <div className={`rounded-2xl border-b transition-colors duration-200 ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5] shadow-sm"}`}>
              <div className="flex items-start justify-between px-2.5 pt-2.5 lg:px-5 lg:pt-5">
                <div className="flex gap-6 w-full">
                  <div className={`w-[67px] h-[67px] lg:w-36 lg:h-36 rounded-lg lg:rounded-xl overflow-hidden relative flex-shrink-0 border ${isDark ? "bg-[#222] border-white/5" : "bg-gray-100 border-gray-200"}`}>
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={coverLabel}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${isDark ? "text-[#444] bg-[#222]" : "text-gray-400 bg-gray-100"}`}>
                        {coverLabel.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start w-full">
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>{coverLabel}</h1>
                      </div>
                      <p className={`text-sm lg:text-base mb-1 lg:mb-3 ${isDark ? "text-[#878787]" : "text-gray-500"}`}>
                        {studio.description || "No description available."}
                      </p>
                      <div className={`flex items-center gap-1 text-xs mb-2 lg:mb-5 ${isDark ? "text-[#C2C2C2]" : "text-gray-600"}`}>
                        <MapPin size={14} className="shrink-0" />
                        <span>{locationLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {supportedTypes.length > 0 ? (
                          supportedTypes.map((type) => (
                            <span key={type} className={`px-4 py-1.5 rounded-lg text-xs lg:text-sm border ${isDark ? "bg-[171717] text-[#8C8C8C] border-[#FFFFFF33]" : "text-gray-600 border-gray-300"}`}>
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>No supported shoot types</span>
                        )}
                      </div>
                    </div>
                    <span className="bg-[#D4FFE4] text-[#16A34A] px-9 py-3 rounded-full text-sm lg:text-base font-medium w-fit">
                      {studio.status}
                    </span>
                  </div>
                </div>
              </div>

              <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

              <div className="w-full lg:mt-2">
                <div className="flex items-center w-fit overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between px-2.5 lg:px-5">
                  {["Overview", "Availability", "Gallery"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 lg:pb-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0 lg:w-[200px] ${activeTab === tab
                        ? (isDark ? "text-[#E5D5B8]" : "text-black")
                        : (isDark ? "text-[#666666] hover:text-white" : "text-[#635F5F] hover:text-black")
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

            <div className="p-2.5 lg:p-5">
              <div className={`${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"} rounded-2xl`}>
                <div className="p-4 lg:p-9">
                  <p className="text-lg lg:text-xl font-medium">
                    {activeTab === "Overview" ? "Additional Information" : activeTab}
                  </p>
                </div>

                <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
                <div className="p-4 lg:p-9">
                  {activeTab === "Overview" ? (
                    <StudioInformation isDark={isDark} information={studio} />
                  ) : activeTab === "Availability" ? (
                    <StudioAvailability isDark={isDark} />
                  ) : (
                    <StudioGallery items={images} isDark={isDark} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
