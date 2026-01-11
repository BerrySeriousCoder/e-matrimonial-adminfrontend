'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken } from '../../lib/auth';
import { getAdminProfile } from '../../lib/api';

interface SearchFilterSection {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  order: number;
  isActive: boolean;
  options: SearchFilterOption[];
}

interface SearchFilterOption {
  id: number;
  sectionId: number;
  value: string;
  displayName: string;
  order: number;
  isActive: boolean;
}

export default function SearchFiltersPage() {
  const [sections, setSections] = useState<SearchFilterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [editingSection, setEditingSection] = useState<SearchFilterSection | null>(null);
  const [editingOption, setEditingOption] = useState<SearchFilterOption | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
          fetchSearchFilters();
        } else {
          router.push('/');
        }
      } catch {
        router.push('/'); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  const fetchSearchFilters = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSections(data.sections);
      } else {
        setError('Failed to fetch search filters');
      }
    } catch (error) {
      setError('Error fetching search filters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (formData: FormData) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
          displayName: formData.get('displayName'),
          description: formData.get('description'),
          order: parseInt(formData.get('order') as string) || 0,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowSectionForm(false);
        setSuccess('Section created successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create section');
      }
    } catch {
      console.error('Failed to create section');
    }
  };

  const handleUpdateSection = async (formData: FormData) => {
    if (!editingSection) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
          displayName: formData.get('displayName'),
          description: formData.get('description'),
          order: parseInt(formData.get('order') as string) || 0,
          isActive: formData.get('isActive') === 'on', // Fix: Convert checkbox value to boolean
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEditingSection(null);
        setSuccess('Section updated successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update section');
      }
    } catch {
      console.error('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all its options.')) {
      return;
    }

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Section deleted successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete section');
      }
    } catch {
      console.error('Failed to delete section');
    }
  };

  const handleCreateOption = async (formData: FormData) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sectionId: parseInt(formData.get('sectionId') as string),
          value: formData.get('value'),
          displayName: formData.get('displayName'),
          order: parseInt(formData.get('order') as string) || 0,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowOptionForm(false);
        setSelectedSectionId(0);
        setSuccess('Option created successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create option');
      }
    } catch {
      console.error('Failed to create option');
    }
  };

  const handleUpdateOption = async (formData: FormData) => {
    if (!editingOption) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/options/${editingOption.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sectionId: parseInt(formData.get('sectionId') as string),
          value: formData.get('value'),
          displayName: formData.get('displayName'),
          order: parseInt(formData.get('order') as string) || 0,
          isActive: formData.get('isActive') === 'on', // Fix: Convert checkbox value to boolean
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEditingOption(null);
        setSuccess('Option updated successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update option');
      }
    } catch {
      console.error('Failed to update option');
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search-filters/options/${optionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Option deleted successfully');
        fetchSearchFilters();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete option');
      }
    } catch {
      console.error('Failed to delete option');
    }
  };

  // Helper function to get max order for sections
  const getMaxSectionOrder = () => {
    return sections.length;
  };

  // Helper function to get max order for new sections (allows placement anywhere in sequence)
  const getMaxNewSectionOrder = () => {
    return sections.length + 1;
  };

  // Helper function to get max order for options in a section
  const getMaxOptionOrder = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.options.length : 0;
  };

  // Helper function to get max order for new options (allows placement anywhere in sequence)
  const getMaxNewOptionOrder = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.options.length + 1 : 1;
  };

  // Helper function to get current order positions for display
  const getCurrentOrderPositions = (items: SearchFilterSection[] | SearchFilterOption[]) => {
    return items.map((item, index) => ({
      ...item,
      currentPosition: index + 1
    }));
  };

  if (!hasAccess && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600">Access Denied</div>
        <div className="text-sm text-gray-600 mt-2">Superadmin access required</div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Filter Management</h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowSectionForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Section
          </button>
          <button
            onClick={() => setShowOptionForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Option
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Sections and Options Display */}
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.displayName}
                  <span className="ml-2 text-sm text-gray-500">(Order: {section.order})</span>
                </h2>
                <p className="text-sm text-gray-700">{section.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {section.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => setEditingSection(section)}
                  className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {section.options.map((option) => (
                <div key={option.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate flex-1" title={option.displayName}>
                      {option.displayName}
                    </span>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${option.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {option.isActive ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-gray-500">Order: {option.order}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingOption(option)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOption(option.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New Section</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateSection(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Name (Internal)</label>
                  <input name="name" required className="w-full border rounded px-3 py-2 text-gray-900" placeholder="e.g., complexion" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Display Name</label>
                  <input name="displayName" required className="w-full border rounded px-3 py-2 text-gray-900" placeholder="e.g., Complexion & Appearance" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                  <textarea name="description" className="w-full border rounded px-3 py-2 text-gray-900" placeholder="Optional description" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    max={getMaxNewSectionOrder()}
                    defaultValue="1"
                    className="w-full border rounded px-3 py-2 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Range: 1 to {getMaxNewSectionOrder()}. This determines the display order of sections.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSectionForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Section</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateSection(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Name (Internal)</label>
                  <input name="name" required defaultValue={editingSection.name} className="w-full border rounded px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Display Name</label>
                  <input name="displayName" required defaultValue={editingSection.displayName} className="w-full border rounded px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                  <textarea name="description" defaultValue={editingSection.description} className="w-full border rounded px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    max={getMaxSectionOrder()}
                    defaultValue={editingSection.order}
                    className="w-full border rounded px-3 py-2 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Range: 1 to {getMaxSectionOrder()}. Current order: {editingSection.order}
                  </p>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={editingSection.isActive}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Form Modal */}
      {showOptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New Option</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateOption(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Section</label>
                  <select
                    name="sectionId"
                    required
                    className="w-full border rounded px-3 py-2 text-gray-900"
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(parseInt(e.target.value) || 0)}
                  >
                    <option value="">Select a section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Value (Internal)</label>
                  <input name="value" required className="w-full border rounded px-3 py-2 text-gray-900" placeholder="e.g., fair" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Display Name</label>
                  <input name="displayName" required className="w-full border rounded px-3 py-2 text-gray-900" placeholder="e.g., Fair" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    max={getMaxNewOptionOrder(selectedSectionId)}
                    defaultValue="1"
                    className="w-full border rounded px-3 py-2 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Range: 1 to {getMaxNewOptionOrder(selectedSectionId)}. This determines the display order within the section.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionForm(false);
                    setSelectedSectionId(0);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Edit Modal */}
      {editingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Option</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateOption(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Section</label>
                  <select name="sectionId" required defaultValue={editingOption.sectionId} className="w-full border rounded px-3 py-2 text-gray-900">
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Value (Internal)</label>
                  <input name="value" required defaultValue={editingOption.value} className="w-full border rounded px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Display Name</label>
                  <input name="displayName" required defaultValue={editingOption.displayName} className="w-full border rounded px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
                  <input
                    name="order"
                    type="number"
                    min="1"
                    max={getMaxOptionOrder(editingOption.sectionId)}
                    defaultValue={editingOption.order}
                    className="w-full border rounded px-3 py-2 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Range: 1 to {getMaxOptionOrder(editingOption.sectionId)}. Current order: {editingOption.order}
                  </p>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={editingOption.isActive}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingOption(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 