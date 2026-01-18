'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useGetProjectQuery,
  useGetProjectFilesQuery,
  useGetProjectHistoryQuery,
  useGetProjectFeedbackQuery,
  useLazyGetDownloadUrlQuery,
} from '@/lib/redux/features/projects/projectsApi';
import { StateProgressBar, ChunkedFileUploader } from '@/components/projects';
import { Button } from '@/components/ui/button';
import type { Project, ProjectFile, FileCategory } from '@/lib/types';
import {
  X,
  Download,
  FileVideo,
  FileAudio,
  FileImage,
  File,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ProjectDetailDrawerProps {
  projectId: number;
  onClose: () => void;
}

type TabId = 'overview' | 'files' | 'history' | 'feedback';

// ============================================================================
// Utility Functions
// ============================================================================

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(fileName: string): React.ReactNode {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'];
  const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

  if (videoExtensions.includes(extension)) {
    return <FileVideo className="w-5 h-5" />;
  }
  if (audioExtensions.includes(extension)) {
    return <FileAudio className="w-5 h-5" />;
  }
  if (imageExtensions.includes(extension)) {
    return <FileImage className="w-5 h-5" />;
  }
  return <File className="w-5 h-5" />;
}

function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    RAW_FOOTAGE: 'RAW Footage',
    RAW_AUDIO: 'RAW Audio',
    EDIT_DRAFT: 'Edit Draft',
    EDIT_FINAL: 'Final Edit',
    CLIENT_DELIVERABLE: 'Client Deliverable',
  };
  return labels[category] || category;
}

// Check if project state allows upload
function canUploadFiles(state: Project['current_state']): boolean {
  return ['RAW_UPLOADED', 'RAW_TECH_QC_REJECTED', 'REVISION_IN_PROGRESS'].includes(state);
}

// Get upload category based on state
function getUploadCategory(state: Project['current_state']): FileCategory {
  if (state === 'REVISION_IN_PROGRESS') {
    return 'EDIT_DRAFT';
  }
  return 'RAW_FOOTAGE';
}

// ============================================================================
// Tab Components
// ============================================================================

