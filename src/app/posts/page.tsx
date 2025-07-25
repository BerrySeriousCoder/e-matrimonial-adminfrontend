'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAdminPosts, useUpdatePostStatus, usePrefetchNextPage } from '../../hooks/useAdminQueries';
import { format } from 'date-fns';
import { Post } from '../../lib/api';

export default function PostsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  const { data, isLoading, error } = useAdminPosts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
    page: currentPage,
  });

  const updateStatusMutation = useUpdatePostStatus();
  const { prefetchPosts } = usePrefetchNextPage();

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  // Prefetch next page
  useEffect(() => {
    if (currentPage < totalPages) {
      prefetchPosts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        page: currentPage,
      });
    }
  }, [currentPage, statusFilter, search, totalPages, prefetchPosts]);

  const handleStatusUpdate = async (postId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ postId, status: newStatus });
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      deleted: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (error) {
    return (
        <div className="text-center text-red-600">
          Error loading posts. Please try again.
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Posts Management</h2>
        <Link
          href="/posts/create"
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Post</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600 text-black"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="all" className="text-black">All Status</option>
              <option value="pending" className="text-black">Pending</option>
              <option value="published" className="text-black">Published</option>
              <option value="archived" className="text-black">Archived</option>
              <option value="deleted" className="text-black">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
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
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No posts found.
                  </td>
                </tr>
              ) : (
                posts.map((post: Post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {post.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <div className="truncate">
                        {post.content}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowContentModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-xs mt-1"
                        >
                          View Full Content
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {post.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(post.id, 'published')}
                            disabled={updateStatusMutation.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 transition-colors"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Approve'}
                          </button>
                        )}
                        {post.status !== 'deleted' && post.status !== 'archived' && (
                          <button
                            onClick={() => handleStatusUpdate(post.id, 'archived')}
                            disabled={updateStatusMutation.isPending}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Archive'}
                          </button>
                        )}
                        {post.status !== 'deleted' && (
                          <button
                            onClick={() => handleStatusUpdate(post.id, 'deleted')}
                            disabled={updateStatusMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Delete'}
                          </button>
                        )}
                      </div>
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

        {/* Content Modal */}
        {showContentModal && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Post Content</h3>
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setSelectedPost(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post ID</label>
                  <p className="text-sm text-gray-900">{selectedPost.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedPost.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPost.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{format(new Date(selectedPost.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setSelectedPost(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 