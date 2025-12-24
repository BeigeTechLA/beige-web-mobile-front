"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"
import { useAuth } from "@/lib/hooks/useAuth"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""

  const {
    verifyEmail,
    resendOTP,
    isVerifyEmailLoading,
    isResendOTPLoading
  } = useAuth()

  const [isResending, setIsResending] = React.useState(false)

  const handleVerify = async (code: string) => {
    if (!email) {
      toast.error("Email not found. Please sign up again.")
      return
    }

    try {
      const result = await verifyEmail({
        email,
        verificationCode: code
      })

      toast.success(result.message || "Email verified successfully!")

      // If user was auto-logged in, redirect to affiliate dashboard
      // Otherwise redirect to login
      setTimeout(() => {
        if (result.token) {
          router.push('/affiliate/dashboard')
        } else {
          router.push('/login')
        }
      }, 1000)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Verification failed. Please try again."
      toast.error(errorMessage)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not found. Please sign up again.")
      return
    }

    setIsResending(true)
    try {
      const result = await resendOTP(email)
      toast.success(result.message || "Verification code sent!")
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to resend code. Please try again."

      // Check for rate limiting error
      if (error?.data?.remainingTime) {
        toast.error(`Please wait ${error.data.remainingTime} seconds before requesting another code.`)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <VerifyEmailStep
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      isVerifying={isVerifyEmailLoading}
      isResending={isResending || isResendOTPLoading}
    />
  )
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div className="text-white">Loading...</div>}>
      <VerifyEmailContent />
    </React.Suspense>
  )
}
