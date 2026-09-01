"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, ChevronUp, ChevronDown, Info, Sparkles, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingDataV4 } from "./types";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const V4Step2Edits: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const [editsNeeded, setEditsNeeded] = useState<boolean>(data.editsNeeded ?? true);
  const [isPhotoEditsOpen, setIsPhotoEditsOpen] = useState(true);

  // Base free included photos (e.g. 100 or 150 based on shoot)
  const baseFreePhotos = 100;
  const photoSetSize = 25;

  // Calculate existing photo set count from data
  const initialSetCount = data.photoEditTypes?.filter((k) => k === "edited_photos").length || 1;
  const [setCount, setSetCount] = useState(Math.max(1, initialSetCount));

  const totalPhotos = baseFreePhotos + (setCount * photoSetSize) + 125; // Matching the sample 250 photos in design

  const handleToggleEdits = (needed: boolean) => {
    setEditsNeeded(needed);
    updateData({ editsNeeded: needed });
  };

  const handleIncrement = () => {
    const next = setCount + 1;
    setSetCount(next);
    updateData({
      photoEditTypes: Array.from({ length: next }, () => "edited_photos"),
    });
  };

  const handleDecrement = () => {
    if (setCount <= 0) return;
    const next = setCount - 1;
    setSetCount(next);
    updateData({
      photoEditTypes: Array.from({ length: next }, () => "edited_photos"),
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-5xl mx-auto px-4">
      {/* Top Bar: Back Button, Step Indicator & Progress */}
      <div className="w-full flex flex-col space-y-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A0A0A0] uppercase">
            STEP 02
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[60%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-2 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
          Need edits for your occasion?
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          Add professional editing to turn your raw footage into polished, share-ready content.
        </p>
      </div>

      {/* Yes / No Selector Cards */}
      <div className="w-full grid grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div
          onClick={() => handleToggleEdits(true)}
          style={{
            background: editsNeeded
              ? "#E5D5B8"
              : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
            backdropFilter: "blur(20px)",
          }}
          className={`cursor-pointer rounded-2xl p-5 sm:p-6 flex items-center justify-between transition-all duration-200 border ${editsNeeded
              ? "border-[#E5D5B8] text-[#121212] shadow-md"
              : "border-white/10 text-white hover:border-white/20"
            }`}
        >
          <span className="font-semibold text-base sm:text-lg">Yes</span>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${editsNeeded ? "bg-black" : "border border-white/30"
              }`}
          >
            {editsNeeded && <div className="w-2.5 h-2.5 rounded-full bg-[#E5D5B8]" />}
          </div>
        </div>

        <div
          onClick={() => handleToggleEdits(false)}
          style={{
            background: !editsNeeded
              ? "#E5D5B8"
              : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
            backdropFilter: "blur(20px)",
          }}
          className={`cursor-pointer rounded-2xl p-5 sm:p-6 flex items-center justify-between transition-all duration-200 border ${!editsNeeded
              ? "border-[#E5D5B8] text-[#121212] shadow-md"
              : "border-white/10 text-white hover:border-white/20"
            }`}
        >
          <span className="font-semibold text-base sm:text-lg">No</span>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${!editsNeeded ? "bg-black" : "border border-white/30"
              }`}
          >
            {!editsNeeded && <div className="w-2.5 h-2.5 rounded-full bg-[#E5D5B8]" />}
          </div>
        </div>
      </div>

      {/* If Edits Needed is True */}
      {editsNeeded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-6 mb-10"
        >
          {/* Editing Includes Info Box */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/90 text-sm sm:text-base font-medium">
              <Info className="w-4 h-4 text-white/70" />
              <span>Editing includes</span>
            </div>
            <div className="flex items-start gap-2 text-xs sm:text-sm text-white/60 pl-6">
              <Check className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
              <span>
                Professional color grading, sound mixing, and basic revisions for a polished final result.
              </span>
            </div>
          </div>

          {/* Photo Edits Accordion Card */}
          <div
            style={{
              background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
              backdropFilter: "blur(20px)",
            }}
            className="w-full border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Accordion Header */}
            <div
              onClick={() => setIsPhotoEditsOpen(!isPhotoEditsOpen)}
              className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/5"
            >
              <span className="text-lg sm:text-xl font-serif text-[#E5D5B8] font-medium">
                Photo Edits
              </span>
              <button type="button" className="text-white/60 hover:text-white">
                {isPhotoEditsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Accordion Body */}
            {isPhotoEditsOpen && (
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-white">
                      Edited Photos
                    </h4>
                    <p className="text-xs sm:text-sm text-[#888888]">
                      +{photoSetSize} Photos Per Set
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#E5D5B8] rounded-full px-3 py-1.5 shadow-md self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={setCount <= 0}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-black hover:bg-black/10 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center font-bold text-black text-sm sm:text-base">
                      {String(setCount).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-black hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                    <span>🎁 Includes 100 free photo edits</span>
                    <span className="mx-2 text-black/30">|</span>
                    <span className="text-black/70">4 Hour Duration</span>
                  </div>

                  <div className="bg-[#242424] text-white/80 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-lg">
                    + {setCount * photoSetSize} Added Extra
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Receive Summary Highlight Pill */}
          <div className="w-fit bg-[#E5D5B8] text-black px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#E5D5B8]" />
            </div>
            <span className="font-semibold text-sm sm:text-base">
              You&apos;ll Receive {totalPhotos} Photos
            </span>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Buttons */}
      <div className="w-full flex justify-between items-center pt-8 border-t border-white/10 mt-6">
        <button
          onClick={onBack}
          className="py-3.5 px-8 rounded-xl bg-transparent hover:bg-white/5 border border-white/20 text-white/90 hover:text-white font-medium text-base transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
