"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import DottedDivider from "@/components/admin/DottedDivider";
import { IntentBadge } from "@/components/sales/IntentBadge";
import { ContentTypeCheckbox } from "@/components/book-a-shoot/v3/components/ContentTypeCheckbox";

import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors } from "lucide-react";

import { toast } from "sonner";
import { newshootTypes } from "@/app/data/shootData";

import { BookingDataV3, initialDataV3 } from "@/components/book-a-shoot/v3";
import { MultiSelectDropdown } from "@/components/book-a-shoot";


const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;

const editTypeOptions = newshootTypes.map((shoot) => ({
  key: shoot.key,    // used for logic/selection
  value: shoot.title // used for display in pills and list
}));

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const contentTypeRef = useRef<HTMLDivElement>(null);
  const shootTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);


  const updateData = useCallback((newData: Partial<BookingDataV3>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const toggleContentType = (
    type: "videographer" | "photographer" | "editing"
  ) => {
    const current = [...formData.contentType];
    const isCurrentlySelected = current.includes(type);

    // Calculate the new content type array
    const nextContentType = isCurrentlySelected
      ? current.filter((t) => t !== type)
      : [...current, type];

    if (nextContentType.length === 0) {
      // Reset formData object to initial state if no content types are selected
      updateData({
        contentType: [],
        shootType: "",
        startDate: "",
        endDate: "",
        editsNeeded: true,
        videoEditTypes: [],
        photoEditTypes: [],
      });
    } else {
      if (!nextContentType.includes("videographer")) {
        updateData({
          contentType: nextContentType,
          videoEditTypes: [],
        });
      } else if (!nextContentType.includes("photographer")) {
        updateData({
          contentType: nextContentType,
          photoEditTypes: [],
        });
      } else {
        updateData({ contentType: nextContentType });
      }
    }

    // Reset the view more toggle
    setVisibleCount(INITIAL_COUNT);

    if (nextContentType.length > 0) {
      scrollToRef(shootTypeRef);
    }
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref && ref.current) {
        const navOffset = 100;

        // Calculate absolute position relative to the entire document
        const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <div className="text-white font-sans">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
      >
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="flex items-center gap-5">
        <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
          {/* {initials} */}
          IN
        </div>
        <div className="flex gap-2 items-center">
          <h1 className="lg:text-[22px] font-semibold">
            {/* {clientName} */}
            Client Name
          </h1>
          <IntentBadge intent={"Hot"} />
        </div>
      </div>

      <DottedDivider />

      {/* Content Type */}
      <div ref={contentTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentTypeCheckbox
            label="Select All"
            icon={<SquaresUnite size={20} />}
            checked={
              formData.contentType.length === 2 && //As cinematography is not to be included in the length count at present
              !formData.contentType.includes("editing")
            }
            onChange={(checked) => {
              if (checked)
                updateData({
                  contentType: [
                    "videographer",
                    "photographer",
                  ],
                });
              else updateData({ contentType: [] });
            }}
          />
          <ContentTypeCheckbox
            label="Videography"
            icon={<Video size={20} />}
            checked={formData.contentType.includes("videographer")}
            onChange={() => toggleContentType("videographer")}
          />
          <ContentTypeCheckbox
            label="Photography"
            icon={<Camera size={20} />}
            checked={formData.contentType.includes("photographer")}
            onChange={() => toggleContentType("photographer")}
          />
          <ContentTypeCheckbox
            label="AI Editing"
            subLabel="Coming Soon"
            icon={<Scissors size={20} />}
            checked={false}
            onChange={() => { }}
            disabled={true}
          />
          <ContentTypeCheckbox
            label="Livestream"
            subLabel="Coming Soon"
            icon={<Radio size={20} />}
            checked={false}
            onChange={() => { }}
            disabled={true}
          />
        </div>
      </div>

      <DottedDivider />

      <div ref={shootTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
          {!formData.contentType || formData.contentType.length === 0
            ? "Shoot Type"
            : formData.contentType.includes("videographer") &&
              formData.contentType.includes("photographer")
              ? "Video and Photo Shoot Type"
              : formData.contentType.includes("videographer") ||
                formData.contentType.includes("cinematographer")
                ? "Video Shoot Type"
                : "Photo Shoot Type"}
        </h3>
        <MultiSelectDropdown
          title="Shoot Type"
          options={editTypeOptions}
          value={formData.shootType} //This might need to change if the element needs to accept multiselect
          onChange={(values) =>
            updateData({ shootType: values })
          }
          bgColour="bg-[#101010]"
          maxDisplay={5}
          fullWidth={true}
        />
      </div>
      <DottedDivider />

    </div>
  );
}
