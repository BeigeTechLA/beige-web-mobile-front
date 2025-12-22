"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
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
    <AuthSplitLayout 
      image="/images/creator2.jpg" // Placeholder
      imageAlt="Verify Email"
      backLink="/login"
    >
      <React.Suspense fallback={<div className="text-white">Loading...</div>}>
        <VerifyEmailContent />
      </React.Suspense>
    </AuthSplitLayout>
  )
}
