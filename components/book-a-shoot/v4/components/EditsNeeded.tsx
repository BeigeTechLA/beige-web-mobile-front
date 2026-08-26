"use client";

import React, { useState } from "react";
import { ArrowLeft, Info, Check, Minus, Plus, Video, ChevronDown } from "lucide-react";
import { CollapsibleEdit } from "./CollapsibleEdit";

export interface EditsConfig {
  needsEdits: boolean;
  editedPhotosSets: number;
  videoEditTypes: string[];
  photoEditTypes: string[];
}

export type EditOption = {
  key: string;
  value: string;
  note?: string;
};

interface EditsNeededProps {
  onContinue: (config: EditsConfig) => void;
  onBack?: () => void;
  initialConfig?: EditsConfig;
  baseFreePhotos?: number;
  photosPerSet?: number;
  durationLabel?: string;
  videoEditOptions?: EditOption[];
  photoEditOptions?: EditOption[];
  showVideoEdits?: boolean;
  showPhotoEdits?: boolean;
  stepLabel?: string;
  progressPercent?: number;
}

export const EditsNeeded: React.FC<EditsNeededProps> = ({
  onContinue,
  onBack,
  initialConfig = {
    needsEdits: true,
    editedPhotosSets: 0,
    videoEditTypes: [],
    photoEditTypes: [],
  },
  baseFreePhotos = 100,
  photosPerSet = 25,
  durationLabel = "4 Hour Duration",
  videoEditOptions = [],
  photoEditOptions = [],
  showVideoEdits = true,
  showPhotoEdits = true,
  stepLabel = "STEP 04",
  progressPercent = 44,
}) => {
  const [needsEdits, setNeedsEdits] = useState<boolean>(initialConfig.needsEdits);
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(true);
  const [editedPhotosSets, setEditedPhotosSets] = useState<number>(
    initialConfig.editedPhotosSets
  );
  const [videoEditCounts, setVideoEditCounts] = useState<Record<string, number>>(() =>
    (initialConfig.videoEditTypes || []).reduce<Record<string, number>>((acc, slug) => {
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    }, {})
  );

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => Math.max(0, prev - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => prev + 1);
  };

  const handleVideoIncrement = (slug: string) => {
    setVideoEditCounts((prev) => ({
      ...prev,
      [slug]: (prev[slug] || 0) + 1,
    }));
  };

  const handleVideoDecrement = (slug: string) => {
    setVideoEditCounts((prev) => {
      const current = prev[slug] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[slug];
        return next;
      }

      return {
        ...prev,
        [slug]: current - 1,
      };
    });
  };

  // Calculate total photos received based on base count and sets added
  const totalAddedExtra = editedPhotosSets * photosPerSet;
  const roundedBaseFreePhotos = Math.round(baseFreePhotos);
  const totalPhotos = roundedBaseFreePhotos + totalAddedExtra;
  const photoSlug = photoEditOptions[0]?.key || "edited_photos";

  const handleNext = () => {
    const videoEditTypes =
      needsEdits && showVideoEdits
        ? Object.entries(videoEditCounts).flatMap(([slug, count]) =>
            Array.from({ length: count }, () => slug)
          )
        : [];

    onContinue({
      needsEdits,
      editedPhotosSets,
      videoEditTypes,
      photoEditTypes:
        needsEdits && showPhotoEdits
          ? Array.from({ length: editedPhotosSets }, () => photoSlug)
          : [],
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
            {stepLabel}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] text-white mb-3 tracking-tight">
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
              Professional color grading, sound mixing, selected video packages, and polished photo delivery.
            </span>
          </div>
        </div>

        {needsEdits && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {showVideoEdits && videoEditOptions.length > 0 && (
              <div className="rounded-2xl bg-[#101010] border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-b border-white/20">
                  <button
                    type="button"
                    onClick={() => setIsVideoOpen((prev) => !prev)}
                    className="w-full p-6 lg:px-7 lg:py-9 flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-[#E8D1AB]">
                      Video Edits
                    </h3>
                    <div className="flex items-center gap-3 text-white/70">
                      <Video className="w-5 h-5 lg:w-8 lg:h-8" />
                      <ChevronDown
                        className={`w-5 h-5 lg:w-8 lg:h-8 transition-transform ${
                          isVideoOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {isVideoOpen && (
                  <div className="px-6 md:px-8 py-6 md:py-8 space-y-4">
                    {videoEditOptions.map((option) => {
                      const count = videoEditCounts[option.key] || 0;

                      return (
                        <div
                          key={option.key}
                          className={`flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between rounded-2xl border p-4 lg:p-5 bg-[#171717] transition-colors ${
                            count > 0 ? "border-[#E8D1AB]" : "border-white/10"
                          }`}
                        >
                          <div>
                            <h4 className="text-base lg:text-xl font-medium text-white">
                              {option.value}
                            </h4>
                            {option.note && (
                              <p className="text-sm text-white/50 mt-1">{option.note}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 bg-[#E8D1AB] text-black px-3.5 py-2 rounded-full font-semibold text-sm self-start xl:self-auto">
                            <button
                              type="button"
                              onClick={() => handleVideoDecrement(option.key)}
                              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                            </button>
                            <span className="w-6 text-center text-base lg:text-xl font-medium">
                              {String(count).padStart(2, "0")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVideoIncrement(option.key)}
                              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {showPhotoEdits && photoEditOptions.length > 0 && (
              <CollapsibleEdit
                title="Photo Edits"
                itemLabel={photoEditOptions[0]?.value || "Edited Photos"}
                setsCount={editedPhotosSets}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                baseFreeCount={roundedBaseFreePhotos}
                perSetCount={photosPerSet}
                durationLabel={durationLabel}
                totalExtra={totalAddedExtra}
                totalCount={totalPhotos}
                icon="Photo"
              />
            )}
          </div>
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
