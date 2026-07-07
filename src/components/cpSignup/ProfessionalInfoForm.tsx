"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Ensure this import matches your project structure
import { Check, ChevronDown } from "lucide-react";
import { CREATOR_ROLE_OPTIONS, normalizeCreatorRoleIds } from "@/lib/creatorRoles";

interface ProfessionalInfoFormProps {
  profile?: {
    primary_role?: unknown;
    years_of_experience?: string | number | null;
    hourly_rate?: string | number | null;
    bio?: string | null;
  };
  onChange?: (updatedFields: Record<string, unknown>) => void;
}

const ProfessionalInfoForm = ({ profile = {}, onChange }: ProfessionalInfoFormProps) => {
  const [isRoleOpen, setIsRoleOpen] = React.useState(false);
  
  const normalizedRoleValues = useMemo(
    () => normalizeCreatorRoleIds(profile.primary_role),
    [profile.primary_role]
  );

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange?.({
      [fieldName]: value,
    });
  };

  const labelClasses = "text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block";
  const selectedRoleLabels = CREATOR_ROLE_OPTIONS
    .filter((role) => normalizedRoleValues.includes(role.value))
    .map((role) => role.label);

  const toggleRole = (roleId: string) => {
    const nextRoles = normalizedRoleValues.includes(roleId)
      ? normalizedRoleValues.filter((id) => id !== roleId)
      : [...normalizedRoleValues, roleId];

    handleFieldChange("primary_role", nextRoles);
  };
  
  /**
   * inputClasses:
   * 1. !shadow-none: Forcefully removes the golden shadow from your UI component.
   * 2. !bg-black: Forcefully overrides the dark-brown background.
   * 3. !border-white/10: Forcefully overrides the golden border.
   */
  const inputClasses = cn(
    "bg-black !bg-black",
    "border border-white/10 !border-white/10",
    "text-white",
    "rounded-xl",
    "focus:border-[#E8D1AB]/50 focus:!border-[#E8D1AB]/50",
    "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
    "transition-all placeholder:text-white/20 outline-none",
    "!shadow-none focus:!shadow-none hover:!shadow-none", // KILL GOLDEN SHADOW
    "dark:!bg-black dark:!border-white/10" // OVERRIDE DARK MODE HEX COLS
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        
        {/* PRIMARY ROLE */}
        <div className="flex flex-col">
          <Label className={labelClasses}>Primary Role</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleOpen((open) => !open)}
              className={cn(inputClasses, "h-12 w-full px-4 text-left flex items-center justify-between")}
            >
              <span className={selectedRoleLabels.length ? "text-white" : "text-white/20"}>
                {selectedRoleLabels.length ? selectedRoleLabels.join(", ") : "Select profile type"}
              </span>
              <ChevronDown
                size={16}
                className={cn("text-white/40 transition-transform", isRoleOpen && "rotate-180")}
              />
            </button>

            {isRoleOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-white/10 bg-black p-1 shadow-2xl">
              {CREATOR_ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors",
                    normalizedRoleValues.includes(role.value)
                      ? "bg-[#E8D1AB]/15 text-[#E8D1AB]"
                      : "text-white/75 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    {normalizedRoleValues.includes(role.value) && <Check size={15} />}
                  </span>
                  {role.label}
                </button>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="flex flex-col">
          <Label className={labelClasses}>Years of Experience</Label>
          <Input
            type="number"
            placeholder="e.g. 5"
            className={cn(inputClasses, "h-12")}
            value={profile.years_of_experience ?? ""}
            onChange={(e) => handleFieldChange("years_of_experience", e.target.value)}
          />
        </div>

        {/* HOURLY RATE */}
        <div className="flex flex-col">
          <Label className={labelClasses}>Hourly Rate ($)</Label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
             <Input
                placeholder="0.00"
                className={cn(inputClasses, "h-12 pl-8")}
                value={profile.hourly_rate ?? ""}
                onChange={(e) => handleFieldChange("hourly_rate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* BIO */}
      <div className="mt-8 flex flex-col">
        <Label className={labelClasses}>Bio / About</Label>
        <Textarea
          placeholder="Describe your expertise, equipment, and background..."
          className={cn(
            inputClasses,
            "min-h-[150px] py-4 resize-none",
            "focus:!border-[#E8D1AB]/50"
          )}
          value={profile.bio || ""}
          onChange={(e) => handleFieldChange("bio", e.target.value)}
        />
        <p className="mt-2 text-[11px] text-white/20 italic">
          This bio will be visible to potential clients on your public profile.
        </p>
      </div>
    </div>
  );
};

export default ProfessionalInfoForm;
