"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/redux/features/auth/authApi";

const primaryButtonClass = "h-12 w-full rounded-xl text-base font-semibold sm:h-14 focus-visible:ring-[#E8D1AB] focus-visible:ring-offset-[#151515]";
const passwordInputClass = "h-14 rounded-xl border-white/15 bg-[#1C1C1C] pr-14 text-base placeholder:text-white/30 focus-visible:border-[#E8D1AB]";

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  }
  return fallback;
}

export default function PasswordExpiredPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestOtp, { isLoading: isRequesting }] = authApi.useRequestPasswordExpiryOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = authApi.useVerifyPasswordExpiryOtpMutation();
  const [changePassword, { isLoading: isChanging }] = authApi.useChangeExpiredPasswordMutation();

  const busy = isRequesting || isVerifying || isChanging;
  const otpComplete = digits.every((digit) => /^\d$/.test(digit));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (!resendSeconds) return;
    const timeout = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  useEffect(() => {
    if (verified) passwordRef.current?.focus();
    else if (codeSent) inputRefs.current[0]?.focus();
  }, [verified, codeSent]);

  const enterDigits = (index: number, value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (value && !numbers) return;
    setError("");
    const start = numbers.length === 6 ? 0 : index;
    const nextDigits = [...digits];
    if (!numbers) nextDigits[index] = "";
    else numbers.slice(0, 6 - start).split("").forEach((digit, offset) => { nextDigits[start + offset] = digit; });
    setDigits(nextDigits);
    if (numbers) inputRefs.current[Math.min(start + numbers.length, 5)]?.focus();
  };

  const navigateDigits = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigits((current) => current.map((digit, position) => position === index - 1 ? "" : digit));
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      inputRefs.current[Math.max(0, Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)))]?.focus();
    }
  };

  const sendOtp = async () => {
    if (busy || resendSeconds > 0) return;
    setError("");
    try {
      const result = await requestOtp().unwrap();
      setCodeSent(true);
      setDigits(Array(6).fill(""));
      setResendSeconds(60);
      inputRefs.current[0]?.focus();
      toast.success(result.message);
    } catch (error: unknown) {
      setError(errorMessage(error, "Could not send a verification code. Please try again."));
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !otpComplete) return;
    setError("");
    try {
      const result = await verifyOtp({ otp: digits.join("") }).unwrap();
      setVerified(true);
      toast.success(result.message);
    } catch (error: unknown) {
      setError(errorMessage(error, "The verification code is invalid or expired."));
    }
  };

  const change = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (newPassword.length < 8) return setError("Use at least 8 characters for your new password.");
    if (!passwordsMatch) return setError("Passwords do not match.");
    setError("");
    try {
      const result = await changePassword({ newPassword, confirmPassword }).unwrap();
      toast.success(result.message);
      if (await logout()) router.replace("/login");
    } catch (error: unknown) {
      setError(errorMessage(error, "Could not change your password. Please try again."));
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#101010] px-4 py-8 text-white sm:py-12" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div className="w-full max-w-[520px]">
        <div className="mb-7 text-center text-xl font-medium tracking-[0.3em] text-[#E8D1AB]" aria-label="Beige">BEIGE</div>
        <section aria-labelledby="password-expiry-title" className="rounded-3xl border border-white/10 bg-[#151515] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-10">
          <ol aria-label="Password update progress" className="mb-8 flex items-center gap-3 text-xs font-medium sm:text-sm">
            <li aria-current={!verified ? "step" : undefined} className="flex items-center gap-2 text-[#E8D1AB]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8D1AB]/10">{verified ? <Check size={14} aria-hidden="true" /> : "1"}</span>
              Verify email
            </li>
            <li aria-hidden="true" className="h-px flex-1 bg-white/10" />
            <li aria-current={verified ? "step" : undefined} className={`flex items-center gap-2 ${verified ? "text-[#E8D1AB]" : "text-white/40"}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${verified ? "bg-[#E8D1AB]/10" : "bg-white/5"}`}>2</span>
              New password
            </li>
          </ol>

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8D1AB]/15 bg-[#E8D1AB]/10 text-[#E8D1AB]">
            {verified ? <LockKeyhole size={25} aria-hidden="true" /> : <Mail size={25} aria-hidden="true" />}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E8D1AB]">Security update required</p>
          <h1 id="password-expiry-title" className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
            {verified ? "Create a new password" : codeSent ? "Check your email" : "Your password has expired"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {verified
              ? "Your email is verified. Set a new password to regain access to your dashboard."
              : codeSent
                ? "Enter the 6-digit code sent to your registered email address. The code is valid for 10 minutes."
                : "Keep your account secure with a new password. First, we’ll send a 6-digit verification code to your registered email."}
          </p>

          {!verified ? (
            <form className="mt-7 space-y-5" onSubmit={verify}>
              {codeSent && (
                <fieldset disabled={busy}>
                  <legend className="mb-3 text-sm font-medium text-white/80">Verification code</legend>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {digits.map((digit, index) => (
                      <input key={index} ref={(element) => { inputRefs.current[index] = element; }}
                        type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`Verification code digit ${index + 1}`} aria-invalid={Boolean(error)} aria-describedby={error ? "expiry-error" : undefined}
                        value={digit} pattern="[0-9]" required
                        onChange={(event) => enterDigits(index, event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        onKeyDown={(event) => navigateDigits(index, event)}
                        onPaste={(event) => { event.preventDefault(); enterDigits(index, event.clipboardData.getData("text")); }}
                        className={`h-12 w-full min-w-0 rounded-xl border bg-[#1C1C1C] text-center text-xl font-semibold text-white caret-[#E8D1AB] outline-none transition-colors focus:border-[#E8D1AB] focus:ring-2 focus:ring-[#E8D1AB]/20 disabled:opacity-50 sm:h-16 sm:text-2xl ${error ? "border-red-400/60" : digit ? "border-[#E8D1AB]/50" : "border-white/15"}`} />
                    ))}
                  </div>
                </fieldset>
              )}
              {error && <p id="expiry-error" role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</p>}
              {codeSent ? (
                <>
                  <Button variant="beige" type="submit" className={primaryButtonClass} disabled={busy || !otpComplete}>
                    {isVerifying ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                    {isVerifying ? "Verifying..." : "Verify email"}
                    {!isVerifying && <ArrowRight aria-hidden="true" />}
                  </Button>
                  <p className="text-center text-sm text-white/50">
                    Didn’t receive a code?{" "}
                    <button type="button" onClick={sendOtp} disabled={busy || resendSeconds > 0}
                      className="rounded text-[#E8D1AB] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-[#E8D1AB] disabled:cursor-not-allowed disabled:text-white/40 disabled:no-underline">
                      {isRequesting ? "Sending..." : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                    </button>
                  </p>
                </>
              ) : (
                <Button variant="beige" type="button" className={primaryButtonClass} disabled={busy} onClick={sendOtp}>
                  {isRequesting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
                  {isRequesting ? "Sending code..." : "Send verification code"}
                </Button>
              )}
            </form>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={change}>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-white/80">New password</Label>
                <div className="relative">
                  <Input ref={passwordRef} id="password" autoComplete="new-password" type={showPassword ? "text" : "password"}
                    value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError(""); }}
                    minLength={8} required disabled={busy} placeholder="Enter a new password" aria-describedby="password-help" className={passwordInputClass} />
                  <button type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-1 right-1 flex w-12 items-center justify-center rounded-lg text-white/50 hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB]">
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                <p id="password-help" className={`text-xs ${newPassword.length >= 8 ? "text-[#E8D1AB]" : "text-white/45"}`}>Use at least 8 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm text-white/80">Confirm new password</Label>
                <div className="relative">
                  <Input id="confirm-password" autoComplete="new-password" type={showConfirmation ? "text" : "password"}
                    value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }}
                    minLength={8} required disabled={busy} placeholder="Re-enter your password" className={passwordInputClass}
                    aria-invalid={confirmPassword.length > 0 && !passwordsMatch} aria-describedby={confirmPassword ? "password-match" : undefined} />
                  <button type="button" aria-label={showConfirmation ? "Hide confirm password" : "Show confirm password"} aria-pressed={showConfirmation}
                    onClick={() => setShowConfirmation(!showConfirmation)} className="absolute inset-y-1 right-1 flex w-12 items-center justify-center rounded-lg text-white/50 hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB]">
                    {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {confirmPassword && <p id="password-match" className={`text-xs ${passwordsMatch ? "text-[#E8D1AB]" : "text-red-300"}`}>{passwordsMatch ? "Passwords match." : "Passwords do not match yet."}</p>}
              </div>
              {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</p>}
              <Button variant="beige" type="submit" className={primaryButtonClass} disabled={busy || newPassword.length < 8 || !passwordsMatch}>
                {isChanging ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {isChanging ? "Updating password..." : "Update password"}
                {!isChanging && <ArrowRight aria-hidden="true" />}
              </Button>
              <p className="text-center text-xs leading-5 text-white/50">After updating, sign in again with your new password.</p>
            </form>
          )}
          <div className="mt-7 flex items-start gap-2.5 border-t border-white/10 pt-5 text-xs leading-5 text-white/45">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#E8D1AB]/70" size={16} aria-hidden="true" />
            <p>{verified ? "Changing your password signs you out on all devices." : "Never share your verification code with anyone."}</p>
          </div>
        </section>
        <div className="mt-5 text-center">
          <button type="button" onClick={logout} disabled={busy} className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB] disabled:opacity-50">Sign out</button>
        </div>
      </div>
    </main>
  );
}
