'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetProjectsByUserQuery,
  useTransitionStateMutation,
  useUpdateProjectMutation,
  useSubmitFeedbackMutation,
} from '@/lib/redux/features/projects/projectsApi';
import { StateProgressBar } from '@/components/projects';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project, ProjectState } from '@/lib/types';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  AlertTriangle,
  Users,
  FileVideo,
  BarChart3,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit3,
  UserPlus,
  Download,
  Trash2,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  XCircle,
  GripVertical,
  ExternalLink,
  MessageSquare,
  Play,
  FileCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types & Constants
// ============================================================================

interface FilterState {
  state: ProjectState | '';
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

interface SortConfig {
  key: keyof Project | '';
  direction: 'asc' | 'desc';
}

// State categories for filtering
const STATE_CATEGORIES = {
  all: { label: 'All States', states: [] as ProjectState[] },
  qc_pending: {
    label: 'Pending QC',
    states: ['RAW_TECH_QC_PENDING', 'COVERAGE_REVIEW_PENDING', 'REVISION_QC_PENDING'] as ProjectState[],
  },
  rejected: {
    label: 'Rejected',
    states: ['RAW_TECH_QC_REJECTED', 'COVERAGE_REJECTED'] as ProjectState[],
  },
  in_progress: {
    label: 'In Progress',
    states: ['EDIT_IN_PROGRESS', 'REVISION_IN_PROGRESS'] as ProjectState[],
  },
  client_review: {
    label: 'Client Review',
    states: ['CLIENT_PREVIEW_READY', 'CLIENT_FEEDBACK_RECEIVED'] as ProjectState[],
  },
  delivery: {
    label: 'Delivery',
    states: ['READY_FOR_DELIVERY', 'DELIVERED'] as ProjectState[],
  },
};

// All project states for detailed filter
const ALL_STATES: ProjectState[] = [
  'RAW_UPLOADED',
  'RAW_TECH_QC_PENDING',
  'RAW_TECH_QC_REJECTED',
  'RAW_TECH_QC_APPROVED',
  'COVERAGE_REVIEW_PENDING',
  'COVERAGE_REJECTED',
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

// State display configuration
const STATE_CONFIG: Record<ProjectState, { label: string; color: string }> = {
  RAW_UPLOADED: { label: 'Raw Uploaded', color: 'bg-blue-500' },
  RAW_TECH_QC_PENDING: { label: 'Tech QC Pending', color: 'bg-yellow-500' },
  RAW_TECH_QC_REJECTED: { label: 'Tech QC Rejected', color: 'bg-red-500' },
  RAW_TECH_QC_APPROVED: { label: 'Tech QC Approved', color: 'bg-green-500' },
  COVERAGE_REVIEW_PENDING: { label: 'Coverage Review', color: 'bg-yellow-500' },
  COVERAGE_REJECTED: { label: 'Coverage Rejected', color: 'bg-red-500' },
  EDIT_APPROVAL_PENDING: { label: 'Edit Approval', color: 'bg-purple-500' },
  EDIT_IN_PROGRESS: { label: 'Editing', color: 'bg-orange-500' },
  INTERNAL_EDIT_REVIEW_PENDING: { label: 'Internal Review', color: 'bg-cyan-500' },
  CLIENT_PREVIEW_READY: { label: 'Preview Ready', color: 'bg-teal-500' },
  CLIENT_FEEDBACK_RECEIVED: { label: 'Feedback Received', color: 'bg-indigo-500' },
  FEEDBACK_INTERNAL_REVIEW: { label: 'Reviewing Feedback', color: 'bg-violet-500' },
  REVISION_IN_PROGRESS: { label: 'Revising', color: 'bg-orange-500' },
  REVISION_QC_PENDING: { label: 'Revision QC', color: 'bg-yellow-500' },
  FINAL_EXPORT_PENDING: { label: 'Exporting', color: 'bg-emerald-500' },
  READY_FOR_DELIVERY: { label: 'Ready', color: 'bg-green-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-600' },
  PROJECT_CLOSED: { label: 'Closed', color: 'bg-gray-500' },
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeSinceStateChange(dateString: string): string {
  const now = new Date();
  const stateDate = new Date(dateString);
  const diffMs = now.getTime() - stateDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ title, value, change, icon, color = 'bg-[#ECE1CE]' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-xs mt-2',
              change >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}% vs last week</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', color, 'text-[#101010]')}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface StateFilterDropdownProps {
  value: ProjectState | '';
  onChange: (value: ProjectState | '') => void;
}

function StateFilterDropdown({ value, onChange }: StateFilterDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProjectState | '')}>
      <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-gray-700">
        <SelectValue placeholder="All States" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All States</SelectItem>
        {ALL_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', STATE_CONFIG[state].color)} />
              {STATE_CONFIG[state].label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface DateRangeFilterProps {
  value: 'all' | 'today' | 'week' | 'month';
  onChange: (value: 'all' | 'today' | 'week' | 'month') => void;
}

function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] bg-[#1a1a1a] border-gray-700">
        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search projects..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-[250px] bg-[#1a1a1a] border-gray-700"
      />
    </div>
  );
}

interface BulkActionsMenuProps {
  projectIds: number[];
  onClear: () => void;
  onBulkApprove: () => void;
  onExport: () => void;
}

function BulkActionsMenu({ projectIds, onClear, onBulkApprove, onExport }: BulkActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="bg-[#ECE1CE] text-[#101010] border-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{projectIds.length} Selected</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50"
          >
            <button
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2"
              onClick={() => {
                onBulkApprove();
                setIsOpen(false);
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Bulk Approve
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2"
              onClick={() => {
                onExport();
                setIsOpen(false);
              }}
            >
              <Download className="w-4 h-4 text-blue-400" />
              Export to CSV
            </button>
            <hr className="border-gray-700" />
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:bg-gray-800 flex items-center gap-2"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
            >
              <X className="w-4 h-4" />
              Clear Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProjectsTableProps {
  projects: Project[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  sortConfig: SortConfig;
  onSort: (key: keyof Project) => void;
  onProjectClick: (project: Project) => void;
  onQuickAction: (project: Project, action: 'approve' | 'reject' | 'assign') => void;
}

function ProjectsTable({
  projects,
  selectedIds,
  onSelectionChange,
  sortConfig,
  onSort,
  onProjectClick,
  onQuickAction,
}: ProjectsTableProps) {
  const allSelected = projects.length > 0 && selectedIds.length === projects.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < projects.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(projects.map((p) => p.project_id));
    }
  };

  const toggleOne = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof Project }) => (
    <button
      className="flex items-center gap-1 hover:text-[#ECE1CE] transition-colors"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowUpDown
        className={cn(
          'w-3 h-3',
          sortConfig.key === sortKey ? 'text-[#ECE1CE]' : 'text-gray-500'
        )}
      />
    </button>
  );

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-[#151515]">
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-600 bg-[#101010] text-[#ECE1CE] focus:ring-[#ECE1CE]"
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <SortableHeader label="Project Code" sortKey="project_code" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <SortableHeader label="Name" sortKey="project_name" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                State
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Editor
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <SortableHeader label="Created" sortKey="created_at" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                In State
              </th>
              <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {projects.map((project) => {
              const isSelected = selectedIds.includes(project.project_id);
              const stateConfig = STATE_CONFIG[project.current_state];
              const isQCPending = project.current_state.includes('QC_PENDING');
              const isRejected = project.current_state.includes('REJECTED');

              return (
                <motion.tr
                  key={project.project_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'hover:bg-[#202020] cursor-pointer transition-colors',
                    isSelected && 'bg-[#202020]',
                    isRejected && 'bg-red-500/5'
                  )}
                  onClick={() => onProjectClick(project)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(project.project_id)}
                      className="w-4 h-4 rounded border-gray-600 bg-[#101010] text-[#ECE1CE] focus:ring-[#ECE1CE]"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-[#ECE1CE]">{project.project_code}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-white font-medium">{project.project_name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        stateConfig.color,
                        'text-white'
                      )}
                    >
                      {isRejected && <XCircle className="w-3 h-3" />}
                      {isQCPending && <Clock className="w-3 h-3" />}
                      {stateConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">Client #{project.client_user_id}</span>
                  </td>
                  <td className="px-4 py-4">
                    {project.assigned_editor_id ? (
                      <span className="text-sm text-gray-400">
                        Editor #{project.assigned_editor_id}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">{formatDate(project.created_at)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">
                      {getTimeSinceStateChange(project.state_changed_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {isQCPending && (
                        <>
                          <button
                            className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                            onClick={() => onQuickAction(project, 'approve')}
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            onClick={() => onQuickAction(project, 'reject')}
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!project.assigned_editor_id && (
                        <button
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                          onClick={() => onQuickAction(project, 'assign')}
                          title="Assign Editor"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/admin/projects/${project.project_id}`}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                        title="View Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <FileVideo className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No projects found matching your filters</p>
        </div>
      )}
    </div>
  );
}

interface ProjectsKanbanProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onDragEnd: (projectId: number, newState: ProjectState) => void;
}

function ProjectsKanban({ projects, onProjectClick, onDragEnd }: ProjectsKanbanProps) {
  const [draggedProject, setDraggedProject] = useState<number | null>(null);

  // Kanban columns - key workflow states
  const columns: { state: ProjectState; label: string; color: string }[] = [
    { state: 'RAW_TECH_QC_PENDING', label: 'QC Pending', color: 'bg-yellow-500' },
    { state: 'EDIT_IN_PROGRESS', label: 'Editing', color: 'bg-orange-500' },
    { state: 'CLIENT_PREVIEW_READY', label: 'Client Preview', color: 'bg-teal-500' },
    { state: 'REVISION_IN_PROGRESS', label: 'Revisions', color: 'bg-purple-500' },
    { state: 'READY_FOR_DELIVERY', label: 'Ready', color: 'bg-green-500' },
    { state: 'DELIVERED', label: 'Delivered', color: 'bg-green-600' },
  ];

  const getProjectsForColumn = (state: ProjectState) => {
    return projects.filter((p) => p.current_state === state);
  };

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetState: ProjectState) => {
    e.preventDefault();
    if (draggedProject) {
      onDragEnd(draggedProject, targetState);
    }
    setDraggedProject(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnProjects = getProjectsForColumn(column.state);

        return (
          <div
            key={column.state}
            className="flex-shrink-0 w-72 bg-[#151515] rounded-xl border border-gray-800"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.state)}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <h3 className="font-medium text-white">{column.label}</h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {columnProjects.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
              {columnProjects.map((project) => (
                <motion.div
                  key={project.project_id}
                  layoutId={`project-${project.project_id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project.project_id)}
                  onClick={() => onProjectClick(project)}
                  className={cn(
                    'bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 cursor-pointer',
                    'hover:border-[#ECE1CE]/50 transition-all',
                    draggedProject === project.project_id && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-[#ECE1CE]">
                      {project.project_code}
                    </span>
                    <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">
                    {project.project_name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getTimeSinceStateChange(project.state_changed_at)}</span>
                    {project.assigned_editor_id ? (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Editor #{project.assigned_editor_id}
                      </span>
                    ) : (
                      <span className="text-yellow-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Unassigned
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {columnProjects.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No projects
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface QCReviewPanelProps {
  project: Project;
  onClose: () => void;
  onApprove: (reason?: string) => void;
  onReject: (reason: string) => void;
}

function QCReviewPanel({ project, onClose, onApprove, onReject }: QCReviewPanelProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [checklist, setChecklist] = useState({
    resolution: false,
    codec: false,
    audio: false,
    exposure: false,
    focus: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(reason || undefined);
    } else if (action === 'reject' && reason.trim()) {
      onReject(reason);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">QC Review</h2>
              <p className="text-sm text-gray-400 mt-1">
                {project.project_code} - {project.project_name}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Preview Placeholder */}
          <div className="aspect-video bg-[#101010] rounded-lg flex items-center justify-center border border-gray-800">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Video Preview</p>
              <p className="text-gray-600 text-xs mt-1">RAW footage player would go here</p>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-white mb-3">Technical Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Resolution</p>
                <p className="text-white font-medium">3840 x 2160</p>
              </div>
              <div>
                <p className="text-gray-500">Codec</p>
                <p className="text-white font-medium">H.264</p>
              </div>
              <div>
                <p className="text-gray-500">Frame Rate</p>
                <p className="text-white font-medium">24 fps</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="text-white font-medium">45:23</p>
              </div>
            </div>
          </div>

          {/* QC Checklist */}
          <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-white mb-3">QC Checklist</h3>
            <div className="space-y-3">
              {Object.entries(checklist).map(([key, checked]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setChecklist((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-[#101010] text-[#ECE1CE] focus:ring-[#ECE1CE]"
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')} meets standards
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div className="flex gap-4">
            <button
              className={cn(
                'flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2',
                action === 'approve'
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-gray-700 text-gray-400 hover:border-green-500/50'
              )}
              onClick={() => setAction('approve')}
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve
            </button>
            <button
              className={cn(
                'flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2',
                action === 'reject'
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-gray-700 text-gray-400 hover:border-red-500/50'
              )}
              onClick={() => setAction('reject')}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>

          {/* Reason Input */}
          <AnimatePresence>
            {action && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm text-gray-400 mb-2">
                  {action === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? 'Please explain why this footage is being rejected...'
                      : 'Add any notes about this approval...'
                  }
                  className="w-full h-24 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
                  required={action === 'reject'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant="beige"
            onClick={handleSubmit}
            disabled={!action || (action === 'reject' && !reason.trim()) || (action === 'approve' && !allChecked)}
          >
            {action === 'approve' ? 'Approve QC' : action === 'reject' ? 'Reject QC' : 'Select Action'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface EditorAssignmentModalProps {
  project: Project;
  onClose: () => void;
  onAssign: (editorId: number, deadline?: string) => void;
}

function EditorAssignmentModal({ project, onClose, onAssign }: EditorAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEditor, setSelectedEditor] = useState<number | null>(null);
  const [deadline, setDeadline] = useState('');

  // Mock editors - would come from API
  const editors = [
    { id: 1, name: 'Sarah Johnson', workload: 3, maxWorkload: 5, skills: ['Color Grading', 'Motion Graphics'] },
    { id: 2, name: 'Mike Chen', workload: 4, maxWorkload: 5, skills: ['Wedding', 'Documentary'] },
    { id: 3, name: 'Emily Davis', workload: 2, maxWorkload: 5, skills: ['Commercial', 'Music Video'] },
    { id: 4, name: 'James Wilson', workload: 5, maxWorkload: 5, skills: ['Corporate', 'Podcast'] },
  ];

  const filteredEditors = editors.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Assign Editor</h2>
              <p className="text-sm text-gray-400 mt-1">{project.project_code}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search editors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#101010] border-gray-700"
            />
          </div>

          {/* Editor List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredEditors.map((editor) => {
              const isAvailable = editor.workload < editor.maxWorkload;
              const workloadPercent = (editor.workload / editor.maxWorkload) * 100;

              return (
                <button
                  key={editor.id}
                  onClick={() => setSelectedEditor(editor.id)}
                  disabled={!isAvailable}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedEditor === editor.id
                      ? 'border-[#ECE1CE] bg-[#ECE1CE]/10'
                      : 'border-gray-700 hover:border-gray-600',
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{editor.name}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {isAvailable ? 'Available' : 'At Capacity'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    {editor.skills.map((skill) => (
                      <span key={skill} className="bg-gray-800 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          workloadPercent >= 100
                            ? 'bg-red-500'
                            : workloadPercent >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        )}
                        style={{ width: `${workloadPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {editor.workload}/{editor.maxWorkload} projects
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Deadline (Optional)</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#101010] border-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant="beige"
            onClick={() => selectedEditor && onAssign(selectedEditor, deadline || undefined)}
            disabled={!selectedEditor}
          >
            Assign Editor
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FeedbackTranslationPanelProps {
  project: Project;
  onClose: () => void;
  onSave: (translation: string) => void;
}

function FeedbackTranslationPanel({ project, onClose, onSave }: FeedbackTranslationPanelProps) {
  const [translation, setTranslation] = useState('');

  // Mock client feedback - would come from API
  const clientFeedback = `I don't like the colors at all. It's too dark and the beginning part is way too slow.
Can you make it more exciting? Also, the music doesn't feel right. I want something more upbeat.
The end credits are wrong - my company name is spelled incorrectly.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Translate Feedback</h2>
              <p className="text-sm text-gray-400 mt-1">
                Convert client feedback to actionable creator instructions
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Feedback */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Original Client Feedback
            </label>
            <div className="bg-[#101010] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{clientFeedback}</p>
            </div>
          </div>

          {/* Translation */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Creator-Friendly Translation
            </label>
            <textarea
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder={`Example:
1. COLOR CORRECTION
   - Increase overall brightness by 15-20%
   - Lift shadows to reveal more detail

2. PACING (0:00 - 0:45)
   - Cut intro sequence by 15 seconds
   - Add dynamic cuts every 3-5 seconds

3. MUSIC
   - Replace current track with upbeat option
   - Target BPM: 120-140

4. TEXT CORRECTION
   - Fix company name spelling at 4:32`}
              className="w-full h-48 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button variant="beige" onClick={() => onSave(translation)} disabled={!translation.trim()}>
            Save Translation
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StateOverrideModalProps {
  project: Project;
  onClose: () => void;
  onOverride: (newState: ProjectState, reason: string) => void;
}

function StateOverrideModal({ project, onClose, onOverride }: StateOverrideModalProps) {
  const [selectedState, setSelectedState] = useState<ProjectState | ''>('');
  const [reason, setReason] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Override State
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Current: {STATE_CONFIG[project.current_state].label}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Warning: State overrides bypass normal workflow validation. Use only when necessary and always provide a reason.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">New State</label>
            <Select value={selectedState} onValueChange={(v) => setSelectedState(v as ProjectState)}>
              <SelectTrigger className="bg-[#101010] border-gray-700">
                <SelectValue placeholder="Select new state" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATES.filter((s) => s !== project.current_state).map((state) => (
                  <SelectItem key={state} value={state}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', STATE_CONFIG[state].color)} />
                      {STATE_CONFIG[state].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason (Required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this state override is necessary..."
              className="w-full h-24 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant="beige"
            onClick={() => selectedState && onOverride(selectedState, reason)}
            disabled={!selectedState || !reason.trim()}
          >
            Override State
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminProjectsPage() {
  // State
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    dateRange: 'all',
    search: '',
  });
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'desc' });

  // Modal states
  const [qcReviewProject, setQcReviewProject] = useState<Project | null>(null);
  const [assignEditorProject, setAssignEditorProject] = useState<Project | null>(null);
  const [feedbackProject, setFeedbackProject] = useState<Project | null>(null);
  const [overrideProject, setOverrideProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // API hooks
  const { data: projectsResponse, isLoading, refetch } = useGetProjectsByUserQuery({
    user_id: 0, // Admin sees all
    role: 'editor', // Using editor role to get all projects (would be 'admin' in production)
    status: filters.state || undefined,
    page: 1,
    limit: 100,
  });
  const [transitionState] = useTransitionStateMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [submitFeedback] = useSubmitFeedbackMutation();

  // Extract projects from paginated response
  const projects = projectsResponse?.data || [];

  // Calculate stats
  const stats = useMemo(() => {
    if (!projects.length) {
      return {
        active: 0,
        pendingQC: 0,
        avgTurnaround: '0d',
        rejectionRate: '0%',
      };
    }

    const activeProjects = projects.filter(
      (p) => !['DELIVERED', 'PROJECT_CLOSED'].includes(p.current_state)
    );
    const pendingQC = projects.filter((p) =>
      ['RAW_TECH_QC_PENDING', 'COVERAGE_REVIEW_PENDING', 'REVISION_QC_PENDING'].includes(
        p.current_state
      )
    );
    const rejected = projects.filter((p) =>
      ['RAW_TECH_QC_REJECTED', 'COVERAGE_REJECTED'].includes(p.current_state)
    );

    return {
      active: activeProjects.length,
      pendingQC: pendingQC.length,
      avgTurnaround: '3.2d', // Would be calculated from actual data
      rejectionRate: `${Math.round((rejected.length / Math.max(projects.length, 1)) * 100)}%`,
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply state filter
    if (filters.state) {
      result = result.filter((p) => p.current_state === filters.state);
    }

    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.project_name.toLowerCase().includes(search) ||
          p.project_code.toLowerCase().includes(search)
      );
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      result = result.filter((p) => new Date(p.created_at) >= cutoff);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Project];
        const bValue = b[sortConfig.key as keyof Project];
        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [projects, filters, sortConfig]);

  // Handlers
  const handleSort = useCallback((key: keyof Project) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleQuickAction = useCallback(
    (project: Project, action: 'approve' | 'reject' | 'assign') => {
      switch (action) {
        case 'approve':
        case 'reject':
          setQcReviewProject(project);
          break;
        case 'assign':
          setAssignEditorProject(project);
          break;
      }
    },
    []
  );

  const handleQCApprove = useCallback(
    async (reason?: string) => {
      if (!qcReviewProject) return;

      const nextStateMap: Partial<Record<ProjectState, ProjectState>> = {
        RAW_TECH_QC_PENDING: 'RAW_TECH_QC_APPROVED',
        COVERAGE_REVIEW_PENDING: 'EDIT_APPROVAL_PENDING',
        REVISION_QC_PENDING: 'FINAL_EXPORT_PENDING',
      };

      const nextState = nextStateMap[qcReviewProject.current_state];
      if (nextState) {
        await transitionState({
          projectId: qcReviewProject.project_id,
          data: {
            to_state: nextState,
            transition_reason: reason || 'QC approved by admin',
          },
        });
        refetch();
      }
      setQcReviewProject(null);
    },
    [qcReviewProject, transitionState, refetch]
  );

  const handleQCReject = useCallback(
    async (reason: string) => {
      if (!qcReviewProject) return;

      const rejectStateMap: Partial<Record<ProjectState, ProjectState>> = {
        RAW_TECH_QC_PENDING: 'RAW_TECH_QC_REJECTED',
        COVERAGE_REVIEW_PENDING: 'COVERAGE_REJECTED',
      };

      const rejectState = rejectStateMap[qcReviewProject.current_state];
      if (rejectState) {
        await transitionState({
          projectId: qcReviewProject.project_id,
          data: {
            to_state: rejectState,
            transition_reason: reason,
          },
        });
        refetch();
      }
      setQcReviewProject(null);
    },
    [qcReviewProject, transitionState, refetch]
  );

  const handleAssignEditor = useCallback(
    async (editorId: number, deadline?: string) => {
      if (!assignEditorProject) return;

      await updateProject({
        projectId: assignEditorProject.project_id,
        data: {
          assigned_editor_id: editorId,
        },
      });
      refetch();
      setAssignEditorProject(null);
    },
    [assignEditorProject, updateProject, refetch]
  );

  const handleSaveFeedbackTranslation = useCallback(
    async (translation: string) => {
      if (!feedbackProject) return;

      await submitFeedback({
        projectId: feedbackProject.project_id,
        data: {
          feedback_type: 'INTERNAL_QC',
          feedback_text: translation,
        },
      });
      refetch();
      setFeedbackProject(null);
    },
    [feedbackProject, submitFeedback, refetch]
  );

  const handleStateOverride = useCallback(
    async (newState: ProjectState, reason: string) => {
      if (!overrideProject) return;

      await transitionState({
        projectId: overrideProject.project_id,
        data: {
          to_state: newState,
          transition_reason: `[ADMIN OVERRIDE] ${reason}`,
        },
      });
      refetch();
      setOverrideProject(null);
    },
    [overrideProject, transitionState, refetch]
  );

  const handleKanbanDragEnd = useCallback(
    async (projectId: number, newState: ProjectState) => {
      await transitionState({
        projectId,
        data: {
          to_state: newState,
          transition_reason: 'Admin kanban drag override',
        },
      });
      refetch();
    },
    [transitionState, refetch]
  );

  const handleBulkApprove = useCallback(async () => {
    for (const projectId of selectedProjects) {
      const project = projects.find((p) => p.project_id === projectId);
      if (project && project.current_state.includes('QC_PENDING')) {
        const nextStateMap: Partial<Record<ProjectState, ProjectState>> = {
          RAW_TECH_QC_PENDING: 'RAW_TECH_QC_APPROVED',
          COVERAGE_REVIEW_PENDING: 'EDIT_APPROVAL_PENDING',
          REVISION_QC_PENDING: 'FINAL_EXPORT_PENDING',
        };
        const nextState = nextStateMap[project.current_state];
        if (nextState) {
          await transitionState({
            projectId,
            data: {
              to_state: nextState,
              transition_reason: 'Bulk approved by admin',
            },
          });
        }
      }
    }
    refetch();
    setSelectedProjects([]);
  }, [selectedProjects, projects, transitionState, refetch]);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Project Code', 'Name', 'State', 'Created', 'Editor'].join(','),
      ...filteredProjects.map((p) =>
        [
          p.project_code,
          `"${p.project_name}"`,
          p.current_state,
          p.created_at,
          p.assigned_editor_id || 'Unassigned',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredProjects]);

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Header */}
      <div className="bg-[#151515] border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Projects Dashboard</h1>
              <p className="text-gray-400 mt-1">Manage and monitor all projects</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-gray-700"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Active Projects"
            value={stats.active}
            change={12}
            icon={<FileVideo className="w-5 h-5" />}
            color="bg-[#ECE1CE]"
          />
          <StatCard
            title="Pending QC"
            value={stats.pendingQC}
            icon={<Clock className="w-5 h-5" />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Avg. Turnaround"
            value={stats.avgTurnaround}
            change={-8}
            icon={<BarChart3 className="w-5 h-5" />}
            color="bg-green-500"
          />
          <StatCard
            title="Rejection Rate"
            value={stats.rejectionRate}
            change={-15}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="bg-red-500"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <StateFilterDropdown
              value={filters.state}
              onChange={(state) => setFilters((prev) => ({ ...prev, state }))}
            />
            <DateRangeFilter
              value={filters.dateRange}
              onChange={(dateRange) => setFilters((prev) => ({ ...prev, dateRange }))}
            />
            <SearchInput
              value={filters.search}
              onChange={(search) => setFilters((prev) => ({ ...prev, search }))}
            />
          </div>
          <div className="flex items-center gap-3">
            {selectedProjects.length > 0 && (
              <BulkActionsMenu
                projectIds={selectedProjects}
                onClear={() => setSelectedProjects([])}
                onBulkApprove={handleBulkApprove}
                onExport={handleExport}
              />
            )}
            <div className="flex bg-[#1a1a1a] border border-gray-700 rounded-lg p-1">
              <button
                className={cn(
                  'px-3 py-1.5 rounded text-sm transition-colors',
                  viewMode === 'table'
                    ? 'bg-[#ECE1CE] text-[#101010]'
                    : 'text-gray-400 hover:text-white'
                )}
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded text-sm transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-[#ECE1CE] text-[#101010]'
                    : 'text-gray-400 hover:text-white'
                )}
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#ECE1CE] animate-spin" />
          </div>
        )}

        {/* Projects View */}
        {!isLoading && viewMode === 'table' && (
          <ProjectsTable
            projects={filteredProjects}
            selectedIds={selectedProjects}
            onSelectionChange={setSelectedProjects}
            sortConfig={sortConfig}
            onSort={handleSort}
            onProjectClick={setDetailProject}
            onQuickAction={handleQuickAction}
          />
        )}

        {!isLoading && viewMode === 'kanban' && (
          <ProjectsKanban
            projects={filteredProjects}
            onProjectClick={setDetailProject}
            onDragEnd={handleKanbanDragEnd}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {qcReviewProject && (
          <QCReviewPanel
            project={qcReviewProject}
            onClose={() => setQcReviewProject(null)}
            onApprove={handleQCApprove}
            onReject={handleQCReject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assignEditorProject && (
          <EditorAssignmentModal
            project={assignEditorProject}
            onClose={() => setAssignEditorProject(null)}
            onAssign={handleAssignEditor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedbackProject && (
          <FeedbackTranslationPanel
            project={feedbackProject}
            onClose={() => setFeedbackProject(null)}
            onSave={handleSaveFeedbackTranslation}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overrideProject && (
          <StateOverrideModal
            project={overrideProject}
            onClose={() => setOverrideProject(null)}
            onOverride={handleStateOverride}
          />
        )}
      </AnimatePresence>

      {/* Detail Slide-over */}
      <AnimatePresence>
        {detailProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDetailProject(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-[#1a1a1a] border-l border-gray-800 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Slide-over Header */}
              <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-[#ECE1CE]">
                      {detailProject.project_code}
                    </span>
                    <h2 className="text-xl font-semibold text-white mt-1">
                      {detailProject.project_name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setDetailProject(null)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Slide-over Content */}
              <div className="p-6 space-y-6">
                {/* State Progress */}
                <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Progress</h3>
                  <StateProgressBar
                    currentState={detailProject.current_state}
                    showMilestones={true}
                  />
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Client</p>
                    <p className="text-white">Client #{detailProject.client_user_id}</p>
                  </div>
                  <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Editor</p>
                    <p className="text-white">
                      {detailProject.assigned_editor_id
                        ? `Editor #${detailProject.assigned_editor_id}`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-white">{formatDateTime(detailProject.created_at)}</p>
                  </div>
                  <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">In Current State</p>
                    <p className="text-white">
                      {getTimeSinceStateChange(detailProject.state_changed_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400">Admin Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {detailProject.current_state.includes('QC_PENDING') && (
                      <Button
                        variant="outline"
                        className="border-gray-700 justify-start"
                        onClick={() => {
                          setDetailProject(null);
                          setQcReviewProject(detailProject);
                        }}
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        QC Review
                      </Button>
                    )}
                    {!detailProject.assigned_editor_id && (
                      <Button
                        variant="outline"
                        className="border-gray-700 justify-start"
                        onClick={() => {
                          setDetailProject(null);
                          setAssignEditorProject(detailProject);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Editor
                      </Button>
                    )}
                    {detailProject.current_state === 'CLIENT_FEEDBACK_RECEIVED' && (
                      <Button
                        variant="outline"
                        className="border-gray-700 justify-start"
                        onClick={() => {
                          setDetailProject(null);
                          setFeedbackProject(detailProject);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Translate Feedback
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-gray-700 justify-start"
                      onClick={() => {
                        setDetailProject(null);
                        setOverrideProject(detailProject);
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                      Override State
                    </Button>
                  </div>
                </div>

                {/* View Full Details Link */}
                <Link
                  href={`/admin/projects/${detailProject.project_id}`}
                  className="block w-full"
                >
                  <Button variant="beige" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
