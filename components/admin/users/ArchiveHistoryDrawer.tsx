import React, { useState } from 'react';
import { X, Clock, UserMinus, UserCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have this utility

// --- Types ---
interface HistoryItem {
    id: string;
    userName: string;
    adminName: string;
    date: string;
    time: string;
    avatarType: 'initials' | 'image';
    avatarContent?: string;
    bgColor?: string;
    restoredBy?: {
        name: string;
        date: string;
        time: string;
        avatarUrl: string;
    };
}

// --- Mock Data (Matches PNG exactly) ---
const historyData: HistoryItem[] = [
    {
        id: '1',
        userName: 'Prince Cater',
        adminName: 'Emily Jinshan',
        date: 'Jan 13, 2026',
        time: '10:24 AM',
        avatarType: 'initials',
        avatarContent: 'PC',
        bgColor: 'bg-pink-100 text-pink-900',
        restoredBy: {
            name: 'Emily Jinshan',
            date: 'Jan 26, 2026',
            time: '11:00 AM',
            avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
        },
    },
    {
        id: '2',
        userName: 'Jake Ross',
        adminName: 'John R Smith',
        date: 'Jan 13, 2026',
        time: '10:24 AM',
        avatarType: 'initials',
        avatarContent: 'JK',
        bgColor: 'bg-cyan-100 text-cyan-900',
    },
    {
        id: '3',
        userName: 'Priya Johnson',
        adminName: 'John R Smith',
        date: 'Jan 13, 2026',
        time: '10:24 AM',
        avatarType: 'image',
        avatarContent: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: '4',
        userName: 'James Anderson',
        adminName: 'Emily Jinshan',
        date: 'Jan 13, 2026',
        time: '10:24 AM',
        avatarType: 'image',
        avatarContent: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: '5',
        userName: 'Emma Thompson',
        adminName: 'John R Smith',
        date: 'Jan 13, 2026',
        time: '10:24 AM',
        avatarType: 'image',
        avatarContent: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    },
];

interface ArchiveHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    // Your existing modal props
    RestoreModalOpen: boolean;
    setRestoreModalOpen: (open: boolean) => void;
    handleConfirmRestore: () => Promise<void>;
    isRestoring: boolean;
    successModalOpen: boolean;
    setSuccessModalOpen: (open: boolean) => void;
    handleViewArchive: () => void;
    isDark: boolean;
    DeleteConfirmationModal: React.ElementType;
    SuccessModal: React.ElementType;
}

const ArchiveHistoryDrawer: React.FC<ArchiveHistoryDrawerProps> = ({
    isOpen,
    onClose,
    RestoreModalOpen,
    setRestoreModalOpen,
    handleConfirmRestore,
    isRestoring,
    successModalOpen,
    setSuccessModalOpen,
    handleViewArchive,
    isDark,
    DeleteConfirmationModal,
    SuccessModal,
}) => {
    const [selectedUser, setSelectedUser] = useState<HistoryItem | null>(null);

    if (!isOpen) return null;

    const handleRowClick = (item: HistoryItem) => {
        // Only allow restore action if user hasn't been restored yet
        if (!item.restoredBy) {
            setSelectedUser(item);
            setRestoreModalOpen(true);
        }
    };

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Container - Pixel Perfect Specs */}
            <div className="fixed top-0 right-0 h-full w-[480px] bg-black border-l border-[#222] shadow-2xl z-50 flex flex-col rounded-l-[24px] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-[#222] shrink-0">
                    <h2 className="text-white text-[22px] font-bold tracking-tight leading-none">
                        Archive Users History
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-5 scrollbar-hide">
                    {historyData.map((item) => (
                        <HistoryCard
                            key={item.id}
                            data={item}
                            onClick={() => handleRowClick(item)}
                            canRestore={!item.restoredBy}
                        />
                    ))}

                    {/* Bottom padding for scroll comfort */}
                    <div className="h-4" />
                </div>
            </div>

            {/* --- INTEGRATED MODALS --- */}

            {/* Restore Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={RestoreModalOpen}
                onClose={() => {
                    setRestoreModalOpen(false);
                    setSelectedUser(null);
                }}
                onConfirm={handleConfirmRestore}
                title={`Restore ${selectedUser?.userName || 'User'}`}
                description={`Are you sure you want to restore ${selectedUser?.userName || 'this user'}? This will move them back to the active users list.`}
                buttonText="Restore User"
                isLoading={isRestoring}
                isDark={isDark}
                icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                onConfirm={handleViewArchive}
                title="User Restored Successfully"
                description="The user has been restored successfully and moved back to the active user list."
                buttonText="View User"
                isDark={isDark}
                icon={<AlertCircle className="w-5 h-5 text-emerald-500" />}
            />
        </>
    );
};

// --- Sub-components for Clean Architecture ---

const HistoryCard = ({
    data,
    onClick,
    canRestore
}: {
    data: HistoryItem;
    onClick: () => void;
    canRestore: boolean;
}) => {
    const hasRestore = !!data.restoredBy;

    return (
        <div className="relative group">
            {/* Main Deleted Card */}
            <div
                onClick={onClick}
                className={cn(
                    "bg-[#111] border border-[#222] rounded-[16px] p-5 flex items-start gap-4 relative z-10 transition-all",
                    canRestore ? "cursor-pointer hover:border-[#333] hover:bg-[#161616]" : "cursor-default opacity-80"
                )}
            >
                {/* Avatar */}
                <Avatar src={data.avatarContent} type={data.avatarType} bgColor={data.bgColor} />

                {/* Text Content */}
                <div className="flex-1 pt-0.5">
                    <p className="text-[#EAEAEA] text-[15px] leading-snug font-medium">
                        {data.userName} was deleted by {data.adminName} - <span className="text-[#D4C4A8]">Admin</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Clock size={12} className="text-[#555]" />
                        <span className="text-[#777] text-[13px]">{data.date}</span>
                        <span className="text-[#444] text-[10px]">•</span>
                        <span className="text-[#777] text-[13px]">{data.time}</span>
                    </div>

                    {canRestore && (
                        <div className="mt-3 flex items-center gap-1.5 text-[#D4C4A8] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <UserCheck size={12} />
                            Click to restore user
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Restore Section (Connector + Child Card) */}
            {hasRestore && data.restoredBy && (
                <div className="relative ml-[44px] mt-[-10px] pl-6 z-0">
                    {/* Vertical Connector Line */}
                    <div className="absolute left-[19px] top-0 bottom-[50%] w-[2px] bg-[#333]" />

                    {/* Restore Card */}
                    <div className="bg-[#0A0A0A] border border-[#222] rounded-[12px] p-4 flex items-start gap-3 mt-3">
                        <img
                            src={data.restoredBy.avatarUrl}
                            alt="Restorer"
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#222]"
                        />
                        <div className="flex-1">
                            <p className="text-[#EAEAEA] text-[14px] leading-snug font-medium">
                                {data.userName} was restored by {data.restoredBy.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock size={11} className="text-[#555]" />
                                <span className="text-[#777] text-[12px]">{data.restoredBy?.date}</span>
                                <span className="text-[#444] text-[8px]">•</span>
                                <span className="text-[#777] text-[12px]">{data.restoredBy?.time}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Avatar = ({ src, type, bgColor }: { src?: string; type: 'initials' | 'image'; bgColor?: string }) => {
    if (type === 'image' && src) {
        return (
            <img
                src={src}
                alt="User"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#222]"
            />
        );
    }

    return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${bgColor || 'bg-gray-800 text-white'}`}>
            {src}
        </div>
    );
};

export default ArchiveHistoryDrawer;