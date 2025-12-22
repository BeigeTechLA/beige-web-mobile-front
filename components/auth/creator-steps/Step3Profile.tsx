"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
}

export function Step3Profile({ onNext, isSubmitting, initialData }: Step3ProfileProps) {
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
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Online Profile & Rate
        </h1>
        <p className="text-neutral-400">
          Share your best work with us.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="portfolioLink">Portfolio Link (Optional)</Label>
          <Input
            id="portfolioLink"
            placeholder="https://yourportfolio.com"
            disabled={isSubmitting}
            {...form.register("portfolioLink")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.portfolioLink && (
            <p className="text-xs text-red-500">{form.formState.errors.portfolioLink.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Photography Hourly Rate (Optional)</Label>
          <Input
            id="hourlyRate"
            placeholder="$0.00"
            disabled={isSubmitting}
            {...form.register("hourlyRate")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.hourlyRate && (
            <p className="text-xs text-red-500">{form.formState.errors.hourlyRate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="combineRate">Combine Rate (Optional)</Label>
          <Input
            id="combineRate"
            placeholder="$0.00"
            disabled={isSubmitting}
            {...form.register("combineRate")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          <p className="text-xs text-neutral-500">
            Note: Don't worry, you will be able to add individual portfolio in the web app.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium mt-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Completing Profile..." : "Finish Account Creation"}
        </Button>
      </form>
    </div>
  )
}
