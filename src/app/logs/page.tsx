'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAdminLogs, usePrefetchNextPage } from '../../hooks/useAdminQueries';
import { format } from 'date-fns';
import { getAdminToken } from '../../lib/auth';
import { getAdminProfile, AdminLog } from '../../lib/api';

export default function LogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  // Always call hooks at the top level
  const { data, isLoading, error } = useAdminLogs({
    action: actionFilter || undefined,
    page: currentPage,
  });

  const { prefetchLogs } = usePrefetchNextPage();

  // Check superadmin access
  useEffect(() => {
    const checkAccess = async () => {
      const token = getAdminToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await getAdminProfile(token);
        if (response.success && response.admin.isSuperadmin) {
          setHasAccess(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  // Prefetch next page (only if has access)
  useEffect(() => {
    if (hasAccess && data?.totalPages && currentPage < data.totalPages) {
      prefetchLogs({
        action: actionFilter || undefined,
        page: currentPage,
      });
    }
  }, [currentPage, actionFilter, data?.totalPages, prefetchLogs, hasAccess]);

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const getActionBadge = (action: string) => {
    const actionClasses = {
      admin_login: 'bg-blue-100 text-blue-800',
      approve_post: 'bg-green-100 text-green-800',
      archive_post: 'bg-yellow-100 text-yellow-800',
      delete_post: 'bg-red-100 text-red-800',
      create_post: 'bg-purple-100 text-purple-800',
    };

    const actionLabels = {
      admin_login: 'Admin Login',
      approve_post: 'Approve Post',
      archive_post: 'Archive Post',
      delete_post: 'Delete Post',
      create_post: 'Create Post',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionClasses[action as keyof typeof actionClasses] || 'bg-gray-100 text-gray-800'}`}>
        {actionLabels[action as keyof typeof actionLabels] || action}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600">Access Denied</div>
        <div className="text-sm text-gray-600 mt-2">Superadmin access required</div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center text-red-600">
          Error loading logs. Please try again.
        </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Activity Logs</h2>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Action
            </label>
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              >
                <option value="" className="text-black">All Actions</option>
                <option value="approve_post" className="text-black">Approve Post</option>
                <option value="archive_post" className="text-black">Archive Post</option>
                <option value="delete_post" className="text-black">Delete Post</option>
                <option value="create_post" className="text-black">Create Post</option>
              </select>
              <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log: AdminLog) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.admin?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {log.details || `${log.entityType} ${log.entityId || ''}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 