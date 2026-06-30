"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { File as FileIcon, Trash2, UploadCloud, X } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DisputeFormValues = {
  shootId: string;
  subject: string;
  reason: string;
  description: string;
};

interface AddEditDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shootOptions: string[];
}

interface SelectedFileItem {
  id: string;
  file: File;
  signature: string;
  previewUrl?: string;
}

const DEFAULT_FORM_VALUES: DisputeFormValues = {
  shootId: "",
  subject: "",
  reason: "",
  description: "",
};

export default function AddEditDisputeModal({
  isOpen,
  onClose,
  shootOptions,
}: AddEditDisputeModalProps) {
  const { isDark } = useResolvedTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [formValues, setFormValues] = useState<DisputeFormValues>(DEFAULT_FORM_VALUES);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);

  const isImageFile = (file: File) =>
    file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file.name);

  const createPreviewUrl = (file: File) => {
    if (!isImageFile(file)) return undefined;
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  };

  const revokePreviewUrl = (url?: string) => {
    if (!url || !previewUrlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormValues(DEFAULT_FORM_VALUES);
      setSelectedFiles((prev) => {
        prev.forEach((item) => revokePreviewUrl(item.previewUrl));
        return [];
      });
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const selectedFileCountLabel = useMemo(() => {
    if (!selectedFiles.length) return null;
    return `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} attached`;
  }, [selectedFiles]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const now = Date.now();
    const incomingFiles = Array.from(files).filter((file) => file.size > 0);

    setSelectedFiles((prev) => {
      const existingSignatures = new Set(prev.map((item) => item.signature));
      const dedupedFiles = incomingFiles
        .map((file, index) => {
          const signature = `${file.name}-${file.size}-${file.lastModified}`;
          return {
            id: `${signature}-${now}-${index}`,
            file,
            signature,
            previewUrl: createPreviewUrl(file),
          };
        })
        .filter((item) => {
          if (existingSignatures.has(item.signature)) {
            revokePreviewUrl(item.previewUrl);
            return false;
          }
          return true;
        });
      return [...prev, ...dedupedFiles];
    });
  };

  const handleDropZoneDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragging(true);
    } else if (event.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const removeSelectedFile = (id: string) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((item) => item.id === id);
      revokePreviewUrl(fileToRemove?.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101010CC] backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className={`relative flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-lg lg:rounded-2xl border ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]" : "border-[#D7D7D7] bg-white text-black shadow-2xl"}`}
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 lg:p-9 shrink-0">
          <h2 className="text-xl lg:text-3xl font-bold leading-none">
            Add &amp; Edit Dispute
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-3 lg:p-4 rounded-full transition-colors border ${isDark ? "bg-[#2B2626] text-white hover:text-white/90 border-[#2B2626]" : "bg-[#F0F0F0] text-black hover:text-black/90 border-[#F0F0F0]"}`}
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t shrink-0 ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        {/* Form Wrap Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content Body Area */}
          <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-5 p-4 lg:p-8">
            {/* Shoot ID - Keep as Dropdown */}
            <fieldset className={`rounded-xl border px-4 pb-4 pt-2 ${isDark ? "border-white/15" : "border-black/15"}`}>
              <legend className={`px-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>Shoot ID*</legend>
              <Select
                value={formValues.shootId}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, shootId: value }))
                }
              >
                <SelectTrigger className={`h-auto border-0 bg-transparent px-0 py-1 text-base shadow-none focus:ring-0 ${isDark ? "text-white" : "text-black"}`}>
                  <SelectValue placeholder="Select shoot" />
                </SelectTrigger>
                <SelectContent className={`z-[120] ${isDark ? "border-[#333333] bg-[#111111] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
                  {shootOptions.map((id) => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>

            {/* Subject */}
            <fieldset className={`rounded-xl border px-4 pb-4 pt-2 ${isDark ? "border-white/15" : "border-black/15"}`}>
              <legend className={`px-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>Subject*</legend>
              <input
                value={formValues.subject}
                onChange={(e) => setFormValues((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter dispute subject"
                className={`w-full border-0 bg-transparent px-0 py-1 text-base outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"}`}
                required
              />
            </fieldset>

            {/* Reason - Changed from Dropdown to Input */}
            <fieldset className={`rounded-xl border px-4 pb-4 pt-2 ${isDark ? "border-white/15" : "border-black/15"}`}>
              <legend className={`px-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>Reason*</legend>
              <input
                value={formValues.reason}
                onChange={(e) => setFormValues((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for dispute"
                className={`w-full border-0 bg-transparent px-0 py-1 text-base outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"}`}
                required
              />
            </fieldset>

            {/* Description */}
            <fieldset className={`rounded-xl border px-4 pb-4 pt-2 ${isDark ? "border-white/15" : "border-black/15"}`}>
              <legend className={`px-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>Description</legend>
              <textarea
                value={formValues.description}
                onChange={(e) => setFormValues((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details about the dispute"
                className={`min-h-[100px] w-full resize-none border-0 bg-transparent px-0 py-1 text-base outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"}`}
                rows={4}
              />
            </fieldset>

            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-lg font-medium ${isDark ? "text-white/80" : "text-black/80"}`}>Attach File</p>
                {selectedFileCountLabel && (
                  <p className="text-sm text-[#E8D1AB]">{selectedFileCountLabel}</p>
                )}
              </div>

              <div
                onDragEnter={handleDropZoneDrag}
                onDragOver={handleDropZoneDrag}
                onDragLeave={handleDropZoneDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed px-6 text-center transition-all duration-200 ${isDragging
                  ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
                  : isDark ? "border-white/10 bg-[#202020] hover:border-white/20" : "border-black/10 bg-[#F9F9F9] hover:border-black/20"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <UploadCloud className="mb-2 text-[#E8D1AB]" size={28} />
                <p className={`text-sm ${isDark ? "text-white/75" : "text-black/75"}`}>
                  Drag & Drop Or <span className="font-medium text-[#E8D1AB] underline">Upload</span>
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        {item.previewUrl ? (
                          <Image src={item.previewUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            <FileIcon size={18} className="text-[#E8D1AB]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{item.file.name}</p>
                          <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSelectedFile(item.id)} className={`hover:text-red-400 ${isDark ? "text-white/50" : "text-black/50"}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer Action Block */}
          <div className={`p-4 lg:px-8 lg:py-6 shrink-0`}>
            <button
              type="submit"
              className="w-full lg:w-fit inline-flex h-14 lg:h-12 items-center justify-center rounded-lg lg:rounded-xl bg-[#E5D5B8] px-8 text-sm font-semibold text-black transition-colors hover:bg-[#d9c59d]"
            >
              Save &amp; Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}