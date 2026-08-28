"use client";

import React, { useState } from "react";
import { ArrowLeft, Trash2, Link as LinkIcon } from "lucide-react";

export interface ShootDetailsData {
  notes: string;
  links: string[];
}

interface ShootDetailsStepProps {
  onContinue: (data: ShootDetailsData) => void;
  onBack?: () => void;
  initialNotes?: string;
  initialLinks?: string[];
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export const ShootDetails: React.FC<ShootDetailsStepProps> = ({
  onContinue,
  onBack,
  initialNotes = "",
  initialLinks = [],
  title = " Tell us a little about your shoot.",
  subtitle = "Share anything about your shoot, vibe, or ideas. We'll take it from there.",
  stepNumber = "04",
  completionPercentage = 50,
}) => {
  const [notes, setNotes] = useState<string>(initialNotes);
  const [links, setLinks] = useState<string[]>(initialLinks);
  const [currentLinkInput, setCurrentLinkInput] = useState<string>("");

  const handleAddLink = () => {
    if (!currentLinkInput.trim()) return;

    let formattedLink = currentLinkInput.trim();
    if (
      !formattedLink.startsWith("http://") &&
      !formattedLink.startsWith("https://")
    ) {
      formattedLink = `https://${formattedLink}`;
    }

    setLinks((prev) => [...prev, formattedLink]);
    setCurrentLinkInput("");
  };

  const handleRemoveLink = (indexToRemove: number) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Navigation */}
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
             className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div className="h-full w-1/2 bg-[#E8D1AB] transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* Header */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Main Textarea Input */}
      <div className="mb-6">
        <div className="relative border border-white/20 rounded-lg lg:rounded-2xl px-5 py-4 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) focus-within:border-white/30 transition-all">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Give us the quick version"
            className="w-full bg-transparent text-sm lg:text-base text-white/90 placeholder:text-white/30 focus:outline-none resize-none pt-1 lg:h-70"
          />
        </div>
      </div>

      {/* Supporting Links Input Section */}
      <div className="mb-5 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex flex-col gap-4 w-full">
            <label
              htmlFor="referenceLinks-input"
              className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10"
            >
              Supporting Links
            </label>
            <input
              type="text"
              value={currentLinkInput}
              onChange={(e) => setCurrentLinkInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Got some inspiration? Drop in a link."
              className="w-full rounded-xl border border-white/30 px-4 py-4 text-white placeholder:text-white/20 outline-none focus:border-white/60 transition-all bg-[#101010] text-sm lg:text-base lg:h-18"
            />
          </div>

          <button
            type="button"
            onClick={handleAddLink}
            className="w-fit px-8 py-2 lg:py-4 rounded-lg lg:rounded-2xl bg-white text-[#101010] font-medium text-base md:text-[26px] hover:bg-white/90 lg:w-[174px] transition-all cursor-pointer flex-shrink-0"
          >
            Add
          </button>
        </div>

        {/* Added Links List */}
        {links.length > 0 && (
          <div className="mt-2 lg:mt-4 space-y-2">
            {links.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-white/10 text-xs md:text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <LinkIcon className="w-4 h-4 text-[#E8D1AB] flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-[#E8D1AB] transition-colors truncate"
                  >
                    {link}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-white/40 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => onContinue({ notes, links })}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ShootDetails;