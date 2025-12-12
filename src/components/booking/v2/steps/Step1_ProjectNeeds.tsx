import React from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "../BookingModal";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

export const Step1ProjectNeeds = ({ data, updateData, onNext }: Props) => {
  const handleNext = () => {
    // Validate Step 1 fields
    if (!data.projectType) {
      toast.error("Selection Required", {
        description: "Please select a project type (Shoot & Edit or Shoot & Raw Files)",
      });
      return;
    }

    if (!data.contentType) {
      toast.error("Selection Required", {
        description: "Please select a content type (Videography, Photography, or Both)",
      });
      return;
    }

    // Validation passed, proceed to next step
    onNext();
  };
  const contentTypes: BookingData["contentType"][] = [
    "videography",
    "photography",
    "both",
  ];

  return (
    <div className="flex flex-col h-full justify-center lg:w-[760px] mx-0 w-full py-8 md:py-[50px]">
      <h2 className="text-3xl font-bold text-[#1A1A1A] pb-10 md:pb-[50px] px-8 md:px-[50px] border-b border-b-[#CACACA]">
        Book Your Shoot Now
      </h2>

      {/* Project Needs */}
      <div className="p-8 md:p-[50px] pb-0 md:pb-0">
        <label className="text-xl font-medium text-[#212122E5] mb-3 md:mb-6 block">
          My Project Needs
        </label>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "shoot_edit" as const, label: "Shoot & Edit" },
            { value: "shoot_raw" as const, label: "Shoot & Raw Files" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() =>
                updateData({
                  projectType: item.value,
                })
              }
              className={`h-[82px] rounded-[12px] border px-4 flex items-center justify-between transition-all
                ${
                  data.projectType === item.value
                    ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                    : "border-[#E5E5E5] hover:border-[#CCCCCC] text-[#1A1A1A]"
                }`}
            >
              <span className="font-medium text-lg">{item.label}</span>

              {data.projectType === item.value ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(134deg, #E8D1AB 17.17%, #E6AA46 76.39%)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-[#E5E5E5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Type */}
      <div className="p-8 md:p-[50px] pb-0 md:pb-0">
        <label className="text-xl font-medium text-[#212122E5] mb-3 md:mb-6 block">
          Content Type
        </label>

        <div className="grid grid-cols-3 gap-4">
          {contentTypes.map((value) => (
            <button
              key={value}
              onClick={() =>
                updateData({
                  contentType: value,
                })
              }
              className={`h-[82px] rounded-[12px] border px-4 flex items-center justify-between transition-all
                ${
                  data.contentType === value
                    ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                    : "border-[#E5E5E5] hover:border-[#CCCCCC] text-[#1A1A1A]"
                }`}
            >
              <span className="font-medium text-lg capitalize">{value}</span>

              {data.contentType === value ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(134deg, #E8D1AB 17.17%, #E6AA46 76.39%)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-[#E5E5E5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="p-8 md:p-[50px]">
        <Button
          onClick={handleNext}
          disabled={!data.projectType || !data.contentType}
          className="w-full h-[96px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-2xl rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
