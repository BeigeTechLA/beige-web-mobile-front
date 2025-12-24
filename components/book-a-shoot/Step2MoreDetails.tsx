"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";
import { toast } from "sonner";
import { AddOns } from "./AddOns";

import { Addon, weddingEquipmentAddOns, weddingEditingPostProductionAddOns, weddingArtistAddOns, crewAndLaborAddOns, equipmentAddOns, artistAddOns, scriptingAddOns, editingPostProductionAddOns, studioAndBackgroundAddOns, liveStreamAddons } from "@/app/data/shootData";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2MoreDetails = ({ data, updateData, onNext }: Props) => {
  console.log(data);

  const handleAddonUpdate = (newAddons: Record<string, number>) => {
    updateData({ addons: newAddons });
  };

  const handleNext = () => {
    if (!data.shootName) {
      toast.error("Input Required", { description: "Please enter a shoot name." });
      return;
    }
    onNext();
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickedValue = Math.round((percentage * 20000) / 100) * 100;

    const distanceToMin = Math.abs(clickedValue - data.budgetMin);
    const distanceToMax = Math.abs(clickedValue - data.budgetMax);

    if (distanceToMin < distanceToMax) {
      updateData({
        budgetMin: Math.min(clickedValue, data.budgetMax - 500),
      });
    } else {
      updateData({
        budgetMax: Math.max(clickedValue, data.budgetMin + 500),
      });
    }
  };

  const renderAddonGroups = () => {
    if (data.wantsAddons === "no") return null;

    if (data.wantsAddons === "yes") {
      if (data.shootType === "wedding") {
        return (
          <>
            <AddOns title="Wedding Equipment" items={weddingEquipmentAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Wedding Editing & Post" items={weddingEditingPostProductionAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Wedding Artists" items={weddingArtistAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
          </>
        );
      } else {
        return (
          <>
            <AddOns title="Crew & Labor" items={crewAndLaborAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Equipment" items={equipmentAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Artists" items={artistAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Scripting" items={scriptingAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Editing & Post Production" items={editingPostProductionAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Studio & Background" items={studioAndBackgroundAddOns} value={data.addons || {}} onChange={handleAddonUpdate} />
            <AddOns title="Live Stream" items={liveStreamAddons} value={data.addons || {}} onChange={handleAddonUpdate} />
          </>
        );
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Add Information & Budget</h2>
          <p className="text-xs lg:text-sm text-[#939393]">Share your requirements and set your budget.</p>
        </div>

        <div className="flex flex-col gap-4 lg:gap-9">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Shoot Name */}
            <div className="relative w-full">
              <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
                Shoot Name
              </label>
              <input
                type="text"
                value={data.shootName}
                onChange={(e) => updateData({ shootName: e.target.value })}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/60 bg-[#101010]"
                placeholder="Shoot Name"
              />
            </div>

            {/* Crew Size */}
            <div className="relative w-full">
              <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
                Add Crew Size
              </label>
              <input
                type="text"
                value={data.crewSize}
                onChange={(e) => updateData({ crewSize: e.target.value })}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/60 bg-[#101010]"
                placeholder="e.g. 2-5"
              />
            </div>
          </div>

          {/* Reference Link */}
          <div className="relative w-full">
            <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
              Reference Link
            </label>
            <input
              type="text"
              value={data.referenceLink}
              onChange={(e) => updateData({ referenceLink: e.target.value })}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/60 bg-[#101010]"
              placeholder="URL"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Special Note */}
            <div className="relative w-full">
              <label className="absolute -top-2 lg:-top-3 left-4 bg-[#101010] px-2 text-sm lg:text-base text-white/60">
                Special Note
              </label>
              <textarea
                value={data.specialNote}
                onChange={(e) => updateData({ specialNote: e.target.value })}
                className="h-24 lg:h-[162px] w-full p-4 rounded-[12px] border border-white/30 text-white outline-none focus:border-white/60 bg-[#101010]"
                placeholder="Any specific requirements..."
              />
            </div>

            {/* Budget Range */}
            <div className="relative w-full">
              <div className="w-full bg-[#171717] rounded-[12px] p-3 lg:p-6">
                <label className="block mb-3 text-sm lg:text-base font-medium text-white">
                  Budget Range
                </label>
                <div
                  onClick={handleTrackClick}
                  className="relative w-full h-1 lg:h-[6px] bg-[#4D4D4D] rounded-full my-5"
                >
                  {/* ACTIVE RANGE */}
                  <div
                    className="absolute h-1 lg:h-[6px] bg-[#E8D1AB] rounded-full pointer-events-none cursor-pointer"
                    style={{
                      left: `${(data.budgetMin / 20000) * 100}%`,
                      width: `${((data.budgetMax - data.budgetMin) / 20000) * 100}%`,
                    }}
                  />

                  {/* MIN SLIDER */}
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={data.budgetMin}
                    onChange={(e) => {
                      const newMin = Number(e.target.value);
                      updateData({
                        budgetMin: Math.min(newMin, data.budgetMax - 500),
                      });
                    }}
                    className={`absolute top-[-10px] left-0 w-full appearance-none bg-transparent pointer-events-none focus:outline-none ${data.budgetMin > 15000 ? 'z-[5]' : 'z-[3]'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#CBB894] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:pointer-events-auto`}
                  />

                  {/* MAX SLIDER */}
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={data.budgetMax}
                    onChange={(e) => {
                      const newMax = Number(e.target.value);
                      updateData({
                        budgetMax: Math.max(newMax, data.budgetMin + 500),
                      });
                    }}
                    className="absolute top-[-10px] left-0 z-[4] w-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#CBB894] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:pointer-events-auto"
                  />
                </div>

                {/* LABELS */}
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm lg:text-base text-white/60">Minimum</p>
                    <p className="text-sm lg:text-base font-medium text-white">${data.budgetMin}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm lg:text-base text-white/60">Maximum</p>
                    <p className="text-sm lg:text-base font-medium text-white">${data.budgetMax}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/10 my-4" />

        <div className="flex flex-col gap-6 lg:gap-10">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Do you want the Add on?</h2>

          <div className="flex gap-3 lg:gap-6">
            {[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateData({ wantsAddons: item.value as "yes" | "no" })}
                className={`h-14 lg:h-[82px] lg:w-[140px] rounded-2xl border px-2 lg:px-4 flex items-center justify-between transition-all ${data.wantsAddons === item.value
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">{item.label}</span>
                <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${data.wantsAddons === item.value ? "bg-black" : "border border-[#E5E5E5]"
                  }`}>
                  {data.wantsAddons === item.value && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                </div>
              </button>
            ))}
          </div>

          {/* Render grouped components based on Shoot Type */}
          <div className="flex flex-col gap-8 mt-4">
            {renderAddonGroups()}
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={handleNext}
          className="h-12 lg:h-[72px] w-full md:w-[185px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold text-base lg:text-xl rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};