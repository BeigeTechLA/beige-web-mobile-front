"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleOptions = [
  // { value: "1", label: "Director" },
  // { value: "2", label: "Camera Operator" },
  // { value: "3", label: "Audio Engineer" },
  // { value: "4", label: "Lighting Technician" },
  // { value: "5", label: "Video Editor" },
  // { value: "6", label: "Stream Engineer" },
  // { value: "7", label: "Production Manager" },
  // { value: "8", label: "Graphics Designer" },
  { value: "1", label: "Videographer" },
  { value: "2", label: "Photographers" },
  { value: "3", label: "Editor" },
];

interface ProfessionalInfoFormProps {
  profile?: any;
  onChange?: (updatedFields: any) => void;
  isDark?: boolean;
}

const ProfessionalInfoForm = ({ profile = {}, onChange, isDark = true }: ProfessionalInfoFormProps) => {

  const normalizedRoleValue = useMemo(() => {
    const rawRole = profile.primary_role;
    if (!rawRole) return "";

    try {
      if (typeof rawRole === 'string' && rawRole.startsWith('[')) {
        const parsed = JSON.parse(rawRole);
        return Array.isArray(parsed) ? String(parsed[0]) : String(rawRole);
      }
      return String(rawRole);
    } catch (e) {
      return String(rawRole);
    }
  }, [profile.primary_role]);

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange?.({
      [fieldName]: value,
    });
  };

  const labelClasses = cn(
    "text-[10px] font-bold uppercase tracking-widest mb-2 block transition-colors",
    isDark ? "text-white/40" : "text-black/40"
  );

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
          <Select
            value={normalizedRoleValue}
            onValueChange={(val) => handleFieldChange("primary_role", val)}
          >
            <SelectTrigger className={cn(inputClasses, "h-12")}>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent className={cn(
              "border transition-colors",
              isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/10 text-black"
            )}>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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