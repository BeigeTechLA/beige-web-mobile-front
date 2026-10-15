"use client";

import React, { Suspense, use } from "react";
import { usePreviewRole } from "@/components/admin/editor-workspace/EditorWorkspaceShared";
import EditorWorkspaceDetails from "@/components/admin/editor-workspace/EditorWorkspaceDetails";

function Details({ id }: { id: string }) {
  const role = usePreviewRole();
  return <EditorWorkspaceDetails id={id} role={role} />;
}

export default function EditorWorkspaceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-8">Loading shoot details...</div>}>
      <Details id={id} />
    </Suspense>
  );
}
