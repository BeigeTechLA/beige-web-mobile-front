"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import AddEquipments from "./addEquipment";
import AddSkills from "./addSkills";
import {
  ArrowLeft,
  CircleDollarSign,
  Loader2, // Added for loading state
} from "lucide-react";
import { roleOptions, skillOptions } from "@/app/data/staticData";
import { useRegisterCreatorStep2Mutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";

export default function Step2Form({ data, setData, nextStep, prevStep }) {
  // 1. Initialize the RTK Query Mutation
  const [registerStep2, { isLoading }] = useRegisterCreatorStep2Mutation();

  const inputClasses = "h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white placeholder:text-white/40 outline-none focus:border-[#E8D1AB] focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#101010] text-sm lg:text-base";
  const labelClasses = "absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none";
  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  const handleSubmit = async () => {
    // 2. Basic Validation
    if (!data.crew_member_id) {
      toast.error("Session Error", { description: "Crew ID missing. Please go back to step 1." });
      return;
    }
    if (!data.role || !data.yoe || !data.hourlyRate) {
      toast.error("Missing Fields", { description: "Please fill in Role, Experience and Hourly Rate." });
      return;
    }

    try {
      const payload = {
        crew_member_id: data.crew_member_id,
        primary_role: data.role,
        years_of_experience: Number(data.yoe),
        hourly_rate: Number(data.hourlyRate),
        bio: data.bio || "",
        // Convert skills/equipment objects to simple string arrays if necessary
        skills: (data.skills || []).map((s) => typeof s === "string" ? s : s.label || s.value),
        equipment_ownership: data.equipments || [],
      };

      // 4. Call API
      await registerStep2(payload).unwrap();

      toast.success("Step 2 Completed", { description: "Your creative profile has been updated." });
      
      // 5. Move to next step
      nextStep();
    } catch (err: any) {
      console.error("Step 2 API Error:", err);
      toast.error("Failed to save", { 
        description: err?.data?.message || "Something went wrong while saving your details." 
      });
    }
  };

  return (
    <div className="space-y-8 bg-[#101010] text-white pt-4 lg:p-2 relative z-10">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Role */}
          <div className="relative">
            <Label className={labelClasses}>Primary Role</Label>
            <Select
              value={data.role}
              onValueChange={(v) => setData({ ...data, role: v })}
            >
              <SelectTrigger className={`${inputClasses} text-left flex items-center`}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-[#E8D1AB] focus:text-black">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Years of Experience */}
          <div className="relative">
            <Label className={labelClasses}>Years of Experience</Label>
            <Input
              type="number"
              placeholder="e.g. 5"
              value={data.yoe}
              onChange={(e) => setData({ ...data, yoe: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Hourly Rate */}
        <div className="relative">
          <Label className={labelClasses}>Hourly Rate ($)</Label>
          <div className="relative">
            <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E8D1AB] w-5 h-5 lg:w-6 lg:h-6" />
            <Input
              type="number"
              placeholder="0.00"
              value={data.hourlyRate}
              onChange={(e) => setData({ ...data, hourlyRate: e.target.value })}
              className={`${inputClasses} pl-12 lg:pl-14`}
            />
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
              options={skillOptions}
              value={data.skills}
              onChange={(v) => setData({ ...data, skills: v })}
            />
          </div>
        </div>

        {/* Equipment Section */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Equipments Owned</h2>
            <p className="text-sm text-white/50">List the gear you own or use</p>
          </div>
          <div className="w-full">
            <AddEquipments
              // Pass IDs
              value={data.equipments || []}
              // Pass Names (for display and storage in data)
              names={data.equipmentNames || []}
              // Update both in the 'data' state
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
            className="w-14 h-14 lg:w-[76px] lg:h-[76px] flex items-center justify-center rounded-[12px] border border-white/30 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-14 lg:h-[76px] rounded-[12px] text-lg font-semibold transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </span>
            ) : (
              "Next Step"
            )}
          </Button>
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