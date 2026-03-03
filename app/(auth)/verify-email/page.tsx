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

  const {
    verifyEmail,
    login,
    resendOTP,
    isVerifyEmailLoading,
    isLoginLoading,
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

      // Check for stored credentials to perform auto-login
      const storedCreds = sessionStorage.getItem('temp_login_credentials');

      if (storedCreds) {
        try {
          const { email: storedEmail, password } = JSON.parse(storedCreds);

          // Verify emails match to avoid security issues
          if (storedEmail === email) {
            await login({ email, password });
            sessionStorage.removeItem('temp_login_credentials');
            router.push('/affiliate/dashboard');
            return;
          }
        } catch (e) {
          console.error("Auto-login failed:", e);
        }
      }

      // If user was auto-logged in via token or manual login failed, redirect to affiliate dashboard
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
