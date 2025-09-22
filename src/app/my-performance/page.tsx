'use client';

import { useState, useEffect } from 'react';
import { getAdminToken } from '@/lib/auth';

interface DataEntryStats {
  date: string;
  postsCreated: number;
  postsApproved: number;
  postsRejected: number;
  postsEdited: number;
  totalCharacters: number;
}

export default function MyPerformancePage() {
  const [stats, setStats] = useState<DataEntryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchMyPerformance = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/my-performance?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching my performance:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMyPerformance();
      setLoading(false);
    };
    loadData();
  }, [days]);

  const calculateTotals = () => {
    return stats.reduce((totals, day) => ({
      postsCreated: totals.postsCreated + day.postsCreated,
      postsApproved: totals.postsApproved + day.postsApproved,
      postsRejected: totals.postsRejected + day.postsRejected,
      postsEdited: totals.postsEdited + day.postsEdited,
      totalCharacters: totals.totalCharacters + day.totalCharacters,
    }), {
      postsCreated: 0,
      postsApproved: 0,
      postsRejected: 0,
      postsEdited: 0,
      totalCharacters: 0,
    });
  };

  const totals = calculateTotals();
  const approvalRate = totals.postsCreated > 0 ? (totals.postsApproved / totals.postsCreated) * 100 : 0;
  const rejectionRate = totals.postsCreated > 0 ? (totals.postsRejected / totals.postsCreated) * 100 : 0;
  const editRate = totals.postsCreated > 0 ? (totals.postsEdited / totals.postsCreated) * 100 : 0;
  const avgPostsPerDay = stats.length > 0 ? totals.postsCreated / stats.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
          <p className="mt-2 text-gray-600">Track your productivity and efficiency metrics</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Created</p>
                <p className="text-2xl font-semibold text-gray-900">{totals.postsCreated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{totals.postsApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{totals.postsRejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posts Edited</p>
                <p className="text-2xl font-semibold text-gray-900">{totals.postsEdited}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="font-semibold text-green-600">{approvalRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rejection Rate</span>
                <span className="font-semibold text-red-600">{rejectionRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Edit Rate</span>
                <span className="font-semibold text-yellow-600">{editRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Posts/Day</span>
                <span className="font-semibold text-gray-900">{avgPostsPerDay.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Characters</span>
                <span className="font-semibold text-gray-900">{totals.totalCharacters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Days</span>
                <span className="font-semibold text-gray-900">{stats.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Characters/Post</span>
                <span className="font-semibold text-gray-900">
                  {totals.postsCreated > 0 ? Math.round(totals.totalCharacters / totals.postsCreated) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edited</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Characters</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(stats) && stats.length > 0 ? stats.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.postsCreated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.postsApproved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.postsRejected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.postsEdited}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.totalCharacters.toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
