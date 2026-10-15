"use client";

import React, { Suspense, use } from "react";
import { usePreviewRole } from "@/components/admin/editor-workspace/EditorWorkspaceShared";
import ExternalEditorAgreement from "@/components/admin/editor-workspace/ExternalEditorAgreement";

function Agreement({ id }: { id: string }) {
  const role = usePreviewRole();
  return <ExternalEditorAgreement id={id} role={role} />;
}

export default function EditorWorkspaceAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-8">Loading agreement...</div>}>
      <Agreement id={id} />
    </Suspense>
  );
}
