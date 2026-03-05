"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/useAuth"
import CheckEmail from "./CheckEmail"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { forgotPassword, isForgotPasswordLoading } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      const result = await forgotPassword(data.email)
      toast.success(result.message || "Password reset email sent!")
      setIsModalOpen(true)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to send reset email. Please try again."
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-8 lg:mt-30">
      <div className="space-y-2">
        {/* <Link href="/login" className="inline-flex items-center text-[#E8D1AB] hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link> */}
        <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
          Forgot Your Password?
        </h1>
        <p className="lg:text-lg text-white/60">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-9">
        <div className="relative space-y-2">
          <Label htmlFor="email" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">
            Email Address
          </Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            disabled={isForgotPasswordLoading}
            {...form.register("email")}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#E8D1AB] resize-none bg-[#101010] text-sm lg:text-base"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium"
          disabled={isForgotPasswordLoading}
        >
          {isForgotPasswordLoading ? "Sending..." : "Send Reset Link"}
        </Button>

        <p className="text-sm text-white/60 text-center">
          Remember your password?{" "}
          <Link href="/login" className="text-[#E8D1AB] hover:text-white underline">
            Sign in
          </Link>
        </p>
      </form>

      <CheckEmail
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={form.getValues("email")}
        onResend={() => onSubmit(form.getValues())}
      />
    </div>
  )
}
