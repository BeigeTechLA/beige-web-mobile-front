import type { AgreementResponse } from "@/lib/api/agreements";
import Image from "next/image";

export function AgreementSignatureEvidence({ response }: { response?: AgreementResponse | null }) {
  if (!response || response.action !== "accepted") return null;
  return <section className="rounded-2xl border border-[#6E6049] bg-[#2A2824] p-5 text-white">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#E8D1AB]">Signed Acceptance</h2>
    <div className="mt-4 flex flex-wrap items-center gap-6">
      {response.signature_data_url && <Image src={response.signature_data_url} alt={`Signature of ${response.signer_name || "Creative Partner"}`} width={288} height={96} unoptimized className="h-24 max-w-72 rounded bg-white object-contain p-2" />}
      <div className="space-y-1 text-sm"><p>Signed by <strong>{response.signer_name || "Creative Partner"}</strong></p><p className="text-white/70">{response.responded_at ? new Date(response.responded_at).toLocaleString() : ""}</p><p className="text-xs text-white/50">Agreement content hash: {response.content_hash_at_response}</p></div>
    </div>
    {!response.signature_data_url && <p className="mt-3 text-xs text-white/60">This agreement was accepted before drawn signatures were required.</p>}
  </section>;
}
