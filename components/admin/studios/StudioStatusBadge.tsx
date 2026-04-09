type Status = "Approved" | "Pending" | "Rejected" | "Unknown";

export const StudioStatusBadge = ({ status, mobile }: { status: Status; mobile?: boolean }) => {
    const styles = {
        "Rejected": "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]",
        "Approved": "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
        "Pending": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
        "Unknown": "bg-zinc-800 text-zinc-400 border-zinc-700", // Default neutral style
    };

    const padding = mobile ? "px-4 py-1 text-xs" : "px-6 py-2 text-sm";

    return (
        <span className={`${padding} rounded-full font-semibold border ${styles[status]}`}>
            {status}
        </span>
    );
};
