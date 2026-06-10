"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"
import { useAuth } from "@/lib/hooks/useAuth"
import { formatTime } from "@/lib/utils"

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
    login,
    resendOTP,
    isVerifyEmailLoading,
    isLoginLoading,
    isResendOTPLoading
  } = useAuth()

  const [isResending, setIsResending] = React.useState(false)
  
  // --- Timer State (60 seconds) ---
  const [timer, setTimer] = React.useState(60)

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

      const storedCreds = sessionStorage.getItem('temp_login_credentials');

      if (storedCreds) {
        try {
          const { email: storedEmail, password } = JSON.parse(storedCreds);

          if (storedEmail === email) {
            await login({ email, password });
            sessionStorage.removeItem('temp_login_credentials');
            const normalizedVerifiedEmail = String(email).trim().toLowerCase()
            if (returnTo && (!bookingEmail || bookingEmail === normalizedVerifiedEmail)) {
              router.replace(returnTo)
            } else {
              router.push('/affiliate/dashboard');
            }
            return;
          }
        } catch (e) {
          console.error("Auto-login failed:", e);
        }
      }

      setTimeout(() => {
        const normalizedVerifiedEmail = String(email).trim().toLowerCase()
        if (returnTo && (!bookingEmail || bookingEmail === normalizedVerifiedEmail)) {
          router.replace(returnTo)
          return
        }
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
      isVerifying={isVerifyEmailLoading || isLoginLoading}
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
