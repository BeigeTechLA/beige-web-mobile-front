"use client";

import React, { useState } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { LocationPicker } from "@/src/components/booking/v2/component/LocationPicker";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { Video, Camera, Scissors, Mic, User, Film, MonitorPlay } from "lucide-react";
import { Check } from "lucide-react";

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
  { id: "videographer", label: "Videographer", price: 275, icon: <Video size={18} /> },
  { id: "photographer", label: "Photographer", price: 275, icon: <Camera size={18} /> },
  { id: "editor", label: "Editor", price: 150, icon: <Scissors size={18} /> },
  { id: "sound_engineer", label: "Sound Engineer", price: 275, icon: <Mic size={18} /> },
  { id: "producer", label: "Producer", price: 220, icon: <User size={18} /> },
  { id: "director", label: "Director", price: 275, icon: <Film size={18} /> },
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
    
    updateData({ teamIncluded: summary });
  };

  const handleNext = () => {
    if (!data.location) {
      toast.error("Please select a location");
      return;
    }
    // Save extra team to data if needed, or process it here
    // For now we just proceed
    onNext();
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">More Details</h2>
        <p className="text-white/60">Let us understand your project better</p>
      </div>

      {/* Team Included */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-4">Team Included in Package</h3>
        <div className="bg-[#171717] rounded-[20px] p-6 border border-white/5">
            {includedRoles.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {includedRoles.map((role: any) => (
                        <div key={role.id} className="flex items-center justify-between p-4 bg-[#101010] rounded-[12px] border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#E8D1AB]">
                                    {role.icon}
                                </div>
                                <span className="text-lg font-medium text-white capitalize">{role.label}</span>
                            </div>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80">
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
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-white/90">Would you like to add more Team Members?</h3>
            <div className="flex gap-2">
                 <button
                    onClick={() => updateData({ addTeamMembers: true })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        data.addTeamMembers ? "bg-[#E8D1AB] text-black" : "bg-[#171717] text-white hover:bg-white/10"
                    }`}
                >
                    Yes
                </button>
                <button
                    onClick={() => {
                        updateData({ addTeamMembers: false });
                        setExtraTeam({});
                        updateData({ teamIncluded: [] });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        !data.addTeamMembers ? "bg-[#E8D1AB] text-black" : "bg-[#171717] text-white hover:bg-white/10"
                    }`}
                >
                    No
                </button>
            </div>
         </div>

         {data.addTeamMembers && (
             <div className="bg-[#171717] rounded-[20px] p-6 border border-white/5 animate-in slide-in-from-top-4">
                <div className="flex flex-col gap-4">
                    {TEAM_ROLES.map((role) => (
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
                    ))}
                </div>
             </div>
         )}
      </div>

      {/* Location */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">Shoot Location</h3>
        <LocationPicker
            value={data.location}
            onChange={(address, details) => updateData({ location: address, locationDetails: details })}
            placeholder="Search for a location"
            colors={darkThemeColors}
        />
      </div>

      {/* Details Form */}
      <div className="flex flex-col gap-6">
         <div>
            <label className="text-white/90 font-medium mb-3 block">Special Instructions / Additional Details</label>
            <textarea
                value={data.specialInstructions}
                onChange={(e) => updateData({ specialInstructions: e.target.value })}
                placeholder="Tell us more about your vision..."
                className="w-full h-[120px] bg-[#101010] border border-white/20 rounded-[16px] p-4 text-white placeholder:text-white/30 focus:border-[#E8D1AB] focus:outline-none resize-none"
            />
         </div>
         
         <div>
            <label className="text-white/90 font-medium mb-3 block">Reference Links (Optional)</label>
            <input
                type="text"
                value={data.referenceLinks}
                onChange={(e) => updateData({ referenceLinks: e.target.value })}
                placeholder="https://..."
                className="w-full h-[60px] bg-[#101010] border border-white/20 rounded-[16px] px-4 text-white placeholder:text-white/30 focus:border-[#E8D1AB] focus:outline-none"
            />
         </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-white/10">
        <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
        >
            Back
        </Button>
        <Button
            onClick={handleNext}
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] min-w-[140px] h-12 text-lg rounded-xl"
        >
            Continue
        </Button>
      </div>

    </div>
  );
};
