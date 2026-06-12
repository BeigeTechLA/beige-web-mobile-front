/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Plus, PlayCircle, X } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/lib/api";

interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  status: "uploaded" | "uploading" | "error";
  is_cover?: boolean;
  fileName?: string;
  clientId?: string;
}

const STUDIO_MEDIA_BASE_URL = "https://d2jhn32fsulyac.cloudfront.net/";

const normalizeMediaUrl = (url: string) => {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^(blob:|https?:\/\/|data:)/i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.replace(/^assets\/studio\//i, "").replace(/^\/+/, "");
  return `${STUDIO_MEDIA_BASE_URL}${normalizedPath}`;
};

const inferMediaType = (url: string) => {
  return /\.(mp4|mov|webm|m4v)$/i.test(url) ? "video" : "image";
};

const extractUploadedUrls = (response: any): string[] => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.data,
    payload?.urls,
    payload?.media,
    payload?.items,
    payload?.result,
    payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return item.url || item.path || item.location || item.media_url || "";
          }
          return "";
        })
        .filter(Boolean);
    }

    if (typeof candidate === "string" && candidate.trim()) {
      return [candidate];
    }
  }

  return [];
};

const mapStudioMedia = (media: any[] = []): MediaFile[] =>
  media.map((item: any, index: number) => {
    const url = normalizeMediaUrl(String(item?.url ?? item ?? ""));
    return {
      id: String(item?.id ?? item?.studio_media_id ?? index),
      url,
      type: item?.type ?? inferMediaType(url),
      status: item?.status ?? "uploaded",
      is_cover: Boolean(item?.is_cover),
      fileName: item?.fileName,
      clientId: item?.clientId,
    };
  });

