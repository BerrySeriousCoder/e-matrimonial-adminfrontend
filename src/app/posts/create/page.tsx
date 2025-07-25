'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useCreateAdminPost } from '../../../hooks/useAdminQueries';

export default function CreatePostPage() {
  const router = useRouter();
  const createPostMutation = useCreateAdminPost();

  const [formData, setFormData] = useState({
    email: '',
    content: '',
    lookingFor: 'bride' as 'bride' | 'groom',
    duration: 20,
    fontSize: 'default' as 'default' | 'medium' | 'large',
    bgColor: '#ffffff',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPostMutation.mutateAsync(formData);
      router.push('/posts');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const colorOptions = [
    { name: 'Default White', value: '#ffffff' },
    { name: 'Light Blue', value: '#f0f8ff' },
    { name: 'Light Green', value: '#f0fff0' },
    { name: 'Light Pink', value: '#fff0f5' },
    { name: 'Light Gray', value: '#f8f8ff' },
    { name: 'Light Yellow', value: '#f5f5dc' },
    { name: 'Light Orange', value: '#faf0e6' },
    { name: 'Light Purple', value: '#f8f0ff' },
    { name: 'Light Cyan', value: '#f0ffff' },
    { name: 'Light Salmon', value: '#fff5ee' },
  ];

  return (
    <>
      <div className="flex items-center mb-8">
        <Link
          href="/posts"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Posts
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600 text-black"
                placeholder="user@example.com"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Content *
              </label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600 text-black"
                placeholder="Enter the matrimonial post content..."
              />
            </div>

            {/* Looking For */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Looking For
              </label>
              <select
                value={formData.lookingFor}
                onChange={(e) => handleChange('lookingFor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              >
                <option value="bride" className="text-black">Bride</option>
                <option value="groom" className="text-black">Groom</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Duration (Days)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              >
                <option value={15} className="text-black">15 Days</option>
                <option value={20} className="text-black">20 Days</option>
                <option value={25} className="text-black">25 Days</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={formData.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              >
                <option value="default" className="text-black">Default</option>
                <option value="medium" className="text-black">Medium</option>
                <option value="large" className="text-black">Large</option>
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('bgColor', color.value)}
                    className={`p-3 rounded-md border-2 transition-colors ${
                      formData.bgColor === color.value
                        ? 'border-indigo-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selected: {colorOptions.find(c => c.value === formData.bgColor)?.name}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/posts"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createPostMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
              </button>
            </div>

            {/* Error Message */}
            {createPostMutation.error && (
              <div className="text-red-600 text-sm">
                Error creating post. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
} 