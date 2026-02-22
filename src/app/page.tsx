'use client';

import {
  DocumentTextIcon,
  UsersIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  InboxIcon,
  InformationCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useDashboardStats } from '../hooks/useAdminQueries';

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats();
  const stats = data?.stats;

  const statCards = [
    {
      title: 'Total Posts',
      subtitle: 'All time, all statuses',
      tooltip: 'Total number of posts ever created in the system, including all statuses: pending, published, archived, deleted, expired, edited, and payment pending.',
      value: stats?.totalPosts || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Published & Active',
      subtitle: 'Currently live, not expired',
      tooltip: 'Posts that are currently published AND have not crossed their expiry date. These are the posts visible to users on the website right now.',
      value: stats?.publishedPosts || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Awaiting Action',
      subtitle: 'Pending + Edited + Payment Pending',
      tooltip: 'Posts that need attention: "Pending" (waiting for admin approval), "Edited" (re-edited by data entry, needs re-approval), and "Payment Pending" (approved but user hasn\'t paid yet).',
      value: stats?.unpublishedValidPosts || 0,
      icon: ExclamationCircleIcon,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      title: 'Registered Users',
      subtitle: 'All time total',
      tooltip: 'Total number of users who have registered on the website by verifying their email with OTP. Each unique email is one user.',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      title: 'Unique Ad Emails',
      subtitle: 'Distinct emails across all posts',
      tooltip: 'Number of unique email addresses that have at least one post/ad in the system. If one person submitted 5 posts, they are counted once.',
      value: stats?.uniqueEmailIds || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Interest Emails Sent',
      subtitle: 'User-to-post email interactions',
      tooltip: 'Total number of "interest" emails sent by users to post owners. This does NOT include system emails like OTP, payment links, or status notifications — only emails sent by users expressing interest in a post.',
      value: stats?.totalEmailsSent || 0,
      icon: EnvelopeIcon,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-700',
    },
    {
      title: 'Unique Senders',
      subtitle: 'People who sent interest emails',
      tooltip: 'Number of unique email addresses that have sent at least one interest email to a post. Counts both logged-in and anonymous senders.',
      value: stats?.uniqueSenders || 0,
      icon: InboxIcon,
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
    },
    {
      title: 'Unique Recipients',
      subtitle: 'Posts that received interest emails',
      tooltip: 'Number of unique posts/ads that have received at least one interest email from a user. Shows how many posts are generating engagement.',
      value: stats?.uniqueRecipients || 0,
      icon: ClockIcon,
      color: 'bg-teal-500',
      lightColor: 'bg-teal-50',
      textColor: 'text-teal-700',
    },
    {
      title: 'Unsubscribed',
      subtitle: 'Emails opted out of marketing',
      tooltip: 'Number of email addresses that clicked the unsubscribe link. These people will no longer receive interest/marketing emails, but will still get transactional emails like OTP and payment confirmations.',
      value: stats?.unsubscribedEmails || 0,
      icon: NoSymbolIcon,
      color: 'bg-gray-500',
      lightColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">All statistics are cumulative (all time)</p>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative group/card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.lightColor} p-2.5 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div className="relative group/tip">
                  <InformationCircleIcon className="h-4 w-4 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
                  <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 hidden group-hover/tip:block z-50 shadow-lg leading-relaxed">
                    {card.tooltip}
                    <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {card.value.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Published & Active</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{(stats?.publishedPosts || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Awaiting Action</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{(stats?.unpublishedValidPosts || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700">Other (Archived / Deleted / Expired)</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {((stats?.totalPosts || 0) - (stats?.publishedPosts || 0) - (stats?.unpublishedValidPosts || 0)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="text-sm font-bold text-gray-900">{(stats?.totalPosts || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Email Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Total Emails Sent</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{(stats?.totalEmailsSent || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Unique People Who Sent</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{(stats?.uniqueSenders || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Unique Profiles Emailed</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{(stats?.uniqueRecipients || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/posts"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Manage Posts
          </Link>
          <Link
            href="/users"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Manage Users
          </Link>
          <Link
            href="/posts?status=pending"
            className="flex items-center justify-center px-4 py-3 border border-amber-300 text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <ExclamationCircleIcon className="h-4 w-4 mr-2" />
            Review Pending
          </Link>
        </div>
      </div>
    </>
  );
}
