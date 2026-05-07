"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Edit3, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { studioRequestsApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApiStudioRequestStatus = "approved" | "pending" | "rejected";
type StudioRequestStatus = "Approved" | "Pending" | "Rejected";
type DateFilter = "all" | "month";

type StudioRequest = {
  id: number | string;
  hostName: string;
  initials: string;
  avatar?: string;
  date: string;
  spaceName: string;
  location: string;
  spaceType: string;
  capacity: string;
  status: StudioRequestStatus;
};

type AnyRecord = Record<string, unknown>;

const statusClasses: Record<StudioRequestStatus, string> = {
  Approved: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
  Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
  Rejected: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const toText = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};

const getPathValue = (source: unknown, path: string) =>
  path.split(".").reduce<unknown>((acc, key) => asRecord(acc)[key], source);

const pick = (source: unknown, paths: string[], fallback = "") => {
  for (const path of paths) {
    const value = getPathValue(source, path);
    const text = toText(value);
    if (text) return text;
  }
  return fallback;
};

const getItems = (response: unknown): unknown[] => {
  const candidates = [
    getPathValue(response, "data"),
    getPathValue(response, "data.items"),
    getPathValue(response, "data.requests"),
    getPathValue(response, "data.data"),
    getPathValue(response, "items"),
    getPathValue(response, "requests"),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const formatDate = (value: unknown) => {
  const text = toText(value);
  if (!text) return "N/A";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeStatus = (value: unknown): StudioRequestStatus => {
  const status = toText(value).toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
};

const toApiStatus = (status: StudioRequestStatus): ApiStudioRequestStatus =>
  status.toLowerCase() as ApiStudioRequestStatus;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

const withS3Prefix = (path?: string) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `${S3_PREFIX}${path}`;
};

const mapRequest = (request: unknown): StudioRequest => {
  const studio = asRecord(getPathValue(request, "studio") ?? getPathValue(request, "studio_details") ?? getPathValue(request, "studioDetail"));
  const address = asRecord(getPathValue(studio, "address") ?? getPathValue(request, "address"));
  const user = asRecord(getPathValue(request, "user") ?? getPathValue(request, "host") ?? getPathValue(request, "owner") ?? getPathValue(studio, "user"));

  const firstName = pick(user, ["first_name", "firstName"]);
  const lastName = pick(user, ["last_name", "lastName"]);
  const hostName =
    pick(request, ["host_name", "hostName", "user_name", "userName"]) ||
    `${firstName} ${lastName}`.trim() ||
    pick(user, ["name", "full_name", "fullName", "email"], "Unknown Host");

  const avatar = withS3Prefix(
    pick(request, [
      "avatar",
      "profile_photo",
      "profilePhoto",
      "user.profile_photo",
      "user.profilePhoto",
      "user.avatar",
      "host.avatar",
      "owner.avatar",
    ])
  );

  const cityState = [pick(address, ["city"]), pick(address, ["state"]), pick(address, ["country"])]
    .filter(Boolean)
    .join(", ");

  const capacity = pick(request, ["capacity", "studio.capacity", "studio.info.capacity", "info.capacity"]);

  return {
    id: toText(getPathValue(request, "request_id") ?? getPathValue(request, "id") ?? getPathValue(request, "studio_request_id") ?? getPathValue(request, "uuid"), "-"),
    hostName,
    initials: getInitials(hostName),
    avatar,
    date: formatDate(getPathValue(request, "created_at") ?? getPathValue(request, "request_date") ?? getPathValue(request, "date") ?? getPathValue(request, "updated_at")),
    spaceName: pick(request, [
      "space_name",
      "spaceName",
      "studio_name",
      "studioName",
      "studio.info.space_title",
      "studio.info.studio_name",
      "studio.info.brand_name",
      "studio.name",
    ], "Untitled Studio"),
    location: pick(request, ["location", "studio.location", "address.address", "address.address_line1"]) || cityState || "N/A",
    spaceType: pick(request, [
      "space_type",
      "spaceType",
      "studio_type",
      "studioType",
      "studio.info.studio_type",
      "studio.info.suggest_type",
    ], "N/A"),
    capacity: capacity ? `${capacity} ppl` : "N/A",
    status: normalizeStatus(getPathValue(request, "status")),
  };
};

function StudioStatusBadge({ status }: { status: StudioRequestStatus }) {
  return (
    <span className={`inline-flex h-8 min-w-[102px] items-center justify-center rounded-full border px-4 text-sm font-semibold ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

function HostAvatar({ request }: { request: StudioRequest }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F5] text-sm font-semibold text-black">
      {request.avatar ? (
        <Image src={request.avatar} alt={request.hostName} width={40} height={40} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{request.initials}</div>
      )}
    </div>
  );
}

export default function StudioRequestsTable() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<StudioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | string | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApiStudioRequestStatus>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const filters = useMemo(
    () => ({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(dateFilter === "month" ? { month: getCurrentMonth() } : {}),
    }),
    [dateFilter, statusFilter]
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await studioRequestsApi.getStudioRequests(filters);
      if (response?.success === false) {
        setError(response.error || response.message || "Failed to fetch studio requests.");
        setRequests([]);
        return;
      }

      setRequests(getItems(response).map(mapRequest));
    } catch (err) {
      console.error("Failed to fetch studio requests:", err);
      setError("Failed to fetch studio requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: number | string, status: StudioRequestStatus) => {
    setActionId(id);
    try {
      const response = await studioRequestsApi.updateStudioRequestStatus(id, toApiStatus(status));
      if (response?.success === false) {
        toast.error(response.error || response.message || "Failed to update studio request status.");
        return;
      }

      setRequests((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
      toast.success(`Studio request ${status.toLowerCase()}.`);
    } catch (err) {
      console.error("Failed to update studio request status:", err);
      toast.error("Failed to update studio request status.");
    } finally {
      setActionId(null);
    }
  };

  const deleteRequest = async (id: number | string) => {
    if (!window.confirm("Delete this studio request?")) return;

    setActionId(id);
    try {
      const response = await studioRequestsApi.deleteStudioRequest(id);
      if (response?.success === false) {
        toast.error(response.error || response.message || "Failed to delete studio request.");
        return;
      }

      setRequests((items) => items.filter((item) => item.id !== id));
      toast.success("Studio request deleted.");
    } catch (err) {
      console.error("Failed to delete studio request:", err);
      toast.error("Failed to delete studio request.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className={`mt-5 w-full overflow-hidden rounded-2xl border transition-colors ${isDark ? "border-[#333] bg-[#111] text-[#F2F2F2]" : "border-[#E3E3E3] bg-white text-[#000] shadow-sm"}`}>
      <div className={`flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-[#333]" : "border-[#E5E5E5]"}`}>
        <div className="flex items-center gap-2">
          <span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2 className={`text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-[#101010]"}`}>Studio Requests</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
            <SelectTrigger className={`h-[38px] w-[128px] rounded-full px-4 text-xs focus:ring-0 ${isDark ? "border-[#3D3D3D] bg-[#111111] text-white/70" : "border-[#E3E3E3] bg-white text-[#323232]"}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? "border-[#3D3D3D] bg-[#111111] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ApiStudioRequestStatus)}>
            <SelectTrigger className={`h-[38px] w-[128px] rounded-full px-4 text-xs capitalize focus:ring-0 ${isDark ? "border-[#3D3D3D] bg-[#111111] text-white/70" : "border-[#E3E3E3] bg-white text-[#323232]"}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? "border-[#3D3D3D] bg-[#111111] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[20%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className={`cursor-pointer border-b text-sm font-medium leading-none tracking-normal ${isDark ? "border-[#333] text-[#E5D5B8]" : "border-[#E5E5E5] bg-[#FFFCF6] text-[#000]"}`}>
              {["Host Name", "Space Name", "Location", "Space Type", "Capacity", "Status", "Action"].map((heading) => (
                <th key={heading} className="px-6 py-5 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          {loading && (
            <tbody>
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#888]">
                  <Loader2 className="mx-auto animate-spin" size={24} />
                </td>
              </tr>
            </tbody>
          )}

          {!loading && (error || requests.length === 0) && (
            <tbody>
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#888]">
                  {error || "No studio requests found."}
                </td>
              </tr>
            </tbody>
          )}

          {!loading && !error && requests.length > 0 && (
            <tbody>
              {requests.map((request) => {
                const isWorking = actionId === request.id;

                return (
                  <tr
                    key={request.id}
                    className={`border-b text-sm transition-colors last:border-b-0 ${isDark ? "border-[#222] text-[#F2F2F2] hover:bg-white/[0.02]" : "border-[#F0F0F0] text-[#000] hover:bg-black/[0.01]"}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <HostAvatar request={request} />
                        <div className="min-w-0">
                          <p className={`truncate whitespace-nowrap font-medium leading-normal ${isDark ? "text-[#F4F4F4]" : "text-[#101010]"}`}>{request.hostName}</p>
                          <p className="mt-0.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#666]">
                            {request.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`truncate px-6 py-5 font-medium ${isDark ? "text-[#F4F4F4]" : "text-[#101010]"}`}>{request.spaceName}</td>
                    <td className={`truncate px-6 py-5 ${isDark ? "text-[#DCDCDC]" : "text-[#555]"}`}>{request.location}</td>
                    <td className={`truncate px-6 py-5 ${isDark ? "text-[#DCDCDC]" : "text-[#555]"}`}>{request.spaceType}</td>
                    <td className="truncate px-6 py-5 font-medium text-[#E5A34D]">{request.capacity}</td>
                    <td className="px-4 py-5">
                      <StudioStatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className={`flex items-center justify-end gap-4 whitespace-nowrap ${isDark ? "text-[#E8E8E8]" : "text-[#555]"}`}>
                        {isWorking && <Loader2 className="animate-spin text-[#888]" size={18} />}

                        {!isWorking && request.status === "Approved" && (
                          <>
                            <button className={isDark ? "transition-colors hover:text-white" : "transition-colors hover:text-black"} aria-label="Edit studio request">
                              <Edit3 size={18} />
                            </button>
                            <button onClick={() => deleteRequest(request.id)} className="transition-colors hover:text-red-500" aria-label="Delete studio request">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}

                        {!isWorking && request.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(request.id, "Approved")}
                              className="h-7 rounded-md bg-[#F0FFF4] px-4 text-xs font-semibold text-[#22C55E] transition-colors hover:bg-[#dcfce4]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, "Rejected")}
                              className="h-7 rounded-md px-1 text-xs font-semibold text-[#EF4444] underline decoration-1 underline-offset-2 transition-colors hover:bg-[#FFEBEB]"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {!isWorking && request.status === "Rejected" && (
                          <button onClick={() => deleteRequest(request.id)} className={isDark ? "text-[#E0E0E0] transition-colors hover:text-red-500" : "transition-colors hover:text-red-500"} aria-label="Delete rejected request">
                            <Trash2 size={18} />
                          </button>
                        )}

                        {!isWorking && request.status === "Rejected" && (
                          <button className={isDark ? "text-[#E0E0E0] transition-colors hover:text-white" : "transition-colors hover:text-black"} aria-label="Request issue">
                            <AlertCircle size={18} />
                          </button>
                        )}

                        <button className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors`} aria-label="View request details">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      <div className={`border-t px-4 py-3 text-xs lg:hidden ${isDark ? "border-white/10 text-white/45" : "border-black/10 text-black/45"}`}>
        Scroll horizontally to view all request details.
      </div>
    </section>
  );
}