interface TabButtonProps {
  id: TabId;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

function TabButton({ id, label, isActive, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50',
        isActive
          ? 'bg-[#ECE1CE]/10 text-[#ECE1CE]'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'ml-2 px-1.5 py-0.5 text-xs rounded-full',
            isActive ? 'bg-[#ECE1CE] text-black' : 'bg-gray-700 text-gray-300'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

interface OverviewTabProps {
  project: Project;
  showUploader: boolean;
  onUploadComplete: () => void;
}

function OverviewTab({ project, showUploader, onUploadComplete }: OverviewTabProps) {
  const [isUploaderExpanded, setIsUploaderExpanded] = useState(showUploader);

  return (
    <div className="space-y-6">
      {/* State Progress */}
      <div className="bg-[#0d0d0d] rounded-lg p-4 border border-gray-800">
        <h4 className="text-white font-medium mb-4">Project Progress</h4>
        <StateProgressBar
          currentState={project.current_state}
          showMilestones={true}
          className="mt-2"
        />
      </div>

      {/* Project Details */}
      <div className="bg-[#0d0d0d] rounded-lg p-4 border border-gray-800">
        <h4 className="text-white font-medium mb-4">Project Details</h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider">Project Code</dt>
            <dd className="text-white font-mono mt-1">{project.project_code}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider">Booking ID</dt>
            <dd className="text-white font-mono mt-1">#{project.booking_id}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider">Created</dt>
            <dd className="text-white mt-1">{formatDate(project.created_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider">Last Updated</dt>
            <dd className="text-white mt-1">{formatDate(project.state_changed_at)}</dd>
          </div>
        </dl>
      </div>

      {/* Upload Section */}
      {canUploadFiles(project.current_state) && (
        <div className="bg-[#0d0d0d] rounded-lg border border-gray-800 overflow-hidden">
          <button
            onClick={() => setIsUploaderExpanded(!isUploaderExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            aria-expanded={isUploaderExpanded}
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-[#ECE1CE]" />
              <div>
                <h4 className="text-white font-medium">Upload Files</h4>
                <p className="text-gray-500 text-sm">
                  {project.current_state === 'RAW_TECH_QC_REJECTED'
                    ? 'Re-upload corrected RAW files'
                    : project.current_state === 'REVISION_IN_PROGRESS'
                    ? 'Upload revised edit files'
                    : 'Upload your RAW footage'}
                </p>
              </div>
            </div>
            {isUploaderExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {isUploaderExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 border-t border-gray-800">
                  <ChunkedFileUploader
                    projectId={project.project_id}
                    fileCategory={getUploadCategory(project.current_state)}
                    onUploadComplete={onUploadComplete}
                    onUploadError={(error) => console.error('Upload error:', error)}
                    acceptedTypes={['video/*', 'audio/*', 'image/*']}
                    maxFileSize={10 * 1024 * 1024 * 1024}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Files Tab
// ============================================================================

interface FilesTabProps {
  projectId: number;
}

function FilesTab({ projectId }: FilesTabProps) {
  const { data: files, isLoading, error } = useGetProjectFilesQuery(projectId);
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = useCallback(async (file: ProjectFile) => {
    try {
      setDownloadingId(file.file_id);
      const result = await getDownloadUrl(file.file_id).unwrap();
      window.open(result.download_url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  }, [getDownloadUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load files</p>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No files uploaded yet</p>
      </div>
    );
  }

  // Group files by category
  const groupedFiles = files.reduce((acc, file) => {
    const category = file.file_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<FileCategory, ProjectFile[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
        <div key={category}>
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            {getCategoryLabel(category as FileCategory)}
            <span className="text-gray-500 text-sm">({categoryFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {categoryFiles.map((file) => (
              <div
                key={file.file_id}
                className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-gray-400 flex-shrink-0">
                    {getFileIcon(file.file_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatBytes(file.file_size_bytes)}</span>
                      {file.upload_status === 'COMPLETED' && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Uploaded
                        </span>
                      )}
                      {file.upload_status === 'IN_PROGRESS' && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {file.upload_progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={file.upload_status !== 'COMPLETED' || downloadingId === file.file_id}
                  className="text-gray-400 hover:text-[#ECE1CE]"
                  aria-label={`Download ${file.file_name}`}
                >
                  {downloadingId === file.file_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// History Tab
// ============================================================================

interface HistoryTabProps {
  projectId: number;
}

function HistoryTab({ projectId }: HistoryTabProps) {
  const { data: history, isLoading, error } = useGetProjectHistoryQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load history</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No history available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" aria-hidden="true" />

      <div className="space-y-4">
        {history.map((entry, index) => (
          <motion.div
            key={entry.history_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-10"
          >
            {/* Timeline dot */}
            <div
              className={cn(
                'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center',
                index === 0 ? 'bg-[#ECE1CE]' : 'bg-gray-700'
              )}
              aria-hidden="true"
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  index === 0 ? 'bg-[#101010]' : 'bg-gray-500'
                )}
              />
            </div>

            <div className="bg-[#0d0d0d] rounded-lg p-4 border border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium">
                    {entry.from_state ? (
                      <>
                        <span className="text-gray-500">{entry.from_state.replace(/_/g, ' ')}</span>
                        <span className="text-gray-600 mx-2">-&gt;</span>
                        <span className="text-[#ECE1CE]">{entry.to_state.replace(/_/g, ' ')}</span>
                      </>
                    ) : (
                      <span className="text-[#ECE1CE]">{entry.to_state.replace(/_/g, ' ')}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatDate(entry.created_at)}
                </span>
              </div>
              {entry.transition_reason && (
                <p className="text-gray-400 text-sm mt-2 bg-gray-800/50 rounded p-2">
                  {entry.transition_reason}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Feedback Tab
// ============================================================================

interface FeedbackTabProps {
  projectId: number;
}

function FeedbackTab({ projectId }: FeedbackTabProps) {
  const { data: feedback, isLoading, error } = useGetProjectFeedbackQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">Failed to load feedback</p>
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No feedback yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item, index) => (
        <motion.div
          key={item.feedback_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'rounded-lg p-4 border',
            item.feedback_type === 'CLIENT'
              ? 'bg-blue-500/5 border-blue-500/20'
              : 'bg-purple-500/5 border-purple-500/20'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  item.feedback_type === 'CLIENT'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                )}
              >
                {item.feedback_type === 'CLIENT' ? 'Client' : 'Internal QC'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
          </div>

          <p className="text-white text-sm whitespace-pre-wrap">{item.feedback_text}</p>

          {item.video_timestamps && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Timestamps:</p>
              <p className="text-sm text-[#ECE1CE] font-mono">{item.video_timestamps}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Drawer Component
// ============================================================================

export function ProjectDetailDrawer({ projectId, onClose }: ProjectDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const drawerRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading: isProjectLoading, error: projectError, refetch } = useGetProjectQuery(projectId);
  const { data: files } = useGetProjectFilesQuery(projectId);
  const { data: history } = useGetProjectHistoryQuery(projectId);
  const { data: feedback } = useGetProjectFeedbackQuery(projectId);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    drawer.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => drawer.removeEventListener('keydown', handleTab);
  }, [project]);

  const handleUploadComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        aria-hidden="true"
      />

      {/* Drawer */}
      <motion.div
        ref={drawerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-2xl',
          'bg-[#1a1a1a] border-l border-gray-800 shadow-2xl',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0d0d0d]">
          <div className="flex-1 min-w-0">
            {isProjectLoading ? (
              <div className="h-6 w-48 bg-gray-800 animate-pulse rounded" />
            ) : project ? (
              <>
                <h2 id="drawer-title" className="text-white font-semibold text-lg truncate">
                  {project.project_name}
                </h2>
                <p className="text-gray-500 text-sm font-mono">{project.project_code}</p>
              </>
            ) : (
              <p className="text-gray-400">Project not found</p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]'
            )}
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isProjectLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#ECE1CE] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {projectError && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-400 text-center">Failed to load project details</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        {project && !isProjectLoading && !projectError && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-800 overflow-x-auto" role="tablist">
              <TabButton
                id="overview"
                label="Overview"
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              />
              <TabButton
                id="files"
                label="Files"
                isActive={activeTab === 'files'}
                onClick={() => setActiveTab('files')}
                badge={files?.length}
              />
              <TabButton
                id="history"
                label="History"
                isActive={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                badge={history?.length}
              />
              <TabButton
                id="feedback"
                label="Feedback"
                isActive={activeTab === 'feedback'}
                onClick={() => setActiveTab('feedback')}
                badge={feedback?.length}
              />
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-4">
              <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
              >
                {activeTab === 'overview' && (
                  <OverviewTab
                    project={project}
                    showUploader={canUploadFiles(project.current_state)}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
                {activeTab === 'files' && <FilesTab projectId={projectId} />}
                {activeTab === 'history' && <HistoryTab projectId={projectId} />}
                {activeTab === 'feedback' && <FeedbackTab projectId={projectId} />}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default ProjectDetailDrawer;
