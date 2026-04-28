"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { File as FileIcon, Trash2, UploadCloud, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      {/* 
          1. Added max-h-[95vh] to keep it within screen
          2. Added flex flex-col to allow inner scrolling
      */}
      <div className="relative flex max-h-[95vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
        
        {/* Header - Fixed at top */}
        <div className="flex shrink-0 items-start justify-between border-b border-white/10 px-5 py-5 lg:px-6">
          <h2 className="text-[28px] font-semibold leading-none text-white">
            Add &amp; Edit Dispute
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close dispute modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Scrollable area */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="space-y-5 px-5 py-6 lg:px-6">
            
            {/* Shoot ID - Keep as Dropdown */}
            <fieldset className="rounded-2xl border border-white/15 px-4 pb-4 pt-2">
              <legend className="px-2 text-sm text-white/65">Shoot ID*</legend>
              <Select
                value={formValues.shootId}
                onValueChange={(value) =>
                  setFormValues((prev) => ({ ...prev, shootId: value }))
                }
              >
                <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-1 text-base text-white shadow-none focus:ring-0">
                  <SelectValue placeholder="Select shoot" />
                </SelectTrigger>
                <SelectContent className="z-[120] border-[#333333] bg-[#111111] text-white">
                  {shootOptions.map((id) => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>

            {/* Subject */}
            <fieldset className="rounded-2xl border border-white/15 px-4 pb-4 pt-2">
              <legend className="px-2 text-sm text-white/65">Subject*</legend>
              <input
                value={formValues.subject}
                onChange={(e) => setFormValues((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter dispute subject"
                className="w-full border-0 bg-transparent px-0 py-1 text-base text-white outline-none placeholder:text-white/25"
                required
              />
            </fieldset>

            {/* Reason - Changed from Dropdown to Input */}
            <fieldset className="rounded-2xl border border-white/15 px-4 pb-4 pt-2">
              <legend className="px-2 text-sm text-white/65">Reason*</legend>
              <input
                value={formValues.reason}
                onChange={(e) => setFormValues((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for dispute"
                className="w-full border-0 bg-transparent px-0 py-1 text-base text-white outline-none placeholder:text-white/25"
                required
              />
            </fieldset>

            {/* Description */}
            <fieldset className="rounded-2xl border border-white/15 px-4 pb-4 pt-2">
              <legend className="px-2 text-sm text-white/65">Description</legend>
              <textarea
                value={formValues.description}
                onChange={(e) => setFormValues((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details about the dispute"
                className="min-h-[100px] w-full resize-none border-0 bg-transparent px-0 py-1 text-base text-white outline-none placeholder:text-white/25"
                rows={4}
              />
            </fieldset>

            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-medium text-white/80">Attach File</p>
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
                className={`group relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed px-6 text-center transition-all duration-200 ${
                  isDragging
                    ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
                    : "border-white/10 bg-[#202020] hover:border-white/20"
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
                <p className="text-sm text-white/75">
                  Drag & Drop Or <span className="font-medium text-[#E8D1AB] underline">Upload</span>
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.previewUrl ? (
                          <Image src={item.previewUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5">
                            <FileIcon size={18} className="text-[#E8D1AB]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                          <p className="text-xs text-white/45">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSelectedFile(item.id)} className="text-white/50 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pb-2 pt-2">
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#E5D5B8] px-8 text-sm font-semibold text-black transition-colors hover:bg-[#d9c59d]"
              >
                Save &amp; Update
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
