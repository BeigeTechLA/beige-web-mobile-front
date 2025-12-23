"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { ProgressBar } from "../ProgressBar"
import { BlackDropdownSelect } from "../BlackDropdown"

const EQUIPMENT_LIST = [
  "DSLR Mirrorless Camera",
  "4K Video Camera",
  "Professional Lighting Kit",
  "Drone (Part 107 Licensed)",
  "Stabilizers/Gimbals",
  "Audio Recording Equipment",
  "Multiple Lenses",
  "Backup Equipment"
]

const EXPERIENCE_YEARS = [
  "Less than 1 year",
  "1-2 years",
  "3-5 years",
  "5-10 years",
  "10+ years"
]

interface Step2ExperienceProps {
  onNext: (data: {
    equipment: string[];
    yearsOfExperience: string;
    bio?: string;
  }) => void;
  isSubmitting?: boolean;
  initialData?: { yearsOfExperience?: string; equipment?: string[]; bio?: string };
  step?: number;
  totalSteps?: number;
}

export function Step2Experience({ onNext, isSubmitting, initialData, step, totalSteps }: Step2ExperienceProps) {
  const [yearsOfExperience, setYearsOfExperience] = React.useState(initialData?.yearsOfExperience || "")
  const [equipment, setEquipment] = React.useState<string[]>(initialData?.equipment || [])
  const [bio, setBio] = React.useState(initialData?.bio || "")

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter(i => i !== item))
    } else {
      setEquipment([...equipment, item])
    }
  }

  const handleSubmit = () => {
    onNext({
      equipment,
      yearsOfExperience,
      bio: bio || undefined
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-beteween items-center">
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
            Experience & Equipment
          </h1>
          {step && totalSteps && (
            <div className="text-base lg:text-2xl font-medium text-white/60 ml-auto">
              <span className="text-[#E8D1AB]">{step}</span>/{totalSteps}
            </div>
          )}
        </div>
        <p className="text-neutral-400">
          Help us understand your professional background and capabilities.
        </p>
      </div>
      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
      </div>

      <div className="space-y-6">
        <BlackDropdownSelect
          id="experience"
          label="Years of Experience"
          value={yearsOfExperience}
          onChange={(val) => setYearsOfExperience(val)}
          options={EXPERIENCE_YEARS}
        />

        <div className="space-y-4">
          <p className="text-sm lg:text-lg font-medium text-white mb-3 lg:mb-5">What equipment do you have?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EQUIPMENT_LIST.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                disabled={isSubmitting}
                className={cn(
                  "px-3 py-3 lg:py-6 rounded-lg border text-xs lg:text-sm font-medium transition-all duration-200",
                  equipment.includes(item)
                    ? "bg-[#1B1A1A] text-[#E8D1AB] border-[#E8D1AB]"
                    : "bg-transparent text-white/30 border-white/30 hover:border-[#E8D1AB] hover:text-[#E8D1AB]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-10 space-y-2 ">
          <Label htmlFor="bio" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10">Bio (Optional)</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and your creative work..."
            disabled={isSubmitting}
            className="flex h-24 lg:h-[148px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none transition-all duration-200 hover:border-[#E8D1AB]/60 focus:border-[#E8D1AB] disabled:opacity-50 resize-none bg-[#101010] text-sm lg:text-base"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-8 lg:mt-15"
        disabled={!yearsOfExperience || equipment.length === 0 || isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </Button>
    </div>
  )
}
