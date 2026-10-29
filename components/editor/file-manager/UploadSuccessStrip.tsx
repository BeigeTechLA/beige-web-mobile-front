"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_MESSAGE = "Upload Completed. File Manager updated your workspace";

/** Green "Upload Completed" alert body (rendered inside a sonner toast). */
function UploadSuccessStrip({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="flex w-[calc(100vw-32px)] max-w-xl items-center gap-3 rounded-xl border border-[#61D58C] bg-[#163521] p-3 lg:p-5 text-[#61D58C]"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <Check size={20} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm lg:text-base">{message}</p>
    </div>
  );
}

/**
 * Show the upload success alert. Uses the app's existing sonner <Toaster />,
 * so there's nothing to render on the page – just call it after an upload succeeds.
 */
export function showUploadSuccess(message: string = DEFAULT_MESSAGE, duration = 4000) {
  return toast.custom((id) => <UploadSuccessStrip message={message} onDismiss={() => toast.dismiss(id)} />, {
    duration,
    position: "top-center",
  });
}
