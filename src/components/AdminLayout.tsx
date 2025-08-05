'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { getAdminToken, removeAdminToken } from '../lib/auth';
import { getAdminProfile, AdminUser } from '../lib/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the login page
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // If we're on login page, don't check authentication
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchAdminProfile = async () => {
      try {
        const response = await getAdminProfile(token);
        if (response.success) {
          setAdmin(response.admin);
        } else {
          removeAdminToken();
          router.push('/login');
        }
      } catch (error) {
        removeAdminToken();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [router, isLoginPage]);

  const handleLogout = () => {
    removeAdminToken();
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // If we're on login page, just render children without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Welcome, {admin?.email}</span>
                {admin?.isSuperadmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Superadmin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              <Link
                href="/"
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/') 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/posts"
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/posts') 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Posts</span>
              </Link>
              <Link
                href="/users"
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/users') 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                <span>Users</span>
              </Link>
              {admin?.isSuperadmin && (
              <Link
                href="/logs"
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/logs') 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span>Activity Logs</span>
              </Link>
              )}
              {admin?.isSuperadmin && (
                <Link
                  href="/admin-management"
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/admin-management') 
                      ? 'text-gray-900 bg-gray-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span>Admin Management</span>
                </Link>
              )}
              {admin?.isSuperadmin && (
                <Link
                  href="/ui-texts"
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/ui-texts') 
                      ? 'text-gray-900 bg-gray-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>UI Settings</span>
                </Link>
              )}
              {admin?.isSuperadmin && (
                <Link
                  href="/search-filters"
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/search-filters') 
                      ? 'text-gray-900 bg-gray-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Search Filters</span>
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 