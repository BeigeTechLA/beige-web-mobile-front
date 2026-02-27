"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type CpAuthLayoutProps = {
  step?: string;
  title?: string;
  description?: string;
  onBack?: () => void;
  leftContent: ReactNode;
  rightCardContent?: ReactNode;
  hideRightSection?: boolean;
};

function CpAuthLayout({
  step = "",
  title = "",
  description = "",
  onBack = () => { },
  leftContent,
  rightCardContent,
  hideRightSection = false,
}: CpAuthLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (step === "Step 1/3") { //Changing it from 1 to "Step 1/3" as step is a string 
      router.push("/");
    } else {
      onBack();
    }
  };

  return (
    <div
      className="w-full bg-[#101010] text-white selection:bg-[#E8D1AB] selection:text-black flex flex-col relative h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-contain">

      {/* TOP LOGO - Fixed position */}
      <div className="fixed left-1/2 -translate-x-1/2 top-4 md:top-8 z-[100]">
        <div className="bg-white/5 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-full border border-white/10 shadow-2xl">
          <Link
            href="/"
            className="relative flex items-center"
          >
            <Image
              src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={100}
              height={30}
              className="object-contain w-[80px] md:w-[120px] h-auto"
              priority
            />
            <span className="absolute -right-1 md:right-1 -bottom-6 md:-bottom-9 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
              Beta
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
            </span>
          </Link>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col">
        {/* GRID: Stacks on mobile (1 col), side-by-side on desktop (2 cols) */}
        <div
          className={`grid flex-1 ${hideRightSection ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
            }`}
        >
          {/* LEFT SECTION - Form Content */}
          <div className="px-4 py-6 md:p-14 lg:p-20 flex flex-col pt-16 lg:pt-10">

            {!hideRightSection && (
              <div className="flex flex-col gap-10">
                <div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-all mb-8"
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
                      <h1 className="text-xl lg:text-3xl font-semibold text-white leading-tight">
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
            <div className="w-full max-w-none lg:max-w-xl">
              {leftContent}
            </div>
          </div>

          {/* RIGHT SECTION - Stacks below on mobile */}
          {!hideRightSection && (
            <div className="relative bg-[#0D0D0D] min-h-0 lg:min-h-screen border-t lg:border-t-0 lg:border-l border-white/5 pb-10 lg:pb-0">
              {/* 
                  MOBILE: h-auto (grows with content), no sticky. 
                  DESKTOP: h-screen and sticky.
              */}
              <div className="h-auto lg:h-screen lg:sticky lg:top-0 w-full flex items-center justify-center overflow-hidden p-6 md:p-14">

                {/* BACKGROUND DECORATIONS */}
                <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#E8D1AB]/5 blur-[80px] md:blur-[120px] rounded-full -mr-20 -mt-20 md:-mr-40 md:-mt-40" />
                <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/5 blur-[80px] md:blur-[120px] rounded-full -ml-20 -mb-20 md:-ml-40 md:-mb-40" />

                {/* THE CARD: h-auto on mobile, fixed height on desktop */}
                <div className="relative z-10 w-full max-w-[500px] 
    /* Desktop height is fixed to 80% of viewport */
    h-auto min-h-[400px] lg:h-[80vh] 
    bg-white/[0.03] border border-white/10 backdrop-blur-3xl 
    rounded-[32px] flex flex-col overflow-hidden 
    shadow-[0_20px_50px_rgba(0,0,0,0.5)] 
    transform transition-transform duration-700 ease-out 
    lg:hover:translate-y-[-10px]">
                  {/* CONTENT INSIDE THE CARD */}
                  <div className="flex-1 h-full p-6 md:p-10 lg:p-8 flex flex-col overflow-hidden">
                    {rightCardContent}
                  </div>
                  {/* BOTTOM FADE - only show on desktop where the card has a fixed scroll area */}
                  <div className="hidden lg:block pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0D0D0D] to-transparent opacity-90" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CpAuthLayout;