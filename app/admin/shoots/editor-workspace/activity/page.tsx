"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePreviewRole } from "@/components/admin/editor-workspace/EditorWorkspaceShared";
import EditorWorkspaceActivity from "@/components/admin/editor-workspace/EditorWorkspaceActivity";

function Activity() {
  const role = usePreviewRole();
  const searchParams = useSearchParams();
  return (
    <EditorWorkspaceActivity role={role} shootId={searchParams.get("shoot")} />
  );
}

export default function EditorWorkspaceActivityPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading activity...</div>}>
      <Activity />
    </Suspense>
  );
}
