"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Info, Minus, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { pushToDataLayer } from "@/lib/gtm";
import { CollapsibleEdit } from "./CollapsibleEdit";
import { getPhotoEditsIncludedPerHour } from "@/components/book-a-shoot/v3/utils";
import {
  commercialEditTypes,
  commercialPhotoEditTypes,
  corporateEventEditTypes,
  corporateEventPhotoEditTypes,
  behindScenesPhotoEditTypes,
  musicEditTypes,
  musicPhotoEditTypes,
  peopleTeamsPhotoEditTypes,
  privateEventPhotoEditTypes,
  socialContentEditTypes,
  socialContentPhotoEditTypes,
  weddingEditTypes,
  weddingPhotoEditTypes,
  podcastEditTypes,
  shortFilmEditTypes,
  tvSeriesEditTypes,
  movieEditTypes,
  brandProductPhotoEditTypes,
} from "@/app/data/shootData";

export interface EditsConfig {
  needsEdits: boolean;
  editedPhotosSets: number;
}

interface EditsNeededProps {
  onContinue: (
    config: EditsConfig & {
      videoEditTypes?: string[];
      photoEditTypes?: string[];
      expectedDeliveryDate?: string;
    },
    bookingId?: number
  ) => void;
  onBack?: () => void;
  initialConfig?: EditsConfig;
  baseFreePhotos?: number;
  photosPerSet?: number;
  durationLabel?: string;
  contentType?: string[];
  shootType?: string;
  email?: string;
  bookingId?: number;
  clientName?: string;
}

type EditOption = { key: string; value: string; note?: string };

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager",
};

const buildEditCounts = (keys: string[]) =>
  keys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const getShootTypeEditOptions = (shootType?: string) => {
  let videoEditOptions: EditOption[] = [];
  let photoEditOptions: EditOption[] = [];
  let photoEditNote = "";

  switch (shootType) {
    case "wedding":
      videoEditOptions = weddingEditTypes;
      photoEditOptions = weddingPhotoEditTypes;
      photoEditNote = "50 edited photos per hour for weddings";
      break;
    case "music":
      videoEditOptions = musicEditTypes;
      photoEditOptions = musicPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "commercial":
      videoEditOptions = commercialEditTypes;
      photoEditOptions = commercialPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "tv":
      videoEditOptions = tvSeriesEditTypes;
      break;
    case "podcast":
      videoEditOptions = podcastEditTypes;
      break;
    case "short_film":
      videoEditOptions = shortFilmEditTypes;
      break;
    case "movie":
      videoEditOptions = movieEditTypes;
      break;
    case "corporate":
      videoEditOptions = corporateEventEditTypes;
      photoEditOptions = corporateEventPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "private":
      videoEditOptions = corporateEventEditTypes; // Old UI used corporate as fallback for private video
      photoEditOptions = privateEventPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "social_content":
      videoEditOptions = socialContentEditTypes;
      photoEditOptions = socialContentPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "brand_product":
      photoEditOptions = brandProductPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "people_teams":
      photoEditOptions = peopleTeamsPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "behind_scenes":
      photoEditOptions = behindScenesPhotoEditTypes;
      photoEditNote = "25 edited photos per hour";
      break;
    case "studio": // CRITICAL FIX: Adding Studio mapping
      videoEditOptions = corporateEventEditTypes;
      photoEditOptions = corporateEventPhotoEditTypes;
      photoEditNote = "Studio photo edits are calculated from the studio booking duration.";
      break;
    default:
      break;
  }

  return { videoEditOptions, photoEditOptions, photoEditNote };
};

