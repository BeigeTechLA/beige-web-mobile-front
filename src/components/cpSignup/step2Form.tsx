"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import AddEquipments from "./addEquipment";
import AddSkills from "./addSkills";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Loader2,
  Check, // Added Check icon for selected states
} from "lucide-react";
import { roleOptions, videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";
import { useRegisterCreatorStep2Mutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";

export default function Step2Form({ data, setData, nextStep, prevStep }) {
  // 1. Initialize the RTK Query Mutation
  const [registerStep2, { isLoading }] = useRegisterCreatorStep2Mutation();

  const inputClasses = "h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white placeholder:text-white/40 outline-none focus:border-[#E8D1AB] focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#101010] text-sm lg:text-base";
  const labelClasses = "absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none";
  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  const toggleRole = (roleValue: string) => {
    const currentRoles = data.roles || [];
    if (currentRoles.includes(roleValue)) {
      setData({ ...data, roles: currentRoles.filter((r) => r !== roleValue) });
    } else {
      setData({ ...data, roles: [...currentRoles, roleValue] });
    }
  };

 const getSkillOptionsByRole = () => {
  const roles = data.roles || [];
  const listsToMerge = [];

  if (roles.includes("9")) {
    listsToMerge.push(videographerSkills);
  }
  if (roles.includes("10")) {
    listsToMerge.push(photographerSkills);
  }
  if (roles.includes("11")) {
    listsToMerge.push(editorSkills);
  }

  if (listsToMerge.length === 0) return [];
  
  return mergeUniqueSkills(...listsToMerge);
};

  const handleSubmit = async () => {
    if (!data.crew_member_id) {
      toast.error("Session Error", { description: "Crew ID missing. Please go back to step 1." });
      return;
    }
    if (!data.roles || data.roles.length === 0 || !data.yoe || !data.hourlyRate) {
      toast.error("Missing Fields", { description: "Please select at least one Role, Experience and Hourly Rate." });
      return;
    }

    try {
      const payload = {
        crew_member_id: data.crew_member_id,
        primary_role: data.roles, 
        years_of_experience: Number(data.yoe),
        hourly_rate: Number(data.hourlyRate),
        bio: data.bio || "",
        skills: (data.skills || []).map((s) => typeof s === "string" ? s : s.label || s.value),
        equipment_ownership: data.equipments || [],
      };

      await registerStep2(payload).unwrap();

      toast.success("Step 2 Completed", { description: "Your creative profile has been updated." });
      
      nextStep();
    } catch (err: any) {
      console.error("Step 2 API Error:", err);
      toast.error("Failed to save", { 
        description: err?.data?.message || "Something went wrong while saving your details." 
      });
    }
  };

   const mergeUniqueSkills = (...lists) => {
    const map = new Map();
    lists.flat().forEach((skill) => {
      if (skill && !map.has(skill.value)) {
        map.set(skill.value, skill);
      }
    });
    return Array.from(map.values());
  };

  return (
    <div className="space-y-8 bg-[#101010] text-white pt-4 lg:p-2 relative z-10">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>
        
        {/* Primary Roles Multi-Select Grid */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Select Your Role</h2>
            <p className="text-sm text-white/50">Select all roles that apply to you</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {roleOptions.map((opt) => {
              const isSelected = data.roles?.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRole(opt.value)}
                  className={`px-4 py-2 lg:px-6 lg:py-3 rounded-full border text-sm lg:text-base transition-all flex items-center gap-2 ${
                    isSelected 
                      ? "bg-[#E8D1AB] border-[#E8D1AB] text-black font-semibold shadow-[0_0_15px_rgba(232,209,171,0.3)]" 
                      : "bg-transparent border-white/20 text-white hover:border-white/50"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Years of Experience */}
          <div className="relative">
            <Label className={labelClasses}>Years of Experience</Label>
           <Input
  type="number"
  min="0" // Prevents negative via UI arrows
  placeholder="e.g. 5"
  value={data.yoe}
  onWheel={(e) => e.currentTarget.blur()} // Prevents scroll changes
  onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} // Blocks negative sign and exponents
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
      setData({ ...data, yoe: value });
    }
  }}
  className={inputClasses}
/>
          </div>

          {/* Hourly Rate */}
          <div className="relative">
            <Label className={labelClasses}>Desired Rates ($)</Label>
            <div className="relative">
              <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E8D1AB] w-5 h-5 lg:w-6 lg:h-6" />
              <Input
  type="number"
  min="0" // Prevents negative via UI arrows
  placeholder="0.00"
  value={data.hourlyRate}
  onWheel={(e) => e.currentTarget.blur()} // Prevents scroll changes
  onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} // Blocks negative sign and exponents
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
      setData({ ...data, hourlyRate: value });
    }
  }}
  className={`${inputClasses} pl-12 lg:pl-14`}
/>
            </div>
          </div>
        </div>

        {/* Bio / About */}
        <div className="relative">
          <Label className={labelClasses}>Bio / About</Label>
          <Textarea
            placeholder="Brief description of expertise and background..."
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            className={`${inputClasses} !bg-[#101010] !border-white/30 !text-white placeholder:!text-white/40 !pt-6 min-h-[140px] resize-none focus:!border-[#E8D1AB]`}
          />
        </div>

        {/* Skills Section */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Skills</h2>
            <p className="text-sm text-white/50">Select your core competencies</p>
          </div>
          <div className="w-full">
            <AddSkills
  options={getSkillOptionsByRole()}
  value={data.skills}
  onChange={(v) => setData({ ...data, skills: v })}
/>

          </div>
        </div>

        {/* Equipment Section */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">What Equipment Do You Own?</h2>
            <p className="text-sm text-white/50">List the gear you own or use</p>
          </div>
          <div className="w-full">
            <AddEquipments
              value={data.equipments || []}
              names={data.equipmentNames || []}
              onChange={(ids, names) => 
                setData({ 
                  ...data, 
                  equipments: ids, 
                  equipmentNames: names 
                })
              }
            />
          </div>
        </div>

        {/* Navigation Buttons */}
       <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={isLoading}
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/20 bg-[#101010] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] bg-[#E8D1AB] hover:bg-[#DCD1BE] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-6 h-6 text-black" />
            ) : (
              <ArrowRight className="w-6 h-6 text-black" />
            )}
          </button>
        </div>

        {/* Footer Link */}
        <div className="flex items-center justify-center gap-2 text-sm text-white/40 pt-4">
          <div className="h-[1px] flex-grow bg-white/10"></div>
          <span>Already have an account?</span>
          <Link href="/login" className="text-[#E8D1AB] hover:underline">
            Log in
          </Link>
          <div className="h-[1px] flex-grow bg-white/10"></div>
        </div>
      </form>
    </div>
  );
}