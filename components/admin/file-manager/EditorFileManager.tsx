"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, CalendarDays, ChevronDown, Clock3, Folder, Grid3X3, LayoutDashboard, Link, Link2, List,
  Download, MoreVertical, Search, Share2, Trash2, Upload,
} from "lucide-react";
import { EditorNextActionIcon } from "@/components/admin/file-manager/EditorNextActionIcon";
import ActionSuccessModal from "@/components/admin/ActionSuccessModal";
import { EditorFolderCard } from "@/components/admin/file-manager/EditorFolderCard";
import Topbar from "@/components/admin/Topbar";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { FileManagerViewToggle } from "@/components/admin/file-manager/FileManagerViewToggle";
import { EditorFileCard, type EditorFileCardData } from "@/components/admin/file-manager/EditorFileCard";
import { EditorFileDetailsPanel } from "@/components/admin/file-manager/EditorFileDetailsPanel";
import EmptyFolderState from "@/components/admin/file-manager/EmptyFolderState";
import UploadFilesModal from "@/components/admin/file-manager/UploadFilesModal";
import { EditorReviewStatus, EditorRevisionFlow, EditorTimelineDrawer } from "@/components/admin/file-manager/EditorReviewContent";
import { EditorActivityContent } from "@/components/admin/file-manager/EditorActivityContent";
import type { ViewMode } from "@/hooks/useViewMode";
import { toast } from "sonner";
import {
  editedDeliverableFiles,
  editorEditSubfolders,
  editorFileManagerFolders,
  editorFileCounts,
  editorLinkedDate,
  editorProjects,
  editorStatusColors,
  editorStatusTabs,
  selectedForEditsFiles,
} from "@/components/admin/file-manager/editorMockData";
const projects = editorProjects;
const statuses = editorStatusTabs;
const statusColor = editorStatusColors;

