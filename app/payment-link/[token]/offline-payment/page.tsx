"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Copy, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { offlinePaymentsApi, type OfflinePaymentInstructions, type OfflinePaymentMethod } from "@/lib/api/offlinePayments";

const money = (amount: number) => amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><div><p className="text-xs text-white/50">{label}</p><p className="break-all text-sm text-white">{value}</p></div><button type="button" onClick={copy} className="shrink-0 p-2 text-[#E8D1AB]" aria-label={`Copy ${label}`}><Copy size={16} />{copied && <span className="sr-only">Copied</span>}</button></div>;
}

export default function OfflinePaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [instructions, setInstructions] = useState<OfflinePaymentInstructions | null>(null);
  const [method, setMethod] = useState<OfflinePaymentMethod>("wire_transfer");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    offlinePaymentsApi.getInstructions(token).then((data) => {
      setInstructions(data); setAmount(String(data.amount_due)); setReference(data.payment_reference);
    }).catch((requestError: Error) => setError(requestError.message || "Unable to load payment instructions.")).finally(() => setLoading(false));
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!proof) { setError("Proof of payment is required."); return; }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) { setError("Enter a valid payment amount."); return; }
    const formData = new FormData();
    formData.append("payment_method", method); formData.append("payment_amount", amount); formData.append("payment_reference", reference);
    if (note.trim()) formData.append("customer_note", note.trim());
    formData.append("proof_file", proof);
    setSubmitting(true);
    try { await offlinePaymentsApi.submitConfirmation(token, formData); setSubmitted(true); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to submit your payment confirmation."); }
    finally { setSubmitting(false); }
  };

  return <main className="flex min-h-screen flex-col bg-[#101010] text-white"><Navbar /><div className="flex-grow px-4 pb-20 pt-32"><div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E8D1AB]/20 bg-[#171717] p-6 shadow-2xl md:p-10">
    {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#E8D1AB]" /></div> : error && !instructions ? <p className="text-center text-red-400">{error}</p> : submitted ? <div className="py-12 text-center"><CheckCircle className="mx-auto mb-5 h-16 w-16 text-green-500" /><h1 className="mb-3 text-2xl font-bold">Confirmation submitted</h1><p className="text-white/70">Your payment confirmation has been submitted and is pending verification by our team.</p></div> : instructions && <><h1 className="text-2xl font-bold md:text-3xl">Complete your payment</h1><p className="mt-2 text-white/60">Send the amount below, then upload your payment proof for review.</p>
      <div className="my-6 flex rounded-xl border border-white/10 p-1"><button type="button" onClick={() => setMethod("wire_transfer")} className={`flex-1 rounded-lg py-3 text-sm font-semibold ${method === "wire_transfer" ? "bg-[#E8D1AB] text-black" : "text-white/70"}`}>Wire Transfer</button><button type="button" onClick={() => setMethod("zelle")} className={`flex-1 rounded-lg py-3 text-sm font-semibold ${method === "zelle" ? "bg-[#E8D1AB] text-black" : "text-white/70"}`}>Zelle</button></div>
      <div className="space-y-3"><CopyValue label="Amount due" value={money(instructions.amount_due)} /><CopyValue label="Payment reference" value={instructions.payment_reference} />{method === "zelle" ? <><CopyValue label="Recipient name" value={instructions.zelle.recipient_name} /><CopyValue label="Zelle contact" value={instructions.zelle.recipient_contact} /></> : <><CopyValue label="Bank name" value={instructions.wire_transfer.bank_name} /><CopyValue label="Account holder" value={instructions.wire_transfer.account_holder_name} /><CopyValue label="Routing number" value={instructions.wire_transfer.routing_number} /><CopyValue label="Account number" value={instructions.wire_transfer.account_number} /><CopyValue label="SWIFT / BIC" value={instructions.wire_transfer.swift_bic} /></>}</div>
      <form onSubmit={submit} className="mt-8 space-y-4 border-t border-white/10 pt-7"><h2 className="text-lg font-semibold">Confirm payment</h2>{error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<label className="block text-sm">Payment amount<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-3 text-white" /></label><label className="block text-sm">Payment reference / transaction note<input required value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-3 text-white" /></label><label className="block text-sm">Proof of payment <span className="text-red-300">*</span><span className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 p-3 text-white/60"><Upload size={17} />{proof?.name || "Upload image or PDF"}<input required type="file" accept="image/*,application/pdf" onChange={(e) => setProof(e.target.files?.[0] || null)} className="sr-only" /></span></label><label className="block text-sm">Customer note <span className="text-white/40">(optional)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-3 text-white" /></label><Button type="submit" disabled={submitting} className="h-12 w-full bg-[#E8D1AB] text-base font-bold text-black hover:bg-[#dcb98a]">{submitting ? <Loader2 className="animate-spin" /> : "Submit payment confirmation"}</Button></form></>}
  </div></div><Footer /></main>;
}
