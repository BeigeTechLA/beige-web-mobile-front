"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";
import EditorAvatar from "./EditorAvatar";
import {
  combinePostProductionEditors,
  type CombinedEditor,
} from "./combinedPostProductionEditors";
import { normalizeAssignedEditors } from "./postProductionEditorUtils";
import {
  formatUSD,
  removeDemoAssignment,
  useDemoEditorAssignments,
} from "./postProductionDemoStore";

interface Props {
  projectId: string;
  assignedMembers?: unknown[];
  isDark: boolean;
  projectName?: string;
  shootLabel?: string;
  onMembersChanged?: () => void | Promise<void>;
  onRequestAssignment?: (continueAction: () => void) => void;
}

const statusStyle = (status: string) =>
  status.toLowerCase() === "pending"
    ? "bg-[#FFF5CE] text-[#A56A00]"
    : status.toLowerCase() === "accepted"
      ? "bg-[#CBF8E0] text-[#16794B]"
      : status.toLowerCase() === "rejected"
        ? "bg-[#FFD8DB] text-[#D9404B]"
        : "bg-[#DCE8FF] text-[#315DB0]";

export default function EditorAssignmentTable({
  projectId,
  assignedMembers,
  isDark,
  projectName,
  shootLabel,
}: Props) {
  const router = useRouter();
  const { canEdit } = usePermissions("shoots");
  const assignments = useDemoEditorAssignments(projectId);
  const apiEditors = useMemo(
    () => normalizeAssignedEditors(assignedMembers),
    [assignedMembers],
  );
  const rows = useMemo(
    () => combinePostProductionEditors(apiEditors, assignments),
    [apiEditors, assignments],
  );
  const [filter, setFilter] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [changeEditor, setChangeEditor] = useState<CombinedEditor | null>(null);
  const [removeEditor, setRemoveEditor] = useState<CombinedEditor | null>(null);

  const filtered = rows.filter(
    (item) =>
      filter === "all" ||
      (item.assignmentStatus || "Assigned").toLowerCase() === filter,
  );
  const menuBg = isDark
    ? "border-[#383838] bg-[#1A1A1A] text-white"
    : "border-[#E5E5E5] bg-white text-[#171717]";
  const secondary = isDark
    ? "bg-[#202020] text-white hover:bg-[#303030]"
    : "bg-[#F0F0F0] text-black hover:bg-[#E3E3E3]";

  const startChange = (editor: CombinedEditor) => {
    setMenuId(null);
    if (editor.source !== "preview") {
      toast.error("The static demo cannot change an API-backed assignment.");
      return;
    }
    setChangeEditor(editor);
  };

  const openAgreement = (editor: CombinedEditor) => {
    setMenuId(null);
    if (editor.source !== "preview" || editor.category !== "external") return;
    const params = new URLSearchParams({
      editor: String(editor.id),
      project: projectName || "this shoot",
    });
    if (editor.demoAssignment?.agreementStatus === "pending")
      params.set("view", "review");
    router.push(
      `/admin/shoots/${encodeURIComponent(projectId)}/post-production-agreement?${params}`,
    );
  };

  const remove = () => {
    if (!removeEditor || !canEdit) return;
    if (removeEditor.source === "preview") {
      removeDemoAssignment(projectId, removeEditor.id);
      toast.success("Demo editor removed from this shoot.");
    }
    setRemoveEditor(null);
  };

  return (
    <section
      className={`w-full border-t ${isDark ? "border-[#313131] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 ${isDark ? "border-[#292929]" : "border-[#EAEAEA]"}`}
      >
        <h3 className="text-sm font-semibold sm:text-base">
          Editor Assignment
        </h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            className={`h-9 w-[132px] rounded-lg px-3 text-xs ${isDark ? "border-[#333333] bg-[#202020] text-white" : "border-[#E5E5E5] bg-[#F8F8F8] text-black"}`}
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent
            className={
              isDark
                ? "border-[#333333] bg-[#171717] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }
          >
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </header>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[670px] border-collapse text-left text-xs sm:text-sm">
          <thead
            className={
              isDark
                ? "bg-[#191919] text-[#E8D1AB]"
                : "bg-[#F7F4ED] text-[#7C633F]"
            }
          >
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Editor Name</th>
              <th className="px-3 py-3 font-medium">Agreement Type</th>
              <th className="px-3 py-3 font-medium">Version</th>
              <th className="px-3 py-3 font-medium">Compensation</th>
              <th className="px-3 py-3 font-medium">Agreement Status</th>
              <th className="px-3 py-3 text-right font-medium sm:pr-5">
                Action
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? "text-[#E5E5E5]" : "text-[#2A2A2A]"}>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-[#777777]"
                >
                  {rows.length
                    ? "No editor assignments match this status."
                    : "No editors assigned yet."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const state = item.assignmentStatus || "Assigned";
                const live = item.source === "api";
                return (
                  <tr
                    key={`${item.source}-${item.id}`}
                    className={`border-t ${isDark ? "border-[#222222]" : "border-[#EEEEEE]"}`}
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <EditorAvatar
                          name={item.name}
                          avatarUrl={item.avatarUrl}
                          className="h-10 w-10"
                          rounded="rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-medium">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#888888]">
                            {item.category === "internal"
                              ? "Internal Editor"
                              : item.category === "external"
                                ? "External Editor"
                                : item.role}{" "}
                            {live ? "· API" : "· Demo"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{item.agreementType || "—"}</td>
                    <td className="px-3 py-3">
                      {item.agreementVersion || "—"}
                    </td>
                    <td className="px-3 py-3">
                      {item.compensation === undefined ||
                      item.compensation === null
                        ? "—"
                        : typeof item.compensation === "number"
                          ? formatUSD(item.compensation)
                          : item.compensation}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(state)}`}
                      >
                        {state}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right sm:pr-5">
                      {live ? (
                        <span
                          className="text-xs text-[#777777]"
                          title="API-backed record; unaffected by the demo"
                        >
                          Read only
                        </span>
                      ) : (
                        <Popover
                          open={menuId === `${item.source}-${item.id}`}
                          onOpenChange={(open: boolean) =>
                            setMenuId(open ? `${item.source}-${item.id}` : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for ${item.name}`}
                              className={`rounded-md p-2 ${isDark ? "hover:bg-[#292929]" : "hover:bg-[#F2F2F2]"}`}
                            >
                              <MoreVertical size={18} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            sideOffset={5}
                            className={`z-[80] w-56 rounded-xl border p-1.5 shadow-xl ${menuBg}`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setMenuId(null);
                                router.push(
                                  `/admin/shoots/editor-workspace/${encodeURIComponent(projectId)}?role=${item.category === "external" ? "external" : "internal"}&editorId=${item.id}`,
                                );
                              }}
                              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
                            >
                              Open Editor Workspace (Demo)
                            </button>
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => startChange(item)}
                              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10 disabled:opacity-40"
                            >
                              Change Editor
                            </button>
                            {item.category === "external" && (
                              <button
                                type="button"
                                onClick={() =>
                                  item.demoAssignment?.compensation
                                    ? openAgreement(item)
                                    : startChange(item)
                                }
                                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10"
                              >
                                {item.demoAssignment?.agreementStatus ===
                                "pending"
                                  ? "View Agreement"
                                  : item.demoAssignment?.compensation
                                    ? "Add Shoot Agreement"
                                    : "Complete Compensation & Agreement"}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => {
                                setMenuId(null);
                                setRemoveEditor(item);
                              }}
                              className="w-full rounded-md px-3 py-2 text-left text-sm text-[#EF6D72] hover:bg-red-500/10 disabled:opacity-40"
                            >
                              Remove Editor
                            </button>
                          </PopoverContent>
                        </Popover>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddPostProductionTeamModal
        isOpen={changeEditor !== null}
        projectId={projectId}
        isDark={isDark}
        mode="change"
        replaceMemberId={changeEditor?.id}
        assignedMemberIds={rows.map((row) => row.id)}
        projectName={projectName}
        shootLabel={shootLabel}
        onClose={() => setChangeEditor(null)}
      />

      <Dialog
        open={removeEditor !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setRemoveEditor(null);
        }}
      >
        <DialogContent
          className={`z-[130] flex max-h-[calc(100dvh_-_24px)] w-[calc(100vw_-_24px)] max-w-[450px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#3A3A3A] bg-black text-white" : "border-[#E5E5E5] bg-white text-black"}`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#331B1D] text-[#F07979]">
                <AlertCircle size={20} />
              </span>
              <DialogTitle className="text-xl font-medium">
                Remove Editor?
              </DialogTitle>
            </div>
            <DialogDescription className="mt-4 text-sm leading-6 text-[#999999]">
              Remove{" "}
              <span className="font-medium text-[#E8D1AB]">
                {removeEditor?.name}
              </span>{" "}
              from this shoot?
            </DialogDescription>
            <p className="mt-2 text-sm leading-6 text-[#999999]">
              Only the local demo assignment is removed. No notification will be
              sent.
            </p>
          </div>
          <footer className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-6">
            <Button
              type="button"
              onClick={() => setRemoveEditor(null)}
              className={`h-11 rounded-lg ${secondary}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={remove}
              className="h-11 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D9C39F]"
            >
              Remove
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </section>
  );
}
