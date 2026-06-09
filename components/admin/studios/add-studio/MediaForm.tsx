"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Plus, Image as ImageIcon, PlayCircle, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  isDark?: boolean;
}

interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  status: "uploaded" | "uploading";
}

export default function MediaUploadForm({ isDark = true }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([
    { id: "1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c", type: "image", status: "uploaded" },
    { id: "2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2", type: "image", status: "uploaded" },
    { id: "3", url: "https://images.unsplash.com/photo-1556761175-b413da4baf72", type: "image", status: "uploaded" },
  ]);

  const [preferredAge, setPreferredAge] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? ("video" as const) : ("image" as const),
      status: "uploading" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((f) => {
      setTimeout(() => {
        setFiles((current) =>
          current.map((item) => (item.id === f.id ? { ...item, status: "uploaded" } : item))
        );
      }, 2000);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"], "video/*": [".mp4"] },
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Theme Styles
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-[#FFFFFFB2]" : "text-[#71717B]";
  const labelBg = isDark ? "bg-[#101010]" : "bg-white";
  const borderColor = isDark ? "border-[#FFFFFF80]" : "border-[#D7D7D7]";

  return (
    <div className="space-y-5 lg:space-y-9 transition-colors duration-200">
      <section className={`space-y-6 p-4 lg:p-8 border rounded-xl transition-colors duration-200 ${borderColor}`}>
        {/* 1. Main Dropzone Area */}
        <div
          {...getRootProps()}
          className={`relative w-full h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? "bg-[#E8D1AB]/5 " : "bg-transparent"}`}
        >
          <Input {...getInputProps()} />

          {/* Animated Icon Stack */}
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

        {/* 2. Preview Scroll Section */}
        <div className={`p-4 border border-dashed rounded-md ${isDark ? "border-[#FFFFFF4D]" : "border-gray-300"}`}>
          <div className="flex justify-between ">
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

                  {/* Uploading Overlay */}
                  {file.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                      <span className="text-[10px] text-white mb-2">Uploading</span>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8D1AB] animate-progress-loading w-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
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


            {/* 3. Add Button */}
            <div
              {...getRootProps()}
              className={` bg-[#E8D1AB] w-[96px] h-[80px] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D1AB]/80 transition-colors shrink-0`}
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <Plus className="text-[#E8D1AB]" size={32} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />

      {/* 2. Who's allowed in your space? */}
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

      {/* 3. Wifi Name and Password Section */}
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