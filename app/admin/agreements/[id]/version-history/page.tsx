"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleAlert, Clock3, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  findLocalGeneralAgreement,
  getLocalGeneralAgreementVersions,
  getLocalShootAgreement,
  getLocalShootAgreementVersions,
  revertLocalGeneralAgreementVersion,
  revertLocalShootAgreementVersion,
  type LocalAgreementVersionSnapshot,
  type LocalShootAgreementRecord,
} from "@/components/admin/agreements/localAgreementStore";

type AgreementSnapshot = {
  id?: number | string;
  agreementId?: string;
  cpName?: string;
  projectName?: string;
  projectId?: string;
  role?: string;
  version?: string;
  status?: string;
  sendDate?: string;
  admin?: string;
  agreementType?: "general" | "shoot";
};

type DisplayVersion = {
  version: string;
  author: string;
  date: string;
  reason: string;
  current: boolean;
  createdAt: string;
};

const versionNumber = (value?: string) => {
  const match = String(value || "v1.0").match(/(\d+)\.(\d+)/);
  if (!match) return 1;
  return Number(match[1]) + Number(match[2]) / 100;
};

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function AgreementVersionHistoryPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const cameFromShoot = searchParams.get("from") === "shoot";
  const sourceShootId = searchParams.get("shootId");

  const [selectedRow, setSelectedRow] = useState<AgreementSnapshot>({
    id: params.id,
    cpName: "Creative Partner",
    projectName: "Agreement",
    version: "v1.0",
    admin: "Admin",
  });
  const [localVersions, setLocalVersions] = useState<LocalAgreementVersionSnapshot[]>([]);
  const [localShootVersions, setLocalShootVersions] = useState<LocalShootAgreementRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");

  const localAgreement = findLocalGeneralAgreement(params.id);
  const localShootAgreement = getLocalShootAgreement(params.id);
  const isGeneralAgreement = Boolean(localAgreement);
  const isShootAgreement = !isGeneralAgreement && Boolean(localShootAgreement);

  useEffect(() => {
    if (isGeneralAgreement) {
      setLocalVersions(getLocalGeneralAgreementVersions(params.id));
    } else if (isShootAgreement) {
      setLocalShootVersions(getLocalShootAgreementVersions(params.id));
    }

    try {
      const raw = window.sessionStorage.getItem("beige_selected_agreement");
      if (!raw) return;
      const parsed = JSON.parse(raw) as AgreementSnapshot;
      const parsedAgreementId = parsed.agreementId || parsed.id;
      if (String(parsedAgreementId) === String(params.id) || String(parsed.id) === String(params.id)) {
        setSelectedRow((current) => ({ ...current, ...parsed }));
      }
    } catch (error) {
      console.error("Failed to read agreement version history", error);
    }
  }, [isGeneralAgreement, isShootAgreement, params.id]);

  const versions = useMemo<DisplayVersion[]>(() => {
    if (isGeneralAgreement && localAgreement) {
      return localVersions
        .slice()
        .sort((a, b) => versionNumber(b.version) - versionNumber(a.version))
        .map((item) => ({
          version: item.version,
          author: item.author || "Admin",
          date: formatDate(item.createdAt),
          reason: item.reason,
          current: item.version === localAgreement.currentVersion,
          createdAt: item.createdAt,
        }));
    }

    if (isShootAgreement && localShootAgreement) {
      return localShootVersions
        .slice()
        .sort((a, b) => versionNumber(b.version) - versionNumber(a.version))
        .map((item, index) => ({
          version: item.version,
          author: "Admin",
          date: formatDate(item.sentAt || item.createdAt),
          reason: index === localShootVersions.length - 1 ? "Initial agreement creation" : "Shoot agreement updated",
          current: item.version === localShootAgreement.version,
          createdAt: item.sentAt || item.createdAt,
        }));
    }

    const current = versionNumber(selectedRow.version);
    const count = Math.max(1, Math.floor(current));
    return Array.from({ length: count }, (_, index) => {
      const number = count - index;
      return {
        version: `v${number}.0`,
        author: selectedRow.admin || "Admin",
        date: selectedRow.sendDate || "Version date unavailable",
        reason: number === 1 ? "Initial agreement creation" : "Agreement updated",
        current: number === count,
        createdAt: selectedRow.sendDate || "",
      };
    });
  }, [isGeneralAgreement, isShootAgreement, localAgreement, localShootAgreement, localShootVersions, localVersions, selectedRow]);

  const availableMonths = useMemo(() => {
    const labels = new Map<string, string>();
    versions.forEach((item) => {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      labels.set(
        key,
        date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      );
    });
    return [...labels.entries()];
  }, [versions]);

  const filtered = versions.filter((item) => {
    const query = search.trim().toLowerCase();
    if (query && !`${item.version} ${item.author} ${item.reason}`.toLowerCase().includes(query)) return false;
    if (statusFilter === "current" && !item.current) return false;
    if (statusFilter === "previous" && item.current) return false;
    if (versionFilter !== "all" && item.version !== versionFilter) return false;
    if (monthFilter !== "all") {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.getTime())) return false;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (key !== monthFilter) return false;
    }
    return true;
  });

  const handlePreview = (item: DisplayVersion) => {
    if (isGeneralAgreement) {
      router.push(
        `/admin/agreements/details?id=${encodeURIComponent(params.id)}&version=${encodeURIComponent(item.version)}`,
      );
      return;
    }
    const versionQuery = `version=${encodeURIComponent(item.version)}`;
    router.push(
      cameFromShoot && sourceShootId
        ? `/admin/agreements/${params.id}?from=shoot&shootId=${encodeURIComponent(sourceShootId)}&${versionQuery}`
        : `/admin/agreements/${params.id}?${versionQuery}`,
    );
  };

  const handleRevert = (item: DisplayVersion) => {
    if (isShootAgreement) {
      const confirmed = window.confirm(
        `Revert the active shoot agreement content to ${item.version}? A new version will be created so version history is preserved.`,
      );
      if (!confirmed) return;
      const reverted = revertLocalShootAgreementVersion(params.id, item.version);
      if (!reverted) {
        toast.error("Unable to revert this shoot agreement version.");
        return;
      }
      setLocalShootVersions(getLocalShootAgreementVersions(params.id));
      toast.success(`${item.version} restored as new ${reverted.version}.`);
      return;
    }

    if (!isGeneralAgreement) {
      toast.error("Unable to identify this agreement version.");
      return;
    }

    const confirmed = window.confirm(
      `Revert the active agreement content to ${item.version}? A new version will be created so version history is preserved.`,
    );
    if (!confirmed) return;

    const reverted = revertLocalGeneralAgreementVersion(params.id, item.version);
    if (!reverted) {
      toast.error("Unable to revert this agreement version.");
      return;
    }

    setLocalVersions(getLocalGeneralAgreementVersions(params.id));
    toast.success(`${item.version} restored as new ${reverted.currentVersion}.`);
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreement",
          [String(params.id)]: "Details",
          "version-history": "Version History",
        }}
      />

      <main
        className={`min-h-screen p-4 pb-24 lg:px-10 lg:py-9 ${
          isDark ? "bg-transparent text-white" : "bg-[#F4F5F7] text-black"
        }`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <button
          type="button"
          onClick={() =>
            isGeneralAgreement
              ? router.push(`/admin/agreements/details?id=${encodeURIComponent(params.id)}`)
              : router.push(
                  cameFromShoot && sourceShootId
                    ? `/admin/agreements/${params.id}?from=shoot&shootId=${encodeURIComponent(sourceShootId)}`
                    : `/admin/agreements/${params.id}`,
                )
          }
          className={`mb-7 inline-flex items-center gap-2 text-sm ${
            isDark ? "text-white/80" : "text-black/70"
          }`}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            Agreement History - {localAgreement?.agreementName || selectedRow.projectName || "Agreement"}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
            {isGeneralAgreement
              ? `General Agreement · Current ${localAgreement?.currentVersion || "v1.0"}`
              : `Creative Partner: ${selectedRow.cpName || "Creative Partner"}`}
          </p>
        </div>

        <section
          className={`rounded-2xl border p-5 ${
            isDark ? "border-[#2D2D2D] bg-[#101010]" : "border-[#E5E5E5] bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="border-l-4 border-[#E8D1AB] pl-3 text-lg font-medium">Version History</h2>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`h-9 min-w-[112px] rounded-full ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#DDD] bg-white"}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="previous">Previous</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className={`h-9 min-w-[130px] rounded-full ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#DDD] bg-white"}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Month</SelectItem>
                  {availableMonths.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={versionFilter} onValueChange={setVersionFilter}>
                <SelectTrigger className={`h-9 min-w-[100px] rounded-full ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#DDD] bg-white"}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {versions.map((item) => (
                    <SelectItem key={item.version} value={item.version}>{item.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`relative mt-5 rounded-lg border ${isDark ? "border-[#3D3D3D] bg-[#202020]" : "border-[#DDD] bg-[#FAFAFA]"}`}>
            <Search size={17} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-black/35"}`} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by Agreement Version..."
              className={`h-11 w-full bg-transparent pl-11 pr-4 text-sm outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/35"}`}
            />
          </div>
        </section>

        <div className="mt-5 space-y-4">
          {filtered.length > 0 ? filtered.map((item) => (
            <article key={`${item.version}-${item.createdAt}`} className={`rounded-xl border p-6 ${isDark ? "border-[#303030] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${item.current ? "bg-[#5A3A00] text-[#FFC400]" : isDark ? "bg-[#2A2A2A] text-white/55" : "bg-[#EEE] text-black/55"}`}>
                    {item.version.toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-medium">Version {item.version.replace(/^v/i, "")}</h3>
                      {item.current ? <span className="rounded-full border border-[#7A5A00] bg-[#2A2100] px-2 py-1 text-[10px] text-[#E6B800]">Current</span> : null}
                    </div>
                    <div className={`mt-2 flex flex-wrap gap-4 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                      <span className="inline-flex items-center gap-1"><UserRound size={14} /> {item.author}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {item.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => handlePreview(item)} className={`h-11 rounded-lg px-5 ${isDark ? "border-[#3D3D3D] bg-[#202020] text-white" : "border-[#DDD] bg-white text-black"}`}>Preview Agreement</Button>
                  {!item.current ? (
                    <Button type="button" onClick={() => handleRevert(item)} className="h-11 rounded-lg bg-[#E8D1AB] px-5 text-black hover:bg-[#D8C39E]">
                      Revert to Version {item.version.replace(/^v/i, "")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${isDark ? "border-[#3A3A3A] bg-[#171717] text-white/65" : "border-[#E5E5E5] bg-[#FAFAFA] text-black/65"}`}>
                <CircleAlert size={16} /> <strong>Reason:</strong> {item.reason}
              </div>
              {item.reason === "Initial agreement creation" ? <p className={`mt-4 text-sm italic ${isDark ? "text-white/35" : "text-black/35"}`}>Original Agreement created</p> : null}
            </article>
          )) : (
            <div className={`rounded-xl border px-6 py-14 text-center text-sm ${isDark ? "border-[#303030] bg-[#101010] text-white/40" : "border-[#E5E5E5] bg-white text-black/45"}`}>
              No agreement versions match the selected filters.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
