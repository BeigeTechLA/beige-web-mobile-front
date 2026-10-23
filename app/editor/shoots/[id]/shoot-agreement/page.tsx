"use client";

import React, { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import ModalShell from "@/components/admin/shoot-details/ModalShell";
import SuccessModal from "@/components/admin/finances/SuccessModal";
import Image from "next/image";

/**
 * Editor – Shoot Assignment Agreement (dummy data, no API calls).
 * The editor reviews the agreement, ticks the confirmation and then accepts or
 * rejects it. Accept → success modal ("View Shoot"); Reject → reason modal →
 * rejected modal.
 */


/* Types + dummy data */
type AgreementStatus = "pending_acceptance" | "accepted" | "rejected";

interface EditorAgreement {
  shootId: string;
  title: string;
  version: string;
  status: AgreementStatus;
  projectName: string;
  shootCode: string;
  assignmentId: string;
  editorName: string;
  role: string;
  compensation: number;
  currency: string;
  sections: { id: string; title: string; content: string }[];
  createdAt: string; // ISO
}

const LOREM = "Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley";

const DUMMY_AGREEMENT: EditorAgreement = {
  shootId: "123456",
  title: "Hotel Brand Film",
  version: "v1.0",
  status: "pending_acceptance",
  projectName: "Hotel Brand Film - Videography",
  shootCode: "#123456",
  assignmentId: "ASN-2012",
  editorName: "Zara Khan",
  role: "External Editor",
  compensation: 6250,
  currency: "USD",
  sections: [
    { id: "scope", title: "Scope of Services", content: LOREM },
    { id: "deliverables", title: "Deliverables", content: LOREM },
    { id: "turnaround", title: "Expected Turnaround", content: LOREM },
    { id: "revisions", title: "Revision Expectations", content: LOREM },
    { id: "transfer", title: "File Transfer Requirements", content: LOREM },
    { id: "expenses", title: "Expenses, if applicable", content: LOREM },
    { id: "instructions", title: "Any Specific Instructions", content: LOREM },
  ],
  createdAt: "2026-09-15T12:20:00",
};

const STATUS_PILL: Record<AgreementStatus, { label: string; cls: string; dot: string }> = {
  pending_acceptance: { label: "Pending Acceptance", cls: "bg-[#FEF9EC] text-[#D68910]", dot: "bg-[#D68910]" },
  accepted: { label: "Accepted", cls: "bg-[#E6F8EE] text-[#15965A]", dot: "bg-[#18B47B]" },
  rejected: { label: "Rejected", cls: "bg-[#FDE8E9] text-[#D93A44]", dot: "bg-[#EF3B45]" },
};

const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

/** "15 Sep 2026, 12:20 PM" */
const formatCreated = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));


