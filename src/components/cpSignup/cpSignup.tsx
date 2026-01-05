"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CpAuthLayout from "./cpAuthLayout";
import Step1Form from "./step1Form";
import Step2Form from "./step2Form";
import Step3Form from "./step3Form";
import SignupSuccess from "./SignUpSuccess";
import ProfileCard from "./profileCard";

export default function CpSignupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    location: null,
    workingDistance: "",
    profileImage: null,
    role: "",
    yoe: "",
    hourlyRate: "",
    bio: "",
    skills: [],
    equipments: [],
    certifications: [],
    featuredWork: [],
    links: [],
    crew_member_id: null, // Add crew_member_id to the state
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleBack = () => {
    if (step === 1) {
      router.push("/"); // Using Next.js router for navigation
    } else {
      prevStep();
    }
  };

  /* -------------------------------------------
     STEP 4 (Signup Success) – NO LAYOUT
  -------------------------------------------- */
  if (step === 4) {
    return <SignupSuccess data={data} />;
  }

  /* -------------------------------------------
     STEPS 1–3 (WITH CpAuthLayout)
  -------------------------------------------- */
  const renderStepForm = () => {
    switch (step) {
      case 1:
        return (
          <Step1Form
            data={data}
            setData={setData}
            nextStep={nextStep}
            prevStep={handleBack}
            crew_member_id={data.crew_member_id} // Pass crew_member_id if it exists
          />
        );

      case 2:
        return (
          <Step2Form
            data={data}
            setData={setData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );

      case 3:
        return (
          <Step3Form
            data={data}
            setData={setData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );

      default:
        return null;
    }
  };

  return (
    <CpAuthLayout
      step={`Step ${step}/3`}
      title={
        step === 1
          ? "Apply To Become A Beige Creative Partner"
          : step === 2
          ? "Professional Details"
          : "Portfolio"
      }
      description={
        step === 1
          ? "Create your profile to get discovered by production teams."
          : step === 2
          ? "Create your profile to get discovered by production teams."
          : "Complete your profile and connect with top studios and filmmakers."
      }
      onBack={handleBack}
      leftContent={renderStepForm()}
      rightCardContent={<ProfileCard data={data} />}
    />
  );
}
