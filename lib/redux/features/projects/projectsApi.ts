import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type {
  Project,
  ProjectFile,
  ProjectStateHistory,
  ProjectFeedback,
  CreateProjectData,
  TransitionStateData,
  InitiateUploadData,
  UploadSession,
  ChunkUploadResult,
  CompleteUploadData,
  SubmitFeedbackData,
  GetProjectsByUserParams,
  DownloadUrlResponse,
  ApiResponse,
  PaginatedResponse
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:5001/v1/';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('revure_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Project', 'ProjectFile', 'ProjectHistory', 'ProjectFeedback'],
  endpoints: (builder) => ({
    // Get single project by ID
    getProject: builder.query<Project, number>({
      query: (projectId) => `projects/${projectId}`,
      transformResponse: (response: ApiResponse<Project>) => response.data!,
      providesTags: (result, error, projectId) => [{ type: 'Project', id: projectId }],
    }),

    // Get projects by user ID and role (or all projects for admin)
    getProjectsByUser: builder.query<PaginatedResponse<Project>, GetProjectsByUserParams>({
      query: ({ user_id, role, status, state, dateRange, search, page = 1, limit = 10 }) => ({
        url: role === 'admin' ? 'projects/admin' : 'projects/user',
        params: {
          user_id,
          role,
          status: status || state, // Support both parameter names
          dateRange,
          search,
          page,
          limit
        },
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Project>>) => response.data!,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ project_id }) => ({ type: 'Project' as const, id: project_id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    // Get all projects for admin dashboard
    getAllProjects: builder.query<PaginatedResponse<Project>, {
      state?: string;
      dateRange?: string;
      search?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ state, dateRange, search, page = 1, limit = 100 }) => ({
        url: 'projects/admin',
        params: { state, dateRange, search, page, limit },
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Project>>) => response.data!,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ project_id }) => ({ type: 'Project' as const, id: project_id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    // Assign user (editor/creator) to project
    assignUser: builder.mutation<Project, { projectId: number; userId: number; role: 'editor' | 'creator' }>({
      query: ({ projectId, userId, role }) => ({
        url: `projects/${projectId}/assign`,
        method: 'POST',
        body: { user_id: userId, role },
      }),
      transformResponse: (response: ApiResponse<Project>) => response.data!,
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    // Create new project from booking
    createProject: builder.mutation<Project, CreateProjectData>({
      query: (data) => ({
        url: 'projects/create',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Project>) => response.data!,
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // Transition project state
    transitionState: builder.mutation<Project, { projectId: number; data: TransitionStateData }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/transition`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Project>) => response.data!,
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectHistory', id: projectId },
      ],
    }),

    // Get project files
    getProjectFiles: builder.query<ProjectFile[], number>({
      query: (projectId) => `projects/${projectId}/files`,
      transformResponse: (response: ApiResponse<ProjectFile[]>) => response.data!,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result.map(({ file_id }) => ({ type: 'ProjectFile' as const, id: file_id })),
              { type: 'ProjectFile', id: projectId },
            ]
          : [{ type: 'ProjectFile', id: projectId }],
    }),

    // Get project state history
    getProjectHistory: builder.query<ProjectStateHistory[], number>({
      query: (projectId) => `projects/${projectId}/history`,
      transformResponse: (response: ApiResponse<ProjectStateHistory[]>) => response.data!,
      providesTags: (result, error, projectId) => [{ type: 'ProjectHistory', id: projectId }],
    }),

    // Get project feedback
    getProjectFeedback: builder.query<ProjectFeedback[], number>({
      query: (projectId) => `projects/${projectId}/feedback`,
      transformResponse: (response: ApiResponse<ProjectFeedback[]>) => response.data!,
      providesTags: (result, error, projectId) =>
        result
          ? [
              ...result.map(({ feedback_id }) => ({ type: 'ProjectFeedback' as const, id: feedback_id })),
              { type: 'ProjectFeedback', id: projectId },
            ]
          : [{ type: 'ProjectFeedback', id: projectId }],
    }),

    // Submit client or internal feedback
    submitFeedback: builder.mutation<ProjectFeedback, { projectId: number; data: SubmitFeedbackData }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/feedback`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<ProjectFeedback>) => response.data!,
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectFeedback', id: projectId },
        { type: 'Project', id: projectId },
      ],
    }),

    // Initiate chunked file upload
    initiateFileUpload: builder.mutation<UploadSession, { projectId: number; data: InitiateUploadData }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/files/initiate-upload`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<UploadSession>) => response.data!,
    }),

    // Upload file chunk
    uploadChunk: builder.mutation<ChunkUploadResult, { projectId: number; formData: FormData }>({
      query: ({ projectId, formData }) => ({
        url: `projects/${projectId}/files/upload-chunk`,
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiResponse<ChunkUploadResult>) => response.data!,
    }),

    // Complete chunked upload
    completeUpload: builder.mutation<ProjectFile, { projectId: number; data: CompleteUploadData }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/files/complete-upload`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<ProjectFile>) => response.data!,
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectFile', id: projectId },
        { type: 'Project', id: projectId },
      ],
    }),

    // Get presigned download URL for a file
    getDownloadUrl: builder.query<DownloadUrlResponse, number>({
      query: (fileId) => `projects/files/${fileId}/download-url`,
      transformResponse: (response: ApiResponse<DownloadUrlResponse>) => response.data!,
    }),

    // Delete project file
    deleteProjectFile: builder.mutation<{ success: boolean; message: string }, number>({
      query: (fileId) => ({
        url: `projects/files/${fileId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ success: boolean; message: string }>) => response.data!,
      invalidatesTags: (result, error, fileId) => [{ type: 'ProjectFile', id: fileId }],
    }),

    // Update project details
    updateProject: builder.mutation<Project, { projectId: number; data: Partial<Project> }>({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Project>) => response.data!,
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),
  }),
});

export const {
  useGetProjectQuery,
  useGetProjectsByUserQuery,
  useGetAllProjectsQuery,
  useAssignUserMutation,
  useCreateProjectMutation,
  useTransitionStateMutation,
  useGetProjectFilesQuery,
  useGetProjectHistoryQuery,
  useGetProjectFeedbackQuery,
  useSubmitFeedbackMutation,
  useInitiateFileUploadMutation,
  useUploadChunkMutation,
  useCompleteUploadMutation,
  useGetDownloadUrlQuery,
  useLazyGetDownloadUrlQuery,
  useDeleteProjectFileMutation,
  useUpdateProjectMutation,
} = projectsApi;
