"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SPECIALTIES = [
  "Corporate Photography",
  "Event Photography",
  "Product Photography",
  "Portrait/Headshots",
  "Real Estate",
  "Wedding Photography",
  "Commercial Videography",
  "Reel Shoot & Editing",
  "Brand Content Creation",
  "Documentary",
  "Social Media Content",
  "Music Videos",
  "Product Videography",
  "Automotive Shoot",
  "Professional Photography"
]

interface Step1SpecialtiesProps {
  onNext: (data: { specialties: string[] }) => void;
  initialData?: string[];
}

export function Step1Specialties({ onNext, initialData = [] }: Step1SpecialtiesProps) {
  const [selected, setSelected] = React.useState<string[]>(initialData)

  const toggleSpecialty = (specialty: string) => {
    if (selected.includes(specialty)) {
      setSelected(selected.filter(s => s !== specialty))
    } else {
      setSelected([...selected, specialty])
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Professional Specialties
        </h1>
        <p className="text-neutral-400">
          Select your area of expertise
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-neutral-400">
          What services do you offer?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={cn(
                "px-3 py-3 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200",
                selected.includes(specialty)
                  ? "bg-[#BEA784] text-black border-[#BEA784]"
                  : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
              )}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onNext({ specialties: selected })}
        className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium mt-8"
        disabled={selected.length === 0}
      >
        Continue
      </Button>
    </div>
  )
}

