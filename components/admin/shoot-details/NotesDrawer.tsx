"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smile,
  Send,
  Eye,
  Download,
  MoreHorizontal,
  ThumbsUp,
  Paperclip,
  Loader2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

// Quick reactions for emoji picker
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"] as const;
const EMOJI_TO_REACTION: Record<string, string> = {
  "👍": "like",
  "❤️": "love",
  "😂": "laugh",
  "😮": "wow",
  "😢": "sad",
};
const REACTION_TO_EMOJI: Record<string, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
};
const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "");

const resolveS3AssetUrl = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalizedPrefix = S3_PREFIX.replace(/\/+$/, "");
  const normalizedPath = raw.replace(/^\/+/, "");
  return normalizedPrefix ? `${normalizedPrefix}/${normalizedPath}` : raw;
};

const isImageAttachment = (name: string, mimeType?: string | null) => {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(String(name || ""));
};

const isPdfAttachment = (name: string, mimeType?: string | null) => {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "application/pdf") return true;
  return /\.pdf$/i.test(String(name || ""));
};

type NoteUiItem = {
  id: number;
  user: { name: string; avatar: string };
  timestamp: { date: string; time: string };
  message: string;
  likes: number;
  likedByMe: boolean;
  myReactions: string[];
  reactionCounts: Record<string, number>;
  reactionUsersByType: Record<string, Array<{ userId: number; name: string }>>;
  attachments: Array<{
    id: number;
    fileName: string;
    filePath: string;
    mimeType?: string | null;
  }>;
  replies: Array<{
    id: number;
    user: { name: string; avatar: string };
    timestamp: { date: string; time: string };
    message: string;
    attachments: Array<{
      id: number;
      fileName: string;
      filePath: string;
      mimeType?: string | null;
    }>;
  }>;
};

const OPTIMISTIC_REACTION_USER = { userId: -1, name: "You" };

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

const formatNoteTimestamp = (value: unknown) => {
  try {
    const parsed = typeof value === "string" ? new Date(value) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      return { date: "Unknown date", time: "" };
    }
    return {
      date: format(parsed, "MMM d, yyyy"),
      time: format(parsed, "hh:mm a"),
    };
  } catch {
    return { date: "Unknown date", time: "" };
  }
};

