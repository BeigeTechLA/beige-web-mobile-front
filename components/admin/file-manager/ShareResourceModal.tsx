"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";

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

  const reset = () => {
    setEmail("");
    setShareUrl("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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
      toast.success("Share link created");
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
      toast.success("Share link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="border-white/10 bg-[#111111] text-white">
        <DialogHeader>
          <DialogTitle>Share {resource?.label || "Resource"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80">Allowed Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-sm text-white outline-none focus:border-[#E5D5B8]"
            />
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <label className="text-sm text-white/80">Share Link</label>
              <div className="rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs break-all text-white/80">
                {shareUrl}
              </div>
              <Button onClick={handleCopy} className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90">
                Copy Link
              </Button>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateShare}
              disabled={loading || !email.trim()}
              className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
            >
              {loading ? "Creating..." : "Create Share Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
