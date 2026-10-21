"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"
import { useAuth } from "@/lib/hooks/useAuth"
import { formatTime } from "@/lib/utils"
import { getDashboardPathForUser } from "@/lib/auth-routing"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""
  const returnTo = React.useMemo(() => {
    const value = searchParams.get("returnTo")?.trim() || ""
    return value.startsWith("/") ? value : ""
  }, [searchParams])
  const bookingEmail = React.useMemo(() => {
    const value = searchParams.get("bookingEmail")?.trim() || ""
    return value.toLowerCase()
  }, [searchParams])

  const {
    verifyEmail,
    resendOTP,
    isVerifyEmailLoading,
    isResendOTPLoading
  } = useAuth()

  const [isResending, setIsResending] = React.useState(false)
  
  // --- Timer State (60 seconds) ---
  const [timer, setTimer] = React.useState(() => {
    if (searchParams.get('source') !== 'login') return 60
    const cooldown = Number(searchParams.get('cooldown'))
    return Number.isFinite(cooldown) ? Math.min(60, Math.max(0, Math.ceil(cooldown))) : 0
  })

  // --- Countdown Logic ---
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

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

      const normalizedVerifiedEmail = String(email).trim().toLowerCase()
      if (returnTo && (!bookingEmail || bookingEmail === normalizedVerifiedEmail)) {
        router.replace(returnTo)
      } else if (result.token) {
        router.replace(getDashboardPathForUser(result.user || null))
      } else {
        router.replace('/login')
      }
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

    // Prevent clicking if timer is still running
    if (timer > 0) return

    setIsResending(true)
    try {
      const result = await resendOTP(email)
      toast.success(result.message || "Verification code sent!")
      // Reset timer to 60 seconds on success
      setTimer(60)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to resend code. Please try again."

      // Check for rate limiting error
      if (error?.data?.remainingTime) {
        toast.error(`Please wait ${formatTime(error.data.remainingTime)} before requesting another code.`);
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
      timer={timer} // Passing timer to UI
    />
  )
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div className="text-white min-h-screen flex items-center justify-center bg-[#101010]">Loading...</div>}>
      <VerifyEmailContent />
    </React.Suspense>
  )
}
