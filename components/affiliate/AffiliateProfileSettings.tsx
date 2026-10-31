"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateUser } from "@/lib/redux/features/auth/authSlice";
import { useAppDispatch } from "@/lib/redux/hooks";

import { useChangePasswordClientMutation, useGetCurrentUserQuery } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, RotateCcw } from "lucide-react";
import Cookies from "js-cookie";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { accountDeletionApi, affiliateApi } from "@/lib/api";
import { TimezonePreference } from "@/components/common/TimezonePreference";
import { DeleteAccountReview } from "./DeleteAccountReview";
import { DeleteAccountCancelModal } from "./DeleteAccountCancelModal";
import { DeleteAccountCancelledModal } from "./DeleteAccountCancelledModal";

export const AffiliateProfileSettings = ({ isDark = true }: { isDark?: boolean }) => {
  const [changePasswordClient, { isLoading }] = useChangePasswordClientMutation();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [clientId, setClientId] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteReview, setShowDeleteReview] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionRequestId, setDeletionRequestId] = useState<string | undefined>();
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState<string | undefined>();
  const [deletionRequestStatus, setDeletionRequestStatus] = useState<string | undefined>();
  const [deletionCancelledBy, setDeletionCancelledBy] = useState<string | null>(null);
  const [deletionCooldownEndsAt, setDeletionCooldownEndsAt] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: currentUserData } = useGetCurrentUserQuery(undefined, {
    skip: !user,
  });
  const hasPassword = (currentUserData?.has_password ?? user?.has_password) !== false;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadRequest = () => accountDeletionApi.getMyRequest().then(({ data }) => {
      if (cancelled) return;
      if (!data) {
        setDeletionRequested(false);
        setDeletionRequestStatus(undefined);
        return;
      }
      setDeletionRequested(data.status === "Pending Deletion" || data.status === "Processing");
      setDeletionRequestId(String(data.request_id));
      setDeletionRequestStatus(data.status);
      setDeletionCancelledBy(data.cancelled_by || null);
      setDeletionCooldownEndsAt(data.cooldown_ends_at || null);
      setScheduledDeletionDate(new Date(data.scheduled_deletion_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }));
    }).catch((error) => console.error("Failed to load account deletion request:", error));
    void loadRequest();
    const interval = window.setInterval(() => void loadRequest(), 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [user?.id]);

  useEffect(() => {
    if (currentUserData?.has_password !== undefined) {
      dispatch(updateUser({ has_password: currentUserData.has_password }));
    }
  }, [currentUserData?.has_password, dispatch]);

  useEffect(() => {
    const loadAffiliateClientId = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        const affiliateInfo = await affiliateApi.getMyAffiliate(token);
        setClientId(affiliateInfo.client_id || affiliateInfo.client?.client_id || null);
      } catch (error) {
        console.error("Failed to fetch affiliate client ID:", error);
      }
    };

    loadAffiliateClientId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (hasPassword && !currentPassword) {
      toast.error("Current password is required");
      return;
    }

    try {
      const userData = localStorage.getItem("revure_user");
      const parsedUser = userData ? JSON.parse(userData) : null;
      const userId = parsedUser?.id;

      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const response = await changePasswordClient({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword: newPassword,
        user_id: userId
      }).unwrap();

      toast.success(response.message || "Password changed successfully");
      dispatch(updateUser({ has_password: true }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message || "Failed to change password");
    }
  };

  if (showDeleteReview) {
    return (
      <DeleteAccountReview
        isDark={isDark}
        onBack={() => setShowDeleteReview(false)}
        onResend={async () => {
          try {
            const response = await accountDeletionApi.requestOtp();
            toast.success(response.message || "Verification code sent");
          } catch (error: unknown) {
            const message = error && typeof error === "object" && "response" in error
              ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
            toast.error(message || "Could not send verification code");
          }
        }}
        onVerify={async (code) => {
          try {
            const response = await accountDeletionApi.verifyOtp(code);
            if (!response.success || !response.data) {
              toast.error(response.message || "Verification failed");
              return false;
            }
            setDeletionRequestId(response.data.request_id);
            setDeletionRequestStatus(response.data.status);
            setDeletionCancelledBy(null);
            setDeletionCooldownEndsAt(null);
            setDeletionRequested(true);
            setScheduledDeletionDate(new Date(response.data.scheduled_deletion_at).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            }));
            return true;
          } catch (error: unknown) {
            const message = error && typeof error === "object" && "response" in error
              ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
            toast.error(message || "Verification failed. Please try again.");
            return false;
          }
        }}
        onDelete={async () => {
          if (!deletionRequestId) return false;
          return { requestId: deletionRequestId };
        }}
        onContactSupport={() => {
          // TODO: open support page / mailto
          window.location.href = "mailto:support@beige.com";
        }}
        onPreviewLogin={() => {
          setShowDeleteReview(false); // closes the review page and all its modals
          setDeletionRequested(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Personal Info Card */}
      <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}>
        <h2 className={`lg:text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
          isDark ? "text-white" : "text-[#171717]"
        }`}>
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 lg:gap-y-10 gap-x-16">
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>Full Name</p>
            <p className={`font-medium lg:text-xl border-b pb-2 transition-colors ${
              isDark ? "text-white/90 border-white/10" : "text-zinc-800 border-zinc-100"
            }`}>{user?.name || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>Email Address</p>
            <p className={`font-medium lg:text-xl border-b pb-2 transition-colors ${
              isDark ? "text-white/90 border-white/10" : "text-zinc-800 border-zinc-100"
            }`}>{user?.email || "Not set"}</p>
          </div>
          {/* <div className="space-y-2">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Role</p>
            <div>
              <span className="inline-flex items-center px-4 py-2 bg-[#E8D1AB]/10 text-[#E8D1AB] rounded-full text-sm font-bold uppercase tracking-wider border border-[#E8D1AB]/20">
                Partner
              </span>
            </div>
          </div> */}
          {/* <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>User ID</p>
            <p className={`font-mono lg:text-lg tracking-wider transition-colors ${
              isDark ? "text-white/50" : "text-zinc-500"
            }`}>#{clientId || user?.id}</p>
          </div> */}
        </div>
      </div>

      <TimezonePreference isDark={isDark} />

      {/* Security Card */}
      <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}>
        <h2 className={`lg:text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
          isDark ? "text-white" : "text-[#171717]"
        }`}>
          {hasPassword ? "Security Settings" : "Set Password"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-8 max-w-2xl">
          <div className="space-y-4 lg:space-y-6">
            {!hasPassword && (
              <p className={`text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                Your account was created with Google. Set a password here to use email and password login too.
              </p>
            )}
            {hasPassword && (
              <div className="space-y-3">
                <Label className={`text-sm font-medium transition-colors ${
                  isDark ? "text-white/60" : "text-zinc-500"
                }`}>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`pr-12 h-10 lg:h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                      isDark 
                        ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                        : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                    }`}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                    }`}
                  >
                    {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className={`text-sm font-medium transition-colors ${
                isDark ? "text-white/60" : "text-zinc-500"
              }`}>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-12 h-10 lg:h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                    isDark 
                      ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                      : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                  }`}
                >
                  {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={`text-sm font-medium transition-colors ${
                isDark ? "text-white/60" : "text-zinc-500"
              }`}>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-12 h-10 lg:h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                    isDark 
                      ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                      : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                  }`}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className={`pt-4 border-t transition-colors ${
            isDark ? "border-white/5" : "border-zinc-100"
          }`}>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 lg:h-14 lg:h-[72px] bg-[#E8D1AB] text-black font-medium lg:text-lg rounded-lg lg:rounded-xl flex-1 min-w-[140px] lg:min-w-[240px]"
            >
              {isLoading ? (hasPassword ? "Updating Password..." : "Setting Password...") : (hasPassword ? "Update Password" : "Set Password")}
            </Button>
          </div>
        </form>
      </div>

      <DeleteAccountCancelModal
        open={showCancelConfirm}
        isDark={isDark}
        scheduledDate={scheduledDeletionDate}
        email={user?.email}
        isLoading={isCancelling}
        onKeep={() => setShowCancelConfirm(false)}
        onCancelRequest={async () => {
          setIsCancelling(true);
          try {
            const response = await accountDeletionApi.cancelMyRequest();
            if (!response.success || !response.data) throw new Error(response.message || "Unable to cancel the deletion request.");
            setDeletionRequestStatus("Cancelled");
            setDeletionCancelledBy(response.data.cancelled_by || "User");
            setDeletionCooldownEndsAt(response.data.cooldown_ends_at || null);
            setDeletionRequested(false);
            setShowCancelConfirm(false);
            setShowCancelled(true);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to cancel the deletion request.");
          } finally {
            setIsCancelling(false);
          }
        }}
      />

      <DeleteAccountCancelledModal
        open={showCancelled}
        isDark={isDark}
        requestId={deletionRequestId}
        onGoToAccount={() => {
          setShowCancelled(false);
          setDeletionRequested(false);
        }}
      />

      {/* Delete Account Card (static UI) */}
      <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}>
        <div className="flex items-start gap-4 lg:gap-6">
          <div className="shrink-0 flex items-center justify-center w-10 h-10 lg:w-[50px] lg:h-[50px] rounded-full bg-[#FF6B6B]/15">
            <Trash2 className="w-5 h-5 lg:w-6 lg:h-6 text-[#FF6B6B]" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className={`lg:text-xl font-bold tracking-tight mb-2 lg:mb-3 transition-colors ${
              isDark ? "text-white" : "text-[#171717]"
            }`}>
              Delete Account
            </h2>

            <p className={`text-sm lg:text-base leading-relaxed mb-3 transition-colors ${
              isDark ? "text-white/60" : "text-zinc-500"
            }`}>
              Permanently delete your Beige account and associated personal data. Once you submit a
              deletion request, your account will be deactivated, and eligible data will be scheduled
              for deletion after{" "}
              <span className={`font-bold ${isDark ? "text-white" : "text-[#171717]"}`}>60 days.</span>
            </p>

            <p className={`text-sm lg:text-base leading-relaxed mb-5 lg:mb-6 transition-colors ${
              isDark ? "text-white/60" : "text-zinc-500"
            }`}>
              You can cancel your request during this period, subject to verification. Certain
              records may be retained where required by law or for legitimate business purposes.
            </p>

            {deletionRequestStatus && deletionRequestStatus !== "Failed" && (
              <div className={`relative mb-5 min-h-[76px] rounded-lg border px-4 py-3 ${isDark ? "border-[#E8D1AB]/25 bg-[#E8D1AB]/[0.07]" : "border-[#BFA780]/40 bg-[#F8F2E8]"}`}>
                <div className="flex min-h-[50px] flex-col justify-center pr-44">
                  <span className={`text-sm ${isDark ? "text-white/65" : "text-zinc-600"}`}>Deletion request status</span>
                  {deletionRequestStatus === "Cancelled" ? (
                    <p className={`mt-2 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                      Cancelled by {deletionCancelledBy === "Admin" ? "Admin" : "you"}. Your account remains active.
                    </p>
                  ) : deletionRequestStatus === "Completed" ? (
                    <p className={`mt-2 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                      Deletion is complete and this account is deactivated.
                    </p>
                  ) : scheduledDeletionDate && (
                    <p className={`mt-2 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                      Scheduled for deletion on {scheduledDeletionDate}
                    </p>
                  )}
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#FFF0C2] px-5 py-2 text-sm font-semibold text-[#9A5700]">
                  {deletionRequestStatus || "Pending Deletion"}
                </span>
              </div>
            )}

            {deletionRequested ? (
              <Button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="h-10 lg:h-12 px-5 lg:px-6 bg-[#E8D1AB] hover:bg-[#E8D1AB]/90 text-black font-medium lg:text-base rounded-lg lg:rounded-xl gap-2"
              >
                <RotateCcw size={18} />
                Cancel Delete
              </Button>
            ) : deletionRequestStatus === "Completed" ? (
              <Button type="button" disabled className="h-10 lg:h-12 px-5 lg:px-6 bg-[#2B2B2B] text-white/55 font-medium lg:text-base rounded-lg lg:rounded-xl cursor-not-allowed">
                Account Deactivated
              </Button>
            ) : deletionRequestStatus === "Cancelled" && deletionCooldownEndsAt && Date.parse(deletionCooldownEndsAt) > Date.now() ? (
              <Button type="button" disabled className="h-10 lg:h-12 px-5 lg:px-6 bg-[#2B2B2B] text-white/55 font-medium lg:text-base rounded-lg lg:rounded-xl cursor-not-allowed">
                Available after {new Date(deletionCooldownEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setShowDeleteReview(true)}
                className="h-10 lg:h-12 px-5 lg:px-6 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white font-medium lg:text-base rounded-lg lg:rounded-xl gap-2"
              >
                <Trash2 size={18} />
                Delete Account
              </Button>
            )}
          </div>
        </div>  
      </div>
    </div>
  );
};
