const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminUser {
  id: number;
  email: string;
  isSuperadmin: boolean;
  createdAt: string;
}

export interface Post {
  id: number;
  email: string;
  content: string;
  userId?: number;
  lookingFor?: 'bride' | 'groom';
  expiresAt?: string;
  fontSize?: 'default' | 'medium' | 'large';
  bgColor?: string;
  status: 'pending' | 'published' | 'archived' | 'deleted';
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface AdminLog {
  id: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  admin: {
    id: number;
    email: string;
  };
}

export interface AdminManagement {
  id: number;
  email: string;
  createdAt: string;
}

// Authentication
export const adminLogin = async (data: AdminLoginData) => {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getAdminProfile = async (token: string) => {
  const response = await fetch(`${API_URL}/admin/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Posts Management
export const getAdminPosts = async (token: string, params: {
  status?: string;
  search?: string;
  page?: number;
}) => {
  const url = new URL(`${API_URL}/admin/posts`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value.toString());
  });

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const updatePostStatus = async (token: string, postId: number, status: string) => {
  const response = await fetch(`${API_URL}/admin/posts/${postId}/status`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ status }),
  });
  return response.json();
};

export const createAdminPost = async (token: string, data: {
  email: string;
  content: string;
  lookingFor?: 'bride' | 'groom';
  duration?: number;
  fontSize?: 'default' | 'medium' | 'large';
  bgColor?: string;
}) => {
  const response = await fetch(`${API_URL}/admin/posts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Users Management
export const getAdminUsers = async (token: string, params: {
  search?: string;
  page?: number;
}) => {
  const url = new URL(`${API_URL}/admin/users`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value.toString());
  });

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return response.json();
};

export const getUserPosts = async (token: string, userId: number) => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Admin Logs
export const getAdminLogs = async (token: string, params: {
  action?: string;
  adminId?: number;
  page?: number;
}) => {
  const url = new URL(`${API_URL}/admin/logs`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value.toString());
  });

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Admin Management
export const getAdminManagement = async (token: string, params: {
  search?: string;
  page?: number;
}) => {
  const url = new URL(`${API_URL}/admin/management`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value.toString());
  });

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const createAdmin = async (token: string, data: {
  email: string;
  password: string;
}) => {
  const response = await fetch(`${API_URL}/admin/management`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const resetAdminPassword = async (token: string, adminId: number, password: string) => {
  const response = await fetch(`${API_URL}/admin/management/${adminId}/password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ password }),
  });
  return response.json();
};

export const deleteAdmin = async (token: string, adminId: number) => {
  const response = await fetch(`${API_URL}/admin/management/${adminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}; 