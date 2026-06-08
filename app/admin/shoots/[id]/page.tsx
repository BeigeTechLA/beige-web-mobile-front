"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Topbar from "@/components/admin/Topbar";
import ShootHeader from "@/components/admin/shoot-details/ShootHeader";
import ProjectTeam from "@/components/admin/shoot-details/ProjectTeam";
import AssignedCP from "@/components/admin/shoot-details/AssignedCP";
import MeetingSchedule from "@/components/admin/shoot-details/MeetingSchedule";
import ProjectTimeline from "@/components/admin/shoot-details/ProjectTimeline";
import ShootTabs from "@/components/admin/shoot-details/ShootTabs";
import PreProductionTab from "@/components/admin/shoot-details/PreProductionTab";
import PostProductionTab from "@/components/admin/shoot-details/PostProductionTab";
import MeetingOverviewChart from "@/components/admin/shoot-details/MeetingOverviewChart";
import MessagesTab from "@/components/admin/shoot-details/MessagesTab";
import { MissingFieldsModal } from "@/components/admin/MissingFieldsModal";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { toast } from "sonner";
import { adminApi, salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { CircleX, Loader2, X, SlidersHorizontal, Eye, FileText } from "lucide-react"; // Added X icon for closing
import { Button } from "@/src/components/landing/ui/button";
import { useTheme } from "next-themes";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import { usePreviewInvoiceMutation } from "@/lib/redux/features/sales/salesApi";
import { buildBeigeInvoiceUrl } from "@/lib/invoiceUrl";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

type SkillOption = {
  id?: number | string;
  name?: string;
  skill_name?: string;
  title?: string;
};

type ProjectDetails = {
  project_name?: string;
  skills_needed?: string | Array<string | number> | null;
  status?: number;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_start_time?: string;
  total_paid_amount?: string | number;
  payment_status?: string | null;
  payment_id?: string | number | null;
  converted_sales_quote_id?: string | number | null;
  event_location?: string;
  location?: string | { address?: string } | null;
  city?: string;
  state?: string;
  country?: string;
  needs_attention?: {
    required?: boolean;
    missing_fields?: string[];
  } | null;
  lead_id?: string | number;
  assignedCrew?: unknown[];
  assigned_crews?: unknown[];
  assigned_post_production_members?: unknown[];
  [key: string]: unknown;
};

type QuoteVersionItem = {
  version_number?: number | string | null;
  is_current?: boolean | null;
  approval_status?: string | null;
  change_request_status?: string | null;
  review_status?: string | null;
  [key: string]: unknown;
};

const isUsableQuoteVersion = (version: QuoteVersionItem) => {
  const status = String(
    version.approval_status ||
    version.change_request_status ||
    version.review_status ||
    ""
  ).trim().toLowerCase();

  return !status || status === "approved";
};

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const [activeTab, setActiveTab] = useState("Overview");
  const activeTab = searchParams.get("tab") || "Overview";

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, { isLoading: isViewingInvoice }] = usePreviewInvoiceMutation();

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState(false);
  const [isQuotePreviewOpen, setIsQuotePreviewOpen] = useState(false);
  const [isLoadingQuotePreview, setIsLoadingQuotePreview] = useState(false);
  const [quotePreviewData, setQuotePreviewData] = useState<SalesQuoteDetailData | null>(null);


  // 3. Helper to update the URL when a tab is clicked
  const handleTabChange = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const shootBasePath = pathname?.startsWith("/sales") ? "/sales/shoots" : "/admin/shoots";
  const bookingId =
    project?.booking_id || project?.stream_project_booking_id || id;
  const convertedSalesQuoteId = String(project?.converted_sales_quote_id || "").trim() || null;
  const missingFields = Array.isArray(project?.needs_attention?.missing_fields)
    ? project.needs_attention.missing_fields
    : [];
  const hasFormDetails = !missingFields.includes("onboarding_form");
  const handlePreviewConvertedQuote = async () => {
    if (!convertedSalesQuoteId) {
      toast.error("Converted quote is not available");
      return;
    }

    setIsQuotePreviewOpen(true);
    setIsLoadingQuotePreview(true);
    setQuotePreviewData(null);

    try {
      const versionsResponse = await salesApi.getQuoteVersions(convertedSalesQuoteId);
      const versionsData = Array.isArray(versionsResponse?.data)
        ? versionsResponse.data
        : versionsResponse?.data?.versions || [];

      const latestVersion =
        versionsData.find((version: QuoteVersionItem) => version?.is_current && isUsableQuoteVersion(version)) ||
        versionsData
          .filter((version: QuoteVersionItem) => isUsableQuoteVersion(version))
          .reduce((latest: QuoteVersionItem | null, candidate: QuoteVersionItem) => {
            const latestNo = Number(latest?.version_number || 0);
            const candidateNo = Number(candidate?.version_number || 0);
            return candidateNo > latestNo ? candidate : latest;
          }, null) ||
        null;

      const versionId =
        latestVersion?.version_number != null ? String(latestVersion.version_number) : null;

      const detailResponse = versionId
        ? await salesApi.getQuoteVersionDetail(convertedSalesQuoteId, versionId)
        : await salesApi.getQuoteDetail(convertedSalesQuoteId);

      const quoteDetail = unwrapSalesQuoteDetail(detailResponse?.data ?? null);

      if (!quoteDetail) {
        throw new Error("Quote preview data is unavailable");
      }

      setQuotePreviewData(quoteDetail);
    } catch (error) {
      console.error("Failed to load converted quote preview", error);
      toast.error(error instanceof Error ? error.message : "Failed to load quote preview");
      setIsQuotePreviewOpen(false);
    } finally {
      setIsLoadingQuotePreview(false);
    }
  };

  useEffect(() => {
    const fetchProjectAndSkills = async () => {
      try {
        const [projectResponse, skillsResponse] = await Promise.all([
          adminApi.getProjectDetails(id),
          adminApi.getSkills()
        ]);

        // 1. Create Skills Map
        const skillsMap: Record<number, string> = {};
        if (skillsResponse && skillsResponse.data) {
          const skillsList: SkillOption[] = Array.isArray(skillsResponse.data)
            ? skillsResponse.data
            : (skillsResponse.data?.data || []);
          skillsList.forEach((skill) => {
            const name = skill.name || skill.skill_name || skill.title;
            if (skill.id && name) skillsMap[Number(skill.id)] = name;
          });
        }

        const responseData = projectResponse?.data || null;

        const projectData: ProjectDetails | undefined =
          responseData?.project || responseData || projectResponse;

        if (projectData) {
          // 3. Map Skills Needed to Names
          let skillsText = "";
          if (projectData.skills_needed) {
            try {
              let parsedIds = projectData.skills_needed;

              // Only attempt to parse if it's a string that looks like JSON (starts with [ or {)
              if (typeof projectData.skills_needed === 'string' &&
                (projectData.skills_needed.trim().startsWith('[') || projectData.skills_needed.trim().startsWith('{'))) {
                try {
                  parsedIds = JSON.parse(projectData.skills_needed);
                } catch {
                  // If parsing fails, keep it as a string
                  parsedIds = projectData.skills_needed;
                }
              }

              if (Array.isArray(parsedIds)) {
                skillsText = (parsedIds as Array<string | number>)
                  .map(id => skillsMap[Number(id)])
                  .filter(Boolean)
                  .join(", ");
              } else if (typeof parsedIds === 'string') {
                // If it's a plain string, use it directly
                skillsText = parsedIds;
              }
            } catch (e) {
              console.error("Unexpected error processing skills_needed:", e);
              skillsText = projectData.skills_needed;
            }
          }

          setProject({
            ...projectData,
            pricing_breakdown: responseData?.pricing_breakdown || projectData?.pricing_breakdown || null,
            manual_payment_summary: responseData?.manual_payment_summary || projectData?.manual_payment_summary || null,
            lead_details: responseData?.lead_details || projectData?.lead_details || null,
            assignedCrew: responseData?.assignedCrew || projectData?.assignedCrew || projectData?.assigned_crews || [],
            assignedPostProductionMembers:
              responseData?.assignedPostProductionMembers ||
              projectData?.assignedPostProductionMembers ||
              projectData?.assigned_post_production_members ||
              [],
            skills_needed: skillsText || projectData.skills_needed
          });
        }
      } catch (error) {
        console.error("Failed to fetch shoot details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProjectAndSkills();
  }, [id]);

  if (!mounted) return null;

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm("Are you sure you want to delete this shoot? This action cannot be undone.")) {
      try {
        const response = await adminApi.deleteProject(id);
        if (response?.success || response?.message === "Project deleted successfully") { // Adjust based on actual API response
          toast.success("Shoot deleted successfully");
          router.push('/admin/shoots');
        } else {
          toast.error(response?.error || "Failed to delete shoot");
        }
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("An error occurred while deleting");
      }
    }
  };

  const handleMissingFieldsSaved = (updated: {
    shootId: string;
    location?: string;
    bookingType: "single_day" | "multi_day";
    dateLabel?: string;
    rawDate?: number;
    startTime?: string;
    endTime?: string;
    bookingDays?: Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;
    remainingMissingFields: string[];
  }) => {
    setProject((prev) => {
      if (!prev) return prev;

      const next: ProjectDetails = {
        ...prev,
        needs_attention:
          updated.remainingMissingFields.length > 0
            ? {
              required: true,
              missing_fields: updated.remainingMissingFields,
            }
            : undefined,
      };

      if (updated.location) {
        next.location = updated.location;
        next.event_location = updated.location;
      }

      if (updated.bookingType === "single_day" && updated.rawDate) {
        next.event_date = new Date(updated.rawDate).toISOString().slice(0, 10);
        next.start_time = updated.startTime || next.start_time;
        next.end_time = updated.endTime || next.end_time;
      }

      if (updated.bookingType === "multi_day" && updated.bookingDays?.length) {
        const firstDay = updated.bookingDays[0];
        next.event_date = firstDay.date;
        next.start_time = firstDay.start_time;
        next.end_time = firstDay.end_time;
        next.booking_days = updated.bookingDays.map((day) => ({
          date: day.date,
          event_date: day.date,
          start_time: day.start_time,
          end_time: day.end_time,
        }));
      }

      return next;
    });

    if (updated.remainingMissingFields.length === 0) {
      setIsMissingFieldsModalOpen(false);
    }
  };

  const handleViewInvoice = async () => {
    const numericBookingId = Number(bookingId);

    if (!Number.isFinite(numericBookingId) || numericBookingId <= 0) {
      toast.error("Booking ID is not available for invoice preview");
      return;
    }

    try {
      const response = await previewInvoice({ booking_id: numericBookingId }).unwrap();

      if (!response?.success) {
        toast.error(typeof response?.message === "string" ? response.message : "Failed to preview invoice");
        return;
      }

      const hostedInvoiceUrl = response.data?.invoiceUrl || null;
      const invoicePdfUrl = response.data?.invoicePdf || null;
      const isManualInvoice =
        String(invoicePdfUrl || "").includes("manual=1") ||
        String(hostedInvoiceUrl || "").includes("manual=1");
      const brandedPdfUrl = buildBeigeInvoiceUrl(numericBookingId, {
        manual: isManualInvoice,
        cacheBust: true,
      });
      const brandedDownloadUrl = buildBeigeInvoiceUrl(numericBookingId, {
        manual: isManualInvoice,
        download: true,
        cacheBust: true,
      });

      if (!hostedInvoiceUrl && !invoicePdfUrl) {
        toast.error("Preview URL not available");
        return;
      }

      if (hostedInvoiceUrl && !invoicePdfUrl) {
        window.open(hostedInvoiceUrl, "_blank", "noopener,noreferrer");
      }

      if (invoicePdfUrl) {
        if (isManualInvoice) {
          window.open(brandedPdfUrl, "_blank", "noopener,noreferrer");
        } else {
          const link = document.createElement("a");
          link.href = brandedDownloadUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.click();
        }
      }

      toast.success(isManualInvoice ? "Invoice opened" : "Invoice opened and download started");
    } catch (error) {
      console.error("Failed to preview invoice", error);
      toast.error(error instanceof Error ? error.message : "Failed to preview invoice");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/30"}`} size={40} />
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <Button
              onClick={handleViewInvoice}
              disabled={isViewingInvoice}
              className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border transition-colors ${isDark
                ? "bg-[#1A1A1A] border-[#E8D1AB]/20 text-[#E8D1AB] hover:bg-[#2C2417]"
                : "bg-black border-black text-white hover:bg-black/80"
                }`}
            ><FileText size={14} />
              {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
            </Button>
            {convertedSalesQuoteId ? (
              <Button
                onClick={handlePreviewConvertedQuote}
                className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed w-full"
              >
                <Eye size={14} />
                Preview Quote
              </Button>
            ) : null}
            <Button
              className="text-sm font-semibold text-[#BD1010] h-12 px-4 lg:px-7 rounded-lg bg-[#FFC3C3] border border-white/20 hover:bg-[#FFC3C3]/80 transition-colors "
              onClick={handleDelete}
            >
              <CircleX /> Cancel Shoot
            </Button>
            <Button
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
            <Button onClick={() => router.push(`${shootBasePath}/${id}/edit-booking`)} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
              Edit Shoot
            </Button>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-64px)] overflow-hidden relative">
        {/* Main Content (Left Scroll Window) */}
        <div className="flex-1 min-h-0 w-full p-4 pb-[260px] lg:p-10 lg:pb-10 overflow-y-auto no-scrollbar">
          <ShootHeader
            activeTab={activeTab}
            project={project}
            projectId={id}
            convertedSalesQuoteId={convertedSalesQuoteId}
            missingFields={missingFields}
            hasFormDetails={hasFormDetails}
            onOpenMissingFields={() => setIsMissingFieldsModalOpen(true)}
          />
          <Button
            className={`lg:hidden w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border mb-3 transition-all ${isDark
              ? "bg-[#202020] text-white border-white/20 hover:bg-[#202020]/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              : "bg-white text-black border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            onClick={() => setIsTimelineOpen(true)}
          >
            View Project Timeline
          </Button>

          <div className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"} `}>
            <ShootTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <div className={`${activeTab === "Meetings" ? "pb-6 lg:pb-9" : "py-6 lg:py-9"}`}>
              {activeTab === "Overview" && (
                <>
                  <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProjectTeam projectId={id} assignedMembers={project?.assigned_post_production_members} />
                    <AssignedCP projectId={id} leadId={project?.lead_id} assignedCrew={project?.assignedCrew || project?.assigned_crews || []} />
                  </div>
                  <div className={`mt-5 lg:mt-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
                    <MeetingSchedule orderId={id} />
                  </div>
                </>
              )}

              {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
                <div className="px-5">
                  <PreProductionTab projectId={String(bookingId)} />
                </div>
              )}

              {(activeTab === "Post_Production" || activeTab === "Post Production") && (
                <div className="px-5">
                  <PostProductionTab projectId={String(bookingId)} />
                </div>
              )}

              {activeTab === "Meetings" && (
                <>
                  <MeetingSchedule orderId={id} />
                  <div className={`px-5 border-t ${isDark ? "border-t-[#FFFFFF80]" : "border-t-black/40"}`}>
                    <MeetingOverviewChart />
                  </div>
                </>
              )}

              {activeTab === "Messages" && (
                <div className="px-5">
                  <MessagesTab
                    role="admin"
                    bookingId={project?.booking_id || project?.stream_project_booking_id || id}
                    assignedCrew={project?.assignedCrew || project?.assigned_crews || []}
                    projectName={project?.project_name}
                    salesRepName={project?.lead_details?.assigned_sales_rep?.name || null}
                    clientName={project?.project?.client?.name || project?.client?.name || null}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </div>

          <MissingFieldsModal
            isOpen={isMissingFieldsModalOpen}
            onClose={() => setIsMissingFieldsModalOpen(false)}
            isDark={isDark}
            fields={missingFields}
            shootId={id}
            initialShootData={project}
            onSaved={handleMissingFieldsSaved}
          />
        </div>

        {/* Right Sidebar (Timeline Desktop Only) */}
        <div className="hidden lg:block h-full overflow-y-auto no-scrollbar shrink-0">
          <ProjectTimeline status={resolveTimelineStage(project as ProjectDetails & { timeline_status?: number })} />
        </div>

        {/* Mobile Timeline Overlay Drawer */}
        {isTimelineOpen && (
          <div className={`lg:hidden fixed inset-0 z-[100] flex justify-end ${isDark ? "bg-black/80" : "bg-white/80"}`}>
            <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />
            <div className={`relative max-w-sm w-full h-full shadow-2xl animate-in slide-in-from-right duration-300 ${isDark ? "bg-[#111111]" : "bg-white"}`}>
              <button onClick={() => setIsTimelineOpen(false)} className={`absolute top-3 right-3 z-10 ${isDark ? "text-white/60" : "text-black/60"}`}>
                <X size={20} />
              </button>
              <div className="h-full overflow-y-auto">
                <ProjectTimeline status={resolveTimelineStage(project as ProjectDetails & { timeline_status?: number })} />
              </div>
            </div>
          </div>
        )
        }

        {/* --- FLOATING MOBILE BUTTONS --- */}
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f]' : 'bg-[#F4F5F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
          {/* View Invoice Button */}
          <Button
            onClick={handleViewInvoice}
            disabled={isViewingInvoice}
            className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#E8D1AB] text-black hover:bg-[#d4c3a3] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-black text-white hover:bg-black/80 border border-black'}`}
          >
            {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
          </Button>

          {/* Preview Quote Button */}
          {convertedSalesQuoteId ? (
            <Button
              onClick={handlePreviewConvertedQuote}
              className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#18321D] text-[#86EFAC] hover:bg-[#1D3B23] border border-[#86EFAC]/20 shadow-[0_8px_30px_rgb(0,0,0,0.35)]' : 'bg-[#F0FFF4] text-[#166534] hover:bg-[#E7F8EC] border border-[#86EFAC]/30'}`}
            >
              <Eye size={18} /> Preview Quote
            </Button>
          ) : null}

          {/* Grid Row: Cancel & Edit Operations */}
          <div className="flex gap-2 w-full">
            <Button
              className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#FFF0F0] text-[#D32F2F] hover:bg-[#FFE5E5] border border-[#FFC3C3]'}`}
            >
              Cancel Shoot
            </Button>

            <Button
              onClick={() => router.push(`${shootBasePath}/${id}/edit-booking`)}
              className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]' : 'bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] border border-[#d4c3a3]'}`}
            >
              Edit Shoot
            </Button>
          </div>

          {/* Conditional Form Details Button */}
          {hasFormDetails ? (
            <Button
              onClick={() => router.push(`${shootBasePath}/${id}/form-details`)}
              className={`w-full h-14 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#111] text-[#E5D5B8] hover:bg-[#151515] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#F3F3F3] text-zinc-600 hover:bg-[#EAEAEA] border border-[#E3E3E3]'}`}
            >
              <Eye size={18} /> View Form Details
            </Button>
          ) : null}
        </div>

        <QuotePreviewModal
          open={isQuotePreviewOpen}
          onClose={() => setIsQuotePreviewOpen(false)}
          quote={quotePreviewData}
          quoteId={convertedSalesQuoteId}
          isLoading={isLoadingQuotePreview}
        />
      </div>
    </>
  );
}
