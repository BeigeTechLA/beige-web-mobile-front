export const TIMELINE_STAGE = {
  INITIATED: 0,
  PRE_PRODUCTION: 1,
  SHOOT_DAY: 2,
  POST_PRODUCTION: 3,
  REVISION: 4,
  COMPLETED: 5,
  ASSETS_DELIVERED: 6,
  CANCELLED: 7,
} as const;

type TimelineLikeProject = {
  timeline_status?: number | string | null;
  status?: number | string | null;
  event_date?: string | null;
  is_cancelled?: number | boolean | null;
};

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDateOnly = (value?: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const legacyBookingStatusToTimeline = (status: number) => {
  if (status <= 0) return TIMELINE_STAGE.INITIATED;
  if (status === 1) return TIMELINE_STAGE.PRE_PRODUCTION;
  if (status === 2) return TIMELINE_STAGE.POST_PRODUCTION;
  if (status === 3) return TIMELINE_STAGE.REVISION;
  if (status >= 4) return TIMELINE_STAGE.COMPLETED;
  return TIMELINE_STAGE.INITIATED;
};

export const resolveTimelineStage = (project?: TimelineLikeProject | null): number => {
  if (!project) return TIMELINE_STAGE.INITIATED;

  if (Number(project.is_cancelled) === 1) {
    return TIMELINE_STAGE.CANCELLED;
  }

  const directTimeline = toNumber(project.timeline_status);
  if (directTimeline !== null && directTimeline >= 0 && directTimeline <= 7) {
    return directTimeline;
  }

  const rawStatus = toNumber(project.status) ?? 0;
  let stage = legacyBookingStatusToTimeline(rawStatus);

  const today = toDateOnly(new Date().toISOString());
  const eventDate = toDateOnly(project.event_date);

  if (eventDate && today) {
    if (eventDate === today) {
      stage = Math.max(stage, TIMELINE_STAGE.SHOOT_DAY);
    } else if (eventDate < today) {
      stage = Math.max(stage, TIMELINE_STAGE.POST_PRODUCTION);
    }
  }

  return stage;
};

export const timelineStageToDashboardLabel = (stage: number): string => {
  if (stage === TIMELINE_STAGE.INITIATED) return "Initiated";
  if (stage === TIMELINE_STAGE.PRE_PRODUCTION) return "PreProduction";
  if (stage === TIMELINE_STAGE.SHOOT_DAY) return "Shoot Day";
  if (stage === TIMELINE_STAGE.POST_PRODUCTION) return "PostProduction";
  if (stage === TIMELINE_STAGE.REVISION) return "Revision";
  if (stage === TIMELINE_STAGE.COMPLETED) return "Completed";
  if (stage === TIMELINE_STAGE.ASSETS_DELIVERED) return "Assets Delivered";
  if (stage === TIMELINE_STAGE.CANCELLED) return "Cancelled";
  return "Unknown";
};

export const timelineStageToHeaderLabel = (stage: number): string => {
  if (stage === TIMELINE_STAGE.PRE_PRODUCTION) return "Pre Production";
  if (stage === TIMELINE_STAGE.POST_PRODUCTION) return "Post Production";
  return timelineStageToDashboardLabel(stage);
};
