'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetProjectQuery,
  useGetProjectFilesQuery,
  useGetProjectHistoryQuery,
  useGetProjectFeedbackQuery,
  useTransitionStateMutation,
  useUpdateProjectMutation,
  useSubmitFeedbackMutation,
  useDeleteProjectFileMutation,
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
import type { Project, ProjectState, ProjectFile, ProjectStateHistory, ProjectFeedback } from '@/lib/types';
import {
  ArrowLeft,
  RefreshCw,
  FileVideo,
  FileAudio,
  FileCheck,
  Clock,
  AlertTriangle,
  Check,
  X,
  Play,
  Download,
  Trash2,
  Eye,
  Edit3,
  MessageSquare,
  UserPlus,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  History,
  FileText,
  Shield,
  Settings,
  ExternalLink,
  Copy,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types & Constants
// ============================================================================

// All project states for override
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
const STATE_CONFIG: Record<ProjectState, { label: string; color: string; bgColor: string }> = {
  RAW_UPLOADED: { label: 'Raw Uploaded', color: 'text-blue-400', bgColor: 'bg-blue-500' },
  RAW_TECH_QC_PENDING: { label: 'Tech QC Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
  RAW_TECH_QC_REJECTED: { label: 'Tech QC Rejected', color: 'text-red-400', bgColor: 'bg-red-500' },
  RAW_TECH_QC_APPROVED: { label: 'Tech QC Approved', color: 'text-green-400', bgColor: 'bg-green-500' },
  COVERAGE_REVIEW_PENDING: { label: 'Coverage Review', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
  COVERAGE_REJECTED: { label: 'Coverage Rejected', color: 'text-red-400', bgColor: 'bg-red-500' },
  EDIT_APPROVAL_PENDING: { label: 'Edit Approval', color: 'text-purple-400', bgColor: 'bg-purple-500' },
  EDIT_IN_PROGRESS: { label: 'Editing', color: 'text-orange-400', bgColor: 'bg-orange-500' },
  INTERNAL_EDIT_REVIEW_PENDING: { label: 'Internal Review', color: 'text-cyan-400', bgColor: 'bg-cyan-500' },
  CLIENT_PREVIEW_READY: { label: 'Preview Ready', color: 'text-teal-400', bgColor: 'bg-teal-500' },
  CLIENT_FEEDBACK_RECEIVED: { label: 'Feedback Received', color: 'text-indigo-400', bgColor: 'bg-indigo-500' },
  FEEDBACK_INTERNAL_REVIEW: { label: 'Reviewing Feedback', color: 'text-violet-400', bgColor: 'bg-violet-500' },
  REVISION_IN_PROGRESS: { label: 'Revising', color: 'text-orange-400', bgColor: 'bg-orange-500' },
  REVISION_QC_PENDING: { label: 'Revision QC', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
  FINAL_EXPORT_PENDING: { label: 'Exporting', color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  READY_FOR_DELIVERY: { label: 'Ready', color: 'text-green-400', bgColor: 'bg-green-500' },
  DELIVERED: { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-600' },
  PROJECT_CLOSED: { label: 'Closed', color: 'text-gray-400', bgColor: 'bg-gray-500' },
};

// File category icons
const FILE_CATEGORY_CONFIG = {
  RAW_FOOTAGE: { icon: FileVideo, label: 'Raw Footage', color: 'text-blue-400' },
  RAW_AUDIO: { icon: FileAudio, label: 'Raw Audio', color: 'text-purple-400' },
  EDIT_DRAFT: { icon: FileText, label: 'Edit Draft', color: 'text-orange-400' },
  EDIT_FINAL: { icon: FileCheck, label: 'Final Edit', color: 'text-green-400' },
  CLIENT_DELIVERABLE: { icon: Download, label: 'Deliverable', color: 'text-[#ECE1CE]' },
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getTimeSinceDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultExpanded?: boolean;
}

function SectionCard({ title, icon, children, action, defaultExpanded = true }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      <button
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#202020] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-[#ECE1CE]">{icon}</span>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 border-t border-gray-800 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FileListProps {
  files: ProjectFile[];
  onDownload: (fileId: number) => void;
  onDelete: (fileId: number) => void;
}

function FileList({ files, onDownload, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No files uploaded yet</p>
      </div>
    );
  }

  // Group files by category
  const groupedFiles = files.reduce((acc, file) => {
    const category = file.file_category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, ProjectFile[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFiles).map(([category, categoryFiles]) => {
        const config = FILE_CATEGORY_CONFIG[category as keyof typeof FILE_CATEGORY_CONFIG];
        const IconComponent = config?.icon || FileText;

        return (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <IconComponent className={cn('w-4 h-4', config?.color || 'text-gray-400')} />
              {config?.label || category}
            </h4>
            <div className="space-y-2">
              {categoryFiles.map((file) => (
                <div
                  key={file.file_id}
                  className="flex items-center justify-between p-4 bg-[#151515] rounded-lg border border-gray-800"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <IconComponent className={cn('w-8 h-8', config?.color || 'text-gray-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{file.file_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(file.file_size_bytes)}</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-3 mx-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        file.upload_status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400'
                          : file.upload_status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      )}
                    >
                      {file.upload_status}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        file.validation_status === 'PASSED'
                          ? 'bg-green-500/20 text-green-400'
                          : file.validation_status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      )}
                    >
                      {file.validation_status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                      onClick={() => onDownload(file.file_id)}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                      onClick={() => onDelete(file.file_id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StateHistoryListProps {
  history: ProjectStateHistory[];
}

function StateHistoryList({ history }: StateHistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No state history yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-800" />

      <div className="space-y-4">
        {history.map((entry, index) => {
          const isRejection = entry.to_state.includes('REJECTED');
          const toConfig = STATE_CONFIG[entry.to_state];

          return (
            <motion.div
              key={entry.history_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-2 top-2 w-5 h-5 rounded-full border-2 bg-[#1a1a1a]',
                  isRejection ? 'border-red-500' : 'border-[#ECE1CE]'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-1 rounded-full',
                    isRejection ? 'bg-red-500' : 'bg-[#ECE1CE]'
                  )}
                />
              </div>

              <div className="bg-[#151515] border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {entry.from_state && (
                        <>
                          <span className="text-sm text-gray-400">
                            {STATE_CONFIG[entry.from_state]?.label || entry.from_state}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </>
                      )}
                      <span className={cn('text-sm font-medium', toConfig?.color || 'text-white')}>
                        {toConfig?.label || entry.to_state}
                      </span>
                    </div>
                    {entry.transition_reason && (
                      <p className="text-sm text-gray-400 mt-2">{entry.transition_reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</p>
                    <p className="text-xs text-gray-600 mt-1">User #{entry.transitioned_by}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface FeedbackListProps {
  feedback: ProjectFeedback[];
  onTranslate: (feedback: ProjectFeedback) => void;
}

function FeedbackList({ feedback, onTranslate }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No feedback yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((entry) => {
        const isClientFeedback = entry.feedback_type === 'CLIENT';

        return (
          <div
            key={entry.feedback_id}
            className={cn(
              'p-4 rounded-lg border',
              isClientFeedback
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-[#151515] border-gray-800'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    isClientFeedback
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  )}
                >
                  {isClientFeedback ? 'Client Feedback' : 'Internal QC'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isClientFeedback && (
                  <button
                    className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                    onClick={() => onTranslate(entry)}
                    title="Translate for Creator"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.feedback_text}</p>
            {entry.video_timestamps && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Timestamps:</p>
                <p className="text-sm text-[#ECE1CE]">{entry.video_timestamps}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface QuickActionsProps {
  project: Project;
  onQCApprove: () => void;
  onQCReject: () => void;
  onAssignEditor: () => void;
  onOverrideState: () => void;
}

function QuickActions({
  project,
  onQCApprove,
  onQCReject,
  onAssignEditor,
  onOverrideState,
}: QuickActionsProps) {
  const isQCPending = project.current_state.includes('QC_PENDING');
  const isRejected = project.current_state.includes('REJECTED');
  const needsEditor = !project.assigned_editor_id;

  return (
    <div className="space-y-3">
      {isQCPending && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/20"
            onClick={onQCApprove}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve QC
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
            onClick={onQCReject}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject QC
          </Button>
        </div>
      )}

      {needsEditor && (
        <Button variant="outline" className="w-full border-gray-700" onClick={onAssignEditor}>
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Editor
        </Button>
      )}

      <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20" onClick={onOverrideState}>
        <AlertTriangle className="w-4 h-4 mr-2" />
        Override State
      </Button>
    </div>
  );
}

// ============================================================================
// Modal Components
// ============================================================================

interface QCModalProps {
  project: Project;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

function QCModal({ project, action, onClose, onSubmit }: QCModalProps) {
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
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {action === 'approve' ? 'Approve QC' : 'Reject QC'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{project.project_code}</p>
        </div>

        <div className="p-6">
          <label className="block text-sm text-gray-400 mb-2">
            {action === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              action === 'reject'
                ? 'Please explain why this is being rejected...'
                : 'Add any notes about this approval...'
            }
            className="w-full h-32 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
          />
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant={action === 'approve' ? 'beige' : 'destructive'}
            onClick={() => onSubmit(reason)}
            disabled={action === 'reject' && !reason.trim()}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface EditorModalProps {
  project: Project;
  onClose: () => void;
  onAssign: (editorId: number) => void;
}

function EditorModal({ project, onClose, onAssign }: EditorModalProps) {
  const [selectedEditor, setSelectedEditor] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock editors
  const editors = [
    { id: 1, name: 'Sarah Johnson', workload: 3, maxWorkload: 5 },
    { id: 2, name: 'Mike Chen', workload: 4, maxWorkload: 5 },
    { id: 3, name: 'Emily Davis', workload: 2, maxWorkload: 5 },
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
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Assign Editor</h2>
        </div>

        <div className="p-6 space-y-4">
          <Input
            type="text"
            placeholder="Search editors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#101010] border-gray-700"
          />

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredEditors.map((editor) => (
              <button
                key={editor.id}
                onClick={() => setSelectedEditor(editor.id)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  selectedEditor === editor.id
                    ? 'border-[#ECE1CE] bg-[#ECE1CE]/10'
                    : 'border-gray-700 hover:border-gray-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{editor.name}</span>
                  <span className="text-xs text-gray-400">
                    {editor.workload}/{editor.maxWorkload} projects
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant="beige"
            onClick={() => selectedEditor && onAssign(selectedEditor)}
            disabled={!selectedEditor}
          >
            Assign
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface OverrideModalProps {
  project: Project;
  onClose: () => void;
  onOverride: (state: ProjectState, reason: string) => void;
}

function OverrideModal({ project, onClose, onOverride }: OverrideModalProps) {
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
        className="bg-[#1a1a1a] border border-gray-700 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Override State
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Warning: State overrides bypass normal workflow. Always provide a reason.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Current State</label>
            <p className={cn('font-medium', STATE_CONFIG[project.current_state].color)}>
              {STATE_CONFIG[project.current_state].label}
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
                    {STATE_CONFIG[state].label}
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
              placeholder="Explain why this override is necessary..."
              className="w-full h-24 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700">
            Cancel
          </Button>
          <Button
            variant="beige"
            onClick={() => selectedState && onOverride(selectedState, reason)}
            disabled={!selectedState || !reason.trim()}
          >
            Override
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface TranslateModalProps {
  feedback: ProjectFeedback;
  onClose: () => void;
  onSave: (translation: string) => void;
}

function TranslateModal({ feedback, onClose, onSave }: TranslateModalProps) {
  const [translation, setTranslation] = useState('');

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
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Translate Feedback</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Original Client Feedback</label>
            <div className="bg-[#101010] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{feedback.feedback_text}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Creator-Friendly Translation</label>
            <textarea
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Write clear, actionable instructions for the creator..."
              className="w-full h-48 px-4 py-3 bg-[#101010] border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#ECE1CE]"
            />
          </div>
        </div>

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

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.projectId);

  // Modal states
  const [qcModal, setQcModal] = useState<'approve' | 'reject' | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [translateFeedback, setTranslateFeedback] = useState<ProjectFeedback | null>(null);

  // API queries
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useGetProjectQuery(projectId);
  const { data: files = [], refetch: refetchFiles } = useGetProjectFilesQuery(projectId);
  const { data: history = [], refetch: refetchHistory } = useGetProjectHistoryQuery(projectId);
  const { data: feedback = [], refetch: refetchFeedback } = useGetProjectFeedbackQuery(projectId);

  // API mutations
  const [transitionState] = useTransitionStateMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [submitFeedback] = useSubmitFeedbackMutation();
  const [deleteFile] = useDeleteProjectFileMutation();

  // Handlers
  const handleQCSubmit = async (reason: string) => {
    if (!project || !qcModal) return;

    const stateMap: Partial<Record<ProjectState, { approve: ProjectState; reject: ProjectState }>> = {
      RAW_TECH_QC_PENDING: {
        approve: 'RAW_TECH_QC_APPROVED',
        reject: 'RAW_TECH_QC_REJECTED',
      },
      COVERAGE_REVIEW_PENDING: {
        approve: 'EDIT_APPROVAL_PENDING',
        reject: 'COVERAGE_REJECTED',
      },
      REVISION_QC_PENDING: {
        approve: 'FINAL_EXPORT_PENDING',
        reject: 'REVISION_IN_PROGRESS',
      },
    };

    const nextState = stateMap[project.current_state]?.[qcModal];
    if (nextState) {
      await transitionState({
        projectId,
        data: {
          to_state: nextState,
          transition_reason: reason || `QC ${qcModal}d by admin`,
        },
      });
      refetchProject();
      refetchHistory();
    }
    setQcModal(null);
  };

  const handleAssignEditor = async (editorId: number) => {
    await updateProject({
      projectId,
      data: { assigned_editor_id: editorId },
    });
    refetchProject();
    setShowEditorModal(false);
  };

  const handleOverride = async (state: ProjectState, reason: string) => {
    await transitionState({
      projectId,
      data: {
        to_state: state,
        transition_reason: `[ADMIN OVERRIDE] ${reason}`,
      },
    });
    refetchProject();
    refetchHistory();
    setShowOverrideModal(false);
  };

  const handleTranslateSave = async (translation: string) => {
    if (!translateFeedback) return;

    await submitFeedback({
      projectId,
      data: {
        feedback_type: 'INTERNAL_QC',
        feedback_text: `[TRANSLATED FROM CLIENT FEEDBACK #${translateFeedback.feedback_id}]\n\n${translation}`,
      },
    });
    refetchFeedback();
    setTranslateFeedback(null);
  };

  const handleDownloadFile = async (fileId: number) => {
    // Would use useLazyGetDownloadUrlQuery in production
    console.log('Downloading file:', fileId);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId);
      refetchFiles();
    }
  };

  const handleCopyProjectCode = () => {
    if (project) {
      navigator.clipboard.writeText(project.project_code);
    }
  };

  // Loading state
  if (projectLoading || !project) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  const stateConfig = STATE_CONFIG[project.current_state];

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Header */}
      <div className="bg-[#151515] border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/projects')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white">{project.project_name}</h1>
                  <button
                    onClick={handleCopyProjectCode}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded text-xs font-mono text-[#ECE1CE] hover:bg-gray-700 transition-colors"
                    title="Copy project code"
                  >
                    {project.project_code}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      stateConfig.bgColor,
                      'text-white'
                    )}
                  >
                    {stateConfig.label}
                  </span>
                  <span className="text-sm text-gray-400">
                    Created {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-gray-700"
                onClick={() => {
                  refetchProject();
                  refetchFiles();
                  refetchHistory();
                  refetchFeedback();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Project Progress</h3>
              <StateProgressBar
                currentState={project.current_state}
                stateHistory={history}
                showMilestones={true}
              />
            </div>

            {/* Files Section */}
            <SectionCard
              title="Files"
              icon={<FileVideo className="w-5 h-5" />}
              action={
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {files.length} files
                </span>
              }
            >
              <FileList
                files={files}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
              />
            </SectionCard>

            {/* State History */}
            <SectionCard
              title="State History"
              icon={<History className="w-5 h-5" />}
              action={
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {history.length} transitions
                </span>
              }
            >
              <StateHistoryList history={history} />
            </SectionCard>

            {/* Feedback */}
            <SectionCard
              title="Feedback"
              icon={<MessageSquare className="w-5 h-5" />}
              action={
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {feedback.length} entries
                </span>
              }
            >
              <FeedbackList
                feedback={feedback}
                onTranslate={setTranslateFeedback}
              />
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Admin Actions</h3>
              <QuickActions
                project={project}
                onQCApprove={() => setQcModal('approve')}
                onQCReject={() => setQcModal('reject')}
                onAssignEditor={() => setShowEditorModal(true)}
                onOverrideState={() => setShowOverrideModal(true)}
              />
            </div>

            {/* Project Details */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-gray-500">Project ID</dt>
                  <dd className="text-sm text-white font-mono">{project.project_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Booking ID</dt>
                  <dd className="text-sm text-white font-mono">{project.booking_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Client</dt>
                  <dd className="text-sm text-white">User #{project.client_user_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Creator</dt>
                  <dd className="text-sm text-white">
                    {project.assigned_creator_id
                      ? `Creator #${project.assigned_creator_id}`
                      : 'Not assigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Editor</dt>
                  <dd className="text-sm text-white">
                    {project.assigned_editor_id
                      ? `Editor #${project.assigned_editor_id}`
                      : 'Not assigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="text-sm text-white">{formatDateTime(project.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-white">{formatDateTime(project.updated_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">State Changed</dt>
                  <dd className="text-sm text-white">{formatDateTime(project.state_changed_at)}</dd>
                </div>
              </dl>
            </div>

            {/* Audit Summary */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Audit Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">State Transitions</span>
                  <span className="text-white font-medium">{history.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rejections</span>
                  <span className="text-red-400 font-medium">
                    {history.filter((h) => h.to_state.includes('REJECTED')).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Admin Overrides</span>
                  <span className="text-yellow-400 font-medium">
                    {history.filter((h) => h.transition_reason?.includes('[ADMIN OVERRIDE]')).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Files Uploaded</span>
                  <span className="text-white font-medium">{files.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Feedback Entries</span>
                  <span className="text-white font-medium">{feedback.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {qcModal && (
          <QCModal
            project={project}
            action={qcModal}
            onClose={() => setQcModal(null)}
            onSubmit={handleQCSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditorModal && (
          <EditorModal
            project={project}
            onClose={() => setShowEditorModal(false)}
            onAssign={handleAssignEditor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOverrideModal && (
          <OverrideModal
            project={project}
            onClose={() => setShowOverrideModal(false)}
            onOverride={handleOverride}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {translateFeedback && (
          <TranslateModal
            feedback={translateFeedback}
            onClose={() => setTranslateFeedback(null)}
            onSave={handleTranslateSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
