"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, X, Share2, Mail, Link2, Users, CheckCircle2 } from "lucide-react";

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

export default function ShareResourceModal({ isOpen, onClose, resource }: ShareResourceModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharedItems, setSharedItems] = useState<Array<{ shareId: number; shareToken: string; email: string }>>([]);
  const [listLoading, setListLoading] = useState(false);
  const [revokingShareId, setRevokingShareId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setShareUrl("");
    setLoading(false);
    setCopied(false);
    setCopiedToken(null);
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
      setSharedItems((rows || []).map((row: any) => ({ shareId: row.shareId, shareToken: row.shareToken, email: row.email })));
    } catch (error: any) {
      toast.error(error?.message || "Failed to load shared emails");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && resource) {
      void loadSharedItems();
    }
  }, [isOpen, resource?.externalId, resource?.resourceType, resource?.phase, resource?.path, resource?.filepath]);

  const handleCreateShare = async () => {
    if (!resource) return;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter an email");
      return;
    }
    try {
      setLoading(true);
      const response = await fileManagerApi.createExternalShare({
        resourceType: resource.resourceType,
        externalId: resource.externalId,
        phase: resource.phase,
        path: resource.path,
        filepath: resource.filepath,
        email: normalizedEmail,
      });
      const createdUrl = response?.shareUrl || "";
      setShareUrl(createdUrl);
      setEmail("");
      toast.success("Share link created");
      await loadSharedItems();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-black/40"
          >
            {/* Decorative gradient */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#E5D5B8]/10 blur-[80px]" />

            {/* Header */}
            <div className="relative flex items-start justify-between border-b border-white/[0.06] p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5D5B8]/15">
                  <Share2 className="h-5 w-5 text-[#E5D5B8]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Share {resource?.label || "Resource"}</h2>
                  <p className="mt-0.5 text-xs text-white/40">Invite people via email to access this {resource?.resourceType || "resource"}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative space-y-5 p-5">
              {/* Email Input Section */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                  <Mail size={12} />
                  Invite by Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && email.trim() && handleCreateShare()}
                      placeholder="client@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#E5D5B8]/15"
                    />
                  </div>
                  <Button
                    onClick={handleCreateShare}
                    disabled={loading || !email.trim()}
                    className="h-[46px] rounded-xl bg-[#E5D5B8] px-5 text-sm font-semibold text-black transition-all hover:bg-[#dcb98a] disabled:opacity-40"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                        Sharing…
                      </span>
                    ) : (
                      "Share"
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Link (after creation) */}
              <AnimatePresence>
                {shareUrl && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                      <Link2 size={12} />
                      Share Link Created
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-[#E5D5B8]/20 bg-[#E5D5B8]/[0.04] p-3">
                      <p className="min-w-0 flex-1 truncate text-xs text-white/70">{shareUrl}</p>
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          copied
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shared With Section */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                  <Users size={12} />
                  People with Access
                  {sharedItems.length > 0 && (
                    <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      {sharedItems.length}
                    </span>
                  )}
                </label>
                <div className="max-h-56 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  {listLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-8">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                      <span className="text-sm text-white/50">Loading…</span>
                    </div>
                  ) : sharedItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                        <Users size={18} className="text-white/25" />
                      </div>
                      <p className="text-sm text-white/35">No one has access yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.05]">
                      {sharedItems.map((item) => (
                        <div
                          key={item.shareId}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E5D5B8]/30 to-[#E5D5B8]/10 text-xs font-semibold text-[#E5D5B8]">
                            {getInitials(item.email)}
                          </div>
                          <p className="min-w-0 flex-1 truncate text-sm text-white/80">{item.email}</p>
                          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleCopyByToken(item.shareToken)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                copiedToken === item.shareToken
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "text-white/50 hover:bg-white/10 hover:text-white"
                              }`}
                              title="Copy link"
                            >
                              {copiedToken === item.shareToken ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(item.shareId)}
                              disabled={revokingShareId === item.shareId}
                              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] px-5 py-4">
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
