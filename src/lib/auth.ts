// Using sessionStorage instead of localStorage for security
// Admin sessions will expire when browser is closed
export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('adminToken');
};

export const setAdminToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('adminToken', token);
};

export const removeAdminToken = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('adminToken');
};

export const isAdminAuthenticated = (): boolean => {
  return getAdminToken() !== null;
}; 