/* Page */
export default function EditorShootAgreementPage({
  shootBasePath = "/admin/shoots",
}: {
  /** "View Shoot" goes to `${shootBasePath}/${id}` */
  shootBasePath?: string;
}) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const [mounted, setMounted] = useState(false);

  const [agreement, setAgreement] = useState<EditorAgreement>(DUMMY_AGREEMENT);
  const [confirmed, setConfirmed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [modal, setModal] = useState<"none" | "accepted" | "reject" | "rejected">("none");

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  const shootId = params?.id ?? agreement.shootId;
  const isPending = agreement.status === "pending_acceptance";
  const pill = STATUS_PILL[agreement.status];

  /* ---------- actions (dummy) ---------- */
  const handleAccept = async () => {
    if (!confirmed || accepting) return;
    setAccepting(true);
    await wait(600); // swap for the API call
    setAgreement((a) => ({ ...a, status: "accepted" }));
    setAccepting(false);
    setModal("accepted");
  };

  const handleReject = async (reason: string) => {
    await wait(600); // swap for the API call (send `reason`)
    setAgreement((a) => ({ ...a, status: "rejected" }));
    setModal("rejected");
    return reason;
  };

  const goToShoot = () => {
    setModal("none");
    router.push(`${shootBasePath}/${shootId}`);
  };

  /* ---------- styles ---------- */
  const t = {
    page: isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F7F7F7] text-[#111]",
    card: isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white",
    head: isDark ? "border-[#3D3D3D] bg-[#202020]" : "border-[#E5E5E5] bg-[#FBF7EF]",
    dash: isDark ? "border-[#3D3D3D]" : "border-[#E2DDD3]",
    panel: isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : "border-[#E8D9BE] bg-[#FFFBF3]",
    strong: isDark ? "text-white" : "text-[#111]",
    body: isDark ? "text-white/70" : "text-[#333]",
    muted: isDark ? "text-[#AAA7A7]" : "text-[#6B6B6B]",
    faint: isDark ? "text-[#9E9690]" : "text-[#8A8A8A]",
    gold: isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]",
    label: isDark ? "text-[#D8CCBA]" : "text-[#8C6A00]",
  };

  const infoItems: { label: string; value: string; valueCls?: string }[] = [
    { label: "Project Name", value: agreement.projectName },
    { label: "Shoot ID", value: agreement.shootCode },
    { label: "Assignment ID", value: agreement.assignmentId },
    { label: "Editor Name", value: agreement.editorName, valueCls: t.gold },
    { label: "Role", value: agreement.role, valueCls: isDark ? "text-[#C3B9FD]" : "text-[#6C5CE7]" },
  ];

  return (
    <>
      <Topbar pathname={pathname} />

      <main
        className={`min-h-screen px-4 py-6 lg:px-10 lg:py-7 ${t.page}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className={`mb-5 lg:mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/85 hover:text-[#E8D1AB]" : "text-black/70 hover:text-black"}`}
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* ------ AGREEMENT ------ */}
        <article className={`overflow-hidden rounded-2xl border ${t.card}`}>
          <header className={`flex items-start justify-between gap-3 p-4 lg:px-8 lg:py-7 ${t.head}`}>
            <div className="min-w-0">
              <p className={`mb-1 text-[10px] lg:text-xs font-semibold uppercase tracking-[0.08em] ${t.label}`}>Shoot Assignment Agreement</p>
              <h1 className={`text-lg lg:text-3xl ${t.strong}`}>{agreement.title}</h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${isDark ? "bg-white/10 text-[#D8CCBA]" : "bg-black/5 text-[#333]"}`}>{agreement.version}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${pill.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} aria-hidden="true" />
                {pill.label}
              </span>
            </div>
          </header>

          {/* Project Information */}
          <section className="p-5 lg:p-9 space-y-3 lg:space-y-5">
            <h2 className={`text-base lg:text-xl font-medium ${t.strong}`}>Project Information</h2>
            <dl className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:gap-y-2">
              {infoItems.map((item, i) => (
                <div key={item.label} className="flex items-center text-xs lg:text-sm">
                  {i > 0 && <span className={`hidden sm:inline-block mx-4 h-4 w-px ${isDark ? "bg-[#E0E0E0]" : "bg-black/20"}`} aria-hidden="true" />}
                  <dt className={t.muted}>{item.label} :</dt>
                  <dd className={`ml-1 ${item.valueCls ?? t.strong}`}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Compensation */}
          <section className={`border-t p-5 lg:p-9 space-y-3 lg:space-y-5 ${t.dash}`}>
            <h2 className={`text-base lg:text-xl font-medium ${t.strong}`}>Compensation</h2>
            <div className={`flex items-center justify-between gap-3 rounded-xl border p-5 ${t.panel}`}>
              <span className={`text-sm lg:text-base ${t.strong}`}>Total Compensation</span>
              <span className={`text-lg lg:text-2xl font-semibold ${t.gold}`}>{formatMoney(agreement.compensation, agreement.currency)}</span>
            </div>
          </section>

          {/* Agreement sections */}
          {agreement.sections.map((section) => (
            <section key={section.id} className={`border-t p-5 lg:p-9 space-y-3 lg:space-y-5 ${t.dash}`}>
              <h2 className={`text-base lg:text-xl font-medium ${t.strong}`}>{section.title}</h2>
              <div className={`rounded-xl border px-4 py-3 lg:px-5 lg:py-3.5 ${t.panel}`}>
                <p className={`whitespace-pre-wrap text-xs sm:text-sm leading-6 ${t.body}`}>{section.content}</p>
              </div>
            </section>
          ))}

          {/* Legal note + meta */}
          <section className="px-5 pb-5 lg:px-9 lg:pb-9 space-y-3 lg:space-y-5">
            <p className={`text-xs lg:text-sm leading-5 ${t.faint}`}>
              This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting, the
              Creative Partner confirms their ability to perform the assignment as described and agrees to the terms
              herein and the governing Beige Creative Partner Agreement. Both parties acknowledge that acceptance creates
              a binding commitment for the specified production.
            </p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <dt className={`text-xs lg:text-sm ${t.gold}`}>Beige Sheet Version</dt>
                <dd className={`mt-1 lg:mt-2 text-sm lg:text-base font-semibold ${t.strong}`}>{agreement.version}</dd>
              </div>
              <div>
                <dt className={`text-xs lg:text-sm ${t.gold}`}>Created</dt>
                <dd className={`mt-1 lg:mt-2 text-sm lg:text-base font-semibold ${t.strong}`}>{formatCreated(agreement.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </article>

        {/* ------ ACCEPTANCE ------ */}
        <section className={`mt-6 rounded-2xl border p-4 sm:p-6 ${t.card}`}>
          <h2 className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.04em] ${t.gold}`}>Assignment Acceptance</h2>

          {isPending ? (
            <>
              <label className="relative mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="peer sr-only !left-0 !top-0"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#E8D1AB] ${confirmed
                    ? "border-[#E8D1AB] bg-[#E8D1AB]"
                    : isDark ? "border-white bg-transparent" : "border-[#A3A3A3] bg-white"}`}
                >
                  {confirmed && <Check size={13} strokeWidth={3} className="text-black" />}
                </span>
                <span className={`text-xs lg:text-sm leading-6 ${isDark ? "text-white" : "text-black"}`}>
                  By selecting ‘Accept Assignment,’ I confirm that I have reviewed this Beige Sheet and agree to perform
                  this Assignment according to its terms and the Beige Creative Partner Agreement. I understand that
                  accepting this Assignment creates a binding project commitment.
                </span>
              </label>

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!confirmed || accepting}
                  className={`h-12 flex-1 rounded-lg text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 ${confirmed
                    ? "bg-[#10B981] text-white hover:bg-[#15A06D]"
                    : isDark ? "bg-[#10B981]/50 text-white/50 cursor-not-allowed" : "bg-[#A8DEC6] text-white/80 cursor-not-allowed"}`}
                >
                  {accepting && <Loader2 size={16} className="animate-spin" />}
                  Accept Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setModal("reject")}
                  disabled={!confirmed || accepting}
                  className={`h-12 rounded-lg px-7 text-sm font-semibold transition-colors sm:w-auto ${confirmed
                    ? "bg-[#EF4444] text-white hover:bg-[#DC2F39]"
                    : isDark ? "bg-[#EF4444]/50 text-white/50 cursor-not-allowed" : "bg-[#F4B5B8] text-white/80 cursor-not-allowed"}`}
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm ${t.body}`}>
                {agreement.status === "accepted"
                  ? "You accepted this assignment. It’s now confirmed and ready for the next steps."
                  : "You rejected this agreement. The admin has been notified and will review it."}
              </p>
              {agreement.status === "accepted" && (
                <button
                  type="button"
                  onClick={goToShoot}
                  className="h-10 shrink-0 rounded-lg bg-[#E8D3AE] px-5 text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC]"
                >
                  View Shoot
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ------ MODALS ------ */}
      <ResultModal
        open={modal === "accepted"}
        isDark={isDark}
        title="Assignment Accepted Successfully"
        message={<>The shoot agreement has been accepted by the Editor.<br />The assignment is now confirmed and ready for the next steps.</>}
        actionLabel="View Shoot"
        onAction={goToShoot}
        onClose={() => setModal("none")}
      />

      <RejectAgreementModal
        open={modal === "reject"}
        isDark={isDark}
        onClose={() => setModal("none")}
        onSubmit={handleReject}
      />

      <ResultModal
        open={modal === "rejected"}
        isDark={isDark}
        title="Agreement Rejected"
        message={<>The agreement has been rejected successfully.<br />The admin has been notified and will review the rejection.</>}
        onClose={() => setModal("none")}
      />
    </>
  );
}


