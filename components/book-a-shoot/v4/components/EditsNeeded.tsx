"use client";

import React, { useState } from "react";
import { ArrowLeft, Info, Check, Minus, Plus, Sparkles, ChevronDown } from "lucide-react";
import { CollapsibleEdit } from "./CollapsibleEdit";

export interface EditsConfig {
  needsEdits: boolean;
  editedPhotosSets: number;
}

interface EditsNeededProps {
  onContinue: (config: EditsConfig) => void;
  onBack?: () => void;
  initialConfig?: EditsConfig;
  baseFreePhotos?: number;
  photosPerSet?: number;
  durationLabel?: string;
}

export const EditsNeeded: React.FC<EditsNeededProps> = ({
  onContinue,
  onBack,
  initialConfig = { needsEdits: true, editedPhotosSets: 1 },
  baseFreePhotos = 100,
  photosPerSet = 25,
  durationLabel = "4 Hour Duration",
}) => {
  const [needsEdits, setNeedsEdits] = useState<boolean>(initialConfig.needsEdits);
  const [editedPhotosSets, setEditedPhotosSets] = useState<number>(
    initialConfig.editedPhotosSets
  );

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => Math.max(0, prev - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => prev + 1);
  };

  // Calculate total photos received based on base count and sets added
  const totalAddedExtra = editedPhotosSets * photosPerSet;
  const totalPhotos = baseFreePhotos + totalAddedExtra;

  const handleNext = () => {
    onContinue({
      needsEdits,
      editedPhotosSets,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        {/* Step Indicator Bar */}
        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP 01
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-1/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            Need edits for your occasion?
          </h1>
          <p className="text-white/30 text-base md:text-xl font-light">
            Add professional editing to turn your raw footage into polished, share-ready content
          </p>
        </div>

        {/* Yes / No Toggle Group */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setNeedsEdits(true)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${needsEdits
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
              }`}
          >
            <span>Yes</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${needsEdits
                  ? "border-black bg-black"
                  : "border-white/40 bg-transparent"
                }`}
            >
              {needsEdits && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setNeedsEdits(false)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${!needsEdits
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
              }`}
          >
            <span>No</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!needsEdits
                  ? "border-black bg-black"
                  : "border-white/40 bg-transparent"
                }`}
            >
              {!needsEdits && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="space-y-2 mb-10">
          <div className="flex items-center gap-2 tracking-wider text-white">
            <Info className="w-4 h-4 lg:w-6 lg:h-6" />
            <span className="text-base lg:text-xl font-medium">Editing includes</span>
          </div>
          <div className="flex items-center gap-2 text-[#A9A9A9]">
            <Check className="w-4 h-4 lg:w-6 lg:h-6 shrink-0 mt-0.5" />
            <span className="text-xs lg:text-sm">
              Professional color grading, sound mixing, and basic revisions for a polished final result.
            </span>
          </div>
        </div>

        {/* Photo Edits Dynamic Container */}
        {needsEdits && (
          <CollapsibleEdit
            title="Photo Edits"
            itemLabel="Edited Photos"
            setsCount={editedPhotosSets}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            baseFreeCount={baseFreePhotos}
            perSetCount={photosPerSet}
            durationLabel={durationLabel}
            totalExtra={totalAddedExtra}
            totalCount={totalPhotos}
            icon="📸"
          />
        )}
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
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
          onClick={handleNext}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default EditsNeeded;