export default function EditorFileManager() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState("All");
  const editorProjectId = pathname.match(/\/admin\/file-manager\/([^/]+)/)?.[1];
  const selectedProject = projects.find((project) => project.id === editorProjectId) ?? null;
  const selectedStatus = activeStatus.replace(/\s*\(\d+\)$/, "");
  const visibleProjects = selectedStatus === "All"
    ? projects
    : projects.filter((project) => project.status === selectedStatus);

  if (selectedProject) {
    return <EditorFolderDetails key={selectedProject.id} project={selectedProject} onBack={() => router.push("/admin/file-manager/editor")} />;
  }

  return (
    <div className="min-h-full bg-[#101010] text-white">
      <Topbar pathname={pathname} />
      <main>
        <div className="mx-4 mb-20 mt-6 overflow-hidden rounded-2xl border border-[#252525] bg-[#0A0A0A] lg:mx-8">
          <div className="space-y-6 p-5 pb-20 md:p-8 lg:space-y-10 lg:p-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-[26px] font-semibold tracking-tight">File Manager</h1>
                <p className="mt-1 text-sm text-[#a1a1a1]">Here&apos;s what&apos;s happening with your shoots and requests today.</p>
              </div>
              <button className="flex h-14 items-center gap-3 self-start rounded-full border border-[#494949] px-5 text-[#c0c0c0]">Sort by Date <CalendarDays size={21} /></button>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 pb-7 xl:flex-row xl:items-center">
              <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl bg-[#191919] p-1">
                <button className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#171717]"><Folder size={18} />All Files</button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aaa]"><Link2 size={18} />Linked to Shoots <span className="rounded-full bg-[#e8d1ab] px-1.5 py-0.5 text-xs font-semibold text-black">3</span></button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aaa]"><Clock3 size={18} />Recent</button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aaa]"><Share2 size={18} />Shared</button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aaa]"><Trash2 size={18} />Trash</button>
              </div>
              <div className="text-sm text-[#888]">Storage Used <span className="ml-2 text-[#e8d1ab]">24.5 GB</span><span className="mx-2">/</span>100 GB</div>
            </div>

            <div className="mt-8 flex flex-col gap-3 xl:flex-row">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-[#363636] bg-[#202020] px-4"><Search size={19} className="text-[#777]" /><input 
                aria-label="Search files" 
                placeholder="Search by Project or Shoot ID..." 
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b6b6b]" /></div>
              <button className="flex h-12 items-center gap-2 rounded-lg border border-[#363636] bg-[#202020] px-6 text-sm">Status <ChevronDown size={16} /></button>
              <div className="flex h-12 items-center rounded-lg border border-[#363636] bg-[#202020] p-1">
                <button aria-label="Grid view" className="h-10 rounded-lg bg-[#e8d1ab] px-5 text-black">
                  <Grid3X3 size={20} />
                </button>
                <button aria-label="List view" className="px-5 text-[#ccc]">
                  <List size={20} />
                </button>
                <button aria-label="Board view" className="px-4 text-[#ccc]">
                  <LayoutDashboard size={20} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#292929] bg-[#171717] p-1.5">
              {statuses.map((status) => <button 
                key={status} 
                onClick={() => setActiveStatus(status)} 
                className={`shrink-0 rounded-lg px-4 py-3 text-sm ${activeStatus === status ? "bg-[#e8d1ab] font-medium text-[#171717]" : "text-[#b1b1b1]"}`}>{status}</button>)}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {visibleProjects.map((project) => <article key={project.name} className="overflow-hidden rounded-2xl border border-[#303030] bg-[#202020]">
                <div className={`relative h-[172px] bg-gradient-to-br ${project.tint} via-[#25211f] to-[#191919]`}>
                  <span className="absolute left-4 top-4 rounded-md border border-white/40 px-2 py-1.5 text-xs">#123456</span>
                  <span className={`absolute right-4 top-4 rounded-full border px-3 py-2 text-xs ${statusColor[project.status]}`}><span className="mr-1.5">&#9679;</span>{project.status}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">{project.name}</h2><p className="mt-1 text-sm text-[#cbb48f]">{project.service}</p></div><MoreVertical size={21} className="text-[#ddd]" /></div>
                  <div className="mt-4 flex gap-7"><div><p className="text-xs text-[#858585]">FILES</p><p className="mt-1 text-sm">{project.files}</p></div><div><p className="text-xs text-[#858585]">DUE DATE</p><p className="mt-1 text-sm">26 October, 2026</p></div></div>
                  <div className="mt-5 flex items-center gap-2"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#353535]"><div className="h-full rounded-full bg-[#e8d1ab]" style={{ width: `${project.progress}%` }} /></div><span className="text-sm font-semibold text-[#e8d1ab]">{project.progress}%</span></div>
                  <button 
                    onClick={() => router.push(`/admin/file-manager/${project.id}/overview`)}
                    className={`mt-4 h-12 w-full rounded-lg text-sm font-semibold ${project.name === "Nike Holiday Campaign" ? "bg-[#e8d1ab] text-[#171717]" : "border border-[#333] bg-[#2b2b2b]"}`}>View Workspace</button>
                </div>
              </article>)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EditorFolderDetails({ project, onBack }: { project: (typeof projects)[number]; onBack: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("Overview");
  const projectPath = `/admin/file-manager/${project.id}`;
  const projectOverviewPath = `${projectPath}/overview`;
  const isEditsFolderOpen = pathname === `${projectPath}/edits`;
  const selectedFilesFolderOpen = pathname === `${projectPath}/edits/selected-for-edits`;
  const editedDeliverablesOpen = pathname === `${projectPath}/edits/edited-deliverables`;
  const deliverableBatchOpen = pathname === `${projectPath}/edits/edited-deliverables/batch-1`;
  const editedDeliverablesScreenOpen = editedDeliverablesOpen || deliverableBatchOpen;
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  const [uploadedBatch, setUploadedBatch] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [allFilesDownloaded, setAllFilesDownloaded] = useState(false);
  const hasUploadedBatch = uploadedBatch || deliverableBatchOpen;
  const revisionFlowOpen = pathname.startsWith(`${projectPath}/edits/revision`);
  const revisionVersionOne = pathname === `${projectPath}/edits/revision/version-1`;
  const revisionVersionTwo = pathname === `${projectPath}/edits/revision/version-2`;
  const revisionStage = revisionVersionTwo ? "version-two" : revisionVersionOne ? "version-one" : "folders";
  const [revisionSubmitted, setRevisionSubmitted] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const tabs = ["Overview", "File Manager", "Review Status", "Activity"];
  const isNikeProject = project.name === "Nike Holiday Campaign";

  useEffect(() => {
    if (!approvalSubmitted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setApprovalSubmitted(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [approvalSubmitted]);

  const showTimelineButton = revisionFlowOpen || selectedFilesFolderOpen || editedDeliverablesOpen || (!isEditsFolderOpen && activeTab !== "Overview");
  const fileManagerPath = pathname.replace("/editor", "");

  const completeMockUpload = () => {
    setUploadModalOpen(false);
    setUploadedBatch(true);
    toast.success("Upload Completed. File Manager Updated your workspace", { duration: 3000 });
    router.push(revisionFlowOpen
      ? `${projectPath}/edits/revision/version-2`
      : `${projectPath}/edits/edited-deliverables/batch-1`);
  };

  const handleFolderBack = () => {
    if (revisionVersionTwo) {
      router.push(`${projectPath}/edits/revision/version-1`);
    } else if (revisionVersionOne) {
      router.push(`${projectPath}/edits/revision`);
    } else if (revisionFlowOpen) {
      router.push(`${projectPath}/edits`);
    } else if (deliverableBatchOpen) {
      router.push(`${projectPath}/edits/edited-deliverables`);
    } else if (editedDeliverablesOpen || selectedFilesFolderOpen) {
      router.push(`${projectPath}/edits`);
    } else if (isEditsFolderOpen) {
      router.push(projectOverviewPath);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-full bg-[#101010] text-white">
      <Topbar
        pathname={fileManagerPath}
        breadcrumbOverrides={{
          [project.id]: "Folder Details",
          edits: "Edits",
          "selected-for-edits": "Selected for Edits",
          "edited-deliverables": "Edited Deliverables",
          "batch-1": "Batch 1",
          revision: "Revision",
          "version-1": "Version 1",
          "version-2": "Version 2",
        }}
        actions={showTimelineButton ? (
          <button 
            onClick={() => setTimelineOpen(true)} 
            className="whitespace-nowrap rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#171717] shadow-[0_8px_24px_rgba(255,255,255,0.12)]">
            View Project Timeline
          </button>
        ) : undefined}
      />
      <main className="px-5 pb-28 pt-7 md:px-8 lg:px-10">
        <button 
          onClick={handleFolderBack}
          className="mb-6 inline-flex items-center gap-3 text-sm text-[#ddd] hover:text-white"><ArrowLeft size={22} />Back</button>

        <section 
          className={`flex flex-col justify-between gap-5 xl:flex-row xl:items-center ${isEditsFolderOpen ? "pb-7" : "pb-4"}`}>
          <div className="flex min-w-0 items-start gap-4 md:gap-5">
            <div 
              className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[18px] bg-[#c9e0ff] text-3xl font-bold text-black md:h-[96px] md:w-[96px] md:text-4xl">{isNikeProject ? "NH" : project.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#e8d1ab] md:text-lg">#123456 &middot; {project.service.toUpperCase()}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 md:gap-4"><h1 className="text-lg font-semibold md:text-xl">{project.name}</h1><span 
                className="inline-flex items-center gap-2 rounded-full bg-[#c7f8d8] px-3 py-1.5 text-sm font-medium text-[#09934b]"><Link size={17} />Linked</span></div>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 md:flex md:gap-6">
                <DetailMeta label="PROJECT / SHOOT" value={project.name} />
                <DetailMeta label="PRODUCER" value="Sam Rivera" />
                <DetailMeta label="EDITOR TYPE" value="External Editor" />
              </div>
            </div>
          </div>
          <div 
            className="self-start whitespace-nowrap rounded-full border border-[#a66d00] bg-[#8b5e00]/15 px-4 py-2 text-xs font-medium text-[#e3a421] md:px-5 md:py-2.5 md:text-base">Edits Due in 5 Days</div>
        </section>

        {revisionFlowOpen ? (
          <EditorRevisionFlow
            projectName={project.name}
            stage={revisionStage}
            onStageChange={(stage) => router.push(stage === "folders" ? `${projectPath}/edits/revision` : `${projectPath}/edits/revision/${stage === "version-one" ? "version-1" : "version-2"}`)}
            onUpload={() => setUploadModalOpen(true)}
            onReturnToReview={() => {
              setRevisionSubmitted(true);
              setActiveTab("Review Status");
              router.push(projectOverviewPath);
            }}
          />
        ) : deliverableBatchOpen ? (
          <EditorDeliverablesContent
            projectName={project.name}
            hasUploadedFiles={hasUploadedBatch}
            onRequestUpload={() => setUploadModalOpen(true)}
            approvalOpen={approvalModalOpen}
            submitted={approvalSubmitted}
            onCloseApproval={() => setApprovalModalOpen(false)}
            onSubmitApproval={() => {
              setApprovalModalOpen(false);
              setApprovalSubmitted(true);
            }}
            onCloseSubmitted={() => {
              setApprovalSubmitted(false);
              setActiveTab("Review Status");
              router.push(projectOverviewPath);
            }}
          />
        ) : editedDeliverablesOpen ? (
          <EditorDeliverablesContent
            projectName={project.name}
            hasUploadedFiles={hasUploadedBatch}
            onRequestUpload={() => setUploadModalOpen(true)}
          />
        ) : selectedFilesFolderOpen ? (
          <EditorSelectedFilesContent
            projectName={project.name}
            onDownload={() => setAllFilesDownloaded(true)}
          />
        ) : isEditsFolderOpen ? (
          <EditorEditsFolderContent
            projectName={project.name}
            onOpenSelectedFiles={() => router.push(`${projectPath}/edits/selected-for-edits`)}
            onOpenDeliverables={() => router.push(`${projectPath}/edits/edited-deliverables`)}
            onOpenRevisions={() => router.push(`${projectPath}/edits/revision`)}
          />
        ) : (
          <>
          <div className="mt-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-[#303030] bg-[#191919] p-1.5">
            {tabs.map((tab) => <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`shrink-0 rounded-lg px-4 py-3 text-sm md:px-6 md:text-base ${activeTab === tab ? "bg-[#e8d1ab] text-[#171717]" : "text-[#b5b5b5]"}`}>{tab}</button>)}
          </div>

          {activeTab === "File Manager" ? (
            <div className="mt-5">
              <EditorFilesSection onOpenEdits={() => router.push(`${projectPath}/edits`)} />
            </div>
          ) : activeTab === "Review Status" ? (
            <EditorReviewStatus projectName={project.name} revisionSubmitted={revisionSubmitted} />
          ) : activeTab === "Activity" ? (
            <EditorActivityContent />
          ) : activeTab === "Overview" ? (
            <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="overflow-hidden rounded-[22px] border border-[#252525] bg-[#111]">
                <div className="border-b border-[#292929] px-6 py-5 text-base font-semibold">
                  Editing Information
                </div>
                <div className="grid gap-x-8 gap-y-5 p-6 md:grid-cols-2 md:p-7">
                  <DetailMeta label="EDITING REQUIREMENTS" value="Campaign master + social cutdowns" />
                  <DetailMeta label="DELIVERABLES" value="7 final exports and editable archive" />
                  <DetailMeta label="REQUIRED FORMAT" value="4K ProRes + H.264 social" />
                  <DetailMeta label="DUE DATE" value="26 Oct, 2026" accent />
                  <DetailMeta label="REVISION REQUIREMENTS" value="2 rounds included" />
                  <DetailMeta
                    label="BRIEF / INSTRUCTIONS"
                    value="Match approved treatment and preserve project direction"
                    truncate
                  />
                </div>
              </section>
              <EditorProjectTimeline />
            </div>
          ) : (
            <section className="mt-5 min-h-56 rounded-[22px] border border-[#252525] bg-[#111] p-6 text-sm text-[#aaa]">
              {activeTab === "Review Status"
                ? "Project review status will appear here."
                : "Project activity will appear here."}
            </section>
          )}
          </>
        )}
      </main>

      <UploadFilesModal
        isOpen={uploadModalOpen}
        folderName={project.name}
        mockOnly
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={completeMockUpload}
      />

      {timelineOpen && <EditorTimelineDrawer activeStepIndex={revisionSubmitted ? 4 : hasUploadedBatch ? 2 : 1} onClose={() => setTimelineOpen(false)} />}
      {!revisionFlowOpen && activeTab !== "Review Status" && activeTab !== "Activity" && <footer 
        className="sticky bottom-0 z-40 flex h-24 min-h-24 w-full items-center justify-between gap-4 overflow-hidden border-t border-[#292929] bg-[#171717]/95 px-5 py-4 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <EditorNextActionIcon className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#e8d1ab]">Next Action</p>
            <p className="mt-1 line-clamp-2 text-sm md:text-base">
              {editedDeliverablesScreenOpen && hasUploadedBatch
                ? "75 out of 200 Edited Files are Uploaded and Ready to Send for Approval"
                : editedDeliverablesScreenOpen
                  ? "After Downloading Files You need to Upload Files in Edited Deliverables Folder"
                  : selectedFilesFolderOpen
                    ? "200 Files Are Ready to Edits"
                    : isEditsFolderOpen
                      ? "Download Files from Edits Folder Selected by Client which are Ready for Edits"
                      : activeTab === "File Manager"
                        ? "Open Edits to view edit files which are selected by clients"
                        : "Client as Requested 200 Edits"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {deliverableBatchOpen && <span className="rounded-full border border-[#5967ae] bg-[#252a47] px-3 py-2 text-xs text-[#a8b4ff]">In Progress</span>}
          <button
            onClick={() => {
              if (!isEditsFolderOpen && activeTab === "File Manager") {
                router.push(`${projectPath}/edits`);
              } else if (editedDeliverablesScreenOpen && !hasUploadedBatch) {
                setUploadModalOpen(true);
              } else if (editedDeliverablesScreenOpen && hasUploadedBatch) {
                setApprovalModalOpen(true);
              } else if (selectedFilesFolderOpen) {
                router.push(`${projectPath}/edits/edited-deliverables`);
              } else if (isEditsFolderOpen) {
                router.push(`${projectPath}/edits/selected-for-edits`);
              } else if (activeTab === "Overview") {
                setActiveTab("File Manager");
              }
            }}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-[#e8d1ab] px-7 text-sm font-semibold text-[#171717]"
          >
            {editedDeliverablesScreenOpen && !hasUploadedBatch ? (
              <>
                <Upload size={16} />
                {allFilesDownloaded ? "Upload and Send" : "Upload Files"}
              </>
            ) : editedDeliverablesScreenOpen && hasUploadedBatch ? (
              "Send for Approval"
            ) : selectedFilesFolderOpen ? (
              "Start Editing"
            ) : isEditsFolderOpen ? (
              "View Folder"
            ) : activeTab === "File Manager" ? (
              "Continue"
            ) : (
              "Get Started & View Folder"
            )}
          </button>
        </div>
      </footer>
      }
    </div>
  );
}

function EditorFilesSection({ onOpenEdits }: { onOpenEdits: () => void }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#252525] bg-[#0b0b0b]">
      <div className="border-b border-[#292929] px-6 py-5">
        <h2 className="text-base font-semibold">Files &amp; Versions</h2>
        <p className="mt-1 text-sm text-[#858585]">Access follows existing File Manager permissions. Important project files cannot be deleted.</p>
      </div>
      <div className="flex flex-col justify-between gap-4 border-b border-[#292929] px-6 py-5 md:flex-row md:items-center">
        <div className="flex h-12 w-full max-w-[500px] items-center gap-3 rounded-lg border border-[#363636] bg-[#202020] px-4"><Search size={19} className="text-[#777]" /><input 
          aria-label="Search folders" 
          placeholder="Search" 
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#777]" /></div>
        <div className="flex h-12 w-fit items-center rounded-lg border border-[#363636] bg-[#202020] p-1">
          <button aria-label="Grid view" className="h-10 rounded-lg bg-[#e8d1ab] px-5 text-black"><Grid3X3 size={20} /></button>
          <button aria-label="List view" className="px-5 text-[#ccc]"><List size={20} /></button>
          <button aria-label="Board view" className="px-4 text-[#ccc]"><LayoutDashboard size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 p-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {editorFileManagerFolders.map((folder) => (
          <EditorFolderCard
            key={folder.title}
            title={folder.title}
            fileCount={folder.fileCount}
            category="Holiday Campaign"
            isLinked
            lastOpened="2 hours ago"
            userInitials="DP"
            onOpen={folder.title === "Edits" ? onOpenEdits : () => { }}
          />
        ))}
      </div>
    </section>
  );
}

function EditorEditsFolderContent({ projectName, onOpenSelectedFiles, onOpenDeliverables, onOpenRevisions }: { projectName: string; onOpenSelectedFiles: () => void; onOpenDeliverables: () => void; onOpenRevisions: () => void }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[22px] border border-[#252525] bg-[#0b0b0b]">
      <div className="border-b border-[#292929] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#292929] text-[#e8d1ab]"><Folder size={16} /></span>
          <h2 className="text-sm font-medium text-[#e8d1ab]">Edits (3 Folders)</h2>
          <span className="rounded-full border border-[#315342] bg-[#17221c] px-3 py-0.5 text-[10px] text-[#54cc83]">Latest</span>
        </div>
        <LinkedProjectInfo projectName={projectName} />
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-[#292929] px-6 py-5">
        <div 
          className="relative flex h-12 w-full max-w-[500px] items-center gap-1 rounded-lg border border-[#363636] bg-[#202020] px-4 transition-all duration-300">
          <Search className="h-[18px] w-[18px] shrink-0 text-white/40" />
          <input 
            aria-label="Search folders" 
            placeholder="Search" 
            className="h-full w-full min-w-0 bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-[#E8D1AB]" />
        </div>
        <div className="flex items-center gap-2">
          <BasicDropdown 
            label="Status" 
            value="Status" 
            options={["All", "Edits Needed", "Uploaded", "In Progress"]} 
            onChange={() => { }} 
            styles="text-white text-xs lg:text-sm" />
          <FileManagerViewToggle 
            isOpen={false} 
            setIsOpen={() => { }} 
            viewMode="grid" 
            setViewMode={() => { }} 
            isDark />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 p-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {editorEditSubfolders.map((folder) => (
          <EditorFolderCard
            key={folder.title}
            title={folder.title}
            fileCount={folder.fileCount}
            category="Holiday Campaign"
            isLinked
            lastOpened="Jan 10, 2026 10:00 AM"
            userInitials="JS"
            hoverMessage={folder.title === "Selected for Edits" ? "Edits Needed" : folder.title === "Edited Deliverables" ? "Upload Edited Files" : "Review Revisions"}
            onOpen={folder.title === "Selected for Edits" ? onOpenSelectedFiles : folder.title === "Edited Deliverables" ? onOpenDeliverables : onOpenRevisions}
          />
        ))}
      </div>
    </section>
  );
}

function EditorDeliverablesContent({ projectName, hasUploadedFiles, onRequestUpload, approvalOpen = false, submitted = false, onCloseApproval, onSubmitApproval, onCloseSubmitted }: { projectName: string; hasUploadedFiles: boolean; onRequestUpload: () => void; approvalOpen?: boolean; submitted?: boolean; onCloseApproval?: () => void; onSubmitApproval?: () => void; onCloseSubmitted?: () => void }) {
  const uploadedFiles = hasUploadedFiles ? editorFileCounts.editedUploaded : 0;
  const files = editedDeliverableFiles;
  const progress = Math.min(100, Math.round((uploadedFiles / 200) * 100));

  return (
    <div className="mt-8 space-y-5">
      <section className="rounded-[22px] border border-[#252525] bg-[#0b0b0b] p-5 md:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#e8d1ab]">
              Deliverable Progress
            </p>
            <h2 className="mt-1 text-sm font-semibold">Edited photography</h2>
          </div>
          <span className="text-3xl font-medium text-[#e8d1ab]">{progress}%</span>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#343434]">
          <div
            className="h-full rounded-full bg-[#e8d1ab] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <ProgressStat label="Required" value={String(editorFileCounts.editedRequired)} />
          <ProgressStat label="Uploaded" value={String(uploadedFiles)} />
          <ProgressStat label="Remaining" value={String(Math.max(editorFileCounts.editedRequired - uploadedFiles, 0))} />
          <ProgressStat label="Status" value={hasUploadedFiles ? "Ready for Approval" : "Not Started"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#252525] bg-[#111]">
        <div className="border-b border-[#292929] p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292929] text-white">
              <Folder size={18} />
            </span>
            <h2 className="text-sm font-medium text-[#e8d1ab]">
              Edited Deliverables ({hasUploadedFiles ? `${uploadedFiles} Items Uploaded` : "0 Files"})
            </h2>
            {hasUploadedFiles && (
              <span className="rounded-full border border-[#315342] bg-[#17221c] px-3 py-0.5 text-[10px] text-[#54cc83]">
                Batch 1
              </span>
            )}
          </div>
          <LinkedProjectInfo projectName={projectName} />
        </div>
        <div 
          className="flex flex-col justify-between gap-3 border-b border-[#292929] px-5 py-4 md:flex-row md:items-center md:px-6">
          <div className="flex h-10 w-full max-w-[380px] items-center gap-3 rounded-lg border border-[#363636] bg-[#202020] px-4"><Search size={17} className="shrink-0 text-[#777]" /><input 
            aria-label="Search edited deliverables" 
            placeholder="Search" 
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#777]" /></div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasUploadedFiles && <button 
              className="flex h-10 items-center gap-2 rounded-lg border border-[#363636] bg-[#202020] px-3 text-xs text-white"><span className="h-4 w-4 rounded border border-[#666]" />Select All</button>}
            {hasUploadedFiles && <button
              onClick={onRequestUpload}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#e8d1ab] px-4 text-xs font-semibold text-[#171717]"
            ><Upload size={15} />Upload Files</button>}
            <FileManagerViewToggle 
              isOpen={false} 
              setIsOpen={() => { }} 
              viewMode="grid" 
              setViewMode={() => { }} 
              isDark />
          </div>
        </div>
        {hasUploadedFiles ? (
          <div className="grid grid-cols-1 items-start gap-3 p-4 md:grid-cols-2 md:p-5 2xl:grid-cols-3">
            {files.map((file, index) => (
              <EditorFileCard key={`${file.id}-${index}`} file={file} />
            ))}
          </div>
        ) : (
          <div className="p-4 md:p-5">
            <EmptyFolderState
              isDark
              title="Upload your Edited Files"
              description="Upload and organize edited files for review."
            />
          </div>
        )}
      </section>

      {approvalOpen && (
        <ApprovalModal
          uploadedFiles={uploadedFiles}
          onClose={onCloseApproval ?? (() => { })}
          onSubmit={onSubmitApproval ?? (() => { })}
        />
      )}
      <ActionSuccessModal
        isOpen={submitted}
        onSubmit={onCloseSubmitted ?? (() => { })}
        title={`${uploadedFiles} Edited Files Submitted for Review`}
        subtext="Your edited files have been submitted to the internal team for review. You'll be notified once the review is complete."
        buttonText="Review Files"
      />
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#292929] pl-3 first:border-0 first:pl-0">
      <p className="text-[10px] uppercase text-[#888]">{label}</p>
      <p className="mt-1 text-xs text-white">{value}</p>
    </div>
  );
}

function ApprovalModal({ uploadedFiles, onClose, onSubmit }: { uploadedFiles: number; onClose: () => void; onSubmit: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const remainingFiles = Math.max(editorFileCounts.editedRequired - uploadedFiles, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        className="w-full max-w-[815px] overflow-hidden rounded-2xl border border-[#383838] bg-black"
      >
        <header className="flex items-center justify-between border-b border-[#333] px-7 py-6">
          <h2 id="approval-title" className="text-2xl font-semibold">Submit for Approval</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#292526]"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </header>
        <div className="space-y-6 p-7">
          <div className="flex items-center gap-5">
            <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-[#c9e0ff] text-3xl font-bold text-black">
              NH
            </div>
            <div>
              <h3 className="text-xl font-semibold">Nike Holiday Campaign</h3>
              <p className="mt-1 text-sm font-semibold text-[#e8d1ab]">
                #123456 &middot; PHOTO RETOUCHING
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#333] rounded-xl border border-[#333] py-4">
            {[["Required", "200"], ["Uploaded Files", String(uploadedFiles)], ["Remaining Files", String(remainingFiles)]].map(([label, value]) => (
              <div key={label} className="px-4">
                <p className="text-xs uppercase text-[#888]">{label}</p>
                <p className="mt-1 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <fieldset className="rounded-xl border border-[#444] px-4 pb-4">
            <legend className="px-2 text-sm text-[#999]">
              Submission Notes <span className="text-[#e8d1ab]">(Optional)</span>
            </legend>
            <textarea
              defaultValue="Full Retouching pass complete and ready for the internal review"
              className="h-28 w-full resize-none bg-transparent pt-2 text-sm outline-none"
            />
          </fieldset>
          <div className="rounded-xl bg-[#191711] px-5 py-4 text-xs uppercase tracking-wide text-[#e8d1ab]">
            Maya Chen and the post production team will be notified. Your editor status will update automatically
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={onClose} className="rounded-lg bg-[#202020] py-3 text-sm">
              Cancel
            </button>
            <button onClick={onSubmit} className="rounded-lg bg-[#e8d1ab] py-3 text-sm font-semibold text-black">
              Submit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function EditorSelectedFilesContent({ projectName, onDownload }: { projectName: string; onDownload: () => void }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EditorFileCardData | null>(null);
  const files = selectedForEditsFiles;

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-[22px] border border-[#252525] bg-[#0b0b0b]">
        <div className="border-b border-[#292929] px-5 py-5 md:px-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292929] text-white"><Folder size={18} /></span>
            <h2 className="text-sm font-medium text-[#e8d1ab]">Selected for Edits (200 Files)</h2>
          </div>
          <LinkedProjectInfo projectName={projectName} />
        </div>

        <div 
          className="flex flex-col justify-between gap-3 border-b border-[#292929] px-5 py-4 md:flex-row md:items-center md:px-6">
          <div className="flex h-10 w-full max-w-[380px] items-center gap-3 rounded-lg border border-[#363636] bg-[#202020] px-4">
            <Search size={17} className="shrink-0 text-[#777]" />
            <input 
              aria-label="Search files" 
              placeholder="Search" 
              className="w-full bg-transparent text-xs outline-none placeholder:text-[#777]" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onDownload}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#363636] bg-[#202020] px-3 text-xs text-white">
              <Download size={15} />Download All
            </button>
            <FileManagerViewToggle 
              isOpen={isViewMenuOpen} 
              setIsOpen={setIsViewMenuOpen} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              isDark />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-3 p-4 md:grid-cols-2 md:p-5 2xl:grid-cols-3">
          {files.map((file, index) => (
            <EditorFileCard
              key={`${file.title}-${index}`}
              file={file}
              onOpen={() => setSelectedFile(file)}
            />
          ))}
        </div>
      </section>
      {selectedFile && <EditorFileDetailsPanel file={selectedFile} onClose={() => setSelectedFile(null)} onDownload={onDownload} />}
    </>
  );
}

function LinkedProjectInfo({ projectName }: { projectName: string }) {
  return (
    <div className="rounded-md border border-[#383838] bg-[#191919] px-3 py-3.5 text-xs leading-4 text-[#d8d8d8]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#09264d]"><Link size={18} /></span>
        <div>
          <p className="text-sm leading-5">Linked to: {projectName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs leading-4 text-[#bcbcbc]"><CalendarDays size={14} />{editorLinkedDate}</p>
        </div>
      </div>
    </div>
  );
}

function EditorProjectTimeline() {
  const steps = ["Not Started", "In Progress", "Submitted", "Revision Requested", "Approved"];

  return (
    <aside className="h-fit overflow-hidden rounded-[22px] border border-[#252525] bg-[#191919]">
      <h2 className="border-b border-[#292929] bg-[#111] px-7 py-6 text-xl font-semibold">Project Timeline</h2>
      <ol className="px-8 py-6">
        {steps.map((step, index) => {
          const isActive = index < 2;
          return (
            <li key={step} className="relative flex min-h-[88px] gap-5">
              <span 
                className={`z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${isActive ? "bg-[#e8d1ab] text-[#171717]" : "bg-[#0d0d0d] text-[#888]"}`}>{index + 1}</span>
              <span className={`pt-2 text-base md:text-lg ${isActive ? "text-[#e8d1ab]" : "text-[#aaa]"}`}>{step}</span>
              {index < steps.length - 1 && <span className="absolute left-[21px] top-[48px] h-[36px] border-l border-dashed border-[#777]" />}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function DetailMeta({ label, value, accent = false, truncate = false }: { label: string; value: string; accent?: boolean; truncate?: boolean }) {
  return <div className="min-w-0"><p className="text-xs text-[#777] md:text-sm">{label}</p><p 
    className={`mt-1 text-sm md:text-base ${accent ? "font-semibold text-[#e8d1ab]" : "text-[#eee]"} ${truncate ? "truncate" : ""}`}>{value}</p></div>;
}
