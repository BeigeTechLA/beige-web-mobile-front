"use client";

import React, { useState, useRef, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { Video, Camera, Scissors, Plus, Trash2, ExternalLink, Globe, Image as ImageIcon, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { isValidUrl } from "@/lib/utils";
import { useUpdateBookingCrewMutation } from "@/lib/redux/features/sales/salesApi";
import { pushToDataLayer } from "@/lib/gtm";
import { useAuth } from "@/lib/hooks/useAuth";
interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: (isBrowsingStudios?: boolean) => void;
  onBack: () => void;
}

const TEAM_ROLES = [
  { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> }, // Changed from 275 to 250
  { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> }, // Changed from 275 to 250
  // { id: "editor", label: "Editor", price: 150, icon: <Scissors size={28} /> },
  // { id: "sound_engineer", label: "Sound Engineer", price: 275, icon: <Mic size={28} /> },
  // { id: "producer", label: "Producer", price: 220, icon: <User size={28} /> },
  // { id: "director", label: "Director", price: 275, icon: <Film size={28} /> },
];

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

interface FormFields {
  additional_creative: boolean,
  shoot_location: string,
  additional_details: string,
  supporting_url: string[],
  videographyCount?: string
  photographyCount?: string
}

export const V3Step2MoreDetails: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const { user, isAuthenticated } = useAuth()

  console.log(data);
  // Local state for team members if not stored in main data yet
  // In a real app, we might want to store this in data.teamIncluded or similar structure
  // For now, let's derive initial state from data.contentType

  // We need a way to store extra team members. 
  // Let's assume data.teamIncluded stores the *extra* members or we need a new field.
  // The prompt says "Team Included in Package" comes from Step 1.

  const teamIncludedRef = useRef<HTMLDivElement>(null);
  const extraTeamRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);

  const isEditingOnly = data.contentType.length === 1 && data.contentType.includes("editing");
  const isStudio = data.shootType === "studio";

  const links = data.referenceLinks || [];

  const [newLink, setNewLink] = useState("");
  const [showAllPreviews, setShowAllPreviews] = useState(true);

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    updateData({ referenceLinks: newLinks });
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;

    // Normalize if needed but standard is to keep what user put and validate
    const normalized = normalizeUrl(newLink);
    if (!isValidUrl(normalized)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (links.includes(normalized)) {
      toast.error("This link is already added");
      return;
    }

    updateData({ referenceLinks: [...links, normalized] });
    setNewLink("");
  };

  const removeLinkField = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    updateData({ referenceLinks: newLinks });
  };
  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp|svg|avif)(\?.*)?$/i.test(url);
  };

  const shouldShowPreview = (url: string) => {
    return Boolean(getPreviewUrl(url)) || isImageUrl(normalizeUrl(url)) || isValidUrl(normalizeUrl(url));
  };

  const normalizeUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return "";
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const getPreviewUrl = (url: string) => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || !isValidUrl(normalizedUrl)) return null;

    // Pinterest
    if (normalizedUrl.includes("pinterest.com") || normalizedUrl.includes("pin.it")) {
      // Pinterest doesn't embed well in iframes due to CSP, but we can try the widget or just show a nice placeholder
      return null;
    }

    const youtubeMatch = normalizedUrl.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/|\/live\/))([\w-]{11})/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
    }

    const vimeoMatch = normalizedUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    const driveMatch =
      normalizedUrl.match(/\/d\/([^/]+)/) ||
      normalizedUrl.match(/[?&]id=([^&]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return null;
  };

  const includedRoles = data.contentType.map((type) => {
    if (type === "editing") {
      return {
        id: "editing",
        label: "Editing",
        icon: <Scissors size={28} />,
        count: 1,
      };
    }

    const role = TEAM_ROLES.find((r) => r.id === type);
    return role ? { ...role, count: 1 } : null;
  }).filter(Boolean);

  // const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});
  const [extraTeam, setExtraTeam] = useState<Record<string, number>>(data.extraRoleSelections || {});
  const [errors, setErrors] = useState<string[]>([]);

  const [updateBookingCrew] = useUpdateBookingCrewMutation();

  const handleExtraTeamChange = (id: string, delta: number) => {
    const nextExtra = { ...extraTeam };
    const current = nextExtra[id] || 0;
    const next = Math.max(0, current + delta);
    nextExtra[id] = next;
    setExtraTeam(nextExtra);

    // Also save this as string description to data so it's not lost
    // Ideally we should use a proper structure, but string array is what we have in types for now
    const summary = Object.entries(nextExtra)
      .filter(([_, count]) => count > 0)
      .map(([roleId, count]) => `${TEAM_ROLES.find(r => r.id === roleId)?.label || roleId} x${count}`);

    // Calculate total crew count (base + extra)
    const baseCount = includedRoles.length;
    const extraCount = Object.values(nextExtra).reduce((a, b) => a + b, 0);

    updateData({
      extraRoleSelections: nextExtra,
      teamIncluded: summary,
      crewCount: baseCount + extraCount
    });
  };

  // add GA event on initial load
  useEffect(() => {
    const formFields = {
      content_type: data.contentType.join(","),
      shoot_type: data.shootType,
      shoot_date_time: `${data.startDate} to ${data.endDate}`,
      edits_needed: data.editsNeeded,
      photo_edit_types: data.photoEditTypes.join(", "),
      video_edit_types: data.videoEditTypes.join(", "),
    };

    pushToDataLayer("customize_details_viewed_step2", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_step2",
      duration_on_page: performance.now() / 1000,
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : data.email,
      email: isAuthenticated ? user?.email : "Unknown",
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      booking_id: data?.bookingId,
      booking_form_fields: formFields
    });
  }, [])

  const handleRemoveAllExtra = () => {
    updateData({
      addTeamMembers: false,
      extraRoleSelections: {}, // Clear persisted counts
      teamIncluded: []
    });
    setExtraTeam({}); // Clear local UI state
    scrollToRef(locationRef);
  };

  // Ensure crewCount is accurate on mount/updates even if no extra team added
  useEffect(() => {
    const baseCount = includedRoles.length;
    const extraCount = Object.values(extraTeam).reduce((a, b) => a + b, 0);
    const total = baseCount + extraCount;

    if (data.crewCount !== total) {
      updateData({ crewCount: total });
    }
  }, [includedRoles.length, extraTeam, data.crewCount, updateData]);

  // Automatically clear the location error once data.location is truthy
  useEffect(() => {
    if ((data.location || isStudio) && errors.includes("locationError")) {
      setErrors(prev => prev.filter(err => err !== "locationError"));
    }
  }, [data.location, isStudio, errors]);
  // const handleNext = async () => {
  //   if (!data.location) {
  //     toast.error("Please select a location");
  //     return;
  //   }

  //   if (!data.bookingId) {
  //     toast.error("Booking reference missing. Please restart.");
  //     return;
  //   }

  //   const crewRoles: Record<string, number> = {};

  //   // base crew
  //   includedRoles.forEach((role: any) => {
  //     crewRoles[role.id] = 1;
  //   });

  //   // extra crew
  //   Object.entries(extraTeam).forEach(([roleId, count]) => {
  //     if (count > 0) {
  //       crewRoles[roleId] = (crewRoles[roleId] || 0) + count;
  //     }
  //   });

  //   try {
  //     const response = await updateBookingCrew({
  //       booking_id: data.bookingId,
  //       crew_roles: crewRoles,
  //     }).unwrap();

  //     const serverCrewRoles = response.data.crew_roles;
  //     const vCount = serverCrewRoles.videographer || 0;
  //     const pCount = serverCrewRoles.photographer || 0;

  //     localStorage.setItem("required_videographers", vCount.toString());
  //     localStorage.setItem("required_photographers", pCount.toString());

  //     updateData({
  //       roleCounts: serverCrewRoles,
  //       videographyCount: vCount,
  //       photographyCount: pCount,
  //       crewCount: vCount + pCount // Total crew
  //     });

  //     onNext();
  //   } catch (error) {
  //     console.error("Crew update error:", error);
  //     toast.error("Failed to save crew details");
  //   }
  // };

  // Inside V3Step2MoreDetails.tsx

  const handleNext = async () => {
    if (!isEditingOnly && !isStudio && !data.location) {
      toast.error("Please select a location");
      setErrors((prev) => (prev.includes("locationError") ? prev : [...prev, "locationError"]));
      return;
    }

    if (!data.bookingId) {
      toast.error("Booking reference missing. Please restart.");
      return;
    }

    const crewRoles: Record<string, number> = {};

    // 1. Calculate Base Crew (Step 1 choices)
    includedRoles.forEach((role: any) => {
      const apiRoleId = role.id === "editing" ? "editor" : role.id;
      crewRoles[apiRoleId] = 1;
    });

    // 2. Add Extra Crew (Step 2 choices)
    Object.entries(extraTeam).forEach(([roleId, count]) => {
      if (count > 0) {
        crewRoles[roleId] = (crewRoles[roleId] || 0) + count;
      }
    });

    if (isEditingOnly) {
      crewRoles.editor = 1;
    }

    try {
      // 3. CALL API WITH ALL DETAILS
      const payload: {
        booking_id: number;
        crew_roles: Record<string, number>;
        location?: string;
        location_latitude?: number;
        location_longitude?: number;
        description?: string;
        reference_links?: string[];
      } = {
        booking_id: data.bookingId,
        crew_roles: crewRoles,
        description: data.specialInstructions,
        reference_links: data.referenceLinks.filter(l => l.trim() !== ""),
      };

      if (!isEditingOnly && data.location) {
        payload.location = data.location;
        payload.location_latitude =
          data.locationDetails?.coordinates?.lat ??
          data.locationDetails?.lat ??
          data.locationDetails?.center?.[1] ??
          undefined;
        payload.location_longitude =
          data.locationDetails?.coordinates?.lng ??
          data.locationDetails?.lng ??
          data.locationDetails?.center?.[0] ??
          undefined;
      }

      const response = await updateBookingCrew(payload).unwrap();

      const serverCrewRoles = response.data.crew_roles;
      const vCount = serverCrewRoles.videographer || 0;
      const pCount = serverCrewRoles.photographer || 0;
      const editorCount = serverCrewRoles.editor || 0;
      const totalCrewCount = Object.values(serverCrewRoles || {}).reduce(
        (sum: number, count: any) => sum + Number(count || 0),
        0
      );

      // Update local context for Step 3/4
      updateData({
        roleCounts: serverCrewRoles,
        videographyCount: vCount,
        photographyCount: pCount,
        crewCount: totalCrewCount || editorCount || vCount + pCount
      });

      const formFields: FormFields = {
        additional_creative: data.addTeamMembers,
        shoot_location: data.location || "",
        additional_details: data.specialInstructions,
        supporting_url: data.referenceLinks
      }

      if (data.addTeamMembers) {
        formFields.videographyCount = vCount
        formFields.photographyCount = pCount
      }

      // add GA event on click of "Continue" in the first step
      pushToDataLayer("customize_details_submitted_step2", {
        type: "Action Tracking",
        page_name: "Book-a-shoot Page",
        location_in_website: "book_a_shoot_step2",
        duration_on_page: performance.now() / 1000,
        user_id: isAuthenticated ? user?.id : "Unknown",
        user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
        email: isAuthenticated ? user?.email : data.email,
        phone: isAuthenticated ? user?.phone_number : "Unknown",
        booking_id: data.bookingId,
        booking_form_fields: formFields,
      });

      onNext();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save project details");
    }
  };

  const availableRolesToAdd = TEAM_ROLES.filter(role => {
    if (data.contentType.includes(role.id)) return true;
    return false;
  });

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref && ref.current) {
        const navOffset = 100; // Matches your navbar height
        const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleBrowseStudios = async () => {
    // Update state so it's saved for back-navigation later
    updateData({ isBrowsingStudios: true });

    // Pass true directly to ensure the parent acts on it immediately
    onNext(true);
  }

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">More Details</h2>
        <p className="text-white/60">Help us understand your project better</p>
      </div>

      {/* Team Included */}
      <div ref={teamIncludedRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-4">Team Included in Package</h3>
        <div>
          {includedRoles.length > 0 ? (
            <div className={`grid grid-cols-1 ${includedRoles.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
              {includedRoles.map((role: any) => (
                <div key={role.id} className="flex items-center justify-between p-4 bg-[#101010] rounded-[12px] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-15 lg:h-15 rounded-[12px] flex items-center justify-center bg-[#171717] text-[#E8D1AB]">
                      {role.icon}
                    </div>
                    <span className="text-lg font-medium text-[#E8D1AB] capitalize">{role.label} x1</span>
                  </div>
                  <div className="px-3 py-1 lg:py-2 lg:px-6 bg-[#211F1C] rounded-full text-xs lg:text-sm text-[#E8D1AB] border border-[#E8D1AB] whitespace-nowrap">
                    Included
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 italic">No specific team members selected in previous step.</p>
          )}
        </div>
      </div>
      {/* Add More Team Members */}
      {!isEditingOnly && (
        <div ref={extraTeamRef}>
          <div className="flex flex-col gap-3 lg:gap-6">
            <h3 className="text-base lg:text-xl font-medium text-white">Would you like to add additional creatives?</h3>
            <div className="flex gap-2 lg:gap-6">
              <button
                onClick={() => updateData({ addTeamMembers: true })}
                // className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${data.addTeamMembers ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black" : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${data.addTeamMembers ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  Yes
                </span>
                <div
                  className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${data.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}
                >
                  {data.addTeamMembers && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  { handleRemoveAllExtra }
                  updateData({ addTeamMembers: false });
                  setExtraTeam({});
                  updateData({ teamIncluded: [] });
                  scrollToRef(locationRef);
                }}
                // className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!data.addTeamMembers ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black" : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!data.addTeamMembers ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  No
                </span>
                <div
                  className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${!data.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}
                >
                  {!data.addTeamMembers && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {data.addTeamMembers && (
            <div className="bg-[#171717] rounded-[20px] p-3 lg:p-6 border border-white/5 animate-in slide-in-from-top-4 mt-4 md:mt-6">
              <div className="flex flex-col gap-4">
                {availableRolesToAdd.length > 0 ? (
                  availableRolesToAdd.map((role) => (
                    <div key={role.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                          {role.icon}
                        </div>
                        <div>
                          <div className="text-lg font-medium text-white">{role.label}</div>
                          {/* <div className="text-sm text-[#E8D1AB]">${role.price.toFixed(2)}</div> */}
                        </div>
                      </div>
                      <QuantityControl
                        value={extraTeam[role.id] || 0}
                        onIncrease={() => handleExtraTeamChange(role.id, 1)}
                        onDecrease={() => handleExtraTeamChange(role.id, -1)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 italic">No eligible roles to add based on your selection.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {!isEditingOnly && !isStudio && (
        <div ref={locationRef} className="pt-6 lg:pt-15 border-t border-white/10">
          <h3 className="text-xl font-medium text-white/90 mb-6">Shoot Location</h3>
          <LocationPicker
            value={data.location}
            onChange={(address, details) => {
              updateData({ location: address, locationDetails: details });
              if (address) scrollToRef(detailsRef); // Scroll to details once location set
            }}
            placeholder="Search for a location"
            colors={darkThemeColors}
            // error
            hasError={errors.includes("locationError")}
            disabled={false}
          />
          {
            data.contentType.includes("studio") && (
              <div className="mt-3 lg:mt-6 bg-[#211F1C] px-4 lg:px-7 py-3.5 rounded-lg lg:rounded-xl text-[#E8D1AB] w-fit ">
                <p className="text-xs lg:text-sm">
                  Note : Studios are available for LA only
                </p>
              </div>
            )
          }
        </div>
      )}

      {/* Details Form */}
      <div ref={detailsRef} className="py-6 lg:py-15 border-t border-white/10 flex flex-col gap-4 lg:gap-10">
        <div className="relative">
          <label
            htmlFor="specialInstructions"
            className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10"
          >
            Additional Details
          </label>
          <textarea
            id="specialInstructions"
            value={data.specialInstructions}
            onChange={(e) => updateData({ specialInstructions: e.target.value })}
            placeholder="Tell us more about your vision..."
            className="w-full h-[120px] lg:h-[160px] xl:h-[300px] rounded-[12px] border border-white/30 p-4 pt-6 text-white outline-none focus:border-white/60 transition-all resize-none bg-[#101010] text-sm lg:text-base"
          />
        </div>

        <div className="flex flex-col gap-6 pt-6">
          <div className="relative flex flex-col gap-4">
            <label
              htmlFor="referenceLinks-input"
              className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10"
            >
              Supporting Links
            </label>

            <div className="flex gap-2 items-center">
              <input
                id="referenceLinks-input"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                placeholder="Share any links to inspo or reference content."
                className="w-full rounded-[12px] border border-white/30 px-4 py-4 text-white outline-none focus:border-white/60 transition-all bg-[#101010] text-sm lg:text-base"
              />
              <button
                onClick={handleAddLink}
                className="h-[56px] lg:h-[60px] px-6 bg-[#E8D1AB] text-black rounded-[12px] font-medium hover:bg-[#dcb98a] transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>Add</span>
              </button>
            </div>

            {links.length > 0 && (
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex flex-col">
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-widest">Added References</h4>
                  <p className="text-[10px] text-white/40">{links.length} link{links.length > 1 ? 's' : ''} total</p>
                </div>
                <div className="flex items-center gap-3">
                  {links.length > 1 && (
                    <button
                      onClick={() => updateData({ referenceLinks: [] })}
                      className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-wider font-medium"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowAllPreviews(!showAllPreviews)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-medium ${showAllPreviews ? "bg-white/10 border-white/20 text-white" : "bg-[#E8D1AB] border-transparent text-black"}`}
                  >
                    {showAllPreviews ? <Eye size={14} /> : <Eye size={14} />}
                    {showAllPreviews ? "Hide Previews" : "Show All Previews"}
                  </button>
                </div>
              </div>
            )}

            {showAllPreviews && links.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {links.map((link, index) => {
                  const normalized = normalizeUrl(link);
                  const previewUrl = getPreviewUrl(link);
                  const isImage = isImageUrl(normalized);

                  return (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#171717] h-[220px] flex flex-col">
                      <div className="absolute top-2 right-2 z-20 flex gap-1 transform translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <a
                          href={normalized}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/70 hover:text-white border border-white/10"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => removeLinkField(index)}
                          className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/70 hover:text-red-400 border border-white/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex-1 w-full relative overflow-hidden bg-black/20">
                        {previewUrl ? (
                          <iframe
                            src={previewUrl}
                            className="w-full h-full border-0"
                            title={`Preview ${index}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                            loading="lazy"
                          />
                        ) : isImage ? (
                          <img
                            src={normalized}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/20 group-hover:text-white/40 transition-colors">
                            <div className="relative">
                              <Globe size={48} strokeWidth={1} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${new URL(normalized).hostname}&sz=32`}
                                  alt=""
                                  className="w-6 h-6 rounded-sm opacity-80"
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                              </div>
                            </div>

                          </div>
                        )}

                        {/* Fallback for broken images */}
                        {isImage && (
                          <div className="hidden absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                            <ImageIcon size={48} strokeWidth={1} />
                            <span className="text-[9px] uppercase tracking-[0.2em] font-medium">Image Reference</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-[#101010] border-t border-white/5 group-hover:bg-[#141414] transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          {previewUrl ? <Video size={12} className="text-[#E8D1AB]" /> : isImage ? <ImageIcon size={12} className="text-[#E8D1AB]" /> : <Globe size={12} className="text-[#E8D1AB]" />}
                          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider truncate">
                            {previewUrl ? "Video" : isImage ? "Image" : "Website"}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 truncate max-w-full font-light">
                          {normalized.replace(/^https?:\/\/(www\.)?/, '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Need a Studio: conditionally shown when Studios is not selected in step 1 */}
      {(!data.contentType.includes("studio")) && (
        <div ref={studioRef} className="bg-[#101010] border border-[#FFFFFF4D] rounded-xl p-3 lg:p-5 flex justify-between items-center">
          <div className="flex gap-4 items-center ">
            <div className="bg-[#171717] rounded-xl p-4.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none">
                <path d="M10.5 38.5V7C10.5 6.07174 10.8687 5.1815 11.5251 4.52513C12.1815 3.86875 13.0717 3.5 14 3.5H28C28.9283 3.5 29.8185 3.86875 30.4749 4.52513C31.1313 5.1815 31.5 6.07174 31.5 7V38.5H10.5Z" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.5 21H7C6.07174 21 5.1815 21.3687 4.52513 22.0251C3.86875 22.6815 3.5 23.5717 3.5 24.5V35C3.5 35.9283 3.86875 36.8185 4.52513 37.4749C5.1815 38.1313 6.07174 38.5 7 38.5H10.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M31.5 15.75H35C35.9283 15.75 36.8185 16.1187 37.4749 16.7751C38.1312 17.4315 38.5 18.3217 38.5 19.25V35C38.5 35.9283 38.1312 36.8185 37.4749 37.4749C36.8185 38.1313 35.9283 38.5 35 38.5H31.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 10.5H24.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 17.5H24.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 24.5H24.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 31.5H24.5" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg lg:text-xl text-white font-medium">
                Need a Studio?
              </p>
              <p className="text-[#A9A9A9] text-xs lg:text-sm">
                Add a professional studio to your booking and get 15% off
              </p>
            </div>
          </div>
          <Button
            onClick={handleBrowseStudios}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] flex items-center justify-center text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
          >
            Browse Studios
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          // disabled={!data.shootType || !data.editType}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
