"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProgressBar } from "../ProgressBar"

const step3Schema = z.object({
  portfolioLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  hourlyRate: z.string().optional(),
  combineRate: z.string().optional(),
})

type Step3Values = z.infer<typeof step3Schema>

interface Step3ProfileProps {
  onNext: (data: {
    portfolioLink?: string;
    hourlyRate?: number;
    availability?: Record<string, unknown>;
    socialLinks?: Record<string, string>;
  }) => void;
  isSubmitting?: boolean;
  initialData?: Step3Values;
  step?: number;
  totalSteps?: number;
}

export function Step3Profile({ onNext, isSubmitting, initialData, step, totalSteps }: Step3ProfileProps) {
  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: initialData || {
      portfolioLink: "",
      hourlyRate: "",
      combineRate: "",
    },
  })

  const onSubmit = (data: Step3Values) => {
    // Parse hourly rate to number if provided
    const hourlyRate = data.hourlyRate ? parseFloat(data.hourlyRate.replace(/[^0-9.]/g, '')) : undefined

    onNext({
      portfolioLink: data.portfolioLink || undefined,
      hourlyRate: hourlyRate && !isNaN(hourlyRate) ? hourlyRate : undefined,
    })
  }

  return (
    <div className="space-y-4 lg:space-y-10">
      <div className="space-y-2">
        <div className="flex justify-beteween items-center">
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
            Online Profile & Rate
          </h1>
          {step && totalSteps && (
            <div className="text-base lg:text-2xl font-medium text-white/60 ml-auto">
              <span className="text-[#E8D1AB]">{step}</span>/{totalSteps}
            </div>
          )}
        </div>
        <p className="lg:text-lg text-white/60">
          Share your best work with us.
        </p>
      </div>
      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-8">
        <div className="relative space-y-2">
          <Label htmlFor="portfolioLink" className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none">Portfolio Link (Optional)</Label>
          <Input
            id="portfolioLink"
            placeholder="https://yourportfolio.com"
            disabled={isSubmitting}
            {...form.register("portfolioLink")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.portfolioLink && (
            <p className="text-xs text-red-500">{form.formState.errors.portfolioLink.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="hourlyRate" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10">Photography Hourly Rate (Optional)</Label>
          <Input
            id="hourlyRate"
            placeholder="$0.00"
            disabled={isSubmitting}
            {...form.register("hourlyRate")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.hourlyRate && (
            <p className="text-xs text-red-500">{form.formState.errors.hourlyRate.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="combineRate" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60 z-10">Combine Rate (Optional)</Label>
          <Input
            id="combineRate"
            placeholder="$0.00"
            disabled={isSubmitting}
            {...form.register("combineRate")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
          />
        </div>

          <p className="text-xs lg:text-sm text-white mt-5 lg:mt-12">
            Note: Don't worry, you will be able to add individual portfolio in the web app.
          </p>

        <Button
          type="submit"
          className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-8 lg:mt-15"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Completing Profile..." : "Finish Account Creation"}
        </Button>
      </form>
    </div>
  )
}
