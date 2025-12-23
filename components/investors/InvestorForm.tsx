"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitInvestorInterestMutation } from "@/lib/redux/features/investors/investorApi";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import { BlackDropdownSelect } from "../auth/BlackDropdown";

const investorSchema = z.object({
  firstName: z.string().min(2, "First Name is required"),
  lastName: z.string().min(2, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  country: z.string().min(2, "Country is required"),
  investmentRounds: z.string().min(1, "Please select an investment round"),
  investmentTiming: z.string().min(1, "Please select when you want to invest"),
  investmentAmount: z.string().min(1, "Please select an investment amount"),
});

type InvestorFormValues = z.infer<typeof investorSchema>;

interface InvestorFormProps {
  onSuccess: () => void;
}

const roundOptions = [
  { label: "pre-seed", value: "Pre-Seed round" },
  { label: "seed", value: "Seed round" },
  { label: "series-a", value: "Series A" },
  { label: "series-b", value: "Series B" },
];

const investmentTimingOptions = [
  { label: "immediately", value: "Immediately" },
  { label: "1-3-months", value: "1-3 Months" },
  { label: "3-6-months", value: "3-6 Months" },
  { label: "6-months-plus", value: "6+ Months" },
];

const budgetOptions = [
  { label: "$10k - $50k", value: "10k-50k" },
  { label: "$50k - $100k", value: "50k-100k" },
  { label: "$100k - $500k", value: "100k-500k" },
  { label: "$500k+", value: "500k-plus" },
];

export function InvestorForm({ onSuccess }: InvestorFormProps) {
  const [submitInvestorInterest, { isLoading: isSubmitting }] =
    useSubmitInvestorInterestMutation();

  const [selectedRounds, setSelectedRounds] = React.useState<string[]>([]);
  const [selectedTimings, setSelectedTimings] = React.useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = React.useState<string[]>([]);

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorSchema),
  });

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
      }).unwrap();

      toast.success(
        "Thank you for your interest! Our team will contact you soon."
      );
      onSuccess();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Submission failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <h3 className="mb-6 lg:mb-10 text-lg lg:text-[28px] font-medium text-white">
        Investor Information Form
      </h3>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-9">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative space-y-2">
            <Label htmlFor="firstName" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#171717] text-sm lg:text-base text-white/60">First Name</Label>
            <Input
              id="firstName"
              placeholder="First Name*"
              type="text"
              disabled={isSubmitting}
              {...form.register("firstName")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#171717] text-sm lg:text-lg"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-500">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>

          <div className="relative space-y-2">
            <Label htmlFor="lastName" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#171717] text-sm lg:text-base text-white/60">First Name</Label>
            <Input
              id="firstName"
              placeholder="Last Name*"
              type="text"
              disabled={isSubmitting}
              {...form.register("lastName")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#171717] text-sm lg:text-lg"
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-500">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="email" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#171717] text-sm lg:text-base text-white/60">Email</Label>
          <Input
            placeholder="Email ID*"
              type="text"
            disabled={isSubmitting}
            {...form.register("email")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#171717] text-sm lg:text-lg"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative space-y-2">
            <Label htmlFor="phoneNumber" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#171717] text-sm lg:text-base text-white/60">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="Phone Number*"
              type="tel"
              disabled={isSubmitting}
              {...form.register("phoneNumber")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#171717] text-sm lg:text-lg"
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-xs text-red-500">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="relative space-y-2">
            <Label htmlFor="country" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#171717] text-sm lg:text-base text-white/60">Country</Label>
            <Input
              id="country"
              placeholder="Country*"
              type="tel"
              disabled={isSubmitting}
              {...form.register("country")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#171717] text-sm lg:text-lg"
            />
            {form.formState.errors.country && (
              <p className="text-xs text-red-500">
                {form.formState.errors.country.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <MultiSelectDropdown
            id="investmentRounds"
            label="What rounds do you invest in?"
            value={selectedRounds}
            options={roundOptions}
            onChange={(newValue) => setSelectedRounds(newValue)}
          />
          {form.formState.errors.investmentRounds && (
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentRounds.message}
            </p>
          )}
        </div>

        {/* <div className="space-y-2">
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
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentRounds.message}
            </p>
          )}
        </div> */}

        <div>
          <MultiSelectDropdown
            id="investmentTiming"
            label="When are you looking to invest?"
            value={selectedTimings}
            options={investmentTimingOptions}
            onChange={(newValue) => setSelectedTimings(newValue)}
          />
          {form.formState.errors.investmentTiming && (
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentTiming.message}
            </p>
          )}
        </div>


        {/* <div className="space-y-2">
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
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentTiming.message}
            </p>
          )}
        </div> */}

        <div>
          <MultiSelectDropdown
            id="investmentAmount"
            label="Amount Interested to Invest?"
            value={selectedBudget}
            options={budgetOptions}
            onChange={(newValue) => setSelectedBudget(newValue)}
          />
          {form.formState.errors.investmentAmount && (
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentAmount.message}
            </p>
          )}
        </div>

        {/* <div className="space-y-2">
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
            <p className="text-xs text-red-500">
              {form.formState.errors.investmentAmount.message}
            </p>
          )}
        </div> */}

        <div className="pt-4">
          <Button
            type="submit"
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[72px] pl-4 lg:p-7 pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Submit"}

            {/* Right Dark Icon Box */}
            <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="32"
                viewBox="0 0 33 26"
                fill="none"
              >
                <path
                  d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z"
                  fill="#E8D1AB"
                />
              </svg>
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
}
