"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  isDark?: boolean;
}

const ProfessionalInfoForm = ({ profile = {}, onChange, isDark = true }: ProfessionalInfoFormProps) => {
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

  const labelClasses = cn(
    "text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors",
    isDark ? "text-white/40" : "text-black/40"
  );

  const selectedRoleLabels = CREATOR_ROLE_OPTIONS
    .filter((role) => normalizedRoleValues.includes(role.value))
    .map((role) => role.label);

  const toggleRole = (roleId: string) => {
    const nextRoles = normalizedRoleValues.includes(roleId)
      ? normalizedRoleValues.filter((id) => id !== roleId)
      : [...normalizedRoleValues, roleId];

    handleFieldChange("primary_role", nextRoles);
  };

  const inputClasses = cn(
    "border rounded-xl transition-all outline-none text-sm md:text-base",
    "!shadow-none focus:!shadow-none hover:!shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
    isDark
      ? "bg-black !bg-black border-white/10 !border-white/10 text-white focus:border-[#E8D1AB]/50 focus:!border-[#E8D1AB]/50 placeholder:text-white/20"
      : "bg-neutral-50 !bg-neutral-50 border-black/10 !border-black/10 text-black focus:border-[#cbb38b]/50 focus:!border-[#cbb38b]/50 placeholder:text-black/30"
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 lg:gap-y-8 gap-x-12">

        {/* PRIMARY ROLE */}
        <div className="flex flex-col">
          <Label className={labelClasses}>Primary Role</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleOpen((open) => !open)}
              className={cn(inputClasses, "h-12 w-full px-4 text-left flex items-center justify-between")}
            >
              <span className={
                selectedRoleLabels.length
                  ? isDark ? "text-white" : "text-black"
                  : isDark ? "text-white/20" : "text-black/30"
              }>
                {selectedRoleLabels.length ? selectedRoleLabels.join(", ") : "Select profile type"}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform",
                  isDark ? "text-white/40" : "text-black/40",
                  isRoleOpen && "rotate-180"
                )}
              />
            </button>

            {isRoleOpen && (
              <div className={cn(
                "absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border p-1 shadow-2xl",
                isDark ? "bg-black border-white/10" : "bg-white border-black/10"
              )}>
                {CREATOR_ROLE_OPTIONS.map((role) => {
                  const selected = normalizedRoleValues.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors",
                        selected
                          ? "bg-[#E8D1AB]/15 text-[#E8D1AB]"
                          : isDark
                            ? "text-white/75 hover:bg-white/5 hover:text-white"
                            : "text-black/70 hover:bg-black/5 hover:text-black"
                      )}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        {selected && <Check size={15} />}
                      </span>
                      {role.label}
                    </button>
                  );
                })}
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
            <span className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors",
              isDark ? "text-white/40" : "text-black/40"
            )}>$</span>
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
      <div className="mt-4 lg:mt-8 flex flex-col">
        <Label className={labelClasses}>Bio / About</Label>
        <Textarea
          placeholder="Describe your expertise, equipment, and background..."
          className={cn(
            inputClasses,
            "min-h-[150px] py-4 resize-none",
            isDark ? "focus:!border-[#E8D1AB]/50" : "focus:!border-[#cbb38b]/50"
          )}
          value={profile.bio || ""}
          onChange={(e) => handleFieldChange("bio", e.target.value)}
        />
        <p className={cn(
          "mt-2 text-[11px] italic transition-colors",
          isDark ? "text-white/20" : "text-black/30"
        )}>
          This bio will be visible to potential clients on your public profile.
        </p>
      </div>
    </div>
  );
};

export default ProfessionalInfoForm;
