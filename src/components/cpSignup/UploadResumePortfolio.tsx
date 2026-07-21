'use client';

import React, { useState, ChangeEvent } from "react";
import { Upload, Eye, Trash2, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { compressImage, compressPDF } from "@/lib/utils";
import { toast } from "sonner";

// Constants for limits
const RESUME_MAX_MB = 10;
const PORTFOLIO_MAX_MB = 5;

const UploadResumePortfolio = ({
  resume,
  setResume,
  portfolio,
  setPortfolio,
  bgColour = "bg-[#101010]",
  buttonBgColour = "bg-white/5 hover:bg-white/10",
  onResumeUpload,
  onPortfolioUpload,
  onDeleteResume,
  onDeletePortfolio,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>, type: "resume" | "portfolio") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 1. Specific Size Validation
    const limitMB = type === "resume" ? RESUME_MAX_MB : PORTFOLIO_MAX_MB;
    const limitBytes = limitMB * 1024 * 1024;

    const oversizedFiles = files.filter(file => file.size > limitBytes);
    
    if (oversizedFiles.length > 0) {
      toast.error(
        type === "resume" 
          ? `Resume too large. Maximum size is ${RESUME_MAX_MB}MB.` 
          : `One or more portfolio files exceed the ${PORTFOLIO_MAX_MB}MB limit.`
      );
      e.target.value = "";
      return;
    }

    try {
      setIsProcessing(true);
      
      const uploadPromises = files.map(async (file) => {
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

      const processedFiles = await Promise.all(uploadPromises);

      if (type === "resume") {
        if (onResumeUpload) {
          const uploadedResume = await onResumeUpload(processedFiles[0], files[0]);
          setResume(uploadedResume || processedFiles[0]);
        } else {
          setResume(processedFiles[0]);
        }
        toast.success("Resume uploaded successfully");
      } else {
        if (onPortfolioUpload) {
          const uploadedPortfolio = await onPortfolioUpload(processedFiles, files);
          if (Array.isArray(uploadedPortfolio) && uploadedPortfolio.length > 0) {
            setPortfolio((prev) => [...(prev || []), ...uploadedPortfolio]);
          } else {
            setPortfolio((prev) => [...(prev || []), ...processedFiles]);
          }
        } else {
          setPortfolio((prev) => [...(prev || []), ...processedFiles]);
        }
        toast.success(`${processedFiles.length} portfolio file(s) added`);
      }

    } catch (error) {
      toast.error("An error occurred during upload.");
      console.error(error);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const removePortfolioItem = (id: string) => {
    setPortfolio((prev) => {
      const itemToRemove = prev.find(p => p.id === id);
      if (itemToRemove?.url) URL.revokeObjectURL(itemToRemove.url);
      return prev.filter((p) => p.id !== id);
    });
    toast.info("Portfolio item removed");
  };

  const openFileInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  const fileRowClasses = "flex justify-between items-center p-4 border border-white/10 rounded-xl bg-white/5 transition-all hover:border-white/30 mb-2 animate-in fade-in slide-in-from-bottom-1";
  const labelClasses = "text-sm font-semibold text-white mb-1";

  return (
    <div className={`w-full border border-white/30 rounded-[12px] p-6 ${bgColour}`}>
      <h2 className="text-base font-semibold text-white mb-6">Upload Documents</h2>

      <div className="space-y-8">
        {/* RESUME SECTION */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className={labelClasses}>Resume / CV (Optional)</p>
            <span className="text-[10px] text-white/40 mb-1">Max {RESUME_MAX_MB}MB</span>
          </div>
          {!resume ? (
            <label className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-8 cursor-pointer ${buttonBgColour} transition group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isProcessing ? <Loader2 className="animate-spin text-[#E8D1AB]" size={18} /> : <Upload size={18} className="text-[#E8D1AB]" />}
              <span className="text-white/80 text-sm group-hover:text-white">
                {isProcessing ? "Processing..." : "Upload Resume"}
              </span>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                className="hidden" 
                disabled={isProcessing}
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
                <button type="button" onClick={() => openFileInNewTab(resume.url)} className="p-2 hover:bg-white/10 rounded-lg text-white/60"><Eye size={18} /></button>
                <button type="button" onClick={async () => {
                  try {
                    await onDeleteResume?.(resume);
                    setResume(null);
                    toast.info("Resume removed");
                  } catch (error) {
                    console.error("Failed to delete resume:", error);
                    toast.error("Failed to remove resume.");
                  }
                }} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          )}
        </div>

        {/* PORTFOLIO SECTION */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className={labelClasses}>Portfolio / Case Studies (Multiple)</p>
            <span className="text-[10px] text-white/40 mb-1">Max {PORTFOLIO_MAX_MB}MB per file</span>
          </div>
          
          <div className="space-y-2 mb-4">
            {portfolio?.map((item) => (
              <div key={item.id} className={fileRowClasses}>
                <div className="flex items-center gap-3 w-2/3">
                  <LinkIcon size={18} className="text-[#E8D1AB]" />
                  <div className="flex flex-col truncate">
                    <span className="font-medium text-white text-sm truncate">{item.name}</span>
                    <span className="text-white/40 text-xs">{item.size}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openFileInNewTab(item.url)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"><Eye size={18} /></button>
                  <button type="button" onClick={async () => {
                    try {
                      await onDeletePortfolio?.(item);
                      removePortfolioItem(item.id);
                    } catch (error) {
                      console.error("Failed to delete portfolio file:", error);
                      toast.error("Failed to remove portfolio file.");
                    }
                  }} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          <label className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-6 cursor-pointer ${buttonBgColour} transition group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
             {isProcessing ? <Loader2 className="animate-spin text-[#E8D1AB]" size={18} /> : <Plus size={18} className="text-[#E8D1AB]" />}
            <span className="text-white/80 text-sm group-hover:text-white">
               {isProcessing ? "Processing..." : portfolio?.length > 0 ? "Add another portfolio file" : "Upload portfolio"}
            </span>
            <input 
              type="file" 
              multiple 
              accept=".pdf,image/*" 
              className="hidden" 
              disabled={isProcessing}
              onChange={(e) => handleUpload(e, "portfolio")} 
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default UploadResumePortfolio;