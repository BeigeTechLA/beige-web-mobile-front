'use client';

import React, { useState, ChangeEvent } from "react";
import { Upload, Eye, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, compressPDF } from "@/lib/utils";

const UploadResumePortfolio = ({
  resume,
  setResume,
  portfolio,
  setPortfolio,
  bgColour = "bg-[#101010]",
  buttonBgColour = "bg-white/5 hover:bg-white/10",
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>, type: "resume" | "portfolio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      let processedFile = file;

      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      } else if (file.type === 'application/pdf') {
        processedFile = await compressPDF(file);
      }

      const fileData = {
        name: processedFile.name,
        size: (processedFile.size / 1024 / 1024).toFixed(1) + " MB",
        file: processedFile,
        url: URL.createObjectURL(processedFile),
      };

      if (type === "resume") setResume(fileData);
      if (type === "portfolio") setPortfolio(fileData);

    } catch (error) {
      console.error("Upload process error:", error);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const openFileInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  // Shared styles for the file row to match AddCertification
  const fileRowClasses = "flex justify-between items-center p-4 border border-white/10 rounded-xl bg-white/5 transition-all hover:border-white/30";
  const labelClasses = "text-sm font-semibold text-white mb-1";
  const subtextClasses = "text-xs text-white/50 mb-4";

  return (
    <div className={`w-full border border-white/30 rounded-[12px] p-6 ${bgColour}`}>
      <h2 className="text-base font-semibold text-white mb-6">Upload Documents</h2>

      <div className="space-y-6">
        {/* RESUME SECTION */}
        <div>
          <p className={labelClasses}>Resume / CV</p>
          {!resume ? (
            <label
              className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-8 ${isProcessing ? "opacity-50 cursor-not-allowed" : `cursor-pointer ${buttonBgColour}`
                } transition group`}
            >
              <Upload size={18} className="text-[#E8D1AB]" />
              <span className="text-white/80 text-sm group-hover:text-white">Upload Resume</span>
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(e) => handleUpload(e, "resume")}
              />
            </label>
          ) : (
            <div className={fileRowClasses}>
              <div className="flex items-center gap-3 w-2/3">
                <LinkIcon size={18} className="text-[#E8D1AB]" />
                <div className="flex flex-col truncate">
                  <span className="font-medium text-white text-sm truncate">{resume.name}</span>
                  <span className="text-white/40 text-xs">{resume.size}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                  onClick={() => openFileInNewTab(resume.url)}
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                  onClick={() => {
                    if (resume?.url) URL.revokeObjectURL(resume.url);
                    setResume(null);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PORTFOLIO SECTION */}
        <div>
          <p className={labelClasses}>Portfolio</p>
          {!portfolio ? (
            <label
              className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-8 cursor-pointer ${buttonBgColour} transition group`}
            >
              <Upload size={18} className="text-[#E8D1AB]" />
              <span className="text-white/80 text-sm group-hover:text-white">Upload Portfolio</span>
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,application/pdf"
                onChange={(e) => handleUpload(e, "portfolio")}
              />
            </label>
          ) : (
            <div className={fileRowClasses}>
              <div className="flex items-center gap-3 w-2/3">
                <LinkIcon size={18} className="text-[#E8D1AB]" />
                <div className="flex flex-col truncate">
                  <span className="font-medium text-white text-sm truncate">{portfolio.name}</span>
                  <span className="text-white/40 text-xs">{portfolio.size}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                  onClick={() => openFileInNewTab(portfolio.url)}
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                  onClick={() => {
                    if (portfolio?.url) URL.revokeObjectURL(portfolio.url);
                    setPortfolio(null);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResumePortfolio;