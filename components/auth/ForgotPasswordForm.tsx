"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/useAuth"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { forgotPassword, isForgotPasswordLoading } = useAuth()
  const router = useRouter()
  const [emailSent, setEmailSent] = React.useState(false)

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
      setEmailSent(true)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to send reset email. Please try again."
      toast.error(errorMessage)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#E8D1AB]/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#E8D1AB]" />
            </div>
          </div>
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white text-center">
            Check Your Email
          </h1>
          <p className="lg:text-lg text-white/60 text-center">
            We've sent password reset instructions to <span className="text-white font-medium">{form.watch("email")}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-white/60 text-center">
            Didn't receive the email? Check your spam folder or try again in a few moments.
          </p>

          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10 h-9 lg:h-[76px] text-sm md:text-xl"
          >
            Try Another Email
          </Button>

          <Link href="/login" className="block">
            <Button
              variant="ghost"
              className="w-full text-[#E8D1AB] hover:text-white hover:bg-transparent h-9 lg:h-12 text-sm md:text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/login" className="inline-flex items-center text-[#E8D1AB] hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
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
    </div>
  )
}
