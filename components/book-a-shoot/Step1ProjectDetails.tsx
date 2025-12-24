"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";
import { toast } from "sonner";
import { Check } from "lucide-react";
import DropdownSelect from "./DropdownSelect";
import { shootTypes, weddingEditTypes, musicEditTypes, commercialEditTypes, tvSeriesEditTypes, podcastEditTypes, shortFilmEditTypes, movieEditTypes, corporateEventEditTypes, privateEventEditTypes } from "@/app/data/shootData";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step1ProjectDetails = ({ data, updateData, onNext }: Props) => {
  const [shootType, setShootType] = useState<string | null>(null);
  const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>([]);

  const handleNext = () => {
    // Validation
    if (!data.serviceType) {
      toast.error("Selection Required", { description: "Please select a service type." });
      return;
    }
    if (!data.contentType || data.contentType.length === 0) {
      toast.error("Selection Required", { description: "Please select at least one content type." });
      return;
    }

    // Shoot Type is only required if we are actually shooting
    if (data.serviceType !== "edit_files" && !data.shootType) {
      toast.error("Selection Required", { description: "Please select a shoot type." });
      return;
    }

    // Edit Type is only required if we are editing
    if (data.serviceType !== "shoot_raw" && !data.editType) {
      toast.error("Selection Required", { description: "Please select an edit type." });
      return;
    }

    onNext();
  };

  const contentTypes = ["videographer", "photographer", "cinematographer", "all"] as const;

  useEffect(() => {
    switch (shootType) {
      case "wedding":
        setEditTypeOptions(weddingEditTypes);
        break;

      case "music":
        setEditTypeOptions(musicEditTypes);
        break;

      case "commercial":
        setEditTypeOptions(commercialEditTypes);
        break;

      case "tv":
        setEditTypeOptions(tvSeriesEditTypes);
        break;

      case "podcast":
        setEditTypeOptions(podcastEditTypes);
        break;

      case "short_film":
        setEditTypeOptions(shortFilmEditTypes);
        break;

      case "movie":
        setEditTypeOptions(movieEditTypes);
        break;

      case "corporate_event":
        setEditTypeOptions(corporateEventEditTypes);
        break;

      case "private_event":
        setEditTypeOptions(privateEventEditTypes);
        break;

      default:
        setEditTypeOptions([]);
    }
  }, [shootType]);

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">My Project Needs</h2>
          <p className="text-xs lg:text-sm text-[#939393]">Choose your service and content type to get started.</p>
        </div>

        {/* Service Type */}
        <div className="">
          <label className="text-base lg:text-xl font-medium text-[#A9A9A9]/90 mb-3 md:mb-6 block">Service Type</label>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
            {[
              { value: "shoot_raw", label: "Shoot & Raw Files" },
              { value: "shoot_edit", label: "Shoot & Edit" },
              { value: "edit_files", label: "Edit Files" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() =>
                  updateData({
                    serviceType: item.value as any
                  })
                }
                className={`h-14 lg:h-[82px] rounded-2xl border px-2 lg:px-4 flex items-center justify-between transition-all ${data.serviceType === item.value
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  {item.label}
                </span>

                {data.serviceType === item.value ? (
                  <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center bg-black">
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border border-[#E5E5E5]" />
                )}
              </button>

            ))}
          </div>
        </div>

        {/* Content Type (Multi-select) */}
        {data.serviceType !== "edit_files" && (
          <div className="animate-in fade-in duration-500">
            <label className="text-base lg:text-xl font-medium text-[#A9A9A9]/90 mb-3 md:mb-6 block">
              Content Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-6">
              {contentTypes.map((value) => {
                const isSelected = data.contentType?.includes(value);

                const handleToggle = () => {
                  let currentValues = Array.isArray(data.contentType)
                    ? [...data.contentType]
                    : [];

                  let newValues: typeof contentTypes[number][];

                  if (value === "all") {
                    newValues = currentValues.length === contentTypes.length ? [] : [...contentTypes];
                  } else {
                    const tempValues = currentValues.includes(value)
                      ? currentValues.filter((v) => v !== value)
                      : [...currentValues, value];

                    const others = contentTypes.filter((v) => v !== "all");
                    const allOthersSelected = others.every((v) => tempValues.includes(v));

                    if (allOthersSelected) {
                      newValues = [...others, "all"];
                    } else {
                      newValues = tempValues.filter((v) => v !== "all") as typeof contentTypes[number][];
                    }
                  }
                  // Casting to any to avoid the 'string[]' assignment error
                  updateData({ contentType: newValues as any });
                };

                return (
                  <button
                    key={value}
                    onClick={handleToggle}
                    className={`h-14 lg:h-[82px] rounded-2xl border px-6 flex items-center justify-between transition-all duration-300 ${isSelected
                      ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                      : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                      }`}
                  >
                    <span className="font-medium text-sm lg:text-lg capitalize">
                      {value}
                    </span>
                    <div
                      className={`w-6 h-6 lg:w-8 lg:h-8 rounded-sm flex items-center justify-center transition-all ${isSelected
                        ? "bg-[#1A1A1A] text-white shadow-sm"
                        : "border border-white/20 bg-transparent"
                        }`}
                    >
                      {isSelected && <Check size={20} strokeWidth={3.5} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <hr className="border-white/10 my-4" />

        <div className="flex flex-col gap-8">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Shoot Type & Preferences</h2>

          <div className="flex gap-3 lg:gap-6">
            <DropdownSelect
              title="Shoot Type"
              options={shootTypes}
              value={shootType}
              onChange={(value) => {
                setShootType(value);
                updateData({
                  shootType: value,
                  editType: undefined,
                });
              }}
              bgColour={"bg-[#101010]"}
            />

            {/* Edit Type - Only show if service involves editing */}
            <DropdownSelect
              title="Edit Type"
              options={editTypeOptions}
              value={data.editType}
              onChange={(value) => updateData({ editType: value })}
              bgColour={"bg-[#101010]"}
            />
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