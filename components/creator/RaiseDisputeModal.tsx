'use client';

import React from 'react';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface DisputeFormData {
    shootId: string;
    subject: string;
    reason: string;
    description: string;
}

interface RaiseDisputeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (data: DisputeFormData) => void;
    loading?: boolean;
    initialValues?: Partial<DisputeFormData>;
    isEdit?: boolean;
}

const reasonOptions = [
    'Payment Issue',
    'Contract Issue',
    'Project Delay',
    'Communication Issue',
    'Quality Issue',
    'Scope Change',
    'Other',
];

export default function RaiseDisputeModal({
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    initialValues,
    isEdit = false,
}: RaiseDisputeModalProps) {
    const [form, setForm] = React.useState<DisputeFormData>({
        shootId: '',
        subject: '',
        reason: '',
        description: '',
        ...initialValues,
    });

    const handleChange = (field: keyof DisputeFormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(form);
    };

    return (
        <div className='bg-white backdrop-blur-xl'>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[calc(100vw-24px)] max-w-[420px] overflow-hidden rounded-[16px] border border-white/15 bg-black p-0 text-white shadow-[0_25px_80px_rgba(0,0,0,0.65)] sm:max-w-[420px] [&>button]:hidden">
                    <DialogTitle className="sr-only">
                        {isEdit ? 'Edit Dispute' : 'Add Dispute'}
                    </DialogTitle>

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
                        <h2 className="text-[22px] font-semibold leading-none">
                            Add & Edit Dispute
                        </h2>
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#282828] text-white/90 transition hover:bg-[#393939]"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogClose>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="max-h-[calc(90vh-80px)] overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="space-y-3.5">
                            {/* Shoot ID */}
                            <fieldset className="rounded-[10px] border border-white/18 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Shoot ID*
                                </legend>
                                <Select
                                    value={form.shootId}
                                    onValueChange={(value) => handleChange('shootId', value)}
                                >
                                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                                        <SelectValue placeholder="Select Shoot ID" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-[#111111] text-white">
                                        <SelectItem value="shoot-001">Shoot #001</SelectItem>
                                        <SelectItem value="shoot-002">Shoot #002</SelectItem>
                                        <SelectItem value="shoot-003">Shoot #003</SelectItem>
                                        <SelectItem value="shoot-004">Shoot #004</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            {/* Subject */}
                            <fieldset className="rounded-[10px] border border-white/18 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Subject*
                                </legend>
                                <Input
                                    value={form.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    placeholder="Enter subject"
                                    className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                                />
                            </fieldset>

                            {/* Select Reason */}
                            <fieldset className="rounded-[10px] border border-white/18 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Select Reason*
                                </legend>
                                <Select
                                    value={form.reason}
                                    onValueChange={(value) => handleChange('reason', value)}
                                >
                                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-[#111111] text-white">
                                        {reasonOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            {/* Description */}
                            <fieldset className="rounded-[10px] border border-white/18 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/55">
                                    Description
                                </legend>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Enter dispute details..."
                                    className="min-h-[120px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
                                />
                            </fieldset>

                            {/* Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-[38px] rounded-[4px] bg-[#E5D0A6] px-5 text-[12px] font-semibold text-[#111111] hover:bg-[#dcc18e]"
                                >
                                    {loading ? 'Saving...' : 'Save & Update'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}