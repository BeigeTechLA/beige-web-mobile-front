"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import type { EditorFileCardData } from "@/components/admin/file-manager/EditorFileCard";
import { fileManagerApi, type FileCommentItem } from "@/lib/fileManagerApi";
import { editorWorkflowApi } from "@/lib/editorWorkflowApi";
import { toast } from "sonner";

interface EditorFileDetailsPanelProps {
  file: EditorFileCardData;
  onClose: () => void;
  onDownload?: () => void;
  revisionComparison?: boolean;
  bookingId?: string;
}

type BeforeAfterData = { original?: { url?: string }; edited?: { url?: string }; revisionNotes?: Array<{ note?: string; text?: string; message?: string }> };

export function EditorFileDetailsPanel({ file, onClose, onDownload, revisionComparison = false, bookingId }: EditorFileDetailsPanelProps) {
  const [comments, setComments] = useState<FileCommentItem[]>([]);
  const [comment, setComment] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterData | null>(null);
  const [showAfter, setShowAfter] = useState(false);
  const download = async () => {
    try {
      if (onDownload) return onDownload();
      if (!file.filepath) return;
      const result = await fileManagerApi.getExternalFileDownloadUrl(file.filepath);
      fileManagerApi.downloadUrl(result.url, file.title);
    } catch (caught) { toast.error((caught as Error).message || "Unable to download file"); }
  };
  useEffect(() => {
    if (!file.filepath) return;
    void fileManagerApi.getComments(file.filepath).then(setComments).catch((caught) => { setComments([]); toast.error((caught as Error).message || "Unable to load comments"); });
  }, [file.filepath]);
  useEffect(() => {
    if (!bookingId || !file.filepath || !file.filepath.includes("Edits")) { setBeforeAfter(null); return; }
    setShowAfter(false);
    void editorWorkflowApi.beforeAfter(bookingId, file.filepath).then((data) => setBeforeAfter(data as BeforeAfterData)).catch((caught) => { setBeforeAfter(null); toast.error((caught as Error).message || "Unable to load before/after images"); });
  }, [bookingId, file.filepath]);
  const postComment = async () => {
    if (!file.filepath || !comment.trim() || commentPending) return;
    try {
      const user = JSON.parse(window.localStorage.getItem("revure_user") || "{}") as Record<string, string | number>;
      const userId = user.id || user._id || user.user_id;
      if (!userId) throw new Error("Unable to identify the current user");
      setCommentPending(true); setCommentError("");
      await fileManagerApi.addComment({ fileMetaId: file.filepath, user_id: userId, comment: comment.trim() });
      setComment(""); setComments(await fileManagerApi.getComments(file.filepath));
    } catch (caught) { const message = (caught as Error).message || "Unable to post comment"; setCommentError(message); toast.error(message); }
    finally { setCommentPending(false); }
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-end bg-black/55 backdrop-blur-[6px]" 
      onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`File details for ${file.title}`}
        className="flex h-full w-full flex-col overflow-hidden border-l border-[#383838] bg-black text-white shadow-2xl sm:h-[96dvh] sm:w-[min(100%,680px)] sm:rounded-l-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#333] px-6 py-7 sm:px-8 sm:py-11">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight sm:text-[30px]">{file.title}</h2>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="rounded-full border border-[#444] bg-[#171717] px-3 py-1.5 text-xs text-white">V{revisionComparison ? "2" : "1"} <span className="text-[#00d887]">Latest</span></span>
              {revisionComparison && <span 
                className="inline-flex items-center gap-1.5 rounded-full border border-[#008c5a]/50 bg-[#003d2d]/35 px-3 py-1.5 text-xs text-[#00e58b]"><CheckCircle2 size={13} />Revision Complete</span>}
              <span className="rounded-full border border-[#873bb0]/50 bg-[#4a155f]/20 px-3 py-1.5 text-xs text-[#d575ff]">{revisionComparison ? "File Selected for Review" : file.statusLabel}</span>
            </div>
          </div>
          <button 
            type="button" 
            aria-label="Close file details" 
            onClick={onClose} 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#292526] transition hover:bg-[#383334] sm:h-[58px] sm:w-[58px]">
            <X size={24} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          {beforeAfter?.edited?.url ? (
            <div className="flex flex-wrap gap-3">
              <button 
                type="button" onClick={() => setShowAfter(false)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#333] bg-[#202020] px-4 text-sm text-white"><AlertCircle size={16} />Before (Original)</button>
              <button 
                type="button" onClick={() => setShowAfter(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#c18a12] bg-[#34270d] px-4 text-sm text-[#e4b420]"><AlertCircle size={16} />After (Revision)</button>
              <button 
                type="button" 
                onClick={() => void download()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#252525] bg-[#0d0d0d] px-4 text-sm text-[#c7c7d0]"><Download size={16} />Download</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button 
                type="button" 
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#252525] bg-[#0d0d0d] px-4 text-sm text-[#ffd500]"><AlertCircle size={16} />Request Revision</button>
              <button 
                type="button" 
                onClick={() => void download()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#252525] bg-[#0d0d0d] px-4 text-sm text-[#c7c7d0]"><Download size={16} />Download</button>
            </div>
          )}

          {beforeAfter?.edited?.url ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ComparisonPreview file={file} label="Before" url={beforeAfter.original?.url} active={!showAfter} />
              <ComparisonPreview 
                file={file} 
                label="After" 
                url={beforeAfter.edited?.url}
                active={showAfter}
                revised />
            </div>
          ) : (
            <div 
              className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl bg-[#e7e7e7] sm:aspect-[1.43] sm:min-h-0">
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={file.previewUrl} 
                  alt={file.title} 
                  className="h-full w-full object-contain" />
              ) : (
                <div className="text-sm text-[#777]">Preview unavailable</div>
              )}
            </div>
          )}

          <section 
            className={`grid gap-x-5 gap-y-5 rounded-2xl border border-[#303030] bg-[#1b1b1b] p-5 sm:gap-x-8 sm:p-6 ${revisionComparison ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2"}`}>
            <Metadata label="Uploaded by" value={file.uploaderName} />
            <Metadata label="Last updated" value={file.updatedAt ? new Date(file.updatedAt).toLocaleString() : "-"} />
            <Metadata label="File type" value={file.contentType || "-"} />
            <Metadata 
              label="Current version" 
              value={`Version ${file.currentVersion || 1}`} 
              accent />
          </section>

          {beforeAfter?.revisionNotes?.length ? <section className="rounded-2xl border border-[#303030] bg-[#1b1b1b] p-5 sm:p-6"><h3 className="text-base font-medium">Revision Notes</h3>{beforeAfter.revisionNotes.map((note, index) => <p key={index} className="mt-2 text-sm text-[#c7c7d0]">{note.note || note.text || note.message || "-"}</p>)}</section> : null}

          <section className="rounded-2xl border border-[#303030] bg-[#1b1b1b] p-5 sm:p-6">
            <h3 className="text-base font-medium">Comments</h3>
            {comments.length === 0 ? <div className="flex min-h-[105px] items-center justify-center text-center text-sm text-[#737d8d]">No comments yet</div> : <div className="space-y-2 text-sm">{comments.map((item) => <p key={item.id}>{item.userId?.name || "User"}: {item.comment}</p>)}</div>}
            <textarea 
              rows={2} 
              value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment..." 
              className="w-full resize-none rounded-lg border border-[#343434] bg-[#1b1b1b] px-3 py-2.5 text-sm outline-none placeholder:text-[#626d7c] focus:border-[#555]" />
            {commentError && <p className="mt-2 text-sm text-red-400">{commentError}</p>}
            <button disabled={commentPending} onClick={() => void postComment()} type="button" className="mt-3 rounded-lg bg-[#93866e] px-4 py-2 text-sm font-medium text-black">{commentPending ? "Posting…" : "Post Comment"}</button>
          </section>
        </div>
      </aside>
    </div>
  );
}

function ComparisonPreview({ file, label, url, active = true, revised = false }: { file: EditorFileCardData; label: string; url?: string; active?: boolean; revised?: boolean }) {
  return (
    <div 
      className={`relative flex aspect-[0.95] items-center justify-center overflow-hidden rounded-2xl bg-[#e7e7e7] ${active ? "" : "hidden"} ${revised ? "border-4 border-[#d7a438]" : ""}`}>
      {url || file.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={url || file.previewUrl} 
          alt={`${label} version of ${file.title}`} 
          className={`h-full w-full object-contain ${revised ? "brightness-110 saturate-125 hue-rotate-[-8deg]" : "brightness-90 saturate-75"}`} />
      ) : <div className="text-sm text-[#777]">Preview unavailable</div>}
      <span 
        className={`absolute left-4 top-4 rounded-full px-5 py-2 text-xs font-semibold ${revised ? "bg-black text-white" : "bg-white text-black"}`}>{label}</span>
    </div>
  );
}

function Metadata({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-[#697486]">{label}</p>
      <p className={`mt-1 truncate text-sm ${accent ? "font-semibold text-[#e8d1ab]" : "text-white"}`}>{value}</p>
    </div>
  );
}
