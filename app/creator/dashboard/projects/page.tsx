'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetProjectsByUserQuery } from '@/lib/redux/features/projects/projectsApi';
import { ProjectCard, ProjectDetailDrawer } from '@/components/projects';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ProjectState } from '@/lib/types';
import {
  Search,
  AlertCircle,
  Folder,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type FilterType = 'all' | 'action_required' | 'in_progress' | 'completed';

interface FilterOption {
  id: FilterType;
  label: string;
  description: string;
  icon: React.ReactNode;
  states?: ProjectState[];
}

// ============================================================================
// Constants
// ============================================================================

// States where creator needs to take action
const ACTION_REQUIRED_STATES: ProjectState[] = [
  'RAW_UPLOADED',
  'RAW_TECH_QC_REJECTED',
  'REVISION_IN_PROGRESS',
  'COVERAGE_REJECTED',
];

// States where project is actively being worked on
const IN_PROGRESS_STATES: ProjectState[] = [
  'RAW_TECH_QC_PENDING',
  'RAW_TECH_QC_APPROVED',
  'COVERAGE_REVIEW_PENDING',
  'EDIT_APPROVAL_PENDING',
  'EDIT_IN_PROGRESS',
  'INTERNAL_EDIT_REVIEW_PENDING',
  'CLIENT_PREVIEW_READY',
  'CLIENT_FEEDBACK_RECEIVED',
  'FEEDBACK_INTERNAL_REVIEW',
  'REVISION_QC_PENDING',
  'FINAL_EXPORT_PENDING',
  'READY_FOR_DELIVERY',
];

// Completed states
const COMPLETED_STATES: ProjectState[] = ['DELIVERED', 'PROJECT_CLOSED'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'action_required',
    label: 'Action Required',
    description: 'Projects needing your attention',
    icon: <AlertCircle className="w-4 h-4" />,
    states: ACTION_REQUIRED_STATES,
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Projects currently being processed',
    icon: <Clock className="w-4 h-4" />,
    states: IN_PROGRESS_STATES,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Delivered and closed projects',
    icon: <CheckCircle2 className="w-4 h-4" />,
    states: COMPLETED_STATES,
  },
  {
    id: 'all',
    label: 'All Projects',
    description: 'View all your projects',
    icon: <Folder className="w-4 h-4" />,
  },
];

// ============================================================================
// Loading Skeleton
// ============================================================================

function ProjectCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
        </div>
        <div className="h-7 bg-gray-800 rounded-full w-24" />
      </div>
      <div className="h-4 bg-gray-800 rounded w-full mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-800 rounded w-20" />
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  filter: FilterType;
  searchQuery: string;
}

function EmptyState({ filter, searchQuery }: EmptyStateProps) {
  const filterOption = FILTER_OPTIONS.find((f) => f.id === filter);

  if (searchQuery) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16">
        <Search className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">No results found</h3>
        <p className="text-gray-400 text-center max-w-sm">
          No projects match &quot;{searchQuery}&quot;. Try a different search term.
        </p>
      </div>
    );
  }

  if (filter === 'action_required') {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">You&apos;re all caught up!</h3>
        <p className="text-gray-400 text-center max-w-sm">
          No projects require your attention right now.
        </p>
      </div>
    );
  }

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <Folder className="w-12 h-12 text-gray-600 mb-4" />
      <h3 className="text-white text-lg font-medium mb-2">
        No {filterOption?.label.toLowerCase() || 'projects'}
      </h3>
      <p className="text-gray-400 text-center max-w-sm">
        {filterOption?.description || 'You don\'t have any projects yet.'}
      </p>
    </div>
  );
}

// ============================================================================
// Filter Tabs
// ============================================================================

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  projectCounts: Record<FilterType, number>;
}

