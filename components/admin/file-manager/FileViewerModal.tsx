"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock3, Loader2, MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { fileManagerApi, type FileCommentItem } from "@/lib/fileManagerApi";
import { adminApi } from "@/lib/api";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileUrl?: string | null;
  contentType?: string;
  fileMetaId?: string | null;
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

const getProjectIdFromFilePath = (value?: string | null) => {
  const segments = String(value || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.find((segment) => /^\d+$/.test(segment)) || segments[0] || "";
};

const getCommentId = (comment: FileCommentItem, fallback: string) =>
  String(comment.id || comment._id || comment.comment_id || fallback);

const getCommentUser = (comment: FileCommentItem) =>
  comment.userId || comment.user || comment.commented_by || null;

const getCommentAuthorName = (comment: FileCommentItem) =>
  String(
    getCommentUser(comment)?.name ||
      comment.commented_by_name ||
      comment.user_name ||
      comment.name ||
      "Unknown User"
  ).trim();

const getCommentAuthorId = (comment: FileCommentItem) =>
  String(getCommentUser(comment)?.id || comment.commented_by_id || "");

const getCommentCreatedAt = (comment: FileCommentItem) => comment.createdAt || comment.created_at;

const CommentRow = ({
  comment,
  currentUserId,
  onJumpToTimestamp,
  onReply,
  onDelete,
}: {
  comment: FileCommentItem;
  currentUserId?: string | null;
  onJumpToTimestamp?: (timestamp: number) => void;
  onReply: (comment: FileCommentItem) => void;
  onDelete: (comment: FileCommentItem) => void;
}) => {
  const author = getCommentUser(comment);
  const authorName = getCommentAuthorName(comment);
  const canDelete = currentUserId != null && getCommentAuthorId(comment) === String(currentUserId);
  const timestampLabel = formatVideoTimestamp(comment.timestamp);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        {author?.profile_picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.profile_picture}
            alt={authorName || "User"}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5D5B8]/18 text-xs font-semibold text-[#E5D5B8]">
            {getUserInitials(authorName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{authorName}</p>
            {getRoleLabel(author?.role) ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/45">
                {getRoleLabel(author?.role)}
              </span>
            ) : null}
            <span className="text-xs text-white/35">{formatCommentDate(getCommentCreatedAt(comment))}</span>
            {timestampLabel ? (
              <button
                type="button"
                onClick={() => onJumpToTimestamp?.(comment.timestamp as number)}
                className="inline-flex items-center gap-1 rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8]/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#E5D5B8] transition hover:bg-[#E5D5B8]/20"
              >
                <Clock3 className="h-3 w-3" />
                {timestampLabel}
              </button>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/78">{comment.comment}</p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1 text-white/45 transition hover:text-white/80"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1 text-red-300 transition hover:text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : null}
          </div>

          {comment.replies?.length ? (
            <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
              {comment.replies.map((reply, replyIndex) => {
                const replyAuthor = getCommentUser(reply);
                const replyAuthorName = getCommentAuthorName(reply);
                const replyCanDelete = currentUserId != null && getCommentAuthorId(reply) === String(currentUserId);
                return (
                  <div key={getCommentId(reply, `${getCommentId(comment, "comment")}-reply-${replyIndex}`)} className="rounded-xl bg-black/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-white">{replyAuthorName}</p>
                      {getRoleLabel(replyAuthor?.role) ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/45">
                          {getRoleLabel(replyAuthor?.role)}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-white/35">{formatCommentDate(getCommentCreatedAt(reply))}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/72">{reply.comment}</p>
                    {replyCanDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(reply)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-300 transition hover:text-red-200"
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
        const createdComment = await fileManagerApi.addComment({
          fileMetaId: fileMetaId as string,
          user_id: currentUserId as string,
          comment: commentText.trim(),
          timestamp: videoFile ? selectedTimestamp : null,
          commented_by_name: user?.name || user?.email || "Client",
          file_name: fileName,
          file_url: fileUrl,
        });
        const actorName = user?.name || user?.email || "Client";
        const projectId = getProjectIdFromFilePath(fileMetaId);
        const createdCommentId = getCommentId(createdComment, "");
        const commentTargetQuery = new URLSearchParams();
        if (fileMetaId) commentTargetQuery.set("filePath", fileMetaId);
        if (createdCommentId) commentTargetQuery.set("commentId", createdCommentId);
        const commentTargetUrl = projectId
          ? `/admin/file-manager/${encodeURIComponent(projectId)}${commentTargetQuery.toString() ? `?${commentTargetQuery.toString()}` : ""}`
          : "/admin/notifications";
        const notificationResult = await adminApi.createNotification({
          recipient_scope: "role",
          recipient_roles: "admin,Admin,sales_admin,Sales_Admin,Sales_admin",
          notification_type: "GENERAL",
          category: "messages",
          priority: "medium",
          title: `New file comment from ${actorName}`,
          message: `${actorName}: ${commentText.trim()}`,
          entity_type: "file_comment",
          entity_id: createdCommentId || projectId || fileMetaId || null,
          action_url: commentTargetUrl,
          action_label: "View Comment",
          actor_user_id: currentUserId,
          actor_name: actorName,
          actor_avatar_url: null,
          metadata: {
            type: "file_comment",
            senderId: currentUserId,
            senderName: actorName,
            filePath: fileMetaId,
            fileName,
            fileUrl,
            projectId,
            commentId: createdCommentId,
            comment: commentText.trim(),
            timestamp: videoFile ? selectedTimestamp : null,
          },
        });
        if (notificationResult?.error) {
          toast.warning("Comment added, but notification could not be sent.");
        }
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[96vw] border-white/10 bg-[#101010] p-0 text-white">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="truncate text-white">{fileName || "File Viewer"}</DialogTitle>
        </DialogHeader>

        <div className="grid h-[85vh] w-full gap-0 lg:grid-cols-[minmax(0,1.4fr)_420px]">
          <div className="min-h-0 bg-[#0b0b0b] p-4">
            {!fileUrl ? (
              <div className="flex h-full items-center justify-center text-white/60">Loading file...</div>
            ) : isImage(contentType, fileName) ? (
              <div className="flex h-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl} alt={fileName || "Preview"} className="max-h-full max-w-full rounded-lg object-contain" />
              </div>
            ) : isVideo(contentType, fileName) ? (
              <video ref={videoRef} src={fileUrl} controls className="h-full w-full rounded-lg bg-black" />
            ) : isPdf(contentType, fileName) ? (
              <iframe src={fileUrl} title={fileName || "PDF preview"} className="h-full w-full rounded-lg bg-white" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-white/70">
                <p>Preview is not available for this file type.</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-[#E5D5B8] px-4 py-2 text-sm font-medium text-black"
                >
                  Open File
                </a>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col border-t border-white/10 bg-[#121212] lg:border-l lg:border-t-0">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#E5D5B8]" />
                <h3 className="text-sm font-semibold text-white">Comments</h3>
              </div>
              <p className="mt-1 text-xs text-white/40">Everyone with access to this file can view the discussion.</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!fileMetaId ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-white/40">
                  Commenting is not available for this file yet.
                </div>
              ) : loadingComments ? (
                <div className="flex items-center gap-2 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-white/40">
                  No comments yet. Start the conversation here.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment, commentIndex) => (
                    <CommentRow
                      key={getCommentId(comment, `comment-${commentIndex}`)}
                      comment={comment}
                      currentUserId={currentUserId}
                      onJumpToTimestamp={handleJumpToTimestamp}
                      onReply={setReplyingTo}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              {replyingTo ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#E5D5B8]/20 bg-[#E5D5B8]/10 px-3 py-2 text-xs text-[#E5D5B8]">
                  <span className="truncate">Replying to: {replyingTo.comment}</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-white/60 transition hover:text-white">
                    Cancel
                  </button>
                </div>
              ) : null}

              {videoFile ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#181818] px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Clock3 className="h-3.5 w-3.5 text-[#E5D5B8]" />
                    <span>{selectedTimestamp != null ? `Timestamp selected: ${formatVideoTimestamp(selectedTimestamp)}` : "Add a timestamp to point to a specific video moment."}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTimestamp != null ? (
                      <button
                        type="button"
                        onClick={() => setSelectedTimestamp(null)}
                        className="text-xs text-white/45 transition hover:text-white"
                      >
                        Clear
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleAttachCurrentTimestamp}
                      disabled={!fileUrl}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E5D5B8]/25 bg-[#E5D5B8]/10 px-3 py-1.5 text-xs font-semibold text-[#E5D5B8] transition hover:bg-[#E5D5B8]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      Use Current Time
                    </button>
                  </div>
                </div>
              ) : null}

              <textarea
                rows={4}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={canComment ? "Add a comment..." : "Sign in to comment"}
                disabled={!canComment || submitting}
                className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#E5D5B8]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canComment || !commentText.trim() || submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E5D5B8] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#d8c49e] disabled:cursor-not-allowed disabled:opacity-60"
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
