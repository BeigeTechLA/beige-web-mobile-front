'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  useGetProjectsByUserQuery,
  useGetProjectQuery,
  useGetProjectFilesQuery,
  useGetProjectHistoryQuery,
  useSubmitFeedbackMutation,
  useLazyGetDownloadUrlQuery,
} from '@/lib/redux/features/projects/projectsApi';
import { StateProgressBar } from '@/components/projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Project, ProjectFile, ProjectState, ProjectStateHistory } from '@/lib/types';
import {
  Play,
  Pause,
  Download,
  MessageSquare,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileVideo,
  FileAudio,
  Film,
  Package,
  Loader2,
  Send,
  X,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
} from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const STATE_LABELS: Record<ProjectState, string> = {
  RAW_UPLOADED: 'Raw Uploaded',
  RAW_TECH_QC_PENDING: 'Technical QC Pending',
  RAW_TECH_QC_REJECTED: 'Technical QC Rejected',
  RAW_TECH_QC_APPROVED: 'Technical QC Approved',
  COVERAGE_REVIEW_PENDING: 'Coverage Review Pending',
  COVERAGE_REJECTED: 'Coverage Rejected',
  EDIT_APPROVAL_PENDING: 'Edit Approval Pending',
  EDIT_IN_PROGRESS: 'Edit In Progress',
  INTERNAL_EDIT_REVIEW_PENDING: 'Internal Edit Review',
  CLIENT_PREVIEW_READY: 'Ready for Your Review',
  CLIENT_FEEDBACK_RECEIVED: 'Feedback Received',
  FEEDBACK_INTERNAL_REVIEW: 'Feedback Under Review',
  REVISION_IN_PROGRESS: 'Revision In Progress',
  REVISION_QC_PENDING: 'Revision QC Pending',
  FINAL_EXPORT_PENDING: 'Final Export Pending',
  READY_FOR_DELIVERY: 'Ready for Download',
  DELIVERED: 'Delivered',
  PROJECT_CLOSED: 'Project Closed',
};

const CLIENT_ACTION_STATES: ProjectState[] = ['CLIENT_PREVIEW_READY'];
const DOWNLOAD_STATES: ProjectState[] = ['READY_FOR_DELIVERY', 'DELIVERED'];

