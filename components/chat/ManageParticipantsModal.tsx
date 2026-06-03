"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { externalChatApi, type ExternalChatRoom, type ExternalChatUser } from "@/lib/externalChatApi";

interface ManageParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomSnapshot?: ExternalChatRoom | null;
  existingParticipantIds?: string[];
  onAdded?: () => void;
  defaultTab?: ModalTab;
  canManage?: boolean;
  currentUserId?: string | null;
  isDark?: boolean;
}

type ModalTab = "add" | "current";
type AddRole = "cp" | "staff";
const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

const getRoleLabel = (role?: string) => {
  if (role === "cp") return "Creative Partner";
  if (role === "client") return "Client";
  if (role === "sales_rep") return "Sales Rep";
  if (role === "admin") return "Admin";
  if (role === "manager") return "Admin/Manager";
  if (role === "production") return "Production";
  if (role === "pm") return "Project Manager";
  return "Member";
};

const resolveImage = (member?: ExternalChatUser | null) => {
  const value = member?.profileImage;
  if (!value) return null;
  return String(value).startsWith("http") ? String(value) : `${S3_PREFIX}${value}`;
};

const getInitials = (value?: string | null) =>
  String(value || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getReadableName = (item: { id?: string | number; name?: string | null; email?: string | null }) => {
  const id = String(item?.id || "").trim();
  const name = String(item?.name || "").trim();
  const email = String(item?.email || "").trim();

  if (name && name.toLowerCase() !== "participant" && name !== id) return name;
  if (email) return email;
  return id || "Participant";
};

const isBogusValue = (value?: string | number | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "[object object]" || normalized.startsWith("{") || normalized === "undefined" || normalized === "null";
};

const normalizeCurrentParticipants = (data: any) => {
  const items = [
    ...(data?.managers || []),
    ...(data?.cps || []),
    ...(data?.production || []),
    ...(data?.pm ? [data.pm] : []),
    ...(data?.client ? [data.client] : []),
  ];

  const seen = new Set<string>();
  return items
    .map((item) => {
      const normalized = {
        id: String(item?.id || ""),
        email: item?.email || null,
        role: item?.role || "member",
        profileImage: item?.profileImage || null,
        subtitle: item?.subtitle || null,
      };

      return {
        ...normalized,
        name: getReadableName({ id: normalized.id, name: item?.name, email: normalized.email }),
      };
    })
    .filter((item) => {
      if ((isBogusValue(item.id) && isBogusValue(item.email) && isBogusValue(item.name)) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
};

const normalizeSnapshotParticipants = (room?: ExternalChatRoom | null) => {
  if (!room) return [];

  const items = [
    ...(room.manager_ids || []),
    ...(room.cp_ids || []),
    ...(room.production_ids || []),
    ...(room.pm_id ? [room.pm_id] : []),
    ...(room.client_snapshot ? [room.client_snapshot] : []),
    ...(room.client_id ? [room.client_id] : []),
  ];

  const seen = new Set<string>();
  return items
    .map((item: any) => {
      const normalized = {
        id: String(item?.id || item || ""),
        email: item?.email || null,
        role: item?.role || "member",
        profileImage: item?.profileImage || null,
      };

      return {
        ...normalized,
        name: getReadableName({ id: normalized.id, name: item?.name, email: normalized.email }),
      };
    })
    .filter((item) => {
      if ((isBogusValue(item.id) && isBogusValue(item.email) && isBogusValue(item.name)) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
};

export default function ManageParticipantsModal({
  isOpen,
  onClose,
  roomId,
  roomSnapshot,
  existingParticipantIds = [],
  onAdded,
  defaultTab = "add",
  canManage = false,
  currentUserId = null,
  isDark = true,
}: ManageParticipantsModalProps) {
  const [directory, setDirectory] = useState<{
    staff?: ExternalChatUser[];
    clients?: ExternalChatUser[];
    creativePartners?: ExternalChatUser[];
  }>({});
  const [currentParticipants, setCurrentParticipants] = useState<ExternalChatUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("add");
  const [addRole, setAddRole] = useState<AddRole>("cp");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentParticipantIdSet = useMemo(() => {
    const allIds = [...existingParticipantIds, ...currentParticipants.map((member) => String(member.id || ""))];
    return new Set(allIds.filter(Boolean));
  }, [currentParticipants, existingParticipantIds]);

  const candidates = useMemo(() => {
    const staffMembers = [...(directory.staff || []), ...(directory.clients || [])];
    const cpMembers = directory.creativePartners || [];

    return (addRole === "cp" ? cpMembers : staffMembers).map((member) => ({
      ...member,
      alreadyAdded: currentParticipantIdSet.has(String(member.id || "")),
    }));
  }, [addRole, currentParticipantIdSet, directory]);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return candidates;
    return candidates.filter((member) =>
      [member.name, member.email, member.role, member.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [candidates, search]);

  const loadParticipants = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const [directoryResponse, participantResponse] = await Promise.all([
        externalChatApi.getDirectory(),
        externalChatApi.getParticipants(roomId),
      ]);
      setDirectory(directoryResponse);
      const mergedParticipants = [
        ...normalizeCurrentParticipants(participantResponse),
        ...normalizeSnapshotParticipants(roomSnapshot),
      ];
      const seen = new Set<string>();
      setCurrentParticipants(
        mergedParticipants.filter((member) => {
          const id = String(member.id || "");
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !roomId) return;
    setSelectedIds([]);
    setSearch("");
    setActiveTab(defaultTab);
    setAddRole("cp");
  }, [isOpen, roomId, defaultTab]);

  useEffect(() => {
    if (!isOpen || !roomId) return;
    loadParticipants();
  }, [isOpen, roomId]);

  const submit = async () => {
    if (!roomId) {
      toast.error("Room details are missing");
      return;
    }

    const participants = candidates.filter((member) => selectedIds.includes(String(member.id)) && !member.alreadyAdded);
    if (!participants.length) {
      toast.error("Select at least one member");
      return;
    }

    setSubmitting(true);
    try {
      await externalChatApi.addParticipants(
        roomId,
        participants.map((member) => ({
          ...member,
          role:
            member.role === "client"
              ? "client"
              : member.role === "cp"
                ? "cp"
                : member.role === "production"
                  ? "production"
                  : member.role === "admin"
                    ? "admin"
                    : member.role === "sales_rep"
                      ? "sales_rep"
                      : "manager",
        }))
      );
      toast.success("Participants added");
      onAdded?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  const removeParticipant = async (member: ExternalChatUser) => {
    if (!roomId || !member?.id || !canManage) return;
    if (member.role === "client") {
      toast.error("Client cannot be removed");
      return;
    }

    setRemovingId(String(member.id));
    try {
      await externalChatApi.removeParticipant(roomId, String(member.id), String(member.role || "manager"));
      toast.success("Participant removed");
      await loadParticipants();
      onAdded?.();
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove participant");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-4 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-white/80"}`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl lg:rounded-[28px] border shadow-2xl transition-colors duration-200 flex flex-col max-h-[92vh]
      ${isDark ? "border-white/10 bg-[#0B0B0B]" : "border-zinc-200 bg-white"}`}
      >
        {/* Header Section */}
        <div className={`flex items-center justify-between border-b p-4 lg:px-6 lg:py-5 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            <div className={`rounded-full p-2.5 lg:p-3 shrink-0 ${isDark ? "bg-[#E5D5B8]/15 text-[#E5D5B8]" : "bg-zinc-100 text-black"}`}>
              <Users className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg lg:text-2xl font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>
                Manage Participants
              </h2>
              <p className={`mt-1 text-xs lg:text-sm truncate ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                Add or review team members in this conversation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-2 shrink-0 transition-colors ${isDark ? "text-white/60 hover:bg-white/5" : "text-zinc-400 hover:bg-zinc-100"}`}
          >
            <X className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </div>

        {/* Tab Actions */}
        <div className={`border-b px-4 lg:px-6 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <div className={`grid ${canManage ? "grid-cols-2" : "grid-cols-1"}`}>
            {canManage ? (
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`border-b-2 p-4 text-xs lg:text-sm font-medium transition-colors ${activeTab === "add"
                  ? isDark ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-black text-black"
                  : "border-transparent text-zinc-400"
                  }`}
              >
                <span className="inline-flex items-center justify-center gap-2 w-full">
                  <UserPlus className="h-4 w-4" />
                  Add New
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`border-b-2 p-4 text-xs lg:text-sm font-medium transition-colors ${activeTab === "current"
                ? isDark ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-black text-black"
                : "border-transparent text-zinc-400"
                }`}
            >
              <span className="inline-flex items-center justify-center gap-2 w-full">
                <Users className="h-4 w-4" />
                Current ({currentParticipants.length})
              </span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : activeTab === "current" || !canManage ? (
            <div className="space-y-4">
              <div className={`rounded-xl lg:rounded-2xl border overflow-hidden ${isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-zinc-50"}`}>
                {currentParticipants.length ? (
                  <div className={`max-h-[260px] lg:max-h-[360px] divide-y overflow-y-auto ${isDark ? "divide-white/10" : "divide-zinc-200"}`}>
                    {currentParticipants.map((member) => {
                      const isCurrentUser = currentUserId != null && String(member.id || "") === String(currentUserId);
                      return (
                        <div key={`current-${member.role}-${member.id}`} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3 lg:px-5 lg:py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-9 w-9 lg:h-11 lg:w-11 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className={`flex h-9 w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-full text-xs lg:text-sm font-semibold ${isDark ? "bg-[#E5D5B8]/20 text-[#E5D5B8]" : "bg-zinc-200 text-zinc-800"}`}>
                                {getInitials(member.name || member.email)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className={`text-sm lg:text-base font-medium truncate ${isDark ? "text-white" : "text-black"}`}>
                                {member.name || member.email || member.id}
                              </p>
                              <p className={`text-xs lg:text-sm truncate break-all ${isDark ? "text-white/45" : "text-zinc-500"}`}>
                                {member.email || "No email"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 lg:gap-3 shrink-0">
                            <span className={`rounded-full border px-2.5 py-0.5 lg:px-3 lg:py-1 text-[10px] lg:text-xs font-medium ${isDark ? "border-white/10 bg-white/5 text-white/60" : "border-zinc-300 bg-white text-zinc-600"}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            {canManage && member.role !== "client" && !isCurrentUser ? (
                              <button
                                type="button"
                                onClick={() => removeParticipant(member)}
                                disabled={removingId === String(member.id)}
                                className="rounded-full border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                                title="Remove participant"
                              >
                                {removingId === String(member.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`px-4 py-10 text-center text-xs lg:text-sm ${isDark ? "text-white/45" : "text-zinc-400"}`}>
                    No current participants found.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className={`mb-2 text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-zinc-700"}`}>
                  Select Role
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
                  <button
                    type="button"
                    onClick={() => setAddRole("cp")}
                    className={`rounded-xl lg:rounded-2xl border p-3 lg:p-4 text-left transition-all ${addRole === "cp"
                      ? isDark ? "border-[#E5D5B8] bg-[#1B1812]" : "border-black bg-zinc-50 ring-1 ring-black"
                      : isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-white"
                      }`}
                  >
                    <p className={`text-sm lg:text-lg ${isDark ? "text-white" : "text-black"}`}>Creative Partner</p>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>Photographers, videographers, editors</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("staff")}
                    className={`rounded-xl lg:rounded-2xl border p-3 lg:p-4 text-left transition-all ${addRole === "staff"
                      ? isDark ? "border-[#E5D5B8] bg-[#1B1812]" : "border-black bg-zinc-50 ring-1 ring-black"
                      : isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-white"
                      }`}
                  >
                    <p className={`text-sm lg:text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Staff / Client</p>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>Admin, sales rep, client, production team</p>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-white/35" : "text-zinc-400"}`} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className={`h-11 lg:h-12 w-full rounded-xl lg:rounded-2xl border pl-10 pr-4 text-xs lg:text-sm outline-none transition-colors
                ${isDark
                      ? "border-white/10 bg-[#111111] text-white placeholder:text-white/30 focus:border-white/20"
                      : "border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:border-zinc-400"
                    }`}
                />
              </div>

              <div className={`rounded-xl lg:rounded-2xl border overflow-hidden ${isDark ? "border-white/10 bg-[#111111]" : "border-zinc-200 bg-white"}`}>
                <div className="max-h-[200px] lg:max-h-[320px] overflow-y-auto divide-y divide-transparent">
                  {filteredCandidates.length ? (
                    filteredCandidates.map((member) => {
                      const memberId = String(member.id);
                      const selected = selectedIds.includes(memberId);
                      const alreadyAdded = Boolean(member.alreadyAdded);
                      return (
                        <label
                          key={`${member.source}-${member.role}-${memberId}`}
                          className={`flex items-center justify-between border-b p-3 lg:p-4 last:border-b-0 transition-colors
                        ${isDark ? "border-white/10" : "border-zinc-100 hover:bg-zinc-50"}
                        ${alreadyAdded ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-9 w-9 lg:h-11 lg:w-11 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className={`flex h-9 w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-full text-xs lg:text-sm font-semibold ${isDark ? "bg-[#E5D5B8]/20 text-[#E5D5B8]" : "bg-zinc-100 text-zinc-700"}`}>
                                {getInitials(member.name || member.email || memberId)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className={`text-xs lg:text-base font-medium truncate max-w-[140px] lg:max-w-none ${isDark ? "text-white" : "text-black"}`}>
                                  {member.name || member.email || memberId}
                                </p>
                                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] lg:text-[10px] font-medium ${isDark ? "border-white/10 bg-white/5 text-white/55" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                              <p className={`text-xs lg:text-sm truncate break-all ${isDark ? "text-white/45" : "text-zinc-400"}`}>
                                {member.email || member.subtitle || getRoleLabel(member.role)}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {alreadyAdded ? (
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${isDark ? "border-[#E5D5B8]/25 bg-[#E5D5B8]/10 text-[#E5D5B8]" : "border-zinc-300 bg-zinc-100 text-zinc-600"}`}>
                                Already Added
                              </span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  setSelectedIds((current) =>
                                    current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
                                  )
                                }
                                className={`h-5 w-5 lg:h-6 lg:w-6 rounded transition-transform active:scale-90 ${isDark ? "accent-[#E5D5B8]" : "accent-black"}`}
                              />
                            )}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className={`px-4 py-8 text-center text-xs lg:text-sm ${isDark ? "text-white/45" : "text-zinc-400"}`}>
                      No available members match this search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className={`p-4 lg:p-6 mt-auto flex gap-2.5 lg:gap-3 border-t ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl lg:rounded-2xl border p-4 text-sm lg:text-base font-medium transition-all active:scale-[0.99]
          ${isDark ? "border-white/10 bg-[#111111] text-white hover:bg-white/5" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
          >
            Cancel
          </button>
          {activeTab === "add" ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !selectedIds.length}
              className={`flex-1 rounded-xl lg:rounded-2xl p-4 text-sm lg:text-base font-semibold transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none
            ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#d4c2a1]" : "bg-black text-white hover:bg-zinc-800"}`}
            >
              {submitting ? "Adding..." : "Add to Conversation"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
