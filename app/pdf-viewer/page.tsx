"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function PdfViewerContent() {
  const searchParams = useSearchParams();
  const sourceUrl = searchParams.get("url") || "";
  const title = searchParams.get("title") || "Document";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAllowedSource = useMemo(() => {
    if (!sourceUrl) return false;
    if (sourceUrl.startsWith("/")) return true;

    try {
      const parsed = new URL(sourceUrl);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceUrl) {
      setError("Document URL is missing.");
      return;
    }

    if (!isAllowedSource) {
      setError("Document URL is not allowed.");
      return;
    }

    const controller = new AbortController();
    let nextBlobUrl: string | null = null;

    setError(null);
    setBlobUrl(null);

    fetch(sourceUrl, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load document.");
        }
        return response.blob();
      })
      .then((blob) => {
        nextBlobUrl = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" })
        );
        setBlobUrl(nextBlobUrl);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load document.");
      });

    return () => {
      controller.abort();
      if (nextBlobUrl) {
        URL.revokeObjectURL(nextBlobUrl);
      }
    };
  }, [isAllowedSource, sourceUrl]);

  return (
    <main className="flex h-screen flex-col bg-[#242424] text-white">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#2F2F2F] px-4">
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </header>

      <section className="min-h-0 flex-1">
        {blobUrl ? (
          <iframe
            src={blobUrl}
            title={title}
            className="h-full w-full border-0 bg-[#242424]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
            {error || "Loading document..."}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PdfViewerPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center bg-[#242424] text-sm text-white/70">
          Loading document...
        </main>
      }
    >
      <PdfViewerContent />
    </Suspense>
  );
}