const mapShootNotesToUi = (payload: any): NoteUiItem[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notes)
      ? payload.notes
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return list.map((note: any) => {
    const ts = formatNoteTimestamp(note?.created_at || note?.createdAt);
    const replies = Array.isArray(note?.replies) ? note.replies : [];
    const reactions = Array.isArray(note?.reactions) ? note.reactions : [];
    const reactionCounts: Record<string, number> = {};
    const reactionUsersByType: Record<string, Array<{ userId: number; name: string }>> = {};

    reactions.forEach((r: any) => {
      const key = String(r?.reaction_type || r?.reaction || "").toLowerCase().trim();
      if (!key) return;
      reactionCounts[key] = (reactionCounts[key] || 0) + 1;

      if (!reactionUsersByType[key]) reactionUsersByType[key] = [];
      const userId = Number(r?.user_id || r?.user?.id || 0);
      const userName = String(r?.user?.name || r?.user?.email || (userId ? `User ${userId}` : "Unknown User"));
      if (!reactionUsersByType[key].some((u) => u.userId === userId)) {
        reactionUsersByType[key].push({ userId, name: userName });
      }
    });

    if (note?.reaction_users_by_type && typeof note.reaction_users_by_type === "object") {
      Object.entries(note.reaction_users_by_type).forEach(([reaction, users]) => {
        const key = String(reaction || "").toLowerCase().trim();
        if (!key || !Array.isArray(users)) return;
        reactionUsersByType[key] = users.map((user: any) => ({
          userId: Number(user?.user_id || user?.id || 0),
          name: String(user?.name || user?.email || "Unknown User"),
        }));
        reactionCounts[key] = reactionUsersByType[key].length;
      });
    }

    if (!reactionCounts.like && Number(note?.like_count || 0) > 0) {
      reactionCounts.like = Number(note.like_count);
    }
    const likes = Number(reactionCounts.like || 0);
    const myReactions = Array.isArray(note?.my_reactions)
      ? note.my_reactions.map((x: any) => String(x || "").toLowerCase()).filter(Boolean)
      : note?.my_reaction
        ? [String(note.my_reaction).toLowerCase()]
      : [];

    return {
      id: Number(note?.note_id || note?.id || 0),
      user: {
        name: note?.user?.name || note?.created_by?.name || "Unknown User",
        avatar: note?.user?.avatar || note?.created_by?.avatar || FALLBACK_AVATAR,
      },
      timestamp: ts,
      message: note?.message || note?.note || "",
      likes,
      likedByMe: myReactions.includes("like"),
      myReactions: myReactions || [],
      reactionCounts: reactionCounts || {},
      reactionUsersByType,
      attachments: Array.isArray(note?.attachments)
        ? note.attachments.map((file: any) => ({
            id: Number(file?.attachment_id || 0),
            fileName: file?.file_name || "Attachment",
            filePath: file?.file_path || "",
            mimeType: file?.mime_type || null,
          }))
        : [],
      replies: replies.map((reply: any) => {
        const replyTs = formatNoteTimestamp(reply?.created_at || reply?.createdAt);
        return {
          id: Number(reply?.note_id || reply?.id || 0),
          user: {
            name: reply?.user?.name || reply?.created_by?.name || "Unknown User",
            avatar: reply?.user?.avatar || reply?.created_by?.avatar || FALLBACK_AVATAR,
          },
          timestamp: replyTs,
          message: reply?.message || reply?.note || "",
          attachments: Array.isArray(reply?.attachments)
            ? reply.attachments.map((file: any) => ({
                id: Number(file?.attachment_id || 0),
                fileName: file?.file_name || "Attachment",
                filePath: file?.file_path || "",
                mimeType: file?.mime_type || null,
              }))
            : [],
        };
      }),
    };
  });
};


