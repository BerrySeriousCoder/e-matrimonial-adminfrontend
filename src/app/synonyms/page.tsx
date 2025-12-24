'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken } from '../../lib/auth';
import { getAdminProfile } from '../../lib/api';

interface SynonymWord {
  id: number;
  groupId: number;
  word: string;
  createdAt: string;
}

interface SynonymGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  words: SynonymWord[];
}

export default function SynonymsPage() {
  const [groups, setGroups] = useState<SynonymGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SynonymGroup | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showWordForm, setShowWordForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
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
          fetchSynonyms();
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  const fetchSynonyms = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      } else {
        setError('Failed to fetch synonyms');
      }
    } catch (error) {
      setError('Error fetching synonyms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (formData: FormData) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowGroupForm(false);
        setSuccess('Synonym group created successfully');
        fetchSynonyms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to create group');
      }
    } catch {
      setError('Failed to create group');
    }
  };

  const handleUpdateGroup = async (formData: FormData) => {
    if (!editingGroup) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
          isActive: formData.get('isActive') === 'on',
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEditingGroup(null);
        setSuccess('Synonym group updated successfully');
        fetchSynonyms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update group');
      }
    } catch {
      setError('Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this synonym group? This will also delete all its words.')) {
      return;
    }

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Synonym group deleted successfully');
        fetchSynonyms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete group');
      }
    } catch {
      setError('Failed to delete group');
    }
  };

  const handleAddWord = async (formData: FormData) => {
    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: parseInt(formData.get('groupId') as string),
          word: formData.get('word'),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowWordForm(false);
        setSelectedGroupId(0);
        setSuccess('Word added successfully');
        fetchSynonyms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add word');
      }
    } catch {
      setError('Failed to add word');
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!confirm('Are you sure you want to remove this word?')) {
      return;
    }

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/words/${wordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Word removed successfully');
        fetchSynonyms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to remove word');
      }
    } catch {
      setError('Failed to remove word');
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Synonym Dictionary</h1>
          <p className="text-gray-600 mt-1">
            Manage word synonyms for enhanced search. When users search for any word in a group, results for all words in that group will be shown.
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => setShowGroupForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Group
          </button>
          <button
            onClick={() => setShowWordForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Word
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

      {/* Groups and Words Display */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No synonym groups yet. Create one to get started!</p>
          <p className="text-sm text-gray-500 mt-2">
            Example: Create a group &quot;Mumbai&quot; and add words: mumbai, bombay
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {group.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {group.words.length} word{group.words.length !== 1 ? 's' : ''} in this group
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Words in this group */}
              <div className="flex flex-wrap gap-2">
                {group.words.map((word) => (
                  <div
                    key={word.id}
                    className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                  >
                    <span className="text-gray-800">{word.word}</span>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="ml-2 text-gray-500 hover:text-red-600"
                      title="Remove word"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {group.words.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No words in this group yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Synonym Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Group Name</label>
                  <input
                    name="name"
                    required
                    className="w-full border rounded px-3 py-2 text-gray-900"
                    placeholder="e.g., Mumbai Aliases"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A descriptive name for this group of synonyms
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGroupForm(false)}
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

      {/* Group Edit Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Synonym Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateGroup(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Group Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingGroup.name}
                    className="w-full border rounded px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={editingGroup.isActive}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive groups will not be used for search expansion
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
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

      {/* Word Form Modal */}
      {showWordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Word to Group</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddWord(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Select Group</label>
                  <select
                    name="groupId"
                    required
                    className="w-full border rounded px-3 py-2 text-gray-900"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(parseInt(e.target.value) || 0)}
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Word</label>
                  <input
                    name="word"
                    required
                    className="w-full border rounded px-3 py-2 text-gray-900"
                    placeholder="e.g., bombay"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Words are stored in lowercase. Each word can only belong to one group.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowWordForm(false);
                    setSelectedGroupId(0);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Add Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

