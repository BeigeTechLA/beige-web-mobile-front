import React from "react";
import { Check, ClipboardList, Clock, Briefcase, MessageSquare, CheckCircle, Package } from "lucide-react";

const steps = [
    { id: 1, label: "Initiated", icon: Check, status: "completed", line: true },
    { id: 2, label: "Pre_Production", icon: ClipboardList, status: "current", line: true },
    { id: 3, label: "Shoot Day", icon: Clock, status: "pending", line: true },
    { id: 4, label: "Post_Production", icon: Briefcase, status: "pending", line: true },
    { id: 5, label: "Revision", icon: MessageSquare, status: "pending", line: true },
    { id: 6, label: "Completed", icon: CheckCircle, status: "pending", line: true },
    { id: 7, label: "Assets Delivered", icon: Package, status: "pending", line: false },
];

export default function ProjectTimeline() {
    return (
        <div className="bg-[#111111] border-l border-[#222222] h-full p-6 w-80 shrink-0">
            <h3 className="text-white text-lg font-bold mb-8">Project Timeline</h3>

            <div className="flex flex-col gap-0.5">
                {steps.map((step) => (
                    <div key={step.id} className="relative flex gap-4">
                        {/* Icon Column */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${step.status === 'completed' || step.status === 'current'
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
                            <p className={`text-sm font-medium ${step.status === 'completed' || step.status === 'current'
                                    ? 'text-white'
                                    : 'text-[#666666]'
                                }`}>
                                {step.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
