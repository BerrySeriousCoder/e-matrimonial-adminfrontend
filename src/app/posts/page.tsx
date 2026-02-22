'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAdminPosts, useUpdatePostStatus, usePrefetchNextPage, useAdminEditPost } from '../../hooks/useAdminQueries';
import { format } from 'date-fns';
import { Post, getAdminProfile } from '../../lib/api';
import { getAdminToken } from '../../lib/auth';

// Dynamic import to prevent SSR issues with Tiptap
const RichTextEditor = dynamic(() => import('../../components/RichTextEditor'), { ssr: false });

// Utility to strip HTML tags for display
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export default function PostsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  // Action modal state for archive/delete with reason
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'archived' | 'deleted' | null>(null);
  const [actionPost, setActionPost] = useState<Post | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLookingFor, setEditLookingFor] = useState<'bride' | 'groom'>('bride');
  const [editFontSize, setEditFontSize] = useState<'default' | 'large'>('default');
  const [editBgColor, setEditBgColor] = useState('#ffffff');
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const { data, isLoading, error } = useAdminPosts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
    page: currentPage,
  });

  const updateStatusMutation = useUpdatePostStatus();
  const editPostMutation = useAdminEditPost();
  const { prefetchPosts } = usePrefetchNextPage();

  // Check if current admin is superadmin
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      getAdminProfile(token).then((profile) => {
        if (profile?.success && (profile.admin.isSuperadmin || profile.admin.role === 'superadmin')) {
          setIsSuperadmin(true);
        }
      });
    }
  }, []);

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

  // Close modals on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showContentModal) {
          setShowContentModal(false);
          setSelectedPost(null);
        }
        if (showActionModal) {
          closeActionModal();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showContentModal, showActionModal]);

  const handleStatusUpdate = async (postId: number, newStatus: string, reason?: string) => {
    try {
      await updateStatusMutation.mutateAsync({ postId, status: newStatus, reason });
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  // Open action modal for archive/delete
  const openActionModal = (post: Post, action: 'archived' | 'deleted') => {
    setActionPost(post);
    setActionType(action);
    setActionReason('');
    setShowActionModal(true);
  };

  // Close action modal
  const closeActionModal = () => {
    setShowActionModal(false);
    setActionPost(null);
    setActionType(null);
    setActionReason('');
  };

  // Confirm action with reason
  const confirmAction = async () => {
    if (!actionPost || !actionType) return;

    await handleStatusUpdate(actionPost.id, actionType, actionReason || undefined);
    closeActionModal();
  };

  // Edit modal helpers
  const openEditModal = (post: Post) => {
    setEditPost(post);
    setEditContent(post.content);
    setEditLookingFor((post.lookingFor as 'bride' | 'groom') || 'bride');
    setEditFontSize((post.fontSize as 'default' | 'large') || 'default');
    setEditBgColor(post.bgColor || '#ffffff');
    setEditIcon(post.icon || null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditPost(null);
  };

  const handleEditSave = async () => {
    if (!editPost) return;
    const result = await editPostMutation.mutateAsync({
      postId: editPost.id,
      data: {
        content: editContent,
        lookingFor: editLookingFor,
        fontSize: editFontSize,
        bgColor: editBgColor,
        icon: editIcon,
      },
    });
    if (result.success) {
      closeEditModal();
    } else {
      alert(result.message || 'Failed to save');
    }
  };

  const bgColorOptions = [
    { name: 'None', value: '#ffffff' },
    { name: 'Light Blue', value: '#e6f3ff' },
    { name: 'Soft Blue', value: '#cce7ff' },
    { name: 'Light Pink', value: '#ffe6f0' },
    { name: 'Soft Pink', value: '#ffcce6' },
  ];

  const iconOptions = [
    { name: 'None', value: null },
    { name: 'Businessman', value: 'businessman' },
    { name: 'Doctor', value: 'doctor' },
    { name: 'IT Professional', value: 'itprofessional' },
    { name: 'Lawyer', value: 'lawyer' },
    { name: 'Soldier', value: 'soldier' },
    { name: 'Teacher', value: 'teacher' },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      deleted: 'bg-red-100 text-red-800',
      edited: 'bg-orange-100 text-orange-800',
      expired: 'bg-gray-200 text-gray-700',
      payment_pending: 'bg-blue-100 text-blue-800',
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
              <option value="edited" className="text-black">Edited</option>
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
                  Published
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
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
                          {stripHtml(post.content)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.expiresAt ? format(new Date(post.expiresAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.finalAmount ? `₹${post.finalAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {post.couponCode || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {(post.status === 'pending' || post.status === 'edited') && (
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
                            onClick={() => openActionModal(post, 'archived')}
                            disabled={updateStatusMutation.isPending}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Archive'}
                          </button>
                        )}
                        {post.status !== 'deleted' && (
                          <button
                            onClick={() => openActionModal(post, 'deleted')}
                            disabled={updateStatusMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Delete'}
                          </button>
                        )}
                        {isSuperadmin && (
                          <button
                            onClick={() => openEditModal(post)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            Edit
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Last
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                onBlur={(e) => {
                  const page = parseInt(e.target.value);
                  if (isNaN(page) || page < 1) setCurrentPage(1);
                  else if (page > totalPages) setCurrentPage(totalPages);
                }}
                className="w-16 px-2 py-1.5 text-center border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">of <span className="font-medium">{totalPages}</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Content Modal */}
        {showContentModal && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">Post #{selectedPost.id}</h3>
                  {getStatusBadge(selectedPost.status)}
                </div>
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setSelectedPost(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Email */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedPost.email}</span>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
                    <p className="text-sm font-semibold text-gray-900">{format(new Date(selectedPost.createdAt), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(new Date(selectedPost.createdAt), 'hh:mm a')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Published</p>
                    {selectedPost.publishedAt ? (
                      <>
                        <p className="text-sm font-semibold text-green-700">{format(new Date(selectedPost.publishedAt), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-gray-500">{format(new Date(selectedPost.publishedAt), 'hh:mm a')}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expiry</p>
                    {selectedPost.expiresAt ? (
                      <>
                        <p className={`text-sm font-semibold ${new Date(selectedPost.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                          {format(new Date(selectedPost.expiresAt), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">{format(new Date(selectedPost.expiresAt), 'hh:mm a')}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Looking For</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{selectedPost.lookingFor || '—'}</p>
                  </div>
                </div>

                {/* Payment Info */}
                {(selectedPost.finalAmount || selectedPost.couponCode) && (
                  <>
                    <div className="border-t border-gray-200" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">Total Payable</p>
                        <p className="text-lg font-bold text-indigo-700">
                          {selectedPost.finalAmount ? `₹${selectedPost.finalAmount.toLocaleString('en-IN')}` : '—'}
                        </p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">Coupon Used</p>
                        {selectedPost.couponCode ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                            {selectedPost.couponCode}
                          </span>
                        ) : (
                          <p className="text-sm text-gray-400">None</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Content */}
                <div className="border-t border-gray-200" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Content</p>
                  <div
                    className="p-4 bg-gray-50 rounded-lg text-sm text-gray-900 prose prose-sm max-w-none border border-gray-100"
                    dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white rounded-b-xl">
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setSelectedPost(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive/Delete Action Modal */}
        {showActionModal && actionPost && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === 'archived' ? 'Archive Post' : 'Delete Post'}
                </h3>
                <button
                  onClick={closeActionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-3 rounded-md ${actionType === 'archived' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${actionType === 'archived' ? 'text-yellow-800' : 'text-red-800'}`}>
                    {actionType === 'archived'
                      ? 'This will archive the post and notify the user via email.'
                      : 'This will permanently delete the post and notify the user via email.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post</label>
                  <p className="text-sm text-gray-600">ID: {actionPost.id} | Email: {actionPost.email}</p>
                  <p className="text-sm text-gray-500 truncate mt-1">{stripHtml(actionPost.content)}</p>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for {actionType === 'archived' ? 'archiving' : 'deletion'}
                    <span className="text-gray-400 font-normal"> (will be sent to user)</span>
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={`Enter the reason for ${actionType === 'archived' ? 'archiving' : 'deleting'} this post...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeActionModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={updateStatusMutation.isPending}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${actionType === 'archived'
                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                >
                  {updateStatusMutation.isPending
                    ? 'Processing...'
                    : actionType === 'archived' ? 'Archive Post' : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post Modal (Superadmin only) */}
        {showEditModal && editPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Post #{editPost.id}</h3>
                  {getStatusBadge(editPost.status)}
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Post Email (read-only) */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email (read-only)</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">{editPost.email}</div>
                </div>

                {/* Settings row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Looking For</label>
                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm text-black"
                      value={editLookingFor}
                      onChange={(e) => setEditLookingFor(e.target.value as 'bride' | 'groom')}
                    >
                      <option value="bride">Bride</option>
                      <option value="groom">Groom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm text-black"
                      value={editFontSize}
                      onChange={(e) => setEditFontSize(e.target.value as 'default' | 'large')}
                    >
                      <option value="default">Default</option>
                      <option value="large">Large (+20%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Highlight</label>
                    <div className="flex gap-1">
                      {bgColorOptions.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setEditBgColor(c.value)}
                          className={`w-7 h-7 border transition-colors rounded ${editBgColor === c.value
                              ? 'border-blue-500 ring-1 ring-blue-500'
                              : 'border-gray-300 hover:border-gray-400'
                            }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm text-black"
                      value={editIcon || ''}
                      onChange={(e) => setEditIcon(e.target.value || null)}
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value || 'none'} value={option.value || ''}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Content</label>
                  <RichTextEditor
                    value={editContent}
                    onChange={(html: string) => setEditContent(html)}
                    placeholder="Edit the ad content..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white rounded-b-xl">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editPostMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {editPostMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 