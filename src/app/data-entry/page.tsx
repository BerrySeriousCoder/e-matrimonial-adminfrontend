'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken } from '../../lib/auth';
import { getAdminProfile, Post } from '../../lib/api';
import { useDataEntryPosts, useCreateDataEntryPost, useUpdateDataEntryPost } from '../../hooks/useAdminQueries';

export default function DataEntryPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [query, setQuery] = useState<{ status?: string; search?: string; page?: number }>({ page: 1 });
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(50); // percent
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }
    (async () => {
      const profile = await getAdminProfile(token);
      if (profile?.success && profile.admin.role === 'data_entry') {
        setAuthorized(true);
      } else {
        router.push('/');
      }
    })();
  }, [router]);

  const { data, isLoading } = useDataEntryPosts(query);
  const createMutation = useCreateDataEntryPost();
  const updateMutation = useUpdateDataEntryPost();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, percentage));
      setLeftWidth(clamped);
    };
    const onMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  if (!authorized) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Data Entry</h1>
      <div ref={containerRef} className="relative w-full" style={{ height: 'min(72vh, 800px)' }}>
        <div className="h-full flex" style={{ userSelect: isResizing ? 'none' : 'auto' }}>
          {/* Left editor */}
          <div style={{ width: `${leftWidth}%` }} className="h-full bg-white border rounded-md p-4 overflow-auto">
            <PostEditor
              key={editingPost?.id || 'new'}
              initial={editingPost || null}
              onSubmit={async (payload: CreatePayload | UpdatePayload) => {
                const token = getAdminToken();
                if (!token) return;
                if (editingPost) {
                  await updateMutation.mutateAsync({ postId: editingPost.id, data: payload });
                  setEditingPost(null);
                } else {
                  await createMutation.mutateAsync(payload as CreatePayload);
                }
              }}
            />
          </div>
          {/* Divider */}
          <div
            ref={dividerRef}
            onMouseDown={handleMouseDown}
            className="h-full w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
            style={{ touchAction: 'none' }}
          />
          {/* Right table */}
          <div style={{ width: `${100 - leftWidth}%` }} className="h-full bg-white border rounded-md p-4 overflow-auto">
            <div className="flex items-center gap-3 mb-4">
              <input
                placeholder="Search email or text"
                className="border rounded px-3 py-2 text-sm w-full text-black"
                value={query.search || ''}
                onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
              />
              <select
                className="border rounded px-2 py-2 text-sm text-black"
                value={query.status || 'all'}
                onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value, page: 1 }))}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="edited">Edited</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="deleted">Deleted</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-gray-700">
                    <th className="py-2 pr-2 font-medium">Email</th>
                    <th className="py-2 pr-2 font-medium">Content</th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 pr-2 font-medium">Created</th>
                    <th className="py-2 pr-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="py-4 text-gray-700" colSpan={5}>Loading...</td></tr>
                  ) : (
                    (data?.posts || []).map((p: Post) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2 pr-2 whitespace-nowrap text-black">{p.email}</td>
                        <td className="py-2 pr-2 max-w-md truncate text-black">{p.content}</td>
                        <td className="py-2 pr-2"><StatusBadge status={p.status} /></td>
                        <td className="py-2 pr-2 whitespace-nowrap text-black">{new Date(p.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-2">
                          <button className="text-blue-600 hover:underline" onClick={() => setEditingPost(p)}>Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Post['status'] }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    edited: 'bg-orange-100 text-orange-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
    deleted: 'bg-red-100 text-red-800',
    expired: 'bg-gray-200 text-gray-700',
    payment_pending: 'bg-blue-100 text-blue-800',
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

type CreatePayload = { email: string; content: string; lookingFor: 'bride' | 'groom'; duration: 14 | 21 | 28; fontSize: 'default' | 'large'; bgColor: string; icon: string | null };
type UpdatePayload = { content: string; lookingFor?: 'bride' | 'groom'; fontSize: 'default' | 'large'; bgColor: string; icon?: string | null };

function PostEditor({ initial, onSubmit }: { initial: Post | null; onSubmit: (data: CreatePayload | UpdatePayload) => Promise<void> }) {
  const [email, setEmail] = useState(initial?.email || '');
  const [content, setContent] = useState(initial?.content || '');
  const [lookingFor, setLookingFor] = useState<'bride' | 'groom' | ''>((initial?.lookingFor as 'bride' | 'groom') || '');
  const [duration, setDuration] = useState<14 | 21 | 28>(14); // Updated: 2, 3, 4 weeks
  const [fontSize, setFontSize] = useState<'default' | 'large'>(initial?.fontSize || 'default'); // Updated: removed 'medium'
  const [bgColor, setBgColor] = useState<string>(initial?.bgColor || '#ffffff');
  const [icon, setIcon] = useState<string | null>(initial?.icon || null);
  const [currentCharacters, setCurrentCharacters] = useState<number>(initial?.content?.length || 0);

  useEffect(() => {
    if (initial) {
      setEmail(initial.email || '');
      setContent(initial.content || '');
      setLookingFor((initial.lookingFor as 'bride' | 'groom') || '');
      setFontSize(initial.fontSize || 'default');
      setBgColor(initial.bgColor || '#ffffff');
      setIcon(initial.icon || null);
      setCurrentCharacters(initial.content?.length || 0);
    }
  }, [initial]);

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
    { name: 'Teacher', value: 'teacher' }
  ];

  useEffect(() => { setCurrentCharacters(content.length); }, [content]);

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (initial) {
            await onSubmit({ content, lookingFor: (lookingFor || undefined) as 'bride' | 'groom' | undefined, fontSize, bgColor, icon });
          } else {
            await onSubmit({ email, content, lookingFor: lookingFor as 'bride' | 'groom', duration, fontSize, bgColor, icon });
            setEmail(''); setContent(''); setCurrentCharacters(0);
          }
        }}
      >
        {!initial && (
          <div className="border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
              <h4 className="font-bold text-sm uppercase tracking-wide text-gray-700">Customer Email</h4>
            </div>
            <div className="p-4">
              <input 
                className="w-full border rounded px-3 py-2 text-sm text-black" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Enter customer email address"
              />
            </div>
          </div>
        )}

        <div className="border border-gray-300">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h4 className="font-bold text-sm uppercase tracking-wide text-gray-700">I am looking for</h4>
          </div>
          <div className="p-4">
            <select 
              className="w-full border rounded px-3 py-2 text-sm text-black" 
              value={lookingFor} 
              onChange={(e) => setLookingFor(e.target.value as 'bride' | 'groom' | '')} 
              required={!initial}
            >
              <option value="">Select</option>
              <option value="bride">Bride</option>
              <option value="groom">Groom</option>
            </select>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="border border-gray-300">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h4 className="font-bold text-sm uppercase tracking-wide text-gray-700">Add-ons</h4>
          </div>
          <div className="p-4">
            {/* First row: Duration and Font Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration {!initial && <span className="text-red-500">*</span>}
                </label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm text-black" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value) as 14 | 21 | 28)} 
                  required={!initial}
                >
                  <option value={14}>2 weeks</option>
                  <option value={21}>3 weeks</option>
                  <option value={28}>4 weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm text-black" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(e.target.value as 'default' | 'large')}
                >
                  <option value="default">Default</option>
                  <option value="large">Large (+20%)</option>
                </select>
              </div>
            </div>
            
            {/* Second row: Highlight Color and Icon Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlight Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {bgColorOptions.map((c) => (
                    <button 
                      key={c.value} 
                      type="button" 
                      onClick={() => setBgColor(c.value)} 
                      className={`h-10 border transition-colors ${
                        bgColor === c.value 
                          ? 'border-black ring-2 ring-blue-500' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`} 
                      style={{ backgroundColor: c.value }} 
                      title={c.name} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {bgColorOptions.find(b => b.value === bgColor)?.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (+₹100)
                </label>
                <div className="relative">
                  <select 
                    className="w-full border rounded px-3 py-2 text-sm text-black appearance-none bg-white" 
                    value={icon || ''} 
                    onChange={(e) => setIcon(e.target.value || null)} 
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value || 'none'} value={option.value || ''}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {icon && (
                      <img 
                        src={`/icon/${icon}.svg`} 
                        alt={`${icon} icon`}
                        className="w-5 h-5"
                      />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {iconOptions.find(i => i.value === icon)?.name || 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-300">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm uppercase tracking-wide text-gray-700">Ad Content</h4>
              <span className={`text-xs font-medium ${
                currentCharacters > 200 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {currentCharacters} characters
                {currentCharacters > 200 && (
                  <span className="text-gray-500"> (200 free + {currentCharacters - 200} paid)</span>
                )}
              </span>
            </div>
          </div>
          <div className="p-4">
            <textarea 
              className={`w-full border rounded px-3 py-2 text-sm text-black min-h-[120px] ${
                currentCharacters > 200 
                  ? 'border-red-300 focus:border-red-600' 
                  : 'border-gray-300 focus:border-black'
              }`} 
              rows={6} 
              value={content} 
              onChange={(e) => {
                setContent(e.target.value);
                setCurrentCharacters(e.target.value.length);
              }} 
              required 
              placeholder="Enter the matrimonial advertisement content..."
            />
            {currentCharacters > 200 && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Characters beyond 200 will be charged at ₹500 per 20 characters
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {initial ? 'Save Changes' : 'Create Post'}
          </button>
          {initial && (
            <button 
              type="button" 
              className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors" 
              onClick={() => window.location.reload()}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


