"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      type="button"
      className=" flex gap-2 items-center justify-center transition-all text-white/70 hover:text-white text-sm lg:text-lg mb-6"
    >
      <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
      Back
    </button>
  );
}