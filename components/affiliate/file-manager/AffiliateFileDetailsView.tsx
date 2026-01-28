"use client"

import React, { useState } from "react";
import { ArrowLeft, FileText, FolderOpen, Grid3X3, List, MoreVertical, Search } from "lucide-react";
import { AffiliateFolderCard } from "./AffiliateFolderCard";
import { AffiliateFileCard } from "./AffiliateFileCard";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import AffiliateFileActionMenu from "./AffiliateFileActionMenu";
import AffiliateLinkToShootModal from "./AffiliateLinkToShootModal";

const data = {
    id: "1",
    title: "Corporate_Lana_#123456",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    fileCount: 2,
    category: "Corporate Event",
    folderLink: "http://fjiejpfkmdfjief /Pre_Production",
    shootDate: "Jan 16, 2026",
    time: "11:30 PM · N/A Hours (11 Hours Duration)",
    totalValue: "$14,400",
    location: "1234 Mockingbird Lane Sample City, CA 90000 United States",
    totalImageFiles: 120,
    totalVideoFiles: 10,
    PaymentStatus: "Paid",
    lastOpened: "2 hours ago",
    userInitials: "DP",
    type: "post-production",
    files: [
        { id: "1", title: "Example.pdf", lastOpened: "2 hours ago", userInitials: "DP" },
        { id: "2", title: "Example.docx", lastOpened: "5 hours ago", userInitials: "KA" }
    ],
    folders: [
        { id: "1", title: "Raw Footages", fileCount: 12, category: "Corporate Event", isLinked: true, lastOpened: "2 hours ago", userInitials: "DP" },
        { id: "2", title: "Edited Footages", fileCount: 14, category: "Corporate Event", isLinked: true, lastOpened: "2 hours ago", userInitials: "DP" },
        { id: "3", title: "Final Deliverables", fileCount: 14, category: "Corporate Event", isLinked: true, lastOpened: "2 hours ago", userInitials: "DP" }
    ]
}

const STATUSES = ["Linked", "Unlinked"]

interface AffiliateFileDetailsViewProps {
    folderId: string;
    subFolderId: string;
    onBack: () => void;
}

