"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { externalChatApi, type ExternalChatRoom, type ExternalChatUser } from "@/lib/externalChatApi";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
import { useAuth } from "@/lib/hooks/useAuth";

interface ConversationComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (room: ExternalChatRoom | null) => void;
}

type Mode = "project" | "direct";

const mapDirectoryRole = (role?: string) => {
  if (role === "client") return "client";
  if (role === "cp") return "cp";
  if (role === "admin") return "admin";
  if (role === "sales_rep") return "sales_rep";
  if (role === "pm") return "pm";
  if (role === "production") return "production";
  return "manager";
};

const toReadableLabel = (value: unknown) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getProjectId = (project: any) =>
  String(project?.stream_project_booking_id || project?.booking_id || project?.project_id || project?.id || "");

const getClientId = (client: any) =>
  String(client?.client_id || client?.user_id || client?.id || "");

const getProjectName = (project: any) => {
  const bookingId = getProjectId(project);
  const eventType = Array.isArray(project?.event_type)
    ? project.event_type[0]
    : String(project?.event_type || "").split(",").map((entry) => entry.trim()).filter(Boolean)[0];

  const candidates = [
    project?.project_name,
    project?.title,
    project?.client_name,
    project?.description,
    eventType ? `${toReadableLabel(eventType)} Shoot` : "",
    bookingId ? `Shoot #${bookingId}` : "",
  ];

  const picked = candidates
    .map((value) => String(value || "").trim())
    .find((value) => value && value.toLowerCase() !== "shoot #");

  return picked || `Shoot #${bookingId || "New"}`;
};

const getCrewId = (member: any) => String(member?.crew_member_id || member?.crew_member?.crew_member_id || member?.id || "");

const getCrewName = (member: any) =>
  `${member?.crew_member?.first_name || member?.first_name || ""} ${member?.crew_member?.last_name || member?.last_name || ""}`.trim() ||
  member?.email ||
  "Creative Partner";

const getRoleLabel = (role?: string) => {
  if (role === "client") return "Client";
  if (role === "cp") return "Creative Partner";
  if (role === "sales_rep") return "Sales Rep";
  if (role === "admin") return "Admin";
  if (role === "pm") return "Post Production Manager";
  if (role === "production") return "Post Production";
  if (role === "manager") return "Manager";
  return "Member";
};

