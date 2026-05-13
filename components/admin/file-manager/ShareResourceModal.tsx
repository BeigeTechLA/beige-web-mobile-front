"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, X, Share2, Mail, Users, CheckCircle2, Globe2, Eye, Download, ChevronDown, History } from "lucide-react";

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
            className="relative flex h-[80vh] w-full max-w-[500px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-black/40 sm:h-[640px]"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#E5D5B8]/10 blur-[80px]" />

            <div className="relative flex items-start justify-between border-b border-white/[0.06] p-4 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5D5B8]/15">
                  <Share2 className="h-5 w-5 text-[#E5D5B8]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Share {resource?.label || "Resource"}</h2>
                  <p className="mt-0.5 text-xs text-white/40">Note: Accessing the link requires email OTP verification, even if the user has the shared access link.</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto no-scrollbar p-4">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe2 size={16} className="text-[#E5D5B8]" />
                      <p className="text-sm font-medium text-white">Anyone with the link</p>
                    </div>
                    {anyoneShare ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyByToken(anyoneShare.shareToken)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            copiedToken === anyoneShare.shareToken
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                          title="Copy link"
                        >
                          {copiedToken === anyoneShare.shareToken ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(anyoneShare.shareId)}
                          disabled={revokingShareId === anyoneShare.shareId}
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
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
                        className="h-7 rounded-lg bg-[#E5D5B8] px-3 text-xs font-semibold text-black hover:bg-[#dcb98a]"
                      >
                        {sharingAnyone ? "Enabling..." : "Enable"}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                    <Mail size={12} />
                    Invite by Email(s)
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
                      placeholder="client@example.com"
                      className="h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#E5D5B8]/15"
                    />
                    <Button
                      type="button"
                      onClick={addCurrentEmail}
                      disabled={!emailInput.trim() || loading}
                      className="h-[42px] rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-40"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="mt-3 max-h-24 overflow-y-auto">
                    {pendingEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-2 rounded-full border border-[#E5D5B8]/30 bg-[#E5D5B8]/10 px-3 py-1 text-xs text-[#E5D5B8]"
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

                  <div className="mt-3">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Add Message (Optional)
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value.slice(0, 2000))}
                      placeholder="Add a note for recipients..."
                      className="min-h-[78px] w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#E5D5B8]/15"
                    />
                    <p className="mt-1 text-right text-[11px] text-white/35">{shareMessage.length}/2000</p>
                  </div>

                  <Button
                    onClick={handleCreateShare}
                    disabled={loading || (pendingEmails.length === 0 && !emailInput.trim())}
                    className="mt-3 h-[42px] w-full rounded-xl bg-[#E5D5B8] px-5 text-sm font-semibold text-black transition-all hover:bg-[#dcb98a] disabled:opacity-40"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                        Sharing...
                      </span>
                    ) : (
                      "Share"
                    )}
                  </Button>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-center gap-6 border-b border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("people")}
                      className={`relative border-b-2 px-1 py-2 text-xs font-medium transition-colors ${
                        activeTab === "people"
                          ? "border-[#E5D5B8] text-[#E5D5B8]"
                          : "border-transparent text-white/60 hover:text-white"
                      }`}
                    >
                      People with Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className={`relative border-b-2 px-1 py-2 text-xs font-medium transition-colors ${
                        activeTab === "activity"
                          ? "border-[#E5D5B8] text-[#E5D5B8]"
                          : "border-transparent text-white/60 hover:text-white"
                      }`}
                    >
                      Access Activity
                    </button>
                  </div>

                  <div className="h-[220px] overflow-auto no-scrollbar rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    {activeTab === "people" ? (
                      listLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5D5B8]/20 border-t-[#E5D5B8]" />
                          <span className="text-xs font-medium text-white/40">Loading access list...</span>
                        </div>
                      ) : sharedItems.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05]">
                            <Users size={20} className="text-white/20" />
                          </div>
                          <p className="text-sm font-medium text-white/30">No one has access yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.04]">
                          {sharedItems.map((item) => {
                            const isAnyone = item.accessMode === "anyone_with_link";
                            const label = isAnyone ? "Anyone with link" : item.email;
                            return (
                              <div
                                key={item.shareId}
                                className="group flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-white/[0.03]"
                              >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br border text-xs font-semibold transition-colors ${
                                  isAnyone 
                                    ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/10 text-emerald-400" 
                                    : "from-[#E5D5B8]/20 to-[#E5D5B8]/5 border-[#E5D5B8]/10 text-[#E5D5B8]"
                                }`}>
                                  {isAnyone ? <Globe2 size={16} /> : getInitials(item.email)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-medium text-white/90">{label}</p>
                                  <p className="mt-0.5 text-[10px] text-white/30 font-medium uppercase tracking-wider">
                                    {isAnyone ? "Public access" : "Private access"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 transition-all group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyByToken(item.shareToken)}
                                    className={`rounded-lg p-2 transition-all ${
                                      copiedToken === item.shareToken
                                        ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                                        : "text-white/40 hover:bg-white/10 hover:text-white"
                                    }`}
                                    title="Copy link"
                                  >
                                    {copiedToken === item.shareToken ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRevoke(item.shareId)}
                                    disabled={revokingShareId === item.shareId}
                                    className="rounded-lg p-2 text-white/30 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
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
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5D5B8]/20 border-t-[#E5D5B8]" />
                        <span className="text-xs font-medium text-white/40">Fetching activity logs...</span>
                      </div>
                    ) : groupedAccessLogs.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05]">
                          <History size={20} className="text-white/20" />
                        </div>
                        <p className="text-sm font-medium text-white/30">No access activity yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {groupedAccessLogs.map((group) => {
                          const isExpanded = !!expandedEmails[group.email];
                          return (
                            <div key={group.email} className="overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedEmails((prev) => ({ ...prev, [group.email]: !prev[group.email] }))
                                }
                                className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/[0.03] ${
                                  isExpanded ? "bg-white/[0.02]" : ""
                                }`}
                              >
                                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E5D5B8]/20 to-[#E5D5B8]/5 border border-[#E5D5B8]/10 text-xs font-semibold text-[#E5D5B8]">
                                  {getInitials(group.email)}
                                  {isExpanded && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#E5D5B8] border-2 border-[#0A0A0A]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-[13px] font-medium text-white/90">{group.email}</p>
                                    <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">
                                      {group.logs.length} events
                                    </span>
                                  </div>
                                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#E5D5B8]/60">
                                    <span className="h-1 w-1 rounded-full bg-[#E5D5B8]/40" />
                                    {group.summaryAction}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] text-white/30 font-medium">
                                    {new Date(group.latestAt || "").toLocaleDateString([], { month: "short", day: "numeric" })}
                                  </span>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-white/20 group-hover:text-white/40"
                                  >
                                    <ChevronDown size={14} />
                                  </motion.div>
                                </div>
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="bg-black/40"
                                  >
                                    <div className="relative ml-8 mr-4 space-y-0.5 border-l border-white/[0.08] py-2 pl-6">
                                      {group.logs.map((log, idx) => {
                                        const action = String(log.action || "").toLowerCase();
                                        const isDownload = action.includes("download");
                                        const isView = action.includes("view");

                                        return (
                                          <div key={log.id} className="group/item relative flex items-center justify-between py-2.5">
                                            <div className="absolute -left-[25px] flex h-2 w-2 rounded-full bg-white/10 group-hover/item:bg-[#E5D5B8]/40 transition-colors" />
                                            
                                            <div className="flex items-center gap-2.5">
                                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                                                isDownload ? "bg-blue-500/10 text-blue-400" : 
                                                isView ? "bg-emerald-500/10 text-emerald-400" : 
                                                "bg-white/5 text-white/40"
                                              }`}>
                                                {isDownload ? <Download size={12} /> : 
                                                 isView ? <Eye size={12} /> : 
                                                 <History size={12} />}
                                              </div>
                                              <span className="text-[12px] font-medium text-white/60">
                                                {normalizeActionLabel(log.action)}
                                              </span>
                                            </div>
                                            
                                            <div className="flex flex-col items-end">
                                              <span className="text-[10px] text-white/30 tabular-nums">
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

            <div className="border-t border-white/[0.06] px-4 py-3.5">
              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
