"use client";

import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Download, Share2, X } from "lucide-react";
import { fmTheme, formatShort, formatStamp } from "./theme";
import { FILE_STATUS, FilePreview } from "./FileCard";
import { InitialsAvatar, LatestBadge, StatusTag } from "./ui";
import type { FileItem } from "./types";

const KIND_LABEL = { image: "Image", video: "Video", other: "File" } as const;

/** Right-side file preview drawer with actions, details and comments. */
export default function FilePreviewDrawer({
  isDark,
  file,
  onClose,
  onDownload,
  onShare,
  onRequestRevision,
  onAddComment,
}: {
  isDark: boolean;
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  /** Hidden when omitted */
  onRequestRevision?: (file: FileItem) => void;
  onAddComment: (file: FileItem, text: string) => void;
}) {
  const t = fmTheme(isDark);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => setComment(""), [file?.id]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [file, onClose]);

  if (!mounted || !file) return null;

  const status = FILE_STATUS[file.status];
  const actionBtn = `inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors ${isDark ? "border-[#262626] bg-[#262626]/30 text-white hover:bg-[#1C1C1C]" : "border-[#E5E5E5] bg-white text-[#111] hover:bg-[#F7F7F7]"}`;

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    onAddComment(file, text);
    setComment("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-black/30"}`} onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l lg:rounded-l-2xl ${isDark ? "bg-black border-white/40 text-white" : "bg-white border-[#E5E5E5] text-[#111]"}`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 border-b p-5 lg:px-7 lg:py-9 ${isDark ? "border-[#CACACA]" : "border-[#EEEEEE]"}`}>
          <div className="min-w-0 space-y-3 lg:space-y-4">
            <h2 id={titleId} className="truncate text-lg lg:text-3xl font-bold">{file.name} - {file.version}</h2>
            <div className="flex flex-wrap items-center gap-3">
              {file.isLatest && <LatestBadge version={`V${file.versionNumber}`} />}
              <StatusTag label={status.label} tone={status.tone} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-10 w-10 lg:h-15 lg:w-15 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#2B2626] hover:bg-[#363331]" : "bg-[#F0F0F0] hover:bg-[#E5E5E5]"}`}
          >
            <X className="w-5 h-5 lg:w-7 lg:h-7" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-5 p-5 lg:px-7 lg:py-9">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {onRequestRevision && (
              <button type="button" onClick={() => onRequestRevision(file)} className={`${actionBtn} !text-[#FDC700]`}>
                <AlertCircle size={16} /> Request Revision
              </button>
            )}
            <button type="button" onClick={() => onDownload(file)} className={actionBtn}>
              <Download size={16} /> Download
            </button>
            <button type="button" onClick={() => onShare(file)} className={actionBtn}>
              <Share2 size={16} /> Share
            </button>
          </div>

          {/* Preview */}
          <div className="aspect-[16/10] overflow-hidden rounded-2xl">
            {file.kind === "video" && file.previewUrl ? (
              <video src={file.previewUrl} controls className="h-full w-full bg-black object-contain" />
            ) : (
              <FilePreview file={file} isDark={isDark} />
            )}
          </div>

          {/* Details */}
          <dl className={`grid grid-cols-2 gap-4 rounded-2xl border p-4 lg:p-6 ${isDark ? "bg-[#1A1A1A] border-white/10" : "bg-[#FAFAFA] border-[#ECECEC]"}`}>
            <div>
              <dt className={`text-xs lg:text-sm ${isDark ? "text-[#6A7282]" : "text-black/70"}`}>Uploaded by</dt>
              <dd className="mt-0.5 text-sm lg:text-base">{file.uploadedBy.name}</dd>
            </div>
            <div>
              <dt className={`text-xs lg:text-sm ${isDark ? "text-[#6A7282]" : "text-black/70"}`}>Last updated</dt>
              <dd className="mt-0.5 text-sm lg:text-base">{formatShort(file.updatedAt)}</dd>
            </div>
            <div>
              <dt className={`text-xs lg:text-sm ${isDark ? "text-[#6A7282]" : "text-black/70"}`}>File type</dt>
              <dd className="mt-0.5 text-sm lg:text-base">{KIND_LABEL[file.kind]}</dd>
            </div>
            <div>
              <dt className={`text-xs lg:text-sm ${isDark ? "text-[#6A7282]" : "text-black/70"}`}>Current version</dt>
              <dd className={`mt-0.5 text-sm lg:text-base font-semibold ${t.gold}`}>Version {file.versionNumber}</dd>
            </div>
          </dl>

          {/* Comments */}
          <section className={`rounded-2xl border p-4 lg:p-6 ${isDark ? "bg-[#1A1A1A] border-white/10" : "bg-[#FAFAFA] border-[#ECECEC]"}`} aria-label="Comments">
            <h3 className="text-base lg:text-lg font-medium">Comments</h3>
            {file.comments.length === 0 ? (
              <p className={`py-8 text-center text-xs lg:text-sm ${isDark ? "text-[#6A7282]" : "text-black/70"}`}>No comments yet. Be the first to comment!</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {file.comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <InitialsAvatar person={c.author} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">{c.author.name}</span>
                        <span className={`ml-2 ${t.faint}`}>{formatStamp(c.at)}</span>
                      </p>
                      <p className={`mt-1 whitespace-pre-wrap text-xs lg:text-sm ${t.body}`}>{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submitComment} className="mt-4 space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                aria-label="Add a comment"
                rows={2}
                maxLength={1000}
                className={`w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none ${isDark
                  ? "bg-[#262626]/30 border-white/10 text-white placeholder:text-[#4A5565]"
                  : "bg-white border-[#E5E5E5] text-black placeholder:text-black/40"}`}
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="h-9 rounded-lg bg-[#E8D1AB] px-4 text-sm font-medium text-black transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post Comment
              </button>
            </form>
          </section>
        </div>
      </aside>
    </div>,
    document.body
  );
}
