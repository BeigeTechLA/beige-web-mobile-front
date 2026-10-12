"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { agreementApi, AgreementDocument } from "@/lib/api/agreements";

export default function GeneralAgreementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const requestedId = Number(searchParams.get("agreement_id"));
        if (requestedId > 0) {
          const response = await agreementApi.getCreatorAgreement(requestedId);
          if (response.data.agreement.agreement_type !== "general") throw new Error("This is not a general agreement");
          if (active) setAgreement(response.data.agreement);
          return;
        }
        const response = await agreementApi.getCurrentGeneralAgreement();
        if (active) setAgreement(response.data.agreement);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load general agreement");
      }
    };
    void load();
    return () => { active = false; };
  }, [searchParams]);

  const accept = async () => {
    if (!agreement || !checked) return;
    try {
      setIsSubmitting(true);
      await agreementApi.acceptGeneralAgreement(agreement.agreement_document_id);
      setAgreement({ ...agreement, status: "accepted" });
      toast.success("General agreement accepted");
      router.push("/creator/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accepted = agreement?.status === "accepted";
  return (
    <>
      <Topbar pathname={pathname} />
      <main className="min-h-screen w-full bg-black px-4 py-6 text-white md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"><ArrowLeft size={16} /> Back</button>
          {!agreement ? (
            <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#E8D1AB]" /></div>
          ) : (
            <>
              <article className="overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717] text-white/80">
                <header className="flex flex-col gap-4 border-b border-[#3D3D3D] bg-[#202020] p-5 sm:flex-row sm:items-start sm:justify-between lg:px-9 lg:py-7">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#D8CCBA]">General Agreement</p><h1 className="mt-1 text-xl text-white lg:text-3xl">{agreement.title}</h1></div>
                  <div className="flex flex-col items-start gap-1 sm:items-end"><span className="rounded-lg bg-[#E8D1AB] px-3 py-1 text-xs font-medium text-black">{agreement.display_version}</span><span className="text-[10px] text-white/60">{agreement.responded_at ? `Accepted ${new Date(agreement.responded_at).toLocaleDateString()}` : "Awaiting acceptance"}</span></div>
                </header>
                <div className="prose prose-invert max-w-none p-5 text-sm leading-relaxed text-white/80 lg:p-9" dangerouslySetInnerHTML={{ __html: agreement.content_html }} />
              </article>
              <section className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-6">
                {accepted ? <div className="flex items-center gap-2 font-medium text-[#16A34A]"><Check size={18} /> You have accepted this agreement.</div> : <>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#E8D1AB]" /> I have read and agree to the terms and conditions.</label>
                  <button disabled={!checked || isSubmitting} onClick={accept} className="mt-5 rounded-lg bg-[#E8D1AB] px-6 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Accepting..." : "Accept & Continue"}</button>
                </>}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
