import OverviewChart from "@/components/admin/OverviewChart";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-white">
          <h1 className="text-2xl leading-[32px] font-semibold mb-1">Welcome back, Admin !</h1>
          <p className="text-sm text-white/70">Monitor revenue, shoots, clients, and performance metrics in one centralized dashboard.</p>
        </div>
        {/* Placeholder until design is finalized */}
        <Button className="h-[54px] text-[#C4C4C4] px-5 py-4 border rounded-full border-[#807E7E]">
          <span>Sort by Date</span><Calendar size={24} />
        </Button>
      </div>

      <OverviewChart />
    </>
  )
}