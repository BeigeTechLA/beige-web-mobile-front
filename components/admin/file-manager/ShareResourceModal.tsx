"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Globe2, ChevronDown, History, User, Copy, CheckCircle2, Link, Eye, Download, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  const [expandedEmails, setExpandedEmails] = useState<string[]>([]);

  const reset = () => {
    setActiveTab("people");
    setEmailInput("");
    setShareMessage("");
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
      <DialogContent className="w-[calc(100vw-24px)] max-w-[500px] overflow-hidden rounded-[18px] border border-white/20 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden">
        <DialogTitle className="sr-only">Share {resource?.label}</DialogTitle>

        <div className="relative border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold leading-none text-white">
                Share <span className="text-[#E8D1AB]">({resource?.label || "Resource"})</span>
              </h2>
              <p className="mt-2.5 text-[11px] font-medium leading-[1.4] text-white/40">
                Note : Recipients Must Verify their Email with and OTP each time they access shared files.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="h-[440px] overflow-y-auto no-scrollbar px-6 py-4">
          <div className="space-y-3.5 h-full flex flex-col">
            <div className="flex-1 space-y-3.5">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <fieldset className="rounded-[8px] border border-white/25 px-4 pb-2.5 pt-1 focus-within:border-[#E8D1AB] transition-colors">
                  <legend className="px-1 text-[11px] leading-none text-white/55 font-medium">
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
                    className="w-full bg-transparent px-0 py-0.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:ring-0"
                  />
                </fieldset>

                {pendingEmails.length > 0 && (
                  <div className="max-h-[60px] overflow-y-auto no-scrollbar pt-0.5 pr-1">
                    <div className="flex flex-wrap gap-2">
                      {pendingEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] text-white border border-white/5"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removePendingEmail(email)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <fieldset className="rounded-[8px] border border-white/25 px-4 pb-2.5 pt-1 focus-within:border-[#E8D1AB] transition-colors">
                <legend className="px-1 text-[11px] leading-none text-white/55 font-medium">
                  Message (Optional)
                </legend>
                <Textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Write a short note..."
                  className="min-h-[50px] resize-none border-0 bg-transparent p-0 text-[14px] text-white shadow-none placeholder:text-white/25 focus-visible:ring-0"
                />
              </fieldset>

              <button
                type="button"
                onClick={addCurrentEmail}
                disabled={!emailInput.trim()}
                className="h-[32px] rounded-[6px] bg-[#E8D1AB] px-6 text-[12px] font-bold text-black transition-all hover:bg-[#dcb98a] disabled:opacity-40"
              >
                Add
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between pb-0.5">
                <button
                  onClick={() => setActiveTab("people")}
                  className={`text-[14px] font-bold transition-colors ${activeTab === "people" ? "text-white" : "text-white/40 hover:text-white/60"
                    }`}
                >
                  People Access With
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`text-[13px] font-bold transition-all underline decoration-1 underline-offset-4 ${activeTab === "activity" ? "text-[#E2C799]" : "text-[#E2C799]/70 hover:text-[#E2C799]"
                    }`}
                >
                  View Activity
                </button>
              </div>

              {activeTab === "people" ? (
                <div className="space-y-3">
                  {listLoading ? (
                    <div className="flex justify-center py-6">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8D1AB]/20 border-t-[#E8D1AB]" />
                    </div>
                  ) : sharedItems.filter(i => i.accessMode !== "anyone_with_link").length === 0 ? (
                    <div className="py-3 text-center text-xs text-white/30 italic">No one has access yet.</div>
                  ) : (
                    <div className="max-h-[170px] overflow-y-auto pr-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                      {sharedItems
                        .filter(i => i.accessMode !== "anyone_with_link")
                        .map((item) => (
                          <div key={item.shareId} className="flex items-center justify-between gap-3 group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB]/10 border border-[#E8D1AB]/20 text-[#E8D1AB]">
                                <User size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                  {item.email}
                                </p>
                                <p className="truncate text-[11px] text-white/40">
                                  Private access
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyByToken(item.shareToken)}
                                className={`flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-[11px] font-bold transition-all ${copiedToken === item.shareToken ? "bg-emerald-500 text-white" : "bg-[#1A1A1A] text-white hover:bg-white/10"
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
                                onClick={() => handleRevoke(item.shareId)}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                title="Revoke"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-[14px] font-bold text-white/90">General Access</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A]">
                          <Globe2 size={24} className="text-white/60" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Anyone with the link</p>
                          <p className="text-[11px] text-white/40">Anyone on the Internet with the link can view</p>
                        </div>
                      </div>
                      {anyoneShare ? (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleCopyByToken(anyoneShare.shareToken)}
                            className={`transition-colors ${copiedToken === anyoneShare.shareToken ? "text-emerald-400" : "text-white/80 hover:text-white"}`}
                            title="Copy Link"
                          >
                            {copiedToken === anyoneShare.shareToken ? <CheckCircle2 size={22} /> : <Link size={22} />}
                          </button>
                          <button
                            onClick={() => handleRevoke(anyoneShare.shareId)}
                            className="text-[#FF4D4D]/60 hover:text-[#FF4D4D] transition-colors"
                            title="Revoke Link"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleEnableAnyoneWithLink}
                          disabled={sharingAnyone}
                          className="h-[44px] rounded-[10px] bg-[#B5A48B] px-8 text-[13px] font-bold text-black transition-all hover:opacity-90 disabled:opacity-40"
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
                      <History size={32} className="mx-auto mb-2 text-white/10" />
                      <p className="text-xs text-white/30">No activity logged yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupedAccessLogs.map((group) => {
                        const isExpanded = expandedEmails.includes(group.email);
                        const initials = group.email.substring(0, 2).toUpperCase();
                        
                        return (
                          <div key={group.email} className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.01]">
                            <button
                              onClick={() => toggleExpand(group.email)}
                              className="w-full text-left px-4 py-3 focus:outline-none transition-colors hover:bg-white/[0.02]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/70">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate text-[13px] font-bold text-white/90">{group.email}</span>
                                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-white/30 uppercase tracking-wider">
                                        {group.logs.length} {group.logs.length === 1 ? 'event' : 'events'}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/40">
                                      <span className="h-1 w-1 rounded-full bg-white/20" />
                                      <span className="font-medium">{normalizeActionLabel(group.logs[0]?.action)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-medium text-white/30">
                                    {new Date(group.latestAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
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
                                  <div className="relative mx-4 mb-4 ml-6 space-y-4 rounded-lg bg-black/40 p-4 pt-5 border-t border-white/5">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[11px] top-[24px] bottom-[24px] w-[1px] border-l border-dashed border-white/10" />
                                    
                                    {group.logs.map((log, i) => (
                                      <div key={i} className="relative flex items-center justify-between z-10 pl-4">
                                        <div className="flex items-center gap-3">
                                          {getActionIcon(log.action)}
                                          <span className="text-[11px] font-bold text-white/80">
                                            {normalizeActionLabel(log.action)}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-white/20 tabular-nums">
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
      </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 px-6 py-5 bg-[#050505]">
          <Button
            onClick={handleCreateShare}
            disabled={loading || (pendingEmails.length === 0 && !emailInput.trim())}
            className="h-[44px] rounded-[8px] bg-[#E8D1AB] text-[13px] font-bold text-black border-0 hover:bg-[#dcb98a]"
          >
            {loading ? "Sharing..." : "Share Access"}
          </Button>
          <Button
            onClick={handleClose}
            className="h-[44px] rounded-[8px] bg-[#1A1A1A] text-[13px] font-bold text-white border border-white/5 hover:bg-white/10"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
