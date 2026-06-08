import React from 'react';
import { type MeetingItem } from "@/lib/meetingsApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Order {
  id: number;
  name: string;
}

interface ParticipantAvatarStackProps {
  meeting: MeetingItem;
  isDark?: boolean;
}

interface FlattenedParticipant {
  id: string | number | undefined;
  name: string | null | undefined;
  role: 'client' | 'admin' | 'cp';
}

const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ParticipantAvatarStack: React.FC<ParticipantAvatarStackProps> = ({
  meeting,
  isDark = true
}) => {
  if (!meeting) return null;

  const participantsList: FlattenedParticipant[] = [];

  if (meeting.client) {
    participantsList.push({ id: meeting.client.id, name: meeting.client.name, role: 'client' });
  }
  if (meeting.admin) {
    participantsList.push({ id: meeting.admin.id, name: meeting.admin.name, role: 'admin' });
  }
  if (meeting.cps && Array.isArray(meeting.cps)) {
    meeting.cps.forEach((cp) => {
      participantsList.push({ id: cp.id, name: cp.name, role: 'cp' });
    });
  }

  const bgColors: string[] = [
    'bg-[#FFF8E7] text-gray-800',
    'bg-[#D4F7DC] text-gray-800',
    'bg-[#FEF3C7] text-gray-800',
    'bg-[#E6CBA8] text-gray-900',
  ];

  const maxVisible = 3;
  const visibleParticipants = participantsList.slice(0, maxVisible);
  const remainingCount = participantsList.length - maxVisible;

  const avatarBorder = isDark ? 'border-[#121212]' : 'border-[#FFFCF6]';

  const tooltipContentClass = isDark
    ? 'bg-[#1A1A1A] text-[#E8D1AB] border-[#333333]'
    : 'bg-white text-black border-[#E5E5E5]';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center w-fit transition-colors duration-300 py-1">
        {/* CHANGED: Removed overflow-hidden from this container layout row */}
        <div className="flex -space-x-2.5 lg:-space-x-4">
          {visibleParticipants.map((participant, index) => {
            const colorClass = bgColors[index % bgColors.length];
            return (
              <Tooltip key={`${participant.id}-${participant.role}-${index}`}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      inline-flex items-center justify-center rounded-full w-10 h-10 text-xs lg:w-12 lg:h-12 lg:text-base font-semibold border-2 lg:border-4 transition-transform duration-200 hover:-translate-y-1 select-none uppercase tracking-wider cursor-default will-change-transform
                      ${avatarBorder} ${colorClass}
                    `}
                  >
                    {getInitials(participant.name || "N/A")}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg shadow-md ${tooltipContentClass}`}
                >
                  <p className="font-semibold">{participant.name}</p>
                  <p className="text-[10px] opacity-60 uppercase font-normal">{participant.role}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Plus Counter Indicator with Tooltip showing all hidden participants */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`inline-flex items-center justify-center rounded-full w-10 h-10 text-xs lg:w-12 lg:h-12 lg:text-base font-semibold border-2 lg:border-4 bg-[#E6CBA8] text-gray-900 select-none cursor-default ${avatarBorder}`}
                >
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className={`px-3 py-2 text-xs font-medium border rounded-lg shadow-md max-w-xs ${tooltipContentClass}`}
              >
                <p className="font-semibold mb-1 border-b border-current/10 pb-1">Remaining Crew:</p>
                <ul className="space-y-0.5 font-normal opacity-90">
                  {participantsList.slice(maxVisible).map((p, idx) => (
                    <li key={`${p.id}-${idx}`} className="truncate">
                      • {p.name} <span className="text-[10px] opacity-60 uppercase">({p.role})</span>
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ParticipantAvatarStack;