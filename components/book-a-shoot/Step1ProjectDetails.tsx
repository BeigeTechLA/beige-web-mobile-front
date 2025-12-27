"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";
import { toast } from "sonner";
import { Check, Info } from "lucide-react";
import DropdownSelect from "./DropdownSelect";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { shootTypes, weddingEditTypes, musicEditTypes, commercialEditTypes, tvSeriesEditTypes, podcastEditTypes, shortFilmEditTypes, movieEditTypes, corporateEventEditTypes, privateEventEditTypes } from "@/app/data/shootData";
import { useGetCatalogQuery } from "@/lib/redux/features/pricing/pricingApi";
import { formatCurrency } from "@/lib/api/pricing";

// Tooltip component for displaying pricing info
const PriceTooltip = ({ rate, isVisible }: { rate: number | null; isVisible: boolean }) => {
  if (!isVisible || rate === null) return null;
  
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1A1A1A] border border-[#E8D1AB]/30 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[#E8D1AB] text-sm font-medium whitespace-nowrap">
          From {formatCurrency(rate)}/hr
        </p>
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A1A] border-b border-r border-[#E8D1AB]/30 rotate-45" />
    </div>
  );
};

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Content type to pricing category slug mapping
const CONTENT_TYPE_SLUGS: Record<string, string> = {
  videographer: "videographer",
  photographer: "photographer", 
  cinematographer: "cinematographer",
};

export const Step1ProjectDetails = ({ data, updateData, onNext }: Props) => {
  const [shootType, setShootType] = useState<string | null>(null);
  const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  
  // Fetch pricing catalog to get base rates
  const { data: categories } = useGetCatalogQuery({ mode: "general" });
  
  // Extract base rates for each content type from catalog
  const getBaseRate = (contentType: string): number | null => {
    if (!categories || contentType === "all") return null;
    
    // Look for items that match the content type
    for (const category of categories) {
      for (const item of category.items) {
        const itemNameLower = item.name.toLowerCase();
        const contentTypeLower = contentType.toLowerCase();
        
        // Check if this is a base rate item for this content type
        if (itemNameLower.includes(contentTypeLower) && item.rate_type === "per_hour") {
          return parseFloat(String(item.rate));
        }
      }
    }
    
    // Fallback rates if not found in catalog
    const fallbackRates: Record<string, number> = {
      videographer: 150,
      photographer: 120,
      cinematographer: 200,
    };
    
    return fallbackRates[contentType] || null;
  };

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
    if (data.serviceType !== "shoot_raw" && (!data.editType || data.editType.length === 0)) {
      toast.error("Selection Required", { description: "Please select at least one edit type." });
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

                const rate = getBaseRate(value);
                const showTooltip = hoveredType === value && value !== "all";
                
                return (
                  <div key={value} className="relative">
                    <PriceTooltip rate={rate} isVisible={showTooltip} />
                    <button
                      onClick={handleToggle}
                      onMouseEnter={() => setHoveredType(value)}
                      onMouseLeave={() => setHoveredType(null)}
                      className={`w-full h-14 lg:h-[82px] rounded-2xl border px-6 flex items-center justify-between transition-all duration-300 ${isSelected
                        ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                        : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                        }`}
                    >
                      <span className="font-medium text-sm lg:text-lg capitalize flex items-center gap-2">
                        {value}
                        {value !== "all" && (
                          <Info size={14} className={`${isSelected ? "text-black/40" : "text-white/30"}`} />
                        )}
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
                  </div>
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
                  editType: [],
                });
              }}
              bgColour={"bg-[#101010]"}
            />

            {/* Edit Type - Multi-select, only show if service involves editing */}
            <MultiSelectDropdown
              title="Edit Type"
              options={editTypeOptions}
              value={data.editType}
              onChange={(values) => updateData({ editType: values })}
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