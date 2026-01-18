'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProjectState, ProjectStateHistory } from '@/lib/types';
import {
  Check,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  Clock,
  FileCheck,
  FileEdit,
  Eye,
  MessageSquare,
  Package,
  Send,
  CheckCircle2,
  Archive,
} from 'lucide-react';

// ============================================================================
// Types & Constants
// ============================================================================

interface StateProgressBarProps {
  currentState: ProjectState;
  stateHistory?: ProjectStateHistory[];
  onStateClick?: (state: ProjectState) => void;
  showMilestones?: boolean;
  className?: string;
}

interface StateInfo {
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  phase: 'upload' | 'review' | 'edit' | 'feedback' | 'delivery' | 'complete';
  isRejectionState?: boolean;
}

// Define all 18 states with metadata
const STATE_CONFIG: Record<ProjectState, StateInfo> = {
  RAW_UPLOADED: {
    label: 'Raw Uploaded',
    shortLabel: 'Uploaded',
    description: 'Raw footage has been uploaded',
    icon: <FileCheck className="w-4 h-4" />,
    phase: 'upload',
  },
  RAW_TECH_QC_PENDING: {
    label: 'Technical QC Pending',
    shortLabel: 'Tech QC',
    description: 'Waiting for technical quality check',
    icon: <Clock className="w-4 h-4" />,
    phase: 'review',
  },
  RAW_TECH_QC_REJECTED: {
    label: 'Technical QC Rejected',
    shortLabel: 'QC Rejected',
    description: 'Technical quality check failed',
    icon: <AlertTriangle className="w-4 h-4" />,
    phase: 'review',
    isRejectionState: true,
  },
  RAW_TECH_QC_APPROVED: {
    label: 'Technical QC Approved',
    shortLabel: 'QC Passed',
    description: 'Technical quality check passed',
    icon: <Check className="w-4 h-4" />,
    phase: 'review',
  },
  COVERAGE_REVIEW_PENDING: {
    label: 'Coverage Review Pending',
    shortLabel: 'Coverage',
    description: 'Waiting for coverage review',
    icon: <Eye className="w-4 h-4" />,
    phase: 'review',
  },
  COVERAGE_REJECTED: {
    label: 'Coverage Rejected',
    shortLabel: 'Coverage Fail',
    description: 'Coverage does not meet requirements',
    icon: <AlertTriangle className="w-4 h-4" />,
    phase: 'review',
    isRejectionState: true,
  },
  EDIT_APPROVAL_PENDING: {
    label: 'Edit Approval Pending',
    shortLabel: 'Edit Approval',
    description: 'Waiting for edit approval to start',
    icon: <Clock className="w-4 h-4" />,
    phase: 'edit',
  },
  EDIT_IN_PROGRESS: {
    label: 'Edit In Progress',
    shortLabel: 'Editing',
    description: 'Editor is working on the project',
    icon: <FileEdit className="w-4 h-4" />,
    phase: 'edit',
  },
  INTERNAL_EDIT_REVIEW_PENDING: {
    label: 'Internal Edit Review',
    shortLabel: 'Internal Review',
    description: 'Edit is being reviewed internally',
    icon: <Eye className="w-4 h-4" />,
    phase: 'edit',
  },
  CLIENT_PREVIEW_READY: {
    label: 'Client Preview Ready',
    shortLabel: 'Preview Ready',
    description: 'Ready for client to preview',
    icon: <Eye className="w-4 h-4" />,
    phase: 'feedback',
  },
  CLIENT_FEEDBACK_RECEIVED: {
    label: 'Client Feedback Received',
    shortLabel: 'Feedback',
    description: 'Client has provided feedback',
    icon: <MessageSquare className="w-4 h-4" />,
    phase: 'feedback',
  },
  FEEDBACK_INTERNAL_REVIEW: {
    label: 'Feedback Internal Review',
    shortLabel: 'Review Feedback',
    description: 'Reviewing client feedback internally',
    icon: <Eye className="w-4 h-4" />,
    phase: 'feedback',
  },
  REVISION_IN_PROGRESS: {
    label: 'Revision In Progress',
    shortLabel: 'Revising',
    description: 'Working on revisions',
    icon: <RotateCcw className="w-4 h-4" />,
    phase: 'feedback',
  },
  REVISION_QC_PENDING: {
    label: 'Revision QC Pending',
    shortLabel: 'Rev QC',
    description: 'Revision quality check pending',
    icon: <Clock className="w-4 h-4" />,
    phase: 'feedback',
  },
  FINAL_EXPORT_PENDING: {
    label: 'Final Export Pending',
    shortLabel: 'Exporting',
    description: 'Preparing final export',
    icon: <Package className="w-4 h-4" />,
    phase: 'delivery',
  },
  READY_FOR_DELIVERY: {
    label: 'Ready for Delivery',
    shortLabel: 'Ready',
    description: 'Project is ready to be delivered',
    icon: <Send className="w-4 h-4" />,
    phase: 'delivery',
  },
  DELIVERED: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Project has been delivered to client',
    icon: <CheckCircle2 className="w-4 h-4" />,
    phase: 'complete',
  },
  PROJECT_CLOSED: {
    label: 'Project Closed',
    shortLabel: 'Closed',
    description: 'Project is complete and closed',
    icon: <Archive className="w-4 h-4" />,
    phase: 'complete',
  },
};

