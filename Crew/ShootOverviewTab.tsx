import React from "react";
import { MapPin, Clock, Calendar, CheckCircle2 } from "lucide-react";

export default function ShootOverviewTab({ project }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 animate-in fade-in duration-500">
      
      {/* LEFT: DETAILS GRID */}
      <div className="lg:col-span-8 space-y-4 lg:space-y-8">
        <div className="bg-white/[0.01] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8">
          <h3 className="lg:text-xl font-bold mb-4 lg:mb-10">Shoot Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 lg:gap-y-10 lg:gap-x-16">
            <DetailItem label="Shoot Name" value={project.project_name} />
            <DetailItem label="User Name" value="Luxe Apparel Co." />
            
            <DetailItem 
              label="Shoot Type" 
              value={
                <span className="bg-white/5 text-white/70 px-4 py-1 rounded-full text-xs border border-white/10 uppercase tracking-widest font-bold">
                  {project.event_type}
                </span>
              } 
            />
            
            <DetailItem 
              label="Location" 
              value={project.event_location} 
              icon={<MapPin size={16} className="text-[#E8D1AB]" />} 
            />
            
            <DetailItem 
              label="Shoot Date" 
              value={project.event_date} 
              icon={<Calendar size={16} className="text-[#E8D1AB]" />} 
            />
            
            <DetailItem 
              label="Time & Timezone" 
              value={`${project.start_time} - ${project.end_time} EST`} 
              icon={<Clock size={16} className="text-[#E8D1AB]" />} 
            />
            
            <DetailItem label="Assigned Role" value={project.skills_needed} />
            <DetailItem label="Booking Type" value="Edit & Shoot" />
          </div>
        </div>

        {/* EQUIPMENT PLACEHOLDER */}
        <div className="bg-white/[0.01] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8">
            <h3 className="lg:text-lg font-bold mb-4">Equipment Needed (0/0)</h3>
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg lg:rounded-2xl text-white/20 text-sm">
                No equipment items requested
            </div>
        </div>
      </div>

      {/* RIGHT: STATUS & TIMELINE */}
      <div className="lg:col-span-4 space-y-4 lg:space-y-6">
        
        {/* VERTICAL STEPPER */}
        <div className="bg-[#E8D1AB]/[0.03] border border-[#E8D1AB]/10 rounded-lg lg:rounded-3xl p-4 lg:p-8">
           <div className="space-y-8 relative">
              {/* Vertical Connector Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-white/10" />
              
              <StatusStep label="Pending" completed />
              <StatusStep label="Pre Production" active />
              <StatusStep label="Post Production" />
              <StatusStep label="Delivered" />
           </div>
        </div>

        {/* STATUS SUMMARY BOX */}
        <div className="bg-white/[0.02] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8 space-y-4 lg:space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Shoot Status</h4>
          
          <div>
            <p className="text-[10px] uppercase text-white/30 font-bold mb-1">Current Stage</p>
            <p className="text-sm lg:text-base font-semibold text-white/90">Pre Production</p>
          </div>

          <div>
             <span className="bg-[#E8D1AB]/10 text-[#E8D1AB] px-5 py-1.5 rounded-full text-xs font-bold border border-[#E8D1AB]/20">
                On Track
             </span>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase text-white/30 font-bold mb-1">Last Updated</p>
            <p className="text-xs text-white/50">Jan 20, 2024 • 2:30 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- INTERNAL HELPERS --- */

function DetailItem({ label, value, icon }: any) {
  return (
    <div className="space-y-1 lg:space-y-2">
      <p className="text-xs uppercase text-white/30 font-bold tracking-[0.15em]">{label}</p>
      <div className="flex items-start gap-3 text-sm lg:text-base font-medium text-white/90 leading-tight">
        {icon && <span className="mt-0.5">{icon}</span>}
        <span>{value || "Not Specified"}</span>
      </div>
    </div>
  );
}

function StatusStep({ label, completed, active }: any) {
  return (
    <div className="flex items-center gap-3 lg:gap-5 relative z-10">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
        completed 
          ? "bg-[#E8D1AB] border-[#E8D1AB]" 
          : active 
            ? "bg-black border-[#E8D1AB] ring-4 ring-[#E8D1AB]/10" 
            : "bg-[#0A0A0A] border-white/10"
      }`}>
        {completed ? (
          <CheckCircle2 size={14} className="text-black" />
        ) : (
          <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#E8D1AB]" : "bg-white/10"}`} />
        )}
      </div>
      <span className={`text-sm font-semibold lg:font-bold uppercase tracking-widest ${
        active || completed ? "text-white" : "text-white/20"
      }`}>
        {label}
      </span>
    </div>
  );
}
