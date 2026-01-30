'use client';

import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Upload, LinkIcon, Loader2, FileWarning } from "lucide-react";
import { compressImage, compressPDF } from "@/lib/utils";
import { toast } from "sonner"; // 1. Import toast

const MAX_CERTS = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AddCertification = ({ value = [], onChange, bg = "bg-card" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    // 2. Size Validation with Toast
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      toast.error(`File is too large. Only max ${MAX_FILE_SIZE_MB}MB allowed.`);
      return;
    }

    // 3. Count Validation with Toast
    if (value.length >= MAX_CERTS) {
      toast.error(`Maximum of ${MAX_CERTS} certifications reached.`);
      return;
    }

    let filesToProcess = files;
    const totalAfterUpload = value.length + files.length;
    
    if (totalAfterUpload > MAX_CERTS) {
      const allowedCount = MAX_CERTS - value.length;
      toast.warning(`Only adding the first ${allowedCount} files (Max ${MAX_CERTS}).`);
      filesToProcess = files.slice(0, allowedCount);
    }

    try {
      setIsProcessing(true);

      const uploadPromises = filesToProcess.map(async (file) => {
        let processedFile = file;
        try {
          if (file.type.startsWith('image/')) {
            processedFile = await compressImage(file);
          } else if (file.type === 'application/pdf') {
            processedFile = await compressPDF(file);
          }
        } catch (error) {
          console.error(`Compression failed for ${file.name}:`, error);
        }

        return {
          id: crypto.randomUUID(),
          name: processedFile.name,
          size: (processedFile.size / 1024 / 1024).toFixed(1) + " MB",
          file: processedFile,
          url: URL.createObjectURL(processedFile),
        };
      });

      const newCerts = await Promise.all(uploadPromises);
      onChange([...value, ...newCerts]);
      toast.success(`${newCerts.length} file(s) uploaded successfully!`);

    } catch (error) {
      toast.error("Upload process failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeCert = (id: string) => {
    const updated = value.filter((c) => c.id !== id);
    onChange(updated);
    toast.info("Certification removed");
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
          <p className="text-xs sm:text-sm text-white/50">
            Max {MAX_CERTS} files • Max {MAX_FILE_SIZE_MB}MB each
          </p>
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
              multiple
              accept="image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={isProcessing}
            />
          </label>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Updated Placeholder message */}
        {value.length === 0 && !isProcessing && (
           <div className="border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center bg-white/[0.02]">
              <div className="p-3 rounded-full bg-white/5">
                <FileWarning size={20} className="text-white/30" />
              </div>
              <div className="space-y-1">
                <p className="text-white/60 font-medium">No certifications yet</p>
                <p className="text-white/40 text-xs">Upload images or PDFs (Max 5MB each)</p>
              </div>
           </div>
        )}
        
        {value.map((cert) => (
          <div
            key={cert.id}
            className="border border-white/10 bg-white/5 rounded-xl p-3 sm:p-4 flex justify-between items-center text-sm gap-3 animate-in fade-in slide-in-from-bottom-2"
          >
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