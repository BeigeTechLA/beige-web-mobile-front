'use client';

import React, { useState, ChangeEvent } from "react";
import { Upload, Eye, Trash2, Link as LinkIcon, Plus } from "lucide-react";
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      
      const newFiles = await Promise.all(Array.from(files).map(async (file) => {
        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        } else if (file.type === 'application/pdf') {
          processedFile = await compressPDF(file);
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: processedFile.name,
          size: (processedFile.size / 1024 / 1024).toFixed(1) + " MB",
          file: processedFile,
          url: URL.createObjectURL(processedFile),
        };
      }));

      if (type === "resume") {
        setResume(newFiles[0]); // Resume stays single
      } else {
        setPortfolio((prev) => [...(prev || []), ...newFiles]); // Portfolio becomes multiple
      }

    } catch (error) {
      console.error("Upload process error:", error);
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
  };

  const openFileInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  const fileRowClasses = "flex justify-between items-center p-4 border border-white/10 rounded-xl bg-white/5 transition-all hover:border-white/30 mb-2";
  const labelClasses = "text-sm font-semibold text-white mb-1";

  return (
    <div className={`w-full border border-white/30 rounded-[12px] p-6 ${bgColour}`}>
      <h2 className="text-base font-semibold text-white mb-6">Upload Documents</h2>

      <div className="space-y-8">
        {/* RESUME SECTION (Single) */}
        <div>
          <p className={labelClasses}>Resume / CV (Optional)</p>
          {!resume ? (
            <label className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-8 cursor-pointer ${buttonBgColour} transition group`}>
              <Upload size={18} className="text-[#E8D1AB]" />
              <span className="text-white/80 text-sm group-hover:text-white">Upload Resume</span>
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleUpload(e, "resume")} />
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
                <button type="button" onClick={() => setResume(null)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          )}
        </div>

        {/* PORTFOLIO SECTION (Multiple) */}
        <div>
          <p className={labelClasses}>Portfolio / Case Studies (Multiple)</p>
          
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
                  <button type="button" onClick={() => removePortfolioItem(item.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          <label className={`flex items-center justify-center gap-3 border border-dashed border-white/20 rounded-xl p-6 cursor-pointer ${buttonBgColour} transition group`}>
            <Plus size={18} className="text-[#E8D1AB]" />
            <span className="text-white/80 text-sm group-hover:text-white">Add {portfolio?.length > 0 ? "another" : "portfolio"} file</span>
            <input 
              type="file" 
              multiple 
              accept=".pdf,image/*" 
              className="hidden" 
              onChange={(e) => handleUpload(e, "portfolio")} 
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default UploadResumePortfolio;