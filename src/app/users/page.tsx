'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAdminUsers, useUserPosts, usePrefetchNextPage } from '../../hooks/useAdminQueries';
import { format } from 'date-fns';
import { User, Post } from '../../lib/api';

// Utility to strip HTML tags for display
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const { data, isLoading, error } = useAdminUsers({
    search: search || undefined,
    page: currentPage,
  });

  const { data: userPostsData } = useUserPosts(selectedUser || 0);
  const { prefetchUsers } = usePrefetchNextPage();

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  // Debug logging
  useEffect(() => {
    console.log('UsersPage Debug:', {
      data,
      isLoading,
      error,
      users: users.length,
      totalPages,
      search,
      currentPage
    });
  }, [data, isLoading, error, users.length, totalPages, search, currentPage]);

  // Prefetch next page
  useEffect(() => {
    if (currentPage < totalPages) {
      prefetchUsers({
        search: search || undefined,
        page: currentPage,
      });
    }
  }, [currentPage, search, totalPages, prefetchUsers]);

  if (error) {
    console.error('UsersPage Error:', error);
    return (
        <div className="text-center text-red-600">
          Error loading users. Please try again.
        </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Users Management</h2>

      {/* Debug Info */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          Debug: Loading={isLoading.toString()}, Users={users.length}, Error={error ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user: User) => (
                      <tr 
                        key={user.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedUser === user.id ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
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
        </div>

        {/* User Details Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
            {selectedUser && userPostsData?.posts ? (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Posts</h4>
                  <div className="space-y-3">
                    {userPostsData.posts.map((post: Post) => (
                      <div key={post.id} className="border rounded-lg p-3">
                        <div className="text-sm text-gray-900 mb-2">
                          <strong>Status:</strong> {post.status}
                        </div>
                        <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                          <strong>Content:</strong> {stripHtml(post.content)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Select a user to view their details and posts.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 