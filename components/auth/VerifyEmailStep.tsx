"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

interface VerifyEmailStepProps {
  email: string
  onVerify: (code: string) => void
  onResend: () => void
}

export function VerifyEmailStep({ email, onVerify, onResend }: VerifyEmailStepProps) {
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""])
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")
    if (pastedData.every(char => !isNaN(Number(char)))) {
      const newOtp = [...otp]
      pastedData.forEach((char, index) => {
        if (index < 6) newOtp[index] = char
      })
      setOtp(newOtp)
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="mb-4">
        {/* Placeholder for the shield icon/image */}
        <div className="h-24 w-24 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
           <ShieldCheck className="h-12 w-12 text-[#BEA784]" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Verify Email Address
        </h1>
        <p className="text-neutral-400 max-w-sm mx-auto">
          We've sent a 6-digit verification code to your email address <span className="text-white">{email}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-center my-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="h-12 w-12 rounded-md border border-neutral-700 bg-neutral-800 text-center text-xl text-white focus:border-[#BEA784] focus:outline-none focus:ring-1 focus:ring-[#BEA784] transition-all"
          />
        ))}
      </div>

      <div className="space-y-4 w-full">
        <Button
          onClick={() => onVerify(otp.join(""))}
          className="w-full bg-[#ECE1CE] text-black hover:bg-[#DCD1BE] h-12 text-base font-medium"
          disabled={otp.some(d => !d)}
        >
          Verify Email
        </Button>
        
        <p className="text-sm text-neutral-500">
          Didn't received any code ? <button onClick={onResend} className="text-white hover:underline">Resend OTP</button>
        </p>
      </div>
    </div>
  )
}

