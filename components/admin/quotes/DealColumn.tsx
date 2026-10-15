import { DealCard } from "./DealCard";

export type DealItem = {
  id: string;
  initials: string;
  name: string;
  quoteId: string;
  email: string;
  status: "Accepted" | "Pending" | "Rejected";
  project: string;
  bookingStatus: string;
  amount: string;
  paid: string;
  pending: string;
  validity: string;
};

export type DealColumnData = {
  title: string;
  count: number;
  deals: DealItem[];
};

type DealColumnProps = {
  data: DealColumnData;
  isDark?: boolean;
};

// Component 2: DealColumn
export const DealColumn = ({ data, isDark = true }: DealColumnProps) => {
  return (
    <div
      className={`flex flex-col h-full w-full min-h-0 rounded-xl border ${isDark ? "border-white/20 bg-[#0A0A0A]" : "border-gray-200 bg-gray-50"}`}
    >
      {/* Column Header (sticky, matches Kanban column header behavior) */}
      <div
        className={`flex items-center justify-between rounded-xl rounded-b-none p-5 border-b sticky top-[-1px] z-20 text-xs lg:text-sm font-medium ${isDark
            ? "bg-[#202020] border-white/20 text-white"
            : "bg-gray-100 border-gray-200 text-black"
          }`}
      >
        <span className="text-[#E8D1AB]">{data.title}</span>
        <span>{data.count}</span>
      </div>

      {/* Scrollable Cards Container — capped height + internal scroll, matching Kanban column body */}
      <div className="max-h-[620px] overflow-y-auto no-scrollbar p-3 lg:p-5 space-y-3">
        {data.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};