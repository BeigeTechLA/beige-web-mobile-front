"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  image?: string;
  video?: string;
  imageAlt?: string;
  backLink?: string;
  onBack?: () => void;
  backLabel?: string;
  step?: number;
  totalSteps?: number;
}

export function AuthSplitLayout({
  children,
  image,
  video,
  imageAlt = "Authentication background",
  backLink,
  onBack,
  backLabel = "Back",
  step,
  totalSteps,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-black text-white">
      {/* Left Column - Image/Video */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:overflow-hidden">
        {video ? (
          <video
            src={video}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : image ? (
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        {/* Overlay if needed */}
        {/* <div className="absolute inset-0 bg-black/20" /> */}
      </div>

      {/* Right Column - Content */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-[520px] py-12">
          {/* Header Navigation */}
          <div className="mb-8 flex items-center justify-between">
            {backLink ? (
              <Link
                href={backLink}
                className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
            ) : onBack ? (
              <button
                onClick={onBack}
                className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </button>
            ) : null}

            {step && totalSteps && (
              <div className="text-sm font-medium text-neutral-400 ml-auto">
                {step}/{totalSteps}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
