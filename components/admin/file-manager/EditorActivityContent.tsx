import { Check } from "lucide-react";

type HistoryItem = { action?: string; status?: string; metadata?: Record<string, unknown>; createdAt?: string };
const activityText = (item: HistoryItem) => {
  const count = Number(item.metadata?.fileCount || item.metadata?.count || 0);
  const version = item.metadata?.version || item.metadata?.revisionVersion || 1;
  const labels: Record<string, string> = { send_for_edits: "Shoot Assigned for Edits", client_selection_received: "Client Selection Received", start_editing: "Editing Started Automatically", submit_approval: "Submitted for Approval", request_revision: "Client Requested Revision", submit_revision: "Revision Submitted", approve: "Approved", complete: "Completed" };
  if (item.action === "upload") return `${count || ""} Edited Files Uploaded`.trim();
  if (item.action === "delete") return "Files Deleted";
  if (item.action === "revision_downloaded") return `${count || ""} Revision Files Downloaded from Version ${version}`.trim();
  if (item.action === "revision_uploaded") return `${count || ""} Revision Files Uploaded to Version ${version}`.trim();
  return labels[item.action || ""] || String(item.action || item.status || "Workflow updated").replaceAll("_", " ");
};

export function EditorActivityContent({ history = [] }: { history?: HistoryItem[] }) {
  const items = [...history].sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  return (
    <section className="mt-5 overflow-hidden rounded-[22px] border border-[#252525] bg-[#0b0b0b]">
      <h2 className="border-b border-[#292929] px-6 py-5 text-sm font-semibold">Activity History</h2>
      <ol className="relative px-5 py-2 md:px-6">
        {items.length === 0 ? <li className="py-6 text-sm text-[#aaa]">No activity yet.</li> : items.map((item, index) => (
          <li key={`${item.action}-${item.createdAt}-${index}`} className="relative flex min-h-[82px] items-center gap-4 md:min-h-[98px] md:gap-5">
            {index < items.length - 1 && <span className="absolute bottom-0 left-[21px] top-1/2 w-px bg-[#333] md:left-[21px]" />}
            <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#14251c] text-[#638b70]">
              <Check size={20} strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-base text-white md:text-lg">{activityText(item)}</p>
              {(item.metadata?.status === "submitted" || item.metadata?.status === "resubmitted") && <span className="w-fit shrink-0 rounded-full border border-[#31415b] bg-[#191d25] px-3 py-1 text-xs text-[#78a9ff]">Waiting for Approval</span>}
            </div>
            <time className="shrink-0 self-start pt-2 text-sm text-[#666a73] sm:self-center sm:pt-0 md:text-base">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
