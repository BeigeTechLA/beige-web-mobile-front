"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Loader2, X } from "lucide-react";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";

type Folder = { name: string; path?: string };

export default function MoveEntriesModal({
  externalId, sourcePaths, sourceLabel, onClose, onMoved,
}: {
  externalId: string;
  sourcePaths: string[];
  sourceLabel?: string;
  onClose: () => void;
  onMoved: () => void;
}) {
  const [phase, setPhase] = useState<"pre" | "post">("post");
  const [path, setPath] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [movedCount, setMovedCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fileManagerApi.getExternalWorkspaceFiles(externalId, phase, path)
      .then((result) => { if (active) setFolders(result.folders || []); })
      .catch((error) => { if (active) toast.error(error?.message || "Could not load destination folders"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [externalId, phase, path]);

  const move = async () => {
    setMoving(true);
    setMovedCount(0);
    let moved = 0;
    try {
      let failed = 0;
      let firstFailure = "";
      // A phase folder is expanded by the server in batches; explicit file selections
      // are divided here so they stay below the API's per-request limit.
      const batches = sourcePaths.length === 1
        ? [sourcePaths]
        : Array.from({ length: Math.ceil(sourcePaths.length / 50) }, (_, index) => sourcePaths.slice(index * 50, (index + 1) * 50));
      for (const batch of batches) {
        for (;;) {
          const result = await fileManagerApi.moveExternalEntries({ externalId, phase, targetPath: path, sourcePaths: batch });
          moved += result.successCount;
          failed += result.failureCount;
          setMovedCount(moved);
          firstFailure ||= result.items.find((item) => !item.success)?.error || "";
          if (!result.hasMore || !result.successCount || result.failureCount) break;
        }
      }
      if (failed) toast.error(`${failed} item(s) could not be moved: ${firstFailure || "Unknown error"}`);
      if (moved) {
        toast.success(`Moved ${moved} item(s)`);
        onMoved();
      }
      if (!failed) onClose();
    } catch (error) {
      if (moved) {
        toast.success(`Moved ${moved} item(s) before the request stopped`);
        onMoved();
      }
      toast.error(error instanceof Error ? error.message : "Move failed");
    } finally { setMoving(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Move files or folders">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#1c1c1e] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Move {sourceLabel || `${sourcePaths.length} item${sourcePaths.length === 1 ? "" : "s"}`}</h2>
          <button type="button" onClick={onClose} disabled={moving} aria-label="Close"><X size={20} /></button>
        </div>
        <p className="mt-2 text-sm text-white/60">Choose a destination in this project. Items with a matching name at the destination will not move.</p>
        {sourceLabel && <p className="mt-2 rounded-lg border border-[#E8D1AB]/25 bg-[#E8D1AB]/10 p-3 text-sm text-[#E8D1AB]">The Pre Production folder stays in place. Its files and subfolders move to the selected destination.</p>}
        <div className="mt-5 flex gap-2">
          {(["pre", "post"] as const).map((value) => (
            <button key={value} type="button" disabled={moving} onClick={() => { setPhase(value); setPath(""); }}
              className={`rounded-lg px-3 py-2 text-sm ${phase === value ? "bg-[#E8D1AB] text-black" : "bg-white/10 text-white"}`}>
              {value === "pre" ? "Pre Production" : "Post Production"}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button type="button" disabled={moving} onClick={() => setPath("")} className="text-[#E8D1AB]">{phase === "pre" ? "Pre Production" : "Post Production"}</button>
          {path.split("/").filter(Boolean).map((segment, index, parts) => (
            <span key={index} className="flex items-center gap-2"><span>/</span><button type="button" disabled={moving} onClick={() => setPath(parts.slice(0, index + 1).join("/"))} className="text-[#E8D1AB]">{segment}</button></span>
          ))}
        </div>
        <div className="mt-3 max-h-64 min-h-28 overflow-y-auto rounded-xl border border-white/10 p-2">
          {loading ? <Loader2 className="m-3 animate-spin" size={20} /> : folders.length ? folders.map((folder) => (
            <button key={folder.path || folder.name} type="button" disabled={moving} onClick={() => setPath([path, folder.name].filter(Boolean).join("/"))}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10">
              <FolderOpen size={18} className="text-[#E8D1AB]" />{folder.name}
            </button>
          )) : <p className="p-3 text-sm text-white/50">No subfolders</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {moving && movedCount > 0 && <span className="mr-auto self-center text-sm text-white/60">{movedCount} moved</span>}
          <button type="button" onClick={onClose} disabled={moving} className="rounded-lg px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={move} disabled={moving || loading} className="rounded-lg bg-[#E8D1AB] px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
            {moving ? "Moving..." : "Move here"}
          </button>
        </div>
      </div>
    </div>
  );
}