// ============================================================================
// Helper Functions
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(category: string) {
  switch (category) {
    case 'RAW_FOOTAGE':
    case 'EDIT_DRAFT':
    case 'EDIT_FINAL':
      return <FileVideo className="w-5 h-5" />;
    case 'RAW_AUDIO':
      return <FileAudio className="w-5 h-5" />;
    case 'CLIENT_DELIVERABLE':
      return <Film className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
}

function getProgressPercentage(state: ProjectState): number {
  const stateOrder: ProjectState[] = [
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
  const index = stateOrder.indexOf(state);
  if (index === -1) return 0;
  return Math.round(((index + 1) / stateOrder.length) * 100);
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ClientProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ClientProjectCard({ project, onClick }: ClientProjectCardProps) {
  const needsReview = CLIENT_ACTION_STATES.includes(project.current_state);
  const canDownload = DOWNLOAD_STATES.includes(project.current_state);
  const progress = getProgressPercentage(project.current_state);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left p-6 rounded-xl border transition-all',
        'bg-[#1a1a1a] border-gray-800 hover:border-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50 focus:ring-offset-2 focus:ring-offset-[#101010]'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Project Name & Code */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {project.project_name}
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              {project.project_code}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                'text-sm',
                needsReview ? 'text-amber-400' : canDownload ? 'text-green-400' : 'text-gray-400'
              )}
            >
              {STATE_LABELS[project.current_state]}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                canDownload ? 'bg-green-500' : 'bg-[#ECE1CE]'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{progress}% complete</p>
        </div>

        {/* Action Badges */}
        <div className="flex flex-col gap-2 items-end">
          {needsReview && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
              <Eye className="w-3.5 h-3.5" />
              Review Required
            </span>
          )}
          {canDownload && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <Download className="w-3.5 h-3.5" />
              Ready to Download
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-gray-500 mt-2" />
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Preview Section Component
// ============================================================================

interface PreviewSectionProps {
  projectId: number;
  onTimestampAdd?: (timestamp: number) => void;
}

function PreviewSection({ projectId, onTimestampAdd }: PreviewSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { data: files } = useGetProjectFilesQuery(projectId);

  // Find preview file (EDIT_DRAFT or EDIT_FINAL)
  const previewFile = files?.find(
    (f) =>
      (f.file_category === 'EDIT_DRAFT' || f.file_category === 'EDIT_FINAL') &&
      f.upload_status === 'COMPLETED'
  );

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipTime = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
  }, [duration]);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  }, []);

  const handleAddTimestamp = useCallback(() => {
    if (onTimestampAdd && videoRef.current) {
      onTimestampAdd(videoRef.current.currentTime);
    }
  }, [onTimestampAdd]);

  if (!previewFile) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Preview video not yet available</p>
        <p className="text-sm text-gray-500 mt-1">
          The video will appear here once the edit is ready for review.
        </p>
      </div>
    );
  }

  // For now, use a placeholder URL - in production this would be a presigned URL
  const videoUrl = previewFile.file_path;

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-8 h-8 text-[#ECE1CE] animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onLoadedData={() => setIsLoading(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
      </div>

      {/* Video Controls */}
      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-12 text-right">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#ECE1CE]
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-gray-400 w-12">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="p-3 bg-[#ECE1CE] text-[#101010] rounded-full hover:bg-[#ECE1CE]/90 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => skipTime(10)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors ml-2"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddTimestamp}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              aria-label="Add timestamp to feedback"
            >
              <Clock className="w-4 h-4" />
              Add Timestamp
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Feedback Form Component
// ============================================================================

interface FeedbackFormProps {
  projectId: number;
  onSuccess: () => void;
}

interface TimestampMarker {
  time: number;
  label: string;
}

function FeedbackForm({ projectId, onSuccess }: FeedbackFormProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [timestamps, setTimestamps] = useState<TimestampMarker[]>([]);
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

  const MAX_CHARS = 2000;
  const charCount = feedbackText.length;

  const addTimestamp = useCallback((time: number) => {
    const label = formatDuration(time);
    setTimestamps((prev) => [...prev, { time, label }]);
    setFeedbackText((prev) =>
      prev + (prev ? '\n' : '') + `[${label}] `
    );
  }, []);

  const removeTimestamp = useCallback((index: number) => {
    setTimestamps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      await submitFeedback({
        projectId,
        data: {
          feedback_type: 'CLIENT',
          feedback_text: feedbackText.trim(),
          video_timestamps: timestamps.length > 0
            ? JSON.stringify(timestamps.map((t) => t.time))
            : undefined,
        },
      }).unwrap();

      setFeedbackText('');
      setTimestamps([]);
      onSuccess();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Timestamp Markers */}
      {timestamps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {timestamps.map((ts, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#ECE1CE]/20 text-[#ECE1CE] rounded text-sm"
            >
              <Clock className="w-3 h-3" />
              {ts.label}
              <button
                type="button"
                onClick={() => removeTimestamp(index)}
                className="ml-1 hover:text-red-400"
                aria-label={`Remove timestamp ${ts.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Feedback Textarea */}
      <div>
        <label htmlFor="feedback" className="sr-only">
          Your feedback
        </label>
        <textarea
          id="feedback"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Share your feedback about the video edit. Use the 'Add Timestamp' button while watching to reference specific moments..."
          className={cn(
            'w-full h-40 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg',
            'text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50 focus:border-transparent',
            'resize-none'
          )}
          maxLength={MAX_CHARS}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Click "Add Timestamp" while watching to reference specific moments
          </p>
          <span
            className={cn(
              'text-xs',
              charCount > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-gray-500'
            )}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!feedbackText.trim() || isLoading}
        className={cn(
          'w-full py-3 px-6 rounded-lg font-medium transition-all',
          'inline-flex items-center justify-center gap-2',
          'bg-[#ECE1CE] text-[#101010] hover:bg-[#ECE1CE]/90',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}

// ============================================================================
// Download Section Component
// ============================================================================

interface DownloadSectionProps {
  projectId: number;
}

function DownloadSection({ projectId }: DownloadSectionProps) {
  const { data: files, isLoading } = useGetProjectFilesQuery(projectId);
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  // Filter to deliverable files only
  const deliverableFiles = files?.filter(
    (f) =>
      (f.file_category === 'EDIT_FINAL' || f.file_category === 'CLIENT_DELIVERABLE') &&
      f.upload_status === 'COMPLETED'
  );

  const handleDownload = async (file: ProjectFile) => {
    setDownloadingFileId(file.file_id);
    try {
      const result = await getDownloadUrl(file.file_id).unwrap();
      // Open the presigned URL in a new tab or trigger download
      window.open(result.download_url, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  if (!deliverableFiles || deliverableFiles.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No deliverable files available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        Your Files ({deliverableFiles.length})
      </h4>
      <div className="space-y-2">
        {deliverableFiles.map((file) => (
          <div
            key={file.file_id}
            className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg text-[#ECE1CE]">
                {getFileIcon(file.file_category)}
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-[200px] sm:max-w-[300px]">
                  {file.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file_size_bytes)} - {file.file_category.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(file)}
              disabled={downloadingFileId === file.file_id}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                'bg-green-600 text-white hover:bg-green-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {downloadingFileId === file.file_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Project Timeline Component
// ============================================================================

interface ProjectTimelineProps {
  projectId: number;
}

function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { data: history, isLoading } = useGetProjectHistoryQuery(projectId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return null;
  }

  const displayHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Project Timeline
        </h4>
        {history.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-[#ECE1CE] hover:underline"
          >
            {isExpanded ? 'Show less' : `Show all (${history.length})`}
          </button>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800" />

        <div className="space-y-4">
          {displayHistory.map((entry, index) => (
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
                  'absolute left-2.5 w-3 h-3 rounded-full border-2',
                  index === 0
                    ? 'bg-[#ECE1CE] border-[#ECE1CE]'
                    : 'bg-gray-900 border-gray-600'
                )}
              />

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">
                      {STATE_LABELS[entry.to_state] || entry.to_state}
                    </p>
                    {entry.transition_reason && (
                      <p className="text-sm text-gray-400 mt-1">
                        {entry.transition_reason}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Project Detail Modal Component
// ============================================================================

interface ClientProjectModalProps {
  projectId: number;
  onClose: () => void;
}

function ClientProjectModal({ projectId, onClose }: ClientProjectModalProps) {
  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery(projectId);
  const { data: history } = useGetProjectHistoryQuery(projectId);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const needsReview = project?.current_state === 'CLIENT_PREVIEW_READY';
  const canDownload = project && DOWNLOAD_STATES.includes(project.current_state);

  const handleFeedbackSuccess = () => {
    setFeedbackSubmitted(true);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'max-w-4xl max-h-[90vh] overflow-y-auto',
          'bg-[#1a1a1a] border-gray-800 text-white'
        )}
      >
        {isProjectLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#ECE1CE] animate-spin" />
          </div>
        ) : project ? (
          <>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                {project.project_name}
                <span className="text-sm font-normal text-gray-500 font-mono">
                  {project.project_code}
                </span>
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {STATE_LABELS[project.current_state]}
              </DialogDescription>
            </DialogHeader>

            {/* State Progress */}
            <div className="mb-8">
              <StateProgressBar
                currentState={project.current_state}
                stateHistory={history}
                showMilestones={true}
              />
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* Preview Section */}
              {needsReview && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-400" />
                    Preview Your Video
                  </h3>
                  <PreviewSection
                    projectId={projectId}
                    onTimestampAdd={feedbackSubmitted ? undefined : (time) => {
                      // This will be connected to FeedbackForm via state lift
                    }}
                  />
                </section>
              )}

              {/* Feedback Section */}
              {needsReview && !feedbackSubmitted && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#ECE1CE]" />
                    Submit Your Feedback
                  </h3>
                  <FeedbackForm projectId={projectId} onSuccess={handleFeedbackSuccess} />
                </section>
              )}

              {/* Feedback Submitted Confirmation */}
              {feedbackSubmitted && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Feedback Submitted Successfully
                  </h3>
                  <p className="text-gray-400">
                    Our team will review your feedback and work on the revisions.
                    You will be notified when the updated version is ready.
                  </p>
                </motion.section>
              )}

              {/* Download Section */}
              {canDownload && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-400" />
                    Download Your Files
                  </h3>
                  <DownloadSection projectId={projectId} />
                </section>
              )}

              {/* Timeline */}
              <section>
                <ProjectTimeline projectId={projectId} />
              </section>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-white font-medium">Project not found</p>
            <p className="text-gray-400 text-sm mt-1">
              The requested project could not be loaded.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Film className="w-10 h-10 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
      <p className="text-gray-400 max-w-md">
        Once you have booked a video production project, it will appear here.
        You will be able to track progress, preview edits, and download your final files.
      </p>
    </div>
  );
}

// ============================================================================
// Loading State Component
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-6 rounded-xl bg-[#1a1a1a] border border-gray-800 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-800 rounded w-1/4" />
              <div className="h-2 bg-gray-800 rounded w-full" />
            </div>
            <div className="h-8 w-32 bg-gray-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ClientProjectsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    error,
  } = useGetProjectsByUserQuery(
    {
      user_id: user?.id ?? 0,
      role: 'client',
    },
    {
      skip: !user?.id,
    }
  );

  const projects = projectsData?.data ?? [];

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ECE1CE] animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-400 mb-6">
            Please sign in to view your projects.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ECE1CE] text-[#101010] rounded-lg font-medium hover:bg-[#ECE1CE]/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#101010]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">My Projects</h1>
              <p className="text-gray-400 mt-1">
                Track your video production progress
              </p>
            </div>
            {projects.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-gray-400">
                    {projects.filter((p) => CLIENT_ACTION_STATES.includes(p.current_state)).length} need review
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-400">
                    {projects.filter((p) => DOWNLOAD_STATES.includes(p.current_state)).length} ready
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isProjectsLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Failed to Load Projects
            </h2>
            <p className="text-gray-400">
              Please try refreshing the page.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {projects.map((project, index) => (
                <motion.div
                  key={project.project_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClientProjectCard
                    project={project}
                    onClick={() => setSelectedProject(project.project_id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ClientProjectModal
            projectId={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
