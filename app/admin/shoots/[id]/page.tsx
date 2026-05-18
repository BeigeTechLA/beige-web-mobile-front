"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter,useSearchParams, usePathname } from 'next/navigation';
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
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { CircleX, Loader2, X, SlidersHorizontal, Eye, FileText } from "lucide-react"; // Added X icon for closing
import { Button } from "@/src/components/landing/ui/button";
import { useTheme } from "next-themes";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import { usePreviewInvoiceMutation } from "@/lib/redux/features/sales/salesApi";

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
  event_location?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_id?: string | number;
  assignedCrew?: unknown[];
  assigned_crews?: unknown[];
  assigned_post_production_members?: unknown[];
  [key: string]: unknown;
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
      const apiBase = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "");
      const proxiedPdfUrl = `${apiBase}/sales/invoice-pdf/${numericBookingId}?t=${Date.now()}`;
      const proxiedDownloadUrl = `${apiBase}/sales/invoice-pdf/${numericBookingId}?download=1&t=${Date.now()}`;
      const isManualInvoice =
        String(invoicePdfUrl || "").includes("manual=1") ||
        String(hostedInvoiceUrl || "").includes("manual=1");

      if (!hostedInvoiceUrl && !invoicePdfUrl) {
        toast.error("Preview URL not available");
        return;
      }

      if (hostedInvoiceUrl) {
        window.open(hostedInvoiceUrl, "_blank", "noopener,noreferrer");
      }

      if (invoicePdfUrl) {
        if (isManualInvoice) {
          window.open(invoicePdfUrl || proxiedPdfUrl, "_blank", "noopener,noreferrer");
        } else {
          const link = document.createElement("a");
          link.href = proxiedDownloadUrl || proxiedPdfUrl;
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
                : "bg-white border-[#E5E5E5] text-[#666] hover:bg-zinc-50"
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

      <div className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 flex h-full -m-4 lg:-m-10 relative">
        {/* Main Content (Left) */}
        <div className="flex-1 p-4 pb-30 lg:p-10 lg:pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ">
          <ShootHeader activeTab={activeTab} project={project} projectId={id} />
          <Button
            className={`lg:hidden w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border mb-3 transition-all ${isDark
              ? "bg-[#202020] text-white border-white/20 hover:bg-[#202020]/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              : "bg-white text-black border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            onClick={() => setIsTimelineOpen(true)}
          >
            View Project Timeline
          </Button>

          <div className={`rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"} `}>
            <ShootTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <div className="px-5 py-6 lg:py-9">
              {activeTab === "Overview" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProjectTeam projectId={id} assignedMembers={project?.assigned_post_production_members} />
                    <AssignedCP projectId={id} leadId={project?.lead_id} assignedCrew={project?.assignedCrew || project?.assigned_crews || []} />
                  </div>
                  <MeetingSchedule orderId={id} />
                </>
              )}

          {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
            <PreProductionTab projectId={String(bookingId)} />
          )}

          {(activeTab === "Post_Production" || activeTab === "Post Production") && (
            <PostProductionTab projectId={String(bookingId)} />
          )}

          {activeTab === "Meetings" && (
            <>
              <MeetingSchedule orderId={id} />
              <MeetingOverviewChart />
            </>
          )}

          {activeTab === "Messages" && (
            <MessagesTab
              role="admin"
              bookingId={project?.booking_id || project?.stream_project_booking_id || id}
              assignedCrew={project?.assignedCrew || project?.assigned_crews || []}
              projectName={project?.project_name}
              salesRepName={project?.lead_details?.assigned_sales_rep?.name || null}
              clientName={project?.project?.client?.name || project?.client?.name || null}
            />
          )}
          </div>
          </div>
        </div>

        {/* Right Sidebar (Timeline) */}
        <div className="hidden lg:block h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <ProjectTimeline status={resolveTimelineStage(project as ProjectDetails & { timeline_status?: number })} />
        </div>

        {/* Mobile Timeline Overlay (Conditional) */}
        {
          isTimelineOpen && (
            <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 flex justify-end">
              {/* Close Backdrop Click */}
              <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

              <div className={`relative max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                <button onClick={() => setIsTimelineOpen(false)} className={`absolute top-3 right-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
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
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f]' : 'bg-white border-t border-[#E3E3E3] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
          <Button
            onClick={handleViewInvoice}
            disabled={isViewingInvoice}
            className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#E8D1AB] text-black hover:bg-[#d4c3a3] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-black text-white hover:bg-black/80 border border-black'}`}
          >
            {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
          </Button>
          <div className="flex gap-2">
            <Button className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#FFF0F0] text-[#D32F2F] hover:bg-[#FFE5E5] border border-[#FFC3C3]'}`}>
              Cancel Shoot
            </Button>
            <Button
              onClick={() => router.push(`${shootBasePath}/${id}/edit-booking`)}
              className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] border border-[#d4c3a3]'}`}
            >
              Edit Shoot
            </Button>
          </div>
          <Button
            onClick={() => router.push(`${shootBasePath}/${id}/form-details`)}
            className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#111] text-[#E5D5B8] hover:bg-[#151515] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#F3F3F3] text-zinc-600 hover:bg-[#EAEAEA] border border-[#E3E3E3]'}`}
          >
            <Eye size={18} /> View Form Details
          </Button>
        </div>
      </div>
    </>
  );
}
