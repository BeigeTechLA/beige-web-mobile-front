import React from "react";
import { User, Folder, Calendar, FolderOpen, FileEdit, CheckCircle, FileCheck } from "lucide-react";

const steps = [
    { id: 1, label: "Initiated", icon: User, status: "completed", line: true },
    { id: 2, label: "Pre_Production", icon: Folder, status: "current", line: true },
    { id: 3, label: "Shoot Day", icon: Calendar, status: "pending", line: true },
    { id: 4, label: "Post_Production", icon: FolderOpen, status: "pending", line: true },
    { id: 5, label: "Revision", icon: FileEdit, status: "pending", line: true },
    { id: 6, label: "Completed", icon: CheckCircle, status: "pending", line: true },
    { id: 7, label: "Assets Delivered", icon: FileCheck, status: "pending", line: false },
];

export default function ProjectTimeline({ status = 0 }: { status?: number }) {
    // Mapping project status (0-5) to timeline step indices
    // 0: Initiated -> Step 1
    // 1: Pre Production -> Step 2
    // 2: Post Production -> Step 4 (Skip Shoot Day 3 as it's implied/transient)
    // 3: Revision -> Step 5
    // 4: Completed -> Step 6
    // 5: Cancelled -> Special casing required, but usually stops at Initiated

    const getCurrentStep = () => {
        if (status === 0) return 1;
        if (status === 1) return 2;
        if (status === 2) return 4;
        if (status === 3) return 5;
        if (status >= 4) return 6;
        return 1;
    };

    const currentStepId = getCurrentStep();
    return (
        <div className="bg-[#111111] border-l border-[#222222] min-h-full p-6 w-80 shrink-0 mt-1">
            <h3 className="text-white text-lg font-bold mb-8">Project Timeline</h3>

            <div className="flex flex-col gap-0.5">
                {steps.map((step) => {
                    const isCompleted = step.id < currentStepId;
                    const isCurrent = step.id === currentStepId;
                    const isPending = step.id > currentStepId;

                    return (
                        <div key={step.id} className="relative flex gap-4">
                            {/* Icon Column */}
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isCompleted || isCurrent
                                    ? 'bg-[#E5D5B8] border-[#E5D5B8] text-black'
                                    : 'bg-transparent border-[#333333] text-[#666666]'
                                    }`}>
                                    <step.icon size={18} />
                                </div>
                                {step.line && (
                                    <div className="h-10 w-px bg-dashed border-l border-dashed border-[#444444] my-2" />
                                )}
                            </div>

                            {/* Label Column */}
                            <div className="pt-2">
                                <p className={`text-base font-medium leading-none ${isCompleted || isCurrent
                                    ? 'text-white'
                                    : 'text-[#666666]'
                                    }`}>
                                    {step.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
