"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSubmitInvestorInterestMutation } from "@/lib/redux/features/investors/investorApi"

const investorSchema = z.object({
  firstName: z.string().min(2, "First Name is required"),
  lastName: z.string().min(2, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  country: z.string().min(2, "Country is required"),
  investmentRounds: z.string().min(1, "Please select an investment round"),
  investmentTiming: z.string().min(1, "Please select when you want to invest"),
  investmentAmount: z.string().min(1, "Please select an investment amount"),
})

type InvestorFormValues = z.infer<typeof investorSchema>

interface InvestorFormProps {
  onSuccess: () => void
}

export function InvestorForm({ onSuccess }: InvestorFormProps) {
  const [submitInvestorInterest, { isLoading: isSubmitting }] = useSubmitInvestorInterestMutation()
  
  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorSchema),
  })

  const onSubmit = async (data: InvestorFormValues) => {
    try {
      await submitInvestorInterest({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
        investmentRounds: data.investmentRounds,
        investmentTiming: data.investmentTiming,
        investmentAmount: data.investmentAmount,
      }).unwrap()
      
      toast.success("Thank you for your interest! Our team will contact you soon.")
      onSuccess()
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Submission failed. Please try again."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="w-full">
      <h3 className="mb-6 text-xl font-medium text-white">Investor Information Form</h3>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Input
              placeholder="First Name*"
              disabled={isSubmitting}
              {...form.register("firstName")}
              className="border-[#333333] bg-[#111111] placeholder:text-neutral-500"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Last Name*"
              disabled={isSubmitting}
              {...form.register("lastName")}
              className="border-[#333333] bg-[#111111] placeholder:text-neutral-500"
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Email ID*"
            type="email"
            disabled={isSubmitting}
            {...form.register("email")}
            className="border-[#333333] bg-[#111111] placeholder:text-neutral-500"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Input
              placeholder="Phone Number*"
              type="tel"
              disabled={isSubmitting}
              {...form.register("phoneNumber")}
              className="border-[#333333] bg-[#111111] placeholder:text-neutral-500"
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-xs text-red-500">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Country*"
              disabled={isSubmitting}
              {...form.register("country")}
              className="border-[#333333] bg-[#111111] placeholder:text-neutral-500"
            />
            {form.formState.errors.country && (
              <p className="text-xs text-red-500">{form.formState.errors.country.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Select 
            onValueChange={(value) => form.setValue("investmentRounds", value)} 
            defaultValue={form.getValues("investmentRounds")}
            disabled={isSubmitting}
          >
            <SelectTrigger className="border-[#333333] bg-[#111111] text-neutral-500 data-[state=open]:text-white data-[value]:text-white">
              <SelectValue placeholder="What rounds do you invest in?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-seed">Pre-Seed</SelectItem>
              <SelectItem value="seed">Seed</SelectItem>
              <SelectItem value="series-a">Series A</SelectItem>
              <SelectItem value="series-b">Series B+</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.investmentRounds && (
            <p className="text-xs text-red-500">{form.formState.errors.investmentRounds.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Select 
            onValueChange={(value) => form.setValue("investmentTiming", value)}
            defaultValue={form.getValues("investmentTiming")}
            disabled={isSubmitting}
          >
            <SelectTrigger className="border-[#333333] bg-[#111111] text-neutral-500 data-[state=open]:text-white data-[value]:text-white">
              <SelectValue placeholder="When are you looking to invest?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="1-3-months">1-3 Months</SelectItem>
              <SelectItem value="3-6-months">3-6 Months</SelectItem>
              <SelectItem value="6-months-plus">6+ Months</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.investmentTiming && (
            <p className="text-xs text-red-500">{form.formState.errors.investmentTiming.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Select 
            onValueChange={(value) => form.setValue("investmentAmount", value)}
            defaultValue={form.getValues("investmentAmount")}
            disabled={isSubmitting}
          >
            <SelectTrigger className="border-[#333333] bg-[#111111] text-neutral-500 data-[state=open]:text-white data-[value]:text-white">
              <SelectValue placeholder="Amount interested to Invest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10k-50k">$10k - $50k</SelectItem>
              <SelectItem value="50k-100k">$50k - $100k</SelectItem>
              <SelectItem value="100k-500k">$100k - $500k</SelectItem>
              <SelectItem value="500k-plus">$500k+</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.investmentAmount && (
            <p className="text-xs text-red-500">{form.formState.errors.investmentAmount.message}</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="group h-12 w-32 bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Submit"}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
