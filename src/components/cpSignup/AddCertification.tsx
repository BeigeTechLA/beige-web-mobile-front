'use client';

import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Upload, LinkIcon, Loader2 } from "lucide-react";
import { compressImage, compressPDF } from "@/lib/utils";

const MAX_CERTS = 10;

const AddCertification = ({ value = [], onChange, bg = "bg-card" }) => {
  const inputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (value.length >= MAX_CERTS) {
      alert(`You can upload maximum ${MAX_CERTS} certifications.`);
      return;
    }

    try {
      setIsProcessing(true);
      let processedFile = file;

      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      } else if (file.type === 'application/pdf') {
        processedFile = await compressPDF(file);
      }

      const newCert = {
        id: crypto.randomUUID(),
        name: processedFile.name,
        size: (processedFile.size / 1024 / 1024).toFixed(1) + " MB",
        file: processedFile,
        url: URL.createObjectURL(processedFile),
      };

      onChange([...value, newCert]);
    } catch (error) {
      console.error("Compression failed:", error);
      const fallbackCert = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(1) + " MB",
        file: file,
        url: URL.createObjectURL(file),
      };
      onChange([...value, fallbackCert]);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeCert = (id: string) => {
    const updated = value.filter((c) => c.id !== id);
    onChange(updated);
  };

  const viewCertificate = (cert: any) => {
    if (!cert?.file) return;
    const url = URL.createObjectURL(cert.file);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className={`w-full border border-white/30 rounded-xl p-4 sm:p-5 ${bg}`}>
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">Certifications</h2>
          <p className="text-xs sm:text-sm text-white/50">Max {MAX_CERTS} files</p>
        </div>

        <Button
          asChild
          className="bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] shrink-0"
          disabled={isProcessing || value.length >= MAX_CERTS}
        >
          <label className={`${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'} flex items-center gap-2`}>
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            <span className="text-sm">{isProcessing ? "Processing..." : "Upload"}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={isProcessing}
            />
          </label>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {value.map((cert) => (
          <div
            key={cert.id}
            className="border border-white/10 bg-white/5 rounded-xl p-3 sm:p-4 flex justify-between items-center text-sm gap-3"
          >
            {/* Left side: Icon and Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <LinkIcon size={18} className="text-[#E8D1AB]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-white truncate block">
                  {cert.name}
                </span>
                <span className="text-white/40 text-[10px] sm:text-xs">{cert.size}</span>
              </div>
            </div>

            {/* Right side: Buttons */}
            <div className="flex gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => viewCertificate(cert)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                <Eye size={18} />
              </button>

              <button
                type="button"
                onClick={() => removeCert(cert.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddCertification;