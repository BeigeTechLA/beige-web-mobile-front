"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || "your email"

  const handleVerify = (code: string) => {
    // Verify API logic here
    console.log("Verifying code:", code)
  }

  return (
    <VerifyEmailStep
      email={email}
      onVerify={handleVerify}
      onResend={() => console.log("Resend")}
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
