"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Step0BasicInfo } from "@/components/auth/creator-steps/Step0BasicInfo"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"
import { Step1Specialties } from "@/components/auth/creator-steps/Step1Specialties"
import { Step2Experience } from "@/components/auth/creator-steps/Step2Experience"
import { Step3Profile } from "@/components/auth/creator-steps/Step3Profile"

// Enum for steps to make it readable
enum CreatorStep {
  BASIC_INFO = 0,
  VERIFY_EMAIL = 1,
  SPECIALTIES = 2,
  EXPERIENCE = 3,
  PROFILE = 4
}

export function CreatorSignupFlow() {
  const router = useRouter()
  const [step, setStep] = React.useState<CreatorStep>(CreatorStep.BASIC_INFO)
  const [formData, setFormData] = React.useState<any>({})

  const handleBasicInfoSubmit = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    setStep(CreatorStep.VERIFY_EMAIL)
  }

  const handleVerifySubmit = (code: string) => {
    console.log("Verifying code:", code)
    // Call API to verify
    // On success:
    setStep(CreatorStep.SPECIALTIES)
  }

  const handleSpecialtiesSubmit = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    setStep(CreatorStep.EXPERIENCE)
  }

  const handleExperienceSubmit = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    setStep(CreatorStep.PROFILE)
  }

  const handleProfileSubmit = (data: any) => {
    const finalData = { ...formData, ...data }
    console.log("Final submission:", finalData)
    // Call API to update profile with all details
    // On success:
    router.push("/dashboard") // or where appropriate
  }

  const handleBack = () => {
    if (step === CreatorStep.BASIC_INFO) {
      router.push("/login")
    } else if (step === CreatorStep.VERIFY_EMAIL) {
      setStep(CreatorStep.BASIC_INFO)
    } else {
      setStep(step - 1)
    }
  }

  const getStepProps = () => {
    switch (step) {
      case CreatorStep.BASIC_INFO:
        return {
          image: "/images/creator2.jpg", // Placeholder
          imageAlt: "Creator Signup",
          showStep: false,
          backLink: "/login"
        }
      case CreatorStep.VERIFY_EMAIL:
        return {
          // Verify Email screen usually centers the content or keeps the same image
          // Screenshot 4 is centered, dark background.
          // But our AuthSplitLayout is split. We can use it or a different layout.
          // Let's use split for consistency or override.
          image: "/images/creator2.jpg",
          imageAlt: "Verify Email",
          showStep: false,
          backLink: undefined // No back link shown on verify usually, or generic back
        }
      case CreatorStep.SPECIALTIES:
        return {
          image: "/images/misc/profile.png", // Placeholder for "couple yellow dress"
          imageAlt: "Specialties",
          step: 1,
          totalSteps: 3
        }
      case CreatorStep.EXPERIENCE:
        return {
          image: "/images/man-with-tripod-and-camera.png", // Placeholder for "guy beanie"
          imageAlt: "Experience",
          step: 2,
          totalSteps: 3
        }
      case CreatorStep.PROFILE:
        return {
          image: "/images/influencer/natashaGraziano.png", // Placeholder for "girl flowers"
          imageAlt: "Profile",
          step: 3,
          totalSteps: 3
        }
      default:
        return { image: "/images/AuthImageHD.webp" }
    }
  }

  const stepProps = getStepProps()

  // For Verify Email, we might want a different layout if it's strictly centered like the screenshot.
  // The screenshot shows a centered modal-like look.
  // If step === VERIFY_EMAIL, we can render differently.
  
  if (step === CreatorStep.VERIFY_EMAIL) {
     // We can reuse AuthSplitLayout but maybe with a different image or just blank on left?
     // Or we can just center it.
     // Let's stick to AuthSplitLayout for now to keep it simple, but pass no image if we want full width?
     // No, AuthSplitLayout enforces split.
     // If we want exactly the screenshot (centered card), we might need a separate wrapper.
     // But let's keep consistent split layout for now.
  }

  return (
    <AuthSplitLayout
      image={stepProps.image}
      imageAlt={stepProps.imageAlt}
      backLink={step === CreatorStep.BASIC_INFO ? "/login" : undefined}
      onBack={step > CreatorStep.BASIC_INFO && step !== CreatorStep.VERIFY_EMAIL ? handleBack : undefined}
      step={stepProps.step}
      totalSteps={stepProps.totalSteps}
    >
       {step === CreatorStep.BASIC_INFO && <Step0BasicInfo onNext={handleBasicInfoSubmit} />}
       {step === CreatorStep.VERIFY_EMAIL && (
         <VerifyEmailStep 
           email={formData.email || "your email"} 
           onVerify={handleVerifySubmit}
           onResend={() => console.log("Resend")}
         />
       )}
       {step === CreatorStep.SPECIALTIES && <Step1Specialties onNext={handleSpecialtiesSubmit} />}
       {step === CreatorStep.EXPERIENCE && <Step2Experience onNext={handleExperienceSubmit} />}
       {step === CreatorStep.PROFILE && <Step3Profile onNext={handleProfileSubmit} />}
    </AuthSplitLayout>
  )
}

