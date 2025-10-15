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
    duration: 14 as 14 | 21 | 28, // Updated: 2, 3, 4 weeks
    fontSize: 'default' as 'default' | 'large', // Updated: removed 'medium'
    bgColor: '#ffffff',
    couponCode: '', // Added coupon code
  });

  const [currentCharacters, setCurrentCharacters] = useState(0);

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
    if (field === 'content') {
      setCurrentCharacters(value.toString().length);
    }
  };

  // Updated color options - only 5 blue and pink shades
  const colorOptions = [
    { name: 'None', value: '#ffffff' },
    { name: 'Light Blue', value: '#e6f3ff' },
    { name: 'Soft Blue', value: '#cce7ff' },
    { name: 'Light Pink', value: '#ffe6f0' },
    { name: 'Soft Pink', value: '#ffcce6' }
  ];

  return (
    <>
      <div className="flex items-center mb-8">
        <Link
          href="/posts"
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Posts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              required
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <span className={`text-xs font-medium ${
                currentCharacters > 200 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {currentCharacters} characters
                {currentCharacters > 200 && (
                  <span className="text-gray-500"> (200 free + {currentCharacters - 200} paid)</span>
                )}
              </span>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black ${
                currentCharacters > 200 
                  ? 'border-red-300 focus:border-red-600' 
                  : 'border-gray-300'
              }`}
              rows={6}
              required
              placeholder="Enter the matrimonial advertisement content..."
            />
            {currentCharacters > 200 && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Characters beyond 200 will be charged at ₹500 per 20 characters
              </div>
            )}
          </div>

          {/* I am looking for */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am looking for
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
              Duration (Days)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value={14} className="text-black">2 weeks (14 days)</option>
              <option value={21} className="text-black">3 weeks (21 days)</option>
              <option value={28} className="text-black">4 weeks (28 days)</option>
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
              <option value="large" className="text-black">Large (+20%)</option>
            </select>
          </div>

          {/* Highlight Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlight Color
            </label>
            <div className="grid grid-cols-5 gap-2">
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
              Selected highlighter: {colorOptions.find(c => c.value === formData.bgColor)?.name}
            </p>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code (Optional)
            </label>
            <input
              type="text"
              value={formData.couponCode}
              onChange={(e) => handleChange('couponCode', e.target.value)}
              placeholder="Enter coupon code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div 
              className="p-4 border rounded-md"
              style={{ 
                backgroundColor: formData.bgColor,
                fontSize: formData.fontSize === 'default' ? '14px' : '18px'
              }}
            >
              <div className="font-serif text-sm leading-relaxed">
                {formData.content || 'Your post content will appear here...'}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                I am looking for {formData.lookingFor === 'bride' ? 'bride' : 'groom'} | Duration: {formData.duration} days
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/posts"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
