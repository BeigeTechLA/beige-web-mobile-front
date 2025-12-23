"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { Step0BasicInfo } from "@/components/auth/creator-steps/Step0BasicInfo"
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep"
import { Step1Specialties } from "@/components/auth/creator-steps/Step1Specialties"
import { Step2Experience } from "@/components/auth/creator-steps/Step2Experience"
import { Step3Profile } from "@/components/auth/creator-steps/Step3Profile"
import { useAuth } from "@/lib/hooks/useAuth"

// Enum for steps to make it readable
enum CreatorStep {
  BASIC_INFO = 0,
  VERIFY_EMAIL = 1,
  SPECIALTIES = 2,
  EXPERIENCE = 3,
  PROFILE = 4
}

interface CreatorFormData {
  email?: string;
  crew_member_id?: number;
  specialties?: string[];
  equipment?: string[];
  yearsOfExperience?: string;
  bio?: string;
  primaryRole?: number;
  portfolioLink?: string;
  hourlyRate?: number;
  availability?: Record<string, unknown>;
  socialLinks?: Record<string, string>;
}

export function CreatorSignupFlow() {
  const router = useRouter()
  const { verifyEmail, registerCreatorStep2, registerCreatorStep3 } = useAuth()
  const [step, setStep] = React.useState<CreatorStep>(CreatorStep.BASIC_INFO)
  const [formData, setFormData] = React.useState<CreatorFormData>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleBasicInfoSubmit = (data: { crew_member_id: number; email: string }) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(CreatorStep.VERIFY_EMAIL)
  }

  const handleVerifySubmit = async (code: string) => {
    if (!formData.email) {
      toast.error("Email not found. Please start over.")
      return
    }

    setIsSubmitting(true)
    try {
      await verifyEmail({ email: formData.email, verificationCode: code })
      toast.success("Email verified successfully!")
      setStep(CreatorStep.SPECIALTIES)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Verification failed. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    // In development, the backend uses a static code "123456"
    toast.info("A new verification code has been sent to your email.")
  }

  const handleSpecialtiesSubmit = (data: { specialties: string[] }) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(CreatorStep.EXPERIENCE)
  }

  const handleExperienceSubmit = async (data: {
    equipment: string[];
    yearsOfExperience: string;
    bio?: string;
  }) => {
    // Store the data and move to next step
    setFormData((prev) => ({ ...prev, ...data }))

    // Now call Step 2 API with specialties + experience data
    setIsSubmitting(true)
    try {
      if (!formData.crew_member_id) {
        throw new Error("Crew member ID not found")
      }

      await registerCreatorStep2({
        crew_member_id: formData.crew_member_id,
        skills: formData.specialties || [],
        equipment_ownership: data.equipment,
        years_of_experience: data.yearsOfExperience,
        bio: data.bio,
      })

      toast.success("Professional details saved!")
      setStep(CreatorStep.PROFILE)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to save professional details."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileSubmit = async (data: {
    portfolioLink?: string;
    hourlyRate?: number;
    availability?: Record<string, unknown>;
    socialLinks?: Record<string, string>;
  }) => {
    setIsSubmitting(true)
    try {
      if (!formData.crew_member_id) {
        throw new Error("Crew member ID not found")
      }

      // Create FormData for step 3 (supports file uploads)
      const formDataToSend = new FormData()
      formDataToSend.append('crew_member_id', formData.crew_member_id.toString())

      if (data.availability) {
        formDataToSend.append('availability', JSON.stringify(data.availability))
      }

      if (data.socialLinks || data.portfolioLink) {
        formDataToSend.append('social_media_links', JSON.stringify({
          ...data.socialLinks,
          portfolio: data.portfolioLink,
        }))
      }

      await registerCreatorStep3(formDataToSend)

      toast.success("Profile completed! Welcome to Beige!")
      router.push("/login") // Redirect to login to sign in with new credentials
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to complete profile."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
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
          image: "/images/loginsignup/Creator1.png",
          imageAlt: "Creator Signup",
          showStep: false,
          backLink: "/login"
        }
      case CreatorStep.VERIFY_EMAIL:
        return {
          // image: "/images/creator2.jpg",
          imageAlt: "Verify Email",
          showStep: false,
          backLink: undefined
        }
      case CreatorStep.SPECIALTIES:
        return {
          image: "/images/loginsignup/creatorSpecialities.png",
          imageAlt: "Specialties",
          step: 1,
          totalSteps: 3
        }
      case CreatorStep.EXPERIENCE:
        return {
          image: "/images/loginsignup/creatorEquipments.png",
          imageAlt: "Experience",
          step: 2,
          totalSteps: 3
        }
      case CreatorStep.PROFILE:
        return {
          image: "/images/loginsignup/creatorOnlineProfile.png",
          imageAlt: "Profile",
          step: 3,
          totalSteps: 3
        }
      default:
        return { image: "/images/AuthImageHD.webp" }
    }
  }

  const stepProps = getStepProps()

  if (step === CreatorStep.VERIFY_EMAIL) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <VerifyEmailStep
          email={formData.email || "your email"}
          onVerify={handleVerifySubmit}
          onResend={handleResendCode}
        />
      </div>
    );
  }

  return (
    <AuthSplitLayout
      image={stepProps.image}
      imageAlt={stepProps.imageAlt}
      backLink={step === CreatorStep.BASIC_INFO ? "/login" : undefined}
      onBack={step > CreatorStep.SPECIALTIES ? handleBack : undefined}
      step={stepProps.step}
      totalSteps={stepProps.totalSteps}
    >
      {step === CreatorStep.BASIC_INFO && (
        <Step0BasicInfo
          onNext={handleBasicInfoSubmit} />
      )}

      {step === CreatorStep.SPECIALTIES && (
        <Step1Specialties onNext={handleSpecialtiesSubmit}
          step={stepProps.step}
          totalSteps={stepProps.totalSteps} />
      )}

      {step === CreatorStep.EXPERIENCE && (
        <Step2Experience
          onNext={handleExperienceSubmit}
          isSubmitting={isSubmitting}
           step={stepProps.step}
          totalSteps={stepProps.totalSteps}
        />
      )}

      {step === CreatorStep.PROFILE && (
        <Step3Profile
          onNext={handleProfileSubmit}
          isSubmitting={isSubmitting}
           step={stepProps.step}
          totalSteps={stepProps.totalSteps}
        />
      )}
    </AuthSplitLayout>
  );
}
