"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  if (!token) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-lg lg:text-[28px] font-semibold tracking-tight text-white">
            Invalid Reset Link
          </h1>
          <p className="lg:text-lg text-white/60">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm resetToken={token} />
}

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout
      image="/images/loginsignup/resetPassword.png"
      imageAlt="Reset Password"
      backLink="/login"
    >
      <React.Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetPasswordContent />
      </React.Suspense>
    </AuthSplitLayout>
  )
}
