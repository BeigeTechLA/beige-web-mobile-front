"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Eye,
  History,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

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
import AgreementHistoryTable, {
  type AgreementHistoryItem,
  type AgreementStatus,
  type AgreementType,
} from "@/components/admin/agreements/AgreementHistoryTable";
import {
  deleteLocalAgreementHistoryItem,
  getLocalAgreementHistory,
  getLocalGeneralAgreement,
  resendLocalAgreementHistoryItem,
  type LocalAgreementHistoryItem,
  type LocalGeneralAgreement,
} from "@/components/admin/agreements/localAgreementStore";

const tabs = ["All", "Pending", "Accepted", "Rejected", "Cancelled"] as const;
type AgreementTab = (typeof tabs)[number];

const toAgreementHistoryItem = (item: LocalAgreementHistoryItem): AgreementHistoryItem => ({
  id: item.id,
  cpName: item.cpName,
  cpInitials: item.cpInitials,
  cpDate: item.cpDate,
  avatarTone: item.avatarTone,
  projectName: item.projectName,
  projectId: item.projectId,
  role: item.role,
  version: item.version,
  status: item.status,
  agreementType: item.agreementType,
  admin: item.admin,
  sendDate: item.sendDate,
});

const toDateInput = (value: Date | null) => {
  if (!value) return null;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  isDark,
  minWidth = "min-w-[112px]",
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  isDark: boolean;
  minWidth?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`h-12 ${minWidth} rounded-lg border px-4 text-sm shadow-none focus:ring-1 focus:ring-[#E8D1AB]/60 ${
          isDark
            ? "border-[#3D3D3D] bg-[#202020] text-white"
            : "border-[#E3E3E3] bg-white text-[#323232]"
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={
          isDark
            ? "border-[#3D3D3D] bg-[#171717] text-white"
            : "border-[#E3E3E3] bg-white text-[#323232]"
        }
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
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
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();

  const [history, setHistory] = useState<LocalAgreementHistoryItem[]>([]);
  const [activeGeneralAgreement, setActiveGeneralAgreement] = useState<LocalGeneralAgreement | null>(null);
  const [activeTab, setActiveTab] = useState<AgreementTab>("All");
  const [agreementType, setAgreementType] = useState<AgreementType>("general");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [cpFilter, setCpFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAgreementMenuOpen, setActiveAgreementMenuOpen] = useState(false);
  const activeAgreementMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncLocalData = () => {
      setHistory(getLocalAgreementHistory());
      setActiveGeneralAgreement(getLocalGeneralAgreement());
    };

    syncLocalData();
    window.addEventListener("beige-agreements-local-updated", syncLocalData);
    window.addEventListener("storage", syncLocalData);

    return () => {
      window.removeEventListener("beige-agreements-local-updated", syncLocalData);
      window.removeEventListener("storage", syncLocalData);
    };
  }, []);

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (requestedType === "general" || requestedType === "shoot") {
      setAgreementType(requestedType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeAgreementMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeAgreementMenuRef.current?.contains(event.target as Node)) {
        setActiveAgreementMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeAgreementMenuOpen]);

  const filteredHistory = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedDateKey = toDateInput(selectedDate);
    const now = new Date();

    return history.filter((item) => {
      if (item.agreementType !== agreementType) return false;
      if (activeTab !== "All" && item.status !== activeTab) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (cpFilter !== "all" && item.cpName !== cpFilter) return false;
      if (projectFilter !== "all" && item.projectName !== projectFilter) return false;
      if (versionFilter !== "all" && item.version !== versionFilter) return false;
      if (adminFilter !== "all" && item.admin !== adminFilter) return false;

      if (normalizedSearch) {
        const haystack = `${item.cpName} ${item.projectName} ${item.projectId} ${item.role} ${item.version} ${item.status}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      const createdAt = new Date(item.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        if (selectedDateKey) {
          const createdKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;
          if (createdKey !== selectedDateKey) return false;
        }

        if (dateFilter === "Today" && createdAt.toDateString() !== now.toDateString()) return false;
        if (dateFilter === "This Month" && (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear())) return false;
        if (dateFilter === "This Week") {
          const start = new Date(now);
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - start.getDay());
          const end = new Date(start);
          end.setDate(end.getDate() + 7);
          if (createdAt < start || createdAt >= end) return false;
        }
      }

      return true;
    });
  }, [activeTab, adminFilter, agreementType, cpFilter, dateFilter, history, projectFilter, search, selectedDate, statusFilter, versionFilter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pagedAgreements = filteredHistory
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
    .map(toAgreementHistoryItem);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const optionsFrom = (key: "cpName" | "projectName" | "version" | "admin", placeholder: string) => [
    { value: "all", label: placeholder },
    ...Array.from(new Set(history.filter((item) => item.agreementType === agreementType).map((item) => item[key]))).map((value) => ({
      value,
      label: value,
    })),
  ];

  const openGeneralDetails = (agreementId?: string) => {
    const id = agreementId || activeGeneralAgreement?.id;
    if (!id) return;
    router.push(`/admin/agreements/${encodeURIComponent(id)}`);
  };

  const getRawHistoryItem = (agreement: AgreementHistoryItem) =>
    history.find((item) => String(item.id) === String(agreement.id));

  const openVersionHistory = (agreement: AgreementHistoryItem) => {
    const raw = getRawHistoryItem(agreement);
    if (raw) {
      window.sessionStorage.setItem("beige_selected_agreement", JSON.stringify(raw));
    }
    const routeId = agreement.agreementType === "general"
      ? raw?.agreementId || activeGeneralAgreement?.id || agreement.id
      : agreement.id;
    router.push(`/admin/agreements/${encodeURIComponent(String(routeId))}/version-history`);
  };

  const handleResendAgreement = (agreement: AgreementHistoryItem) => {
    const updated = resendLocalAgreementHistoryItem(agreement.id);
    if (!updated) {
      toast.error("Unable to resend this agreement.");
      return;
    }
    toast.success(`Agreement resent to ${updated.cpName}.`);
  };

  const handleDeleteAgreement = (agreement: AgreementHistoryItem) => {
    const confirmed = window.confirm(
      `Delete this ${agreement.agreementType === "general" ? "general" : "shoot"} agreement history entry for ${agreement.cpName}?`,
    );
    if (!confirmed) return;
    if (!deleteLocalAgreementHistoryItem(agreement.id)) {
      toast.error("Unable to delete this agreement entry.");
      return;
    }
    toast.success("Agreement history entry deleted.");
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button
            type="button"
            onClick={() => router.push("/admin/agreements/create-agreement")}
            className="h-12 rounded-lg bg-[#E8D1AB] px-6 text-sm font-semibold text-black hover:bg-[#D9C19A]"
          >
            Create General Agreement
          </Button>
        }
      />

      <main
        className={`min-h-screen p-4 pb-28 lg:px-10 lg:py-9 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>Agreements</h1>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/35 text-[#7D6235]"}`}>
                {history.length} agreements across all projects
              </span>
            </div>
            <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>Review and manage all agreements in one place</p>
          </div>

          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <div className={`mt-7 border-t border-dashed ${isDark ? "border-white/15" : "border-black/10"}`} />

        {activeGeneralAgreement ? (
          <section className={`relative mt-7 overflow-visible rounded-xl border ${activeAgreementMenuOpen ? "z-30" : "z-0"} ${isDark ? "border-[#303030] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
            <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="h-8 w-[4px] shrink-0 rounded-full bg-[#E8D1AB]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>Active General Agreement</p>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Active</span>
                  </div>
                  <button type="button" onClick={() => openGeneralDetails(activeGeneralAgreement.id)} className={`mt-1 truncate text-left text-sm font-medium hover:underline ${isDark ? "text-white" : "text-[#171717]"}`}>
                    {activeGeneralAgreement.agreementName}
                  </button>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>General Terms of Service</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-7 lg:justify-end">
                <div className="text-left lg:text-center">
                  <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/35" : "text-black/40"}`}>Effective</p>
                  <p className={`mt-1 text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>{formatDate(activeGeneralAgreement.effectiveDate)}</p>
                </div>
                <div className="text-left lg:text-center">
                  <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/35" : "text-black/40"}`}>Updated</p>
                  <p className={`mt-1 text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>{formatDate(activeGeneralAgreement.updatedAt)}</p>
                </div>
                <div className="text-left lg:text-center">
                  <p className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-white/35" : "text-black/40"}`}>Sections</p>
                  <p className={`mt-1 text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>{activeGeneralAgreement.sections.length}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/agreements/create-agreement?edit=${encodeURIComponent(activeGeneralAgreement.id)}`)}
                    className={`h-9 gap-2 rounded-md border px-4 text-xs font-medium shadow-none ${
                      isDark
                        ? "border-[#2D2D2D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                        : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"
                    }`}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>

                  <div ref={activeAgreementMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveAgreementMenuOpen((value) => !value)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                        isDark
                          ? "border-[#2D2D2D] bg-[#101010] text-white/60 hover:bg-[#1A1A1A] hover:text-white"
                          : "border-[#E3E3E3] bg-white text-black/55 hover:bg-[#F7F7F7] hover:text-black"
                      }`}
                      aria-label="More agreement actions"
                      aria-expanded={activeAgreementMenuOpen}
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${activeAgreementMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {activeAgreementMenuOpen ? (
                      <div
                        className={`absolute right-0 top-full z-[100] mt-2 w-[188px] overflow-hidden rounded-lg border p-1 shadow-2xl ${
                          isDark
                            ? "border-[#303030] bg-[#171717]"
                            : "border-[#E5E5E5] bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAgreementMenuOpen(false);
                            openGeneralDetails(activeGeneralAgreement.id);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition-colors ${
                            isDark
                              ? "text-white/85 hover:bg-white/[0.07] hover:text-white"
                              : "text-[#323232] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          <Eye size={14} />
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAgreementMenuOpen(false);
                            router.push(`/admin/agreements/${encodeURIComponent(activeGeneralAgreement.id)}/version-history`);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition-colors ${
                            isDark
                              ? "text-white/85 hover:bg-white/[0.07] hover:text-white"
                              : "text-[#323232] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          <History size={14} />
                          Version history
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className={`mt-5 inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 ${isDark ? "border-[#333333] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`h-10 shrink-0 rounded-lg px-5 text-sm font-medium ${activeTab === tab ? "bg-[#E8D1AB] text-black" : isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className={`relative flex h-12 flex-1 items-center rounded-xl border ${isDark ? "border-[#3D3D3D] bg-[#202020]" : "border-[#E3E3E3] bg-white"}`}>
            <Search size={18} className={`absolute left-4 ${isDark ? "text-white/35" : "text-black/35"}`} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by agreement..."
              className={`h-full w-full bg-transparent pl-11 pr-4 text-sm outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/35"}`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters((value) => !value)}
            className={`h-12 gap-2 rounded-xl border px-5 ${isDark ? "border-[#3D3D3D] bg-[#202020] text-white hover:bg-[#262626]" : "border-[#E3E3E3] bg-white text-black"}`}
          >
            <SlidersHorizontal size={17} /> Filters
          </Button>
        </div>

        {showFilters ? (
          <div className={`mt-4 overflow-x-auto rounded-xl p-3 ${isDark ? "bg-[#171717]" : "border border-[#E3E3E3] bg-white"}`}>
            <div className="flex min-w-max items-center gap-3">
              <FilterSelect value={cpFilter} onValueChange={(value) => { setCpFilter(value); setCurrentPage(1); }} placeholder="CP" options={optionsFrom("cpName", "CP")} isDark={isDark} />
              <FilterSelect value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setCurrentPage(1); }} placeholder="Project" options={optionsFrom("projectName", "Project")} isDark={isDark} minWidth="min-w-[150px]" />
              <FilterSelect value={dateFilter} onValueChange={(value) => { setDateFilter(value); setCurrentPage(1); }} placeholder="Date" options={[{ value: "all", label: "Date" }, { value: "Today", label: "Today" }, { value: "This Week", label: "This Week" }, { value: "This Month", label: "This Month" }]} isDark={isDark} />
              <FilterSelect value={versionFilter} onValueChange={(value) => { setVersionFilter(value); setCurrentPage(1); }} placeholder="Agreement Version" options={optionsFrom("version", "Agreement Version")} isDark={isDark} minWidth="min-w-[175px]" />
              <FilterSelect value={adminFilter} onValueChange={(value) => { setAdminFilter(value); setCurrentPage(1); }} placeholder="Admin" options={optionsFrom("admin", "Admin")} isDark={isDark} />
              <FilterSelect
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setActiveTab("All");
                  setCurrentPage(1);
                }}
                placeholder="Status"
                options={[
                  { value: "all", label: "Status" },
                  ...(["Accepted", "Expired", "Not Accepted", "Pending", "Rejected", "Cancelled"] as AgreementStatus[]).map((value) => ({ value, label: value })),
                ]}
                isDark={isDark}
              />
            </div>
          </div>
        ) : null}

        <AgreementHistoryTable
          agreements={pagedAgreements}
          isDark={isDark}
          agreementType={agreementType}
          onAgreementTypeChange={(type) => {
            setAgreementType(type);
            setActiveTab("All");
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredHistory.length}
          onPageChange={setCurrentPage}
          onRowClick={(agreement) => {
            const raw = history.find((item) => String(item.id) === String(agreement.id));
            if (raw) {
              window.sessionStorage.setItem("beige_selected_agreement", JSON.stringify(raw));
            }

            router.push(`/admin/agreements/${encodeURIComponent(String(agreement.id))}`);
          }}
          onEditAgreement={(agreement) => {
            const raw = history.find((item) => String(item.id) === String(agreement.id));
            if (agreement.agreementType === "general") {
              router.push(`/admin/agreements/create-agreement?edit=${encodeURIComponent(raw?.agreementId || activeGeneralAgreement?.id || "general-1")}`);
            }
          }}
          onResendAgreement={handleResendAgreement}
          onDeleteAgreement={handleDeleteAgreement}
          onViewVersionHistory={openVersionHistory}
        />
      </main>
    </>
  );
}
