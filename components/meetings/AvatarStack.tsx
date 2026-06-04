import React from 'react';
import {
  type MeetingItem,
} from "@/lib/meetingsApi";

// Define Types based on your JSON structure
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

interface MeetingData {
  id: string | number | undefined;
  meeting_status: string;
  meeting_date_time: string;
  meeting_end_time: string;
  meeting_type: string;
  meeting_title: string;
  description: string;
  meetLink: string;
  duration: number;
  order: Order;
  client: UserProfile | null;
  admin: UserProfile | null;
  cps: UserProfile[] | null;
  participants: UserProfile[];
  created_by: UserProfile;
  participant_responses: any[];
  change_request: any | null;
}

interface ParticipantAvatarStackProps {
  meeting: MeetingItem;
  isDark?: boolean;
}

interface FlattenedParticipant {
  id: number;
  name: string;
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

  // Consistent background colors mirroring the snapshot design asset
  const bgColors: string[] = [
    'bg-[#FFF8E7] text-gray-800',
    'bg-[#D4F7DC] text-gray-800',
    'bg-[#FEF3C7] text-gray-800',
    'bg-[#E6CBA8] text-gray-900',
  ];

  const maxVisible = 3;
  const visibleParticipants = participantsList.slice(0, maxVisible);
  const remainingCount = participantsList.length - maxVisible;

  // Dynamic conditional class assignments mapping out theme styles
  const avatarBorder = isDark ? 'border-[#121212]' : 'border-gray-100';

  return (
    <div className={`flex items-center justify-center w-fit transition-colors duration-300`}>
      <div className="flex -space-x-2.5 lg:-space-x-4 overflow-hidden">
        {visibleParticipants.map((participant, index) => {
          const colorClass = bgColors[index % bgColors.length];
          return (
            <div
              key={`${participant.id}-${participant.role}-${index}`}
              className={`
                inline-flex items-center justify-center rounded-full w-10 h-10 text-xs lg:w-12 lg:h-12 lg:text-base font-semibold border-2 lg:border-4 transition-all hover:translate-y-[-4px] select-none uppercase tracking-wider
                ${avatarBorder} ${colorClass}
              `}
              title={`${participant.name} (${participant.role.toUpperCase()})`}
            >
              {getInitials(participant.name)}
            </div>
          );
        })}

        {/* Mobile-responsive Plus Counter Indicator */}
        {remainingCount > 0 && (
          <div
            className={`inline-flex items-center justify-center rounded-full w-10 h-10 text-xs lg:w-12 lg:h-12 lg:text-base font-semibold border-2 lg:border-4 bg-[#E6CBA8] text-gray-900 select-none ${avatarBorder}`}
            title={`${remainingCount} more participants`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantAvatarStack;