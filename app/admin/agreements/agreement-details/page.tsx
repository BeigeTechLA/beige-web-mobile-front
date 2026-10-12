"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { agreementApi, AgreementDocument } from "@/lib/api/agreements";

type Detail = { agreement: AgreementDocument; responses: Array<Record<string, unknown>>; events: Array<Record<string, unknown>> };

export default function AdminAgreementDetailsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const agreementId = Number(params.get("agreement_id"));

  const load = async () => {
    if (!agreementId) return;
    try { setDetail((await agreementApi.getAdminAgreement(agreementId)).data); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load agreement"); }
  };
  useEffect(() => { void load(); }, [agreementId]);

  const send = async () => {
    if (!detail) return;
    try { setIsSaving(true); await agreementApi.sendShootAgreement(detail.agreement.agreement_document_id); await load(); toast.success("Agreement sent to Creative Partner"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to send agreement"); }
    finally { setIsSaving(false); }
  };
  const revise = async () => {
    if (!detail) return;
    try {
      setIsSaving(true);
      const revision = await agreementApi.reviseShootAgreement(detail.agreement.agreement_document_id, {});
      toast.success("Revision draft created");
      router.replace(`/admin/agreements/agreement-details?agreement_id=${revision.data.agreement_document_id}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to revise agreement"); }
    finally { setIsSaving(false); }
  };
  const cancel = async () => {
    if (!detail || !window.confirm("Cancel this agreement? The CP will no longer be able to respond.")) return;
    try { setIsSaving(true); await agreementApi.cancelAgreement(detail.agreement.agreement_document_id); await load(); toast.success("Agreement cancelled"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to cancel agreement"); }
    finally { setIsSaving(false); }
  };

  const agreement = detail?.agreement;
  return <><Topbar pathname={pathname} /><main className="min-h-screen bg-[#0A0A0A] p-4 text-white lg:p-10"><button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={18} /> Back</button>{!agreement ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#E8D1AB]" /></div> : <div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 rounded-2xl border border-[#3D3D3D] bg-[#171717] p-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#E8D1AB]">{agreement.agreement_type} agreement</p><h1 className="mt-1 text-2xl font-semibold">{agreement.title}</h1><p className="mt-1 text-sm text-white/60">{agreement.display_version} · {agreement.status.replace(/_/g, " ")}</p></div><div className="flex flex-wrap gap-2">{agreement.agreement_type === "shoot" && ["draft", "rejected"].includes(agreement.status) ? <button disabled={isSaving} onClick={send} className="rounded-lg bg-[#E8D1AB] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Send</button> : null}{agreement.agreement_type === "shoot" && agreement.status !== "cancelled" ? <button disabled={isSaving} onClick={revise} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Create revision</button> : null}{["draft", "pending_acceptance"].includes(agreement.status) ? <button disabled={isSaving} onClick={cancel} className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-300">Cancel</button> : null}</div></header><section className="overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]"><div className="border-b border-[#3D3D3D] p-5 text-sm text-white/70">Booking #{agreement.booking_id || "—"} · Assignment #{agreement.assignment_id || "—"} · Compensation {agreement.currency || "USD"} {Number(agreement.compensation_amount || 0).toFixed(2)}</div><div className="prose prose-invert max-w-none p-6 text-sm" dangerouslySetInnerHTML={{ __html: agreement.content_html }} /></section><section className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-3 font-semibold">Responses</h2>{detail.responses.length ? detail.responses.map((response, index) => <pre key={index} className="mb-2 overflow-auto rounded bg-black/20 p-3 text-xs text-white/70">{JSON.stringify(response, null, 2)}</pre>) : <p className="text-sm text-white/50">No response yet.</p>}</div><div className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-3 font-semibold">Activity</h2>{detail.events.map((event, index) => <p key={index} className="border-b border-white/5 py-2 text-sm text-white/70">{String(event.event_type || "Agreement event")} · {event.occurred_at ? new Date(String(event.occurred_at)).toLocaleString() : "—"}</p>)}</div></section></div>}</main></>;
}
