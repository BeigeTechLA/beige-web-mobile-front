import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    buttonText?: string;
    isLoading?: boolean;
    isDark?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete User",
    description = "Are you sure you want to delete this user",
    isLoading = false,
    buttonText = isLoading ? "Deleting..." : "Confirm Delete",
    isDark = true,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className={`w-full max-w-xl rounded-[16px] p-6 shadow-[16px] relative animate-in fade-in zoom-in duration-200 border-[0.5px] ${isDark
                    ? "bg-[#000000] border-[#ffffff]/40"
                    : "bg-white border-[#D7D7D7]"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 transition-colors p-1 rounded-lg ${isDark
                        ? "text-[#666666] hover:text-white hover:bg-[#1A1A1A]"
                        : "text-[#727272] hover:text-black hover:bg-[#F4F5F7]"
                        }`}
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    {/* Warning Icon */}
                    <div className="w-14 h-14 rounded-full bg-[#F59E0B]/20 flex items-center justify-center mb-4">
                        <AlertCircle size={28} className="text-[#F59E0B]" />
                    </div>

                    <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
                        {title}
                    </h2>

                    <p className={`text-sm leading-relaxed mb-8 ${isDark ? "text-[#888888]" : "text-[#727272]"}`}>
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`flex-1 h-11 rounded-[8px] transition-colors border ${isDark
                                ? "bg-[#1A1A1A] border-[#2A2A2A] text-white hover:bg-[#222222]"
                                : "bg-[#F4F5F7] border-[#D7D7D7] text-black hover:bg-[#E5E7EB]"
                                }`}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 h-11 rounded-[8px] font-medium bg-[#E5D5B8] hover:bg-[#D4C4A8] text-black shadow-lg transition-colors"
                        >
                            {buttonText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};