"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, History, Pencil } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { agreementApi, AgreementDocument, type AgreementResponse } from "@/lib/api/agreements";
import { AgreementSignatureEvidence } from "@/components/creator-profile/AgreementSignatureEvidence";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";

type EventItem = { event_type?: string; created_at?: string; metadata?: Record<string, unknown> };

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value))
  : "—";

const formatMoney = (amount?: number | null, currency = "USD") => new Intl.NumberFormat("en-US", {
  style: "currency", currency, minimumFractionDigits: 2,
}).format(Number(amount || 0));

const titleCase = (value?: string) => (value || "Pending").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

type AgreementSection = { id?: string; num?: string; title?: string; content?: string };

const getAgreementSections = (content: unknown): AgreementSection[] => {
  const parsed = typeof content === "string" ? (() => {
    try { return JSON.parse(content); } catch { return null; }
  })() : content;
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sections?: unknown }).sections)) return [];
  return (parsed as { sections: AgreementSection[] }).sections.filter((section) =>
    section && typeof section.title === "string" && typeof section.content === "string" && section.content.trim(),
  );
};

const SectionContent = ({ content }: { content: string }) => /<[/!]?\w[\s\S]*>/i.test(content)
  ? <div className="agreement-content text-sm leading-6 text-[#D8D8D8]" dangerouslySetInnerHTML={{ __html: content }} />
  : <p className="whitespace-pre-wrap text-sm leading-6 text-[#D8D8D8]">{content}</p>;

