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

export default function ShootDetailsPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState("Overview");

    return (
        <div className="flex h-full -m-6 lg:-m-10">

            {/* Main Content (Left) */}
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ShootHeader activeTab={activeTab} />

                <ShootTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "Overview" && (
                    <>
                        <div className="grid grid-cols-2 gap-6 h-[420px]">
                            <ProjectTeam />
                            <AssignedCP />
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
