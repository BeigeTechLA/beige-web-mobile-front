"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, X, Share2, Mail, Users, CheckCircle2, Globe2, Eye, Download, ChevronDown, History } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

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
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  const { isDark } = useResolvedTheme();

  const reset = () => {
    setActiveTab("people");
    setEmailInput("");
    setShareMessage("");
    setPendingEmails([]);
    setLoading(false);
    setSharingAnyone(false);
    setCopiedToken(null);
    setExpandedEmails({});
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

  const getInitials = (email: string) => {
    const name = email.split("@")[0] || "";
    return name.slice(0, 2).toUpperCase();
  };

  const normalizeActionLabel = (action?: string) => {
    const value = String(action || "").trim().toLowerCase();
    if (value === "view_download") return "View + Download";
    if (value === "content_view") return "View";
    if (value === "download") return "Download";
    return value.replace(/_/g, " ") || "View";
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
        const hasView = sortedLogs.some((item) => ["content_view", "view_download"].includes(String(item.action || "").toLowerCase()));
        const hasDownload = sortedLogs.some((item) => ["download", "view_download"].includes(String(item.action || "").toLowerCase()));
        const summaryAction = hasView && hasDownload ? "View + Download" : hasDownload ? "Download" : "View";
        return {
          email,
          logs: sortedLogs,
          latestAt: sortedLogs[0]?.createdAt,
          summaryAction,
        };
      })
      .sort((a, b) => new Date(b.latestAt || "").getTime() - new Date(a.latestAt || "").getTime());
  }, [accessLogs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className={`relative flex h-[80vh] w-full max-w-[500px] flex-col overflow-hidden rounded-[18px] border shadow-2xl transition-colors duration-200 sm:h-[640px] ${isDark
                ? "border-white/10 bg-[#0A0A0A] shadow-black/40"
                : "border-[#D7D7D7] bg-white shadow-black/10"
              }`}
          >
            {/* Top Accent Radial Glow */}
            <div className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-[80px] transition-colors shrink-0 ${isDark ? "bg-[#E5D5B8]/10" : "bg-[#B38F43]/10"
              }`} />

            {/* Header Section */}
            <div className={`relative flex items-start justify-between border-b p-4 pb-3.5 transition-colors ${isDark ? "border-white/[0.06]" : "border-[#D7D7D7]"
              }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isDark ? "bg-[#E5D5B8]/15" : "bg-[#E8D1AB]/10"
                  }`}>
                  <Share2 className={`h-5 w-5 transition-colors ${isDark ? "text-[#E5D5B8]" : "text-[#E8D1AB]"}`} />
                </div>
                <div>
                  <h2 className={`text-base font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                    Share Access
                  </h2>
                  <p className={`mt-0.5 text-xs transition-colors ${isDark ? "text-white/40" : "text-[#727272]"}`}>
                    Note: Recipients must verify their email with an OTP each time they access shared files.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`rounded-full p-2 transition-colors ${isDark
                    ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    : "bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
                  }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="relative flex-1 overflow-y-auto no-scrollbar p-4">
              <div className="space-y-4">

                {/* Anyone Link Management Card */}
                <div className={`rounded-xl border p-3 transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-[#D7D7D7] bg-[#FAFAFA]"
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe2 size={16} className={isDark ? "text-[#E5D5B8]" : "text-[#E8D1AB]"} />
                      <p className={`text-sm font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
                        Anyone with the link
                      </p>
                    </div>
                    {anyoneShare ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyByToken(anyoneShare.shareToken)}
                          className={`rounded-lg p-1.5 transition-colors ${copiedToken === anyoneShare.shareToken
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-black/50 hover:bg-black/5 hover:text-black"
                            }`}
                          title="Copy link"
                        >
                          {copiedToken === anyoneShare.shareToken ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(anyoneShare.shareId)}
                          disabled={revokingShareId === anyoneShare.shareId}
                          className={`rounded-lg p-1.5 transition-colors disabled:opacity-30 ${isDark ? "text-white/50 hover:bg-red-500/10 hover:text-red-400" : "text-black/50 hover:bg-red-500/5 hover:text-red-600"
                            }`}
                          title="Disable anyone-with-link"
                        >
                          {revokingShareId === anyoneShare.shareId ? (
                            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleEnableAnyoneWithLink}
                        disabled={sharingAnyone}
                        className={`h-7 rounded-lg px-3 text-xs font-semibold transition-colors ${isDark
                            ? "bg-[#E5D5B8] text-black hover:bg-[#dcb98a]"
                            : "bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/80"
                          }`}
                      >
                        {sharingAnyone ? "Enabling..." : "Enable"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Email Form Section */}
                <div>
                  <label className={`mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${isDark ? "text-white/40" : "text-[#727272]"
                    }`}>
                    <Mail size={12} />
                    Invite by Email
                  </label>

                  <div className="flex gap-2">
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
                      className={`h-[42px] w-full rounded-xl border px-3.5 text-sm outline-none transition-all focus:ring-2 ${isDark
                          ? "border-white/10 bg-white/[0.03] text-white placeholder:text-white/25 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-[#E5D5B8]/15"
                          : "border-[#D7D7D7] bg-[#F4F5F7] text-black placeholder:text-[#9F9FA9] focus:border-[#D7D7D7]/50 focus:bg-white focus:ring-[#D7D7D7]/15"
                        }`}
                    />
                    <Button
                      type="button"
                      onClick={addCurrentEmail}
                      disabled={!emailInput.trim() || loading}
                      className={`h-[42px] rounded-xl px-4 text-sm font-semibold transition-all disabled:opacity-40 ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
                        }`}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Tag Badges for Emails Pending Save */}
                  <div className="mt-3 max-h-24 overflow-y-auto">
                    {pendingEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingEmails.map((email) => (
                          <span
                            key={email}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${isDark
                                ? "border-[#E5D5B8]/30 bg-[#E5D5B8]/10 text-[#E5D5B8]"
                                : "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                              }`}
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removePendingEmail(email)}
                              className="rounded-full text-[#E5D5B8]/80 hover:text-[#E5D5B8]"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Accompanying Share Message Box */}
                  <div className="mt-3">
                    <label className={`mb-2 block text-xs font-medium uppercase tracking-wider transition-colors ${isDark ? "text-white/40" : "text-[#727272]"
                      }`}>
                      Message (Optional)
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value.slice(0, 2000))}
                      placeholder="Write a short note..."
                      className={`min-h-[78px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 ${isDark
                          ? "border-white/10 bg-white/[0.03] text-white placeholder:text-white/25 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-[#E5D5B8]/15"
                          : "border-[#D7D7D7] bg-[#F4F5F7] text-black placeholder:text-[#9F9FA9] focus:border-[#D7D7D7]/50 focus:bg-white focus:ring-[#D7D7D7]/15"
                        }`}
                    />
                    <p className={`mt-1 text-right text-xs transition-colors ${isDark ? "text-white/35" : "text-[#727272]/60"}`}>
                      {shareMessage.length}/2000
                    </p>
                  </div>

                  {/* Master Share Commitment Button */}
                  <Button
                    onClick={handleCreateShare}
                    disabled={loading || (pendingEmails.length === 0 && !emailInput.trim())}
                    className={`mt-3 h-[42px] w-full rounded-xl px-5 text-sm font-semibold transition-all disabled:opacity-40 ${isDark
                        ? "bg-[#E5D5B8] text-black hover:bg-[#dcb98a]"
                        : "bg-[#E8D1AB] text-black hover:bg-[#A3803A]"
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${isDark ? "border-black/30 border-t-black" : "border-white/30 border-t-white"}`} />
                        Sharing...
                      </span>
                    ) : (
                      "Share Access"
                    )}
                  </Button>
                </div>

                {/* List and Log Switch Segment */}
                <div>
                  <div className={`mb-2 flex items-center justify-center gap-6 border-b transition-colors ${isDark ? "border-white/[0.08]" : "border-[#D7D7D7]"
                    }`}>
                    <button
                      type="button"
                      onClick={() => setActiveTab("people")}
                      className={`relative border-b-2 px-1 py-2 text-xs font-medium transition-colors ${activeTab === "people"
                          ? isDark ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-[#E8D1AB] text-[#E8D1AB]"
                          : isDark ? "border-transparent text-white/60 hover:text-white" : "border-transparent text-[#727272] hover:text-black"
                        }`}
                    >
                      Shared With
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className={`relative border-b-2 px-1 py-2 text-xs font-medium transition-colors ${activeTab === "activity"
                          ? isDark ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-[#E8D1AB] text-[#E8D1AB]"
                          : isDark ? "border-transparent text-white/60 hover:text-white" : "border-transparent text-[#727272] hover:text-black"
                        }`}
                    >
                      Activity
                    </button>
                  </div>

                  {/* Tab Frame Container Display */}
                  <div className={`h-[220px] overflow-auto no-scrollbar rounded-xl border transition-colors ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-[#D7D7D7] bg-[#FAFAFA]"
                    }`}>
                    {activeTab === "people" ? (
                      listLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
                          <span className={`h-6 w-6 animate-spin rounded-full border-2 ${isDark ? "border-[#E5D5B8]/20 border-t-[#E5D5B8]" : "border-[#E8D1AB]/20 border-t-[#E8D1AB]"}`} />
                          <span className={`text-xs font-medium ${isDark ? "text-white/40" : "text-[#727272]"}`}>Loading access list...</span>
                        </div>
                      ) : sharedItems.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-black/[0.02] border-black/[0.05]"}`}>
                            <Users size={20} className={isDark ? "text-white/20" : "text-black/20"} />
                          </div>
                          <p className={`text-sm font-medium ${isDark ? "text-white/30" : "text-black/30"}`}>No one has access yet</p>
                        </div>
                      ) : (
                        <div className={`divide-y ${isDark ? "divide-white/[0.04]" : "divide-[#D7D7D7]/60"}`}>
                          {sharedItems.map((item) => {
                            const isAnyone = item.accessMode === "anyone_with_link";
                            const label = isAnyone ? "Anyone with link" : item.email;
                            return (
                              <div
                                key={item.shareId}
                                className={`group flex items-center gap-3 px-4 py-3.5 transition-all ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"
                                  }`}
                              >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br border text-xs font-semibold transition-colors ${isAnyone
                                    ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : isDark
                                      ? "from-[#E5D5B8]/20 to-[#E5D5B8]/5 border-[#E5D5B8]/10 text-[#E5D5B8]"
                                      : "from-[#E8D1AB]/10 to-[#E8D1AB]/5 border-[#E8D1AB]/20 text-[#E8D1AB]"
                                  }`}>
                                  {isAnyone ? <Globe2 size={16} /> : getInitials(item.email)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`truncate text-sm font-medium transition-colors ${isDark ? "text-white/90" : "text-black/90"}`}>{label}</p>
                                  <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${isDark ? "text-white/30" : "text-[#727272]"}`}>
                                    {isAnyone ? "Public Link access" : "Private access"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 transition-all group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyByToken(item.shareToken)}
                                    className={`rounded-lg p-2 transition-all ${copiedToken === item.shareToken
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10"
                                        : isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"
                                      }`}
                                    title="Copy link"
                                  >
                                    {copiedToken === item.shareToken ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRevoke(item.shareId)}
                                    disabled={revokingShareId === item.shareId}
                                    className={`rounded-lg p-2 transition-all disabled:opacity-30 ${isDark ? "text-white/30 hover:bg-red-500/10 hover:text-red-400" : "text-black/30 hover:bg-red-500/5 hover:text-red-600"
                                      }`}
                                    title="Remove access"
                                  >
                                    {revokingShareId === item.shareId ? (
                                      <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : logsLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
                        <span className={`h-6 w-6 animate-spin rounded-full border-2 ${isDark ? "border-[#E5D5B8]/20 border-t-[#E5D5B8]" : "border-[#E8D1AB]/20 border-t-[#E8D1AB]"}`} />
                        <span className={`text-xs font-medium ${isDark ? "text-white/40" : "text-[#727272]"}`}>Fetching activity logs...</span>
                      </div>
                    ) : groupedAccessLogs.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-black/[0.02] border-black/[0.05]"}`}>
                          <History size={20} className={isDark ? "text-white/20" : "text-black/20"} />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? "text-white/30" : "text-black/30"}`}>No access activity yet</p>
                      </div>
                    ) : (
                      <div className={`divide-y ${isDark ? "divide-white/[0.04]" : "divide-[#D7D7D7]/60"}`}>
                        {groupedAccessLogs.map((group) => {
                          const isExpanded = !!expandedEmails[group.email];
                          return (
                            <div key={group.email} className="overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedEmails((prev) => ({ ...prev, [group.email]: !prev[group.email] }))
                                }
                                className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all ${isExpanded
                                    ? isDark ? "bg-white/[0.02]" : "bg-black/[0.01]"
                                    : ""
                                  } ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}
                              >
                                <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br border text-xs font-semibold transition-colors ${isDark
                                    ? "from-[#E5D5B8]/20 to-[#E5D5B8]/5 border-[#E5D5B8]/10 text-[#E5D5B8]"
                                    : "from-[#E8D1AB]/10 to-[#E8D1AB]/5 border-[#E8D1AB]/20 text-[#E8D1AB]"
                                  }`}>
                                  {getInitials(group.email)}
                                  {isExpanded && (
                                    <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${isDark ? "bg-[#E5D5B8] border-[#0A0A0A]" : "bg-[#E8D1AB] border-white"
                                      }`} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`truncate text-sm font-medium transition-colors ${isDark ? "text-white/90" : "text-black/90"}`}>{group.email}</p>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] transition-colors ${isDark ? "bg-white/[0.05] text-white/40" : "bg-black/[0.05] text-[#727272]"
                                      }`}>
                                      {group.logs.length} events
                                    </span>
                                  </div>
                                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs transition-colors ${isDark ? "text-[#E5D5B8]/60" : "text-[#E8D1AB]"}`}>
                                    <span className={`h-1 w-1 rounded-full ${isDark ? "bg-[#E5D5B8]/40" : "bg-[#E8D1AB]/40"}`} />
                                    {group.summaryAction}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-[10px] font-medium transition-colors ${isDark ? "text-white/30" : "text-[#727272]"}`}>
                                    {new Date(group.latestAt || "").toLocaleDateString([], { month: "short", day: "numeric" })}
                                  </span>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`transition-colors ${isDark ? "text-white/20 group-hover:text-white/40" : "text-black/20 group-hover:text-black/40"}`}
                                  >
                                    <ChevronDown size={14} />
                                  </motion.div>
                                </div>
                              </button>

                              {/* Accordion Log Extension Sublist */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className={isDark ? "bg-black/40" : "bg-black/[0.02]"}
                                  >
                                    <div className={`relative ml-8 mr-4 space-y-0.5 border-l py-2 pl-6 transition-colors ${isDark ? "border-white/[0.08]" : "border-[#D7D7D7]"
                                      }`}>
                                      {group.logs.map((log) => {
                                        const action = String(log.action || "").toLowerCase();
                                        const isDownload = action.includes("download");
                                        const isView = action.includes("view");

                                        return (
                                          <div key={log.id} className="group/item relative flex items-center justify-between py-2.5">
                                            <div className={`absolute -left-[25px] flex h-2 w-2 rounded-full transition-colors ${isDark
                                                ? "bg-white/10 group-hover/item:bg-[#E5D5B8]/40"
                                                : "bg-black/10 group-hover/item:bg-[#E8D1AB]/40"
                                              }`} />

                                            <div className="flex items-center gap-2.5">
                                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${isDownload
                                                  ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                                  : isView
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : isDark ? "bg-white/5 text-white/40" : "bg-black/5 text-[#727272]"
                                                }`}>
                                                {isDownload ? <Download size={12} /> :
                                                  isView ? <Eye size={12} /> :
                                                    <History size={12} />}
                                              </div>
                                              <span className={`text-[12px] font-medium transition-colors ${isDark ? "text-white/60" : "text-black/70"}`}>
                                                {normalizeActionLabel(log.action)}
                                              </span>
                                            </div>

                                            <div className="flex flex-col items-end">
                                              <span className={`text-[10px] tabular-nums transition-colors ${isDark ? "text-white/30" : "text-[#727272]"}`}>
                                                {new Date(log.createdAt || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
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
                </div>
              </div>
            </div>

            {/* Bottom Closing Action Section */}
            <div className={`border-t px-4 py-3.5 transition-colors ${isDark ? "border-white/[0.06]" : "border-[#D7D7D7]"}`}>
              <button
                type="button"
                onClick={handleClose}
                className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${isDark ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white" : "bg-[#F4F5F7] text-black/70 hover:bg-[#E4E5E7] hover:text-black"
                  }`}
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
