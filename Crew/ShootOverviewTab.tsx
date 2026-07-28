import React, { useMemo } from "react";
import { MapPin, Clock, Calendar, CheckCircle2, Users } from "lucide-react";
import { getPrimaryRoleLabel, getProjectTimeText } from "@/lib/utils/shootDetails";
import {
  resolveTimelineStage,
  TIMELINE_STAGE,
  timelineStageToHeaderLabel,
} from "@/lib/utils/projectTimeline";

type TimestampValue = string | number | Date | null | undefined;

type CrewMember = {
  crew_member_id?: string | number | null;
  first_name?: string | null;
  last_name?: string | null;
  primary_role?: unknown;
  role_name?: string | null;
};

type ProjectAssignment = {
  id?: string | number | null;
  crew_member_id?: string | number | null;
  crew_member?: CrewMember | null;
  acceptance_status?: string | null;
  status?: string | null;
};

type LeadDetails = {
  client_name?: string | null;
  last_activity_at?: TimestampValue;
};

type ProjectLike = {
  assignedCrew?: ProjectAssignment[] | null;
  assigned_crews?: ProjectAssignment[] | null;
  booking_days?: {
    duration_hours?: number | string | null;
    date?: string | null;
    event_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    time_zone?: string | null;
  }[] | null;
  booking_type?: string | null;
  bookingType?: string | null;
  city?: string | null;
  client?: { name?: string | null } | null;
  client_name?: string | null;
  country?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  event_start_time?: string | null;
  guest_name?: string | null;
  is_cancelled?: number | boolean | null;
  lead_details?: LeadDetails | null;
  location?: string | null;
  project_name?: string | null;
  skills_needed?: unknown;
  start_time?: string | null;
  end_time?: string | null;
  state?: string | null;
  status?: number | string | null;
  timeline_status?: number | string | null;
  time_zone?: string | null;
};

type ProjectDetailsResponse = {
  assignedCrew?: ProjectAssignment[] | null;
  lead_details?: LeadDetails | null;
};

type ShootOverviewTabProps = {
  project?: ProjectLike | null;
  apiResponse?: ProjectDetailsResponse | null;
  currentCrewMemberId?: string | number | null;
  isDark?: boolean;
};

