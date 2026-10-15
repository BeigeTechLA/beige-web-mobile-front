"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import {
  getWorkspaceActivity,
  getWorkspaceShoot,
  getWorkspaceShoots,
  type EditorWorkspaceRole,
  type WorkspaceActivity,
} from "./editorWorkspaceDemoStore";
import {
  EditorWorkspaceTopbar,
  formatActivityDate,
  useEditorWorkspaceTheme,
  WorkspaceInput,
  WorkspaceSelect,
  workspaceMuted,
  workspaceSurface,
  workspaceUrl,
} from "./EditorWorkspaceShared";

const ACTIVITY_COLORS: Record<WorkspaceActivity["category"], string> = {
  assignment: "bg-[#E8D1AB]",
  editing: "bg-[#33B7F2]",
  agreement: "bg-[#17C889]",
  finance: "bg-[#D8BC83]",
  file: "bg-[#BDA0EF]",
};

interface EditorWorkspaceActivityProps {
  role: EditorWorkspaceRole;
  shootId?: string | null;
}

export default function EditorWorkspaceActivity({
  role,
  shootId,
}: EditorWorkspaceActivityProps) {
  const router = useRouter();
  const { isDark, mounted } = useEditorWorkspaceTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const update = () => setRevision((current) => current + 1);
    window.addEventListener("beige:editor-workspace:changed", update);
    window.addEventListener("beige:post-production-demo:updated", update);
    return () => {
      window.removeEventListener("beige:editor-workspace:changed", update);
      window.removeEventListener("beige:post-production-demo:updated", update);
    };
  }, []);

  const selected = useMemo(() => {
    void revision;
    return mounted && shootId ? getWorkspaceShoot(shootId, role) : null;
  }, [mounted, role, shootId, revision]);

  const activity = useMemo(() => {
    if (!mounted) return [];
    const shoots = selected ? [selected] : getWorkspaceShoots(role, "mine");
    return shoots
      .flatMap((shoot) =>
        getWorkspaceActivity(shoot.id, role).map((event) => ({
          ...event,
          shootName: shoot.name,
          shootId: shoot.id,
        })),
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .filter((item) => {
        const text =
          `${item.title} ${item.detail} ${item.shootName}`.toLowerCase();
        return (
          (filter === "all" || item.category === filter) &&
          text.includes(search.trim().toLowerCase())
        );
      });
  }, [mounted, selected, role, search, filter, revision]);

  const back = () =>
    router.push(shootId ? workspaceUrl(role, shootId) : workspaceUrl(role));

  return (
    <>
      <EditorWorkspaceTopbar title="Activity" />
      <main className="mx-auto w-full max-w-[1450px] space-y-5 px-4 py-6 sm:px-6 lg:px-9">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <section
          className={`overflow-hidden rounded-2xl border ${workspaceSurface(isDark)}`}
        >
          <header
            className={`border-b px-5 py-6 ${isDark ? "border-[#292929]" : "border-[#E9E9E9]"}`}
          >
            <h1 className="text-lg font-semibold">
              Editor Assignment &amp; Activity
            </h1>
            <p className={`mt-1 text-sm ${workspaceMuted(isDark)}`}>
              Preserved assignment, work, agreement, and payment history
              {selected ? ` for ${selected.name}` : " for your editor shoots"}.
            </p>
          </header>

          <div className="flex flex-wrap gap-3 px-5 pt-5">
            <div className="relative min-w-[200px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]"
                size={17}
              />
              <WorkspaceInput
                isDark={isDark}
                aria-label="Search activity"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activity"
                className="h-11 pl-10"
              />
            </div>
            <WorkspaceSelect
              label="Activity category"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "All Activity" },
                { value: "assignment", label: "Assignment" },
                { value: "editing", label: "Editing" },
                { value: "agreement", label: "Agreements" },
                { value: "finance", label: "Compensation" },
                { value: "file", label: "Files" },
              ]}
              isDark={isDark}
              className="min-w-[165px] flex-1 sm:flex-none"
              triggerClassName="h-11"
            />
          </div>

          <div className="px-5 py-7">
            {activity.length ? (
              <div className="space-y-0">
                {activity.map((item, index) => (
                  <div
                    key={`${item.shootId}-${item.id}`}
                    className="relative flex gap-4 pb-7"
                  >
                    <div className="flex w-5 shrink-0 flex-col items-center">
                      <span
                        className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${ACTIVITY_COLORS[item.category]}`}
                      />
                      {index < activity.length - 1 && (
                        <div
                          className={`absolute bottom-0 left-[9px] top-4 w-px ${isDark ? "bg-[#242424]" : "bg-[#D9D9D9]"}`}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className={`text-xs ${workspaceMuted(isDark)}`}>
                          {formatActivityDate(item.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`mt-1 text-xs leading-5 ${workspaceMuted(isDark)}`}
                      >
                        {item.detail}
                      </p>
                      {!shootId && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(workspaceUrl(role, item.shootId))
                          }
                          className={`mt-2 text-xs hover:underline ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}
                        >
                          {item.shootName} · #{item.shootId}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={`py-12 text-center text-sm ${workspaceMuted(isDark)}`}
              >
                {mounted ? "No matching activity." : "Loading activity..."}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
