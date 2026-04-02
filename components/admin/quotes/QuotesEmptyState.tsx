"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface QuotesEmptyStateProps {
  createHref: string;
}

export default function QuotesEmptyState({ createHref }: QuotesEmptyStateProps) {
  const { isDark } = useResolvedTheme();

  return (
    <div
      className={`mt-8 rounded-[32px] px-6 py-14 md:px-10 md:py-20 ${
        isDark ? "border border-[#3D3D3D] bg-[#161616]" : "border border-[#E5E5E5] bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <p className="mb-4 text-sm font-medium text-[#8C8C8C]">Empty State</p>

        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(229,213,184,0.12),transparent_70%)] blur-2xl" />
          <Image
            src="/images/Upload Single File.png"
            alt="Quotes empty state icon"
            width={190}
            height={190}
            priority
            className="relative h-auto w-[170px] md:w-[190px]"
          />
        </div>

        <h2 className={`text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
          You haven&apos;t created any quotes yet
        </h2>
        <p className={`mt-4 max-w-[320px] text-base leading-7 ${isDark ? "text-[#A1A1A1]" : "text-[#666666]"}`}>
          Quotes you create will appear here and can be shared directly with clients.
        </p>

        <Link href={createHref} className="mt-8">
          <Button className="h-14 rounded-xl bg-[#E5D5B8] px-8 text-lg font-semibold text-black shadow-[0_18px_40px_rgba(229,213,184,0.18)] hover:bg-[#d4c3a3]">
            Create New Quote
          </Button>
        </Link>
      </div>
    </div>
  );
}
