"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/useAuth"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  resetToken: string
}

export function ResetPasswordForm({ resetToken }: ResetPasswordFormProps) {
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [resetSuccess, setResetSuccess] = React.useState(false)
  const { resetPassword, isResetPasswordLoading } = useAuth()
  const router = useRouter()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      const result = await resetPassword(resetToken, data.newPassword, data.confirmPassword)
      toast.success(result.message || "Password reset successfully!")
      setResetSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to reset password. Please try again."
      toast.error(errorMessage)
    }
  }

  if (resetSuccess) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#E8D1AB]/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#E8D1AB]" />
            </div>
          </div>
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white text-center">
            Password Reset Successful!
          </h1>
          <p className="lg:text-lg text-white/60 text-center">
            Your password has been updated. Redirecting you to login...
          </p>
        </div>

        <Link href="/login">
          <Button
            className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium"
          >
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
          Reset Your Password
        </h1>
        <p className="lg:text-lg text-white/60">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-9">
        <div className="relative space-y-2">
          <Label htmlFor="newPassword" className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              disabled={isResetPasswordLoading}
              {...form.register("newPassword")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-[#E8D1AB] bg-[#101010] text-sm lg:text-base"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              )}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="confirmPassword" className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              disabled={isResetPasswordLoading}
              {...form.register("confirmPassword")}
              className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-[#E8D1AB] bg-[#101010] text-sm lg:text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 lg:h-6 lg:w-6" />
              ) : (
                <Eye className="h-4 w-4 lg:h-6 lg:w-6" />
              )}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium"
          disabled={isResetPasswordLoading}
        >
          {isResetPasswordLoading ? "Resetting..." : "Reset Password"}
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