export default function AdminShootAgreementDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const agreementId = Number(params.get("agreement_id"));
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [signatureResponse, setSignatureResponse] = useState<AgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agreementId) {
      router.replace("/admin/agreements");
      return;
    }
    agreementApi.getAdminAgreement(agreementId)
      .then((response) => {
        if (response.data.agreement.agreement_type !== "shoot") {
          router.replace(`/admin/agreements/agreement-details?agreement_id=${agreementId}`);
          return;
        }
        setAgreement(response.data.agreement);
        setSignatureResponse(response.data.responses.find((item) => item.action === "accepted") || null);
        setEvents(Array.isArray(response.data.events) ? response.data.events as EventItem[] : []);
      })
      .catch(() => router.replace("/admin/agreements"))
      .finally(() => setLoading(false));
  }, [agreementId, router]);

  if (loading || !agreement) return <div className="min-h-screen bg-[#0A0A0A]" aria-busy="true" />;

  const snapshot = agreement.snapshot || {};
  const cp = snapshot.creative_partner || {};
  const shoot = snapshot.shoot || {};
  const role = getPrimaryRoleLabel(cp.role);
  const agreementSections = getAgreementSections(agreement.content_json);
  const currency = agreement.currency || snapshot.compensation?.currency || "USD";
  const canEdit = agreement.status === "draft" || (agreement.is_current && ["pending_acceptance", "accepted", "rejected"].includes(agreement.status));
  const editUrl = agreement.booking_id && agreement.assignment_id
    ? `/admin/shoots/${agreement.booking_id}/shoot-agreement?revise_from=${agreement.agreement_document_id}`
    : "/admin/agreements";

  return (
    <>
      <Topbar pathname={pathname} actions={
        <>
          <Button variant="outline" className="h-12 gap-2" onClick={() => router.push("/admin/agreements")}><History size={16} /> View Version History</Button>
          {canEdit && <Button className="h-12 bg-[#E8D1AB] text-black hover:bg-[#d9c19a] gap-2" onClick={() => router.push(editUrl)}><Pencil size={16} /> {agreement.status === "draft" ? "Edit Draft" : "Create New Version"}</Button>}
        </>
      } />
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-7 text-white lg:px-10">
        <Button variant="ghost" className="mb-6 -ml-3 gap-2 hover:bg-transparent hover:text-[#E8D1AB]" onClick={() => router.back()}><ArrowLeft size={18} /> Back</Button>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold lg:text-2xl">Shoot Agreement Detail</h1>
          <span className="rounded bg-[#EDE5D5] px-2 py-0.5 text-xs font-medium text-[#18150F]">{agreement.display_version}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${agreement.status === "accepted" ? "bg-[#D4FFE4] text-[#16803F]" : agreement.status === "rejected" || agreement.status === "cancelled" ? "bg-[#FFDADA] text-[#A31616]" : "bg-[#FFF4C9] text-[#A96208]"}`}>{titleCase(agreement.status)}</span>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-5 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5 text-xs md:grid-cols-3">
              {[["Project", shoot.name || `Booking #${agreement.booking_id || "—"}`], ["CP", cp.name || "—"], ["Role", role], ["Assignment ID", agreement.assignment_id ? `ASN-${agreement.assignment_id}` : "—"], ["Current Version", agreement.display_version], ["Compensation", formatMoney(agreement.compensation_amount ?? snapshot.compensation?.amount, currency)]].map(([label, value]) => <div key={label}><p className="text-[#AAA7A7]">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>)}
            </div>
            <article className="overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
              <header className="flex flex-col justify-between gap-3 border-b border-[#3D3D3D] bg-[#202020] p-6 lg:flex-row lg:items-start">
                <div><p className="mb-1 text-xs font-semibold uppercase text-[#D8CCBA]">Shoot Assignment Agreement</p><h2 className="text-2xl text-white">{agreement.title}</h2><p className="mt-1 text-sm text-[#AAA7A7]">{cp.name || "Creative Partner"}{role !== "Creative Partner" ? ` · ${role}` : ""}</p></div>
                <div className="flex flex-wrap gap-2"><span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs">{agreement.display_version}</span><span className="rounded-full bg-[#D4E0FF] px-3 py-1 text-xs text-[#0B2F8B]">Individual Agreement</span></div>
              </header>
              <div className="space-y-7 p-6 lg:p-8">
                <section><h3 className="mb-3 text-sm font-medium">Project Information</h3><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#AAA7A7]"><span>Project Name: <b className="font-medium text-white">{shoot.name || "—"}</b></span><span>Project ID: <b className="font-medium text-white">{agreement.booking_id ? `PRJ-${agreement.booking_id}` : "—"}</b></span><span>Assignment ID: <b className="font-medium text-white">{agreement.assignment_id ? `ASN-${agreement.assignment_id}` : "—"}</b></span></div></section>
                <section><h3 className="mb-3 text-sm font-medium">Production Details</h3><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#AAA7A7]"><span>Date: <b className="font-medium text-white">{shoot.date ? formatDate(shoot.date) : "—"}</b></span><span>Location: <b className="font-medium text-white">{shoot.location || "—"}</b></span><span>Call Time: <b className="font-medium text-white">{shoot.start_time || "—"}</b></span><span>Expected End Time: <b className="font-medium text-white">{shoot.end_time || "—"}</b></span></div></section>
                <section><h3 className="mb-3 text-sm font-medium">Compensation</h3><div className="rounded-lg border border-[#6E6049] bg-[#2A2824] px-4 py-3 text-sm">Total Compensation <b className="float-right text-[#E8D1AB]">{formatMoney(agreement.compensation_amount ?? snapshot.compensation?.amount, currency)}</b></div></section>
                {agreementSections.length ? agreementSections.map((section, index) => (
                  <section key={section.id || `${section.title}-${index}`} className="border-t border-[#3D3D3D] pt-6 first:border-t-0 first:pt-0">
                    <p className="mb-1 text-xs font-semibold text-[#D8CCBA]">{section.num || String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mb-3 text-base font-medium text-white">{section.title}</h3>
                    <div className="rounded-lg border border-[#6E6049] bg-[#2A2824] px-4 py-3"><SectionContent content={section.content || ""} /></div>
                  </section>
                )) : <section className="agreement-content text-sm leading-6 text-[#D8D8D8]" dangerouslySetInnerHTML={{ __html: agreement.content_html }} />}
              </div>
            </article>
            <AgreementSignatureEvidence response={signatureResponse} />
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-4 text-sm font-semibold">Version History</h2><div className="border-l border-[#5E533F] pl-4"><p className="text-sm font-medium">{agreement.display_version} <span className="ml-2 rounded-full bg-[#D4FFE4] px-2 py-0.5 text-[10px] text-[#16803F]">{titleCase(agreement.status)}</span></p><p className="mt-2 text-xs text-[#AAA7A7]">Created {formatDate(agreement.created_at)}</p><p className="mt-1 text-xs text-[#AAA7A7]">Compensation {formatMoney(agreement.compensation_amount ?? snapshot.compensation?.amount, currency)}</p></div></section>
            <section className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-4 text-sm font-semibold">Activity Log</h2>{events.length ? <div className="space-y-3">{events.map((event, index) => <div key={`${event.event_type}-${index}`} className="border-b border-[#2C2C2C] pb-3 last:border-0"><p className="text-xs font-medium">{titleCase(event.event_type)}</p><p className="mt-1 text-xs text-[#AAA7A7]">{formatDate(event.created_at)}</p></div>)}</div> : <p className="text-sm text-[#AAA7A7]">No activity recorded yet.</p>}</section>
          </aside>
        </div>
      </main>
    </>
  );
}
