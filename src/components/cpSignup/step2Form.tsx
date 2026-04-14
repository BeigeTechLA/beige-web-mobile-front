"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddEquipments from "./addEquipment";
import AddSkills from "./addSkills";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Loader2,
  Check,
} from "lucide-react";
import { roleOptions, videographerSkills, photographerSkills, editorSkills } from "@/app/data/staticData";
import { useRegisterCreatorStep2Mutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";
import { pushToDataLayer } from "@/lib/gtm";

export default function Step2Form({ data, setData, nextStep, prevStep }) {
  const [registerStep2, { isLoading }] = useRegisterCreatorStep2Mutation();

  const inputClasses = "h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white placeholder:text-white/40 outline-none focus:border-[#E8D1AB] focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#101010] text-sm lg:text-base";

  const noSpinners = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const labelClasses = "absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none";
  const sectionClasses = "rounded-[12px] border border-white/30 bg-[#101010] p-6 space-y-4";

  const toggleRole = (roleValue: string) => {
    const currentRoles = data.roles || [];
    if (currentRoles.includes(roleValue)) {
      setData((prev) => ({ ...prev, roles: currentRoles.filter((r) => r !== roleValue) }))
    } else {
      setData((prev) => ({ ...prev, roles: [...currentRoles, roleValue] }));
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

  const getSkillOptionsByRole = () => {
    const roles = data.roles || [];
    const listsToMerge = [];
    if (roles.includes("1")) listsToMerge.push(videographerSkills);
    if (roles.includes("2")) listsToMerge.push(photographerSkills);
    if (roles.includes("3")) listsToMerge.push(editorSkills);
    if (listsToMerge.length === 0) return [];
    return mergeUniqueSkills(...listsToMerge);
  };

  const handleSubmit = async () => {
    if (!data.crew_member_id) {
      toast.error("Session Error", { description: "Crew ID missing. Please go back to step 1." });
      return;
    }

    if (!data.roles || data.roles.length === 0) {
      toast.error("Required Field", { description: "Please select at least one Role." });
      return;
    }
    if (!data.yoe || data.yoe === "") {
      toast.error("Required Field", { description: "Please enter your Years of Experience." });
      return;
    }
    if (!data.hourlyRate || data.hourlyRate === "") {
      toast.error("Required Field", { description: "Please enter your Desired Hourly Rate." });
      return;
    }
    if (!data.skills || data.skills.length === 0) {
      toast.error("Required Field", { description: "Please select at least one Skill." });
      return;
    }
    if (!data.equipments || data.equipments.length === 0) {
      toast.error("Required Field", { description: "Please select at least one Equipment." });
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

      // --- GA4 SIGNUP TRACKING ---
      pushToDataLayer("sign_up_step2_submit", {
        cp_id: data.crew_member_id,
        user_type: "Creative Partner",
        page_name: "Creative Partner Signup Page: Step 2",
        location_in_website: "creative_partner_signup_step2",
        duration_on_page: performance.now() / 1000,
        email: data.email,
        phone: data.phone || null,
        cp_signup_form: {
          primary_role: data.roles,
          years_of_experience: Number(data.yoe),
          hourly_rate: Number(data.hourlyRate),
          bio: data.bio || "",
          skills: (data.skills || []).map((s) => typeof s === "string" ? s : s.label || s.value),
          equipment_ownership: data.equipments || []
        }
      });
      // ---------------------------


      toast.success("Step 2 Completed");
      nextStep();
    } catch (err: any) {
      toast.error("Failed to save", {
        description: err?.data?.message || "Something went wrong."
      });
    }
  };

  const handleBioChange = (e) => {
    setData((prev) => ({ ...prev, bio: e.target.value }))
  }

  const cleanBio = () => {
    setData((prev) => {
      let value = prev.bio
      value = value.replace(/ {3,}/g, "  ")
      value = value.replace(/\n{3,}/g, "\n\n")
      value = value.trim()
      return { ...prev, bio: value }
    })
  }

  return (
    <div className="space-y-8 bg-[#101010] text-white pt-4 lg:p-2 relative z-10">
      <form className="space-y-6 lg:space-y-9 lg:mt-14" onSubmit={(e) => e.preventDefault()}>

        {/* Roles (Required) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Select Your Role *</h2>
            <p className="text-sm text-white/50">Select at least one role</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {roleOptions.map((opt) => {
              const isSelected = data.roles?.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRole(opt.value)}
                  className={`px-4 py-2 lg:px-6 lg:py-3 rounded-full border text-sm lg:text-base transition-all flex items-center gap-2 ${isSelected
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
          {/* Experience (Required) */}
          <div className="relative">
            <Label className={labelClasses}>Years of Experience *</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 5"
              value={data.yoe}
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || Number(value) >= 0) {
                  setData((prev) => ({ ...prev, yoe: value }));
                }
              }}
              // Added noSpinners here
              className={`${inputClasses} ${noSpinners}`}
            />
          </div>

          {/* Rate (Required) */}
          <div className="relative">
            <Label className={labelClasses}>Hourly Desired Rates ($) *</Label>
            <div className="relative">
              <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E8D1AB] w-5 h-5 lg:w-6 lg:h-6" />
              <Input
                type="number"
                min="0"
                placeholder="0.00"
                value={data.hourlyRate}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 0) {
                    setData((prev) => ({ ...prev, hourlyRate: value }));
                  }
                }}
                // Added noSpinners here
                className={`${inputClasses} pl-12 lg:pl-14 ${noSpinners}`}
              />
            </div>
          </div>
        </div>

        {/* Bio (Optional) */}
        <div className="relative">
          <Label className={labelClasses}>Bio / About (Optional)</Label>
          <Textarea
            placeholder="Brief description of expertise..."
            value={data.bio}
            maxLength={400}
            onChange={handleBioChange}
            onBlur={cleanBio}
            autoCorrect="off"
            autoCapitalize="none"
            className={`${inputClasses} !bg-[#101010] !border-white/30 !text-white placeholder:!text-white/40 !pt-6 min-h-[140px] resize-none focus:!border-[#E8D1AB]`}
          />
        </div>

        {/* Skills (Required) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">Skills *</h2>
            <p className="text-sm text-white/50">Select at least one competency</p>
          </div>
          <div className="w-full">
            <AddSkills
              options={getSkillOptionsByRole()}
              value={data.skills}
              onChange={(v) => setData((prev) => ({ ...prev, skills: v }))}
            />
          </div>
        </div>

        {/* Equipment (Optional) */}
        <div className={sectionClasses}>
          <div>
            <h2 className="text-base font-semibold text-white">What Equipment Do You Own? *</h2>
            <p className="text-sm text-white/50">List the gear you own</p>
          </div>
          <div className="w-full">
            <AddEquipments
              value={data.equipments || []}
              names={data.equipmentNames || []}
              onChange={(ids, names) =>
                setData((prev) => ({ ...prev, equipments: ids, equipmentNames: names }))
              }
            />
          </div>
        </div>

        {/* Navigation */}
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
            className={`px-4 lg:px-10 h-14 lg:h-[76px] flex-1 flex items-center justify-center rounded-[12px] bg-[#E8D1AB] hover:bg-[#DCD1BE] transition-all disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-6 h-6 text-black" />
            ) : (
              // <ArrowRight className="w-6 h-6 text-black" />
              <span className="lg:text-[20px] font-medium text-black">Next</span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center mt-4 text-[#DDD] font-bold gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M0 0.25C9.89091 0.25 151.455 0.25 221 0.25" stroke="url(#paint0_linear_1780_5629)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5629" x1="0" y1="0.75" x2="221" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
          <div className="shrink-0 gap-1 flex">
            <span>Already have an account?</span> <Link className="font-normal" href="/login">Log in</Link>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="221" height="1" viewBox="0 0 221 1" fill="none">
            <path d="M221 0.25C211.109 0.25 69.5455 0.25 6.19888e-06 0.25" stroke="url(#paint0_linear_1780_5630)" strokeWidth="0.5" />
            <defs>
              <linearGradient id="paint0_linear_1780_5630" x1="221" y1="0.75" x2="0" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </form>
    </div>
  );
}