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
  const [quickAddGroupId, setQuickAddGroupId] = useState<number | null>(null);
  const [quickAddWord, setQuickAddWord] = useState('');
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

  const handleQuickAddWord = async (groupId: number) => {
    if (!quickAddWord.trim()) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/synonyms/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: groupId,
          word: quickAddWord.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setQuickAddGroupId(null);
        setQuickAddWord('');
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Aliases</h1>
          <p className="text-gray-600 mt-1">
            Link related words so users find more relevant results
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGroupForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Word Group
          </button>
        </div>
      </div>

      {/* How It Works Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How Search Aliases Work</h3>
            <p className="text-sm text-blue-800 mb-2">
              When you group words together, <strong>searching for any word in the group will show results for all words</strong>.
            </p>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Example:</strong> Create a group with words: <code className="bg-blue-100 px-1.5 py-0.5 rounded">mumbai</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded">bombay</code></p>
              <p>→ When someone searches &quot;bombay&quot;, they&apos;ll also see profiles mentioning &quot;mumbai&quot;</p>
            </div>
          </div>
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No word groups yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create your first group to start linking related words
          </p>
          <button
            onClick={() => setShowGroupForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create First Group
          </button>
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
              <div className="flex flex-wrap gap-2 items-center">
                {group.words.map((word) => (
                  <div
                    key={word.id}
                    className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1.5 text-sm group/word hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-gray-800">{word.word}</span>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover/word:opacity-100 transition-opacity"
                      title="Remove word"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Quick Add Word Input */}
                {quickAddGroupId === group.id ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={quickAddWord}
                      onChange={(e) => setQuickAddWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddWord(group.id);
                        } else if (e.key === 'Escape') {
                          setQuickAddGroupId(null);
                          setQuickAddWord('');
                        }
                      }}
                      placeholder="Type word..."
                      className="border border-gray-300 rounded-full px-3 py-1 text-sm w-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleQuickAddWord(group.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Add word"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setQuickAddGroupId(null);
                        setQuickAddWord('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuickAddGroupId(group.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Word
                  </button>
                )}

                {group.words.length === 0 && quickAddGroupId !== group.id && (
                  <p className="text-gray-400 text-sm italic ml-2">Click &quot;Add Word&quot; to get started</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Create New Word Group</h3>
            <p className="text-sm text-gray-500 mb-4">Group related words that should return the same search results</p>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Group Name</label>
                  <input
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., City Names - Mumbai"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Use a descriptive name to easily identify this group later
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGroupForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Group
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
                    Turn off to temporarily disable this group without deleting it
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

