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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0B0B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#E5D5B8]/15 p-3 text-[#E5D5B8]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Manage Participants</h2>
              <p className="mt-1 text-sm text-white/50">Add or review team members in this conversation.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/60 transition hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 px-6">
          <div className={`grid ${canManage ? "grid-cols-2" : "grid-cols-1"}`}>
            {canManage ? (
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`border-b-2 px-4 py-4 text-sm font-medium ${
                  activeTab === "add" ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-transparent text-white/50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "current" ? "border-[#E5D5B8] text-[#E5D5B8]" : "border-transparent text-white/50"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current ({currentParticipants.length})
              </span>
            </button>
          </div>
        </div>

        <div className="p-6">
              {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : activeTab === "current" || !canManage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111]">
                {currentParticipants.length ? (
                  <div className="max-h-[360px] divide-y divide-white/10 overflow-y-auto">
                    {currentParticipants.map((member) => {
                      const isCurrentUser = currentUserId != null && String(member.id || "") === String(currentUserId);
                      return (
                      <div key={`current-${member.role}-${member.id}`} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          {resolveImage(member) ? (
                            <img
                              src={resolveImage(member) || ""}
                              alt={member.name || "Participant"}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5D5B8]/20 text-sm font-semibold text-[#E5D5B8]">
                              {getInitials(member.name || member.email)}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-medium text-white">{member.name || member.email || member.id}</p>
                            <p className="mt-1 text-sm text-white/45">
                              {member.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
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
                  <div className="px-4 py-10 text-center text-sm text-white/45">No current participants found.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-medium text-white">Select Role</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddRole("cp")}
                    className={`rounded-2xl border p-4 text-left ${
                      addRole === "cp" ? "border-[#E5D5B8] bg-[#1B1812]" : "border-white/10 bg-[#111]"
                    }`}
                  >
                    <p className="text-lg text-white">Creative Partner</p>
                    <p className="mt-1 text-sm text-white/50">Photographers, videographers, editors</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("staff")}
                    className={`rounded-2xl border p-4 text-left ${
                      addRole === "staff" ? "border-[#E5D5B8] bg-[#1B1812]" : "border-white/10 bg-[#111]"
                    }`}
                  >
                    <p className="text-lg text-white">Staff / Client</p>
                    <p className="mt-1 text-sm text-white/50">Admin, sales rep, client, production team</p>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#111] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111]">
                <div className="max-h-[320px] overflow-y-auto">
                  {filteredCandidates.length ? (
                    filteredCandidates.map((member) => {
                      const memberId = String(member.id);
                      const selected = selectedIds.includes(memberId);
                      const alreadyAdded = Boolean(member.alreadyAdded);
                      return (
                        <label
                          key={`${member.source}-${member.role}-${memberId}`}
                          className={`flex items-center justify-between border-b border-white/10 px-4 py-4 last:border-b-0 ${
                            alreadyAdded ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {resolveImage(member) ? (
                              <img
                                src={resolveImage(member) || ""}
                                alt={member.name || "Participant"}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5D5B8]/20 text-sm font-semibold text-[#E5D5B8]">
                                {getInitials(member.name || member.email || memberId)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-medium text-white">{member.name || member.email || memberId}</p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                              <p className="text-sm text-white/45">
                                {member.email || member.subtitle || getRoleLabel(member.role)}
                              </p>
                            </div>
                          </div>
                          {alreadyAdded ? (
                            <span className="rounded-full border border-[#E5D5B8]/25 bg-[#E5D5B8]/10 px-3 py-1 text-[11px] font-medium text-[#E5D5B8]">
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
                              className="h-6 w-6 accent-[#E5D5B8]"
                            />
                          )}
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

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-base font-medium text-white"
            >
              Cancel
            </button>
            {activeTab === "add" ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !selectedIds.length}
                className="flex-1 rounded-2xl bg-[#E5D5B8] px-4 py-4 text-base font-semibold text-black disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add to Conversation"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
