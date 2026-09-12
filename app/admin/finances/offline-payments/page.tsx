"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { offlinePaymentsApi, type OfflineSubmission, type OfflineSubmissionStatus } from "@/lib/api/offlinePayments";

const statuses: Array<{ value: OfflineSubmissionStatus; label: string }> = [
  { value: "pending_verification", label: "Pending verification" }, { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially paid" }, { value: "rejected", label: "Rejected" }, { value: "needs_follow_up", label: "Needs follow-up" },
];
const formatStatus = (status?: string) => String(status || "pending_verification").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const formatMoney = (value: number) => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function OfflinePaymentsAdminPage() {
  const [status, setStatus] = useState<OfflineSubmissionStatus>("pending_verification");
  const [items, setItems] = useState<OfflineSubmission[]>([]);
  const [selected, setSelected] = useState<OfflineSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [pendingReviewStatus, setPendingReviewStatus] = useState<Exclude<OfflineSubmissionStatus, "pending_verification"> | null>(null);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const loadList = async (nextStatus = status) => {
    setLoading(true); setError("");
    try { setItems(await offlinePaymentsApi.listSubmissions(nextStatus)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load submissions."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadList(status); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (submission: OfflineSubmission) => {
    const id = submission.id || submission.submission_id;
    if (!id) return;
    setSelected(submission); setDetailLoading(true); setReviewNotes(""); setError("");
    try { setSelected(await offlinePaymentsApi.getSubmission(id)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load submission details."); }
    finally { setDetailLoading(false); }
  };
  const review = async () => {
    if (!pendingReviewStatus) return;
    if (!selected) return;
    const id = selected.id || selected.submission_id;
    if (!id) return;
    setReviewing(true); setError("");
    try { const updated = await offlinePaymentsApi.reviewSubmission(id, pendingReviewStatus, reviewNotes); setSelected(updated); setPendingReviewStatus(null); await loadList(status); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update this submission."); }
    finally { setReviewing(false); }
  };
  const reviewer = selected?.reviewed_by && (typeof selected.reviewed_by === "string" ? selected.reviewed_by : selected.reviewed_by.name || selected.reviewed_by.email);

  return <><Topbar pathname="/admin/finances/offline-payments" /><main className="min-h-screen p-4 text-white lg:p-9 lg:px-10"><div className="mx-auto max-w-7xl"><h1 className="text-2xl font-semibold">Wire/Zelle Submissions</h1><p className="mt-1 text-sm text-white/60">Review customer-submitted offline payment confirmations.</p><div className="mt-6 flex flex-wrap gap-2">{statuses.map((option) => <Button key={option.value} onClick={() => { setSelected(null); setStatus(option.value); }} variant="outline" className={status === option.value ? "border-[#E8D1AB] bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]" : "border-white/20 bg-transparent text-white hover:bg-white/10"}>{option.label}</Button>)}</div>{error && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50"><tr><th className="p-4">Booking / project</th><th className="p-4">Guest email</th><th className="p-4">Method</th><th className="p-4">Amount</th><th className="p-4">Reference</th><th className="p-4">Status</th><th className="p-4">Submitted</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-[#E8D1AB]" /></td></tr> : items.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-white/50">No submissions found.</td></tr> : items.map((item) => <tr key={item.id || item.submission_id} onClick={() => void open(item)} className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"><td className="p-4 font-medium">{item.project_name || item.booking_name || (item.booking_id ? `Booking #${item.booking_id}` : "—")}</td><td className="p-4 text-white/70">{item.guest_email || "—"}</td><td className="p-4">{item.payment_method === "wire_transfer" ? "Wire Transfer" : "Zelle"}</td><td className="p-4">{formatMoney(item.payment_amount)}</td><td className="p-4">{item.payment_reference || "—"}</td><td className="p-4"><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{formatStatus(item.status)}</span></td><td className="p-4 text-white/60">{formatDate(item.submitted_at || item.created_at)}</td></tr>)}</tbody></table></div>
    {selected && <section className="mt-6 rounded-xl border border-white/10 bg-[#101010] p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Submission details</h2><p className="mt-1 text-sm text-white/60">{detailLoading ? "Loading details…" : `Status: ${formatStatus(selected.status)}`}</p></div><Button variant="ghost" onClick={() => setSelected(null)} className="text-white">Close</Button></div>{!detailLoading && <div className="mt-5 grid gap-4 text-sm md:grid-cols-2"><div><span className="text-white/50">Booking / project</span><p>{selected.project_name || selected.booking_name || `Booking #${selected.booking_id || "—"}`}</p></div><div><span className="text-white/50">Guest email</span><p>{selected.guest_email || "—"}</p></div><div><span className="text-white/50">Payment method</span><p>{selected.payment_method === "wire_transfer" ? "Wire Transfer" : "Zelle"}</p></div><div><span className="text-white/50">Submitted amount</span><p>{formatMoney(selected.payment_amount)}</p></div><div><span className="text-white/50">Reference</span><p>{selected.payment_reference || "—"}</p></div><div><span className="text-white/50">Submitted</span><p>{formatDate(selected.submitted_at || selected.created_at)}</p></div><div className="md:col-span-2"><span className="text-white/50">Customer note</span><p className="whitespace-pre-wrap">{selected.customer_note || "—"}</p></div>{selected.proof_file_url && <div className="md:col-span-2"><a href={selected.proof_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#E8D1AB] underline">View or download proof file <ExternalLink size={15} /></a></div>}{reviewer && <div><span className="text-white/50">Reviewed by</span><p>{reviewer}</p></div>}{selected.reviewed_at && <div><span className="text-white/50">Reviewed at</span><p>{formatDate(selected.reviewed_at)}</p></div>}{selected.review_notes && <div className="md:col-span-2"><span className="text-white/50">Review notes</span><p className="whitespace-pre-wrap">{selected.review_notes}</p></div>}</div>}
      {!detailLoading && <div className="mt-6 border-t border-white/10 pt-5"><div className="mt-4 flex flex-wrap gap-2"><Button disabled={reviewing} onClick={() => setPendingReviewStatus("paid")} className="bg-emerald-600 hover:bg-emerald-700">Confirm Full (Paid)</Button><Button disabled={reviewing} onClick={() => setPendingReviewStatus("partially_paid")} className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a]">Confirm Partial</Button><Button disabled={reviewing} onClick={() => setPendingReviewStatus("needs_follow_up")} variant="outline" className="border-white/20 text-white hover:bg-white/10">Needs Follow-Up</Button><Button disabled={reviewing} onClick={() => setPendingReviewStatus("rejected")} variant="destructive">Reject</Button></div>{pendingReviewStatus && <div className="mt-4 rounded-lg border border-[#E8D1AB]/30 bg-[#171717] p-4"><p className="font-medium">Confirm {formatStatus(pendingReviewStatus)}</p><label className="mt-3 block text-sm">Review notes <span className="text-white/40">(optional)</span><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-white" /></label><div className="mt-3 flex gap-2"><Button disabled={reviewing} onClick={() => void review()} className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a]">{reviewing ? <Loader2 className="animate-spin" /> : "Confirm status"}</Button><Button disabled={reviewing} variant="ghost" className="text-white" onClick={() => setPendingReviewStatus(null)}>Cancel</Button></div></div>}</div>}</section>}</div></main></>;
}
