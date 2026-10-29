"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Pen, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import Topbar from "@/components/admin/Topbar";
import GeneralAgreementHistoryTable from "@/components/admin/agreements/AgreementsTable";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import { agreementApi, AgreementDocument, AgreementTemplate } from "@/lib/api/agreements";
import type { AgreementData } from "@/components/admin/agreements/AgreementsTable";

type TabType = "All" | "Pending" | "Accepted" | "Rejected" | "Cancelled";
type AgreementConfirmation = { type: "delete-general" } | { type: "cancel-shoot"; agreement: AgreementData };

const tabs: { label: string; value: TabType }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
  { label: "Cancelled", value: "Cancelled" },
];

export default function AdminAgreementsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [agreementType, setAgreementType] = useState<"general" | "shoot">("general");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAgreements, setTotalAgreements] = useState(0);
  const [agreementsRefreshKey, setAgreementsRefreshKey] = useState(0);
  const [agreements, setAgreements] = useState<AgreementDocument[]>([]);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(true);
  const [loadedRequest, setLoadedRequest] = useState<string | null>(null);
  const [agreementsError, setAgreementsError] = useState<string | null>(null);
  const [activeGeneralAgreement, setActiveGeneralAgreement] = useState<AgreementTemplate | null>(null);
  const [isGeneralAgreementMenuOpen, setIsGeneralAgreementMenuOpen] = useState(false);
  const [agreementConfirmation, setAgreementConfirmation] = useState<AgreementConfirmation | null>(null);
  const [isAgreementActionSubmitting, setIsAgreementActionSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ignore = false;
    const requestKey = `${activeTab}:${agreementType}:${currentPage}:${debouncedSearch}`;
    const load = async () => {
      setIsLoadingAgreements(true);
      setAgreementsError(null);
      try {
        const response = await agreementApi.listAdminAgreementsPaged({
          type: agreementType,
          status: activeTab === "All" ? undefined : activeTab === "Pending" ? "pending_acceptance" : activeTab.toLowerCase(),
          page: currentPage,
          limit: 10,
          search: debouncedSearch.trim() || undefined,
        });
        if (ignore) return;
        const pageData = response.data;
        if (!pageData || !Array.isArray(pageData.items) || !Number.isFinite(pageData.total)) {
          throw new Error("Invalid agreements response");
        }
        const lastAvailablePage = Math.ceil(pageData.total / 10);
        if (lastAvailablePage > 0 && currentPage > lastAvailablePage) {
          setCurrentPage(lastAvailablePage);
          return;
        }
        setAgreements(pageData.items);
        setTotalAgreements(pageData.total);
      } catch {
        if (ignore) return;
        setAgreements([]);
        setTotalAgreements(0);
        setAgreementsError("We couldn’t load agreements. Please try again.");
      } finally {
        if (!ignore) {
          setLoadedRequest(requestKey);
          setIsLoadingAgreements(false);
        }
      }
    };
    void load();
    return () => { ignore = true; };
  }, [activeTab, agreementType, currentPage, debouncedSearch, agreementsRefreshKey]);

  useEffect(() => {
    let ignore = false;
    const loadTemplate = async () => {
      try {
        const templates = await agreementApi.listGeneralTemplates();
        if (ignore) return;
        setActiveGeneralAgreement(templates.data.find((template) => template.status === "published") || null);
      } catch (error) {
        if (!ignore) toast.error(error instanceof Error ? error.message : "Unable to load general agreement");
      }
    };
    void loadTemplate();
    return () => { ignore = true; };
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const formatAgreementDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  const createNewVersion = () => {
    if (!activeGeneralAgreement) return;
    router.push(`/admin/agreements/create-general-agreement?clone_from=${activeGeneralAgreement.agreement_template_id}`);
  };
  const createNewGeneralAgreement = () => {
    sessionStorage.removeItem("admin-general-agreement-draft");
    router.push("/admin/agreements/create-general-agreement");
  };
  const deleteGeneralAgreement = async () => {
    if (!activeGeneralAgreement) return;
    await agreementApi.deleteGeneralTemplate(activeGeneralAgreement.agreement_template_id);
    sessionStorage.removeItem("admin-general-agreement-draft");
    setActiveGeneralAgreement(null);
    setIsGeneralAgreementMenuOpen(false);
    toast.success("General agreement deleted");
  };
  const confirmAgreementAction = async () => {
    if (!agreementConfirmation) return;
    setIsAgreementActionSubmitting(true);
    try {
      if (agreementConfirmation.type === "delete-general") {
        await deleteGeneralAgreement();
      } else {
        const item = agreementConfirmation.agreement;
        await agreementApi.cancelAgreement(Number(item.id));
        setAgreements((current) => current.map((agreement) => agreement.agreement_document_id === Number(item.id)
          ? { ...agreement, status: "cancelled", is_current: false } : agreement));
        setAgreementsRefreshKey((key) => key + 1);
        toast.success(item.rawStatus === "draft" ? "Draft discarded" : "Agreement cancelled; the CP request remains assigned");
      }
      setAgreementConfirmation(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete this agreement action");
    } finally {
      setIsAgreementActionSubmitting(false);
    }
  };
  if (!mounted) return null;

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <Button
              onClick={createNewGeneralAgreement}
              disabled={Boolean(activeGeneralAgreement)}

              title={activeGeneralAgreement ? "A general agreement already exists. Use Edit to create its next version." : "Create General Agreement"}
              className={`h-12 px-4 lg:px-7 transition-colors font-medium ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}`}
            >
              Create General Agreement
            </Button>
          </>
        }
      />

      <div className={`min-h-screen pb-30 p-4 lg:p-6 lg:px-10 lg:py-9 transition-colors duration-300 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}>
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Agreements
            </h1>
            <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black/60"}`}>
              Review and manage all agreements in one place
            </p>
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 lg:px-6 w-full transition-colors duration-300 mt-5 lg:mt-9 flex flex-col lg:flex-row lg:justify-between ${isDark
            ? "bg-[#0E0E0D] border-[#252523] text-white"
            : "bg-white border-[#E5E5E5] text-[#202020]"
            }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
            <div>
              <div className="flex gap-2 items-center text-xs font-medium">
                <p className="uppercase text-[#E8D1AB]">General Agreement</p>
                <div className={`${activeGeneralAgreement ? "text-[#00D492] bg-[#00D492]/10 border-[#00D492]/20" : "text-[#BA6605] bg-[#FFF4C9]/10 border-[#FFF4C9]/20"} border px-2 py-[2px] rounded-full`}>
                  {activeGeneralAgreement ? "Active" : "Not published"}
                </div>
              </div>
              <p className="font-medium text-sm lg:text-base font-semibold">
                {activeGeneralAgreement?.title || "No published general agreement"}
              </p>
              <p className="text-xs text-[#8E8E8E]">
                {activeGeneralAgreement ? `Version ${activeGeneralAgreement.version}` : "Publish a general agreement before requesting CP acceptance."}
              </p>
            </div>
          </div>
          <div className="flex gap-5 items-center">
            <div className="flex flex-col gap-[2px] items-end">
              <p className="text-xs text-[#8E8E8E] uppercase">Effective</p>
              <p className="text-sm font-medium">{formatAgreementDate(activeGeneralAgreement?.effective_at)}</p>
            </div>
            <div className="flex flex-col gap-[2px] items-end">
              <p className="text-xs text-[#8E8E8E] uppercase">Updated</p>
              <p className="text-sm font-medium">{formatAgreementDate(activeGeneralAgreement?.published_at)}</p>
            </div>
            <div className="flex flex-col gap-[2px] items-end">
              <p className="text-xs text-[#8E8E8E] uppercase">Sections</p>
              <p className="text-sm font-medium">
                {Array.isArray((activeGeneralAgreement?.content_json as { sections?: unknown[] } | undefined)?.sections)
                  ? (activeGeneralAgreement?.content_json as { sections: unknown[] }).sections.length
                  : "—"}
              </p>
            </div>
            <Button
              disabled={!activeGeneralAgreement}
              title={activeGeneralAgreement ? "Edit active agreement" : "No published general agreement to edit"}
              onClick={createNewVersion}
              className={`rounded-md border py-1 px-3.5 h-8 ${isDark ? "bg-[#1A1A19] border-[#252523]" : "bg-[#fff] border-[#E5E5E5]"
                }`}
            >
              <Pen size={14} />
              Edit
            </Button>
            <div className="relative">
              <Button
                disabled={!activeGeneralAgreement}
                onClick={() => setIsGeneralAgreementMenuOpen((open) => !open)}
                className={`rounded-md border p-1.5 w-8 h-8 ${isDark ? "border-[#252523]" : "bg-[#fff] border-[#E5E5E5]"}`}
              >
                <ChevronDown size={16} className="shrink-0" />
              </Button>
              {isGeneralAgreementMenuOpen && activeGeneralAgreement && (
                <div className={`absolute right-0 top-10 z-30 w-48 rounded-lg border p-1 shadow-xl ${isDark ? "border-[#3D3D3D] bg-[#202020]" : "border-[#E5E5E5] bg-white"}`}>
                  <button type="button" onClick={createNewVersion} className={`w-full rounded-md px-3 py-2 text-left text-xs font-medium ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}>
                    Create new version
                  </button>
                  <button type="button" onClick={() => { setIsGeneralAgreementMenuOpen(false); setAgreementConfirmation({ type: "delete-general" }); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} /> Delete agreement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 my-6">
          <div className="flex flex-col gap-4">
            <TabsSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab as TabType);
                setCurrentPage(1);
              }}
            />

            {/* New Section  */}
            <div className="flex flex-col gap-3">
              {/* Search field */}
              <div
                className={`relative flex w-full items-center gap-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#202020] border-white/20" : "bg-[#fff] border-[#E5E5E5]"
                  }`}
              >
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Search by agreement..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className={`h-12 w-full min-w-0 pl-10 pr-4 rounded-xl text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                    ? "bg-[#202020] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                    : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                    }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <GeneralAgreementHistoryTable
          isLoading={isLoadingAgreements || loadedRequest !== `${activeTab}:${agreementType}:${currentPage}:${debouncedSearch}`}
          errorMessage={agreementsError}
          activeType={agreementType}
          onTypeChange={(type) => { setAgreementType(type); setCurrentPage(1); }}
          currentPage={currentPage}
          pageSize={10}
          totalCount={totalAgreements}
          onPageChange={setCurrentPage}
          emptyMessage={agreements.length === 0 && debouncedSearch.trim()
            ? "No agreements match your search. Try a different name or keyword."
            : activeTab === "All"
              ? "There are no agreements to display yet."
              : `No ${activeTab.toLowerCase()} agreements found.`}
          generalData={agreements.filter((agreement) => agreement.agreement_type === "general").map((agreement) => ({
            id: String(agreement.agreement_document_id),
            creativePartnerName: agreement.snapshot?.creative_partner?.name || "Unknown Creative Partner",
            avatarInitials: (agreement.snapshot?.creative_partner?.name || "CP").split(" ").map((name) => name[0]).join("").slice(0, 2),
            date: formatAgreementDate(agreement.created_at),
            projectName: "General Agreement",
            projectId: agreement.title,
            role: agreement.snapshot?.creative_partner?.role || "—",
            version: agreement.display_version,
            compensation: Number(agreement.compensation_amount || 0),
            status: agreement.status === "accepted" ? "Accepted" : agreement.status === "rejected" ? "Not Accepted" : agreement.status === "draft" ? "Draft" : agreement.status === "cancelled" ? "Cancelled" : agreement.status === "expired" ? "Expired" : "Pending",
            rawStatus: agreement.status,
            isCurrent: agreement.is_current,
          }))}
          shootData={agreements.filter((agreement) => agreement.agreement_type === "shoot").map((agreement) => ({
            id: String(agreement.agreement_document_id),
            creativePartnerName: agreement.snapshot?.creative_partner?.name || "Unknown Creative Partner",
            avatarInitials: (agreement.snapshot?.creative_partner?.name || "CP").split(" ").map((name) => name[0]).join("").slice(0, 2),
            date: formatAgreementDate(agreement.created_at),
            projectName: agreement.snapshot?.shoot?.name || agreement.title,
            projectId: String(agreement.booking_id || "—"),
            role: agreement.snapshot?.creative_partner?.role || "—",
            version: agreement.display_version,
            compensation: Number(agreement.compensation_amount || 0),
            status: agreement.status === "accepted" ? "Accepted" : agreement.status === "rejected" ? "Not Accepted" : agreement.status === "draft" ? "Draft" : agreement.status === "cancelled" ? "Cancelled" : agreement.status === "expired" ? "Expired" : "Pending",
            rawStatus: agreement.status,
            isCurrent: agreement.is_current,
            bookingId: agreement.booking_id,
            assignmentId: agreement.assignment_id,
          }))}
          onActionClick={(item) => router.push(`/admin/agreements/agreement-details?agreement_id=${item.id}`)}
          onRevise={(item) => {
            if (item.bookingId && item.assignmentId) router.push(`/admin/shoots/${item.bookingId}/shoot-agreement?revise_from=${item.id}`);
          }}
          onCancel={(item) => {
            setAgreementConfirmation({ type: "cancel-shoot", agreement: item });
          }}
        />

        <ActionModal
          isOpen={agreementConfirmation !== null}
          onClose={() => setAgreementConfirmation(null)}
          onConfirm={confirmAgreementAction}
          isLoading={isAgreementActionSubmitting}
          tone="danger"
          title={agreementConfirmation?.type === "delete-general"
            ? "Delete this General Agreement?"
            : agreementConfirmation?.agreement.rawStatus === "draft" ? "Discard this draft?" : "Cancel this agreement?"}
          description={agreementConfirmation?.type === "delete-general"
            ? "This agreement can only be deleted before it has been presented to a Creative Partner. This action cannot be undone."
            : agreementConfirmation?.agreement.rawStatus === "draft"
              ? "This draft will be discarded and will not be available to the Creative Partner."
              : "The Creative Partner will no longer be able to review or accept this agreement. Their CP request stays assigned, so you can create and send another version."}
          confirmLabel={agreementConfirmation?.type === "delete-general"
            ? "Delete Agreement"
            : agreementConfirmation?.agreement.rawStatus === "draft" ? "Discard Draft" : "Cancel Agreement"}
        />

        {/* Floating Mobile Button */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={createNewGeneralAgreement}
            disabled={Boolean(activeGeneralAgreement)}
            title={activeGeneralAgreement ? "A general agreement already exists. Use Edit to create its next version." : "Create General Agreement"}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Create New Agreement
          </Button>
        </div>
      </div>
    </>
  );
}
