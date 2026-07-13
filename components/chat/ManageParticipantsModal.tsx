"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2, UserRoundPlus, Users, X } from "lucide-react";
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
    <div className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-white/80"}`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div className={`relative w-full lg:max-w-[616px] overflow-hidden rounded-t-2xl lg:rounded-2xl border shadow-2xl transition-colors duration-200 flex flex-col max-h-[90vh] lg:max-h-[92vh] ${isDark ? "border-white/40 bg-black" : "border-white/40 bg-white"}`}>

        {/* Mobile Swipe / Drag Indicator Bar */}
        <div className="w-12 h-1 bg-zinc-600/40 rounded-full mx-auto my-2 shrink-0 lg:hidden" />

        {/* Header Section */}
        <div className={`flex items-center justify-between border-b p-4 lg:px-6 lg:py-5 border-[#CACACA]`}>
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            {/* <div className={`rounded-full p-2.5 lg:p-3 shrink-0 ${isDark ? "bg-[#E8D1AB]/15 text-[#E8D1AB]" : "bg-zinc-100 text-black"}`}>
              <Users className="h-4 w-4 lg:h-5 lg:w-5" />
            </div> */}
            <div className="min-w-0">
              <h2 className={`text-xl lg:text-3xl font-bold truncate ${isDark ? "text-white" : "text-black"}`}>
                Manage Participants
              </h2>
              <p className={`mt-1 text-xs lg:text-sm truncate ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                Add or review team members in this conversation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-2 lg:p-3.5 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white/60 hover:bg-[#2B2626]/75" : "bg-[#F0F0F0] text-zinc-400 hover:bg-[#F0F0F0]/70"}`}
          >
            <X className="h-4 w-4 lg:h-7 lg:w-7" />
          </button>
        </div>

        {/* Tab Actions */}
        <div className={`border-b px-4 lg:px-7 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <div className={`grid ${canManage ? "grid-cols-2" : "grid-cols-1"}`}>
            {canManage ? (
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`border-b-2 p-4 transition-colors ${activeTab === "add"
                  ? isDark ? "border-[#E8D1AB] text-[#E8D1AB]" : "border-black text-black"
                  : "border-transparent text-zinc-400"
                  }`}
              >
                <span className="inline-flex items-center justify-center gap-2 w-full text-sm font-medium">
                  <UserRoundPlus className="h-4 w-4 lg:h-6 lg:w-6" />
                  Add New User
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`border-b-2 p-4 transition-colors ${activeTab === "current"
                ? isDark ? "border-[#E8D1AB] text-[#E8D1AB]" : "border-black text-black"
                : "border-transparent text-zinc-400"
                }`}
            >
              <span className="inline-flex items-center justify-center gap-2 w-full text-sm font-medium">
                <Users className="h-4 w-4 lg:h-6 lg:w-6" />
                Current ({currentParticipants.length})
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-7 overflow-y-auto no-scrollbar flex-1 min-h-0">
          {loading ? (
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : activeTab === "current" || !canManage ? (
            <div className="space-y-4">
              <div className={`rounded-lg lg:rounded-xl border overflow-hidden ${isDark ? "border-white/20 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
                {currentParticipants.length ? (
                  <div className={`max-h-[320px] lg:max-h-[360px] divide-y overflow-y-auto ${isDark ? "divide-white/10" : "divide-zinc-200"}`}>
                    {currentParticipants.map((member) => {
                      const isCurrentUser = currentUserId != null && String(member.id || "") === String(currentUserId);
                      return (
                        <div key={`current-${member.role}-${member.id}`} className="flex gap-3 items-center justify-between p-3 lg:px-5 lg:py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-10 w-10 lg:h-15 lg:w-15 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className={`flex h-10 w-10 lg:h-15 lg:w-15 shrink-0 items-center justify-center rounded-full text-sm lg:text-lg font-semibold ${isDark ? "bg-[#E8D1AB]/20 text-[#E8D1AB]" : "bg-zinc-100 text-zinc-700"}`}>
                                {getInitials(member.name || member.email)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className={`text-sm lg:text-base font-semibold truncate max-w-[140px] lg:max-w-none ${isDark ? "text-white" : "text-black"}`}>
                                  {member.name || member.email || member.id}
                                </p>
                                <span className={`rounded-full border px-2.5 py-0.5 text-[9px] lg:text-[10px] font-medium ${isDark ? "border-white/10 bg-white/5 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                              <p className={`text-xs lg:text-sm truncate break-all ${isDark ? "text-white/45" : "text-zinc-400"}`}>
                                {member.email || "No email"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 lg:gap-3 shrink-0">
                            {canManage && member.role !== "client" && !isCurrentUser ? (
                              <button
                                type="button"
                                onClick={() => removeParticipant(member)}
                                disabled={removingId === String(member.id)}
                                className={`rounded-full p-3 text-[#FF6467] transition hover:bg-red-500/20 disabled:opacity-60 lg:h-12 lg:w-12 ${isDark ? "bg-[#323232]" : "bg-[#F0F0F0]"}`}
                                title="Remove participant"
                              >
                                {removingId === String(member.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 lg:h-6 lg:w-6" />
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
                <p className={`mb-2 text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-zinc-700"}`}>
                  Select Role
                </p>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 border rounded-xl p-2 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F0F0F0] border-[#E5E5E5]"}`}>
                  <button
                    type="button"
                    onClick={() => setAddRole("cp")}
                    className={`rounded-md p-3 lg:px-5 lg:py-2.5 text-center border transition-all ${addRole === "cp"
                      ? isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/20" : " border-[#E5E5E5] bg-zinc-50"
                      : isDark ? "border-[#171717] bg-[#171717]" : "border-[#F0F0F0] bg-[#F0F0F0]"
                      }`}
                  >
                    <p className={`text-xs lg:text-sm font-semibold ${isDark ? "text-[#C4C4C4]" : "text-black"}`}>Creative Partner</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>Photographers, videographers, editors</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("staff")}
                    className={`rounded-md p-3 lg:px-5 lg:py-2.5 text-center border transition-all ${addRole === "staff"
                      ? isDark ? "border border-[#E8D1AB] bg-[#E8D1AB]/20" : "border border-[#E5E5E5] bg-zinc-50 "
                      : isDark ? "border-[#171717] bg-[#171717]" : "border-[#F0F0F0] bg-[#F0F0F0]"
                      }`}
                  >
                    <p className={`text-xs lg:text-sm font-semibold ${isDark ? "text-[#C4C4C4]" : "text-black"}`}>Staff / Client</p>
                    <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>Admin, sales rep, client, production team</p>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className={`absolute left-4 top-1/2 h-4 w-4 lg:h-6 lg:w-6 -translate-y-1/2 ${isDark ? "text-[#727272]" : "text-zinc-400"}`} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className={`h-11 lg:h-12 w-full rounded-lg lg:rounded-xl border pl-12 pr-4 text-sm lg:text-base outline-none transition-colors
                ${isDark
                      ? "border-white/20 bg-[#171717] text-white placeholder:text-[#727272] focus:border-white/20"
                      : "border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:border-zinc-400"
                    }`}
                />
              </div>

              <div className={`rounded-lg lg:rounded-xl border overflow-hidden ${isDark ? "border-white/20 bg-[#171717]" : "border-zinc-200 bg-white"}`}>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-transparent">
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
                        ${alreadyAdded ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-12 w-12 lg:h-15 lg:w-15 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className={`flex h-12 w-12 lg:h-15 lg:w-15 shrink-0 items-center justify-center rounded-full text-sm lg:text-lg font-semibold ${isDark ? "bg-[#E8D1AB]/20 text-[#E8D1AB]" : "bg-zinc-100 text-zinc-700"}`}>
                                {getInitials(member.name || member.email || memberId)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className={`text-sm lg:text-base font-semibold truncate max-w-[140px] lg:max-w-none ${isDark ? "text-white" : "text-black"}`}>
                                  {member.name || member.email || memberId}
                                </p>
                                <span className={`rounded-full border px-2.5 py-0.5 text-[9px] lg:text-[10px] font-medium ${isDark ? "border-white/10 bg-white/5 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
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
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium border-[#E8D1AB] bg-[#E8D1AB] text-black`}>
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
                                className={`h-5 w-5 lg:h-6 lg:w-6 rounded-md transition-transform active:scale-90 ${isDark ? "border-[#DDDDDD80] bg-[#171717] accent-[#E8D1AB]" : "accent-black"}`}
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
        <div className={`p-4 lg:p-6 lg:pt-0 mt-auto flex gap-2.5 lg:gap-3 shrink-0`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-lg border p-3 lg:h-12 text-sm font-medium transition-all ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1F1F1F]/80" : "border-[#f0f0f0] bg-[#f0f0f0] text-zinc-700 hover:bg-zinc-100"}`}
          >
            Cancel
          </button>
          {activeTab === "add" ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !selectedIds.length}
              className={`flex-1 rounded-lg p-3 lg:h-12 text-sm font-medium transition-all disabled:opacity-40 disabled:pointer-events-none bg-[#E8D1AB] text-black hover:bg-[#d4c2a1]`}
            >
              {submitting ? "Adding..." : "Add to Conversation"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
