"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import AgreementHistoryTable from "@/components/admin/agreements/AgreementHistoryTable";
import { adminApi, getGeneralAgreementHistory, getShootAgreementHistory } from "@/lib/api";
import { toast } from "sonner";

type AgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

type AgreementTab = "All" | "Pending" | "Accepted" | "Rejected" | "Cancelled";

type AgreementType = "general" | "shoot";

type AgreementRow = {
  id: number;
  cpName: string;
  cpId?: number | string;
  cpInitials: string;
  cpDate: string;
  avatarTone: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  status: AgreementStatus;
  agreementType: AgreementType;
  admin: string;
  sendDate: string;
};

const initialAgreements: AgreementRow[] = [
  {
    id: 1,
    cpName: "John Doe",
    cpInitials: "JD",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#DDEBFA]",
    projectName: "ABC Corporate Shoot",
    projectId: "ASN-2012",
    role: "Videographer",
    version: "v1.0",
    status: "Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 10:32 AM",
  },
  {
    id: 2,
    cpName: "Rami Guzman",
    cpInitials: "RG",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#D4E9FF]",
    projectName: "Fashion Editorial",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    status: "Expired",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 11:10 AM",
  },
  {
    id: 3,
    cpName: "Jhas Lee",
    cpInitials: "JL",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#F2E6CF]",
    projectName: "Product Shoot — Skincare",
    projectId: "ASN-2001",
    role: "Editor",
    version: "v1.0",
    status: "Expired",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 12:05 PM",
  },
  {
    id: 4,
    cpName: "Kevin Brooks",
    cpInitials: "KB",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#D8F5C8]",
    projectName: "Podcast Shoot",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    status: "Not Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 01:20 PM",
  },
  {
    id: 5,
    cpName: "Yuki Tanaka",
    cpInitials: "YT",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#FFF0BD]",
    projectName: "Corporate Photography",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    status: "Pending",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 02:15 PM",
  },
  {
    id: 6,
    cpName: "Lisa Anderson",
    cpInitials: "LA",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#F8C9E8]",
    projectName: "Music Video",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    status: "Not Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 03:40 PM",
  },
  {
    id: 7,
    cpName: "John Doe",
    cpInitials: "JD",
    cpDate: "Sep 15, 2026",
    avatarTone: "bg-[#DDEBFA]",
    projectName: "ABC Corporate Shoot",
    projectId: "ASN-2012",
    role: "Videographer",
    version: "v1.0",
    status: "Accepted",
    agreementType: "shoot",
    admin: "Admin",
    sendDate: "Sep 15, 2026, 10:32 AM",
  },
];

const tabs: AgreementTab[] = [
  "All",
  "Pending",
  "Accepted",
  "Rejected",
  "Cancelled",
];

const versionOptions = [
  "all",
  ...Array.from(new Set(initialAgreements.map((item) => item.version))),
];

const asOptions = (values: string[], placeholder: string) => values.map((value) => ({ value, label: value === "all" ? placeholder : value }));