function FilterTabs({ activeFilter, onFilterChange, projectCounts }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Project filters">
      {FILTER_OPTIONS.map((option) => {
        const count = projectCounts[option.id];
        const isActive = activeFilter === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${option.id}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50 focus:ring-offset-2 focus:ring-offset-[#101010]',
              isActive
                ? 'bg-[#ECE1CE] text-black'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  isActive
                    ? 'bg-black/20 text-black'
                    : option.id === 'action_required' && count > 0
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-700 text-gray-300'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CreatorProjectsPage() {
  // ============================================================================
  // State
  // ============================================================================
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>('action_required');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // Auth
  // ============================================================================
  const { user } = useAuth();

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetProjectsByUserQuery(
    {
      user_id: user?.id ?? 0,
      role: 'creator',
      page: 1,
      limit: 100,
    },
    {
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  // Memoize projects to prevent unnecessary re-renders
  const projects = useMemo(() => {
    return projectsResponse?.data ?? [];
  }, [projectsResponse?.data]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Count projects by filter type
  const projectCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: projects.length,
      action_required: 0,
      in_progress: 0,
      completed: 0,
    };

    projects.forEach((project) => {
      if (ACTION_REQUIRED_STATES.includes(project.current_state)) {
        counts.action_required++;
      }
      if (IN_PROGRESS_STATES.includes(project.current_state)) {
        counts.in_progress++;
      }
      if (COMPLETED_STATES.includes(project.current_state)) {
        counts.completed++;
      }
    });

    return counts;
  }, [projects]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply filter
    if (filter !== 'all') {
      const filterOption = FILTER_OPTIONS.find((f) => f.id === filter);
      if (filterOption?.states) {
        result = result.filter((project) =>
          filterOption.states!.includes(project.current_state)
        );
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (project) =>
          project.project_name.toLowerCase().includes(query) ||
          project.project_code.toLowerCase().includes(query)
      );
    }

    // Sort: action required first, then by updated date
    return result.sort((a, b) => {
      const aRequiresAction = ACTION_REQUIRED_STATES.includes(a.current_state);
      const bRequiresAction = ACTION_REQUIRED_STATES.includes(b.current_state);

      if (aRequiresAction && !bRequiresAction) return -1;
      if (!aRequiresAction && bRequiresAction) return 1;

      return new Date(b.state_changed_at).getTime() - new Date(a.state_changed_at).getTime();
    });
  }, [projects, filter, searchQuery]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleProjectClick = useCallback((projectId: number) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================================================
  // Loading State
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#ECE1CE] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Projects</h1>
          <p className="text-gray-400 mt-1">
            Manage your assigned projects and upload files
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50',
            isFetching && 'cursor-not-allowed'
          )}
          aria-label="Refresh projects"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          <span className="hidden sm:inline">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <FilterTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          projectCounts={projectCounts}
        />

        {/* Search */}
        <div className="relative w-full md:w-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full md:w-80 pl-10 pr-4 py-2 rounded-lg',
              'bg-gray-800/50 border border-gray-700',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-[#ECE1CE]/50 focus:border-transparent',
              'transition-colors'
            )}
            aria-label="Search projects by name or code"
          />
        </div>
      </div>

      {/* Action Required Alert */}
      {projectCounts.action_required > 0 && filter !== 'action_required' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-200 text-sm">
            You have{' '}
            <strong>{projectCounts.action_required} project{projectCounts.action_required > 1 ? 's' : ''}</strong>{' '}
            requiring your attention.
          </p>
          <button
            onClick={() => setFilter('action_required')}
            className="ml-auto text-yellow-400 hover:text-yellow-300 text-sm font-medium underline underline-offset-2"
          >
            View now
          </button>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Failed to load projects</h3>
          <p className="text-gray-400 text-center mb-4">
            There was an error loading your projects. Please try again.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#ECE1CE] text-black rounded-lg font-medium hover:bg-[#d4c4a8] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-busy="true"
          aria-label="Loading projects"
        >
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && (
        <div
          role="tabpanel"
          id={`panel-${filter}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  onClick={() => handleProjectClick(project.project_id)}
                />
              ))
            ) : (
              <EmptyState filter={filter} searchQuery={searchQuery} />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <p className="text-gray-500 text-sm text-center">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      )}

      {/* Project Detail Drawer */}
      <AnimatePresence>
        {selectedProjectId && (
          <ProjectDetailDrawer
            projectId={selectedProjectId}
            onClose={handleCloseDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
