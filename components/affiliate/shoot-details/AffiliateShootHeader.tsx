"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn, getInitials } from "@/lib/utils";
import { getPaymentStatusMeta, getProjectTimeText } from "@/lib/utils/shootDetails";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";

interface AffiliateShootHeaderProps {
  activeTab?: string;
  project?: any;
  onBack?: () => void;
  projectId?: string;
}

export default function AffiliateShootHeader({ activeTab = "Overview", project, onBack, projectId }: AffiliateShootHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [workspaceFolderLink, setWorkspaceFolderLink] = React.useState("");
  const [workspaceFileCount, setWorkspaceFileCount] = React.useState<number | null>(null);
  const paymentStatus = getPaymentStatusMeta(project?.payment_status, project?.payment_id);
  const folderLink = workspaceFolderLink;
  const isDark = !mounted || theme === "dark";
  const projectTimeText = getProjectTimeText(project);
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : "No files available";
  const resolvedStatusLabel =
    project?.timeline_label ||
    timelineStageToHeaderLabel(resolveTimelineStage(project));

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadWorkspaceSummary = async () => {
      if (!projectId) return;

      try {
        const response = await fileManagerApi.getExternalWorkspace(projectId);
        if (!isMounted) return;

        setWorkspaceFolderLink(response.workspace.consoleUrl || "");
        setWorkspaceFileCount(
          typeof response.workspace.fileCount === "number" ? response.workspace.fileCount : null
        );
      } catch (error) {
        if (!isMounted) return;
        setWorkspaceFolderLink("");
        setWorkspaceFileCount(null);
      }
    };

    loadWorkspaceSummary();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const formatShootDate = (dateValue?: string) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTotalValue = () => {
    const amount =
      project?.total_paid_amount ??
      project?.quote_total ??
      project?.budget ??
      0;

    const parsedAmount = Number(amount);
    return Number.isNaN(parsedAmount) ? "$0.00" : `$${parsedAmount.toLocaleString()}`;
  };

  const getLocationText = () => {
    if (typeof project?.event_location === "string" && project.event_location.trim()) {
      return project.event_location;
    }

    if (project?.event_location?.address) {
      return project.event_location.address;
    }

    return [project?.location, project?.city, project?.state, project?.country]
      .filter(Boolean)
      .join(", ") || "No location specified";
  };

  const handleBack = () => {
    // if (onBack) {
    //   onBack();
    // } else {
    router.back();
    // }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className={`lg:hidden transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Top Bar */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`transition-colors flex items-center gap-2 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        {/* <div className="flex gap-3">
          <Button variant="outline" className="bg-[#2C2C2C] border-none text-red-400 hover:bg-[#3D3D3D] hover:text-red-300 rounded-lg h-10 px-4 gap-2">
            <CircleX className="w-4 h-4" /> Cancel Shoot
          </Button>
          <Button variant="outline" className="bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#2C2C2C] rounded-lg h-10 px-4 gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
          <Button className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium">
            Edit Shoot
          </Button>
        </div> */}
      </div>

      {/* Hero Section */}
      <div className={`transition-all duration-300 lg:rounded-2xl mb-6 lg:mb-10`}>
        <div className="flex gap-5">
          <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center text-sm lg:text-2xl font-bold ${isDark ? "bg-[#D6E4FF] text-[#1E40AF]" : "bg-[#C8E1FF] text-[#1E40AF]"
            }`}>
            {project?.project_name ? getInitials(project?.project_name) : "NA"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                {project?.project_name || "Untitled Project"}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {resolvedStatusLabel || "Pending"}
              </span>
            </div>
            {project?.skills_needed && project.skills_needed !== "N/A" && (
              <p className={`${isDark ? "text-[#888888]" : "text-[#666666]"} font-normal text-sm lg:text-base mb-2`}>({project.skills_needed})</p>
            )}
            <p className={`text-sm leading-relaxed max-w-3xl transition-colors whitespace-pre-line leading-relaxed ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
              {(project?.description || "No description available.").replace(/Matching Method: ai_matchmaker/gi, "").trim()}
            </p>

            <div className={`hidden lg:block w-full h-px my-6 transition-colors ${isDark ? "bg-[#222222]" : "bg-[#E5E5E5]"}`} />

            <div className={`flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base mt-4 lg:mt-0 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"
              }`}>
              <div className="flex gap-2">
                <span>Shoot Date :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {formatShootDate(project?.event_date)}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Time :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {projectTimeText}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Total Value :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {formatTotalValue()}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Payment Status :</span>
                <span className={cn("font-medium", paymentStatus.className)}>
                  {paymentStatus.label}
                </span>
              </div>
            </div>

            <div className={`flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base mt-2 lg:mt-4 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
              <div className="flex gap-2">
                <span className="text-nowrap">Folder Link :</span>
                <a
                  href={folderLink || "#"}
                  target={workspaceFolderLink ? "_blank" : undefined}
                  rel={workspaceFolderLink ? "noopener noreferrer" : undefined}
                  className={cn(
                    "underline underline-offset-4 transition-all",
                    workspaceFolderLink
                      ? "text-[#E5D5B8] decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8]"
                      : "text-white/50 decoration-white/10 pointer-events-none"
                  )}
                >
                  {folderLink || "No Link Available"}
                  {folderLink && (activeTab === "Pre_Production" || activeTab === "Post_Production") && (
                    <span className={isDark ? "text-white" : "text-black"}> / {activeTab.replace("_", " ")}</span>
                  )}
                </a>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span className="text-nowrap">Shoot Files :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{shootFilesText}</span>
              </div>
            </div>

            <div className={`mt-2 lg:mt-4 text-sm lg:text-base flex gap-2 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
              <span className="text-nowrap">Location :</span>
              <span className={`${isDark ? "text-white" : "text-black"} font-medium whitespace-pre-wrap`}>
                {getLocationText()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
