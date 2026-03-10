import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Record",
    description = "Are you sure you want to delete this record? This action cannot be undone.",
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#888888] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#222222]"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-[#888888] text-sm leading-relaxed mb-8 max-w-[280px]">
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 bg-[#1A1A1A] border-[#222222] text-white hover:bg-[#222222] h-11 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 text-white hover:bg-red-700 h-11 rounded-xl font-medium shadow-lg shadow-red-600/10"
                        >
                            {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