// Main Notes Drawer Component
export default function NotesDrawer({
  isOpen,
  onClose,
  shootId,
  isDark = true
}: {
  isOpen: boolean;
  onClose: () => void;
  shootId?: string;
  isDark?: boolean;
}) {
  const [notes, setNotes] = useState<NoteUiItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showComposerEmojis, setShowComposerEmojis] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [showAttachmentConfirmModal, setShowAttachmentConfirmModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url: string; mimeType?: string | null } | null>(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);
  const [reactionPendingNoteIds, setReactionPendingNoteIds] = useState<Set<number>>(new Set());
  const composerEmojiRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const bookingId = String(shootId || "").replace("#", "");
  const isApiBusy = isSubmitting || isActionLoading;

  const pendingAttachmentPreviews = useMemo(
    () => pendingAttachments.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [pendingAttachments]
  );

  useEffect(() => {
    return () => {
      pendingAttachmentPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingAttachmentPreviews]);

  const fetchNotes = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!bookingId) return;
    if (!silent) setLoadingNotes(true);
    const response = await adminApi.getShootNotes(bookingId);
    if (!response?.success) {
      if (!silent) {
        toast.error(response?.error || "Failed to fetch notes");
      }
      if (!silent) setLoadingNotes(false);
      return;
    }
    setNotes(mapShootNotesToUi(response?.data));
    if (!silent) setLoadingNotes(false);
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchNotes();
    }
  }, [isOpen, bookingId]);

  // Click outside to close composer emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (composerEmojiRef.current && !composerEmojiRef.current.contains(event.target as Node)) {
        setShowComposerEmojis(false);
      }
    };

    if (showComposerEmojis) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showComposerEmojis]);

  // Click outside to close reaction picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPickerId(null);
      }
    };

    if (showReactionPickerId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPickerId]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setShowComposerEmojis(false);
        setShowReactionPickerId(null);
        setShowAttachmentConfirmModal(false);
        setPreviewAttachment(null);
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    setPendingAttachments(files);
    setShowAttachmentConfirmModal(true);
  };

  const handleConfirmAttachmentSelection = () => {
    if (pendingAttachments.length > 0) {
      setSelectedAttachments((current) => [...current, ...pendingAttachments]);
    }
    setPendingAttachments([]);
    setShowAttachmentConfirmModal(false);
  };

  const handleCancelAttachmentSelection = () => {
    setPendingAttachments([]);
    setShowAttachmentConfirmModal(false);
  };

  const removeSelectedAttachment = (index: number) => {
    setSelectedAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const openStoredAttachmentPreview = (file: { fileName: string; filePath: string; mimeType?: string | null }) => {
    setPreviewAttachment({
      name: file.fileName,
      url: resolveS3AssetUrl(file.filePath),
      mimeType: file.mimeType || null,
    });
  };

  const handleSubmit = async () => {
    if (isApiBusy) return;
    const noteText = inputValue.trim();
    const hasAttachments = selectedAttachments.length > 0;
    if ((!noteText && !hasAttachments) || !bookingId) return;

    // Backend requires note text, so keep WhatsApp-like media send by adding a fallback caption.
    const payloadNote = noteText || "Attachment";

    setIsSubmitting(true);
    try {
      const response = replyingToId
        ? await adminApi.replyToShootNote(bookingId, replyingToId, { note: payloadNote, attachments: selectedAttachments })
        : await adminApi.addShootNote(bookingId, { note: payloadNote, attachments: selectedAttachments });

      if (!response?.success) {
        toast.error(response?.error || (replyingToId ? "Failed to add reply" : "Failed to add note"));
        return;
      }

      setInputValue('');
      setSelectedAttachments([]);
      setReplyingToId(null);
      await fetchNotes();
    } finally {
      setIsSubmitting(false);
    }
  };

  const appendEmojiToDraft = (emoji: string) => {
    setInputValue((current) => `${current}${emoji}`);
  };

  const handleComposerEmojiClick = (emojiData: EmojiClickData) => {
    appendEmojiToDraft(emojiData.emoji);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!bookingId || isApiBusy) return;
    const noteId = Number(messageId);
    if (!Number.isFinite(noteId) || noteId <= 0) return;
    if (reactionPendingNoteIds.has(noteId)) return;

    const reaction = EMOJI_TO_REACTION[emoji] || "like";
    const previousNoteSnapshot = notes.find((note) => Number(note.id) === noteId);

    setReactionPendingNoteIds((current) => {
      const next = new Set(current);
      next.add(noteId);
      return next;
    });

    // Optimistic update for smoother UX.
    setNotes((currentNotes) =>
      currentNotes.map((note) => {
        if (Number(note.id) !== noteId) return note;

        const existingMyReactions = Array.isArray(note.myReactions) ? note.myReactions : [];
        const isTogglingSameReaction = existingMyReactions.includes(reaction);
        const nextMyReactions = isTogglingSameReaction ? [] : [reaction];

        const nextReactionCounts = { ...note.reactionCounts };
        existingMyReactions.forEach((existingReaction) => {
          if (!nextReactionCounts[existingReaction]) return;
          nextReactionCounts[existingReaction] = Math.max(0, Number(nextReactionCounts[existingReaction]) - 1);
          if (nextReactionCounts[existingReaction] <= 0) delete nextReactionCounts[existingReaction];
        });

        if (!isTogglingSameReaction) {
          nextReactionCounts[reaction] = (Number(nextReactionCounts[reaction] || 0) || 0) + 1;
        }

        const nextReactionUsersByType: Record<string, Array<{ userId: number; name: string }>> = {};
        Object.entries(note.reactionUsersByType || {}).forEach(([key, users]) => {
          nextReactionUsersByType[key] = (Array.isArray(users) ? users : []).filter(
            (user) => Number(user.userId) !== OPTIMISTIC_REACTION_USER.userId && user.name !== OPTIMISTIC_REACTION_USER.name
          );
        });

        if (!isTogglingSameReaction) {
          if (!nextReactionUsersByType[reaction]) nextReactionUsersByType[reaction] = [];
          nextReactionUsersByType[reaction] = [
            ...nextReactionUsersByType[reaction],
            OPTIMISTIC_REACTION_USER,
          ];
        }

        return {
          ...note,
          myReactions: nextMyReactions,
          likedByMe: nextMyReactions.includes("like"),
          likes: Number(nextReactionCounts.like || 0),
          reactionCounts: nextReactionCounts,
          reactionUsersByType: nextReactionUsersByType,
        };
      })
    );

    setShowReactionPickerId(null);

    try {
      const response = await adminApi.reactToShootNote(bookingId, messageId, { reaction });
      if (!response?.success) {
        throw new Error(response?.error || "Reaction not supported by backend");
      }

      // Silent sync with server truth without showing loader flicker.
      await fetchNotes({ silent: true });
    } catch (error: any) {
      if (previousNoteSnapshot) {
        setNotes((currentNotes) =>
          currentNotes.map((note) => (Number(note.id) === noteId ? previousNoteSnapshot : note))
        );
      }
      toast.error(error?.message || "Reaction not supported by backend");
    } finally {
      setReactionPendingNoteIds((current) => {
        const next = new Set(current);
        next.delete(noteId);
        return next;
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!bookingId || isApiBusy) return;
    setIsActionLoading(true);
    try {
      const response = await adminApi.deleteShootNote(bookingId, noteId);
      if (!response?.success) {
        toast.error(response?.error || "Failed to delete note");
        return;
      }
      toast.success("Note deleted");
      await fetchNotes();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 backdrop-blur-[3px] z-40"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#0a0a0a] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a] px-7 py-6 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-bold text-white tracking-tight">Notes</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loadingNotes ? (
                <div className="py-8 flex items-center justify-center text-white/60 text-sm">Loading notes...</div>
              ) : null}
              {isActionLoading ? (
                <div className="sticky top-0 z-10 mb-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111111]/90 px-3 py-2 text-xs text-white/80 backdrop-blur-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Updating notes...
                </div>
              ) : null}
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isDark={isDark}
                  onReact={handleReaction}
                  onReply={(id) => setReplyingToId(id)}
                  onDelete={handleDeleteNote}
                  onPreviewAttachment={openStoredAttachmentPreview}
                  actionsDisabled={isApiBusy || reactionPendingNoteIds.has(note.id)}
                  showReactionPickerId={showReactionPickerId}
                  setShowReactionPickerId={setShowReactionPickerId}
                  reactionPickerRef={reactionPickerRef}
                />
              ))}
            </div>

            {/* Bottom Composer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-5 border-t border-white/10">
              {replyingToId ? (
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span>Replying to note #{replyingToId}</span>
                  <button className="text-white/70 hover:text-white" onClick={() => setReplyingToId(null)}>Cancel</button>
                </div>
              ) : null}
              <div className={`flex items-center gap-3 bg-[#161616] rounded-full px-5 py-3.5 border border-white/5 focus-within:border-white/10 transition-colors relative ${isApiBusy ? "opacity-80" : ""}`}>
                <label className={`text-white/40 hover:text-white/70 transition-colors flex-shrink-0 cursor-pointer ${isApiBusy ? "pointer-events-none opacity-50" : ""}`}>
                  <Paperclip size={18} />
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentSelection}
                    disabled={isApiBusy}
                    className="hidden"
                  />
                </label>
                <button
                  className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
                  onClick={() => setShowComposerEmojis((current) => !current)}
                  disabled={isApiBusy}
                >
                  <Smile size={20} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (isApiBusy) return;
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  placeholder="Write a Note.."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  disabled={isApiBusy}
                />
                <button
                  onClick={handleSubmit}
                  className={`flex-shrink-0 transition-colors ${(inputValue.trim() || selectedAttachments.length > 0)
                    ? 'text-[#E8D1AB] hover:text-[#dccaa9]'
                    : 'text-white/30 cursor-not-allowed'
                    }`}
                  disabled={(!inputValue.trim() && selectedAttachments.length === 0) || isApiBusy}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>

                {showComposerEmojis && (
                  <div
                    ref={composerEmojiRef}
                    className={`absolute bottom-[calc(100%+12px)] right-4 z-30 w-[320px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border shadow-2xl lg:right-8 transition-colors ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"
                      }`}
                  >
                    <EmojiPicker
                      onEmojiClick={handleComposerEmojiClick}
                      theme={isDark ? Theme.DARK : Theme.LIGHT}
                      width="100%"
                      height={340}
                      searchPlaceholder="Search emojis..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              {selectedAttachments.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAttachments.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/80">
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedAttachment(idx)}
                        className="text-white/60 hover:text-white"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {showAttachmentConfirmModal ? (
              <AttachmentSelectionModal
                attachments={pendingAttachmentPreviews}
                isDark={isDark}
                onCancel={handleCancelAttachmentSelection}
                onConfirm={handleConfirmAttachmentSelection}
              />
            ) : null}

            {previewAttachment ? (
              <StoredAttachmentPreviewModal
                attachment={previewAttachment}
                isDark={isDark}
                onClose={() => setPreviewAttachment(null)}
              />
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Note Card Component
function NoteCard({
  note,
  isDark = true,
  onReact,
  onReply,
  onDelete,
  onPreviewAttachment,
  actionsDisabled = false,
  showReactionPickerId,
  setShowReactionPickerId,
  reactionPickerRef
}: {
  note: NoteUiItem;
  isDark?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (noteId: number) => void;
  onDelete?: (noteId: number) => void;
  onPreviewAttachment?: (attachment: { fileName: string; filePath: string; mimeType?: string | null }) => void;
  actionsDisabled?: boolean;
  showReactionPickerId: string | null;
  setShowReactionPickerId: (id: string | null) => void;
  reactionPickerRef: React.RefObject<HTMLDivElement>;
}) {
  const hasReplies = note.replies && note.replies.length > 0;

  const formatReactionUsers = (reaction: string) => {
    const users = note.reactionUsersByType?.[reaction] || [];
    if (!users.length) return "";
    return users.map((user) => user.name).join(", ");
  };

  const formatReactionUsersShort = (reaction: string) => {
    const users = note.reactionUsersByType?.[reaction] || [];
    if (!users.length) return "";
    if (users.length <= 3) return users.map((user) => user.name).join(", ");
    return `${users.slice(0, 3).map((user) => user.name).join(", ")} +${users.length - 3}`;
  };

  return (
    <div className="bg-[#161616] rounded-[22px] p-5 border border-white/5 relative">
      {/* Parent Note */}
      <div className="flex gap-4">
        <img
          src={note.user.avatar}
          alt={note.user.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{note.user.name}</span>
              <span className="text-xs text-white/30 whitespace-nowrap">
                {note.timestamp.date} • {note.timestamp.time}
              </span>
            </div>
            <button
              className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 -mr-1 p-1"
              onClick={() => onDelete?.(note.id)}
              disabled={actionsDisabled}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mb-3">
            {note.message}
          </p>
          {note.attachments.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {note.attachments.map((file) => (
                <div
                  key={`${note.id}-attachment-${file.id}`}
                  className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white/10 text-[#E8D1AB]"
                >
                  <span className="max-w-[170px] truncate">{file.fileName}</span>
                  <button
                    type="button"
                    className="hover:text-white"
                    onClick={() => onPreviewAttachment?.(file)}
                    title="Preview"
                  >
                    <Eye size={12} />
                  </button>
                  <a
                    href={resolveS3AssetUrl(file.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    download={file.fileName}
                    className="hover:text-white"
                    title="Download"
                  >
                    <Download size={12} />
                  </a>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action Row */}
          <div className="flex items-center gap-1 relative">
            <button
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${note.likedByMe || note.likes > 0 ? 'text-[#E8D1AB]' : 'text-white/40 hover:text-white/70'
                }`}
              onClick={() => onReact?.(note.id.toString(), "👍")}
              disabled={actionsDisabled}
              title={formatReactionUsers("like") || undefined}
            >
              <ThumbsUp
                size={14}
                strokeWidth={2}
                className={note.likedByMe ? "fill-current" : ""}
              />
              {note.likes > 0 ? note.likes : 'Like'}
            </button>
            <span className="w-px h-3 bg-white/10" />
            <button
              className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5"
              onClick={() => onReply?.(note.id)}
              disabled={actionsDisabled}
            >
              Reply
            </button>
            <span className="w-px h-3 bg-white/10" />
            <button
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5 relative"
              disabled={actionsDisabled}
              onClick={() => setShowReactionPickerId((current) => (current === note.id.toString() ? null : note.id.toString()))}
            >
              <Smile size={14} strokeWidth={2} />
              React
            </button>

            {/* Reaction Picker Popup */}
            {showReactionPickerId === note.id.toString() && (
              <div
                ref={reactionPickerRef}
                className={`absolute bottom-full left-0 mb-2 z-20 flex items-center gap-1 rounded-full border px-2 py-1 shadow-2xl ${isDark ? "border-white/10 bg-[#151515]" : "border-zinc-200 bg-white"
                  }`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={`${note.id}-picker-${emoji}`}
                    type="button"
                    disabled={actionsDisabled}
                    onClick={() => {
                      onReact?.(note.id.toString(), emoji);
                      setShowReactionPickerId(null);
                    }}
                    className="rounded-full px-1.5 text-lg transition hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {Object.keys(note.reactionCounts || {}).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(note.reactionCounts || {}).map(([reaction, count]) => {
                const emoji = REACTION_TO_EMOJI[reaction] || "🙂";
                const reactedByMe = note.myReactions.includes(reaction);
                return (
                  <button
                    key={`${note.id}-${reaction}`}
                    type="button"
                    disabled={actionsDisabled}
                    onClick={() => onReact?.(note.id.toString(), emoji)}
                    title={formatReactionUsers(reaction) || undefined}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      reactedByMe
                        ? "border-[#E8D1AB]/40 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {emoji} {count}
                  </button>
                );
              })}
            </div>
          ) : null}
          {Object.keys(note.reactionCounts || {}).length > 0 ? (
            <div className="mt-1.5 space-y-1">
              {Object.entries(note.reactionCounts || {}).map(([reaction]) => {
                const usersText = formatReactionUsersShort(reaction);
                if (!usersText) return null;
                const emoji = REACTION_TO_EMOJI[reaction] || "🙂";
                return (
                  <p key={`${note.id}-reaction-users-${reaction}`} className="text-[11px] text-white/45" title={formatReactionUsers(reaction)}>
                    {emoji} {usersText}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Thread Replies */}
      {hasReplies && (
        <div className="mt-4 ml-5 pl-5 border-l border-white/10 space-y-3">
          {note.replies.map((reply) => (
            <NoteReply key={reply.id} reply={reply} onPreviewAttachment={onPreviewAttachment} />
          ))}
        </div>
      )}
    </div>
  );
}

// Thread Reply Component
function NoteReply({
  reply,
  onPreviewAttachment
}: {
  reply: NoteUiItem["replies"][0];
  onPreviewAttachment?: (attachment: { fileName: string; filePath: string; mimeType?: string | null }) => void;
}) {
  return (
    <div className="bg-[#161616] rounded-[18px] p-4 border border-white/5">
      <div className="flex gap-3">
        <img
          src={reply.user.avatar}
          alt={reply.user.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{reply.user.name}</span>
              <span className="text-xs text-white/30 whitespace-nowrap">
                {reply.timestamp.date} • {reply.timestamp.time}
              </span>
            </div>
            <button className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 -mr-1 p-1">
              <MoreHorizontal size={14} />
            </button>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mb-2.5">
            {reply.message}
          </p>
          {reply.attachments.length > 0 ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {reply.attachments.map((file) => (
                <div
                  key={`${reply.id}-attachment-${file.id}`}
                  className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white/10 text-[#E8D1AB]"
                >
                  <span className="max-w-[160px] truncate">{file.fileName}</span>
                  <button
                    type="button"
                    className="hover:text-white"
                    onClick={() => onPreviewAttachment?.(file)}
                    title="Preview"
                  >
                    <Eye size={12} />
                  </button>
                  <a
                    href={resolveS3AssetUrl(file.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    download={file.fileName}
                    className="hover:text-white"
                    title="Download"
                  >
                    <Download size={12} />
                  </a>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action Row - Smaller */}
          <div className="flex items-center gap-1">
            <button className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              Like
            </button>
            <span className="w-px h-2.5 bg-white/10" />
            <button className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              Reply
            </button>
            <span className="w-px h-2.5 bg-white/10" />
            <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              <Smile size={13} strokeWidth={2} />
              React
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentSelectionModal({
  attachments,
  isDark,
  onCancel,
  onConfirm,
}: {
  attachments: Array<{ file: File; previewUrl: string }>;
  isDark: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        className={`relative z-10 w-full max-w-2xl rounded-2xl border p-5 ${
          isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Preview Attachments</h3>
          <button onClick={onCancel} className="text-white/70 hover:text-white" type="button">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {attachments.map(({ file, previewUrl }, idx) => {
            const isImage = isImageAttachment(file.name, file.type);
            const isPdf = isPdfAttachment(file.name, file.type);

            return (
              <div key={`${file.name}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 truncate text-xs text-white/80">{file.name}</p>
                {isImage ? (
                  <img src={previewUrl} alt={file.name} className="max-h-56 w-full rounded-lg object-contain" />
                ) : isPdf ? (
                  <iframe src={previewUrl} title={file.name} className="h-56 w-full rounded-lg border border-white/10" />
                ) : (
                  <div className="rounded-lg border border-dashed border-white/15 p-4 text-xs text-white/60">
                    Preview not available for this file type.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/75 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#E8D1AB] px-3 py-1.5 text-sm font-medium text-black hover:bg-[#ddc79f]"
          >
            Confirm Attachments
          </button>
        </div>
      </div>
    </div>
  );
}

function StoredAttachmentPreviewModal({
  attachment,
  isDark,
  onClose,
}: {
  attachment: { name: string; url: string; mimeType?: string | null };
  isDark: boolean;
  onClose: () => void;
}) {
  const image = isImageAttachment(attachment.name, attachment.mimeType);
  const pdf = isPdfAttachment(attachment.name, attachment.mimeType);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-3xl rounded-2xl border p-5 ${
          isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="truncate text-base font-semibold text-white">{attachment.name}</h3>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              download={attachment.name}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:text-white"
            >
              <Download size={13} />
              Download
            </a>
            <button onClick={onClose} className="text-white/70 hover:text-white" type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        {image ? (
          <img src={attachment.url} alt={attachment.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
        ) : pdf ? (
          <iframe src={attachment.url} title={attachment.name} className="h-[70vh] w-full rounded-lg border border-white/10" />
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm text-white/70">
            Inline preview is not available for this file type. Use the download button.
          </div>
        )}
      </div>
    </div>
  );
}
