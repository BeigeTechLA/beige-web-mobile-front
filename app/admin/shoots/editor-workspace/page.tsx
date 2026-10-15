"use client";

import React, { Suspense } from "react";
import EditorWorkspaceList from "@/components/admin/editor-workspace/EditorWorkspaceList";

export default function EditorWorkspaceIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-[#888888]">
          Loading editor workspace...
        </div>
      }
    >
      <EditorWorkspaceList />
    </Suspense>
  );
}
