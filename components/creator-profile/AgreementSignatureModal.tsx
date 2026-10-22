"use client";

import { useState } from "react";
import SignaturePad from "@/components/signature/SignaturePad";

export function AgreementSignatureModal({ title, initialName, isSubmitting, onClose, onSubmit }: {
  title: string;
  initialName?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (signatureDataUrl: string, signerName: string) => Promise<void>;
}) {
  const [signerName, setSignerName] = useState(initialName || "");
  const [error, setError] = useState("");

  return <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Sign ${title}`}>
    <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#171717] p-5 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold">Sign and Accept</h2><p className="mt-1 text-sm text-white/60">{title}</p></div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="text-sm text-white/70 hover:text-white">Close</button>
        </div>
        <label className="mb-5 block text-sm">Legal name
          <input value={signerName} onChange={(event) => setSignerName(event.target.value)} maxLength={255} autoComplete="name" className="mt-2 block w-full rounded-lg border border-white/30 bg-[#222] px-3 py-2 text-white" />
        </label>
        <SignaturePad saveLabel="Sign and Accept" isSaving={isSubmitting} onClear={() => setError("")} onSave={async (signatureDataUrl) => {
          const name = signerName.trim();
          if (!name) { setError("Enter your legal name before signing."); return; }
          setError("");
          await onSubmit(signatureDataUrl, name);
        }} />
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
      </div>
    </div>
  </div>;
}