export default function ShootOverviewTab({ project, apiResponse, currentCrewMemberId, isDark = true }: ShootOverviewTabProps) {
  const assignedCrew = getAssignedCrew(project, apiResponse);
  const currentAssignment = assignedCrew.find((assignment) => {
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
  const lastUpdatedText = useMemo(() => {
    const lastActivityAt = apiResponse?.lead_details?.last_activity_at;
    if (!lastActivityAt) return "N/A";

    const lastActivityDate = new Date(String(lastActivityAt));
    if (Number.isNaN(lastActivityDate.getTime())) return "N/A";

    return lastActivityDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [apiResponse?.lead_details?.last_activity_at]);
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
        {/* Core Overview Card */}
        <div className={`border rounded-lg lg:rounded-3xl p-4 lg:p-8 transition-all ${isDark ? "bg-white/[0.01] border-white/5" : "bg-[#FFFDF9] border-[#E5E5E5] shadow-sm"
          }`}>
          <h3 className={`lg:text-xl font-bold mb-4 lg:mb-10 ${isDark ? "text-white" : "text-black"}`}>Shoot Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 lg:gap-y-10 lg:gap-x-16">
            <DetailItem label="Shoot Name" value={project?.project_name} isDark={isDark} />
            <DetailItem label="Client Name" value={clientName} isDark={isDark} />

            <DetailItem
              label="Shoot Type"
              isDark={isDark}
              value={
                <span className={`px-4 py-1 rounded-full text-xs uppercase tracking-widest font-bold border ${isDark
                    ? "bg-white/5 text-white/70 border-white/10"
                    : "bg-black/5 text-black/70 border-black/10"
                  }`}>
                  {skillsText}
                </span>
              }
            />

            <DetailItem
              label="Location"
              value={locationText}
              isDark={isDark}
              icon={<MapPin size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#735A2B]"} />}
            />

            <DetailItem
              label="Shoot Date"
              value={formatDate(project?.event_date)}
              isDark={isDark}
              icon={<Calendar size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#735A2B]"} />}
            />

            <DetailItem
              label="Time & Timezone"
              value={timeText}
              isDark={isDark}
              icon={<Clock size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#735A2B]"} />}
            />

            <DetailItem label="Assigned Role" value={assignedRoleText} isDark={isDark} />
            <DetailItem label="Booking Type" value={bookingType} isDark={isDark} />
          </div>
        </div>

        {/* Creative Partners Roster Card */}
        <div className={`border rounded-lg lg:rounded-3xl p-4 lg:p-8 transition-all ${isDark ? "bg-white/[0.01] border-white/5" : "bg-[#FFFDF9] border-[#E5E5E5] shadow-sm"
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className={isDark ? "text-[#E8D1AB]" : "text-[#735A2B]"} />
            <h3 className={`lg:text-lg font-bold ${isDark ? "text-white" : "text-black"}`}>
              Creative Partners ({assignedCrew.length})
            </h3>
          </div>

          {assignedCrew.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedCrew.map((assignment) => {
                const member = assignment?.crew_member || {};
                const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Creative Partner";
                const role = getPrimaryRoleLabel(member.primary_role, member.role_name);
                const isYou =
                  currentCrewMemberId &&
                  String(member.crew_member_id || assignment?.crew_member_id) === String(currentCrewMemberId);

                return (
                  <div
                    key={assignment?.id || member.crew_member_id || name}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${isDark
                        ? "border-white/5 bg-white/[0.02]"
                        : "border-[#E5E5E5] bg-[#FFFCF6]"
                      }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isDark ? "text-white/90" : "text-black/90"}`}>
                        {name}
                        {isYou && (
                          <span className={`ml-2 text-xs font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#735A2B]"}`}>
                            (You)
                          </span>
                        )}
                      </p>
                      <p className={`truncate text-xs ${isDark ? "text-white/45" : "text-black/50"}`}>{role}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isDark
                        ? "border-[#E8D1AB]/15 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                        : "border-[#E8D1AB]/40 bg-[#FDF9F0] text-[#735A2B]"
                      }`}>
                      {assignment?.acceptance_status || assignment?.status || "Assigned"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`h-20 flex items-center justify-center border-2 border-dashed rounded-lg lg:rounded-2xl text-sm transition-colors ${isDark ? "border-white/5 text-white/20" : "border-[#E5E5E5] text-black/30"
              }`}>
              No creative partners assigned
            </div>
          )}
        </div>

        {/* Equipment Requested Box */}
        <div className={`border rounded-lg lg:rounded-3xl p-4 lg:p-8 transition-all ${isDark ? "bg-white/[0.01] border-white/5" : "bg-[#FFFDF9] border-[#E5E5E5] shadow-sm"
          }`}>
          <h3 className={`lg:text-lg font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Equipment Needed (0/0)</h3>
          <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-lg lg:rounded-2xl text-sm transition-colors ${isDark ? "border-white/5 text-white/20" : "border-[#E5E5E5] text-black/30"
            }`}>
            No equipment items requested
          </div>
        </div>
      </div>

      {/* RIGHT: STATUS & TIMELINE */}
      <div className="lg:col-span-4 space-y-4 lg:space-y-6">
        {/* VERTICAL STEPPER CONTAINER */}
        <div className={`border rounded-lg lg:rounded-3xl p-4 lg:p-8 transition-all ${isDark
            ? "bg-[#E8D1AB]/[0.03] border-[#E8D1AB]/10"
            : "bg-[#FFFDF9] border-[#E8D1AB]/30 shadow-sm"
          }`}>
          <div className="space-y-8 relative">
            {/* Vertical Track Connector Line */}
            <div className={`absolute left-[11px] top-4 bottom-2 w-[1px] transition-colors ${isDark ? "bg-white/10" : "bg-black/10"
              }`} />

            <StatusStep
              label="Pending"
              completed={timelineStage > TIMELINE_STAGE.INITIATED}
              active={timelineStage === TIMELINE_STAGE.INITIATED}
              isDark={isDark}
            />
            <StatusStep
              label="Pre Production"
              completed={timelineStage > TIMELINE_STAGE.PRE_PRODUCTION}
              active={timelineStage === TIMELINE_STAGE.PRE_PRODUCTION}
              isDark={isDark}
            />
            <StatusStep
              label="Post Production"
              completed={timelineStage > TIMELINE_STAGE.POST_PRODUCTION}
              active={timelineStage === TIMELINE_STAGE.POST_PRODUCTION}
              isDark={isDark}
            />
            <StatusStep
              label="Delivered"
              isDark={isDark}
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

        {/* STATUS SUMMARY TRACKER BOX */}
        <div className={`border rounded-lg lg:rounded-3xl p-4 lg:p-8 space-y-4 lg:space-y-6 transition-all ${isDark ? "bg-white/[0.02] border-white/5" : "bg-[#FFFDF9] border-[#E5E5E5] shadow-sm"
          }`}>
          <h4 className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-white/60" : "text-black/50"}`}>
            Shoot Status
          </h4>

          <div>
            <p className={`text-[10px] uppercase font-bold mb-1 ${isDark ? "text-white/30" : "text-black/40"}`}>
              Current Stage
            </p>
            <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white/90" : "text-black/90"}`}>
              {timelineLabel}
            </p>
          </div>

          <div>
            <span className={`px-5 py-1.5 rounded-full text-xs font-bold border ${isDark
                ? "bg-[#E8D1AB]/10 text-[#E8D1AB] border-[#E8D1AB]/20"
                : "bg-[#E8D1AB]/20 text-[#735A2B] border-[#E8D1AB]/40"
              }`}>
              {isCancelled ? "Cancelled" : "On Track"}
            </span>
          </div>

          <div className={`pt-4 border-t ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
            <p className={`text-[10px] uppercase font-bold mb-1 ${isDark ? "text-white/30" : "text-black/40"}`}>
              Last Updated
            </p>
            <p className={`text-xs ${isDark ? "text-white/50" : "text-black/60"}`}>{lastUpdatedText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- INTERNAL HELPERS --- */

function DetailItem({ label, value, icon, isDark }: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div className="space-y-1 lg:space-y-2">
      <p className={`text-xs uppercase font-bold tracking-[0.15em] ${isDark ? "text-white/30" : "text-black/40"}`}>
        {label}
      </p>
      <div className={`flex items-start gap-3 text-sm lg:text-base font-medium leading-tight ${isDark ? "text-white/90" : "text-black/80"
        }`}>
        {icon && <span className="mt-0.5">{icon}</span>}
        <span>{value || "Not Specified"}</span>
      </div>
    </div>
  );
}

function StatusStep({ label, completed, active, isDark }: {
  label: string;
  completed?: boolean;
  active?: boolean;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-3 lg:gap-5 relative z-10">
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${completed
            ? "bg-[#E8D1AB] border-[#E8D1AB]"
            : active
              ? isDark
                ? "bg-black border-[#E8D1AB] ring-4 ring-[#E8D1AB]/10"
                : "bg-white border-[#735A2B] ring-4 ring-[#E8D1AB]/30"
              : isDark
                ? "bg-[#0A0A0A] border-white/10"
                : "bg-[#FFFDF9] border-[#E5E5E5]"
          }`}
      >
        {completed ? (
          <CheckCircle2 size={14} className="text-black" />
        ) : (
          <div className={`h-1.5 w-1.5 rounded-full ${active
              ? (isDark ? "bg-[#E8D1AB]" : "bg-[#735A2B]")
              : (isDark ? "bg-white/10" : "bg-black/15")
            }`} />
        )}
      </div>
      <span
        className={`text-sm font-semibold lg:font-bold uppercase tracking-widest ${active || completed
            ? (isDark ? "text-white" : "text-black/90")
            : (isDark ? "text-white/20" : "text-black/30")
          }`}
      >
        {label}
      </span>
    </div>
  );
}

function getAssignedCrew(
  project?: ProjectLike | null,
  apiResponse?: ProjectDetailsResponse | null,
): ProjectAssignment[] {
  if (Array.isArray(apiResponse?.assignedCrew)) return apiResponse.assignedCrew;
  if (Array.isArray(project?.assignedCrew)) return project.assignedCrew;
  if (Array.isArray(project?.assigned_crews)) return project.assigned_crews;
  return [];
}
