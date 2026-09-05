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
  Trash2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { toast } from "sonner";
import { format } from "date-fns";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import EmptyNotesState from "./EmptyNotesState";

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

const getInitials = (name: string) => {
  const cleanName = String(name || "").trim();
  if (!cleanName) return "U";

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return cleanName.slice(0, 2).toUpperCase();
};

const UserNameBox = ({ name, small = false }: { name: string; small?: boolean }) => {
  const initials = getInitials(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#E5D5B8] text-black font-bold shadow-inner ${
        small ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
      }`}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
};

type NoteUiItem = {
  id: number;
  user: { id: string; name: string; avatar: string };
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
  replies: NoteUiItem[];
};

const OPTIMISTIC_REACTION_USER = { userId: -1, name: "You" };

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

const countNotesWithReplies = (items: NoteUiItem[]): number =>
  items.reduce((total, note) => total + 1 + countNotesWithReplies(note.replies || []), 0);

const normalizeId = (value: unknown) => {
  if (value == null) return "";
  return String(value).trim();
};

const getStoredCurrentUserId = () => {
  if (typeof window === "undefined") return "";

  const storageKeys = ["revure_user"];

  for (const key of storageKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const userId = parsed?.id ?? parsed?.user?.id ?? parsed?.user_id ?? parsed?.user?.user_id;
      if (userId) return normalizeId(userId);
    } catch (error) {
      console.error("Failed to read logged in user from localStorage:", error);
    }
  }

  return "";
};

const resolveNoteUserId = (note: any) =>
  normalizeId(
    note?.user?.id ??
      note?.user?.user_id ??
      note?.created_by?.id ??
      note?.created_by?.user_id ??
      note?.created_by_id ??
      note?.user_id
  );

const findNoteById = (items: NoteUiItem[], noteId: number): NoteUiItem | null => {
  for (const note of items) {
    if (Number(note.id) === Number(noteId)) return note;
    const reply = findNoteById(note.replies || [], noteId);
    if (reply) return reply;
  }
  return null;
};

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

const mapSingleShootNoteToUi = (note: any): NoteUiItem => {
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
        id: resolveNoteUserId(note),
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
      replies: replies.map(mapSingleShootNoteToUi),
    };
};

const mapShootNotesToUi = (payload: any): NoteUiItem[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notes)
      ? payload.notes
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return list.map(mapSingleShootNoteToUi);
};

const updateNoteById = (
  items: NoteUiItem[],
  noteId: number,
  updater: (note: NoteUiItem) => NoteUiItem
): NoteUiItem[] =>
  items.map((note) => {
    const updatedReplies = note.replies?.length
      ? updateNoteById(note.replies, noteId, updater)
      : note.replies;

    if (Number(note.id) === noteId) {
      return updater({ ...note, replies: updatedReplies || [] });
    }

    return updatedReplies !== note.replies
      ? { ...note, replies: updatedReplies || [] }
      : note;
  });

const applyOptimisticReaction = (note: NoteUiItem, reaction: string): NoteUiItem => {
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
};


// Main Notes Drawer Component
export default function NotesDrawer({
  isOpen,
  onClose,
  shootId,
  isDark: isDarkProp,
  onNotesCountChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  shootId?: string;
  isDark?: boolean;
  onNotesCountChange?: (shootId: string, count: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const authUserId = useAppSelector((state) => state.auth.user?.id);
  const [themeMounted, setThemeMounted] = useState(false);
  const [notes, setNotes] = useState<NoteUiItem[]>([]);
  const [storedCurrentUserId, setStoredCurrentUserId] = useState("");
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
  const currentUserId = normalizeId(authUserId) || storedCurrentUserId;
  const isDark =
    typeof isDarkProp === "boolean"
      ? isDarkProp
      : !themeMounted || resolvedTheme !== "light";

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    setStoredCurrentUserId(getStoredCurrentUserId());
  }, []);

  const canDeleteNote = (note: NoteUiItem) =>
    Boolean(currentUserId && note.user.id && normalizeId(note.user.id) === currentUserId);

  const pendingAttachmentPreviews = useMemo(
    () => pendingAttachments.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [pendingAttachments]
  );

  const isEmptyNotesResponse = (response: any) => {
    if (!response) return true;
    if (response?.success && Array.isArray(response?.data) && response.data.length === 0) return true;
    if (response?.success && Array.isArray(response?.data?.notes) && response.data.notes.length === 0) return true;

    const errorText = String(response?.error || response?.message || "").toLowerCase();
    return (
      errorText.includes("no notes") ||
      errorText.includes("note not found") ||
      errorText.includes("notes not found") ||
      errorText.includes("not found")
    );
  };

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
      if (isEmptyNotesResponse(response)) {
        setNotes([]);
        onNotesCountChange?.(String(shootId || ""), 0);
        if (!silent) setLoadingNotes(false);
        return;
      }
      if (!silent) {
        toast.error(response?.error || "Failed to fetch notes");
      }
      if (!silent) setLoadingNotes(false);
      return;
    }
    const nextNotes = mapShootNotesToUi(response?.data);
    setNotes(nextNotes);
    onNotesCountChange?.(String(shootId || ""), countNotesWithReplies(nextNotes));
    if (!silent) setLoadingNotes(false);
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      setNotes([]);
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
    const previousNotesSnapshot = notes;

    setReactionPendingNoteIds((current) => {
      const next = new Set(current);
      next.add(noteId);
      return next;
    });

    // Optimistic update for smoother UX.
    setNotes((currentNotes) => updateNoteById(currentNotes, noteId, (note) => applyOptimisticReaction(note, reaction)));

    setShowReactionPickerId(null);

    try {
      const response = await adminApi.reactToShootNote(bookingId, messageId, { reaction });
      if (!response?.success) {
        throw new Error(response?.error || "Reaction not supported by backend");
      }

      // Silent sync with server truth without showing loader flicker.
      await fetchNotes({ silent: true });
    } catch (error: any) {
      setNotes(previousNotesSnapshot);
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
    const noteToDelete = findNoteById(notes, noteId);
    if (!noteToDelete || !canDeleteNote(noteToDelete)) {
      toast.error("You can only delete your own note");
      return;
    }

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
            className={`fixed inset-0 z-40 backdrop-blur-[3px] transition-colors ${isDark ? "bg-black/50" : "bg-slate-900/20"}`}
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col shadow-2xl transition-colors sm:w-[540px] ${isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-[#171717]"}`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-7 py-6 transition-colors ${isDark ? "border-white/10 bg-[#0a0a0a]" : "border-[#E5E7EB] bg-white"}`}>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#171717]"}`}>Notes</h2>
              <button
                onClick={onClose}
                className={`rounded-full p-2 transition-all ${isDark ? "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white" : "bg-[#F2F4F7] text-[#667085] hover:bg-[#E4E7EC] hover:text-[#101828]"}`}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className={`flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent ${isDark ? "scrollbar-thumb-white/10" : "scrollbar-thumb-black/10"}`}>
              <div className="w-fit min-w-full px-6 py-5 space-y-6">
                {loadingNotes ? (
                <div className={`flex items-center justify-center py-8 text-sm ${isDark ? "text-white/60" : "text-[#667085]"}`}>Loading notes...</div>
              ) : null}
              {isActionLoading ? (
                <div className={`sticky top-0 z-10 mb-2 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs backdrop-blur-sm transition-colors ${isDark ? "border-white/10 bg-[#111111]/90 text-white/80" : "border-[#E5E7EB] bg-white/95 text-[#475467]"}`}>
                  <Loader2 size={14} className="animate-spin" />
                  Updating notes...
                </div>
              ) : null}
              {!loadingNotes && notes.length === 0 ? (
                <div className={isDark ? "text-white" : "text-[#171717]"}><EmptyNotesState isDark={isDark} /></div>
              ) : (
                notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isDark={isDark}
                    onReact={handleReaction}
                    onReply={(id) => setReplyingToId(id)}
                    onDelete={handleDeleteNote}
                    canDeleteNote={canDeleteNote}
                    onPreviewAttachment={openStoredAttachmentPreview}
                    actionsDisabled={isApiBusy}
                    isNoteActionDisabled={(noteId) => reactionPendingNoteIds.has(noteId)}
                    showReactionPickerId={showReactionPickerId}
                    setShowReactionPickerId={setShowReactionPickerId}
                    reactionPickerRef={reactionPickerRef}
                  />
                  ))
                )
              }
              </div>
            </div>

            {/* Bottom Composer */}
            <div className={`sticky bottom-0 border-t px-6 py-5 transition-colors ${isDark ? "border-white/10 bg-[#0a0a0a]" : "border-[#E5E7EB] bg-white"}`}>
              {replyingToId ? (
                <div className={`mb-2 flex items-center justify-between text-xs ${isDark ? "text-white/60" : "text-[#667085]"}`}>
                  <span>Replying to note #{replyingToId}</span>
                  <button className={isDark ? "text-white/70 hover:text-white" : "text-[#667085] hover:text-[#101828]"} onClick={() => setReplyingToId(null)}>Cancel</button>
                </div>
              ) : null}
              <div className={`relative flex items-center gap-3 rounded-full border px-5 py-3.5 transition-colors ${isDark ? "border-white/5 bg-[#161616] focus-within:border-white/10" : "border-[#E4E7EC] bg-[#F9FAFB] focus-within:border-[#D0D5DD]"} ${isApiBusy ? "opacity-80" : ""}`}>
                <label className={`flex-shrink-0 cursor-pointer transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-[#98A2B3] hover:text-[#475467]"} ${isApiBusy ? "pointer-events-none opacity-50" : ""}`}>
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
                  className={`flex-shrink-0 transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-[#98A2B3] hover:text-[#475467]"}`}
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
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-[#101828] placeholder:text-[#98A2B3]"}`}
                  disabled={isApiBusy}
                />
                <button
                  onClick={handleSubmit}
                  className={`flex-shrink-0 transition-colors ${
                    inputValue.trim() || selectedAttachments.length > 0
                      ? isDark
                        ? 'text-[#E8D1AB] hover:text-[#dccaa9]'
                        : 'text-[#8B6B3D] hover:text-[#75582F]'
                      : isDark
                        ? 'text-white/30 cursor-not-allowed'
                        : 'text-[#B6BDC7] cursor-not-allowed'
                  }`}
                  disabled={(!inputValue.trim() && selectedAttachments.length === 0) || isApiBusy}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>

                {showComposerEmojis && (
                  <div
                    ref={composerEmojiRef}
                    className={`absolute bottom-[calc(100%+12px)] right-4 z-30 w-[320px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border shadow-2xl transition-colors lg:right-8 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E7EB] bg-white"}`}
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
                    <div key={`${file.name}-${idx}`} className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${isDark ? "bg-white/10 text-white/80" : "border border-[#E4E7EC] bg-[#F2F4F7] text-[#475467]"}`}>
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedAttachment(idx)}
                        className={isDark ? "text-white/60 hover:text-white" : "text-[#98A2B3] hover:text-[#344054]"}
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
  canDeleteNote,
  onPreviewAttachment,
  actionsDisabled = false,
  isNoteActionDisabled,
  showReactionPickerId,
  setShowReactionPickerId,
  reactionPickerRef
}: {
  note: NoteUiItem;
  isDark?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (noteId: number) => void;
  onDelete?: (noteId: number) => void;
  canDeleteNote?: (note: NoteUiItem) => boolean;
  onPreviewAttachment?: (attachment: { fileName: string; filePath: string; mimeType?: string | null }) => void;
  actionsDisabled?: boolean;
  isNoteActionDisabled?: (noteId: number) => boolean;
  showReactionPickerId: string | null;
  setShowReactionPickerId: (id: string | null) => void;
  reactionPickerRef: React.RefObject<HTMLDivElement>;
}) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const hasReplies = note.replies && note.replies.length > 0;
  const isCurrentNoteDisabled = actionsDisabled || Boolean(isNoteActionDisabled?.(note.id));
  const canDeleteCurrentNote = Boolean(canDeleteNote?.(note));

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActionsMenu]);

  return (
    <div className={`relative w-fit max-w-none rounded-[22px] border px-5 py-4 transition-colors ${isDark ? "border-white/5 bg-[#161616]" : "border-[#EAECF0] bg-[#F9FAFB]"}`}>
      {/* Parent Note */}
      <div className="flex gap-4">
        <div className="relative flex flex-col items-center">
          <UserNameBox name={note.user.name} />
          {hasReplies && (
            <div className={`mb-[-16px] mt-3 w-px flex-1 ${isDark ? "bg-white/10" : "bg-[#D0D5DD]"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-[#101828]"}`}>{note.user.name}</span>
              <span className={`whitespace-nowrap text-xs ${isDark ? "text-white/30" : "text-[#98A2B3]"}`}>
                {note.timestamp.date} • {note.timestamp.time}
              </span>
            </div>
            {canDeleteCurrentNote ? (
              <div ref={actionsMenuRef} className="relative">
                <button
                  type="button"
                  className={`-mr-1 flex-shrink-0 p-1 transition-colors ${isDark ? "text-white/30 hover:text-white/70" : "text-[#98A2B3] hover:text-[#475467]"}`}
                  onClick={() => {
                    if (isCurrentNoteDisabled) return;
                    setShowReactionPickerId(null);
                    setShowActionsMenu((current) => !current);
                  }}
                  disabled={isCurrentNoteDisabled}
                  aria-haspopup="menu"
                  aria-expanded={showActionsMenu}
                  aria-label="More actions"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showActionsMenu ? (
                  <div
                    className={`absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border p-1 shadow-2xl ${
                      isDark ? "border-white/10 bg-[#151515]" : "border-[#E4E7EC] bg-white"
                    }`}
                    role="menu"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      onClick={() => {
                        setShowActionsMenu(false);
                        onDelete?.(note.id);
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className={`mb-3 max-w-[440px] text-sm leading-relaxed ${isDark ? "text-white/60" : "text-[#475467]"}`}>
            {note.message}
          </p>
          {note.attachments.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {note.attachments.map((file) => (
                <div
                  key={`${note.id}-attachment-${file.id}`}
                  className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs ${isDark ? "bg-white/10 text-[#E8D1AB]" : "border border-[#E4E7EC] bg-white text-[#8B6B3D]"}`}
                >
                  <span className="max-w-[170px] truncate">{file.fileName}</span>
                  <button
                    type="button"
                    className={isDark ? "hover:text-white" : "hover:text-[#101828]"}
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
                    className={isDark ? "hover:text-white" : "hover:text-[#101828]"}
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
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${note.likedByMe || note.likes > 0 ? (isDark ? 'text-[#E8D1AB]' : 'text-[#8B6B3D]') : (isDark ? 'text-white/40 hover:text-white/70' : 'text-[#667085] hover:text-[#101828]')
                }`}
              onClick={() => onReact?.(note.id.toString(), "👍")}
              disabled={isCurrentNoteDisabled}
              title={formatReactionUsers("like") || undefined}
            >
              <ThumbsUp
                size={14}
                strokeWidth={2}
                className={note.likedByMe ? "fill-current" : ""}
              />
              {note.likes > 0 ? note.likes : 'Like'}
            </button>
            <span className={`h-3 w-px ${isDark ? "bg-white/10" : "bg-[#D0D5DD]"}`} />
            <button
              className={`px-0.5 text-xs font-medium transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-[#667085] hover:text-[#101828]"}`}
              onClick={() => onReply?.(note.id)}
              disabled={isCurrentNoteDisabled}
            >
              Reply
            </button>
            <span className={`h-3 w-px ${isDark ? "bg-white/10" : "bg-[#D0D5DD]"}`} />
            <button
              className={`relative flex items-center gap-1.5 px-0.5 text-xs font-medium transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-[#667085] hover:text-[#101828]"}`}
              disabled={isCurrentNoteDisabled}
              onClick={() => setShowReactionPickerId(showReactionPickerId === note.id.toString() ? null : note.id.toString())}
            >
              <Smile size={14} strokeWidth={2} />
              React
            </button>

            {/* Reaction Picker Popup */}
            {showReactionPickerId === note.id.toString() && (
              <div
                ref={reactionPickerRef}
                className={`absolute bottom-full left-0 mb-2 z-20 flex items-center gap-1 rounded-full border px-2 py-1 shadow-2xl ${isDark ? "border-white/10 bg-[#151515]" : "border-[#E4E7EC] bg-white"
                  }`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={`${note.id}-picker-${emoji}`}
                    type="button"
                    disabled={isCurrentNoteDisabled}
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
                    disabled={isCurrentNoteDisabled}
                    onClick={() => onReact?.(note.id.toString(), emoji)}
                    title={formatReactionUsers(reaction) || undefined}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      reactedByMe
                        ? isDark
                          ? "border-[#E8D1AB]/40 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                          : "border-[#8B6B3D]/35 bg-[#8B6B3D]/10 text-[#8B6B3D]"
                        : isDark
                          ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                          : "border-[#E4E7EC] bg-white text-[#475467] hover:bg-[#F2F4F7]"
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
                  <p key={`${note.id}-reaction-users-${reaction}`} className={`text-[11px] ${isDark ? "text-white/45" : "text-[#667085]"}`} title={formatReactionUsers(reaction)}>
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
        <div className={`ml-[19px] mt-5 w-fit space-y-7 border-l pl-6 pr-4 ${isDark ? "border-white/10" : "border-[#D0D5DD]"}`}>
          {note.replies.map((reply) => (
            <NoteReply
              key={reply.id}
              reply={reply}
              depth={1}
              parentUserName={note.user.name}
              isDark={isDark}
              onReact={onReact}
              onReply={onReply}
              onDelete={onDelete}
              canDeleteNote={canDeleteNote}
              onPreviewAttachment={onPreviewAttachment}
              actionsDisabled={actionsDisabled}
              isNoteActionDisabled={isNoteActionDisabled}
              showReactionPickerId={showReactionPickerId}
              setShowReactionPickerId={setShowReactionPickerId}
              reactionPickerRef={reactionPickerRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Thread Reply Component
function NoteReply({
  reply,
  depth = 1,
  parentUserName,
  isDark = true,
  onReact,
  onReply,
  onDelete,
  canDeleteNote,
  onPreviewAttachment,
  actionsDisabled = false,
  isNoteActionDisabled,
  showReactionPickerId,
  setShowReactionPickerId,
  reactionPickerRef,
}: {
  reply: NoteUiItem;
  depth?: number;
  parentUserName?: string;
  isDark?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (noteId: number) => void;
  onDelete?: (noteId: number) => void;
  canDeleteNote?: (note: NoteUiItem) => boolean;
  onPreviewAttachment?: (attachment: { fileName: string; filePath: string; mimeType?: string | null }) => void;
  actionsDisabled?: boolean;
  isNoteActionDisabled?: (noteId: number) => boolean;
  showReactionPickerId: string | null;
  setShowReactionPickerId: (id: string | null) => void;
  reactionPickerRef: React.RefObject<HTMLDivElement>;
}) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const hasReplies = reply.replies && reply.replies.length > 0;
  const isCurrentReplyDisabled = actionsDisabled || Boolean(isNoteActionDisabled?.(reply.id));
  const canDeleteCurrentReply = Boolean(canDeleteNote?.(reply));

  const formatReactionUsers = (reaction: string) => {
    const users = reply.reactionUsersByType?.[reaction] || [];
    if (!users.length) return "";
    return users.map((user) => user.name).join(", ");
  };

  const formatReactionUsersShort = (reaction: string) => {
    const users = reply.reactionUsersByType?.[reaction] || [];
    if (!users.length) return "";
    if (users.length <= 3) return users.map((user) => user.name).join(", ");
    return `${users.slice(0, 3).map((user) => user.name).join(", ")} +${users.length - 3}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActionsMenu]);

  return (
    <div className="relative group">
      <div className="flex gap-3">
        <div className="relative flex flex-col items-center">
          <UserNameBox name={reply.user.name} small />
          {hasReplies && (
             <div className={`mt-2 w-px flex-1 ${isDark ? "bg-white/10" : "bg-[#D0D5DD]"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col max-w-[280px]">
                <span className={`truncate text-sm font-semibold ${isDark ? "text-white/90" : "text-[#101828]"}`}>{reply.user.name}</span>
              </div>
              <span className={`mt-0.5 self-start whitespace-nowrap text-[10px] ${isDark ? "text-white/25" : "text-[#98A2B3]"}`}>
                {reply.timestamp.date} • {reply.timestamp.time}
              </span>
            </div>
            {canDeleteCurrentReply ? (
              <div ref={actionsMenuRef} className="relative">
                <button
                  type="button"
                  className={`-mr-1 flex-shrink-0 p-1 transition-colors ${isDark ? "text-white/20 hover:text-white/50" : "text-[#98A2B3] hover:text-[#475467]"}`}
                  onClick={() => {
                    if (isCurrentReplyDisabled) return;
                    setShowReactionPickerId(null);
                    setShowActionsMenu((current) => !current);
                  }}
                  disabled={isCurrentReplyDisabled}
                  aria-haspopup="menu"
                  aria-expanded={showActionsMenu}
                  aria-label="More reply actions"
                >
                  <MoreHorizontal size={14} />
                </button>

                {showActionsMenu ? (
                  <div
                    className={`absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border p-1 shadow-2xl ${
                      isDark ? "border-white/10 bg-[#151515]" : "border-[#E4E7EC] bg-white"
                    }`}
                    role="menu"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      onClick={() => {
                        setShowActionsMenu(false);
                        onDelete?.(reply.id);
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className={`mb-2 max-w-[400px] text-sm leading-relaxed ${isDark ? "text-white/50" : "text-[#475467]"}`}>
            {reply.message}
          </p>
          {reply.attachments.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {reply.attachments.map((file) => (
                <div
                  key={`${reply.id}-attachment-${file.id}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[10px] ${isDark ? "border-white/5 bg-white/5 text-[#E8D1AB]/80" : "border-[#E4E7EC] bg-white text-[#8B6B3D]"}`}
                >
                  <span className="max-w-[140px] truncate">{file.fileName}</span>
                  <button
                    type="button"
                    className={isDark ? "hover:text-white" : "hover:text-[#101828]"}
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
                    className={isDark ? "hover:text-white" : "hover:text-[#101828]"}
                    title="Download"
                  >
                    <Download size={12} />
                  </a>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action Row - Smaller */}
          <div className="flex items-center gap-1.5 relative">
            <button
              className={`text-[11px] font-medium transition-colors px-0.5 ${
                reply.likedByMe || reply.likes > 0
                  ? isDark
                    ? "text-[#E8D1AB]"
                    : "text-[#8B6B3D]"
                  : isDark
                    ? "text-white/30 hover:text-white/60"
                    : "text-[#667085] hover:text-[#101828]"
              }`}
              onClick={() => onReact?.(reply.id.toString(), "👍")}
              disabled={isCurrentReplyDisabled}
              title={formatReactionUsers("like") || undefined}
            >
              {reply.likes > 0 ? reply.likes : "Like"}
            </button>
            <span className={`h-2.5 w-px ${isDark ? "bg-white/5" : "bg-[#D0D5DD]"}`} />
            <button
              className={`px-0.5 text-[11px] font-medium transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-[#667085] hover:text-[#101828]"}`}
              onClick={() => onReply?.(reply.id)}
              disabled={isCurrentReplyDisabled}
            >
              Reply
            </button>
            <span className={`h-2.5 w-px ${isDark ? "bg-white/5" : "bg-[#D0D5DD]"}`} />
            <button
              className={`flex items-center gap-1 px-0.5 text-[11px] font-medium transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-[#667085] hover:text-[#101828]"}`}
              disabled={isCurrentReplyDisabled}
              onClick={() => setShowReactionPickerId(showReactionPickerId === reply.id.toString() ? null : reply.id.toString())}
            >
              <Smile size={13} strokeWidth={2} />
              React
            </button>

            {showReactionPickerId === reply.id.toString() && (
              <div
                ref={reactionPickerRef}
                className={`absolute bottom-full left-0 mb-2 z-20 flex items-center gap-1 rounded-full border px-2 py-1 shadow-2xl ${
                  isDark ? "border-white/10 bg-[#151515]" : "border-[#E4E7EC] bg-white"
                }`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={`${reply.id}-picker-${emoji}`}
                    type="button"
                    disabled={isCurrentReplyDisabled}
                    onClick={() => {
                      onReact?.(reply.id.toString(), emoji);
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

          {Object.keys(reply.reactionCounts || {}).length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.entries(reply.reactionCounts || {}).map(([reaction, count]) => {
                const emoji = REACTION_TO_EMOJI[reaction] || "🙂";
                const reactedByMe = reply.myReactions.includes(reaction);
                return (
                  <button
                    key={`${reply.id}-${reaction}`}
                    type="button"
                    disabled={isCurrentReplyDisabled}
                    onClick={() => onReact?.(reply.id.toString(), emoji)}
                    title={formatReactionUsers(reaction) || undefined}
                    className={`rounded-full border px-1.5 py-0 text-[10px] transition-colors ${
                      reactedByMe
                        ? isDark
                          ? "border-[#E8D1AB]/40 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                          : "border-[#8B6B3D]/35 bg-[#8B6B3D]/10 text-[#8B6B3D]"
                        : isDark
                          ? "border-white/5 bg-white/5 text-white/50 hover:bg-white/10"
                          : "border-[#E4E7EC] bg-white text-[#667085] hover:bg-[#F2F4F7]"
                    }`}
                  >
                    {emoji} {count}
                  </button>
                );
              })}
            </div>
          ) : null}

          {hasReplies ? (
            <div className={`ml-[15px] mt-6 w-fit space-y-7 border-l pl-5 pr-2 ${isDark ? "border-white/10" : "border-[#D0D5DD]"}`}>
              {reply.replies.map((childReply) => (
                <NoteReply
                  key={childReply.id}
                  reply={childReply}
                  depth={depth + 1}
                  parentUserName={reply.user.name}
                  isDark={isDark}
                  onReact={onReact}
                  onReply={onReply}
                  onDelete={onDelete}
                  canDeleteNote={canDeleteNote}
                  onPreviewAttachment={onPreviewAttachment}
                  actionsDisabled={actionsDisabled}
                  isNoteActionDisabled={isNoteActionDisabled}
                  showReactionPickerId={showReactionPickerId}
                  setShowReactionPickerId={setShowReactionPickerId}
                  reactionPickerRef={reactionPickerRef}
                />
              ))}
            </div>
          ) : null}
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
      <div className={`absolute inset-0 ${isDark ? "bg-black/70" : "bg-slate-900/30"}`} onClick={onCancel} />
      <div
        className={`relative z-10 w-full max-w-2xl rounded-2xl border p-5 ${
          isDark ? "border-white/10 bg-[#111111]" : "border-[#E4E7EC] bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-[#101828]"}`}>Preview Attachments</h3>
          <button onClick={onCancel} className={isDark ? "text-white/70 hover:text-white" : "text-[#667085] hover:text-[#101828]"} type="button">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {attachments.map(({ file, previewUrl }, idx) => {
            const isImage = isImageAttachment(file.name, file.type);
            const isPdf = isPdfAttachment(file.name, file.type);

            return (
              <div key={`${file.name}-${idx}`} className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-[#EAECF0] bg-[#F9FAFB]"}`}>
                <p className={`mb-2 truncate text-xs ${isDark ? "text-white/80" : "text-[#475467]"}`}>{file.name}</p>
                {isImage ? (
                  <img src={previewUrl} alt={file.name} className="max-h-56 w-full rounded-lg object-contain" />
                ) : isPdf ? (
                  <iframe src={previewUrl} title={file.name} className={`h-56 w-full rounded-lg border ${isDark ? "border-white/10" : "border-[#E4E7EC]"}`} />
                ) : (
                  <div className={`rounded-lg border border-dashed p-4 text-xs ${isDark ? "border-white/15 text-white/60" : "border-[#D0D5DD] text-[#667085]"}`}>
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
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${isDark ? "border-white/15 text-white/75 hover:bg-white/5 hover:text-white" : "border-[#D0D5DD] text-[#475467] hover:bg-[#F2F4F7] hover:text-[#101828]"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isDark ? "bg-[#E8D1AB] text-black hover:bg-[#ddc79f]" : "bg-[#8B6B3D] text-white hover:bg-[#75582F]"}`}
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
      <div className={`absolute inset-0 ${isDark ? "bg-black/70" : "bg-slate-900/30"}`} onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-3xl rounded-2xl border p-5 ${
          isDark ? "border-white/10 bg-[#111111]" : "border-[#E4E7EC] bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className={`truncate text-base font-semibold ${isDark ? "text-white" : "text-[#101828]"}`}>{attachment.name}</h3>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              download={attachment.name}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${isDark ? "border-white/15 text-white/80 hover:bg-white/5 hover:text-white" : "border-[#D0D5DD] text-[#475467] hover:bg-[#F2F4F7] hover:text-[#101828]"}`}
            >
              <Download size={13} />
              Download
            </a>
            <button onClick={onClose} className={isDark ? "text-white/70 hover:text-white" : "text-[#667085] hover:text-[#101828]"} type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        {image ? (
          <img src={attachment.url} alt={attachment.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
        ) : pdf ? (
          <iframe src={attachment.url} title={attachment.name} className={`h-[70vh] w-full rounded-lg border ${isDark ? "border-white/10" : "border-[#E4E7EC]"}`} />
        ) : (
          <div className={`rounded-lg border border-dashed p-5 text-sm ${isDark ? "border-white/15 text-white/70" : "border-[#D0D5DD] text-[#667085]"}`}>
            Inline preview is not available for this file type. Use the download button.
          </div>
        )}
      </div>
    </div>
  );
}