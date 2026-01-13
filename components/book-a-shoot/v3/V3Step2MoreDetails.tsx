"use client";

import React, { useState } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { LocationPicker } from "@/src/components/booking/v2/component/LocationPicker";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { Video, Camera, Scissors, Mic, User, Film, MonitorPlay } from "lucide-react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

const darkThemeColors = {
  inputBg: "#101010",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#ffffff99",
  labelText: "#ffffff99",
  primaryText: "#FFFFFF",
  secondaryText: "#ffffff99",
  paperBg: "#1A1A1A",
  divider: "#ffffff1a",
  accent: "#E8D1AB",
  accentHover: "#dcb98a",
  buttonPrimaryText: "#1A1A1A",
  buttonSecondaryText: "#fff",
  buttonSecondaryBg: "#ffffff4d",
  buttonSecondaryBgHover: "#ffffff4d",
};

const TEAM_ROLES = [
  { id: "videographer", label: "Videographer", price: 275, icon: <Video size={28} /> },
  { id: "photographer", label: "Photographer", price: 275, icon: <Camera size={28} /> },
  // { id: "editor", label: "Editor", price: 150, icon: <Scissors size={28} /> },
  // { id: "sound_engineer", label: "Sound Engineer", price: 275, icon: <Mic size={28} /> },
  // { id: "producer", label: "Producer", price: 220, icon: <User size={28} /> },
  // { id: "director", label: "Director", price: 275, icon: <Film size={28} /> },
];

export const V3Step2MoreDetails: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  // Local state for team members if not stored in main data yet
  // In a real app, we might want to store this in data.teamIncluded or similar structure
  // For now, let's derive initial state from data.contentType

  // We need a way to store extra team members. 
  // Let's assume data.teamIncluded stores the *extra* members or we need a new field.
  // The prompt says "Team Included in Package" comes from Step 1.

  const includedRoles = data.contentType.filter(t => t !== 'editing').map(t => {
    const role = TEAM_ROLES.find(r => r.id === t);
    return role ? { ...role, count: 1 } : null;
  }).filter(Boolean);

  const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});

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
      teamIncluded: summary,
      crewCount: baseCount + extraCount 
    });
  };

  // Ensure crewCount is accurate on mount/updates even if no extra team added
  React.useEffect(() => {
    const baseCount = includedRoles.length;
    const extraCount = Object.values(extraTeam).reduce((a, b) => a + b, 0);
    const total = baseCount + extraCount;
    
    if (data.crewCount !== total) {
      updateData({ crewCount: total });
    }
  }, [includedRoles.length, extraTeam, data.crewCount, updateData]);

  const handleNext = () => {
    if (!data.location) {
      toast.error("Please select a location");
      return;
    }

    // Calculate total crew count: base crew + extra crew
    const baseCrewCount = includedRoles.length;
    const extraCrewCount = Object.values(extraTeam).reduce((sum, count) => sum + count, 0);
    const totalCrewCount = baseCrewCount + extraCrewCount;

    // Save crew count to data
    updateData({ crewCount: totalCrewCount });

    onNext();
  };

  const availableRolesToAdd = TEAM_ROLES.filter(role => {
    if (data.contentType.includes(role.id)) return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">More Details</h2>
        <p className="text-white/60">Help us understand your project better</p>
      </div>

      {/* Team Included */}
      <div className="pt-8 lg:pt-15 border-t border-white/10">
        <h3 className="text-xl font-medium text-white/90 mb-4">Team Included in Package</h3>
        <div className="">
          {includedRoles.length > 0 ? (
            <div className="flex flex-col gap-4">
              {includedRoles.map((role: any) => (
                <div key={role.id} className="flex items-center justify-between p-4 bg-[#101010] rounded-[12px] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-15 lg:h-15 rounded-[12px] flex items-center justify-center bg-[#171717] flex items-center justify-center text-[#E8D1AB]">
                      {role.icon}
                    </div>
                    <span className="text-lg font-medium text-[#E8D1AB] capitalize">{role.label} x1</span>
                  </div>
                  <div className="px-3 py-1 lg:py-3 lg:px-8 bg-[#211F1C] rounded-full text-sm text-[#E8D1AB] border border-[#E8D1AB]">
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
      <div>
        <div className="flex flex-col gap-3 lg:gap-6 mb-6">
          <h3 className="text-xl font-medium text-white">Would you like to add more Team Members?</h3>
          <div className="flex gap-2 lg:gap-6">
            <button
              onClick={() => updateData({ addTeamMembers: true })}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${data.addTeamMembers ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black" : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
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
                updateData({ addTeamMembers: false });
                setExtraTeam({});
                updateData({ teamIncluded: [] });
              }}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!data.addTeamMembers ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black" : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
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
          <div className="bg-[#171717] rounded-[20px] p-6 border border-white/5 animate-in slide-in-from-top-4">
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
                        <div className="text-sm text-[#E8D1AB]">${role.price.toFixed(2)}</div>
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

      {/* Location */}
      <div className="pt-8 lg:pt-15 border-t border-white/10">
        {/* <h3 className="text-xl font-medium text-white/90 mb-6">Shoot Location</h3> */}
        <LocationPicker
          value={data.location}
          onChange={(address, details) => updateData({ location: address, locationDetails: details })}
          placeholder="Search for a location"
          colors={darkThemeColors}
        />
      </div>

      {/* Details Form */}
      <div className="pt-8 lg:pt-15 border-t border-white/10 flex flex-col gap-10 mt-4">
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

        <div className="relative">
          <label
            htmlFor="referenceLinks"
            className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10"
          >
            Supporting Links
          </label>
          <input
            id="referenceLinks"
            value={data.referenceLinks}
            onChange={(e) => updateData({ referenceLinks: e.target.value })}
            placeholder="Share any links to inspo or reference content."
            className="w-full rounded-[12px] border border-white/30 p-4 pt-6 text-white outline-none focus:border-white/60 transition-all resize-none bg-[#101010] text-sm lg:text-base"
          />
        </div>

      </div>

      {/* Navigation */}
      <div className="flex gap-3 lg:gap-6 items-center pt-8 pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          // disabled={!data.shootType || !data.editType}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
