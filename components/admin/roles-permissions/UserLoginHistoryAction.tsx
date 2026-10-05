"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Clock3, Globe, Loader2, LogIn, MapPin, RefreshCw } from "lucide-react";
import { adminApi, type UserLoginHistoryResponse } from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type HistoryUser = { id: number; name: string; email: string };

const formatLoginTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium", timeStyle: "long",
  }).format(date);
};

const methodLabel = (value: string) => {
  const labels: Record<string, string> = {
    password: "Password", email_password: "Email & password", google: "Google", otp: "OTP", phone_otp: "Phone OTP",
  };
  return labels[value] || value?.replace(/_/g, " ") || "Unavailable";
};

export function UserLoginHistoryAction({ user }: { user: HistoryUser }) {
  const { canView, isLoading } = usePermissions("roles_permissions");
  const { isDark } = useResolvedTheme();
  const [open, setOpen] = useState(false);
  if (isLoading || !canView) return null;

  return (
    <>
      <button type="button" title="View login history" aria-label={`View login history for ${user.name}`}
        onClick={(event) => { event.stopPropagation(); setOpen(true); }}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
          isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB] hover:bg-[#E8D1AB]/20" : "bg-[#E8D1AB]/30 text-[#8E6A2A] hover:bg-[#E8D1AB]/50"
        }`}>
        <LogIn size={17} aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open && <LoginHistoryContent key={user.id} user={user} />}
      </Dialog>
    </>
  );
}

function LoginHistoryContent({ user }: { user: HistoryUser }) {
  const { isDark } = useResolvedTheme();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'active' | 'all'>('active');
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<UserLoginHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    void (async () => {
      try {
        const response = await adminApi.getUserLoginHistory({ user_id: user.id, page, limit: 10, status }, controller.signal);
        if (controller.signal.aborted) return;
        if (!response.success) throw new Error(response.message || "Unable to load login history.");
        setResult(response);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setError(axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message || "Unable to load login history. Please try again."
          : error instanceof Error ? error.message : "Unable to load login history.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user.id, page, reload, status]);

  const muted = isDark ? "text-white/55" : "text-zinc-500";
  const border = isDark ? "border-white/10" : "border-zinc-200";
  const card = isDark ? "border-white/10 bg-white/[0.025]" : "border-zinc-200 bg-[#FAFAFA]";
  const account = result?.data.find((entry) => entry.user)?.user;
  const pagination = result?.pagination;
  const totalPages = Math.max(1, pagination?.total_pages || 1);
  const secondaryButton = `h-9 rounded-lg border bg-transparent ${border} ${isDark ? "text-white/75 hover:bg-white/5" : "text-zinc-700 hover:bg-black/5"}`;

  return (
    <DialogContent onClick={(event) => event.stopPropagation()}
      className={`flex max-h-[90dvh] w-[calc(100%-24px)] max-w-[780px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 ${
        isDark ? "border-white/10 bg-[#111111] text-white" : "border-zinc-200 bg-white text-[#171717]"
      }`}>
      <DialogHeader className={`shrink-0 border-b p-5 pr-12 text-left sm:p-6 sm:pr-12 ${border}`}>
        <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
          <span className="rounded-xl bg-[#E8D1AB]/15 p-2 text-[#C9A96E]"><LogIn size={22} /></span>
          Sessions & Login History
        </DialogTitle>
        <DialogDescription className={`pt-2 text-sm ${muted}`}>
          Sign-ins for <span className={isDark ? "font-medium text-white" : "font-medium text-zinc-900"}>{user.name}</span>. Times are shown in your local timezone.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6" aria-busy={loading}>
        <div className={`rounded-xl border p-4 ${card}`}>
          <p className="break-words font-semibold">{account?.name || user.name}</p>
          <p className={`mt-1 break-all text-sm ${muted}`}>{account?.email || user.email || "Email unavailable"}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div><dt className={muted}>User ID</dt><dd className="mt-1">{user.id}</dd></div>
            <div><dt className={muted}>Role</dt><dd className="mt-1 break-words">{account?.role || "—"}</dd></div>
            <div><dt className={muted}>Phone</dt><dd className="mt-1 break-words">{account?.phone_number || "—"}</dd></div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`flex gap-1 rounded-xl border p-1 ${border}`} role="group" aria-label="Session filter">
            {(['active', 'all'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={status === value}
                onClick={() => { setStatus(value); setPage(1); }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${status === value ? 'bg-[#E8D1AB] text-[#171717]' : muted}`}>
                {value === 'active' ? 'Active sessions' : 'All history'}
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => setReload((value) => value + 1)} disabled={loading} className={secondaryButton}>
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </Button>
        </div>
        <p className={`text-xs leading-5 ${muted}`}>Active means the sign-in is still valid, not that the person is currently online. Closing a browser does not sign out. Older sign-ins without session tracking appear only in All history.</p>

        {loading ? (
          <div role="status" className={`flex items-center justify-center gap-2 py-12 text-sm ${muted}`}><Loader2 size={20} className="animate-spin" />Loading login history...</div>
        ) : error ? (
          <div role="alert" className={`rounded-xl border p-6 text-center ${card}`}>
            <p className={isDark ? "text-red-300" : "text-red-700"}>{error}</p>
            <Button type="button" variant="beige" className="mt-4 rounded-lg" onClick={() => setReload((value) => value + 1)}>Try again</Button>
          </div>
        ) : !result?.data.length ? (
          <div className={`rounded-xl border border-dashed px-4 py-10 text-center ${border}`}>
            <Clock3 size={28} className="mx-auto text-[#C9A96E]" />
            <p className="mt-3 font-semibold">{status === 'active' ? 'No tracked active sessions' : 'No login history yet'}</p>
            <p className={`mt-1 text-sm ${muted}`}>{status === 'active' ? 'New sign-ins will appear here. Check All history for earlier activity.' : 'There are no recorded sign-ins for this user.'}</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {result.data.map((entry) => (
              <li key={entry.login_history_id} className={`rounded-xl border p-4 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium"><Clock3 size={15} className="shrink-0 text-[#C9A96E]" /><time dateTime={entry.logged_in_at}>{formatLoginTime(entry.logged_in_at)}</time></p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/30 text-[#8E6A2A]"}`}>{methodLabel(entry.login_method)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm font-medium">{entry.browser || 'Unknown browser'} · {entry.os || 'Unknown OS'}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.session_status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : isDark ? 'bg-white/10 text-white/60' : 'bg-zinc-200 text-zinc-600'}`}>
                    {entry.session_status === 'active' ? 'Active' : entry.session_status === 'inactive' ? 'Inactive' : 'Not tracked'}
                  </span>
                  {entry.is_current_session && <span className={`text-xs ${muted}`}>This session</span>}
                </div>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className={`flex items-center gap-1.5 text-xs ${muted}`}><Globe size={13} />IP address</dt><dd className="mt-1 break-all font-mono">{entry.ip_address || "Unavailable"}</dd>{entry.ip_type === 'loopback' && <p className={`mt-1 text-xs ${muted}`}>Localhost · this machine</p>}{entry.ip_type === 'private' && <p className={`mt-1 text-xs ${muted}`}>Private / non-public network</p>}</div>
                  <div><dt className={`flex items-center gap-1.5 text-xs ${muted}`}><MapPin size={13} />Approximate location</dt><dd className="mt-1 break-words">{[entry.city, entry.country].filter(Boolean).join(", ") || (entry.ip_type === 'loopback' || entry.ip_type === 'private' ? 'Not available for local / private IPs' : 'Unavailable — IP lookup may be pending or unsuccessful')}</dd></div>
                  {entry.last_seen_at && <div><dt className={`text-xs ${muted}`}>Last activity</dt><dd className="mt-1">{formatLoginTime(entry.last_seen_at)}</dd></div>}
                  {entry.logged_out_at ? <div><dt className={`text-xs ${muted}`}>Signed out</dt><dd className="mt-1">{formatLoginTime(entry.logged_out_at)}</dd></div> : entry.expires_at && <div><dt className={`text-xs ${muted}`}>Session expiry</dt><dd className="mt-1">{formatLoginTime(entry.expires_at)}</dd></div>}
                </dl>
                {entry.session_status !== 'active' && <p className={`mt-3 text-xs ${muted}`}>{({ logged_out: 'Signed out by the user.', expired: 'Session token expired.', credentials_changed: 'Invalidated by a password or permission change.', account_inactive: 'Account is inactive.', not_tracked: 'This older sign-in has no session tracking; its current status is unknown.' } as Record<string, string>)[entry.inactive_reason || 'not_tracked'] || 'Session is no longer valid.'}</p>}
                <details className={`mt-4 border-t pt-3 ${border}`}>
                  <summary className={`cursor-pointer text-xs font-medium ${muted}`}>Technical details · raw user-agent</summary>
                  <p className={`mt-2 break-all text-xs leading-5 ${muted}`}>{entry.user_agent || "User-agent unavailable"}</p>
                  <p className={`mt-2 text-xs leading-5 ${muted}`}>Browser and OS are reported by the device and can be spoofed. Mozilla, AppleWebKit and Safari may be compatibility tokens, not separate browsers or devices.</p>
                  <p className={`mt-2 text-xs ${muted}`}>Record ID: {entry.login_history_id} · User type ID: {entry.user?.user_type_id ?? "—"}</p>
                </details>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 ${border}`}>
        <p className={`text-xs ${muted}`}>{pagination ? `Page ${pagination.page} of ${totalPages} · ${pagination.total} sign-ins` : "Login history"}</p>
        <div className="flex gap-2">
          <Button type="button" className={secondaryButton} disabled={loading || !pagination || page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} />Previous</Button>
          <Button type="button" className={secondaryButton} disabled={loading || !pagination || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight size={16} /></Button>
        </div>
      </div>
    </DialogContent>
  );
}
