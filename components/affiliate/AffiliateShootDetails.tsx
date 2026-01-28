"use client";

import React, { useState, useEffect } from "react";
import AffiliateShootHeader from "./shoot-details/AffiliateShootHeader";
import AffiliateProjectTeam from "./shoot-details/AffiliateProjectTeam";
import AffiliateAssignedCP from "./shoot-details/AffiliateAssignedCP";
import AffiliateMeetingSchedule from "./shoot-details/AffiliateMeetingSchedule";
import AffiliateProjectTimeline from "./shoot-details/AffiliateProjectTimeline";
import AffiliateShootTabs from "./shoot-details/AffiliateShootTabs";
import AffiliatePreProductionTab from "./shoot-details/AffiliatePreProductionTab";
import AffiliatePostProductionTab from "./shoot-details/AffiliatePostProductionTab";
import AffiliateMeetingOverviewChart from "./shoot-details/AffiliateMeetingOverviewChart";
import AffiliateMessagesTab from "./shoot-details/AffiliateMessagesTab";

import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AffiliateShootDetailsProps {
    shootId: string;
    onBack: () => void;
}

export default function AffiliateShootDetails({ shootId, onBack }: AffiliateShootDetailsProps) {
    const [activeTab, setActiveTab] = useState("Overview");
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectAndSkills = async () => {
            try {
                const [projectResponse, skillsResponse] = await Promise.all([
                    adminApi.getProjectDetails(shootId),
                    adminApi.getSkills()
                ]);

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

                let projectData = null;
                if (projectResponse?.data?.project) {
                    projectData = projectResponse.data.project;
                } else if (projectResponse?.data) {
                    projectData = projectResponse.data;
                } else {
                    projectData = projectResponse;
                }

                if (projectData) {
                    let skillsText = "";
                    if (projectData.skills_needed) {
                        try {
                            let parsedIds = projectData.skills_needed;
                            if (typeof projectData.skills_needed === 'string' &&
                                (projectData.skills_needed.trim().startsWith('[') || projectData.skills_needed.trim().startsWith('{'))) {
                                try {
                                    parsedIds = JSON.parse(projectData.skills_needed);
                                } catch (e) {
                                    parsedIds = projectData.skills_needed;
                                }
                            }

                            if (Array.isArray(parsedIds)) {
                                skillsText = parsedIds
                                    .map(id => skillsMap[Number(id)])
                                    .filter(Boolean)
                                    .join(", ");
                            } else if (typeof parsedIds === 'string') {
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

        if (shootId) {
            fetchProjectAndSkills();
        }
    }, [shootId]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-white/50" size={40} />
            </div>
        );
    }

    return (
        <div className="flex h-full -mx-4 -mb-4">
            <div className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <AffiliateShootHeader activeTab={activeTab} project={project} onBack={onBack} />

                <AffiliateShootTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "Overview" && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[420px]">
                            <AffiliateProjectTeam projectId={shootId} />
                            <AffiliateAssignedCP projectId={shootId} />
                        </div>
                        <AffiliateMeetingSchedule />
                    </>
                )}

                {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
                    <AffiliatePreProductionTab />
                )}

                {(activeTab === "Post_Production" || activeTab === "Post Production") && (
                    <AffiliatePostProductionTab />
                )}

                {activeTab === "Meetings" && (
                    <>
                        <AffiliateMeetingSchedule />
                        <AffiliateMeetingOverviewChart />
                    </>
                )}

                {activeTab === "Messages" && (
                    <AffiliateMessagesTab />
                )}
            </div>

            <AffiliateProjectTimeline />
        </div>
    );
}
