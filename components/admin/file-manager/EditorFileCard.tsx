import { ChevronUp, FileDown, MessageCircle, MoreVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface EditorFileCardData {
  id: string;
  title: string;
  contentType: string;
  previewUrl?: string;
  fileSizeMb: number;
  versionLabel: string;
  statusLabel: string;
  commentCount: number;
  referenceLink?: string;
  referenceMessage?: string;
  uploaderName: string;
  uploaderInitials: string;
  uploadedAt: string;
}

export function EditorFileCard({ file, onOpen }: { file: EditorFileCardData; onOpen?: () => void }) {
  const referenceContentExists = Boolean(file.referenceLink || file.referenceMessage);

  return (
    <article className="w-full overflow-hidden rounded-xl border border-white/20 bg-[#111111] shadow-md">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <span onClick={(event) => event.stopPropagation()}>
            <Checkbox 
              aria-label={`Select ${file.title}`} 
              className="h-4 w-4 border-white/50 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-white/80">ID : #{file.id}</span>
        </div>
        <span className="text-xs font-medium text-white/90">{file.fileSizeMb.toFixed(1)} MB</span>
      </div>

      <div className="px-5">
        <div
          className={`relative flex aspect-[1.13] items-center justify-center overflow-hidden rounded-lg bg-[#202020] ${onOpen ? "cursor-pointer" : ""}`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (onOpen && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onOpen();
            }
          }}
          role={onOpen ? "button" : undefined}
          tabIndex={onOpen ? 0 : undefined}
          aria-label={onOpen ? `View ${file.title}` : undefined}
        >
          {file.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={file.previewUrl} 
              alt={file.title} 
              className="h-full w-full object-cover" />
          ) : (
            <FileDown 
              size={68} 
              strokeWidth={1.8} 
              className="text-[#888]" />
          )}
        </div>
      </div>

      <div className="flex min-h-[96px] flex-col justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white" title={file.title}>{file.title}</span>
            <span 
              className="shrink-0 rounded border border-[#315342] bg-[#17221c] px-2.5 py-1 text-[10px] leading-none text-[#54cc83]">{file.versionLabel}</span>
            <span 
              className="inline-flex shrink-0 items-center gap-1 text-xs text-white/90" 
              aria-label={`${file.commentCount} comments`}>
              {file.commentCount}<MessageCircle size={18} strokeWidth={1.5} />
            </span>
          </div>
          <span 
            className="mt-2 inline-flex rounded-full border border-[#8b35ad]/40 bg-[#8b35ad]/15 px-2.5 py-1 text-[10px] leading-none text-[#d36cff]">{file.statusLabel}</span>
        </div>

        {referenceContentExists && (
          <div className="space-y-2 border-y border-white/10 py-3 text-[10px] leading-4 text-[#888]">
            {file.referenceLink && (
              <p className="flex items-start justify-between gap-2">
                <span>Reference Link for Edits: <span className="break-all text-[#e8d1ab] underline">{file.referenceLink}</span></span>
                <ChevronUp size={16} className="shrink-0 text-white" />
              </p>
            )}
            {file.referenceMessage && (
              <p>Reference Message for Edits: <span className="text-[#e8d1ab]">{file.referenceMessage}</span></p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8e1ff] text-sm text-black">{file.uploaderInitials}</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#cdc5c5]">Uploaded by {file.uploaderName}</p>
              <p className="mt-1 text-[10px] text-[#cdc5c5]/60">{file.uploadedAt}</p>
            </div>
          </div>
          <button 
            type="button" 
            aria-label={`More options for ${file.title}`} 
            className="shrink-0 rounded p-1 text-white/90">
            <MoreVertical size={22} />
          </button>
        </div>
      </div>
    </article>
  );
}
