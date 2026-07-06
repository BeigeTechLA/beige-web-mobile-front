"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";

import { useResolvedTheme } from "@/lib/useResolvedTheme";

const buildProxyUrl = (url: string, filename: string, disposition: "inline" | "attachment") => {
  const params = new URLSearchParams({
    url,
    filename,
    disposition,
  });
  return `/api/cp-compensation-receipt?${params.toString()}`;
};

function CpReceiptViewContent() {
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();

  const receiptUrl = searchParams.get("url") || "";
  const filename = searchParams.get("filename") || "cp-receipt.pdf";
  const bookingId = searchParams.get("bookingId") || "";

  const inlineUrl = useMemo(
    () => (receiptUrl ? `${buildProxyUrl(receiptUrl, filename, "inline")}#toolbar=1&navpanes=0` : ""),
    [filename, receiptUrl]
  );
  const downloadUrl = useMemo(
    () => (receiptUrl ? buildProxyUrl(receiptUrl, filename, "attachment") : ""),
    [filename, receiptUrl]
  );

  const backHref = bookingId ? `/admin/finances/cpCompensation/${bookingId}` : "/admin/finances/cpCompensation";

  return (
    <div className={`min-h-screen p-4 lg:px-10 lg:py-8 ${isDark ? "bg-[#0B0B0B] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={backHref}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
          >
            <ChevronLeft size={16} />
            Back
          </Link>
          <h1 className="mt-3 text-xl font-semibold">Receipt Preview</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>{filename}</p>
        </div>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={filename}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] px-4 text-sm font-semibold text-black transition-colors hover:bg-[#F1DDBA]"
          >
            <Download size={16} />
            Download
          </a>
        )}
      </div>

      <div className={`h-[calc(100vh-150px)] overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}>
        {inlineUrl ? (
          <iframe
            src={inlineUrl}
            title="Receipt Preview"
            className="h-full w-full"
          />
        ) : (
          <div className={`flex h-full items-center justify-center text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
            Receipt URL is missing.
          </div>
        )}
      </div>
    </div>
  );
}

export default function CpReceiptViewPage() {
  return (
    <Suspense fallback={null}>
      <CpReceiptViewContent />
    </Suspense>
  );
}
