import React from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "../BookingModal";
import { toast } from "sonner";
import { DropdownSelect } from "../component/DropdownSelect";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2ShootType = ({ data, updateData, onNext, onBack }: Props) => {
  const handleNext = () => {
    // Validate Step 2 fields
    if (!data.shootType || data.shootType.trim() === "") {
      toast.error("Selection Required", {
        description: "Please select a shoot type",
      });
      return;
    }

    if (!data.editType || data.editType.trim() === "") {
      toast.error("Selection Required", {
        description: "Please select an edit type",
      });
      return;
    }

    // Validation passed, proceed to next step
    onNext();
  };

  return (
    <div className="flex flex-col h-full justify-center lg:w-[760px] mx-0 w-full py-8 md:py-[50px] overflow-visible relative">
      <h2 className="text-3xl font-bold text-[#1A1A1A] pb-10 md:pb-[50px] px-8 md:px-[50px] border-b border-b-[#CACACA]">
        Select Shoot Type and Edits
      </h2>

      <div className="flex flex-col gap-6 p-8 md:p-[50px] overflow-visible relative">
        <DropdownSelect
          label="Shoot Type"
          value={data.shootType}
          options={[
            "Wedding",
            "Corporate",
            "Event",
            "Commercial",
            "Portrait",
          ]}
          onChange={(v) => updateData({ shootType: v })}
        />

        <DropdownSelect
          label="Edit Type"
          value={data.editType}
          options={[
            "Cinematic",
            "Documentary",
            "Social Media",
            "Highlight Reel",
          ]}
          onChange={(v) => updateData({ editType: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 px-8 md:px-[50px]">
        <Button
          onClick={onBack}
          className="h-[96px] bg-[#1A1A1A] hover:bg-[#333] text-white font-medium text-lg md:text-2xl rounded-[12px]"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!data.shootType || !data.editType}
          className="h-[96px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-lg md:text-2xl rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
