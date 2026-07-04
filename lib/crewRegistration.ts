const COMPLETED_VALUES = new Set(["3", "complete", "completed", "true", "yes"]);

const hasValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0 && value !== "{}" && value !== "[]";
  return value !== null && value !== undefined;
};

const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 || value >= 3;
  if (typeof value === "string") return COMPLETED_VALUES.has(value.trim().toLowerCase());
  return false;
};

type CrewRegistrationMember = Record<string, unknown>;

export const isCrewRegistrationComplete = (member: CrewRegistrationMember) => {
  if (!member) return false;

  const completionSignals = [
    member.registration_completed,
    member.is_registration_completed,
    member.profile_completed,
    member.is_profile_completed,
    member.signup_completed,
    member.is_signup_completed,
    member.step3_completed,
    member.is_step3_completed,
    member.registration_step,
    member.signup_step,
    member.current_step,
    member.completed_step,
  ];

  if (completionSignals.some(isTruthyFlag)) return true;

  return [
    member.social_media_links,
    member.featured_work,
    member.recent_work,
    member.portfolio_links,
  ].some(hasValue);
};

export const completedCrewRegistrationParams = {
  registration_completed: true,
  profile_completed: true,
};