const toDateParam = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getDateRange = (range: string) => {
  if (range === "all") return {};
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (range === "This Week") {
    start.setDate(start.getDate() - start.getDay());
    end.setDate(end.getDate() + (6 - end.getDay()));
  }
  if (range === "This Month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }
  return { start_date: toDateParam(start), end_date: toDateParam(end) };
};

const normalizeStatus = (status: unknown): AgreementStatus => {
  const value = String(status || "pending").toLowerCase();
  if (value === "not_accepted" || value === "not accepted") return "Not Accepted";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}` as AgreementStatus;
};

const statusClass = (status: AgreementStatus, isDark: boolean) => {
  switch (status) {
    case "Accepted":
      return isDark
        ? "border-emerald-400/20 bg-[#C9F8DD] text-[#169348]"
        : "border-emerald-200 bg-[#D8FBE6] text-[#169348]";
    case "Expired":
      return isDark
        ? "border-amber-300/20 bg-[#FFF1B7] text-[#C56A00]"
        : "border-amber-200 bg-[#FFF1B7] text-[#C56A00]";
    case "Pending":
      return isDark
        ? "border-amber-300/20 bg-[#FFF1B7] text-[#C56A00]"
        : "border-amber-200 bg-[#FFF1B7] text-[#C56A00]";
    case "Rejected":
    case "Cancelled":
    case "Not Accepted":
      return isDark
        ? "border-red-300/20 bg-[#FFC7C7] text-[#B51F28]"
        : "border-red-200 bg-[#FFD2D2] text-[#B51F28]";
    default:
      return "";
  }
};

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  isDark,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  isDark: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`h-12 min-w-[112px] rounded-lg border px-4 text-sm shadow-none transition-colors focus:ring-1 focus:ring-[#E8D1AB]/60 ${
          isDark
            ? "border-[#3D3D3D] bg-[#202020] text-white hover:bg-[#262626]"
            : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        className={`border ${
          isDark
            ? "border-[#3D3D3D] bg-[#171717] text-white"
            : "border-[#E3E3E3] bg-white text-[#323232]"
        }`}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={
              isDark
                ? "focus:bg-white/10 focus:text-white"
                : "focus:bg-[#F4F5F7] focus:text-black"
            }
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AgreementsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [activeTab, setActiveTab] = useState<AgreementTab>("All");
  const [agreementType, setAgreementType] = useState<AgreementType>("general");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [cpFilter, setCpFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [agreementTotal, setAgreementTotal] = useState(0);
  const historyRequestId = useRef(0);
  const [cpOptions, setCpOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "CP" },
  ]);
  const [projectOptions, setProjectOptions] = useState<string[]>(["all"]);

  useEffect(() => {
    const loadCreativePartners = async () => {
      const response: any = await adminApi.getCrewMembers({ fetch_all: true, limit: 500 });
      const payload = response?.data?.data || response?.data || {};
      const members = Array.isArray(payload) ? payload : payload.items || [];
      setCpOptions([
        { value: "all", label: "CP" },
        ...members.map((member: any) => {
          const id = member.crew_member_id ?? member.id;
          return {
            value: String(id),
            label: `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.name || `CP #${id}`,
          };
        }).filter((option: { value: string }) => option.value !== "undefined"),
      ]);
    };
    void loadCreativePartners();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const requestId = ++historyRequestId.current;
      const selectedStatus = statusFilter !== "all" ? statusFilter : activeTab !== "All" ? activeTab : undefined;
      const params: Record<string, unknown> = {
        page: currentPage,
        search: search.trim() || undefined,
        creative_partner_id: cpFilter !== "all" ? cpFilter : undefined,
        project: projectFilter !== "all" ? projectFilter : undefined,
        version: versionFilter !== "all" ? versionFilter : undefined,
        status: selectedStatus?.toLowerCase().replace(" ", "_"),
        date_on: selectedDate ? toDateParam(selectedDate) : undefined,
        ...getDateRange(dateFilter),
      };
      const response = agreementType === "general" ? await getGeneralAgreementHistory(params) : await getShootAgreementHistory(params);
      // Ignore a completed request when a newer tab/filter request is already active.
      if (requestId !== historyRequestId.current) return;
      if (response.error || !response.data) { toast.error(response.message || "Failed to load agreement history."); setAgreements([]); return; }
      // Service functions return the backend envelope; support both the normal
      // envelope and the axios-wrapped variant used by older service calls.
      const data: any = response.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const pagination = data?.pagination || {};
      setTotalPages(Math.max(1, Math.ceil(Number(pagination.total || 0) / Number(pagination.limit || 20))));
      setProjectOptions([
        "all",
        ...Array.from(new Set(items.map((item: any) => item.shoot_request?.project_name || item.agreement_version?.agreement?.agreement_name).filter(Boolean))),
      ]);
      setAgreements(items.map((item: any): AgreementRow => {
        item.status = normalizeStatus(item.status);
        const cp = item.crew_member || item.creative_partner || {};
        const name = cp.name || [cp.first_name, cp.last_name].filter(Boolean).join(" ") || `CP #${item.creative_partner_id || "—"}`;
        return { id: item.id, cpName: name, cpInitials: name.split(" ").map((part: string) => part[0]).join("").slice(0, 2), cpDate: item.created_at || "—", avatarTone: "bg-[#DDEBFA]", projectName: item.shoot_request?.project_name || item.agreement_version?.agreement?.agreement_name || "—", projectId: String(item.shoot_request?.project_id || "—"), role: item.role || "—", version: `v${item.agreement_version?.version_number || item.version_number || "1.0"}`, status: (String(item.status || "pending").replace(/^./, (value) => value.toUpperCase()) as AgreementStatus), agreementType, admin: item.sent_by?.name || "—", sendDate: item.sent_at || item.created_at || "—" };
      }));
    };
    void loadHistory();
  }, [agreementType, currentPage, search, cpFilter, projectFilter, dateFilter, versionFilter, statusFilter, activeTab, selectedDate]);

  useEffect(() => {
    const loadAgreementTotal = async () => {
      const [generalResponse, shootResponse] = await Promise.all([
        getGeneralAgreementHistory({ limit: 1 }),
        getShootAgreementHistory({ limit: 1 }),
      ]);
      setAgreementTotal(
        Number(generalResponse?.data?.pagination?.total || 0) +
        Number(shootResponse?.data?.pagination?.total || 0),
      );
    };
    void loadAgreementTotal();
  // Keep the all-agreements badge live after every history refresh/filter change.
  // Its requests intentionally omit filters, so it always represents the full total.
  }, [agreementType, currentPage, search, cpFilter, projectFilter, dateFilter, versionFilter, statusFilter, activeTab, selectedDate]);

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button
            type="button"
            onClick={() => router.push("/admin/agreements/create-agreement")}
            className={`h-12 rounded-lg px-5 text-sm font-semibold text-black transition-colors lg:px-6 ${
              isDark
                ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
            }`}
          >
            Create General Agreement
          </Button>
        }
      />

      <div
        className={`min-h-screen p-4 pb-28 transition-colors duration-300 lg:p-6 lg:px-10 lg:py-9 ${
          isDark ? "bg-transparent" : "bg-[#F3F4F6]"
        }`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className={`text-xl font-semibold leading-8 transition-colors lg:text-2xl ${
                  isDark ? "text-white" : "text-[#171717]"
                }`}
              >
                Agreements
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  isDark
                    ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
                    : "bg-[#E8D1AB]/35 text-[#7D6235]"
                }`}
              >
                {agreementTotal} agreements across all projects
              </span>
            </div>

            <p
              className={`mt-1 text-xs transition-colors lg:text-sm ${
                isDark ? "text-white/60" : "text-black/60"
              }`}
            >
              Review and manage all agreements in one place
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <SortDateButton
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>

        <div
          className={`mt-7 inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 no-scrollbar lg:mt-9 ${
            isDark
              ? "border-[#333333] bg-[#171717]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          {tabs.map((tab) => {
            const selected = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setAgreements([]);
                  setActiveTab(tab);
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`h-10 shrink-0 rounded-lg px-5 text-sm font-medium transition-all ${
                  selected
                    ? isDark
                      ? "bg-[#E5D5B8] text-black shadow-sm"
                      : "bg-[#E8D1AB] text-black shadow-sm"
                    : isDark
                      ? "text-white/65 hover:bg-white/5 hover:text-white"
                      : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div
            className={`relative flex min-h-12 flex-1 items-center rounded-xl border transition-colors ${
              isDark
                ? "border-[#3D3D3D] bg-[#202020]"
                : "border-[#E3E3E3] bg-white"
            }`}
          >
            <Search
              size={18}
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${
                isDark ? "text-white/35" : "text-black/35"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by agreement..."
              className={`h-11 w-full rounded-xl bg-transparent pl-11 pr-4 text-sm outline-none ${
                isDark
                  ? "text-white placeholder:text-white/30"
                  : "text-[#323232] placeholder:text-black/35"
              }`}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`h-12 shrink-0 gap-2 rounded-xl border px-5 text-sm font-medium transition-colors ${
              showFilters
                ? isDark
                  ? "border-[#4A4A4A] bg-[#252525] text-white hover:bg-[#2B2B2B]"
                  : "border-[#D9C19A] bg-[#F7F0E4] text-black hover:bg-[#F1E6D5]"
                : isDark
                  ? "border-[#3D3D3D] bg-[#202020] text-white hover:bg-[#262626]"
                  : "border-[#E3E3E3] bg-white text-black hover:bg-[#F4F5F7]"
            }`}
          >
            <SlidersHorizontal size={17} />
            Filters
          </Button>
        </div>

        {showFilters ? (
          <div
            className={`mt-4 w-full overflow-x-auto rounded-xl border transition-colors ${
              isDark
                ? "border-transparent bg-[#171717]"
                : "border-[#E3E3E3] bg-white"
            }`}
          >
            <div className="flex min-w-max flex-nowrap items-center gap-3 p-3">
              <div className="shrink-0">
                <FilterSelect
                  value={cpFilter}
                  onValueChange={setCpFilter}
                  placeholder="CP"
                  options={cpOptions}
                  isDark={isDark}
                />
              </div>

              <div className="shrink-0">
                <FilterSelect
                  value={projectFilter}
                  onValueChange={setProjectFilter}
                  placeholder="Project"
                  options={asOptions(projectOptions, "Project")}
                  isDark={isDark}
                />
              </div>

              <div className="shrink-0">
                <FilterSelect
                  value={dateFilter}
                  onValueChange={setDateFilter}
                  placeholder="Date"
                  options={asOptions(["all", "Today", "This Week", "This Month"], "Date")}
                  isDark={isDark}
                />
              </div>

              <div className="shrink-0">
                <FilterSelect
                  value={versionFilter}
                  onValueChange={setVersionFilter}
                  placeholder="Agreement Version"
                  options={asOptions(versionOptions, "Agreement Version")}
                  isDark={isDark}
                />
              </div>

              <div className="shrink-0">
                <FilterSelect
                  value={statusFilter}
                  onValueChange={(value) => {
                    setAgreements([]);
                    setStatusFilter(value);
                    setActiveTab("All");
                    setCurrentPage(1);
                  }}
                  placeholder="Status"
                  options={asOptions([
                    "all",
                    "Accepted",
                    "Expired",
                    "Not Accepted",
                    "Pending",
                    "Rejected",
                    "Cancelled",
                  ], "Status")}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        ) : null}

        <AgreementHistoryTable
          agreements={agreements}
          isDark={isDark}
          agreementType={agreementType}
          onAgreementTypeChange={(type) => {
            setAgreements([]);
            setAgreementType(type);
            setActiveTab("All");
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRowClick={(agreement) => {
            try {
              window.sessionStorage.setItem(
                "beige_selected_agreement",
                JSON.stringify(agreement),
              );
            } catch (error) {
              console.error("Failed to store selected agreement:", error);
            }

            router.push(`/admin/agreements/${agreement.id}`);
          }}
        />
      </div>
    </>
  );
}
