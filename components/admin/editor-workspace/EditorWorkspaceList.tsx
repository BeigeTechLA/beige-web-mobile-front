"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  EDITING_STAGES,
  WORKSPACE_DEMO_SHOOTS,
  getWorkspaceShoot,
  getWorkspaceShoots,
  useWorkspaceRecord,
  type EditorWorkspaceRole,
  type WorkspaceShoot,
} from "./editorWorkspaceDemoStore";
import {
  EditorWorkspaceTopbar,
  StatusPill,
  useEditorWorkspaceTheme,
  usePreviewRole,
  WorkspaceInput,
  WorkspaceSelect,
  workspaceMuted,
  workspaceSecondary,
  workspaceSurface,
  workspaceUrl,
} from "./EditorWorkspaceShared";

const PAGE_SIZE = 6;
type WorkspaceScope = "mine" | "all";
type WorkspaceView = "list" | "grid";
type WorkspaceSort = "newest" | "name";

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "Videography", label: "Videography" },
  { value: "Photography", label: "Photography" },
  { value: "Video & Photo", label: "Video & Photo" },
];

interface WorkspaceItemProps {
  shoot: WorkspaceShoot;
  role: EditorWorkspaceRole;
  isDark: boolean;
  view: WorkspaceView;
  hydrated: boolean;
}

