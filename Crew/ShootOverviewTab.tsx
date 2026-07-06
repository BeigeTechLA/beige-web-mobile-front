import React, { useMemo } from "react";
import { MapPin, Clock, Calendar, CheckCircle2, Users } from "lucide-react";
import { getPrimaryRoleLabel, getProjectTimeText } from "@/lib/utils/shootDetails";
import {
  resolveTimelineStage,
  TIMELINE_STAGE,
  timelineStageToHeaderLabel,
} from "@/lib/utils/projectTimeline";

export default function ShootOverviewTab({ project, apiResponse, currentCrewMemberId }: any) {
  const assignedCrew = Array.isArray(apiResponse?.assignedCrew)
    ? apiResponse.assignedCrew
    : Array.isArray(project?.assignedCrew)
      ? project.assignedCrew
      : Array.isArray(project?.assigned_crews)
        ? project.assigned_crews
        : [];
  const currentAssignment = assignedCrew.find((assignment: any) => {
    const crewMemberId = assignment?.crew_member_id || assignment?.crew_member?.crew_member_id;
    return currentCrewMemberId && String(crewMemberId) === String(currentCrewMemberId);
  });
  const locationText =
    project?.event_location ||
    [project?.location, project?.city, project?.state, project?.country]
      .filter(Boolean)
      .join(", ") ||
    "Not Specified";
  const timeText = getProjectTimeText(project);
  const timelineStage = useMemo(() => resolveTimelineStage(project), [project]);
  const timelineLabel = useMemo(
    () => timelineStageToHeaderLabel(timelineStage),
    [timelineStage]
  );
  const isCancelled = timelineStage === TIMELINE_STAGE.CANCELLED;
  const lastUpdatedText = project?.updated_at
    ? new Date(project.updated_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";
  const clientName =
    apiResponse?.lead_details?.client_name ||
    project?.client?.name ||
    project?.client_name ||
    project?.lead_details?.client_name ||
    project?.guest_name ||
    "Not Specified";
  const skillsText = (() => {
    const raw = project?.skills_needed;
    if (!raw) return "Not Specified";
    if (Array.isArray(raw)) return raw.join(", ");
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.join(", ");
        } catch {
          return raw;
        }
      }
      return raw;
    }
    return String(raw);
  })();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    const dateOnlyMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).replace(/ /g, ' ').replace(/(\w{3}) (\d{4})/, '$1, $2');
  };

  const bookingType = project?.booking_type || project?.bookingType || "Not Specified";
  const assignedRoleText = currentAssignment?.crew_member
    ? getPrimaryRoleLabel(
        currentAssignment.crew_member.primary_role,
        currentAssignment.crew_member.role_name
      )
    : assignedCrew.length === 1
      ? getPrimaryRoleLabel(
          assignedCrew[0]?.crew_member?.primary_role,
          assignedCrew[0]?.crew_member?.role_name
        )
      : "Not Specified";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 animate-in fade-in duration-500">
      {/* LEFT: DETAILS GRID */}
      <div className="lg:col-span-8 space-y-4 lg:space-y-8">
        <div className="bg-white/[0.01] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8">
          <h3 className="lg:text-xl font-bold mb-4 lg:mb-10">Shoot Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 lg:gap-y-10 lg:gap-x-16">
            <DetailItem label="Shoot Name" value={project?.project_name} />
            <DetailItem label="Client Name" value={clientName} />

            <DetailItem
              label="Shoot Type"
              value={
                <span className="bg-white/5 text-white/70 px-4 py-1 rounded-full text-xs border border-white/10 uppercase tracking-widest font-bold">
                  {skillsText}
                </span>
              }
            />

            <DetailItem
              label="Location"
              value={locationText}
              icon={<MapPin size={16} className="text-[#E8D1AB]" />}
            />

            <DetailItem
              label="Shoot Date"
              value={formatDate(project?.event_date)}
              icon={<Calendar size={16} className="text-[#E8D1AB]" />}
            />

            <DetailItem
              label="Time & Timezone"
              value={timeText}
              icon={<Clock size={16} className="text-[#E8D1AB]" />}
            />

            <DetailItem label="Assigned Role" value={assignedRoleText} />
            <DetailItem label="Booking Type" value={bookingType} />
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#E8D1AB]" />
            <h3 className="lg:text-lg font-bold">Creative Partners ({assignedCrew.length})</h3>
          </div>

          {assignedCrew.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedCrew.map((assignment: any) => {
                const member = assignment?.crew_member || {};
                const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Creative Partner";
                const role = getPrimaryRoleLabel(member.primary_role, member.role_name);
                const isYou =
                  currentCrewMemberId &&
                  String(member.crew_member_id || assignment?.crew_member_id) === String(currentCrewMemberId);

                return (
                  <div
                    key={assignment?.id || member.crew_member_id || name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/90">
                        {name}
                        {isYou && <span className="ml-2 text-xs font-medium text-[#E8D1AB]">(You)</span>}
                      </p>
                      <p className="truncate text-xs text-white/45">{role}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#E8D1AB]/15 bg-[#E8D1AB]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E8D1AB]">
                      {assignment?.acceptance_status || assignment?.status || "Assigned"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg lg:rounded-2xl text-white/20 text-sm">
              No creative partners assigned
            </div>
          )}
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

            <StatusStep
              label="Pending"
              completed={timelineStage > TIMELINE_STAGE.INITIATED}
              active={timelineStage === TIMELINE_STAGE.INITIATED}
            />
            <StatusStep
              label="Pre Production"
              completed={timelineStage > TIMELINE_STAGE.PRE_PRODUCTION}
              active={timelineStage === TIMELINE_STAGE.PRE_PRODUCTION}
            />
            <StatusStep
              label="Post Production"
              completed={timelineStage > TIMELINE_STAGE.POST_PRODUCTION}
              active={timelineStage === TIMELINE_STAGE.POST_PRODUCTION}
            />
            <StatusStep
              label="Delivered"
              completed={
                timelineStage >= TIMELINE_STAGE.ASSETS_DELIVERED ||
                timelineStage === TIMELINE_STAGE.COMPLETED
              }
              active={
                timelineStage === TIMELINE_STAGE.ASSETS_DELIVERED ||
                timelineStage === TIMELINE_STAGE.COMPLETED
              }
            />
          </div>
        </div>

        {/* STATUS SUMMARY BOX */}
        <div className="bg-white/[0.02] border border-white/5 rounded-lg lg:rounded-3xl p-4 lg:p-8 space-y-4 lg:space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Shoot Status</h4>

          <div>
            <p className="text-[10px] uppercase text-white/30 font-bold mb-1">Current Stage</p>
            <p className="text-sm lg:text-base font-semibold text-white/90">{timelineLabel}</p>
          </div>

          <div>
            <span className="bg-[#E8D1AB]/10 text-[#E8D1AB] px-5 py-1.5 rounded-full text-xs font-bold border border-[#E8D1AB]/20">
              {isCancelled ? "Cancelled" : "On Track"}
            </span>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase text-white/30 font-bold mb-1">Last Updated</p>
            <p className="text-xs text-white/50">{lastUpdatedText}</p>
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
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
          completed
            ? "bg-[#E8D1AB] border-[#E8D1AB]"
            : active
              ? "bg-black border-[#E8D1AB] ring-4 ring-[#E8D1AB]/10"
              : "bg-[#0A0A0A] border-white/10"
        }`}
      >
        {completed ? (
          <CheckCircle2 size={14} className="text-black" />
        ) : (
          <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#E8D1AB]" : "bg-white/10"}`} />
        )}
      </div>
      <span
        className={`text-sm font-semibold lg:font-bold uppercase tracking-widest ${
          active || completed ? "text-white" : "text-white/20"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
