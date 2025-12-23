"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProgressBar } from "../ProgressBar"

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
  step?: number;
  totalSteps?: number;
}

export function Step1Specialties({ onNext, initialData = [], step, totalSteps }: Step1SpecialtiesProps) {
  const [selected, setSelected] = React.useState<string[]>(initialData)

  const toggleSpecialty = (specialty: string) => {
    if (selected.includes(specialty)) {
      setSelected(selected.filter(s => s !== specialty))
    } else {
      setSelected([...selected, specialty])
    }
  }

  return (
    <div className="space-y-4 lg:space-y-10">
      <div className="space-y-2">
        <div className="flex justify-beteween items-center">
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
            Professional Specialties
          </h1>
          {step && totalSteps && (
            <div className="text-base lg:text-2xl font-medium text-white/60 ml-auto">
              <span className="text-[#E8D1AB]">{step}</span>/{totalSteps}
            </div>
          )}
        </div>
        <p className="lg:text-lg text-white/60">
          Select your area of expertise
        </p>
      </div>
      <div className="mb-8">
       <ProgressBar currentStep={step} totalSteps={totalSteps} />
      </div>

      <div className="space-y-4">
        <p className="text-sm lg:text-lg font-medium text-white mb-3 lg:mb-5">
          What services do you offer?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={cn(
                "px-3 py-3 lg:py-6 rounded-lg border text-xs lg:text-sm font-medium transition-all duration-200",
                selected.includes(specialty)
                  ? "bg-[#1B1A1A] text-[#E8D1AB] border-[#E8D1AB]"
                  : "bg-transparent text-white/30 border-white/30 hover:border-[#E8D1AB] hover:text-[#E8D1AB]"
              )}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onNext({ specialties: selected })}
        className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-8 lg:mt-15"
        disabled={selected.length === 0}
      >
        Continue
      </Button>
    </div>
  )
}