function WorkspaceItem({
  shoot,
  role,
  isDark,
  view,
  hydrated,
}: WorkspaceItemProps) {
  const router = useRouter();
  useWorkspaceRecord(shoot.id, role);
  const project = hydrated ? getWorkspaceShoot(shoot.id, role) || shoot : shoot;
  const status =
    role === "external" ? project.agreementStatus : project.editingStatus;
  const isPending = role === "external" && status === "Pending";

  const openDetails = () => router.push(workspaceUrl(role, project.id));
  const openAgreement = () =>
    router.push(workspaceUrl("external", project.id, "agreement"));

  if (view === "grid") {
    return (
      <div
        className={`flex min-w-0 flex-col rounded-xl border p-4 transition-colors hover:border-[#C9B28C] ${workspaceSurface(isDark)}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#846738]"}`}
          >
            #{project.id}
          </span>
          <button
            type="button"
            onClick={openDetails}
            aria-label={`Open ${project.name}`}
            className="rounded-lg p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <h3
          className="mt-3 truncate text-base font-semibold"
          title={project.name}
        >
          {project.name}
        </h3>
        <p className={`mt-1 text-xs ${workspaceMuted(isDark)}`}>
          {project.date} · {project.service}
        </p>
        <div
          className={`my-4 h-px ${isDark ? "bg-[#323232]" : "bg-[#E9E9E9]"}`}
        />
        <p className={`mb-2 text-xs ${workspaceMuted(isDark)}`}>
          {role === "internal" ? "Editing Status" : "Agreement Status"}
        </p>
        <div>
          <StatusPill status={status} />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className={workspaceMuted(isDark)}>Producer: </span>
            {project.producer}
          </p>
          <p>
            <span className={workspaceMuted(isDark)}>CP: </span>
            {project.creativePartner}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {isPending && (
            <button
              type="button"
              onClick={openAgreement}
              className="h-9 rounded-lg bg-[#D3FBE4] px-3 text-xs font-semibold text-[#117241]"
            >
              Review Agreement
            </button>
          )}
          <button
            type="button"
            onClick={openDetails}
            className={`h-9 rounded-lg border px-3 text-xs ${workspaceSecondary(isDark)}`}
          >
            View Shoot
          </button>
        </div>
      </div>
    );
  }

  return (
    <tr
      className={`border-t transition-colors ${
        isDark
          ? "border-[#272727] hover:bg-[#1D1D1D]"
          : "border-[#EAEAEA] hover:bg-[#FFFCF6]"
      }`}
    >
      <td className="whitespace-nowrap px-5 py-5 text-sm">#{project.id}</td>
      <td className="min-w-[190px] px-3 py-4">
        <button
          type="button"
          onClick={openDetails}
          className="block max-w-[245px] truncate text-left text-sm font-medium hover:underline"
          title={project.name}
        >
          {project.name}
        </button>
        <p className={`mt-1 text-xs ${workspaceMuted(isDark)}`}>
          Date: {project.date}
        </p>
      </td>
      <td className="px-3 py-4 text-sm">{project.service}</td>
      <td className="px-3 py-4">
        <StatusPill status={status} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        {project.producer}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        {project.creativePartner}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          {isPending && (
            <button
              type="button"
              onClick={openAgreement}
              className="whitespace-nowrap rounded-md bg-[#D3FBE4] px-3 py-2 text-xs font-semibold text-[#117241]"
            >
              Review
            </button>
          )}
          <button
            type="button"
            onClick={openDetails}
            aria-label={`View details for ${project.name}`}
            className="rounded-md p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function EditorWorkspaceList() {
  const router = useRouter();
  const role = usePreviewRole();
  const { isDark, mounted } = useEditorWorkspaceTheme();

  const [scope, setScope] = useState<WorkspaceScope>("mine");
  const [view, setView] = useState<WorkspaceView>("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("all");
  const [sort, setSort] = useState<WorkspaceSort>("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((current) => current + 1);
    window.addEventListener("beige:editor-workspace:changed", refresh);
    window.addEventListener("beige:post-production-demo:updated", refresh);
    return () => {
      window.removeEventListener("beige:editor-workspace:changed", refresh);
      window.removeEventListener("beige:post-production-demo:updated", refresh);
    };
  }, []);

  useEffect(() => {
    setScope("mine");
    setStatus("all");
    setService("all");
    setPage(1);
  }, [role]);

  const { mine, all } = useMemo(() => {
    // Wait for hydration before reading the tab's sessionStorage data.
    // The server and first client render therefore use the same initial list.
    void revision;
    if (!mounted) {
      return {
        mine: WORKSPACE_DEMO_SHOOTS.filter((shoot) =>
          role === "internal"
            ? shoot.internalAssignment
            : shoot.externalAssignment,
        ),
        all:
          role === "internal"
            ? WORKSPACE_DEMO_SHOOTS.filter((shoot) => !shoot.internalAssignment)
            : [],
      };
    }
    return {
      mine: getWorkspaceShoots(role, "mine"),
      all: role === "internal" ? getWorkspaceShoots(role, "all") : [],
    };
  }, [role, mounted, revision]);

  const data = role === "internal" && scope === "all" ? all : mine;
  const statusOptions =
    role === "internal"
      ? EDITING_STAGES.map((value) => ({ value, label: value }))
      : ["Pending", "Accepted", "Rejected"].map((value) => ({
          value,
          label: value,
        }));

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return data
      .filter((shoot) => {
        const details =
          `${shoot.id} ${shoot.name} ${shoot.service} ${shoot.producer} ${shoot.creativePartner}`.toLowerCase();
        const shootStatus =
          role === "external" ? shoot.agreementStatus : shoot.editingStatus;
        return (
          details.includes(needle) &&
          (status === "all" || status === shootStatus) &&
          (service === "all" || service === shoot.service)
        );
      })
      .sort((first, second) =>
        sort === "name"
          ? first.name.localeCompare(second.name)
          : Number(second.id) - Number(first.id),
      );
  }, [data, role, search, status, service, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageShoots = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const showActivity = () =>
    router.push(workspaceUrl(role, undefined, "activity"));

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setService("all");
    setSort("newest");
    setPage(1);
  };

  return (
    <>
      <EditorWorkspaceTopbar
        count={role === "internal" ? mine.length + all.length : mine.length}
        showActivity
        onActivity={showActivity}
      />
      <main className="mx-auto w-full max-w-[1750px] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
        <button
          type="button"
          onClick={showActivity}
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8D1AB] px-4 text-sm font-medium text-black lg:hidden"
        >
          <Clock3 size={16} /> View Activity
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Shoots Management</h1>
            <p className={`mt-1 text-sm ${workspaceMuted(isDark)}`}>
              Track and manage your photography and videography projects
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/shoots?view=globe")}
              className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm ${workspaceSecondary(isDark)}`}
            >
              <Globe2 size={16} /> Globe View
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/shoots?view=calendar")}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm text-black hover:bg-[#EFEFEF]"
            >
              <CalendarDays size={16} /> Calendar View
            </button>
          </div>
        </div>

        <div
          className={`my-7 border-t-2 border-dashed ${isDark ? "border-[#373737]" : "border-[#E5E5E5]"}`}
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium">
            {role === "internal"
              ? "Internal Editor Workspace"
              : "External Editor Workspace"}
          </h2>
          <WorkspaceSelect
            label="Preview editor role"
            value={role}
            onValueChange={(value) =>
              router.push(workspaceUrl(value as EditorWorkspaceRole))
            }
            options={[
              { value: "internal", label: "Internal Editor" },
              { value: "external", label: "External Editor" },
            ]}
            isDark={isDark}
            className="w-[165px]"
            triggerClassName="h-10 text-xs"
          />
        </div>

        <div
          className={`inline-flex max-w-full gap-1 rounded-xl border p-1 ${workspaceSurface(isDark)}`}
        >
          <button
            type="button"
            onClick={() => {
              setScope("mine");
              setStatus("all");
              setPage(1);
            }}
            className={`rounded-lg px-4 py-3 text-sm ${scope === "mine" ? "bg-[#E8D1AB] text-black" : workspaceMuted(isDark)}`}
          >
            My Editor Shoots ({mine.length})
          </button>
          {role === "internal" && (
            <button
              type="button"
              onClick={() => {
                setScope("all");
                setStatus("all");
                setPage(1);
              }}
              className={`rounded-lg px-4 py-3 text-sm ${scope === "all" ? "bg-[#E8D1AB] text-black" : workspaceMuted(isDark)}`}
            >
              All Shoots ({all.length})
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]"
            />
            <WorkspaceInput
              isDark={isDark}
              aria-label="Search shoots"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search shoots, clients, or IDs..."
              className="h-12 rounded-xl pl-12"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceSelect
              label="Filter by status"
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Status" },
                ...statusOptions,
              ]}
              isDark={isDark}
              className="min-w-[155px] flex-1 sm:flex-none"
              triggerClassName="rounded-xl"
            />
            <button
              type="button"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((previous) => !previous)}
              className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm ${workspaceSecondary(isDark)}`}
            >
              <SlidersHorizontal size={17} /> Filters
            </button>
            <div
              className={`inline-flex h-12 items-center rounded-xl border p-1 ${workspaceSurface(isDark)}`}
            >
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={`h-full rounded-lg px-3 ${view === "list" ? "bg-[#E8D1AB] text-black" : workspaceMuted(isDark)}`}
              >
                <List size={19} />
              </button>
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                className={`h-full rounded-lg px-3 ${view === "grid" ? "bg-[#E8D1AB] text-black" : workspaceMuted(isDark)}`}
              >
                <Grid2X2 size={19} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div
            className={`mt-3 flex flex-wrap items-end gap-3 rounded-xl border p-4 ${workspaceSurface(isDark)}`}
          >
            <div className="min-w-[175px] flex-1 sm:flex-none">
              <p className={`mb-2 text-xs ${workspaceMuted(isDark)}`}>
                Service
              </p>
              <WorkspaceSelect
                label="Filter by service"
                value={service}
                onValueChange={(value) => {
                  setService(value);
                  setPage(1);
                }}
                options={SERVICE_OPTIONS}
                isDark={isDark}
                triggerClassName="h-10"
              />
            </div>
            <div className="min-w-[175px] flex-1 sm:flex-none">
              <p className={`mb-2 text-xs ${workspaceMuted(isDark)}`}>
                Sort by
              </p>
              <WorkspaceSelect
                label="Sort shoots"
                value={sort}
                onValueChange={(value) => {
                  setSort(value as WorkspaceSort);
                  setPage(1);
                }}
                options={[
                  { value: "newest", label: "Newest Shoot" },
                  { value: "name", label: "Project Name" },
                ]}
                isDark={isDark}
                triggerClassName="h-10"
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className={`h-10 rounded-lg border px-4 text-sm ${workspaceSecondary(isDark)}`}
            >
              Reset filters
            </button>
          </div>
        )}

        <section
          className={`mt-5 overflow-hidden rounded-2xl border ${workspaceSurface(isDark)}`}
        >
          {view === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead
                  className={`text-sm ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#F9F6EF] text-[#8E7149]"}`}
                >
                  <tr>
                    <th className="px-5 py-5 font-medium">Shoot ID</th>
                    <th className="px-3 py-5 font-medium">Project Name</th>
                    <th className="px-3 py-5 font-medium">Service</th>
                    <th className="px-3 py-5 font-medium">
                      {role === "internal"
                        ? "Editing Status"
                        : "Agreement Status"}
                    </th>
                    <th className="px-3 py-5 font-medium">Producer</th>
                    <th className="px-3 py-5 font-medium">CP</th>
                    <th className="px-5 py-5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageShoots.map((shoot) => (
                    <WorkspaceItem
                      key={shoot.id}
                      shoot={shoot}
                      role={role}
                      isDark={isDark}
                      view="list"
                      hydrated={mounted}
                    />
                  ))}
                  {!pageShoots.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className={`px-5 py-12 text-center text-sm ${workspaceMuted(isDark)}`}
                      >
                        No shoots match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {pageShoots.map((shoot) => (
                <WorkspaceItem
                  key={shoot.id}
                  shoot={shoot}
                  role={role}
                  isDark={isDark}
                  view="grid"
                  hydrated={mounted}
                />
              ))}
              {!pageShoots.length && (
                <p
                  className={`col-span-full py-10 text-center text-sm ${workspaceMuted(isDark)}`}
                >
                  No shoots match your filters.
                </p>
              )}
            </div>
          )}
          <div
            className={`flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4 text-sm ${isDark ? "border-[#292929]" : "border-[#EAEAEA]"}`}
          >
            <span>
              Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg p-2 disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, currentPage - 3), currentPage + 2)
                .map((number) => (
                  <button
                    type="button"
                    key={number}
                    aria-label={`Page ${number}`}
                    onClick={() => setPage(number)}
                    className={`h-10 min-w-10 rounded-lg border text-sm ${
                      currentPage === number
                        ? isDark
                          ? "border-[#C4A875] text-[#E8D1AB]"
                          : "border-[#BDA57A] text-[#614A2B]"
                        : "border-transparent text-[#777777]"
                    }`}
                  >
                    {number}
                  </button>
                ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg p-2 disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
        <p className={`mt-4 text-xs ${workspaceMuted(isDark)}`}>
          Static workspace preview only. Changes stay in this browser tab; no
          email, payment, file upload, or agreement is sent.
        </p>
      </main>
    </>
  );
}
