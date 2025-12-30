"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

function CpAuthLayout({
  step = "",
  title = "",
  description = "",
  onBack = () => {},
  leftContent,
  rightCardContent,
  hideRightSection = false,
}) {
  const router = useRouter();

  const handleBack = () => {
    if (step === 1) {
      router.push("/");
    } else {
      onBack();
    }
  };

  return (
    // Removed overflow-hidden and h-screen to allow the whole page to scroll naturally
    <div className="min-h-screen w-full bg-[#101010] relative text-white selection:bg-[#E8D1AB] selection:text-black">
      
      {/* TOP LOGO - Fixed so it stays while scrolling */}
      <div className="fixed left-1/2 -translate-x-1/2 top-8 z-50">
        <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
          <Image
            src="/images/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={120} // Adjusted width for better fit
            height={40}
            className="object-contain"
          />
        </div>
      </div>

      <div className="w-full">
        {/* GRID - Standard flow, no forced heights */}
        <div
          className={`grid ${
            hideRightSection ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          }`}
        >
          {/* LEFT SECTION - Form Content */}
          <div className="p-6 md:p-14 lg:p-20 flex flex-col pt-32 lg:pt-10">
            
            {!hideRightSection && (
              <div className="flex flex-col gap-10">
                <div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-all mb-8"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <div className="max-w-xl">
                    {step && (
                      <p className="text-[#E8D1AB] font-medium text-xs tracking-[0.2em] uppercase mb-2">
                        {step}
                      </p>
                    )}
                    {title && (
                      <h1 className="text-3xl lg:text-5xl font-semibold text-white leading-tight">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="text-white/50 mt-4 text-lg leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FORM CONTENT */}
            <div className="w-full max-w-xl">
              {leftContent}
            </div>
          </div>

          {/* RIGHT SECTION - Sticky and Offset */}
          {!hideRightSection && (
            <div className="relative bg-[#0D0D0D] hidden lg:block border-l border-white/5">
              {/* This wrapper is sticky so the background decorations stay in view */}
              <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                
                {/* BACKGROUND DECORATION */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8D1AB]/5 blur-[120px] rounded-full -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -ml-40 -mb-40" />

                {/* THE CARD - "Slight up" using negative translate and relative positioning */}
                <div className="relative z-10 w-full max-w-[500px] h-[80vh] bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[32px] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -translate-y-0 transition-transform duration-700 ease-out hover:translate-y-[-40px]">
                  
                  {/* SCROLLABLE CONTENT INSIDE THE CARD */}
                  <div className="flex-1 p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    {rightCardContent}
                  </div>

                  {/* BOTTOM FADE FOR CARD CONTENT */}
                  <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#121212] to-transparent opacity-60" />
                </div>
              </div>

              {/* Added a height spacer to ensure the right side "moves" with the left content height */}
              <div className="absolute inset-0 z-0 h-full pointer-events-none" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CpAuthLayout;