export default function MediaUploadForm({ isDark = true, studioData, setStudioData }: Props) {
  const files: MediaFile[] = mapStudioMedia(studioData.media || []);

  const syncMedia = useCallback((updater: (current: MediaFile[]) => MediaFile[]) => {
    setStudioData((prev: any) => {
      const currentFiles = mapStudioMedia(prev.media || []);
      const nextFiles = updater(currentFiles);
      return {
        ...prev,
        media: nextFiles,
      };
    });
  }, [setStudioData]);

  const setPreferredAge = (v: string) => setStudioData((prev: any) => ({ ...prev, preferred_age: v }));
  const setWifiName = (v: string) => setStudioData((prev: any) => ({ ...prev, wifi_name: v }));
  const setWifiPassword = (v: string) => setStudioData((prev: any) => ({ ...prev, wifi_password: v }));

  const removeFile = useCallback((id: string) => {
    syncMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }, [syncMedia]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localItems: MediaFile[] = acceptedFiles.map((file, index) => ({
      id: `${batchId}-${index}`,
      clientId: `${batchId}-${index}`,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      status: "uploading",
      fileName: file.name,
    }));

    syncMedia((current) => [...current, ...localItems]);

    try {
      const response = await adminApi.uploadStudioMedia(acceptedFiles);
      if (response?.success === false) {
        throw new Error(response?.error || "Upload failed");
      }

      const uploadedUrls = extractUploadedUrls(response);

      if (!uploadedUrls.length) {
        throw new Error("Upload succeeded but no media URLs were returned");
      }

      syncMedia((current) =>
        current.map((item) => {
          const localIndex = localItems.findIndex((pending) => pending.id === item.id);
          if (localIndex === -1) return item;

          const nextUrl = normalizeMediaUrl(uploadedUrls[localIndex] || item.url);
          if (item.url.startsWith("blob:") && nextUrl !== item.url) {
            URL.revokeObjectURL(item.url);
          }

          return {
            ...item,
            url: nextUrl,
            status: "uploaded",
          };
        })
      );
    } catch (error) {
      console.error("Studio media upload failed:", error);
      syncMedia((current) =>
        current.map((item) =>
          localItems.some((pending) => pending.id === item.id)
            ? { ...item, status: "error" }
            : item
        )
      );
    }
  }, [syncMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"], "video/*": [".mp4", ".mov", ".webm"] },
    maxSize: 50 * 1024 * 1024,
  });

  const preferredAge = studioData.preferred_age;
  const wifiName = studioData.wifi_name;
  const wifiPassword = studioData.wifi_password;

  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFFB2]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  const hasUploading = files.some((file) => file.status === "uploading");

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      <section className={`space-y-6 p-4 lg:p-8 border rounded-xl transition-colors duration-200 ${borderColor}`}>
        <div
          {...getRootProps()}
          className={`relative w-full h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? "bg-[#E8D1AB]/5 " : "bg-transparent"}`}
        >
          <Input {...getInputProps()} />

          <div className="relative w-32 h-32 lg:h-50 lg:w-65">
            <Image
              src={"/images/misc/MediaFormAsset.png"}
              alt="Upload files media assets"
              width={260}
              height={200}
            />
          </div>

          <p className={`text-base lg:text-lg font-semibold ${isDark ? "text-[#9F9F9F]" : "text-black"}`}>
            <span className="text-[#E8D1AB]">Click to upload</span> or drag and drop
          </p>
          <p className={`text-sm lg:text-base mt-1 ${subTextColor}`}>
            JPG, JPEG, PNG and MP4 less than 50MB
          </p>
        </div>

        <div className={`p-4 border border-dashed rounded-md ${isDark ? "border-[#FFFFFF4D]" : "border-gray-300"}`}>
          <div className="flex justify-between">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative w-[96px] h-[80px] rounded-lg overflow-hidden group shrink-0"
                >
                  {file.type === "image" ? (
                    <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <PlayCircle className="text-white opacity-50" />
                    </div>
                  )}

                  {file.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                      <span className="text-[10px] text-white mb-2">Uploading</span>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8D1AB] animate-progress-loading w-1/2" />
                      </div>
                    </div>
                  )}

                  {file.status === "error" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] text-red-300 font-medium">Upload failed</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ))}
            </div>

            <div
              {...getRootProps()}
              className={`bg-[#E8D1AB] w-[96px] h-[80px] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D1AB]/80 transition-colors shrink-0 ${hasUploading ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <Plus className="text-[#E8D1AB]" size={32} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium ${textColor}`}>Who's allowed in your space?</h2>
          <p className={`text-xs lg:text-sm ${subTextColor}`}>
            Typically, only venues that serve alcohol age requirements
          </p>
        </div>

        <div className="relative">
          <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
            <span className={`text-sm font-medium ${subTextColor}`}>Preferred Age</span>
          </div>
          <Select value={preferredAge} onValueChange={(val) => setPreferredAge(val)}>
            <SelectTrigger className={`rounded-full h-14 lg:h-[82px] rounded-xl px-6 text-sm lg:text-base bg-transparent border ${borderColor} ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all }`}>
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="18">18+</SelectItem>
              <SelectItem value="21">21+</SelectItem>
              <SelectItem value="all">All Ages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      <section className="space-y-5 lg:space-y-9">
        <div>
          <h2 className={`text-lg lg:text-xl font-medium ${textColor}`}>What's your wifi name and password?</h2>
          <p className={`text-xs lg:text-sm ${subTextColor}`}>
            Make it easy for your guests to get online by sharing your wifi information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm font-medium ${subTextColor}`}>Wifi Name (optional)</span>
            </div>
            <Input
              value={wifiName}
              onChange={(e) => setWifiName(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>

          <div className="relative">
            <div className={`absolute -top-3 left-4 z-10 px-2 ${labelBg}`}>
              <span className={`text-sm font-medium ${subTextColor}`}>Password</span>
            </div>
            <Input
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className={`w-full h-14 lg:h-[82px] bg-transparent border ${borderColor} rounded-xl px-6 text-sm lg:text-base ${textColor} focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
            />
          </div>
        </div>
      </section>

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}