export default function ConversationComposerModal({
  isOpen,
  onClose,
  onCreated,
}: ConversationComposerModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("project");
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projectDetails, setProjectDetails] = useState<any | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCpIds, setSelectedCpIds] = useState<string[]>([]);
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [directory, setDirectory] = useState<{
    staff?: ExternalChatUser[];
    clients?: ExternalChatUser[];
    creativePartners?: ExternalChatUser[];
  }>({});
  const [existingProjectRooms, setExistingProjectRooms] = useState<Record<string, ExternalChatRoom>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const assignedCrew = projectDetails?.assignedCrew || [];
  const salesRep = projectDetails?.lead_details?.assigned_sales_rep;
  const selectedClient =
    clients.find((client) => getClientId(client) === selectedClientId) || null;

  const directoryMembers = useMemo(
    () => [...(directory.staff || []), ...(directory.clients || []), ...(directory.creativePartners || [])],
    [directory]
  );
  const defaultIncludedMembers = useMemo(() => {
    const items: Array<{ id: string; name: string; role: string; email?: string | null }> = [];
    const seen = new Set<string>();
    const pushItem = (entry: { id?: string | number | null; name?: string | null; role?: string; email?: string | null }) => {
      const id = String(entry.id || "").trim();
      if (!id || seen.has(id)) return;
      items.push({
        id,
        name: entry.name || entry.email || id,
        role: entry.role || "member",
        email: entry.email || null,
      });
      seen.add(id);
    };

    if (user?.id != null) {
      pushItem({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.userTypeId === 1 ? "admin" : user.userTypeId === 5 ? "sales_rep" : "admin",
      });
    }

    if (mode === "project") {
      if (salesRep?.id != null) {
        pushItem({
          id: salesRep.id,
          name: salesRep.name,
          email: salesRep.email,
          role: "sales_rep",
        });
      }

      assignedCrew.forEach((member: any) => {
        const id = getCrewId(member);
        if (!id || !selectedCpIds.includes(id)) return;
        pushItem({
          id,
          name: getCrewName(member),
          email: member?.crew_member?.email || member?.email || null,
          role: "cp",
        });
      });

      const projectClientId =
        projectDetails?.client_id ||
        projectDetails?.client_user_id ||
        projectDetails?.client?.client_id ||
        projectDetails?.client?.user_id;
      const projectClientName =
        projectDetails?.client_name ||
        projectDetails?.client?.name ||
        projectDetails?.guest_name;
      const projectClientEmail =
        projectDetails?.client?.email ||
        projectDetails?.guest_email ||
        null;

      if (projectClientId || projectClientName || projectClientEmail) {
        pushItem({
          id: projectClientId || projectClientEmail,
          name: projectClientName || projectClientEmail || "Client",
          email: projectClientEmail,
          role: "client",
        });
      }
    } else if (selectedClient) {
      pushItem({
        id: getClientId(selectedClient),
        name:
          selectedClient.name ||
          `${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() ||
          selectedClient.email,
        email: selectedClient.email || null,
        role: "client",
      });
    }

    return items;
  }, [assignedCrew, mode, projectDetails, salesRep, selectedClient, selectedCpIds, user]);
  const excludedMemberIds = useMemo(
    () => new Set(defaultIncludedMembers.map((member) => String(member.id))),
    [defaultIncludedMembers]
  );
  const filteredDirectoryMembers = useMemo(() => {
    const normalizedQuery = memberSearch.trim().toLowerCase();
    const availableMembers = directoryMembers.filter((member) => !excludedMemberIds.has(String(member.id)));
    if (!normalizedQuery) return availableMembers;
    return availableMembers.filter((member) =>
      [member.name, member.email, member.role, member.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [directoryMembers, excludedMemberIds, memberSearch]);
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: getProjectId(project),
        label: getProjectName(project),
        description:
          project?.client_name ||
          toReadableLabel(Array.isArray(project?.event_type) ? project.event_type[0] : project?.event_type) ||
          (getProjectId(project) ? `Booking #${getProjectId(project)}` : null),
        disabled: Boolean(existingProjectRooms[getProjectId(project)]),
        disabledLabel: existingProjectRooms[getProjectId(project)]
          ? "Chat room already exists for this shoot"
          : null,
      })).filter((option) => option.id),
    [existingProjectRooms, projects]
  );
  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        id: getClientId(client),
        label:
          client.name ||
          `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
          client.email ||
          `Client #${getClientId(client)}`,
        description: client.email || client.phone_number || "Client",
      })).filter((option) => option.id),
    [clients]
  );

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const [projectsResponse, clientsResponse, directoryResponse, roomsResponse] = await Promise.all([
          adminApi.getProjects({}),
          adminApi.getClients({ page: 1, limit: 200 }),
          externalChatApi.getDirectory(),
          externalChatApi.listRooms({ page: 1, limit: 200, sortBy: "updatedAt:desc" }),
        ]);

        const rawProjectResults =
          projectsResponse?.data?.projects ||
          projectsResponse?.data?.results ||
          projectsResponse?.data ||
          projectsResponse?.results ||
          [];
        const rawClientResults = Array.isArray(clientsResponse?.data)
          ? clientsResponse.data
          : clientsResponse?.data?.items || [];

        const normalizedProjects = (Array.isArray(rawProjectResults) ? rawProjectResults : [])
          .map((item: any) => item?.project || item)
          .filter((item: any) => getProjectId(item));
        const normalizedClients = (Array.isArray(rawClientResults) ? rawClientResults : [])
          .filter((item: any) => getClientId(item));
        const existingRoomMap = (Array.isArray(roomsResponse) ? roomsResponse : []).reduce(
          (acc: Record<string, ExternalChatRoom>, room: ExternalChatRoom) => {
            const bookingId = String(room?.external_order_ref || room?.order_id?.id || room?.order_id || "").trim();
            if (bookingId) {
              acc[bookingId] = room;
            }
            return acc;
          },
          {}
        );

        setProjects(normalizedProjects);
        setClients(normalizedClients);
        setDirectory(directoryResponse);
        setExistingProjectRooms(existingRoomMap);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load conversation composer");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedProjectId || mode !== "project") return;

    const loadProject = async () => {
      try {
        const response = await adminApi.getProjectDetails(selectedProjectId);
        const data = response?.data?.project || response?.data || response;
        const assignedCrew = response?.data?.assignedCrew || data?.assignedCrew || data?.assigned_crews || [];
        setProjectDetails({
          ...data,
          assignedCrew,
          lead_details: response?.data?.lead_details || data?.lead_details || null,
        });
        setSelectedCpIds(assignedCrew.map((member: any) => getCrewId(member)).filter(Boolean));
      } catch (error: any) {
        toast.error(error?.message || "Failed to load shoot details");
      }
    };

    loadProject();
  }, [isOpen, mode, selectedProjectId]);

  useEffect(() => {
    if (!isOpen) return;
    setMode("project");
    setSelectedProjectId("");
    setSelectedClientId("");
    setProjectDetails(null);
    setSelectedCpIds([]);
    setSelectedDirectoryIds([]);
    setMemberSearch("");
  }, [isOpen]);

  useEffect(() => {
    setSelectedDirectoryIds([]);
    setMemberSearch("");
  }, [mode]);

  const toggleSelection = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const chosenExtras = directoryMembers.filter((member) => selectedDirectoryIds.includes(String(member.id)));

  const submit = async () => {
    setSubmitting(true);
    try {
      if (mode === "project") {
        if (!selectedProjectId) {
          toast.error("Select a shoot first");
          return;
        }

        if (existingProjectRooms[selectedProjectId]) {
          toast.error("Chat room already exists for this shoot");
          onCreated?.(existingProjectRooms[selectedProjectId]);
          onClose();
          return;
        }

        const participants = chosenExtras.map((member) => ({
          ...member,
          role: mapDirectoryRole(member.role),
        }));

        const room = await externalChatApi.createConversation({
          roomType: "project",
          bookingId: selectedProjectId,
          selectedCpIds,
          participants,
        });

        if (!room) {
          toast.error("Chat room was not created for this shoot");
          return;
        }

        toast.success("Conversation created");
        onCreated?.(room);
        onClose();
        return;
      }

      if (!selectedClient) {
        toast.error("Select a client to start the conversation");
        return;
      }

      const participants = chosenExtras
        .filter((member) => String(member.id) !== String(selectedClient.id))
        .map((member) => ({
          ...member,
          role: mapDirectoryRole(member.role),
        }));

      const room = await externalChatApi.createConversation({
        roomType: "direct",
        client: {
          id: getClientId(selectedClient),
          name:
            selectedClient.name ||
            `${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() ||
            selectedClient.email ||
            `Client #${getClientId(selectedClient)}`,
          email: selectedClient.email || null,
          role: "client",
        },
        participants,
        roomName: `Direct_${
          selectedClient.name ||
          `${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() ||
          selectedClient.email ||
          getClientId(selectedClient)
        }`,
      });

      if (!room) {
        toast.error("Direct conversation was not created");
        return;
      }

      toast.success("Direct conversation created");
      onCreated?.(room);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create conversation");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 pb-8 sm:p-6 sm:pb-10">
        <div className="my-4 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-2xl sm:my-6">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">Start New Conversation</h2>
            <p className="mt-1 text-sm text-white/50">Create a shoot thread or a direct client conversation.</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/15">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-[#111] p-1">
              {(["project", "direct"] as Mode[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    mode === value ? "bg-[#E5D5B8] text-black" : "text-white/65"
                  }`}
                >
                  {value === "project" ? "Shoot Conversation" : "Direct Client Chat"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading options...
              </div>
            ) : mode === "project" ? (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Select Shoot</label>
                  <SearchAutocomplete
                    label="Select Shoot"
                    placeholder="Search shoot / client"
                    options={projectOptions}
                    value={selectedProjectId}
                    onChange={setSelectedProjectId}
                    emptyMessage="No shoot matches your search"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
                  <p className="text-sm font-medium text-white">Default Members</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                    <span className="rounded-full border border-white/10 bg-[#171717] px-3 py-2">Admin</span>
                    {salesRep ? (
                      <span className="rounded-full border border-white/10 bg-[#171717] px-3 py-2">
                        Sales: {salesRep.name || salesRep.email}
                      </span>
                    ) : null}
                    {projectDetails?.client_name || projectDetails?.guest_email ? (
                      <span className="rounded-full border border-white/10 bg-[#171717] px-3 py-2">
                        Client: {projectDetails?.client_name || projectDetails?.guest_email}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Assigned CPs</p>
                    <span className="text-xs text-[#E5D5B8]">{selectedCpIds.length} selected</span>
                  </div>
                  <div className="space-y-2">
                    {assignedCrew.length ? (
                      assignedCrew.map((member: any) => {
                        const id = getCrewId(member);
                        const selected = selectedCpIds.includes(id);
                        return (
                          <label
                            key={id}
                            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                              selected ? "border-[#E5D5B8] bg-[#1A1711]" : "border-white/10 bg-[#0D0D0D]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelection(id, setSelectedCpIds)}
                              className="accent-[#E5D5B8]"
                            />
                            <div>
                              <p className="text-sm text-white">{getCrewName(member)}</p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/45">No assigned CPs found for this shoot.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Already Included</p>
                    <span className="text-xs text-white/45">{defaultIncludedMembers.length} members</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {defaultIncludedMembers.map((member) => (
                      <span
                        key={`included-${member.role}-${member.id}`}
                        className="rounded-full border border-white/10 bg-[#171717] px-3 py-2 text-xs text-white/70"
                      >
                        {member.name} • {getRoleLabel(member.role)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Select Client</label>
                  <SearchAutocomplete
                    label="Select Client"
                    placeholder="Search client"
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    emptyMessage="No client matches your search"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-2xl bg-[#E5D5B8] p-3 text-black">
                      <MessageSquarePlus size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Direct client conversation</p>
                      <p className="text-xs text-white/50">Admin and selected client are added first. You can add more members too.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#101010] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Already Included</p>
                    <span className="text-xs text-white/45">{defaultIncludedMembers.length} members</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {defaultIncludedMembers.map((member) => (
                      <span
                        key={`included-${member.role}-${member.id}`}
                        className="rounded-full border border-white/10 bg-[#171717] px-3 py-2 text-xs text-white/70"
                      >
                        {member.name} • {getRoleLabel(member.role)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <Users size={16} />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Add Extra Members</p>
              <p className="text-xs text-white/50">Admins can include any member, even if they are not linked to the shoot.</p>
            </div>
          </div>

            <div className="mb-3 rounded-2xl border border-dashed border-white/10 bg-[#0f0f0f] px-4 py-3 text-xs text-white/45">
              Members already added by default are hidden from this list.
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name, email, or role"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#141414] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredDirectoryMembers.map((member) => {
                const memberId = String(member.id);
                const selected = selectedDirectoryIds.includes(memberId);
                return (
                  <label
                    key={`${member.source}-${memberId}`}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${
                      selected ? "border-[#E5D5B8] bg-[#1A1711]" : "border-white/10 bg-[#101010]"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-white">{member.name || member.email || memberId}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {(member.role || member.source || "member").replace("_", " ")}
                        {member.email ? ` • ${member.email}` : ""}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelection(memberId, setSelectedDirectoryIds)}
                      className="accent-[#E5D5B8]"
                    />
                  </label>
                );
              })}
              {!filteredDirectoryMembers.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40">
                  No members match this search.
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-[#101010] p-4">
              <p className="text-sm font-medium text-white">Ready to add</p>
              <p className="mt-1 text-xs text-white/50">
                {chosenExtras.length} extra member{chosenExtras.length === 1 ? "" : "s"} selected
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#E5D5B8] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d4c19f] disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Creating..." : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>

  );
}
