"use client"

import * as React from "react"
import { Navbar } from "@/src/components/landing/Navbar"
import { Footer } from "@/src/components/landing/Footer"
import { InvestorForm } from "@/components/investors/InvestorForm"
import { InvestorSuccess } from "@/components/investors/InvestorSuccess"
import Image from "next/image"

export default function InvestorPage() {
  const [isSuccess, setIsSuccess] = React.useState(false)

  return (
    <div className="bg-[#010101] min-h-screen text-white selection:bg-[#ECE1CE] selection:text-black">
      {isSuccess ? (
        <div className="w-full rounded-3xl border border-[#333333] bg-[#0A0A0A] p-8 md:p-12 flex items-center justify-center min-h-[600px]">
          <InvestorSuccess />
        </div>
      ) : (
        <>
          <Navbar />

          <main className="relative pt-24 lg:pt-32 pb-16 min-h-screen flex flex-col items-center">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/40 via-black to-black opacity-50" />
            </div>

            <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center gap-12 lg:gap-16">

              {/* Header Section */}
              <div className="text-center max-w-4xl mx-auto pt-8">
                <h1 className="text-lg sm:text-4xl md:text-5xl lg:text-[64px] leading-tight font-bold text-gradient-white mb-4 lg:mb-7">
                  Become a <span className="text-[#BEA784]">Beige</span> Investor
                </h1>
                <p className="text-white/70 text-xs lg:text-base max-w-[740px] mx-auto font-light">
                  Join a fast-growing creative technology company shaping the future of production.
                  Share your details to explore investment opportunities and partner with us in our next phase of growth.
                </p>
              </div>

              {/* Content Section: Form & Image Card */}
              <div className="w-full max-w-7xl">

                <div className="w-full rounded-3xl bg-[#171717] backdrop-blur-sm flex flex-col lg:flex-row p-8 lg:p-12 xl:p-16 gap-8 lg:gap-12 xl:gap-16">
                  {/* Form Side */}
                  <div className="w-full lg:w-7/12">
                    <InvestorForm onSuccess={() => setIsSuccess(true)} />
                  </div>

                  {/* Image Side */}
                  <div className="w-full lg:w-5/12 relative min-h-[300px] lg:min-h-full rounded-lg lg:rounded-[20px] overflow-hidden">
                    <Image
                      src="/images/loginsignup/Investor.png"
                      alt="Investors discussion"
                      fill
                      className="object-cover opacity-80"
                    />
                    {/* Fallback overlay if image doesn't match perfectly */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
      <Footer />
    </div>
  )
}
