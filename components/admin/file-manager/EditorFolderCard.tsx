import { FolderOpen, Info, Link as LinkIcon, MoreVertical } from "lucide-react";

export interface EditorFolderCardProps {
  title: string;
  fileCount: number;
  category?: string;
  isLinked?: boolean;
  lastOpened: string;
  userInitials: string;
  hoverMessage?: string;
  onOpen?: () => void;
}

export function EditorFolderCard({
  title,
  fileCount,
  category,
  isLinked = false,
  lastOpened,
  userInitials,
  hoverMessage,
  onOpen,
}: EditorFolderCardProps) {
  return (
    <div className="group/editor-folder relative w-full h-full lg:max-w-[350px]">
      <article
        onClick={onOpen}
        className="flex h-full w-full cursor-pointer flex-col overflow-visible rounded-xl border border-white/5 bg-[#18181b] shadow-xl transition-all hover:border-white/20 hover:bg-[#1c1c20] lg:rounded-3xl"
      >
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-3">
              <FolderOpen className="shrink-0 fill-[#E8D1AB]/20 text-[#E8D1AB]" size={24} />
              <div className="flex min-w-0 items-start gap-1.5">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold leading-tight text-white" title={title}>{title}</h3>
                  <p className="mt-1 text-sm text-[#E8D1AB]/60">{String(fileCount).padStart(2, "0")} Files</p>
                </div>
                {hoverMessage && (
                  <button
                    type="button"
                    aria-label={hoverMessage}
                    className="group/editor-tooltip relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#e8d1ab]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Info 
                      size={16} 
                      fill="currentColor" 
                      stroke="#171717" />
                    <span 
                      className="pointer-events-none absolute left-full top-1/2 z-30 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#b56a1f] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/editor-tooltip:opacity-100 group-focus-visible/editor-tooltip:opacity-100">
                      {hoverMessage}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label={`More options for ${title}`}
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {(category?.trim() || isLinked) && (
            <div className="mt-4 flex min-w-0 flex-nowrap items-center gap-2">
              {category?.trim() && (
                <span 
                  className="min-w-0 max-w-[170px] shrink truncate rounded-full border border-white/5 bg-black/40 px-4 py-1.5 text-xs font-medium text-white">
                  {category}
                </span>
              )}
              {isLinked && (
                <span 
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#6ce9a6]/20 bg-[#D4FFE4] px-2 py-1.5 text-xs font-medium text-[#16A34A]">
                  <LinkIcon size={16} />Linked
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-white/10 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8E1FF] text-base text-black">{userInitials}</div>
          <span className="whitespace-pre-line text-sm text-[#CDC5C5]">Updated on {lastOpened}</span>
        </div>
      </article>

    </div>
  );
}
