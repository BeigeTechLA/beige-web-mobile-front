"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2, UserPlus, UserRoundPlus, Users, X } from "lucide-react";
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

  const roleOptions = [
    {
      value: "cp",
      title: "Creative Partners",
      description: "Photographers, Videographers, Editors",
    },
    {
      value: "staff",
      title: "Staff / Client",
      description: "Admin, Sales Rep, Client, Production Team",
    },
  ] as const;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-white/80"}`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-200 flex flex-col max-h-[90vh]
      ${isDark ? "border-white/10 bg-[#0B0B0B]" : "border-zinc-200 bg-white"}`}
      >
        {/* Header Section */}
        <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <div>
            <h2 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Manage Participants
            </h2>
            <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>
              Admins can include any member, even if they are not linked to the shoot.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-2 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"}`}
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Tab Actions */}
        <div className={`border-b px-6 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
          <div className="grid grid-cols-2 gap-0">
            {canManage ? (
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`flex items-center justify-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${activeTab === "add"
                  ? "border-[#E8D1AB] text-[#E8D1AB]"
                  : "border-transparent text-zinc-400 hover:text-zinc-300"
                  }`}
              >
                <UserRoundPlus className="h-6 w-6" />
                Add New User
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`flex items-center justify-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${activeTab === "current"
                ? "border-[#E8D1AB] text-[#E8D1AB]"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
                }`}
            >
              <Users className="h-6 w-6" />
              Current ({currentParticipants.length})
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className={`flex items-center justify-center py-10 ${isDark ? "text-white/60" : "text-zinc-500"}`}>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm">Loading members...</span>
            </div>
          ) : activeTab === "current" || !canManage ? (
            <div className="space-y-0 rounded-xl border-[0.5px] border-white/20 bg-[#171717] overflow-hidden">
              {currentParticipants.length ? (
                <div className="max-h-[400px] overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-track-[#0f0f0f] scrollbar-thumb-[#333] divide-y divide-white/20">
                  {currentParticipants.map((member) => {
                    const isCurrentUser = currentUserId != null && String(member.id || "") === String(currentUserId);
                    return (
                      <div key={`current-${member.role}-${member.id}`} className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {resolveImage(member) ? (
                            <img
                              src={resolveImage(member) || ""}
                              alt={member.name || "Participant"}
                              className="h-11 w-11 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-sm font-semibold text-[#222]">
                              {getInitials(member.name || member.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {member.name || member.email || member.id}
                              </p>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                                {getRoleLabel(member.role)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-white/50">
                              {member.email || "No email"}
                            </p>
                          </div>
                        </div>

                        {canManage && member.role !== "client" && !isCurrentUser ? (
                          <button
                            type="button"
                            onClick={() => removeParticipant(member)}
                            disabled={removingId === String(member.id)}
                            className="rounded-full bg-[#323232] p-3 text-white/40 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                            title="Remove participant"
                          >
                            {removingId === String(member.id) ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Trash2 className="h-6 w-6 text-[#FF6467]" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-white/45">
                  No current participants found.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-medium text-white">
                  Select Roles
                </p>
                <div className={`rounded-xl border-[0.5px] p-1.5 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setAddRole("cp")}
                      className={`rounded-md border p-2.5 text-center transition-all ${addRole === "cp" ? "border-[#E8D1AB] bg-[#E8D1AB]/20" : "border-transparent bg-transparent"}`}
                    >
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                        Creative Partners
                      </p>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                        Photographers, Videographers, Editors
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddRole("staff")}
                      className={`rounded-md border p-2.5 text-center transition-all ${addRole === "staff" ? "border-[#E8D1AB] bg-[#E8D1AB]/20" : "border-transparent bg-transparent"}`}
                    >
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                        Staff / Client
                      </p>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                        Admin, Sales Rep, Client, Production Team
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email.."
                  className="h-12 w-full rounded-xl border-[0.5px] border-white/20 bg-[#171717] pl-12 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
                />
              </div>

              {/* Members List */}
              <div className="rounded-xl border-[0.5px] border-white/20 bg-[#171717] overflow-hidden">
                <div className="max-h-[320px] overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-track-[#0f0f0f] scrollbar-thumb-[#333] divide-y divide-white/20">
                  {filteredCandidates.length ? (
                    filteredCandidates.map((member) => {
                      const memberId = String(member.id);
                      const selected = selectedIds.includes(memberId);
                      const alreadyAdded = Boolean(member.alreadyAdded);
                      return (
                        <label
                          key={`${member.source}-${member.role}-${memberId}`}
                          className={`flex items-center justify-between px-4 py-3.5 transition-colors ${alreadyAdded ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-white/[0.02]"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-11 w-11 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-sm font-semibold text-[#222]">
                                {getInitials(member.name || member.email || memberId)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-white">
                                  {member.name || member.email || memberId}
                                </p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-white/50">
                                {member.email || getRoleLabel(member.role)}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {alreadyAdded ? (
                              <span className="rounded-full border border-[#E5D5B8]/25 bg-[#E5D5B8]/10 px-3 py-1 text-xs font-medium text-[#E5D5B8]">
                                Added
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
                                className="h-5 w-5 rounded border border-white/20 bg-transparent accent-[#E5D5B8] checked:bg-[#E5D5B8]"
                              />
                            )}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-white/45">
                      No available members match this search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className={`flex justify-center gap-3 px-6 p-4`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-lg border py-3.5 text-sm font-medium transition-all active:scale-[0.99]
          ${isDark ? "border-white/10 bg-[#171717] text-white/70 hover:bg-white/5" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
          >
            Cancel
          </button>
          {activeTab === "add" && canManage ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !selectedIds.length}
              className="w-full rounded-lg bg-[#E5D5B8] py-3.5 text-sm font-semibold text-black transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#d4c19f]"
            >
              {submitting ? "Adding..." : "Add to Conversation"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}