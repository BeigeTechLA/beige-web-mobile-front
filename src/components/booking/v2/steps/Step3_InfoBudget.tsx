import React from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "../BookingModal";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  handleClose: () => void;
}

export const Step3InfoBudget = ({
  data,
  updateData,
  onNext,
  onBack,
  handleClose
}: Props) => {
  const handleNext = () => {
    // Validate Step 3 fields
    if (!data.shootName || data.shootName.trim() === "") {
      toast.error("Required Field", {
        description: "Please enter a shoot name for your project",
      });
      return;
    }

    if (data.shootName.trim().length < 3) {
      toast.error("Invalid Input", {
        description: "Shoot name must be at least 3 characters long",
      });
      return;
    }

    if (data.budgetMax < 100) {
      toast.error("Invalid Budget", {
        description: "Budget maximum must be at least $100",
      });
      return;
    }

    // Validation passed, proceed to next step
    onNext();
  };

  return (
    <div className="flex flex-col h-full justify-center w-[300px] md:w-[800px] lg:w-[1200px] mx-0 py-6 md:py-[50px]">

      <div className="flex justify-between items-start pb-6 md:pb-[50px] px-6 md:px-[50px] border-b border-b-[#CACACA]">
        <h2 className="text-xl lg:text-3xl font-bold text-[#1A1A1A]">
          Add Information & Budget
        </h2>
        <div className="top-5 right-5 md:top-[50px] md:right-[50px] z-10">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      {/* --- Grid 1 --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-[50px] pb-0 md:pb-0">
        {/* Shoot Name */}
        <div className="relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#FAFAFA] px-2 text-sm lg:text-base text-[#000]/60">
            Shoot Name
          </label>
          <input
            type="text"
            value={data.shootName}
            onChange={(e) => updateData({ shootName: e.target.value })}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-[#E5E5E5] px-4 text-[#1A1A1A] outline-none focus:border-[#1A1A1A] bg-[#FAFAFA]"
            placeholder="Project Name"
          />
        </div>

        {/* Crew Size */}
        <div className="relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#FAFAFA] px-2 text-sm lg:text-base text-[#000]/60">
            Add Crew Size
          </label>
          <input
            type="text"
            value={data.crewSize}
            onChange={(e) => updateData({ crewSize: e.target.value })}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-[#E5E5E5] px-4 text-[#1A1A1A] outline-none focus:border-[#1A1A1A] bg-[#FAFAFA]"
            placeholder="e.g. 2-5"
          />
        </div>

        {/* Reference Link */}
        <div className="relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#FAFAFA] px-2 text-sm lg:text-base text-[#000]/60">
            Reference Link
          </label>
          <input
            type="text"
            value={data.referenceLink}
            onChange={(e) => updateData({ referenceLink: e.target.value })}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-[#E5E5E5] px-4 text-[#1A1A1A] outline-none focus:border-[#1A1A1A] bg-[#FAFAFA]"
            placeholder="URL"
          />
        </div>
      </div>

      {/* --- Grid 2 --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 md:p-[50px] items-end">
        {/* Special Note */}
        <div className="relative w-full">
          <label className="absolute -top-2 lg:-top-3 left-4 bg-[#FAFAFA] px-2 text-sm lg:text-base text-[#000]/60">
            Special Note
          </label>
          <textarea
            value={data.specialNote}
            onChange={(e) => updateData({ specialNote: e.target.value })}
            className="h-24 lg:h-[148px] w-full rounded-[12px] border border-[#E5E5E5] p-4 text-[#1A1A1A] outline-none focus:border-[#1A1A1A] resize-none bg-[#FAFAFA]"
            placeholder="Any specific requirements..."
          />
        </div>

        {/* Budget Range */}
        <div className="relative w-full">
          <div className="w-full bg-white rounded-[12px] p-3 lg:p-6">
            <label className="block mb-3 text-sm lg:text-base font-medium text-[#000]/60">
              Budget Range
            </label>

            <div className="relative w-full h-1 lg:h-[6px] bg-[#3A3A3A] rounded-full mt-2 mb-6">
              {/* ACTIVE RANGE */}
              <div
                className="absolute h-1 lg:h-[6px] bg-[#E8D1AB] rounded-full pointer-events-none"
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
                // Added pointer-events-none and dynamic z-index logic
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
                // Added pointer-events-none
                className="absolute top-[-10px] left-0 z-[4] w-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#CBB894] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:pointer-events-auto"
              />
            </div>

            {/* LABELS */}
            <div className="flex justify-between">
              <div>
                <p className="text-xs lg:text-sm text-[#666]">Minimum</p>
                <p className="text-sm lg:text-base font-semibold text-black">${data.budgetMin}</p>
              </div>

              <div className="text-right">
                <p className="text-xs lg:text-sm text-[#666]">Maximum</p>
                <p className="text-sm lg:text-base font-semibold text-black">${data.budgetMax}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full px-8 md:px-[50px]">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[96px] bg-[#1A1A1A] hover:bg-[#333] text-white font-medium text-base lg:text-lg rounded-[12px]"
        >
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!data.shootName}
          className="h-14 lg:h-[96px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-lg rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