/* Modals */
function ResultModal({
  open,
  isDark,
  title,
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  open: boolean;
  isDark: boolean;
  title: string;
  message: React.ReactNode;
  /** Omit for a message-only modal (closes via Esc / backdrop) */
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      maxWidth="max-w-lg"
      className="p-7 text-center"
    >
      <div className="relative w-[360px] h-[220px] mx-auto">
        <Image
          src="/images/misc/PaymentSuccess.gif"
          alt="Payment Done"
          fill
          className="object-contain"
          priority
          unoptimized
        />
      </div>
      <h2 id={titleId} className="mt-2 text-lg lg:text-2xl font-medium">{title}</h2>
      <p id={descId} className={`mt-2 mx-7 text-sm lg:text-base leading-relaxed ${isDark ? "text-[#A0A0A0]" : "text-zinc-500"}`}>{message}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          autoFocus
          className="mt-6 h-12 w-full rounded-lg bg-[#E8D1AB] text-sm font-semibold text-[#101010] transition-colors hover:bg-[#EEDCBC]"
        >
          {actionLabel}
        </button>
      )}
    </ModalShell>
  );
}

function RejectAgreementModal({
  open,
  isDark,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isDark: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const titleId = useId();
  const descId = useId();
  const fieldId = useId();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fresh form every time it opens
  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = reason.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } catch {
      toast.error("Couldn't reject the agreement. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      dismissible={!submitting}
      maxWidth="max-w-[606px]"
      className="p-5 lg:p-6"
    >
      <form onSubmit={submit}>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#281918] text-[#F58083]" : "bg-[#FDE8E9] text-[#D93A44]"}`}>
            <AlertCircle size={20} />
          </span>
          <h2 id={titleId} className="text-base lg:text-xl font-medium">Why are you rejecting this agreement?</h2>
        </div>
        <p id={descId} className={`mt-3 text-sm lg:text-base leading-relaxed max-w-sm ${isDark ? "text-[#A0A0A0]" : "text-zinc-500"}`}>
          Your reason will be shared with the assignment team and saved in the activity history.
        </p>

        {/* Outlined field with the label sitting on the border */}
        <div className="relative mt-5 lg:mt-9">
          <label
            htmlFor={fieldId}
            className={`absolute -top-2.5 left-5 px-2 text-sm lg:text-base ${isDark ? "bg-black text-[#A3A3A3]" : "bg-white text-zinc-500"}`}
          >
            Rejection reason<span className="text-white/60">*</span>
          </label>
          <textarea
            id={fieldId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you cannot accept the agreement"
            rows={4}
            maxLength={1000}
            required
            autoFocus
            className={`w-full resize-none rounded-xl border bg-transparent p-5 text-sm lg:text-base h-[158px] focus:outline-none transition-colors ${isDark
              ? "border-white/50 text-white placeholder:text-white/50"
              : "border-[#DADADA] text-[#202020] placeholder:text-black/35"}`}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`h-12 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? "bg-[#1F1F1F] border border-[#262626] text-white hover:bg-[#2A2A2A]" : "bg-[#F0F0F0] text-[#202020] hover:bg-[#E5E5E5]"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!trimmed || submitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Reject Agreement
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
