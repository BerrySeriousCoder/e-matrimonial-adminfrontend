'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken } from '../../lib/auth';
import { getAdminProfile } from '../../lib/api';

interface UIText {
  id: number;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

export default function UITextsPage() {
  const [texts, setTexts] = useState<UIText[]>([]);
  const [originalTexts, setOriginalTexts] = useState<UIText[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

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
          fetchUITexts();
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkAccess();
  }, [router]);

  if (!hasAccess && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600">Access Denied</div>
        <div className="text-sm text-gray-600 mt-2">Superadmin access required</div>
      </div>
    );
  }

  const fetchUITexts = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ui-texts/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTexts(data.texts);
        setOriginalTexts(data.texts);
      } else {
        console.error('Failed to fetch UI texts');
      }
    } catch (error) {
      console.error('Error fetching UI texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateText = async (key: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [key]: 'Value cannot be empty' }));
      return;
    }

    setSaving(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ui-texts/admin/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ value: value.trim() }),
      });

      if (response.ok) {
        // Update the local state
        setTexts(prev => prev.map(text => 
          text.key === key ? { ...text, value: value.trim() } : text
        ));
        // Update original texts to reflect the saved state
        setOriginalTexts(prev => prev.map(text => 
          text.key === key ? { ...text, value: value.trim() } : text
        ));
        // Recalculate if there are any remaining changes
        setTexts(currentTexts => {
          const hasAnyChanges = currentTexts.some(text => {
            const original = originalTexts.find(o => o.key === text.key);
            return original && original.value !== text.value;
          });
          setHasChanges(hasAnyChanges);
          return currentTexts;
        });
      } else {
        const errorData = await response.json();
        setErrors(prev => ({ ...prev, [key]: errorData.error || 'Failed to update' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: 'Network error' }));
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleInputChange = (key: string, value: string) => {
    // Update the local state immediately for better UX
    setTexts(prev => {
      const updated = prev.map(text => 
        text.key === key ? { ...text, value } : text
      );
      
      // Check if there are any changes compared to original
      const hasAnyChanges = updated.some(text => {
        const original = originalTexts.find(o => o.key === text.key);
        return original && original.value !== text.value;
      });
      setHasChanges(hasAnyChanges);
      
      return updated;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, key: string, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateText(key, value);
    }
  };

  const handleSaveAll = async () => {
    const changedTexts = texts.filter(text => {
      const original = originalTexts.find(o => o.key === text.key);
      return original && original.value !== text.value;
    });

    if (changedTexts.length === 0) {
      return;
    }

    setSaving(prev => ({ ...prev, all: true }));
    setErrors({});

    try {
      await Promise.all(
        changedTexts.map(text => updateText(text.key, text.value))
      );
      setOriginalTexts([...texts]);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving all changes:', error);
    } finally {
      setSaving(prev => ({ ...prev, all: false }));
    }
  };

  const handleReset = () => {
    setTexts([...originalTexts]);
    setHasChanges(false);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading UI texts...</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">UI Settings</h1>
          <p className="mt-2 text-gray-600">
            Customize the text labels and messages used throughout the client website.
          </p>
        </div>

        {/* How it works - moved to top */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make changes to any text field below</li>
            <li>• Press Enter to save individual changes, or use Save All Changes button</li>
            <li>• All changes are immediately reflected on the client website</li>
            <li>• Use Reset Changes to discard unsaved modifications</li>
          </ul>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Customizable UI Elements</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit the text values below. Press Enter to save individual changes or use the Save All Changes button.
                </p>
              </div>
              <div className="flex space-x-3">
                {hasChanges && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Reset Changes
                  </button>
                )}
                <button
                  onClick={handleSaveAll}
                  disabled={!hasChanges || saving.all}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasChanges && !saving.all
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving.all ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {texts.map((text) => (
              <div key={text.key} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {text.key}
                      </label>
                      {saving[text.key] && (
                        <span className="text-xs text-blue-600">Saving...</span>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={text.value}
                      onChange={(e) => handleInputChange(text.key, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, text.key, e.currentTarget.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600 text-black ${
                        errors[text.key] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter text value"
                    />
                    
                    {errors[text.key] && (
                      <p className="mt-1 text-xs text-red-600">{errors[text.key]}</p>
                    )}
                    
                    <p className="mt-1 text-xs text-gray-500">
                      {text.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasChanges && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Unsaved Changes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You have unsaved changes. Press Enter to save individual changes or use the Save All Changes button above.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 