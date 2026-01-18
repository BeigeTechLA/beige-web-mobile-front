'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Project, ProjectState } from '@/lib/types';
import {
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  FileEdit,
  CheckCircle2,
  RotateCcw,
  Package,
  Calendar,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  className?: string;
}

interface StateConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: 'yellow' | 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  requiresAction?: boolean;
  actionLabel?: string;
}

// ============================================================================
// State Configuration
// ============================================================================

const STATE_CONFIG: Record<ProjectState, StateConfig> = {
  RAW_UPLOADED: {
    label: 'Upload Required',
    description: 'Upload your RAW footage',
    icon: <Upload className="w-4 h-4" />,
    color: 'yellow',
    requiresAction: true,
    actionLabel: 'Upload Files',
  },
  RAW_TECH_QC_PENDING: {
    label: 'Tech QC Pending',
    description: 'Awaiting technical review',
    icon: <Clock className="w-4 h-4" />,
    color: 'blue',
  },
  RAW_TECH_QC_REJECTED: {
    label: 'Re-upload Required',
    description: 'Files rejected - action needed',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'red',
    requiresAction: true,
    actionLabel: 'Re-upload',
  },
  RAW_TECH_QC_APPROVED: {
    label: 'QC Approved',
    description: 'Technical check passed',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'green',
  },
  COVERAGE_REVIEW_PENDING: {
    label: 'Coverage Review',
    description: 'Reviewing footage coverage',
    icon: <Eye className="w-4 h-4" />,
    color: 'blue',
  },
  COVERAGE_REJECTED: {
    label: 'Coverage Issue',
    description: 'Additional footage needed',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'red',
    requiresAction: true,
    actionLabel: 'View Feedback',
  },
  EDIT_APPROVAL_PENDING: {
    label: 'Edit Approval',
    description: 'Waiting for edit approval',
    icon: <Clock className="w-4 h-4" />,
    color: 'purple',
  },
  EDIT_IN_PROGRESS: {
    label: 'In Editing',
    description: 'Editor is working on project',
    icon: <FileEdit className="w-4 h-4" />,
    color: 'orange',
  },
  INTERNAL_EDIT_REVIEW_PENDING: {
    label: 'Internal Review',
    description: 'Edit under internal review',
    icon: <Eye className="w-4 h-4" />,
    color: 'purple',
  },
  CLIENT_PREVIEW_READY: {
    label: 'Preview Ready',
    description: 'Client can preview edit',
    icon: <Eye className="w-4 h-4" />,
    color: 'blue',
  },
  CLIENT_FEEDBACK_RECEIVED: {
    label: 'Feedback Received',
    description: 'Client has provided feedback',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'blue',
  },
  FEEDBACK_INTERNAL_REVIEW: {
    label: 'Reviewing Feedback',
    description: 'Processing client feedback',
    icon: <Eye className="w-4 h-4" />,
    color: 'purple',
  },
  REVISION_IN_PROGRESS: {
    label: 'Revising',
    description: 'Working on revisions',
    icon: <RotateCcw className="w-4 h-4" />,
    color: 'orange',
    requiresAction: true,
    actionLabel: 'Upload Revision',
  },
  REVISION_QC_PENDING: {
    label: 'Revision QC',
    description: 'Checking revisions',
    icon: <Clock className="w-4 h-4" />,
    color: 'blue',
  },
  FINAL_EXPORT_PENDING: {
    label: 'Exporting',
    description: 'Preparing final export',
    icon: <Package className="w-4 h-4" />,
    color: 'purple',
  },
  READY_FOR_DELIVERY: {
    label: 'Ready',
    description: 'Ready for client delivery',
    icon: <Package className="w-4 h-4" />,
    color: 'green',
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Project delivered to client',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'green',
  },
  PROJECT_CLOSED: {
    label: 'Closed',
    description: 'Project complete',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'gray',
  },
};

// ============================================================================
// Color Utilities
// ============================================================================

const getColorClasses = (color: StateConfig['color']) => {
  const colors = {
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    gray: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      glow: 'shadow-gray-500/20',
    },
  };
  return colors[color];
};

// ============================================================================
// Date Formatting
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
}

// ============================================================================
// Component
// ============================================================================

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const stateConfig = STATE_CONFIG[project.current_state];
  const colorClasses = getColorClasses(stateConfig.color);

  const hasAction = useMemo(() => {
    return stateConfig.requiresAction;
  }, [stateConfig]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Project: ${project.project_name}. Status: ${stateConfig.label}. ${hasAction ? 'Action required.' : ''} Click to view details.`}
      className={cn(
        'relative overflow-hidden rounded-xl cursor-pointer',
        'bg-[#1a1a1a] border transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE] focus:ring-offset-2 focus:ring-offset-[#101010]',
        hasAction
          ? cn(colorClasses.border, 'hover:shadow-lg', colorClasses.glow)
          : 'border-gray-800 hover:border-gray-700',
        className
      )}
    >
      {/* Action Required Indicator */}
      {hasAction && (
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            stateConfig.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'
          )}
          aria-hidden="true"
        />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate pr-2">
              {project.project_name}
            </h3>
            <p className="text-gray-500 text-sm font-mono">
              {project.project_code}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0',
              colorClasses.bg
            )}
          >
            <span className={colorClasses.text}>{stateConfig.icon}</span>
            <span className={cn('text-xs font-medium', colorClasses.text)}>
              {stateConfig.label}
            </span>
          </div>
        </div>

        {/* Status Description */}
        <p className="text-gray-400 text-sm mb-4">{stateConfig.description}</p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>Updated {formatRelativeTime(project.state_changed_at)}</span>
          </div>

          {/* Action Button / Chevron */}
          <div
            className={cn(
              'flex items-center gap-1 transition-colors',
              hasAction ? colorClasses.text : 'text-gray-500'
            )}
          >
            {hasAction && stateConfig.actionLabel && (
              <span className="text-xs font-medium">{stateConfig.actionLabel}</span>
            )}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        className="absolute inset-0 bg-white/[0.02] opacity-0 pointer-events-none"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />
    </motion.article>
  );
}

export default ProjectCard;
