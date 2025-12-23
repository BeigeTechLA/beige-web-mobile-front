"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import Image from "next/image"

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
    <div className="flex min-h-screen items-center justify-center w-full bg-[#101010] text-white">
      <div className="flex flex-col items-center text-center space-y-6 mx-auto">
        <div className="mb-6 lg:mb-15">
          <div className="flex-shrink-0 w-20 h-18 lg:w-[290px] lg:h-[247px]">
            <Image
              src={"/images/loginsignup/verifyEmail.svg"}
              alt={"Verify Email"}
              width={82}
              height={82}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-lg lg:text-4xl font-semibold tracking-tight text-white">
            Verify Email Address
          </h1>
          <p className="text-sm lg:text-base text-[#9E9696] mx-auto">
            We've sent a 6-digit verification code to your email address {email}
          </p>
        </div>

        <div className="flex gap-2 justify-center my-2 lg:mb-8">
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
              className="h-12 w-12 rounded-md border border-neutral-700 bg-[#101010] text-center text-xl text-white focus:border-[#BEA784] focus:outline-none focus:ring-1 focus:ring-[#BEA784] transition-all"
            />
          ))}
        </div>

        <div className="space-y-4 lg:space-y-8 w-full">
          <p className="text-sm text-[#969696]">
            Didn't received any code ? <button onClick={onResend} className="text-[#E8D1AB] hover:underline">Resend OTP</button>
          </p>
          <Button
            onClick={() => onVerify(otp.join(""))}
            className="w-5/6 lg:w-full bg-[#E8D1AB] text-black hover:bg-[#DCD1BE] h-9 lg:h-[76px] text-sm md:text-xl font-medium mt-1"
            disabled={otp.some(d => !d)}
          >
            Verify Email
          </Button>
        </div>
      </div>
    </div>
  )
}

