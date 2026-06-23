"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const getProjectIdFromFilePath = (value: string) => {
  const segments = String(value || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.find((segment) => /^\d+$/.test(segment)) || segments[0] || "";
};

function FileManagerRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const filePath =
      searchParams.get("file") ||
      searchParams.get("filePath") ||
      searchParams.get("filepath") ||
      searchParams.get("external_id") ||
      searchParams.get("externalId") ||
      "";
    const projectId = getProjectIdFromFilePath(filePath);

    if (!projectId) {
      router.replace("/admin/file-manager");
      return;
    }

    const params = new URLSearchParams();
    params.set("filePath", filePath);
    const commentId = searchParams.get("commentId") || searchParams.get("comment_id");
    if (commentId) params.set("commentId", commentId);

    router.replace(`/admin/file-manager/${encodeURIComponent(projectId)}?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      Opening file...
    </main>
  );
}

export default function FileManagerRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Opening file...
        </main>
      }
    >
      <FileManagerRedirectContent />
    </Suspense>
  );
}
