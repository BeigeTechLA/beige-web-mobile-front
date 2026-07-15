"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Trash2, X, Globe2, ChevronDown, History, User, Copy, CheckCircle2, Link, Eye, Download, ChevronUp, UploadCloud } from "lucide-react";

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
  permission?: "view_download" | "upload_download";
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
  const [emailPermission, setEmailPermission] = useState<"view_download" | "upload_download">("view_download");
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingAnyone, setSharingAnyone] = useState(false);
  const [sharedItems, setSharedItems] = useState<ShareItem[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [revokingShareId, setRevokingShareId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<string[]>([]);
  const { isDark } = useResolvedTheme();

  const reset = () => {
    setActiveTab("people");
    setEmailInput("");
    setShareMessage("");
    setEmailPermission("view_download");
    setPendingEmails([]);
    setLoading(false);
    setSharingAnyone(false);
    setCopiedToken(null);
    setExpandedEmails([]);
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
          permission: row.permission || "view_download",
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
          permission: emailPermission,
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

    const emailsToShare = [...pendingEmails];
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
        permission: "view_download",
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
    if (value === "upload") return "Upload";
    if (value === "upload_policy") return "Started Upload";
    if (value === "upload_download") return "Upload + Download";
    if (value === "content_view") return "View";
    if (value === "download") return "Download";
    return value.replace(/_/g, " ") || "View";
  };

  const getActionIcon = (action?: string) => {
    const value = String(action || "").trim().toLowerCase();
    if (value === "view_download" || value === "download") {
      return (
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#3b82f615] text-[#3b82f6]">
          <Download size={14} />
          <div className="absolute -left-[25px] h-2 w-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)] border border-white/20" />
        </div>
      );
    }
    if (value === "upload" || value === "upload_policy") {
      return (
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8d1ab18] text-[#E8D1AB]">
          <UploadCloud size={14} />
          <div className="absolute -left-[25px] h-2 w-2 rounded-full bg-[#E8D1AB] shadow-[0_0_8px_rgba(232,209,171,0.5)] border border-white/20" />
        </div>
      );
    }
    return (
      <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#10b98115] text-[#10b981]">
        <Eye size={14} />
        <div className="absolute -left-[25px] h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-white/20" />
      </div>
    );
  };

  const toggleExpand = (email: string) => {
    setExpandedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const groupedAccessLogs = useMemo(() => {
    const grouped = new Map<string, AccessLogItem[]>();
    for (const log of accessLogs) {
      const key = String(log.email || "").trim().toLowerCase();
      if (!key) continue;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    return Array.from(grouped.entries())
      .map(([email, logs]) => {
        const sortedLogs = [...logs].sort(
          (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        );
        return {
          email,
          logs: sortedLogs,
          latestAt: sortedLogs[0]?.createdAt,
        };
      })
      .sort((a, b) => new Date(b.latestAt || "").getTime() - new Date(a.latestAt || "").getTime());
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
          Note : Recipients must verify their email with an OTP before accessing this file.
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
              Invite by Email
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
              placeholder="Enter an email address"
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
            Add a Message (Optional)
          </legend>
          <Textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Add a note for the recipient..."
            className={`min-h-[50px] resize-none border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0 ${isDark ? "text-white placeholder:text-[#FFFFFF4D]" : "text-black placeholder:text-[#9F9FA9]"
            }`}
          />
        </fieldset>

        <div className="space-y-2">
          <p className={`text-xs font-bold ${isDark ? "text-white/80" : "text-black/80"}`}>Permission</p>
          <div className={`grid grid-cols-2 gap-2 rounded-lg border p-1 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-[#D7D7D7] bg-[#FAFAFA]"}`}>
            {[
              { value: "view_download" as const, label: "Can Download", icon: Download },
              { value: "upload_download" as const, label: "Can Upload & Download", icon: UploadCloud },
            ].map((option) => {
              const Icon = option.icon;
              const active = emailPermission === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEmailPermission(option.value)}
                  className={`flex h-9 items-center justify-center gap-2 rounded-md text-xs font-bold transition-colors ${
                    active
                      ? "bg-[#E8D1AB] text-black"
                      : isDark
                        ? "text-white/55 hover:bg-white/10 hover:text-white"
                        : "text-black/55 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className={`text-[11px] ${isDark ? "text-white/40" : "text-black/45"}`}>
            Only invited recipients can upload files after verifying their email.
          </p>
        </div>

        <button
          type="button"
          onClick={addCurrentEmail}
          disabled={!emailInput.trim()}
          className="h-[32px] rounded-[6px] px-6 text-[12px] font-bold transition-all disabled:opacity-40 bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
        >
          Invite
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
            People with Access
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`text-sm font-bold transition-all underline decoration-1 underline-offset-4 ${activeTab === "activity"
              ? isDark ? "text-[#E2C799]" : "text-[#B38F43]"
              : isDark ? "text-[#E2C799]/70 hover:text-[#E2C799]" : "text-[#B38F43]/70 hover:text-[#B38F43]"
              }`}
          >
            Activity Log
          </button>
        </div>

        {activeTab === "people" ? (
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
                            {item.permission === "upload_download" ? "Upload + download access" : "Download access"}
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
                    <p className={`text-xs whitespace-wrap font-medium ${isDark ? "text-[#AAA7A7]" : "text-[#727272]"}`}>Anyone on the Internet can view and download</p>
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
        ) : (
          <div className="space-y-4">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D1AB]/20 border-t-[#E8D1AB]" />
              </div>
            ) : groupedAccessLogs.length === 0 ? (
              <div className="py-8 text-center">
                <History size={32} className={`mx-auto mb-2 ${isDark ? "text-white/10" : "text-black/10"}`} />
                <p className={`text-xs ${isDark ? "text-white/30" : "text-black/30"}`}>No activity logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groupedAccessLogs.map((group) => {
                  const isExpanded = expandedEmails.includes(group.email);
                  const initials = group.email.substring(0, 2).toUpperCase();

                  return (
                    <div key={group.email} className={`overflow-hidden rounded-xl border transition-colors ${isDark ? "border-white/5 bg-white/[0.01]" : "border-[#D7D7D7] bg-[#FAFAFA]"}`}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(group.email)}
                        className={`w-full text-left px-4 py-3 focus:outline-none transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-black/5 border-[#D7D7D7] text-black/70"
                              }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`truncate text-sm font-bold ${isDark ? "text-white/90" : "text-black/90"}`}>{group.email}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${isDark ? "bg-white/5 text-white/30" : "bg-black/5 text-black/40"}`}>
                                  {group.logs.length} {group.logs.length === 1 ? 'event' : 'events'}
                                </span>
                              </div>
                              <div className={`mt-0.5 flex items-center gap-1.5 text-[10px] ${isDark ? "text-[#AAA7A7]" : "text-[#727272]"}`}>
                                <span className={`h-1 w-1 rounded-full ${isDark ? "bg-white/20" : "bg-black/20"}`} />
                                <span className="font-medium truncate">{normalizeActionLabel(group.logs[0]?.action)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                            <span className={`text-[10px] font-medium ${isDark ? "text-white/30" : "text-[#727272]"}`}>
                              {new Date(group.latestAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {isExpanded ? <ChevronUp size={14} className={isDark ? "text-white/30" : "text-black/30"} /> : <ChevronDown size={14} className={isDark ? "text-white/30" : "text-black/30"} />}
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={`relative mx-4 mb-4 ml-6 space-y-4 rounded-lg p-4 pt-5 border-t transition-colors ${isDark ? "bg-black/40 border-white/5" : "bg-black/[0.02] border-[#D7D7D7]"}`}>
                              {/* Timeline Tracer Line */}
                              <div className={`absolute left-[11px] top-[24px] bottom-[24px] w-[1px] border-l border-dashed ${isDark ? "border-white/10" : "border-black/10"}`} />

                              {group.logs.map((log, i) => (
                                <div key={i} className="relative flex items-center justify-between z-10 pl-4 gap-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {getActionIcon(log.action)}
                                    <span className={`text-xs font-bold truncate ${isDark ? "text-white/80" : "text-black/80"}`}>
                                      {normalizeActionLabel(log.action)}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-medium tabular-nums shrink-0 ${isDark ? "text-white/20" : "text-black/30"}`}>
                                    {new Date(log.createdAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Action Panel Footer Row - Stays Fixed */}
  <div className={`grid grid-cols-2 gap-3 border-t p-4 lg:px-6 lg:py-5 transition-colors shrink-0 sticky bottom-0 z-50 ${isDark ? "border-white/10 bg-[#050505]" : "border-[#D7D7D7] bg-[#FAFAFA]"
    }`}>
    <Button
      onClick={handleCreateShare}
      disabled={loading || (pendingEmails.length === 0 && !emailInput.trim())}
      className={`h-11 rounded-lg text-sm font-bold border-0 transition-colors ${isDark ? "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]" : "bg-[#E8D1AB] text-black hover:bg-[#A3803A]"
        }`}
    >
      {loading ? "Saving..." : "Save Changes"}
    </Button>
    <Button
      onClick={handleClose}
      className={`h-11 rounded-lg text-sm font-bold transition-colors ${isDark
        ? "bg-[#1A1A1A] text-white border border-white/5 hover:bg-white/10"
        : "bg-[#F4F5F7] text-black border border-[#D7D7D7] hover:bg-black/5"
        }`}
    >
      Close
    </Button>
  </div>
</DialogContent>
    </Dialog>
  );
}
