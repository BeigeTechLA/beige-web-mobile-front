"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import { agreementApi, AgreementDocument, type AgreementEvent, type AgreementResponse } from "@/lib/api/agreements";
import { AgreementSignatureEvidence } from "@/components/creator-profile/AgreementSignatureEvidence";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";
import { formatAgreementDate } from "@/lib/utils/agreementDate";

type AgreementSection = { id?: string; num?: string; title?: string; content?: string };

const formatDate = formatAgreementDate;

const titleCase = (value?: string) => (value || "Pending").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

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
  ? <div className="agreement-content" dangerouslySetInnerHTML={{ __html: content }} />
  : <p className="whitespace-pre-wrap">{content}</p>;

export default function ShootAgreementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [events, setEvents] = useState<AgreementEvent[]>([]);
  const [signatureResponse, setSignatureResponse] = useState<AgreementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const agreementId = Number(searchParams.get("agreement_id"));

  useEffect(() => {
    if (!agreementId) {
      router.replace("/creator/dashboard/profile");
      return;
    }
    agreementApi.getCreatorAgreement(agreementId)
      .then((response) => {
        if (response.data.agreement.agreement_type !== "shoot") {
          router.replace(`/creator/dashboard/agreements/general-agreement?agreement_id=${agreementId}`);
          return;
        }
        setAgreement(response.data.agreement);
        setSignatureResponse(response.data.responses.find((item) => item.action === "accepted") || null);
        setEvents(Array.isArray(response.data.events) ? response.data.events : []);
      })
      .catch(() => router.replace("/creator/dashboard/profile"))
      .finally(() => setLoading(false));
  }, [agreementId, router]);

  if (loading || !agreement) return <div className="min-h-screen bg-[#0A0A0A]" aria-busy="true" />;

  const snapshot = agreement.snapshot || {};
  const shoot = snapshot.shoot || {};
  const cp = snapshot.creative_partner || {};
  const role = getPrimaryRoleLabel(cp.role);
  const currency = agreement.currency || snapshot.compensation?.currency || "USD";
  const compensation = Number(agreement.compensation_amount ?? snapshot.compensation?.amount ?? 0);
  const savedSections = getAgreementSections(agreement.content_json);
  const fallbackSections: AgreementSection[] = [
    { title: "Scope of Services", content: String(shoot.scope || "") },
    { title: "Equipment Requirements", content: Array.isArray(shoot.equipment) ? shoot.equipment.join(", ") : String(shoot.equipment || "") },
    { title: "Deliverables / Media Transfer", content: Array.isArray(shoot.deliverables) ? shoot.deliverables.join(", ") : String(shoot.deliverables || "") },
    { title: "Approved Expenses / Travel", content: String(snapshot.extras?.expenses || "") },
    { title: "Special Instructions", content: String(shoot.special_instructions || "") },
  ].filter((section) => section.content.trim());
  const sections = savedSections.length ? savedSections : fallbackSections;
  const statusClass = agreement.status === "accepted"
    ? "bg-[#D4FFE4] text-[#16803F]"
    : agreement.status === "rejected" || agreement.status === "cancelled"
      ? "bg-[#FFDADA] text-[#A31616]"
      : "bg-[#FFF4C9] text-[#A96208]";

  return (
    <>
      <Topbar pathname={pathname} />
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-7 text-white lg:px-10 lg:py-9">
        <Button variant="ghost" className="mb-6 -ml-3 gap-2 hover:bg-transparent hover:text-[#E8D1AB]" onClick={() => router.back()}><ArrowLeft size={18} /> Back</Button>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold lg:text-2xl">Shoot Agreement Detail</h1>
          <span className="rounded bg-[#EDE5D5] px-2 py-0.5 text-xs font-medium text-[#18150F]">{agreement.display_version}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>{titleCase(agreement.status)}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-5 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5 text-xs md:grid-cols-3">
              {[["Project", shoot.name || `Booking #${agreement.booking_id || "—"}`], ["CP", cp.name || "Creative Partner"], ["Role", role], ["Assignment ID", agreement.assignment_id ? `ASN-${agreement.assignment_id}` : "—"], ["Current Version", agreement.display_version], ["Compensation", `${currency} ${compensation.toFixed(2)}`]].map(([label, value]) => <div key={label}><p className="text-[#AAA7A7]">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>)}
            </div>

            <article className="overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]">
              <header className="flex flex-col justify-between gap-3 border-b border-[#3D3D3D] bg-[#202020] p-6 lg:flex-row lg:items-start">
                <div><p className="mb-1 text-xs font-semibold uppercase text-[#D8CCBA]">Shoot Assignment Agreement</p><h2 className="text-2xl text-white">{shoot.name || agreement.title}</h2><p className="mt-1 text-sm text-[#AAA7A7]">{cp.name || "Creative Partner"}{role !== "Creative Partner" ? ` · ${role}` : ""}</p></div>
                <div className="flex flex-wrap gap-2"><span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs">{agreement.display_version}</span><span className="rounded-full bg-[#D4E0FF] px-3 py-1 text-xs text-[#0B2F8B]">Individual Agreement</span></div>
              </header>
              <div className="space-y-7 p-6 lg:p-8">
                <section><h3 className="mb-3 text-sm font-medium">Project Information</h3><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#AAA7A7]"><span>Project Name: <b className="font-medium text-white">{shoot.name || "—"}</b></span><span>Project ID: <b className="font-medium text-white">{agreement.booking_id ? `PRJ-${agreement.booking_id}` : "—"}</b></span><span>Assignment ID: <b className="font-medium text-white">{agreement.assignment_id ? `ASN-${agreement.assignment_id}` : "—"}</b></span><span>Creative Partner: <b className="font-medium text-white">{cp.name || "—"}</b></span><span>Role: <b className="font-medium text-white">{role}</b></span></div></section>
                <section><h3 className="mb-3 text-sm font-medium">Production Details</h3><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#AAA7A7]"><span>Date: <b className="font-medium text-white">{formatDate(shoot.date)}</b></span><span>Location: <b className="font-medium text-white">{shoot.location || "—"}</b></span><span>Call Time: <b className="font-medium text-white">{shoot.start_time || "—"}</b></span><span>Expected End Time: <b className="font-medium text-white">{shoot.end_time || "—"}</b></span></div></section>
                <section><h3 className="mb-3 text-sm font-medium">Compensation</h3><div className="rounded-lg border border-[#6E6049] bg-[#2A2824] px-4 py-3 text-sm">Total Compensation <b className="float-right text-[#E8D1AB]">{currency} {compensation.toFixed(2)}</b></div></section>
                {sections.map((section, index) => <section key={section.id || `${section.title}-${index}`} className="border-t border-dashed border-[#3D3D3D] pt-6"><p className="mb-1 text-xs font-semibold text-[#D8CCBA]">{section.num || String(index + 1).padStart(2, "0")}</p><h3 className="mb-3 text-base font-medium text-white">{section.title}</h3><div className="rounded-lg border border-[#6E6049] bg-[#2A2824] px-4 py-3 text-sm leading-6 text-[#D8D8D8]"><SectionContent content={section.content || ""} /></div></section>)}
                <section className="border-t border-dashed border-[#3D3D3D] pt-6 text-xs leading-5 text-[#9E9690]">This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting, the Creative Partner confirms their ability to perform the assignment as described and agrees to the terms herein and the governing Beige Creative Partner Agreement.<div className="mt-4 flex gap-8"><div><p className="text-[#E8D1AB]">Beige Sheet Version</p><b className="text-white">{agreement.display_version}</b></div><div><p className="text-[#E8D1AB]">Created</p><b className="text-white">{formatDate(agreement.created_at, true)}</b></div></div></section>
              </div>
            </article>
            <AgreementSignatureEvidence response={signatureResponse} />
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-4 text-sm font-semibold">Version History</h2><div className="border-l border-[#5E533F] pl-4"><p className="text-sm font-medium">{agreement.display_version} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${statusClass}`}>{titleCase(agreement.status)}</span></p><p className="mt-2 text-xs text-[#AAA7A7]">Created {formatDate(agreement.created_at, true)}</p><p className="mt-1 text-xs text-[#AAA7A7]">Compensation {currency} {compensation.toFixed(2)}</p><Button className="mt-4 h-9 w-full bg-[#E8D1AB] text-xs font-semibold text-black hover:bg-[#D4C3A3]" onClick={() => router.push(`/creator/dashboard/request/review-agreement?agreement_id=${agreement.agreement_document_id}`)}>Preview Agreement</Button></div></section>
            <section className="rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5"><h2 className="mb-4 text-sm font-semibold">Activity Log</h2>{events.length ? <div className="space-y-3">{events.map((event) => <div key={event.agreement_event_id} className="border-b border-[#2C2C2C] pb-3 last:border-0"><p className="text-xs font-medium">{titleCase(event.event_type)}</p><p className="mt-1 text-xs text-[#AAA7A7]">{formatDate(event.occurred_at, true)}</p></div>)}</div> : <p className="text-sm text-[#AAA7A7]">No activity recorded yet.</p>}</section>
          </aside>
        </div>
      </main>
    </>
  );
}
