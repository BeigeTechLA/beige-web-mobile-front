import { Check } from "lucide-react";
import { editorActivityItems, editorActivityTime } from "@/components/admin/file-manager/editorMockData";

export function EditorActivityContent() {
  return (
    <section className="mt-5 overflow-hidden rounded-[22px] border border-[#252525] bg-[#0b0b0b]">
      <h2 className="border-b border-[#292929] px-6 py-5 text-sm font-semibold">Activity History</h2>
      <ol className="relative px-5 py-2 md:px-6">
        {editorActivityItems.map((item, index) => (
          <li key={item.label} className="relative flex min-h-[82px] items-center gap-4 md:min-h-[98px] md:gap-5">
            {index < editorActivityItems.length - 1 && <span className="absolute bottom-0 left-[21px] top-1/2 w-px bg-[#333] md:left-[21px]" />}
            <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#14251c] text-[#638b70]">
              <Check size={20} strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-base text-white md:text-lg">{item.label}</p>
              {item.badge && <span className="w-fit shrink-0 rounded-full border border-[#31415b] bg-[#191d25] px-3 py-1 text-xs text-[#78a9ff]">{item.badge}</span>}
            </div>
            <time className="shrink-0 self-start pt-2 text-sm text-[#666a73] sm:self-center sm:pt-0 md:text-base">{editorActivityTime}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
