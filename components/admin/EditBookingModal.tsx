"use client";

import React from "react";
import { X } from "lucide-react";
import EditBookingForm from "./EditBookingForm";

interface EditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    leadId: string | number;
    initialData: any;
    onSuccess?: () => void;
}

export default function EditBookingModal({ isOpen, onClose, projectId, leadId, initialData, onSuccess }: EditBookingModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-6 overflow-hidden">
            <div className="bg-[#101010] w-full max-w-6xl h-full lg:h-[90vh] rounded-3xl border border-white/10 flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <h2 className="text-xl font-semibold text-white">Edit Booking</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Container */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                    <EditBookingForm
                        leadId={leadId}
                        initialBookingData={initialData}
                        isModal={true}
                        onSuccess={() => {
                            if (onSuccess) onSuccess();
                            onClose();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div>

            {/* Backdrop Click */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
