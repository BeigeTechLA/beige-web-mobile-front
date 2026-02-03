"use client";

import React, { useState } from "react";
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

import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [activeTab, setActiveTab] = useState("Overview");
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchProjectAndSkills = async () => {
            try {
                const [projectResponse, skillsResponse] = await Promise.all([
                    adminApi.getProjectDetails(id),
                    adminApi.getSkills()
                ]);

                // 1. Create Skills Map
                const skillsMap: Record<number, string> = {};
                if (skillsResponse && skillsResponse.data) {
                    const skillsList = Array.isArray(skillsResponse.data) ? skillsResponse.data : (skillsResponse.data?.data || []);
                    skillsList.forEach((s: any) => {
                        const name = s.name || s.skill_name || s.title;
                        if (s.id && name) {
                            skillsMap[s.id] = name;
                        }
                    });
                }

                // 2. Process Project Data
                let projectData = null;
                if (projectResponse?.data?.project) {
                    projectData = projectResponse.data.project;
                } else if (projectResponse?.data) {
                    projectData = projectResponse.data;
                } else {
                    projectData = projectResponse;
                }

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
                                } catch (e) {
                                    // If parsing fails, keep it as a string
                                    parsedIds = projectData.skills_needed;
                                }
                            }

                            if (Array.isArray(parsedIds)) {
                                skillsText = parsedIds
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
                        skills_needed: skillsText || projectData.skills_needed || "N/A"
                    });
                }
            } catch (error) {
                console.error("Failed to fetch shoot details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProjectAndSkills();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-white/50" size={40} />
            </div>
        );
    }

    return (
        <div className="flex h-full -m-6 lg:-m-10">

            {/* Main Content (Left) */}
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ShootHeader activeTab={activeTab} project={project} projectId={id} />

                <ShootTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "Overview" && (
                    <>
                        <div className="grid grid-cols-2 gap-6 h-[420px]">
                            <ProjectTeam projectId={id} />
                            <AssignedCP projectId={id} />
                        </div>
                        <MeetingSchedule />
                    </>
                )}

                {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
                    <PreProductionTab />
                )}

                {(activeTab === "Post_Production" || activeTab === "Post Production") && (
                    <PostProductionTab />
                )}

                {activeTab === "Meetings" && (
                    <>
                        <MeetingSchedule />
                        <MeetingOverviewChart />
                    </>
                )}

                {activeTab === "Messages" && (
                    <MessagesTab />
                )}
            </div>

            {/* Right Sidebar (Timeline) */}
            <ProjectTimeline />
        </div>
    );
}
