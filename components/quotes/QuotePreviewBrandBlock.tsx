"use client";

import Image from "next/image";
import Link from "next/link";

import { useResolvedTheme } from "@/lib/useResolvedTheme";

type QuotePreviewBrandBlockProps = {
  title?: string;
  logoHref?: string;
};

const beigeLogo = (
  <div className="relative flex w-fit items-center">
    <Image
      src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
      alt="Beige AI"
      width={158}
      height={32}
      className="h-[24px] w-[120px] object-contain lg:h-[32px] lg:w-[158px]"
      priority
    />
    <span className="absolute right-4 -bottom-3 overflow-hidden rounded-full border border-white/40 px-1 py-[1px] text-[8px] font-medium tracking-wide text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs lg:right-5 lg:-bottom-4 lg:px-2 lg:py-[1.5px] lg:text-[10px]">
      Beta
      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40" />
    </span>
  </div>
);

export default function QuotePreviewBrandBlock({
  title = "Quote Preview",
  logoHref = "/",
}: QuotePreviewBrandBlockProps) {
  const { isDark } = useResolvedTheme();

  return (
    <div className="flex select-none flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {logoHref ? (
        <Link href={logoHref} className="w-fit">
          {beigeLogo}
        </Link>
      ) : (
        beigeLogo
      )}

      <div className="text-left sm:text-right">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#8B8B90]">Preview</p>
        <h1 className={`text-[22px] font-medium lg:text-[28px] ${isDark ? "text-white" : "text-black"}`}>
          {title}
        </h1>
      </div>
    </div>
  );
}
