"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/hooks/useAuth"

const creatorSignupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type CreatorSignupFormValues = z.infer<typeof creatorSignupSchema>

interface Step0BasicInfoProps {
  onNext: (data: CreatorSignupFormValues) => void;
}

export function Step0BasicInfo({ onNext }: Step0BasicInfoProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const { register, isLoading } = useAuth()
  
  const form = useForm<CreatorSignupFormValues>({
    resolver: zodResolver(creatorSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const onSubmit = async (data: CreatorSignupFormValues) => {
    try {
      // In a real app, we might register here, or just pass data to next step
      // For now, let's assume we register first, then verify, then add details.
      // Or we collect all data and register at the end?
      // Screenshot "Finish Account Creation" is at Step 3.
      // But Verify Email is usually after basic info.
      
      // Let's assume we register here.
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "creator", // user_type_id: 2
        // phone: data.phone
      })
      
      onNext(data)
    } catch (error) {
      console.error("Registration failed", error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Join Our Creative Community
        </h1>
        <p className="text-neutral-400">
          Complete your application to become a Beige content producer.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            disabled={isLoading}
            {...form.register("name")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isLoading}
            {...form.register("email")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            disabled={isLoading}
            {...form.register("phone")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Create Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isLoading}
              {...form.register("password")}
              className="border-neutral-800 bg-neutral-900/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={isLoading}
            {...form.register("confirmPassword")}
            className="border-neutral-800 bg-neutral-900/50"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox 
            id="terms" 
            checked={form.watch("terms")}
            onCheckedChange={(checked) => form.setValue("terms", checked as boolean)}
            className="border-neutral-600 data-[state=checked]:bg-[#BEA784] data-[state=checked]:border-[#BEA784] mt-1"
          />
          <Label htmlFor="terms" className="text-neutral-400 leading-tight">
            By creating an account, you agree to our <Link href="/terms" className="text-white hover:underline">Terms of Services</Link> and <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>
          </Label>
        </div>
        {form.formState.errors.terms && (
            <p className="text-xs text-red-500">{form.formState.errors.terms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium mt-4"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </div>
  )
}

