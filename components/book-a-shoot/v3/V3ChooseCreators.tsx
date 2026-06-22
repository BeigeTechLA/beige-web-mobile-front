"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { Camera, Check, ChevronDown, ChevronUp, Info, Video } from "lucide-react";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import type { BookingDataV3 } from "./types";
import { getPhotoEditSummary, getTotalDurationHours, PHOTO_EDIT_ADDON_SET_SIZE } from "./utils";
import { V3BookingDateTime } from "./V3BookingDateTime";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const V3ChooseCreators: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const hasVideographer = (data.videographyCount || 0) > 0;
  const hasPhotographer = (data.photographyCount || 0) > 0;
  const [openEdits, setOpenEdits] = useState<"video" | "photo" | null>(
    hasPhotographer && !hasVideographer ? "photo" : "video",
  );
  const videoEditOptions = [
    { key: "social_media_reel", label: "Social Media Reel (15 sec - 30 sec)" },
    { key: "social_media_reel_long", label: "Social Media Reel (30 sec - 60 sec)" },
    { key: "social_media_reel_extended", label: "Social Media Reel (2 min - 4 min)" },
  ];
  const photoEditOptions = [{ key: "edited_photos", label: "Edited Photos" }];
  const durationHours = getTotalDurationHours(data.bookingType, data.startDate, data.endDate, data.bookingDays);
  const photoEditSetCount = data.photoEditTypes.filter((item) => item === "edited_photos").length;
  const photoEditSummary = getPhotoEditSummary({
    shootType: data.shootType,
    durationHours,
    selectedAddOnSets: photoEditSetCount,
  });
  const receiveSummaryText = [
    `${photoEditSummary.totalCount} Photos`,
    data.videoEditTypes.length > 0 ? `${data.videoEditTypes.length} Videos` : null,
  ].filter(Boolean).join(" + ");

  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  const creatorRows = useMemo(() => [
    { key: "videographer" as const, label: "Videographer", icon: <Video size={28} />, count: data.videographyCount || 0 },
    { key: "photographer" as const, label: "Photographer", icon: <Camera size={28} />, count: data.photographyCount || 0 },
  ], [data.photographyCount, data.videographyCount]);

  const updateCreatorCount = (key: "videographer" | "photographer", count: number) => {
    const nextCount = Math.max(0, count);
    updateData({
      ...(key === "videographer" ? { videographyCount: nextCount } : { photographyCount: nextCount }),
      roleCounts: { ...data.roleCounts, [key]: nextCount },
    });
  };

  const updateEditQuantity = (type: "video" | "photo", key: string, count: number) => {
    const source = type === "video" ? data.videoEditTypes : data.photoEditTypes;
    const next = [
      ...source.filter((item) => item !== key),
      ...Array.from({ length: Math.max(0, count) }, () => key),
    ];
    updateData(type === "video" ? { videoEditTypes: next } : { photoEditTypes: next });
  };

  const getEditCount = (type: "video" | "photo", key: string) =>
    (type === "video" ? data.videoEditTypes : data.photoEditTypes).filter((item) => item === key).length;

  const visibleEditTypes = [
    hasVideographer ? "video" as const : null,
    hasPhotographer ? "photo" as const : null,
  ].filter((type): type is "video" | "photo" => type !== null);

  const handleContinue = () => {
    if ((data.videographyCount || 0) + (data.photographyCount || 0) === 0) {
      toast.error("Please select at least one creator.");
      return;
    }
    onNext();
  };

  return (
    <div className="flex w-full flex-col gap-8 md:gap-12">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gradient-white lg:text-[64px]">Choose Creators</h2>
        <p className="mt-2 text-sm text-white/50">Let us know if you need a photographer or videographer for your studio.</p>
      </div>

      <section className="border-t border-white/10 pt-8">
        <h3 className="mb-4 text-sm font-medium text-white">Select professionals for your location.</h3>
        <div className="animate-in slide-in-from-top-4 rounded-[20px] border border-white/5 bg-[#171717] p-3 lg:p-6">
          <div className="flex flex-col gap-4">
          {creatorRows.map((creator, index) => (
            <div key={creator.key} className={`flex items-center justify-between py-4 ${index ? "border-t border-white/5" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60">
                  {creator.icon}
                </div>
                <div className="text-lg font-medium text-white">{creator.label}</div>
              </div>
              <QuantityControl
                value={creator.count}
                onDecrease={() => updateCreatorCount(creator.key, creator.count - 1)}
                onIncrease={() => updateCreatorCount(creator.key, creator.count + 1)}
              />
            </div>
          ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 pt-8">
        <V3BookingDateTime data={data} updateData={updateData} />
      </section>

      <section className="border-t border-white/10 pt-8">
        <h3 className="mb-4 text-base lg:text-xl font-medium text-white/90">Edits Needed?</h3>
        <div className="mb-5 flex gap-3">
          {[{ label: "Yes", value: true }, { label: "No", value: false }].map((option) => (
            <button
              key={option.label}
              onClick={() => updateData(option.value ? { editsNeeded: true } : { editsNeeded: false, videoEditTypes: [], photoEditTypes: [] })}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${data.editsNeeded === option.value ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
            >
              <span className="font-medium text-sm">{option.label}</span>
              <span className={`grid h-6 w-6 lg:h-8 lg:w-8 place-items-center rounded-full ${data.editsNeeded === option.value ? "bg-black" : "border border-[#E5E5E5]"}`}>
                {data.editsNeeded === option.value && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
              </span>
            </button>
          ))}
        </div>
        {data.editsNeeded && (
          <div className="mt-4 animate-in slide-in-from-top-4 duration-300 lg:mt-8">
            <h4 className="mb-4 flex items-center gap-2 font-medium text-white lg:text-xl">
              <Info size={24} className="text-white" />
              Editing includes
            </h4>
            <p className="mb-11 text-sm text-white/60">Professional editing includes color grading, sound mixing, and basic revisions.</p>
            <div className={`grid grid-cols-1 gap-6 ${visibleEditTypes.length > 1 ? "md:grid-cols-2" : ""}`}>
              {visibleEditTypes.map((type) => (
                <div key={type} className="self-start overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
                  <button onClick={() => setOpenEdits(openEdits === type ? null : type)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="shrink-0 text-base font-medium text-white">{type === "video" ? "Video Edits" : "Photo Edits"}</span>
                      {(type === "video" ? videoEditOptions : photoEditOptions).map((option) => {
                        const count = getEditCount(type, option.key);
                        return count > 0 ? (
                          <span key={option.key} className="inline-flex max-w-full items-center gap-1 rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs text-white lg:text-sm">
                            <span className="max-w-[180px] truncate">{option.label}</span>
                            <span className="shrink-0 text-white/50">x{count}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                    {openEdits === type ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openEdits === type && (
                    <div className="border-t border-white/10 px-5 py-3">
                      {(type === "video" ? videoEditOptions : photoEditOptions).map((option) => {
                        const count = getEditCount(type, option.key);
                        return (
                          <div key={option.key} className="flex items-center justify-between gap-4 border-b border-white/10 py-4 last:border-0">
                            <span className="text-sm text-white">{option.label}</span>
                            <div>
                              <QuantityControl
                              value={count}
                              onDecrease={() => updateEditQuantity(type, option.key, count - 1)}
                              onIncrease={() => updateEditQuantity(type, option.key, count + 1)}
                              className="h-[48px] min-w-[100px] rounded-[16px] px-4"
                              />
                            </div>
                          </div>
                        );
                      })}
                      {type === "photo" && (
                        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                          {photoEditSummary.includedCount > 0 && (
                            <div className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm text-[#E8D1AB]">
                              Includes {photoEditSummary.includedCount} free photo edits
                            </div>
                          )}
                          <div className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#171717]">
                            {durationHours} Hour Duration
                          </div>
                          <div className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm text-[#E8D1AB]">
                            + {photoEditSummary.extraCount} Added Extra
                          </div>
                          <div className="w-full text-xs text-white/40">
                            +{PHOTO_EDIT_ADDON_SET_SIZE} Photos Per Unit
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(photoEditSummary.totalCount > 0 || data.videoEditTypes.length > 0) && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-black">
                  <Image src="/images/misc/booking-sparkle.png" alt="" width={16} height={16} />
                </div>
                <p className="text-sm font-semibold">
                  You&apos;ll Receive {receiveSummaryText}
                </p>
                <Check size={18} />
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
        <Button onClick={onBack} className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]">Back</Button>
        <Button onClick={handleContinue} className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]">Continue</Button>
      </div>
    </div>
  );
};