export default function AffiliateFileDetailsView({ folderId, subFolderId, onBack }: AffiliateFileDetailsViewProps) {
    const isPostProduction = subFolderId === "2"; // Mock logic based on subfolder index
    const displayData = isPostProduction ? data.folders : data.files;

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredData, setFilteredData] = useState<any[]>(displayData);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [status, setStatus] = useState("");
    const [activeFolderTitle, setActiveFolderTitle] = useState<string | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        const filtered = displayData.filter((item) =>
            item.title.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, title: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveFolderTitle(title);
        const isNearRightEdge = window.innerWidth - rect.right < 250;
        const isNearBottomEdge = window.innerHeight - rect.bottom < 150;
        setMenuAnchor({
            x: isNearRightEdge ? rect.left - 210 : rect.right - 10,
            y: isNearBottomEdge ? rect.top - 230 : rect.top - 20
        });
    };

    const handleOpenLinkModal = (title: string) => {
        setSelectedFolder(title);
        setIsLinkModalOpen(true);
        setMenuAnchor(null);
    };

    return (
        <>
            <Button onClick={onBack} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent">
                <ArrowLeft size={24} />
                <span className="text-sm font-medium">Back</span>
            </Button>

            <div className="flex items-center gap-5 ">
                <div className="h-21 w-21 rounded-2xl bg-[#C8E1FF] flex items-center justify-center text-[#000] text-[30px] font-medium p-6">
                    {data.userInitials}
                </div>
                <div className="text-white max-w-3xl">
                    <div className="flex items-center gap-2 ">
                        <h1 className="text-2xl leading-[32px] font-semibold mb-1">{data.title}</h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-white/5 flex items-center gap-1.5 ${!isPostProduction ? 'bg-[#FDF4FF] text-[#C026D3]' : 'bg-[#E8D2FB] text-[#540B94]'}`}>
                            {isPostProduction ? "Post_Production" : "Pre_Production"}
                        </span>
                    </div>
                    <p className="text-sm text-[#D0D0D0]"><span className="text-[#AAA7A7]">Description: </span>{data.description}</p>
                </div>
            </div>

            <div className="h-[1px] w-full my-4 lg:my-9" style={{ backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />

            <div className="flex flex-col gap-5 text-white">
                <div className="flex flex-wrap gap-5 text-[#AAA7A7] text-sm capitalize divide-x divide-white/10">
                    <p className="pr-5">Shoot Date: <span className="text-white">{data.shootDate}</span></p>
                    <p className="pr-5 pl-5">Time: <span className="text-white">{data.time}</span></p>
                    <p className="pr-5 pl-5">Total Value: <span className="text-white">{data.totalValue}</span></p>
                    <p className="pl-5">Payment Status: <span className="text-[#45DB17]">{data.PaymentStatus}</span></p>
                </div>
                <div className="flex flex-wrap gap-5 text-[#AAA7A7] text-sm divide-x divide-white/10">
                    <p className="pr-5">Folder Link: <span className="text-[#E8D1AB] underline">{data.folderLink}</span></p>
                    <p className="pl-5">Shoot Files: <span className="text-white">{data.totalImageFiles} Images & {data.totalVideoFiles} Videos</span></p>
                </div>
                <p className="text-[#AAA7A7] text-sm capitalize">Location: <span className="text-white">{data.location}</span></p>
            </div>

            <div className="h-[1px] w-full my-4 lg:my-9" style={{ backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`, backgroundSize: '30px 1px', backgroundRepeat: 'repeat-x' }} />

            <div className="">
                <div className="flex justify-between items-center mb-3 lg:mb-6">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={searchTerm}
                            className="w-full pl-9 pr-4 py-2 bg-[#18181b] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <BasicDropdown label="Status" value={status} onChange={setStatus} options={STATUSES} />
                        <div className="flex flex-wrap items-center bg-[#202020] rounded-lg w-full md:w-fit border border-white/5">
                            <Button onClick={() => setViewMode('grid')} className={`px-5 py-2.5 rounded-l-lg transition-colors ${viewMode === 'grid' ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90" : "bg-transparent text-white/40 hover:text-white hover:bg-white/5"}`}>
                                <Grid3X3 size={20} />
                            </Button>
                            <Button onClick={() => setViewMode('list')} className={`px-5 py-2.5 rounded-r-lg transition-colors ${viewMode === 'list' ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90" : "bg-transparent text-white/40 hover:text-white hover:bg-white/5"}`}>
                                <List size={20} />
                            </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                        {filteredData.map((item) => (
                            isPostProduction ? (
                                <AffiliateFolderCard
                                    key={item.id}
                                    title={item.title}
                                    fileCount={item.fileCount}
                                    lastOpened={item.lastOpened}
                                    category={item.category}
                                    isLinked={item.isLinked}
                                    userInitials={item.userInitials}
                                    onOpenLinkModal={() => handleOpenLinkModal(item.title)}
                                    onClick={() => handleOpenLinkModal(item.title)}
                                />
                            ) : (
                                <AffiliateFileCard key={item.id} file={item} onMenuTrigger={(e) => handleOpenMenu(e, item.title)} />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <table className="w-full text-left border-collapse text-white">
                            <thead>
                                <tr className="bg-[#202020] text-[#E8D1AB] rounded-xl text-sm font-normal">
                                    <th className="rounded-l-xl py-5 px-6 font-medium">Name</th>
                                    <th className="py-5 px-6 text-center font-medium">{isPostProduction ? "Files" : "Type"}</th>
                                    <th className="py-5 px-6 text-center font-medium">Last Updated</th>
                                    <th className="py-5 px-6 font-medium text-right rounded-r-xl">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                    {isPostProduction ? <FolderOpen className="text-[#E8D1AB]" size={20} /> : <FileText className="text-[#F04438]" size={20} />}
                                                </div>
                                                <span className="text-white text-sm font-medium">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-center text-white/60 text-sm">
                                            {isPostProduction ? item.fileCount.toString().padStart(2, '0') : "PDF"}
                                        </td>
                                        <td className="py-5 px-6 text-center text-[#8F8F8F] text-sm">{item.lastOpened}</td>
                                        <td className="py-5 px-6 text-right">
                                            <Button variant="ghost" className="text-white/40 hover:text-white" onClick={(e) => handleOpenMenu(e, item.title)}>
                                                <MoreVertical size={20} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {menuAnchor && (
                <AffiliateFileActionMenu
                    folderName={selectedFolder}
                    isOpen={true}
                    onClose={() => setMenuAnchor(null)}
                    onOpenLinkModal={() => handleOpenLinkModal(activeFolderTitle || "")}
                    anchor={menuAnchor}
                />
            )}

            <AffiliateLinkToShootModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                folderName={selectedFolder || ""}
            />
        </>
    )
}
