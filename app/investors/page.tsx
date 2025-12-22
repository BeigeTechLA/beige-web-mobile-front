"use client"

import * as React from "react"
import { Navbar } from "@/src/components/landing/Navbar"
import { Footer } from "@/src/components/landing/Footer"
import { InvestorForm } from "@/components/investors/InvestorForm"
import { InvestorSuccess } from "@/components/investors/InvestorSuccess"

export default function InvestorPage() {
  const [isSuccess, setIsSuccess] = React.useState(false)

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#BEA784] selection:text-black">
      <Navbar />
      
      <main className="relative pt-24 lg:pt-32 pb-16 min-h-screen flex flex-col justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           {/* Gradient or Background Image */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/40 via-black to-black opacity-50" />
           
           {/* You might want to add the specific background image from the screenshot if available */}
           {/* <Image src="/images/investor-bg.jpg" fill className="object-cover opacity-30" /> */}
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-12 lg:gap-24">
            
            {/* Left Content */}
            <div className="flex-1 max-w-2xl text-center lg:text-left pt-8 lg:pt-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Become a <span className="text-[#BEA784]">Beige</span> Investor
              </h1>
              <p className="text-lg text-neutral-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Join a fast-growing creative technology company shaping the future of production. 
                Share your details to explore investment opportunities and partner with us in our next phase of growth.
              </p>
            </div>

            {/* Right Form */}
            <div className="w-full max-w-[600px]">
              {isSuccess ? (
                <div className="w-full rounded-3xl border border-[#333333] bg-[#0A0A0A]/90 backdrop-blur-sm min-h-[500px] flex items-center justify-center">
                  <InvestorSuccess />
                </div>
              ) : (
                <InvestorForm onSuccess={() => setIsSuccess(true)} />
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

