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
  const actionBtn = `inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors ${isDark ? "border-white/15 bg-[#111] text-white hover:bg-[#1C1C1C]" : "border-[#E5E5E5] bg-white text-[#111] hover:bg-[#F7F7F7]"}`;

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
        className={`relative flex h-full w-full max-w-[500px] flex-col overflow-y-auto border-l shadow-2xl ${isDark ? "bg-black border-[#2E2E2E] text-white" : "bg-white border-[#E5E5E5] text-[#111]"}`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-5 lg:px-7 lg:py-6 ${t.divider}`}>
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg lg:text-2xl font-semibold">{file.name} - {file.version}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {file.isLatest && <LatestBadge version={`V${file.versionNumber}`} />}
              <StatusTag label={status.label} tone={status.tone} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#2B2928] hover:bg-[#363331]" : "bg-[#F0F0F0] hover:bg-[#E5E5E5]"}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 lg:px-7">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {onRequestRevision && (
              <button type="button" onClick={() => onRequestRevision(file)} className={`${actionBtn} !text-[#F0B54A]`}>
                <AlertCircle size={13} /> Request Revision
              </button>
            )}
            <button type="button" onClick={() => onDownload(file)} className={actionBtn}>
              <Download size={13} /> Download
            </button>
            <button type="button" onClick={() => onShare(file)} className={actionBtn}>
              <Share2 size={13} /> Share
            </button>
          </div>

          {/* Preview */}
          <div className="aspect-[16/10] overflow-hidden rounded-xl">
            {file.kind === "video" && file.previewUrl ? (
              <video src={file.previewUrl} controls className="h-full w-full bg-black object-contain" />
            ) : (
              <FilePreview file={file} isDark={isDark} />
            )}
          </div>

          {/* Details */}
          <dl className={`grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border p-4 lg:p-5 ${t.card}`}>
            <div>
              <dt className={`text-[11px] ${t.faint}`}>Uploaded by</dt>
              <dd className="mt-1 text-sm">{file.uploadedBy.name}</dd>
            </div>
            <div>
              <dt className={`text-[11px] ${t.faint}`}>Last updated</dt>
              <dd className="mt-1 text-sm">{formatShort(file.updatedAt)}</dd>
            </div>
            <div>
              <dt className={`text-[11px] ${t.faint}`}>File type</dt>
              <dd className="mt-1 text-sm">{KIND_LABEL[file.kind]}</dd>
            </div>
            <div>
              <dt className={`text-[11px] ${t.faint}`}>Current version</dt>
              <dd className={`mt-1 text-sm font-semibold ${t.gold}`}>Version {file.versionNumber}</dd>
            </div>
          </dl>

          {/* Comments */}
          <section className={`rounded-xl border p-4 lg:p-5 ${t.card}`} aria-label="Comments">
            <h3 className="text-sm lg:text-base font-medium">Comments</h3>
            {file.comments.length === 0 ? (
              <p className={`py-8 text-center text-xs ${t.faint}`}>No comments yet. Be the first to comment!</p>
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
                className={`w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8D1AB] ${t.control}`}
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="h-9 rounded-md bg-[#E8D3AE] px-4 text-xs font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
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
