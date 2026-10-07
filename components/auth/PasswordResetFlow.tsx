"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDashboardPathForUser } from "@/lib/auth-routing";
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

export default function PasswordResetFlow({ mode = "expiry", embedded = false }: { mode?: "expiry" | "forgot"; embedded?: boolean }) {
  const router = useRouter();
  const { logout, acceptPasswordUpdate } = useAuth();
  const isForgot = mode === "forgot";
  const [email, setEmail] = useState("");
  const [resetProof, setResetProof] = useState("");
  const [successPath, setSuccessPath] = useState<string | null>(null);
  const [blockedSeconds, setBlockedSeconds] = useState(0);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestOtp, { isLoading: isRequesting }] = authApi.useRequestPasswordExpiryOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = authApi.useVerifyPasswordExpiryOtpMutation();
  const [changePassword, { isLoading: isChanging }] = authApi.useChangeExpiredPasswordMutation();
  const [requestForgotOtp, { isLoading: isRequestingForgot }] = authApi.useRequestForgotPasswordOtpMutation();
  const [verifyForgotOtp, { isLoading: isVerifyingForgot }] = authApi.useVerifyForgotPasswordOtpMutation();
  const [resetForgotten, { isLoading: isResettingForgot }] = authApi.useResetForgottenPasswordMutation();

  const requesting = isRequesting || isRequestingForgot;
  const verifying = isVerifying || isVerifyingForgot;
  const changing = isChanging || isResettingForgot;
  const busy = requesting || verifying || changing;
  const otpComplete = digits.every((digit) => /^\d$/.test(digit));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const reusesCurrentPassword = !isForgot && newPassword.length > 0 && newPassword === currentPassword;

  const handleError = (failure: unknown, fallback: string) => {
    setError(errorMessage(failure, fallback));
    const data = (failure as { data?: { code?: string; retry_after_seconds?: number } })?.data;
    const retry = Math.max(0, Number(data?.retry_after_seconds) || 0);
    if (retry) setResendSeconds(retry);
    if (data?.code === "OTP_BLOCKED") {
      setBlockedSeconds(retry);
      setDigits(Array(6).fill(""));
    }
    if (data?.code === "RESET_VERIFICATION_REQUIRED") {
      setVerified(false);
      setResetProof("");
      setDigits(Array(6).fill(""));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  useEffect(() => {
    if (!resendSeconds) return;
    const timeout = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  useEffect(() => {
    if (!blockedSeconds) return;
    const timeout = window.setTimeout(() => setBlockedSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [blockedSeconds]);

  useEffect(() => {
    if (verified) (isForgot ? document.getElementById("password") : currentPasswordRef.current)?.focus();
    else if (codeSent) inputRefs.current[0]?.focus();
  }, [verified, codeSent, isForgot]);

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
    if (busy || resendSeconds > 0 || blockedSeconds > 0) return;
    setError("");
    try {
      const result = await (isForgot ? requestForgotOtp({ email: email.trim() }).unwrap() : requestOtp().unwrap());
      setCodeSent(true);
      setDigits(Array(6).fill(""));
      setResendSeconds(result.retry_after_seconds || 60);
      setBlockedSeconds(0);
      setResetProof("");
      inputRefs.current[0]?.focus();
      toast.success(result.message);
    } catch (error: unknown) {
      handleError(error, "Could not send a verification code. Please try again.");
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !otpComplete || blockedSeconds > 0) return;
    setError("");
    try {
      const result = await (isForgot ? verifyForgotOtp({ email: email.trim(), otp: digits.join("") }).unwrap() : verifyOtp({ otp: digits.join("") }).unwrap());
      setResetProof(result.resetProof);
      setVerified(true);
      toast.success(result.message);
    } catch (error: unknown) {
      handleError(error, "The verification code is invalid or expired.");
    }
  };

  const change = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (!isForgot && !currentPassword) return setError("Enter your current password.");
    if (newPassword.length < 8) return setError("Use at least 8 characters for your new password.");
    if (!passwordsMatch) return setError("Passwords do not match.");
    if (reusesCurrentPassword) return setError("Your new password must be different from your current password.");
    setError("");
    try {
      const passwords = { resetProof, newPassword, confirmPassword };
      const result = await (isForgot ? resetForgotten({ ...passwords, email: email.trim() }).unwrap() : changePassword({ ...passwords, currentPassword }).unwrap());
      acceptPasswordUpdate(result);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(result.message);
      setResetProof("");
      setSuccessPath(getDashboardPathForUser(result.user));
    } catch (error: unknown) {
      handleError(error, "Could not change your password. Please try again.");
    }
  };

  const wrapperClass = embedded ? "w-full py-6 text-white" : "flex min-h-dvh items-center justify-center bg-[#101010] px-4 py-8 text-white sm:py-12";

  if (successPath) return (
    <div className={wrapperClass}>
      <section aria-labelledby="reset-success-title" className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-[#151515] p-6 text-center sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB]"><ShieldCheck size={30} aria-hidden="true" /></div>
        <h1 id="reset-success-title" className="text-2xl font-semibold outline-none" tabIndex={-1} ref={(node) => node?.focus()}>Password updated successfully.</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">You’re signed in on this device with your new password. Your other sessions have been signed out.</p>
        <Button variant="beige" className={`${primaryButtonClass} mt-8`} onClick={() => router.replace(successPath)}>Continue to Dashboard <ArrowRight aria-hidden="true" /></Button>
      </section>
    </div>
  );

  return (
    <div className={wrapperClass} style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div className="w-full max-w-[520px]">
        {!embedded && <div className="mb-7 text-center text-xl font-medium tracking-[0.3em] text-[#E8D1AB]" aria-label="Beige">BEIGE</div>}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E8D1AB]">{isForgot ? "Account recovery" : "Security update required"}</p>
          <h1 id="password-expiry-title" className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
            {verified ? "Create a new password" : codeSent ? "Check your email" : isForgot ? "Forgot your password?" : "Your password has expired"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {verified
              ? isForgot ? "Your email is verified. Choose a new password to regain access. Your old password is not required." : "Your email is verified. Confirm your current password, then choose a different password to regain dashboard access."
              : codeSent
                ? "Enter the 6-digit code sent to your registered email address. The code is valid for 10 minutes."
                : isForgot ? "Enter your registered email address. We’ll send a 6-digit verification code to reset your password." : "Your password has expired. Please reset your password to continue."}
          </p>

          {!verified ? (
            <form className="mt-7 space-y-5" onSubmit={codeSent ? verify : (event) => { event.preventDefault(); void sendOtp(); }}>
              {isForgot && !codeSent && <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm text-white/80">Email address</Label>
                <Input id="reset-email" type="email" autoComplete="email" required maxLength={255} value={email} disabled={busy}
                  onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="name@example.com" className={passwordInputClass} />
              </div>}
              {codeSent && (
                <fieldset disabled={busy || blockedSeconds > 0}>
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
              {blockedSeconds > 0 && <p role="status" className="text-sm text-[#E8D1AB]">Try again in {Math.floor(blockedSeconds / 60)}:{String(blockedSeconds % 60).padStart(2, "0")}. Request a new code when the timer ends.</p>}
              {codeSent ? (
                <>
                  <Button variant="beige" type="submit" className={primaryButtonClass} disabled={busy || !otpComplete || blockedSeconds > 0}>
                    {verifying ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                    {verifying ? "Verifying..." : "Verify OTP"}
                    {!verifying && <ArrowRight aria-hidden="true" />}
                  </Button>
                  <p className="text-center text-sm text-white/50">
                    Didn’t receive a code?{" "}
                    <button type="button" onClick={sendOtp} disabled={busy || resendSeconds > 0}
                      className="rounded text-[#E8D1AB] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-[#E8D1AB] disabled:cursor-not-allowed disabled:text-white/40 disabled:no-underline">
                      {requesting ? "Sending..." : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}
                    </button>
                  </p>
                </>
              ) : (
                <Button variant="beige" type="submit" className={primaryButtonClass} disabled={busy || resendSeconds > 0 || blockedSeconds > 0}>
                  {requesting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}
                  {requesting ? "Sending code..." : resendSeconds > 0 ? `Try again in ${resendSeconds}s` : "Reset Password"}
                </Button>
              )}
              {isForgot && codeSent && <button type="button" disabled={busy} className="w-full text-center text-sm text-[#E8D1AB] hover:underline" onClick={() => { setCodeSent(false); setDigits(Array(6).fill("")); }}>Use a different email</button>}
            </form>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={change}>
              {!isForgot && <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm text-white/80">Current password / Old password</Label>
                <div className="relative">
                  <Input ref={currentPasswordRef} id="current-password" name="currentPassword" autoComplete="current-password" type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }}
                    required disabled={busy} placeholder="Enter your current password" className={passwordInputClass} />
                  <button type="button" aria-label={showCurrentPassword ? "Hide current password" : "Show current password"} aria-pressed={showCurrentPassword}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-1 right-1 flex w-12 items-center justify-center rounded-lg text-white/50 hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB]">
                    {showCurrentPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-white/80">New password</Label>
                <div className="relative">
                  <Input id="password" name="newPassword" autoComplete="new-password" type={showPassword ? "text" : "password"}
                    value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError(""); }}
                    minLength={8} required disabled={busy} placeholder="Enter a new password" aria-invalid={reusesCurrentPassword} aria-describedby="password-help" className={passwordInputClass} />
                  <button type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-1 right-1 flex w-12 items-center justify-center rounded-lg text-white/50 hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB]">
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                <p id="password-help" className={`text-xs ${reusesCurrentPassword ? "text-red-300" : newPassword.length >= 8 ? "text-[#E8D1AB]" : "text-white/45"}`}>
                  {reusesCurrentPassword ? "Your new password must be different from your current password." : "Use at least 8 characters and choose a different password."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm text-white/80">Confirm new password</Label>
                <div className="relative">
                  <Input id="confirm-password" name="confirmPassword" autoComplete="new-password" type={showConfirmation ? "text" : "password"}
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
              <Button variant="beige" type="submit" className={primaryButtonClass} disabled={busy || (!isForgot && !currentPassword) || reusesCurrentPassword || newPassword.length < 8 || !passwordsMatch}>
                {changing ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {changing ? "Updating password..." : "Update Password"}
                {!changing && <ArrowRight aria-hidden="true" />}
              </Button>
              <p className="text-center text-xs leading-5 text-white/50">After updating, you can continue directly to your dashboard.</p>
            </form>
          )}
          <div className="mt-7 flex items-start gap-2.5 border-t border-white/10 pt-5 text-xs leading-5 text-white/45">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#E8D1AB]/70" size={16} aria-hidden="true" />
            <p>{verified ? "Changing your password signs out your other sessions. This device stays signed in." : "Never share your verification code with anyone."}</p>
          </div>
        </section>
        <div className="mt-5 text-center">
          {isForgot ? <Link href="/login" className="text-sm text-[#E8D1AB] hover:underline">Back to sign in</Link> : <>
            <Link href="/forgot-password" className="px-4 text-sm text-[#E8D1AB] hover:underline">Forgot your current password?</Link>
            <button type="button" onClick={logout} disabled={busy} className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:text-[#E8D1AB] focus-visible:outline focus-visible:outline-[#E8D1AB] disabled:opacity-50">Sign out</button>
          </>}
        </div>
      </div>
    </div>
  );
}
