"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock3, Loader2, MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { fileManagerApi, type FileCommentItem } from "@/lib/fileManagerApi";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileUrl?: string | null;
  contentType?: string;
  fileMetaId?: string | null;
  isDark?: boolean;
}

const isImage = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName || "");
};

const isVideo = (contentType?: string, fileName?: string) => {
  if (contentType?.startsWith("video/")) return true;
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(fileName || "");
};

const isPdf = (contentType?: string, fileName?: string) => {
  if (contentType === "application/pdf") return true;
  return /\.pdf$/i.test(fileName || "");
};

const formatCommentDate = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatVideoTimestamp = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return null;

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getUserInitials = (name?: string | null) =>
  String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getRoleLabel = (role?: string | null) => {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "sales_rep") return "Sales Rep";
  if (normalized === "pm") return "Project Manager";
  if (normalized === "cp") return "Creative Partner";
  if (normalized === "client") return "Client";
  if (normalized === "admin") return "Admin";
  if (normalized === "creator") return "Creator";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const CommentRow = ({
  comment,
  currentUserId,
  onJumpToTimestamp,
  onReply,
  onDelete,
  isDark = true,
}: {
  comment: FileCommentItem;
  currentUserId?: string | null;
  onJumpToTimestamp?: (timestamp: number) => void;
  onReply: (comment: FileCommentItem) => void;
  onDelete: (comment: FileCommentItem) => void;
  isDark?: boolean;
}) => {
  const canDelete = currentUserId != null && String(comment.userId?.id || "") === String(currentUserId);
  const timestampLabel = formatVideoTimestamp(comment.timestamp);

  const accentText = isDark ? "text-[#E5D5B8]" : "text-[#E8D1AB]";
  const accentBg = isDark ? "bg-[#E5D5B8]/10" : "bg-[#E8D1AB]/10";
  const accentBorder = isDark ? "border-[#E5D5B8]/20" : "border-[#E8D1AB]/20";
  const hoverAccentBg = isDark ? "hover:bg-[#E5D5B8]/20" : "hover:bg-[#E8D1AB]/10";

  return (
    <div className={`rounded-2xl border p-3 lg:p-4 transition-colors ${
      isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"
    }`}>
      <div className="flex items-start gap-3">
        {comment.userId?.profile_picture ? (
          <img
            src={comment.userId.profile_picture}
            alt={comment.userId?.name || "User"}
            className="h-9 w-9 lg:h-10 lg:w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={`flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${
            isDark ? "bg-[#E5D5B8]/20 text-[#E5D5B8]" : "bg-[#E8D1AB]/30 text-[#8F6F35]"
          }`}>
            {getUserInitials(comment.userId?.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
              {comment.userId?.name || "Unknown User"}
            </p>
            {getRoleLabel(comment.userId?.role) ? (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                isDark ? "border-white/10 bg-white/5 text-white/45" : "border-black/10 bg-black/5 text-black/50"
              }`}>
                {getRoleLabel(comment.userId?.role)}
              </span>
            ) : null}
            <span className={`text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>
              {formatCommentDate(comment.createdAt)}
            </span>
            {timestampLabel ? (
              <button
                type="button"
                onClick={() => onJumpToTimestamp?.(comment.timestamp as number)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] transition ${accentText} ${accentBg} ${accentBorder} ${hoverAccentBg}`}
              >
                <Clock3 className="h-3 w-3" />
                {timestampLabel}
              </button>
            ) : null}
          </div>
          <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${isDark ? "text-white/78" : "text-black/80"}`}>
            {comment.comment}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className={`inline-flex items-center gap-1 transition ${isDark ? "text-white/45 hover:text-white/80" : "text-black/40 hover:text-black/70"}`}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className={`inline-flex items-center gap-1 transition ${isDark ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : null}
          </div>

          {comment.replies?.length ? (
            <div className={`mt-4 space-y-3 border-l pl-3 lg:pl-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
              {comment.replies.map((reply) => {
                const replyCanDelete = currentUserId != null && String(reply.userId?.id || "") === String(currentUserId);
                return (
                  <div key={reply.id} className={`rounded-xl p-3 ${isDark ? "bg-black/20" : "bg-black/[0.04]"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>{reply.userId?.name || "Unknown User"}</p>
                      {getRoleLabel(reply.userId?.role) ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${
                          isDark ? "border-white/10 bg-white/5 text-white/45" : "border-black/10 bg-black/5 text-black/50"
                        }`}>
                          {getRoleLabel(reply.userId?.role)}
                        </span>
                      ) : null}
                      <span className={`text-xs ${isDark ? "text-white/35" : "text-black/40"}`}>{formatCommentDate(reply.createdAt)}</span>
                    </div>
                    <p className={`mt-1 whitespace-pre-wrap break-words text-xs leading-5 ${isDark ? "text-white/72" : "text-black/70"}`}>{reply.comment}</p>
                    {replyCanDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(reply)}
                        className={`mt-2 inline-flex items-center gap-1 text-xs transition ${isDark ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default function FileViewerModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  contentType,
  fileMetaId,
  isDark = true
}: FileViewerModalProps) {
  const { user } = useAuth();
  const currentUserId = user?.id != null ? String(user.id) : null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [comments, setComments] = useState<FileCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<FileCommentItem | null>(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const videoFile = useMemo(() => isVideo(contentType, fileName), [contentType, fileName]);

  const canComment = useMemo(() => Boolean(fileMetaId && currentUserId), [fileMetaId, currentUserId]);

  const loadComments = useCallback(async () => {
    if (!fileMetaId) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    try {
      const response = await fileManagerApi.getComments(fileMetaId);
      setComments(Array.isArray(response) ? response : []);
    } catch (error: unknown) {
      const message = typeof error === "object" && error && "message" in error ? String(error.message) : "Failed to load comments";
      toast.error(message);
    } finally {
      setLoadingComments(false);
    }
  }, [fileMetaId]);

  useEffect(() => {
    if (!isOpen) return;
    setCommentText("");
    setReplyingTo(null);
    setSelectedTimestamp(null);
    loadComments();
  }, [isOpen, fileMetaId, loadComments]);

  const handleAttachCurrentTimestamp = () => {
    if (!videoFile || !videoRef.current) return;
    setSelectedTimestamp(videoRef.current.currentTime);
  };

  const handleJumpToTimestamp = (timestamp: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    void videoRef.current.play().catch(() => undefined);
  };

  const handleSubmit = async () => {
    if (!canComment || !commentText.trim()) return;

    setSubmitting(true);
    try {
      if (replyingTo?.id) {
        await fileManagerApi.replyToComment(replyingTo.id, {
          user_id: currentUserId as string,
          comment: commentText.trim(),
        });
        toast.success("Reply added");
      } else {
        await fileManagerApi.addComment({
          fileMetaId: fileMetaId as string,
          user_id: currentUserId as string,
          comment: commentText.trim(),
          timestamp: videoFile ? selectedTimestamp : null,
        });
        toast.success("Comment added");
      }

      setCommentText("");
      setReplyingTo(null);
      setSelectedTimestamp(null);
      await loadComments();
    } catch (error: unknown) {
      const message = typeof error === "object" && error && "message" in error ? String(error.message) : "Failed to save comment";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment: FileCommentItem) => {
    if (!currentUserId) return;

    try {
      await fileManagerApi.deleteComment(comment.id, currentUserId);
      toast.success("Comment deleted");
      if (replyingTo?.id === comment.id) {
        setReplyingTo(null);
      }
      await loadComments();
    } catch (error: unknown) {
      const message = typeof error === "object" && error && "message" in error ? String(error.message) : "Failed to delete comment";
      toast.error(message);
    }
  };

  const primaryBrandBg = isDark ? "bg-[#E5D5B8] hover:bg-[#d8c49e]" : "bg-[#E8D1AB] hover:bg-[#ddc396]";
  const textContrastClass = isDark ? "text-white" : "text-black";
  const secondaryTextClass = isDark ? "text-white/60" : "text-black/60";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-7xl w-[96vw] max-h-[92vh] lg:max-h-[88vh] p-0 border transition-colors flex flex-col overflow-hidden ${
        isDark ? "border-white/10 bg-[#101010] text-white" : "border-black/10 bg-white text-black"
      }`}>
        <DialogHeader className={`border-b px-4 py-3 lg:px-6 lg:py-4 shrink-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
          <DialogTitle className={`block truncate max-w-[calc(100%-2.5rem)] font-semibold text-base lg:text-lg ${textContrastClass}`}>{fileName || "File Viewer"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] flex-1 min-h-0 w-full overflow-y-auto lg:overflow-visible">
          {/* File Canvas Viewer Box */}
          <div className={`flex items-center justify-center min-h-[280px] h-[45vh] sm:h-[50vh] lg:h-full p-3 lg:p-4 transition-colors shrink-0 ${
            isDark ? "bg-[#0b0b0b]" : "bg-black/[0.02]"
          }`}>
            {!fileUrl ? (
              <div className={`flex h-full items-center justify-center text-sm ${secondaryTextClass}`}>Loading file...</div>
            ) : isImage(contentType, fileName) ? (
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                <img 
                  src={fileUrl} 
                  alt={fileName || "Preview"} 
                  className="max-h-full max-w-full w-auto h-auto rounded-lg object-contain" 
                />
              </div>
            ) : isVideo(contentType, fileName) ? (
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef} 
                  src={fileUrl} 
                  controls 
                  className="max-h-full max-w-full w-auto h-auto rounded-lg bg-black object-contain shadow-sm" 
                />
              </div>
            ) : isPdf(contentType, fileName) ? (
              <iframe src={fileUrl} title={fileName || "PDF preview"} className={`h-full w-full rounded-lg border ${isDark ? "bg-white border-transparent" : "bg-white border-black/10"}`} />
            ) : (
              <div className={`flex h-full flex-col items-center justify-center gap-4 text-sm py-8 ${isDark ? "text-white/70" : "text-black/70"}`}>
                <p>Preview is not available for this file type.</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-black transition shadow-sm ${primaryBrandBg}`}
                >
                  Open File
                </a>
              </div>
            )}
          </div>

          {/* Comments Sidebar Section */}
          <div className={`flex flex-col lg:h-full border-t lg:border-t-0 lg:border-l min-h-[380px] lg:min-h-0 transition-colors ${
            isDark ? "border-white/10 bg-[#121212]" : "border-black/10 bg-black/[0.01]"
          }`}>
            <div className={`border-b px-4 py-3 lg:px-5 lg:py-4 shrink-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`h-4 w-4 ${isDark ? "text-[#E5D5B8]" : "text-[#B18A00]"}`} />
                <h3 className={`text-sm font-semibold ${textContrastClass}`}>Comments</h3>
              </div>
              <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>Everyone with access to this file can view the discussion.</p>
            </div>

            {/* Scrollable thread window */}
            <div className="flex-1 overflow-y-auto px-4 py-3 lg:px-5 lg:py-4 ">
              {!fileMetaId ? (
                <div className={`flex h-full items-center justify-center text-center text-xs lg:text-sm py-8 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Commenting is not available for this file yet.
                </div>
              ) : loadingComments ? (
                <div className={`flex items-center gap-2 text-xs lg:text-sm py-4 ${isDark ? "text-white/55" : "text-black/55"}`}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className={`flex h-full items-center justify-center text-center text-xs lg:text-sm py-8 ${isDark ? "text-white/40" : "text-black/40"}`}>
                  No comments yet. Start the conversation here.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      onJumpToTimestamp={handleJumpToTimestamp}
                      onReply={setReplyingTo}
                      onDelete={handleDelete}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Input Form Box Footer */}
            <div className={`border-t px-4 py-3 lg:px-5 lg:py-4 shrink-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
              {replyingTo ? (
                <div className={`mb-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition-colors ${
                  isDark 
                    ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/10 text-[#E5D5B8]" 
                    : "border-[#B18A00]/20 bg-[#B18A00]/5 text-[#B18A00]"
                }`}>
                  <span className="truncate">Replying to: {replyingTo.comment}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className={`transition ${isDark ? "text-white/60 hover:text-white" : "text-black/50 hover:text-black/80"}`}>
                    Cancel
                  </button>
                </div>
              ) : null}

              {videoFile ? (
                <div className={`mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                  isDark ? "border-white/10 bg-[#181818]" : "border-black/10 bg-white"
                }`}>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-white/60" : "text-black/50"}`}>
                    <Clock3 className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-[#E5D5B8]" : "text-[#B18A00]"}`} />
                    <span className="leading-normal">{selectedTimestamp != null ? `Timestamp: ${formatVideoTimestamp(selectedTimestamp)}` : "Add a video timestamp."}</span>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {selectedTimestamp != null ? (
                      <button
                        type="button"
                        onClick={() => setSelectedTimestamp(null)}
                        className={`text-xs transition ${isDark ? "text-white/45 hover:text-white" : "text-black/40 hover:text-black/70"}`}
                      >
                        Clear
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleAttachCurrentTimestamp}
                      disabled={!fileUrl}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        isDark 
                          ? "border-[#E5D5B8]/25 bg-[#E5D5B8]/10 text-[#E5D5B8] hover:bg-[#E5D5B8]/20" 
                          : "border-[#B18A00]/25 bg-[#B18A00]/5 text-[#B18A00] hover:bg-[#B18A00]/10"
                      }`}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      Use Current Time
                    </button>
                  </div>
                </div>
              ) : null}

              <textarea
                rows={3}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={canComment ? "Add a comment..." : "Sign in to comment"}
                disabled={!canComment || submitting}
                className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 resize-none ${
                  isDark 
                    ? "border-white/10 bg-[#181818] text-white placeholder:text-white/30 focus:border-[#E5D5B8]/40" 
                    : "border-black/10 bg-white text-black placeholder:text-black/40 focus:border-[#B18A00]/40"
                }`}
              />
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canComment || !commentText.trim() || submitting}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-60 shadow-sm ${primaryBrandBg}`}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {replyingTo ? "Reply" : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}