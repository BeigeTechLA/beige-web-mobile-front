"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus, Search, Users, X, Sparkles, Plus, Info, ChevronDown, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { externalChatApi, type ExternalChatRoom, type ExternalChatUser } from "@/lib/externalChatApi";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
import { useAuth } from "@/lib/hooks/useAuth";
import AddMembersModal from "@/components/chat/AddMembersModal";

interface ConversationComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (room: ExternalChatRoom | null) => void;
  isDark?: boolean;
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

const getProjectOptionLabel = (project: any) => {
  const bookingId = getProjectId(project);
  const baseName = getProjectName(project);
  return bookingId ? `${baseName} (Booking #${bookingId})` : baseName;
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

const getInitials = (name?: string | null) =>
  String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function ConversationComposerModal({
  isOpen,
  onClose,
  onCreated,
  isDark = true
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
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

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
        label: getProjectOptionLabel(project),
        description:
          [
            getProjectId(project) ? `Booking #${getProjectId(project)}` : "",
            project?.client_name || "",
            toReadableLabel(Array.isArray(project?.event_type) ? project.event_type[0] : project?.event_type) || "",
          ]
            .filter(Boolean)
            .join(" • "),
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

  const resetComposerFormState = () => {
    setMode("project");
    setSelectedProjectId("");
    setSelectedClientId("");
    setProjectDetails(null);
    setSelectedCpIds([]);
    setSelectedDirectoryIds([]);
    setMemberSearch("");
  };

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const [projectsResponse, adminClientsResponse, salesClientsResponse, directoryResponse, roomsResponse] = await Promise.all([
          adminApi.getProjects({}),
          adminApi.getAdminClients({ page: 1, limit: 300 }),
          adminApi.getClients({ page: 1, limit: 300 }),
          externalChatApi.getDirectory(),
          externalChatApi.listRooms({ page: 1, limit: 200, sortBy: "updatedAt:desc" }),
        ]);

        const rawProjectResults =
          projectsResponse?.data?.projects ||
          projectsResponse?.data?.results ||
          projectsResponse?.data ||
          projectsResponse?.results ||
          [];
        const rawAdminClientResults = Array.isArray(adminClientsResponse?.data)
          ? adminClientsResponse.data
          : adminClientsResponse?.data?.items ||
          adminClientsResponse?.data?.rows ||
          adminClientsResponse?.items ||
          [];
        const rawSalesClientResults = Array.isArray(salesClientsResponse?.data)
          ? salesClientsResponse.data
          : salesClientsResponse?.data?.items ||
          salesClientsResponse?.data?.rows ||
          salesClientsResponse?.items ||
          [];
        const mergedClientResults = [
          ...(Array.isArray(rawAdminClientResults) ? rawAdminClientResults : []),
          ...(Array.isArray(rawSalesClientResults) ? rawSalesClientResults : []),
        ];

        const normalizedProjects = (Array.isArray(rawProjectResults) ? rawProjectResults : [])
          .map((item: any) => item?.project || item)
          .filter((item: any) => getProjectId(item));
        const seenClientIds = new Set<string>();
        const normalizedClients = mergedClientResults
          .filter((item: any) => getClientId(item))
          .filter((item: any) => {
            const clientId = getClientId(item);
            if (!clientId || seenClientIds.has(clientId)) return false;
            seenClientIds.add(clientId);
            return true;
          });
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

    let isActive = true;
    const requestProjectId = selectedProjectId;

    const loadProject = async () => {
      try {
        const response = await adminApi.getProjectDetails(selectedProjectId);
        const data = response?.data?.project || response?.data || response;
        const assignedCrew = response?.data?.assignedCrew || data?.assignedCrew || data?.assigned_crews || [];
        if (!isActive || !isOpen || mode !== "project" || requestProjectId !== selectedProjectId) {
          return;
        }
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
    return () => {
      isActive = false;
    };
  }, [isOpen, mode, selectedProjectId]);

  useEffect(() => {
    if (!isOpen) {
      resetComposerFormState();
      return;
    }

    resetComposerFormState();
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
        roomName: `Direct_${selectedClient.name ||
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-sm transition-colors ${isDark ? "bg-black/80" : "bg-black/40"}`}
        onClick={() => {
          resetComposerFormState();
          onClose();
        }}
      />

      <div className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border-[0.5px] shadow-2xl transition-colors ${isDark ? "border-[#FFFFFF]/40 bg-[#000000]" : "border-[#E3E3E3] bg-white"}`}>
        {/* Header */}
        <div
          className={`flex items-start justify-between border-b px-8 py-6 ${isDark ? "border-white/20" : "border-[#E3E3E3]"
            }`}
        >
          <div className="space-y-1">
            <h2
              className={`text-3xl font-semibold leading-none ${isDark ? "text-white" : "text-black"
                }`}
            >
              Start New Conversation
            </h2>

            <p
              className={`text-sm ${isDark ? "text-white/60" : "text-[#000000B2]"
                }`}
            >
              Create a shoot thread or a direct client conversation.
            </p>
          </div>

          <button
            onClick={() => {
              resetComposerFormState();
              onClose();
            }}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${isDark
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-[#F0F0F0] text-black hover:bg-[#F4F5F7]"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar px-6 py-5">
          {/* Mode Toggle */}
          <div className={`mb-5 inline-flex w-full rounded-xl border-[0.5px] p-2 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
            {(["project", "direct"] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded-md px-5.5 py-2.5 text-base font-medium transition ${mode === value
                  ? "bg-[#E8D1AB] text-black"
                  : isDark
                    ? "text-white/65 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                  }`}
              >
                {value === "project" ? "Shoot Conversation" : "Direct Client Chat"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={`flex items-center justify-center py-10 ${isDark ? "text-white/60" : "text-zinc-600"}`}>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm">Loading options...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info Box */}
              <div className={`rounded-xl border px-2 py-2 ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                <div className="flex items-center gap-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0C0C0C]">
                    <Sparkles className="h-4 w-4 text-[#E8D8B8]" strokeWidth={1.75} />
                  </div>

                  <p className="text-xs font-normal leading-5 text-white/70">
                    Default Members &amp; Assign CP will be included automatically in this
                    conversation.
                  </p>
                </div>
              </div>



              {/* Select Order/Client */}
              <div>
                <label className={`mb-2 block text-xs font-medium ${isDark ? "text-white/70" : "text-zinc-700"}`}>
                  Select Order / Client
                </label>
                {mode === "project" ? (
                  <SearchAutocomplete
                    placeholder="Search by project name, client, or booking ID"
                    options={projectOptions}
                    value={selectedProjectId}
                    onChange={setSelectedProjectId}
                    emptyMessage="No shoot matches your search"
                    isDark={isDark}
                  />
                ) : (
                  <SearchAutocomplete
                    placeholder="Search client"
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    emptyMessage="No client matches your search"
                    isDark={isDark}
                  />
                )}
              </div>

              <div
                className={`rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-[#E3E3E3] bg-[#F9F9F9]"
                  }`}
              >
                {/* Default Members */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className={`h-6 w-6 ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                    <span className={`text-base font-normal ${isDark ? "text-white" : "text-black"}`}>
                      Default Members
                    </span>
                    <span className={`text-base font-normal ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>
                      ({defaultIncludedMembers.length})
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {defaultIncludedMembers.map((member) => (
                      <div
                        key={`default-${member.role}-${member.id}`}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]" : "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]"}`}>
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {member.name}
                          </p>
                          <p className={`truncate text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                            {getRoleLabel(member.role)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                {mode === "project" && assignedCrew.length > 0 && (
                  <>
                    <div className={isDark ? "border-b border-white/10" : "border-b border-[#E3E3E3]"} />

                    {/* Assigned CPs */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className={`h-6 w-6 ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                        <span className={`text-base font-normal ${isDark ? "text-white" : "text-black"}`}>
                          Assigned CPs
                        </span>
                        <span className={`text-base font-normal ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>
                          ({selectedCpIds.length})
                        </span>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {assignedCrew.map((member: any) => {
                          const id = getCrewId(member);
                          const name = getCrewName(member);
                          const email = member?.crew_member?.email || member?.email || "";
                          const selected = selectedCpIds.includes(id);

                          return (
                            <label
                              key={id}
                              className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition ${selected
                                ? isDark
                                  ? "bg-[#0C0C0C]"
                                  : "bg-[#FDFBF7]"
                                : isDark
                                  ? "bg-[#171717]"
                                  : "bg-white"
                                }`}
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]" : "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]"}`}>
                                {getInitials(name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                  {name}
                                </p>
                                <p className={`truncate text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                                  {email}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelection(id, setSelectedCpIds)}
                                className="h-4 w-4 accent-[#E5D5B8]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>




              {/* Add Extra Members */}
              <div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setIsAddMembersModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-semibold text-white underline"
                  >
                    <Plus size={20} />
                    Add Extra Members
                  </button>
                </div>

                <div className={`mb-4 flex items-start gap-3 rounded-xl border-[0.5px] px-4 py-3.5 ${isDark ? "border-[#4D4D4D]/50 bg-[#101010]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                  <Info className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? "text-white" : "text-zinc-600"}`} />
                  <p className={`text-sm ${isDark ? "text-white/60" : "text-zinc-600"}`}>
                    Admins can include any member, even if they are not linked to the shoot.
                  </p>
                </div>

                {chosenExtras.length > 0 && (
                  <div
                    className={`rounded-xl border ${isDark
                      ? "border-white/20 bg-[#171717]"
                      : "border-[#E3E3E3] bg-[#F9F9F9]"
                      }`}
                  >
                    {/* Extra Members */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className={`h-6 w-6 ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                        <span className={`text-base font-normal ${isDark ? "text-white" : "text-black"}`}>
                          Extra Members
                        </span>
                        <span className={`text-base font-normal ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>
                          ({chosenExtras.length})
                        </span>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {chosenExtras.map((member) => (
                          <div
                            key={`default-${member.role}-${member.id}`}
                            className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDark ? "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]" : "bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-[#222]"}`}>
                              {getInitials(member.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {member.name}
                              </p>
                              <p className={`truncate text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                                {getRoleLabel(member.role)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-start gap-3 border-t px-6 py-4 ${isDark ? "border-white/10" : "border-[#E3E3E3]"}`}>
          <button
            type="button"
            onClick={() => {
              resetComposerFormState();
              onClose();
            }}
            className={`rounded-lg border px-7 py-3.5 text-sm font-medium transition ${isDark
              ? "border-white/10 bg-[#171717] text-white/70 hover:bg-white/5"
              : "border-[#E3E3E3] bg-white text-zinc-700 hover:bg-[#F4F5F7]"
              }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || (mode === "project" ? !selectedProjectId : !selectedClientId)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E5D5B8] px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#d4c19f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Start Chat"}
          </button>
        </div>
        <AddMembersModal
          isOpen={isAddMembersModalOpen}
          onClose={() => setIsAddMembersModalOpen(false)}
          onSubmit={(selectedIds) => {
            setSelectedDirectoryIds(selectedIds);
          }}
          existingMembers={defaultIncludedMembers}
          directory={directory}
          isDark={isDark}
        />
      </div>
    </div>
  );
}