type Status = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Paid" | "Unknown";

export const StatusBadge = ({ status, mobile }: { status: Status; mobile?: boolean }) => {
  const styles = {
    "Initiated": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "PreProduction": "bg-[#FDF4FF] text-[#C065F0] border-[#C065F0]/20",
    "PostProduction": "bg-[#E0F2FE] text-[#0EA5E9] border-[#0EA5E9]/20",
    "Revision": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Completed": "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    "Cancelled": "bg-[#FFF5F5] text-[#EF4444] border-[#EF4444]/20",
    "Booked": "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
    "Paid": "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
    "Unknown": "bg-zinc-800 text-zinc-400 border-zinc-700", // Default neutral style
  };

  const padding = mobile ? "px-4 py-1 text-xs" : "px-6 py-2 text-sm";

  return (
    <span
      className={`${padding} rounded-full font-semibold border  ${styles[status]}`}
    >
      {status}
    </span>
  );
};