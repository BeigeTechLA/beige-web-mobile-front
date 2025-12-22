"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

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
}

export function Step2Experience({ onNext, isSubmitting, initialData }: Step2ExperienceProps) {
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
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Experience & Equipment
        </h1>
        <p className="text-neutral-400">
          Help us understand your professional background and capabilities.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <div className="relative">
            <select
              id="experience"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              disabled={isSubmitting}
              className="flex h-12 w-full appearance-none rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BEA784] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select years of experience</option>
              {EXPERIENCE_YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4">
          <Label>What equipment do you have?</Label>
          <div className="grid grid-cols-2 gap-3">
            {EQUIPMENT_LIST.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                disabled={isSubmitting}
                className={cn(
                  "px-3 py-3 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 text-left disabled:opacity-50",
                  equipment.includes(item)
                    ? "bg-[#BEA784] text-black border-[#BEA784]"
                    : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio (Optional)</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and your creative work..."
            disabled={isSubmitting}
            className="flex min-h-[100px] w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BEA784] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium mt-8"
        disabled={!yearsOfExperience || equipment.length === 0 || isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </Button>
    </div>
  )
}