// State flow order (linear progression, excluding rejection states)
const STATE_FLOW_ORDER: ProjectState[] = [
  'RAW_UPLOADED',
  'RAW_TECH_QC_PENDING',
  'RAW_TECH_QC_APPROVED',
  'COVERAGE_REVIEW_PENDING',
  'EDIT_APPROVAL_PENDING',
  'EDIT_IN_PROGRESS',
  'INTERNAL_EDIT_REVIEW_PENDING',
  'CLIENT_PREVIEW_READY',
  'CLIENT_FEEDBACK_RECEIVED',
  'FEEDBACK_INTERNAL_REVIEW',
  'REVISION_IN_PROGRESS',
  'REVISION_QC_PENDING',
  'FINAL_EXPORT_PENDING',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'PROJECT_CLOSED',
];

// Milestone states (key checkpoints to show in collapsed view)
const MILESTONE_STATES: ProjectState[] = [
  'RAW_UPLOADED',
  'RAW_TECH_QC_APPROVED',
  'EDIT_IN_PROGRESS',
  'CLIENT_PREVIEW_READY',
  'DELIVERED',
  'PROJECT_CLOSED',
];

// Phase configuration
const PHASES = [
  { id: 'upload', label: 'Upload', color: 'blue' },
  { id: 'review', label: 'Review', color: 'purple' },
  { id: 'edit', label: 'Edit', color: 'orange' },
  { id: 'feedback', label: 'Feedback', color: 'cyan' },
  { id: 'delivery', label: 'Delivery', color: 'green' },
  { id: 'complete', label: 'Complete', color: 'emerald' },
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

function getStateIndex(state: ProjectState): number {
  return STATE_FLOW_ORDER.indexOf(state);
}

function isStateCompleted(state: ProjectState, currentState: ProjectState): boolean {
  const stateIndex = getStateIndex(state);
  const currentIndex = getStateIndex(currentState);

  // Handle rejection states
  if (currentState === 'RAW_TECH_QC_REJECTED') {
    return state === 'RAW_UPLOADED';
  }
  if (currentState === 'COVERAGE_REJECTED') {
    return stateIndex <= getStateIndex('RAW_TECH_QC_APPROVED');
  }

  return stateIndex < currentIndex;
}

function isStateCurrent(state: ProjectState, currentState: ProjectState): boolean {
  return state === currentState;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StateNodeProps {
  state: ProjectState;
  currentState: ProjectState;
  stateHistory?: ProjectStateHistory[];
  onClick?: () => void;
  isLast?: boolean;
  showConnector?: boolean;
  variant?: 'horizontal' | 'vertical';
}

function StateNode({
  state,
  currentState,
  stateHistory,
  onClick,
  isLast,
  showConnector = true,
  variant = 'horizontal',
}: StateNodeProps) {
  const config = STATE_CONFIG[state];
  const isCompleted = isStateCompleted(state, currentState);
  const isCurrent = isStateCurrent(state, currentState);
  const isRejection = config.isRejectionState;

  // Find history entry for this state
  const historyEntry = stateHistory?.find((h) => h.to_state === state);
  const isClickable = onClick && (isCompleted || isCurrent);

  const getStatusColors = () => {
    if (isRejection && isCurrent) {
      return {
        bg: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-500',
        iconColor: 'text-white',
      };
    }
    if (isCurrent) {
      return {
        bg: 'bg-[#ECE1CE]',
        border: 'border-[#ECE1CE]',
        text: 'text-[#ECE1CE]',
        iconColor: 'text-[#101010]',
      };
    }
    if (isCompleted) {
      return {
        bg: 'bg-green-500',
        border: 'border-green-500',
        text: 'text-green-500',
        iconColor: 'text-white',
      };
    }
    return {
      bg: 'bg-transparent',
      border: 'border-gray-600',
      text: 'text-gray-500',
      iconColor: 'text-gray-500',
    };
  };

  const colors = getStatusColors();

  const nodeContent = (
    <motion.div
      className={cn(
        'flex items-center gap-3',
        variant === 'vertical' ? 'flex-row' : 'flex-col',
        isClickable && 'cursor-pointer'
      )}
      whileHover={isClickable ? { scale: 1.05 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
    >
      {/* State Circle */}
      <div
        className={cn(
          'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center',
          'border-2 transition-all duration-300 flex-shrink-0',
          colors.bg,
          colors.border,
          isClickable && 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-[#101010]',
          isCurrent && 'ring-2 ring-offset-2 ring-offset-[#101010] ring-[#ECE1CE]/50'
        )}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : -1}
        aria-label={`${config.label}${isCurrent ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
        onClick={isClickable ? onClick : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <span className={cn('transition-colors', colors.iconColor)}>
          {isCompleted && !isCurrent ? (
            <Check className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            config.icon
          )}
        </span>
      </div>

      {/* Label */}
      <div
        className={cn(
          'text-center',
          variant === 'vertical' ? 'text-left flex-1' : 'w-20 md:w-24'
        )}
      >
        <p
          className={cn(
            'text-xs md:text-sm font-medium transition-colors truncate',
            colors.text
          )}
        >
          {variant === 'vertical' ? config.label : config.shortLabel}
        </p>
        {historyEntry && (
          <p className="text-[10px] text-gray-500 truncate">
            {formatDate(historyEntry.created_at)}
          </p>
        )}
      </div>
    </motion.div>
  );

  if (variant === 'vertical') {
    return (
      <div className="relative">
        {nodeContent}
        {/* Vertical Connector */}
        {showConnector && !isLast && (
          <div className="absolute left-4 md:left-5 top-10 md:top-12 w-0.5 h-8 bg-gray-700">
            {isCompleted && (
              <motion.div
                className="w-full bg-green-500"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return nodeContent;
}

interface ConnectorProps {
  isCompleted: boolean;
  hasRejection?: boolean;
}

function Connector({ isCompleted, hasRejection }: ConnectorProps) {
  return (
    <div className="flex-1 h-0.5 min-w-[20px] max-w-[60px] relative bg-gray-700 mx-1">
      <motion.div
        className={cn(
          'absolute inset-0',
          hasRejection ? 'bg-red-500' : 'bg-green-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: isCompleted ? '100%' : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StateProgressBar({
  currentState,
  stateHistory,
  onStateClick,
  showMilestones = true,
  className,
}: StateProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ProjectStateHistory | null>(null);

  // Determine which states to show
  const displayStates = useMemo(() => {
    if (isExpanded) {
      return STATE_FLOW_ORDER;
    }
    return showMilestones ? MILESTONE_STATES : STATE_FLOW_ORDER;
  }, [isExpanded, showMilestones]);

  // Check for rejection loops in history
  const hasRejections = useMemo(() => {
    if (!stateHistory) return false;
    return stateHistory.some(
      (h) =>
        h.to_state === 'RAW_TECH_QC_REJECTED' || h.to_state === 'COVERAGE_REJECTED'
    );
  }, [stateHistory]);

  // Get current phase
  const currentPhase = STATE_CONFIG[currentState]?.phase || 'upload';

  const handleStateClick = useCallback(
    (state: ProjectState) => {
      const historyEntry = stateHistory?.find((h) => h.to_state === state);
      if (historyEntry) {
        setSelectedHistory(historyEntry);
      }
      onStateClick?.(state);
    },
    [stateHistory, onStateClick]
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Phase Indicators */}
      <div className="hidden md:flex items-center justify-between mb-4 px-2">
        {PHASES.map((phase, index) => {
          const isCurrentPhase = phase.id === currentPhase;
          const isPastPhase = PHASES.findIndex((p) => p.id === currentPhase) > index;

          return (
            <div
              key={phase.id}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all',
                isCurrentPhase && 'bg-[#ECE1CE]/20 text-[#ECE1CE]',
                isPastPhase && 'bg-green-500/20 text-green-400',
                !isCurrentPhase && !isPastPhase && 'bg-gray-800 text-gray-500'
              )}
            >
              {isPastPhase && <Check className="w-3 h-3" />}
              {isCurrentPhase && <Circle className="w-3 h-3 fill-current" />}
              <span>{phase.label}</span>
            </div>
          );
        })}
      </div>

      {/* Horizontal Progress Bar (Desktop) */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between overflow-x-auto pb-4">
          {displayStates.map((state, index) => {
            const isLast = index === displayStates.length - 1;
            const isCompleted = isStateCompleted(state, currentState);

            return (
              <div key={state} className="flex items-center">
                <StateNode
                  state={state}
                  currentState={currentState}
                  stateHistory={stateHistory}
                  onClick={() => handleStateClick(state)}
                  variant="horizontal"
                />
                {!isLast && <Connector isCompleted={isCompleted} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical Progress Bar (Mobile/Tablet) */}
      <div className="lg:hidden">
        <div className="space-y-6">
          {displayStates.map((state, index) => (
            <StateNode
              key={state}
              state={state}
              currentState={currentState}
              stateHistory={stateHistory}
              onClick={() => handleStateClick(state)}
              isLast={index === displayStates.length - 1}
              showConnector={true}
              variant="vertical"
            />
          ))}
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      {showMilestones && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'text-sm text-gray-400 hover:text-[#ECE1CE] transition-colors',
              'bg-gray-800/50 hover:bg-gray-800'
            )}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show less states' : 'Show all states'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Milestones Only
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {STATE_FLOW_ORDER.length} States
              </>
            )}
          </button>
        </div>
      )}

      {/* Rejection Loop Indicator */}
      <AnimatePresence>
        {hasRejections && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-400">
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">
                This project has been through revision cycles
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              Click on states to view history details
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State History Detail Modal */}
      <AnimatePresence>
        {selectedHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedHistory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">State Transition</h3>
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Close"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* From -> To */}
                <div className="flex items-center gap-3">
                  {selectedHistory.from_state ? (
                    <span className="text-gray-400 text-sm">
                      {STATE_CONFIG[selectedHistory.from_state]?.label || selectedHistory.from_state}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm italic">Initial State</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-[#ECE1CE]" />
                  <span className="text-[#ECE1CE] text-sm font-medium">
                    {STATE_CONFIG[selectedHistory.to_state]?.label || selectedHistory.to_state}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatDate(selectedHistory.created_at)}
                </div>

                {/* Reason */}
                {selectedHistory.transition_reason && (
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="text-xs text-gray-500 mb-1">Reason:</p>
                    <p className="text-sm text-gray-300">
                      {selectedHistory.transition_reason}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StateProgressBar;
