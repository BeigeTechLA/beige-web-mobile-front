"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Trash2, X, Globe2, History, User, Copy, CheckCircle2, Link } from "lucide-react";

interface ShareResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    resourceType: "workspace" | "folder" | "file";
    externalId: string;
    phase?: string;
    path?: string;
    filepath?: string;
    label?: string;
  } | null;
}

type ShareItem = {
  shareId: number;
  shareToken: string;
  email: string;
  accessMode?: "email_only" | "anyone_with_link";
  message?: string | null;
};

type AccessLogItem = {
  id: number;
  shareId: number;
  shareToken: string;
  email: string;
  action: string;
  createdAt?: string;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ShareResourceModal({ isOpen, onClose, resource }: ShareResourceModalProps) {
  const [activeTab, setActiveTab] = useState<"people" | "activity">("people");
  const [emailInput, setEmailInput] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingAnyone, setSharingAnyone] = useState(false);
  const [sharedItems, setSharedItems] = useState<ShareItem[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [revokingShareId, setRevokingShareId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activityPopupOpen, setActivityPopupOpen] = useState(false);
  const { isDark } = useResolvedTheme();

  const reset = () => {
    setActiveTab("people");
    setEmailInput("");
    setShareMessage("");
    setPendingEmails([]);
    setLoading(false);
    setSharingAnyone(false);
    setCopiedToken(null);
    setActivityPopupOpen(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const loadSharedItems = async () => {
    if (!resource) return;
    try {
      setListLoading(true);
      const rows = await fileManagerApi.listExternalShares({
        resourceType: resource.resourceType,
        externalId: resource.externalId,
        phase: resource.phase,
        path: resource.path,
        filepath: resource.filepath,
      });
      setSharedItems(
        (rows || []).map((row: any) => ({
          shareId: row.shareId,
          shareToken: row.shareToken,
          email: row.email,
          accessMode: row.accessMode || "email_only",
          message: row.message || null,
        }))
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to load shared emails");
    } finally {
      setListLoading(false);
    }
  };

  const loadAccessLogs = async () => {
    if (!resource) return;
    try {
      setLogsLoading(true);
      const rows = await fileManagerApi.listExternalShareAccessLogs({
        resourceType: resource.resourceType,
        externalId: resource.externalId,
        phase: resource.phase,
        path: resource.path,
        filepath: resource.filepath,
      });
      setAccessLogs((rows || []).map((row: any) => ({
        id: row.id,
        shareId: row.shareId,
        shareToken: row.shareToken,
        email: row.email,
        action: row.action,
        createdAt: row.createdAt,
      })));
    } catch (error: any) {
      toast.error(error?.message || "Failed to load access logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && resource) {
      void loadSharedItems();
      void loadAccessLogs();
    }
  }, [isOpen, resource?.externalId, resource?.resourceType, resource?.phase, resource?.path, resource?.filepath]);

  const existingEmails = useMemo(() => {
    return new Set(
      sharedItems
        .filter((item) => item.accessMode !== "anyone_with_link")
        .map((item) => item.email.toLowerCase())
    );
  }, [sharedItems]);

  const anyoneShare = useMemo(
    () => sharedItems.find((item) => item.accessMode === "anyone_with_link") || null,
    [sharedItems]
  );

  const addCurrentEmail = () => {
    const normalized = emailInput.trim().toLowerCase();

    if (!normalized) return;
    if (!isValidEmail(normalized)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (pendingEmails.includes(normalized)) {
      toast.info("Email already added");
      return;
    }
    if (existingEmails.has(normalized)) {
      toast.info("This email already has access");
      return;
    }

    setPendingEmails((prev) => [...prev, normalized]);
    setEmailInput("");
  };

  const removePendingEmail = (email: string) => {
    setPendingEmails((prev) => prev.filter((item) => item !== email));
  };

  const shareByEmails = async (emailsToShare: string[]) => {
    if (!resource || emailsToShare.length === 0) return;
    const results = await Promise.allSettled(
      emailsToShare.map((email) =>
        fileManagerApi.createExternalShare({
          resourceType: resource.resourceType,
          externalId: resource.externalId,
          phase: resource.phase,
          path: resource.path,
          filepath: resource.filepath,
          email,
          accessMode: "email_only",
          message: shareMessage.trim(),
        })
      )
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failedResults = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];

    if (successCount > 0) {
      toast.success(successCount === 1 ? "Shared with 1 email" : `Shared with ${successCount} emails`);
    }
    if (failedResults.length > 0) {
      const firstError = (failedResults[0].reason as any)?.message;
      toast.error(firstError || `${failedResults.length} email(s) failed to share`);
    }
  };

  const handleCreateShare = async () => {
    if (!resource) return;

    let emailsToShare = [...pendingEmails];
    const inlineInput = emailInput.trim().toLowerCase();

    if (inlineInput) {
      if (!isValidEmail(inlineInput)) {
        toast.error("Please enter a valid email");
        return;
      }
      if (!emailsToShare.includes(inlineInput) && !existingEmails.has(inlineInput)) {
        emailsToShare.push(inlineInput);
      }
    }

    if (emailsToShare.length === 0) {
      toast.error("Add at least one email first");
      return;
    }

    try {
      setLoading(true);
      await shareByEmails(emailsToShare);
      setPendingEmails([]);
      setEmailInput("");
      setShareMessage("");
      await loadSharedItems();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAnyoneWithLink = async () => {
    if (!resource || anyoneShare) return;
    try {
      setSharingAnyone(true);
      await fileManagerApi.createExternalShare({
        resourceType: resource.resourceType,
        externalId: resource.externalId,
        phase: resource.phase,
        path: resource.path,
        filepath: resource.filepath,
        accessMode: "anyone_with_link",
        message: shareMessage.trim(),
      });
      toast.success("Anyone with link enabled");
      await loadSharedItems();
    } catch (error: any) {
      toast.error(error?.message || "Failed to enable anyone-with-link sharing");
    } finally {
      setSharingAnyone(false);
    }
  };

  const handleCopyByToken = async (token: string) => {
    const frontendBase = (process.env.NEXT_PUBLIC_FRONTEND_URL || "").trim().replace(/\/+$/, "");
    const url = frontendBase ? `${frontendBase}/shared/file-manager/${token}` : `${window.location.origin}/shared/file-manager/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success("Share link copied");
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevoke = async (shareId: number) => {
    try {
      setRevokingShareId(shareId);
      await fileManagerApi.revokeExternalShare({ shareId });
      toast.success("Share removed");
      await loadSharedItems();
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove share");
    } finally {
      setRevokingShareId(null);
    }
  };

  const normalizeActionLabel = (action?: string) => {
    const value = String(action || "").trim().toLowerCase();
    if (value === "view_download") return "View + Download";
    if (value === "content_view") return "View";
    if (value === "download") return "Download";
    return value.replace(/_/g, " ") || "View";
  };

  const getActivitySentence = (action?: string) => {
    const value = String(action || "").trim().toLowerCase();
    if (value === "download") return "downloaded files from the shared folder";
    if (value === "view_download") return "viewed and downloaded files from the shared folder";
    if (value === "content_view") return "viewed the shared files";
    if (value.includes("link")) return "enabled public link access";
    return `${normalizeActionLabel(action).toLowerCase()} from the shared folder`;
  };

  const formatActivityTime = (createdAt?: string) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      if (diffHours >= 1) return `${diffHours} hrs Ago`;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const activityDotColors = ["bg-[#8B5CF6]", "bg-[#06B6D4]", "bg-[#22C55E]", "bg-[#FBBF24]", "bg-[#F472B6]", "bg-[#F8FAFC]"];

  const sortedAccessLogs = useMemo(() => {
    return [...accessLogs].sort(
      (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    );
  }, [accessLogs]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
  className={`w-[94vw] sm:w-[95vw] md:w-[85vw] lg:w-full lg:max-w-[700px] h-auto max-h-[85vh] lg:max-h-none rounded-lg lg:rounded-2xl border p-0 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition-all duration-200 [&>button]:hidden flex flex-col overflow-hidden no-scrollbar ${isDark ? "border-white/20 bg-black text-white" : "border-white/10 bg-white text-black"}`}
>
  <DialogTitle className="sr-only">Share {resource?.label}</DialogTitle>

  {/* Header Section - Stays Fixed */}
  <div className={`relative border-b p-3 lg:px-6 lg:py-5 transition-colors shrink-0 ${isDark ? "border-white/10 bg-black" : "border-[#D7D7D7] bg-white"}`}>
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1 pr-4">
        <h2 className={`text-base lg:text-xl font-bold leading-none truncate ${isDark ? "text-white" : "text-black"}`}>
          Share <span className="text-[#E8D1AB]">({resource?.label || "Resource"})</span>
        </h2>
        <p className={`mt-2.5 text-xs font-medium leading-[1.4] transition-colors ${isDark ? "text-[#AAA7A7]" : "text-[#727272]"}`}>
          Note : Recipients Must Verify their Email with and OTP each time they access shared files.
        </p>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 ${isDark
          ? "bg-[#1A1A1A] text-white/60 hover:bg-white/10 hover:text-white"
          : "bg-[#F4F5F7] text-black/60 hover:bg-black/10 hover:text-black"
          }`}
      >
        <X size={20} />
      </button>
    </div>
  </div>

  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-2 lg:px-6 lg:py-4 lg:max-h-[440px]">
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          {/* Email Entry Fieldset */}
          <fieldset className={`rounded-lg border px-4 pb-2.5 pt-1 transition-colors ${isDark
            ? "border-[#FFFFFF4D] focus-within:border-[#E8D1AB]"
            : "border-[#D7D7D7] focus-within:border-[#E8D1AB]"
            }`}>
            <legend className={`legend-reset px-1 text-xs leading-none font-medium transition-colors ${isDark ? "text-white/55" : "text-[#727272]"}`}>
              Add or Invite by Email
            </legend>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCurrentEmail();
                }
              }}
              placeholder="name@company.com"
              className={`w-full bg-transparent px-0 py-0.5 text-[14px] outline-none focus:ring-0 ${isDark ? "text-white placeholder:text-[#FFFFFF4D]" : "text-black placeholder:text-[#9F9FA9]"
                }`}
            />
          </fieldset>

          {pendingEmails.length > 0 && (
            <div className="max-h-[60px] overflow-y-auto no-scrollbar pt-0.5 pr-1">
              <div className="flex flex-wrap gap-2">
                {pendingEmails.map((email) => (
                  <span
                    key={email}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs border transition-colors ${isDark ? "bg-white/10 text-white border-white/5" : "bg-black/5 text-black border-black/5"
                      }`}
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removePendingEmail(email)}
                      className={`transition-colors ${isDark ? "text-[#AAA7A7] hover:text-white" : "text-black/40 hover:text-black"}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Note Textarea Fieldset */}
        <fieldset className={`rounded-lg border px-4 pb-2.5 pt-1 transition-colors ${isDark
          ? "border-[#FFFFFF4D] focus-within:border-[#E8D1AB]"
          : "border-[#D7D7D7] focus-within:border-[#E8D1AB]"
          }`}>
          <legend className={`legend-reset px-1 text-xs leading-none font-medium transition-colors ${isDark ? "text-white/55" : "text-[#727272]"}`}>
            Message (Optional)
          </legend>
          <Textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Write a short note..."
            className={`min-h-[50px] resize-none border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0 ${isDark ? "text-white placeholder:text-[#FFFFFF4D]" : "text-black placeholder:text-[#9F9FA9]"
              }`}
          />
        </fieldset>

        <button
          type="button"
          onClick={addCurrentEmail}
          disabled={!emailInput.trim()}
          className="h-[32px] rounded-[6px] px-6 text-[12px] font-bold transition-all disabled:opacity-40 bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
        >
          Add
        </button>
      </div>

      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("people")}
            className={`text-sm font-bold transition-colors ${activeTab === "people"
              ? isDark ? "text-white" : "text-black"
              : isDark ? "text-[#AAA7A7] hover:text-white/60" : "text-[#727272] hover:text-black"
              }`}
          >
            People Access With
          </button>
          <button
            type="button"
            onClick={() => setActivityPopupOpen(true)}
            className={`text-sm font-bold transition-all underline decoration-1 underline-offset-4 ${activityPopupOpen
              ? isDark ? "text-[#E2C799]" : "text-[#B38F43]"
              : isDark ? "text-[#E2C799]/70 hover:text-[#E2C799]" : "text-[#B38F43]/70 hover:text-[#B38F43]"
              }`}
          >
            View Activity
          </button>
        </div>

        {activeTab === "people" && (
          <div className="space-y-3">
            {listLoading ? (
              <div className="flex justify-center py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8D1AB]/20 border-t-[#E8D1AB]" />
              </div>
            ) : sharedItems.filter(i => i.accessMode !== "anyone_with_link").length === 0 ? (
              <div className={`py-3 text-center text-xs italic ${isDark ? "text-white/30" : "text-black/30"}`}>
                No one has access yet.
              </div>
            ) : (
              <div className={`max-h-[170px] overflow-y-auto pr-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${isDark ? "[&::-webkit-scrollbar-thumb]:bg-white/10" : "[&::-webkit-scrollbar-thumb]:bg-black/10"
                }`}>
                {sharedItems
                  .filter(i => i.accessMode !== "anyone_with_link")
                  .map((item) => (
                    <div key={item.shareId} className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB]/10 border border-[#E8D1AB]/20 text-[#E8D1AB]">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                            {item.email}
                          </p>
                          <p className={`truncate text-xs ${isDark ? "text-[#AAA7A7]" : "text-[#727272]"}`}>
                            Private access
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyByToken(item.shareToken)}
                          className={`flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 lg:px-3.5 lg:py-2 text-xs font-bold transition-all ${copiedToken === item.shareToken
                            ? "bg-emerald-500 text-white"
                            : isDark ? "bg-[#1A1A1A] text-white hover:bg-white/10" : "bg-[#F4F5F7] text-black hover:bg-black/5"
                            }`}
                        >
                          {copiedToken === item.shareToken ? (
                            <>
                              <CheckCircle2 size={14} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy Link
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(item.shareId)}
                          className={`p-2 transition-colors ${isDark ? "text-white/20 hover:text-red-400" : "text-black/20 hover:text-red-600"}`}
                          title="Revoke"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* General Link Access Toggle Section */}
            <div className={`border-t pt-4 transition-colors ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
              <h3 className={`text-xs sm:text-sm font-bold ${isDark ? "text-white/90" : "text-black/90"}`}>General Access</h3>
              <div className="mt-2 lg:mt-4 flex items-center justify-between gap-2 lg:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${isDark ? "bg-[#1A1A1A]" : "bg-[#F4F5F7]"}`}>
                    <Globe2 size={24} className={isDark ? "text-white/60" : "text-black/60"} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Anyone with the link</p>
                    <p className={`text-xs whitespace-wrap font-medium ${isDark ? "text-[#AAA7A7]" : "text-[#727272]"}`}>Anyone on the Internet can view</p>
                  </div>
                </div>
                {anyoneShare ? (
                  <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyByToken(anyoneShare.shareToken)}
                      className={`transition-colors ${copiedToken === anyoneShare.shareToken ? "text-emerald-400" : isDark ? "text-white/80 hover:text-white" : "text-black/80 hover:text-black"}`}
                      title="Copy Link"
                    >
                      {copiedToken === anyoneShare.shareToken ? <CheckCircle2 size={18} /> : <Link size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(anyoneShare.shareId)}
                      className="text-[#FF4D4D]/60 hover:text-[#FF4D4D] transition-colors"
                      title="Revoke Link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableAnyoneWithLink}
                    disabled={sharingAnyone}
                    className="h-9 lg:h-11 w-auto rounded-lg bg-[#B5A48B] px-4 lg:px-8 text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {sharingAnyone ? "..." : "Enable"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

  {activityPopupOpen && (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-[528px] overflow-hidden rounded-[8px] border border-white/10 bg-black text-white shadow-[0_22px_70px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-bold leading-none text-white">Activity Log</h3>
              <button
                type="button"
                onClick={() => setActivityPopupOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2C2C2C] text-white/70 transition-colors hover:bg-[#3A3A3A] hover:text-white"
                aria-label="Close activity log"
              >
                <X size={18} />
              </button>
            </div>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D1AB]/20 border-t-[#E8D1AB]" />
              </div>
            ) : sortedAccessLogs.length === 0 ? (
              <div className="py-8 text-center">
                <History size={32} className="mx-auto mb-2 text-white/15" />
                <p className="text-xs text-white/35">No activity logged yet.</p>
              </div>
            ) : (
              <div className="relative max-h-[430px] overflow-y-auto px-5 py-6 pr-4 no-scrollbar">
                <div className="absolute bottom-0 left-[32px] top-6 border-l border-dashed border-white/15" />
                <div className="space-y-7">
                  {sortedAccessLogs.map((log, index) => {
                    const email = log.email || "Anyone with link";
                    const name = email.includes("@") ? email.split("@")[0].replace(/[._-]+/g, " ") : email;
                    const displayName = name.replace(/\b\w/g, (char) => char.toUpperCase());
                    const activitySentence = getActivitySentence(log.action);
                    const dotColor = activityDotColors[index % activityDotColors.length];

                    return (
                      <div key={`${log.id}-${index}`} className="relative grid grid-cols-[24px_minmax(0,1fr)_86px] items-start gap-4">
                        <span className={`relative z-10 mt-1.5 h-3 w-3 rounded-full ${dotColor} shadow-[0_0_0_8px_rgba(255,255,255,0.05)]`} />
                        <p className="min-w-0 text-sm font-medium leading-6 text-[#B5B5B5]">
                          <span className="font-bold text-white">{displayName}</span>{" "}
                          {activitySentence}
                        </p>
                        <span className="pt-0.5 text-right text-sm font-medium text-white/35">
                          {formatActivityTime(log.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
      </div>
    </div>
  )}

  {/* Action Panel Footer Row - Stays Fixed */}
  <div className={`grid grid-cols-2 gap-3 border-t p-4 lg:px-6 lg:py-5 transition-colors shrink-0 sticky bottom-0 z-50 ${isDark ? "border-white/10 bg-[#050505]" : "border-[#D7D7D7] bg-[#FAFAFA]"
    }`}>
    <Button
      onClick={handleCreateShare}
      disabled={loading || (pendingEmails.length === 0 && !emailInput.trim())}
      className={`h-11 rounded-lg text-sm font-bold border-0 transition-colors ${isDark ? "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]" : "bg-[#E8D1AB] text-black hover:bg-[#A3803A]"
        }`}
    >
      {loading ? "Sharing..." : "Share Access"}
    </Button>
    <Button
      onClick={handleClose}
      className={`h-11 rounded-lg text-sm font-bold transition-colors ${isDark
        ? "bg-[#1A1A1A] text-white border border-white/5 hover:bg-white/10"
        : "bg-[#F4F5F7] text-black border border-[#D7D7D7] hover:bg-black/5"
        }`}
    >
      Done
    </Button>
  </div>
</DialogContent>
    </Dialog>
  );
}
