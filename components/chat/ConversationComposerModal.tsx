"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Asterisk, CircleAlert, Loader2, MessageSquarePlus, Plus, Search, Sparkle, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { externalChatApi, type ExternalChatRoom, type ExternalChatUser } from "@/lib/externalChatApi";
import SearchAutocomplete from "@/components/chat/SearchAutocomplete";
import { useAuth } from "@/lib/hooks/useAuth";
import { TabsSwitcher } from "../admin/TabsSwitcher";
import { formatter, getInitials } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

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

const getCrewEmail = (member: any) => member?.crew_member?.email || "N/A";

const resolveCrewImage = (member: any) => {
  // Try to find the profile photo in the inner or root-level array structure
  const files = member?.crew_member?.crew_member_files || member?.crew_member_files;

  if (Array.isArray(files)) {
    const profilePhoto = files.find((file: any) => file?.file_type === "profile_photo");
    if (profilePhoto?.file_path) {
      return `${S3_PREFIX}${profilePhoto.file_path}`;
    }
  }

  // Fallback to direct path or null if no profile image is available
  const imageUrl = (member?.crew_member?.file_path || member?.file_path)
    ? `${S3_PREFIX}${member?.crew_member?.file_path || member?.file_path}`
    : null;
  return imageUrl;
};

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
  const [showExtraMembers, setShowExtraMembers] = useState(false);
  const [defaultMemberCount, setDefaultMemberCount] = useState(1);

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
        projectDetails?.guest_name ||
        projectDetails?.lead_details?.client_name;
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

  const tabs: { label: string; value: Mode }[] = [
    { label: "Shoot Conversation", value: "project" },
    { label: "Direct Client Chat", value: "direct" },
  ];

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

  useEffect(()=> {
    let nonCPMembers = defaultIncludedMembers.filter((member) => member.role !== "cp")
    setDefaultMemberCount(nonCPMembers.length)
  }, [defaultIncludedMembers])

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm transition-colors ${isDark ? "bg-black/60" : "bg-white/60"}`}
        onClick={() => {
          resetComposerFormState();
          onClose();
        }}
      />

      {/* Modal Container */}
      <div
        className={`w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl border shadow-2xl transition-all duration-300 transform translate-y-0 flex flex-col max-h-[90vh] sm:max-h-[none] h-[90vh] sm:h-auto ${isDark ? "border-white/40 bg-black" : "border-white/40 bg-white"}`}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b p-4 lg:px-6 lg:py-5 border-[#CACACA] shrink-0">
          <div>
            <h2 className={`text-xl lg:text-3xl font-bold truncate ${isDark ? "text-white" : "text-black"}`}>
              {!showExtraMembers ? "Start New Conversation" : "Add New Members"}
            </h2>
            <p className={`mt-1 text-xs lg:text-sm  lg:truncate text-wrap ${isDark ? "text-white/50" : "text-zinc-500"}`}>
              {!showExtraMembers ? "Create a shoot thread or a direct client conversation." : "Admins can include any member, even if they are not linked to the shoot."}
            </p>
          </div>
          <button
            onClick={() => {
              resetComposerFormState();
              setShowExtraMembers(false);
              onClose();
            }}
            className={`rounded-full p-2 lg:p-3.5 shrink-0 transition-colors ${isDark ? "bg-[#2B2626] text-white/60 hover:bg-[#2B2626]/75" : "bg-[#F0F0F0] text-zinc-400 hover:bg-[#F0F0F0]/70"}`}
          >
            <X className="h-4 w-4 lg:h-7 lg:w-7" />
          </button>
        </div>

        {/* Scrollable Main Content Frame */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!showExtraMembers ? (
            <div className={`px-4 py-6 lg:p-6 space-y-6`}>
              <TabsSwitcher
                tabs={tabs}
                activeTab={mode}
                onChange={(tab) => setMode(tab)}
                className="w-full"
              />

              {loading ? (
                <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/60" : "text-zinc-600"}`}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading options...
                </div>
              ) : mode === "project" ? (
                <div className="space-y-5">
                  <div className={`mb-7 rounded-lg lg:rounded-xl border p-4 ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 border ${isDark ? "bg-[#0C0C0C] border-white/20 text-[#E8D1AB]" : "bg-white border-[#F0F0F0] text-black"}`}>
                        <Sparkle size={20} />
                      </div>
                      <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                        Default Members & Assigned CP Will be included automatically in this conversations.
                      </p>
                    </div>
                  </div>

                  <div>
                    <SearchAutocomplete
                      label="Select Shoot"
                      placeholder="Search by project name, client, or booking ID"
                      options={projectOptions}
                      value={selectedProjectId}
                      onChange={setSelectedProjectId}
                      emptyMessage="No shoot matches your search"
                      isDark={isDark}
                    />
                  </div>

                  {/* Already Added Members */}
                  <div className={`rounded-lg lg:rounded-xl border ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                    {/* Default Members */}
                    <div className={`p-4 space-y-4`}>
                      <div className={`flex gap-2.5`}>
                        <UsersRound size={24} className="text-[#E8D1AB]" />
                        <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                          Default Members <span className={isDark ? "text-[#E8D1AB]" : "text-black/80"}>({formatter.format(defaultMemberCount)})</span>
                        </p>
                      </div>
                      <div className={`mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs ${isDark ? "text-white/70" : "text-zinc-600"}`}>
                        <div className={`flex items-center justify-between gap-3 rounded-md p-2.5 border transition ${isDark ? "border-[#0C0C0C] bg-[#0C0C0C]" : "border-white bg-white"}`}>
                          <div className="w-full flex items-center gap-3">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                              {getInitials("Admin")}
                            </div>
                            <div className="w-full flex lg:flex-col justify-between ">
                              <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>
                                Admin
                              </p>
                              <p className={`text-[10px] ${isDark ? "text-white/70" : "text-black/70"}`}>
                                Admin
                              </p>
                            </div>
                          </div>
                        </div>
                        {salesRep ? (
                          <div className={`flex items-center justify-between gap-3 rounded-md p-2.5 transition ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}>
                            <div className="w-full flex items-center gap-3">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                {getInitials(salesRep.name)}
                              </div>
                              <div className="w-full flex lg:flex-col justify-between">
                                <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>
                                  {salesRep.name}
                                </p>
                                <p className={`text-[10px] ${isDark ? "text-white/70" : "text-black/70"}`}>
                                  Sales Rep
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {projectDetails?.lead_details?.client_name || projectDetails?.client_name || projectDetails?.guest_email  ? (
                          <div className={`flex items-center justify-between gap-3 rounded-md p-2.5 transition w-full min-w-0 ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative shrink-0">
                                {getInitials(projectDetails?.lead_details?.client_name || projectDetails?.client_name || projectDetails?.guest_email)}
                              </div>
                              <div className="min-w-0 flex-1 flex lg:flex-col justify-between">
                                <p className={`text-xs font-medium truncate max-w-[140px] md:max-w-[200px] ${isDark ? "text-white" : "text-black"}`}>
                                  {projectDetails?.lead_details?.client_name || projectDetails?.client_name || projectDetails?.guest_email}
                                </p>
                                <p className={`text-[10px] truncate ${isDark ? "text-white/70" : "text-black/70"}`}>
                                  Client
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <hr className={`border-t my-0 ${isDark ? "border-[#484848]" : "border-[#E3E3E3]"}`} />
                    {/* Assigned Members */}
                    <div className={`p-4 space-y-4`}>
                      <div className={`flex gap-2.5`}>
                        <UsersRound size={24} className="text-[#E8D1AB]" />
                        <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                          Assigned CPs <span className={isDark ? "text-[#E8D1AB]" : "text-black/80"}>({formatter.format(selectedCpIds.length)})</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        {assignedCrew.length ? (
                          assignedCrew.map((member: any) => {
                            const id = getCrewId(member);
                            const selected = selectedCpIds.includes(id);
                            const memberImage = resolveCrewImage(member);
                            return (
                              <label
                                key={id}
                                className={`flex items-center justify-between gap-3 rounded-md p-2.5 transition ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                    {memberImage !== null ? (
                                      <Image
                                        src={memberImage}
                                        alt={getCrewName(member)}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to initials if image fails to load
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          if (target.parentElement) {
                                            target.parentElement.textContent = getInitials(getCrewName(member));
                                          }
                                        }}
                                        width={32}
                                        height={32}
                                      />
                                    ) : (
                                      getInitials(getCrewName(member))
                                    )}
                                  </div>
                                  <div>
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>{getCrewName(member)}</p>
                                    <p className={`text-[10px] ${isDark ? "text-white/70" : "text-black/70"}`}>{getCrewEmail(member)}</p>
                                  </div>
                                </div>

                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSelection(id, setSelectedCpIds)}
                                  className="h-[21px] w-[21px] shrink-0 accent-[#E8D1AB]"
                                />
                              </label>
                            );
                          })
                        ) : (
                          <p className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                            No assigned CPs found for this shoot.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex gap-2 items-center ${isDark ? "text-white" : "text-black"}`}>
                      <Plus size={24} />
                      <Button
                        onClick={() => setShowExtraMembers(true)}
                        className="!p-0 h-fit text-xs lg:text-sm font-semibold underline underline-offset-2"
                      >
                        Add Extra Members
                      </Button>
                    </div>
                    <div className={`rounded-lg lg:rounded-xl border p-4 ${isDark ? "border-[#4D4D4D]/50 bg-[#101010]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                      <div className="flex items-center gap-3">
                        <CircleAlert size={20} className={`shrink-0 ${isDark ? "text-white" : "text-black"}`} />
                        <p className={`text-xs lg:text-sm ${isDark ? "text-[#B8B8B8]" : "text-black/70"}`}>
                          Admins can include any member, even if they are not linked to the shoot.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className={`mb-7 rounded-lg lg:rounded-xl border p-4 ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 border ${isDark ? "bg-[#0C0C0C] border-white/20 text-[#E8D1AB]" : "bg-[#F0F0F0] border-[#F0F0F0] text-black"}`}>
                        <Sparkle size={20} />
                      </div>
                      <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                        Admin & Selected client are added first. You can add more members too.
                      </p>
                    </div>
                  </div>
                  <div>
                    <SearchAutocomplete
                      label="Select Client"
                      placeholder="Search client"
                      options={clientOptions}
                      value={selectedClientId}
                      onChange={setSelectedClientId}
                      emptyMessage="No client matches your search"
                      isDark={isDark}
                    />
                  </div>

                  {/* Already Added Members */}
                  <div className={`rounded-lg lg:rounded-xl border ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                    {/* Default Members */}
                    <div className={`p-4 space-y-4`}>
                      <div className={`flex gap-2.5`}>
                        <UsersRound size={24} className="text-[#E8D1AB]" />
                        <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                          Default Members <span className={isDark ? "text-[#E8D1AB]" : "text-black/80"}>( {formatter.format(defaultIncludedMembers.length)} )</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs">
                        {defaultIncludedMembers.length ? (
                          defaultIncludedMembers.map((member: any) => {
                            console.log(member)
                            return (
                              <div
                                key={`included-${member.role}-${member.id}`}
                                className={`flex items-center justify-between gap-3 rounded-md p-2.5 transition ${isDark ? "bg-[#0C0C0C]" : "bg-white"}`}
                              >
                                <div className="w-full flex items-center gap-3 ">
                                  <div className="shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                    {getInitials(member.name)}
                                  </div>
                                  <div className="w-full flex lg:flex-col justify-between ">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>
                                      {member.name}
                                    </p>
                                    <p className={`text-[10px] capitalize ${isDark ? "text-white/70" : "text-black/70"}`}>
                                      {member.role}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className={`text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                            No assigned CPs found for this shoot.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex gap-2 items-center ${isDark ? "text-white" : "text-black"}`}>
                      <Plus size={24} />
                      <Button
                        onClick={() => setShowExtraMembers(true)}
                        className="!p-0 h-fit text-xs lg:text-sm font-semibold underline underline-offset-2"
                      >
                        Add Extra Members
                      </Button>
                    </div>
                    <div className={`rounded-lg lg:rounded-xl border p-4 ${isDark ? "border-[#4D4D4D]/50 bg-[#101010]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                      <div className="flex items-center gap-3">
                        <CircleAlert size={20} className={isDark ? "text-white" : "text-black"} />
                        <p className={`text-xs lg:text-sm ${isDark ? "text-[#B8B8B8]" : "text-black/70"}`}>
                          Admins can include any member, even if they are not linked to the shoot.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Add Extra Members section container (When enabled, previous view is completely hidden) */
            <div className="px-4 py-6 lg:p-6 border-t border-dashed border-white/10">
              <div className={`mb-3 font-medium text-xs italic flex gap-1 ${isDark ? "text-white/80" : "text-black/70"}`}>
                <Asterisk size={12} />
                Members already added by default are hidden from this list.
              </div>

              <div className="relative mb-3">
                <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-white/35" : "text-zinc-400"}`} />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members by name, email, or role"
                  className={`h-11 w-full rounded-lg lg:rounded-xl border pl-10 pr-3 text-sm outline-none transition ${isDark
                    ? "border-white/20 bg-[#171717] text-white placeholder:text-[#727272]"
                    : "border-[#E3E3E3] bg-white text-black placeholder:text-zinc-400 focus:border-zinc-300"
                    }`}
                />
              </div>

              <div className={`max-h-80 lg:max-h-[460px] overflow-y-auto no-scrollbar border rounded-lg lg:rounded-xl ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`}>
                {filteredDirectoryMembers.map((member) => {
                  const memberId = String(member.id);
                  const selected = selectedDirectoryIds.includes(memberId);

                  return (
                    <label
                      key={`${member.source}-${memberId}`}
                      className={`flex items-center justify-between gap-3 p-2.5 transition border-b last:border-0 ${isDark ? "border-[#484848]" : "border-[#E3E3E3]"} }`}
                    >
                      <div className="flex items-center gap-3 ">

                        <div className={`h-10 w-10 lg:h-15 lg:w-15 rounded-full overflow-hidden flex items-center justify-center text-black font-semibold text-sm lg:text-base relative ${isDark ? "bg-[#F5F5F5]" : "bg-white"}`}>
                          {member?.profileImage !== null ? (
                            <Image
                              src={`${S3_PREFIX}${member?.profileImage}`}
                              alt={member.name || member.email || memberId}
                              className="rounded-full object-cover shrink-0"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.textContent = getInitials(getCrewName(member));
                                }
                              }}
                              width={60}
                              height={60}
                            />
                          ) : (
                            getInitials(member.name || member.email || memberId)
                          )}
                        </div>
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

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(memberId, setSelectedDirectoryIds)}
                        className="h-[21px] w-[21px] shrink-0 accent-[#E8D1AB]"
                      />
                    </label>
                  );
                })}
                {!filteredDirectoryMembers.length ? (
                  <div className={`px-4 py-8 text-center text-sm lg:text-base ${isDark ? "text-white/40" : "text-zinc-400"}`}>
                    No members match this search.
                  </div>
                ) : null}
              </div>

              <div className={`mt-5 rounded-lg lg:rounded-xl border p-2.5 ${isDark ? "border-white/20 bg-[#171717]" : "border-[#E3E3E3] bg-[#F4F5F7]"}`} >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 border ${isDark ? "bg-[#0C0C0C] border-white/20 text-[#E8D1AB]" : "bg-white border-[#F0F0F0] text-black"}`}>
                    <UsersRound size={20} />
                  </div>
                  <p className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                    {chosenExtras.length} Extra Member{chosenExtras.length === 1 ? "" : "s"} Selected
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowExtraMembers(false)}
                  className="!p-0 h-fit text-xs lg:text-sm font-semibold underline underline-offset-2">
                  Back to settings
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className={`p-4 lg:p-6 !pt-0 mt-auto flex gap-2.5 lg:gap-3 shrink-0 bg-inherit z-10`}>
          <button
            type="button"
            onClick={() => {
              resetComposerFormState();
              setShowExtraMembers(false);
              onClose();
            }}
            className={`w-full lg:w-25 rounded-lg border p-3 lg:h-12 text-xs lg:text-sm font-medium transition-all ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1F1F1F]/80" : "border-[#f0f0f0] bg-[#f0f0f0] text-zinc-700 hover:bg-zinc-100"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={`w-full lg:w-25 rounded-lg p-3 lg:h-12 text-xs lg:text-sm font-medium transition-all disabled:opacity-40 disabled:pointer-events-none bg-[#E8D1AB] text-black hover:bg-[#d4c2a1] flex justify-center items-center`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {submitting ? "Creating..." : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}