const VideoEditSection = ({
  options,
  counts,
  isOpen,
  onToggle,
  onDecrease,
  onIncrease,
  title = "Video Edits",
}: {
  options: EditOption[];
  counts: Record<string, number>;
  isOpen: boolean;
  onToggle: () => void;
  onDecrease: (key: string, current: number) => void;
  onIncrease: (key: string, current: number) => void;
  title?: string;
}) => {
  if (options.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#101010] border border-white/10 overflow-hidden transition-all duration-300">
        <div className={` bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) ${isOpen ? "border-b border-white/20 rounded-b-2xl" : ""}`}>
          <button
            type="button"
            onClick={onToggle}
            className="w-full p-6 lg:px-7 lg:py-9 flex items-center justify-between text-left cursor-pointer  transition-colors"
          >
            <h3 className="text-lg lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-[#E8D1AB]">
              {title}
            </h3>
            <ChevronDown className={`w-5 h-5 lg:w-8 lg:h-8 text-white/80 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && (
          <div className="overflow-hidden">
            <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 space-y-6">
              {options.map((option) => {
                const count = counts[option.key] || 0;
                return (
                  <div key={option.key} className="flex items-center justify-between pt-6 border-b border-white/20 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <h4 className="text-base lg:text-xl font-medium text-white">{option.value}</h4>
                      {option.note && <p className="text-sm lg:text-lg font-light text-white/70 mt-0.5">{option.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 bg-[#E8D1AB] text-black px-3.5 py-1.5 rounded-full font-semibold text-sm">
                      <button type="button" onClick={(e) => { e.stopPropagation(); onDecrease(option.key, count); }} className="w-5 h-5 flex items-center justify-center gap-2 rounded-full hover:bg-black/10 transition-colors cursor-pointer">
                        <Minus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                      </button>
                      <span className="w-6 text-center text-base lg:text-xl font-medium">{String(count).padStart(2, "0")}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); onIncrease(option.key, count); }} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const EditsNeeded: React.FC<EditsNeededProps> = ({
  onContinue,
  onBack,
  initialConfig = { needsEdits: true, editedPhotosSets: 1 },
  baseFreePhotos = 100,
  photosPerSet = 25,
  durationLabel = "4 Hour Duration",
  contentType = [],
  shootType = "",
  email = "",
  bookingId,
  clientName,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [trackEarlyInterest, { isLoading }] = useTrackEarlyInterestMutation();
  const [needsEdits, setNeedsEdits] = useState<boolean>(initialConfig.needsEdits);
  const [editedPhotosSets, setEditedPhotosSets] = useState<number>(initialConfig.editedPhotosSets);
  const [videoEditTypes, setVideoEditTypes] = useState<string[]>([]);
  const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>("photo");

  const isEditingOnly = contentType.length === 1 && contentType.includes("editing");
  const resolvedEmail = email.trim() || user?.email?.trim() || "";
  const resolvedClientName = clientName || user?.name || resolvedEmail || "Guest";

  const { videoEditOptions: rawVideo, photoEditOptions: rawPhoto, photoEditNote: rawNote } = useMemo(
    () => getShootTypeEditOptions(shootType),
    [shootType]
  );

  // Apply Old UI Fallbacks
  const videoEditOptions = useMemo(() => {
    if ((contentType.includes("videographer") || isEditingOnly) && rawVideo.length === 0) {
      return socialContentEditTypes; // Fallback if no specific video options found
    }
    return rawVideo;
  }, [rawVideo, contentType, isEditingOnly]);

  const photoEditOptions = useMemo(() => {
    if ((contentType.includes("photographer") || isEditingOnly) && rawPhoto.length === 0) {
      return corporateEventPhotoEditTypes; // Fallback if no specific photo options found
    }
    return rawPhoto;
  }, [rawPhoto, contentType, isEditingOnly]);

  const photoEditNote = rawNote || "25 edited photos per hour";
  void photoEditNote;

  const hasVideoContent = contentType.includes("videographer");
  const hasPhotoContent = contentType.includes("photographer");
  const hasVideoEditOptions = videoEditOptions.length > 0;
  const hasPhotoEditOptions = photoEditOptions.length > 0;
  const includedPerHour = shootType ? getPhotoEditsIncludedPerHour(shootType) : baseFreePhotos;
  const noteLabel = shootType
    ? (shootType === "wedding" ? "50 edited photos per hour for weddings" : "25 edited photos per hour")
    : durationLabel;

  const photoEditCounts = useMemo(
    () => buildEditCounts(Array.from({ length: editedPhotosSets }, () => "edited_photos")),
    [editedPhotosSets]
  );
  void photoEditCounts;
  const videoEditCounts = useMemo(() => buildEditCounts(videoEditTypes), [videoEditTypes]);

  const photoEditTypes = useMemo(
    () => (needsEdits && editedPhotosSets > 0 ? Array.from({ length: editedPhotosSets }, () => "edited_photos") : []),
    [editedPhotosSets, needsEdits]
  );

  const totalAddedExtra = editedPhotosSets * photosPerSet;
  const totalPhotos = includedPerHour + totalAddedExtra;

  const photoEditSummaryItems = useMemo(
    () => [{ key: "edited_photos", label: "Edited Photos", count: editedPhotosSets }],
    [editedPhotosSets]
  );
  void photoEditSummaryItems;
  const videoEditSummaryItems = useMemo(
    () =>
      Object.entries(videoEditCounts).map(([key, count]) => ({
        key,
        count,
        label: videoEditOptions.find((option) => option.key === key)?.value || key,
      })),
    [videoEditCounts, videoEditOptions]
  );
  void videoEditSummaryItems;

  const totalVideoEditsSelected = videoEditTypes.length;

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => Math.max(0, prev - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedPhotosSets((prev) => prev + 1);
  };

  const updateVideoEditQuantity = (key: string, nextQty: number) => {
    const cleaned = videoEditTypes.filter((current) => current !== key);
    const next = nextQty > 0 ? [...cleaned, ...Array.from({ length: nextQty }, () => key)] : cleaned;
    setVideoEditTypes(next);
  };

  const handleNext = async () => {
    if (!resolvedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (needsEdits) {
      if (hasVideoContent && hasPhotoContent && !isEditingOnly) {
        if (
          hasVideoEditOptions &&
          hasPhotoEditOptions &&
          videoEditTypes.length === 0 &&
          editedPhotosSets === 0
        ) {
          toast.error("Please select at least one photo or video edit type");
          return;
        }
      } else {
        if (hasVideoContent && hasVideoEditOptions && videoEditTypes.length === 0) {
          toast.error("Please select at least one video edit type");
          return;
        }

        if (hasPhotoContent && hasPhotoEditOptions && editedPhotosSets === 0) {
          toast.error("Please select at least one photo edit type");
          return;
        }
      }
    }

    const earlyInterestPayload: {
      booking_id?: number;
      guest_email: string;
      user_id?: number;
      shoot_type?: string;
      client_name?: string;
      edits_needed?: boolean;
      video_edit_types?: string[];
      photo_edit_types?: string[];
      content_type?: string;
    } = {
      booking_id: bookingId,
      guest_email: resolvedEmail,
      user_id: user?.id,
      shoot_type: shootType,
      client_name: resolvedClientName,
      edits_needed: needsEdits,
      video_edit_types: needsEdits ? videoEditTypes : [],
      photo_edit_types: needsEdits ? photoEditTypes : [],
    };

    earlyInterestPayload.content_type = isEditingOnly ? "ai editing" : contentType.join(",");

    try {
      const response = await trackEarlyInterest(earlyInterestPayload).unwrap();
      const nextBookingId = response?.data?.booking_id;

      pushToDataLayer("generate_lead", {
        value: 0,
        currency: "USD",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step1",
        duration_on_page: performance.now() / 1000,
        user_id: user?.id || "Guest",
        user_type:
          isAuthenticated && user?.user_type_id !== undefined
            ? USER_TYPE[user.user_type_id]
            : "Guest",
        booking_id: nextBookingId,
        email: resolvedEmail,
      });

      pushToDataLayer("service_details_submitted_step1", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step1",
        duration_on_page: performance.now() / 1000,
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        user_id: user?.id || "Guest",
        user_type:
          isAuthenticated && user?.user_type_id !== undefined
            ? USER_TYPE[user.user_type_id]
            : "Guest",
        booking_id: nextBookingId,
        email: resolvedEmail,
        form_content_type: isEditingOnly ? "ai editing" : contentType.join(","),
        form_shoot_type: shootType,
        form_shoot_date_time: "",
        form_edits_needed: needsEdits ? "true" : "false",
        form_edit_types: needsEdits ? [...videoEditTypes, ...photoEditTypes].join(", ") : "none",
      });

      onContinue(
        {
          needsEdits,
          editedPhotosSets,
          videoEditTypes: needsEdits ? videoEditTypes : [],
          photoEditTypes: needsEdits ? photoEditTypes : [],
        },
        nextBookingId,
      );
    } catch (error) {
      console.error("Failed to save Step 1:", error);
      toast.error("Progress not saved, but you can continue.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP 03
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-1/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] text-white mb-3 tracking-tight">
            Need edits for your occasion?
          </h1>
          <p className="text-white/30 text-base md:text-xl font-light">
            Add professional editing to turn your raw footage into polished, share-ready content
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setNeedsEdits(true)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${
              needsEdits
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
            }`}
          >
            <span>Yes</span>
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${needsEdits ? "border-black bg-black" : "border-white/40 bg-transparent"}`}>
              {needsEdits && <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenEditPanel(null);
              setNeedsEdits(false);
              setVideoEditTypes([]);
              setEditedPhotosSets(0);
            }}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${
              !needsEdits
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
            }`}
          >
            <span>No</span>
            <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!needsEdits ? "border-black bg-black" : "border-white/40 bg-transparent"}`}>
              {!needsEdits && <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />}
            </div>
          </button>
        </div>

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

        {needsEdits && (
          <>
            {(hasVideoContent || isEditingOnly) && hasVideoEditOptions && (
              <VideoEditSection
                options={videoEditOptions}
                counts={videoEditCounts}
                isOpen={openEditPanel === "video"}
                onToggle={() => setOpenEditPanel((prev) => (prev === "video" ? null : "video"))}
                onDecrease={(key, current) => updateVideoEditQuantity(key, Math.max(0, current - 1))}
                onIncrease={(key, current) => updateVideoEditQuantity(key, current + 1)}
              />
            )}

            {(hasPhotoContent || isEditingOnly) && hasPhotoEditOptions && (
              <div className={(hasVideoContent || isEditingOnly) && hasVideoEditOptions ? "mt-6" : ""}>
                <CollapsibleEdit
                  title="Photo Edits"
                  itemLabel="Edited Photos"
                  setsCount={editedPhotosSets}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  baseFreeCount={includedPerHour}
                  perSetCount={photosPerSet}
                  durationLabel={noteLabel}
                  totalExtra={totalAddedExtra}
                  totalCount={totalPhotos}
                  showSummaryBadge={false}
                />
              </div>
            )}

            {((!hasVideoContent && !hasPhotoContent && !isEditingOnly) ||
              ((hasVideoContent || isEditingOnly) && !hasVideoEditOptions &&
                (hasPhotoContent || isEditingOnly) && !hasPhotoEditOptions)) && (
              <div className="rounded-2xl border border-white/10 bg-[#101010] p-5 text-white/60">
                No edit options available for this selection.
              </div>
            )}

            {needsEdits && (
              <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#E8D1AB]">
                  <span className="text-lg font-bold">✦</span>
                </div>
                <p className="text-sm lg:text-base font-semibold">
                  You&apos;ll Receive {hasPhotoContent ? totalPhotos : totalVideoEditsSelected} Items
                </p>
              </div>
            )}
          </>
        )}
      </div>

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
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          {isLoading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default EditsNeeded;
