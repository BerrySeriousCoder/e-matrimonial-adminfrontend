import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminToken } from '../lib/auth';
import {
  getAdminPosts,
  getAdminUsers,
  getAdminLogs,
  updatePostStatus,
  createAdminPost,
  getUserPosts,
  getAdminManagement,
  createAdmin,
  resetAdminPassword,
  deleteAdmin,
  getDataEntryPosts,
  createDataEntryPost,
  updateDataEntryPost,
} from '../lib/api';

// Posts Queries
export const useAdminPosts = (params: {
  status?: string;
  search?: string;
  page?: number;
}) => {
  const token = getAdminToken();
  
  return useQuery({
    queryKey: ['admin-posts', params],
    queryFn: () => getAdminPosts(token!, params),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUpdatePostStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, status, reason }: { postId: number; status: string; reason?: string }) => {
      const token = getAdminToken();
      return updatePostStatus(token!, postId, status, reason);
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });
};

export const useCreateAdminPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      email: string;
      content: string;
      lookingFor?: 'bride' | 'groom';
      duration?: number;
      fontSize?: 'default' | 'medium' | 'large';
      bgColor?: string;
    }) => {
      const token = getAdminToken();
      return createAdminPost(token!, data);
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });
};

// Users Queries
export const useAdminUsers = (params: {
  search?: string;
  page?: number;
}) => {
  const token = getAdminToken();
  
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => getAdminUsers(token!, params),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserPosts = (userId: number) => {
  const token = getAdminToken();
  
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => getUserPosts(token!, userId),
    enabled: !!token && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Logs Queries
export const useAdminLogs = (params: {
  action?: string;
  adminId?: number;
  page?: number;
  limit?: number;
}) => {
  const token = getAdminToken();
  
  return useQuery({
    queryKey: ['admin-logs', params],
    queryFn: () => getAdminLogs(token!, params),
    enabled: !!token,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Admin Management Queries
export const useAdminManagement = (params: {
  search?: string;
  page?: number;
}) => {
  const token = getAdminToken();
  
  return useQuery({
    queryKey: ['admin-management', params],
    queryFn: () => getAdminManagement(token!, params),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; password: string; role?: 'admin' | 'data_entry' }) => {
      const token = getAdminToken();
      return createAdmin(token!, data);
    },
    onSuccess: () => {
      // Invalidate and refetch admin management
      queryClient.invalidateQueries({ queryKey: ['admin-management'] });
    },
  });
};

export const useResetAdminPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ adminId, password }: { adminId: number; password: string }) => {
      const token = getAdminToken();
      return resetAdminPassword(token!, adminId, password);
    },
    onSuccess: () => {
      // Invalidate and refetch admin management
      queryClient.invalidateQueries({ queryKey: ['admin-management'] });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adminId: number) => {
      const token = getAdminToken();
      return deleteAdmin(token!, adminId);
    },
    onSuccess: () => {
      // Invalidate and refetch admin management
      queryClient.invalidateQueries({ queryKey: ['admin-management'] });
    },
  });
};

// Prefetching functions
export const usePrefetchNextPage = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchPosts: (params: {
      status?: string;
      search?: string;
      page: number;
    }) => {
      const nextPageParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['admin-posts', nextPageParams],
        queryFn: () => getAdminPosts(getAdminToken()!, nextPageParams),
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchUsers: (params: {
      search?: string;
      page: number;
    }) => {
      const nextPageParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['admin-users', nextPageParams],
        queryFn: () => getAdminUsers(getAdminToken()!, nextPageParams),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchLogs: (params: {
      action?: string;
      adminId?: number;
      page: number;
      limit?: number;
    }) => {
      const nextPageParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['admin-logs', nextPageParams],
        queryFn: () => getAdminLogs(getAdminToken()!, nextPageParams),
        staleTime: 1 * 60 * 1000,
      });
    },
    prefetchAdminManagement: (params: {
      search?: string;
      page: number;
    }) => {
      const nextPageParams = { ...params, page: params.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['admin-management', nextPageParams],
        queryFn: () => getAdminManagement(getAdminToken()!, nextPageParams),
        staleTime: 2 * 60 * 1000,
      });
    },
  };
}; 

// Data Entry Queries
export const useDataEntryPosts = (params: { status?: string; search?: string; page?: number }) => {
  const token = getAdminToken();
  return useQuery({
    queryKey: ['data-entry-posts', params],
    queryFn: () => getDataEntryPosts(token!, params),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateDataEntryPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; content: string; lookingFor: 'bride' | 'groom'; duration: number; fontSize?: 'default' | 'medium' | 'large'; bgColor?: string }) => {
      const token = getAdminToken();
      return createDataEntryPost(token!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-entry-posts'] });
    },
  });
};

export const useUpdateDataEntryPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: { content?: string; lookingFor?: 'bride' | 'groom'; fontSize?: 'default' | 'medium' | 'large'; bgColor?: string } }) => {
      const token = getAdminToken();
      return updateDataEntryPost(token!, postId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-entry-posts'] });
    },
  });
};