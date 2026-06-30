"use client";

import React, { useState, useEffect } from "react";
import { User, Folder, Calendar, FolderOpen, FileEdit, CheckCircle, FileCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { fileManagerApi } from "@/lib/fileManagerApi";
import type { PostProductionTimelineDetails, RevisionVersionTimelineDetails } from "@/lib/types";
import {
  getTimelineDetailsFromPostProductionFiles,
  getTimelineDetailsFromRevisionFiles,
} from "@/lib/utils/projectTimelineDetails";

const steps = [
  { id: 1, label: "Initiated", icon: User, status: "completed", line: true },
  { id: 2, label: "Pre_Production", icon: Folder, status: "current", line: true },
  { id: 3, label: "Shoot Day", icon: Calendar, status: "pending", line: true },
  { id: 4, label: "Post_Production", icon: FolderOpen, status: "pending", line: true },
  { id: 5, label: "Revision", icon: FileEdit, status: "pending", line: true },
  { id: 6, label: "Completed", icon: CheckCircle, status: "pending", line: true },
  { id: 7, label: "Assets Delivered", icon: FileCheck, status: "pending", line: false },
];

type ProjectTimelineProps = {
  status?: number;
  projectId?: string | number;
  postProduction?: PostProductionTimelineDetails | null;
  revisionVersions?: RevisionVersionTimelineDetails[] | null;
};

const isTimelineTrue = (value: unknown) => {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
};

const getRevisionVersionNumber = (version: RevisionVersionTimelineDetails) => {
  return version.versionNumber ?? version.version_number ?? version.version ?? version.currentVersion ?? version.current_version;
};

export default function ProjectTimeline({ status = 0, projectId, postProduction, revisionVersions }: ProjectTimelineProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filePostProduction, setFilePostProduction] = useState<PostProductionTimelineDetails | null>(null);
  const [fileRevisionVersions, setFileRevisionVersions] = useState<RevisionVersionTimelineDetails[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("[ProjectTimeline] received timeline sub-items", {
      projectId,
      postProduction,
      revisionVersions,
      filePostProduction,
      fileRevisionVersions,
    });
  }, [projectId, postProduction, revisionVersions, filePostProduction, fileRevisionVersions]);

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    const loadTimelineFileDetails = async () => {
      try {
        const [postFilesResponse, revisionFilesResponse] = await Promise.all([
          fileManagerApi.getExternalWorkspaceFiles(projectId, "post"),
          fileManagerApi.getExternalWorkspaceFiles(projectId, "post", "Edits/Revisions").catch(() => null),
        ]);

        if (!active) return;

        const postDetails = getTimelineDetailsFromPostProductionFiles(postFilesResponse);
        const revisionDetails = getTimelineDetailsFromRevisionFiles(revisionFilesResponse);
        setFilePostProduction(postDetails.postProduction);
        setFileRevisionVersions(revisionDetails.revisionVersions);
      } catch (error) {
        console.warn("Failed to load ProjectTimeline file details:", error);
      }
    };

    loadTimelineFileDetails();

    return () => {
      active = false;
    };
  }, [projectId]);

  const isDark = !mounted || (resolvedTheme === "dark" || theme === "dark");

  // Timeline status mapping (0-7):
  // 0 Initiated, 1 Pre Production, 2 Shoot Day, 3 Post Production,
  // 4 Revision, 5 Completed, 6 Assets Delivered, 7 Cancelled.
  // Backward compatible with legacy booking.status values (0-5).

  const getCurrentStep = () => {
    if (status === 7) return 1;
    if (status === 0) return 1;
    if (status === 1) return 2;
    if (status === 2) return 3;
    if (status === 3) return 4;
    if (status === 4) return 5;
    if (status === 5) return 6;
    if (status >= 6) return 7;
    return 1;
  };

  if (!mounted) return null;

  const currentStepId = getCurrentStep();
  const effectivePostProduction = {
    ...(filePostProduction || {}),
    ...(postProduction || {}),
    rawFilesUploaded:
      postProduction?.rawFilesUploaded ??
      postProduction?.raw_files_uploaded ??
      filePostProduction?.rawFilesUploaded ??
      filePostProduction?.raw_files_uploaded,
  } as PostProductionTimelineDetails;
  const effectiveRevisionVersions = Array.isArray(revisionVersions) && revisionVersions.length > 0
    ? revisionVersions
    : fileRevisionVersions;
  const revisionItems = Array.isArray(effectiveRevisionVersions)
    ? [...effectiveRevisionVersions].sort((a, b) => Number(getRevisionVersionNumber(a) ?? 0) - Number(getRevisionVersionNumber(b) ?? 0))
    : [];

  const getSubItems = (label: string) => {
    if (label === "Post_Production") {
      const items: string[] = [];
      const rawFilesUploaded = isTimelineTrue(effectivePostProduction?.rawFilesUploaded) || isTimelineTrue(effectivePostProduction?.raw_files_uploaded);
      const editingStatus = effectivePostProduction?.editingStatus ?? effectivePostProduction?.editing_status;

      if (rawFilesUploaded) {
        items.push("Raw Files uploaded");
      }
      if (editingStatus === "in_progress") {
        items.push("Editing - In Progress");
      }
      if (editingStatus === "completed") {
        items.push("Editing - Completed");
      }
      return items;
    }

    if (label === "Revision") {
      return revisionItems
        .map(getRevisionVersionNumber)
        .filter((versionNumber) => versionNumber !== undefined && versionNumber !== null)
        .map((versionNumber) => `Version ${versionNumber}`);
    }

    return [];
  };

  const renderSubItems = (items: string[]) => {
    if (items.length === 0) return null;

    return (
      <div className="flex flex-col gap-5 py-3">
        {items.map((item) => (
          <div key={item} className="relative flex items-center">
            <span className={`absolute -left-9 h-px w-5 border-t border-dashed ${isDark ? "border-[#B8B8B8]" : "border-[#999999]"}`} />
            <span className={`text-sm font-medium leading-5 ${isDark ? "text-white/45" : "text-[#8A8A8A]"}`}>
              {item}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`h-full lg:w-80 shrink-0 mt-1 pt-8 lg:pt-6 transition-colors duration-300 border-l ${isDark ? "bg-[#111111] border-[#222222]" : "bg-[#FFFFFF] border-[#D8D8D8]"}`}>
      <h3 className={`px-6 py-3 text-lg font-bold lg:my-8 border-y transition-colors duration-300 ${isDark ? "text-white bg-[#101010] border-[#3A3A3A]" : "text-black bg-[#F4F5F7] border-[#D8D8D8]"}`}>
        Project Timeline
      </h3>

      <div className="p-6 flex flex-col gap-0.5">
        {steps.map((step) => {
          const isCompleted = step.id < currentStepId;
          const isCurrent = step.id === currentStepId;
          const isActive = isCompleted || isCurrent;
          const subItems = getSubItems(step.label);

          return (
            <div key={step.id} className="relative">
              <div className="relative grid grid-cols-[2.5rem_1fr] gap-4">
                {/* Icon Column */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive
                    ? 'bg-[#E8D1AB] border-[#E8D1AB] text-black scale-110 shadow-lg shadow-[#E8D1AB]/10'
                    : isDark
                      ? 'bg-transparent border-[#333333] text-[#666666]'
                      : 'bg-transparent border-[#CCCCCC] text-[#999999]'
                    }`}>
                    <step.icon size={18} />
                  </div>
                </div>

                {/* Label Column */}
                <div className="pt-2">
                  <p className={`text-base font-medium leading-none transition-colors ${isActive
                    ? (isDark ? 'text-white' : 'text-black')
                    : 'text-[#666666]'
                    }`}>
                    {step.label}
                  </p>
                </div>
              </div>

              {step.line && (
                <div className="grid grid-cols-[2.5rem_1fr] gap-4">
                  <div className="flex justify-center">
                    <div className={`w-px border-l border-dashed transition-colors duration-300 ${subItems.length > 0 ? "h-full min-h-20" : "h-10 my-2"} ${isDark ? "border-[#B8B8B8]" : "border-[#CCCCCC]"}`} />
                  </div>
                  <div className="flex items-center">
                    {renderSubItems(subItems)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
