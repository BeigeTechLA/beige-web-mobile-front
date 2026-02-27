"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface AssignmentConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    videographerCount: { selected: number; required: number };
    photographerCount: { selected: number; required: number };
}

export const AssignmentConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    videographerCount,
    photographerCount,
}: AssignmentConfirmationModalProps) => {
    const overVideographers = videographerCount.selected > videographerCount.required;
    const overPhotographers = photographerCount.selected > photographerCount.required;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#101010] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
                            <AlertCircle size={24} />
                        </div>
                        <DialogTitle className="text-xl font-semibold">Confirm Assignment</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-white/70">
                        You have selected more creative partners than requested for this lead.
                    </p>

                    <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-white/5">
                        {overVideographers && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/60">Videographers:</span>
                                <span className="font-medium text-yellow-500">
                                    {videographerCount.selected} selected (Required: {videographerCount.required})
                                </span>
                            </div>
                        )}
                        {overPhotographers && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/60">Photographers:</span>
                                <span className="font-medium text-yellow-500">
                                    {photographerCount.selected} selected (Required: {photographerCount.required})
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-white/50 italic">
                        CPs who accept the request first will be assigned to the shoot.
                    </p>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-white hover:bg-white/5 border border-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-[#E5D5B8] text-black hover:bg-[#dcb98a]"
                    >
                        Confirm & Assign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
