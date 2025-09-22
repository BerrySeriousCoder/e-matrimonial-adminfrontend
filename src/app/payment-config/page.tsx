'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getAdminToken } from '../../lib/auth';

interface PaymentConfig {
  id: number;
  basePriceFirst200: number;
  additionalPricePer20Chars: number;
  largeFontMultiplier: number;
  visibility2WeeksMultiplier: number;
  visibility3WeeksMultiplier: number;
  visibility4WeeksMultiplier: number;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        console.error('No admin token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/payment/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      } else {
        console.error('Error fetching config:', data.message);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const token = getAdminToken();
      if (!token) {
        setMessage('No admin token found');
        setSaving(false);
        return;
      }

      // Remove id and timestamps from the request body as they're not allowed in updates
      if (!config) {
        setMessage('No configuration data to save');
        setSaving(false);
        return;
      }
      
      const { id, createdAt, updatedAt, ...updateData } = config;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/payment/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Payment configuration updated successfully!');
        setConfig(data.config);
      } else {
        setMessage('Error updating configuration: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PaymentConfig, value: number) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load payment configuration</p>
          <button onClick={fetchConfig} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/admin-management" className="mr-4">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Configuration</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Settings</h2>
            <p className="text-sm text-gray-600">Configure the pricing structure for matrimonial ads</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Pricing */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Base Pricing</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First 200 Characters (₹)
                  </label>
                  <input
                    type="number"
                    value={config.basePriceFirst200}
                    onChange={(e) => handleChange('basePriceFirst200', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Price per 20 Characters (₹)
                  </label>
                  <input
                    type="number"
                    value={config.additionalPricePer20Chars}
                    onChange={(e) => handleChange('additionalPricePer20Chars', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="0"
                  />
                </div>
              </div>

              {/* Multipliers */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Multipliers</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Large Font Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.largeFontMultiplier}
                    onChange={(e) => handleChange('largeFontMultiplier', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="1.0"
                    max="5.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">1.20 = 20% extra charge</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2 Weeks Visibility Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.visibility2WeeksMultiplier}
                    onChange={(e) => handleChange('visibility2WeeksMultiplier', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="0.1"
                    max="5.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3 Weeks Visibility Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.visibility3WeeksMultiplier}
                    onChange={(e) => handleChange('visibility3WeeksMultiplier', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="0.1"
                    max="5.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    4 Weeks Visibility Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.visibility4WeeksMultiplier}
                    onChange={(e) => handleChange('visibility4WeeksMultiplier', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    min="0.1"
                    max="5.0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={fetchConfig}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Examples</h2>
            <p className="text-sm text-gray-600">Examples update automatically based on current settings</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-900">100 characters, Default font, 2 weeks:</span>
                <span className="font-medium text-gray-900">₹{config.basePriceFirst200}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">300 characters, Default font, 2 weeks:</span>
                <span className="font-medium text-gray-900">₹{config.basePriceFirst200 + (Math.ceil(100 / 20) * config.additionalPricePer20Chars)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">200 characters, Large font, 3 weeks:</span>
                <span className="font-medium text-gray-900">₹{Math.round(config.basePriceFirst200 * config.largeFontMultiplier * config.visibility3WeeksMultiplier)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">400 characters, Large font, 4 weeks:</span>
                <span className="font-medium text-gray-900">₹{Math.round((config.basePriceFirst200 + (Math.ceil(200 / 20) * config.additionalPricePer20Chars)) * config.largeFontMultiplier * config.visibility4WeeksMultiplier)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">500 characters, Large font, 4 weeks:</span>
                <span className="font-medium text-gray-900">₹{Math.round((config.basePriceFirst200 + (Math.ceil(300 / 20) * config.additionalPricePer20Chars)) * config.largeFontMultiplier * config.visibility4WeeksMultiplier)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">150 characters, Default font, 3 weeks:</span>
                <span className="font-medium text-gray-900">₹{Math.round(config.basePriceFirst200 * config.visibility3WeeksMultiplier)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">200 characters, Default font, 2 weeks:</span>
                <span className="font-medium text-gray-900">₹{Math.round(config.basePriceFirst200 * config.visibility2WeeksMultiplier)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
