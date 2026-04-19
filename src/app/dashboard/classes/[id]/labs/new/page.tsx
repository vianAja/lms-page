'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownViewer from '@/components/MarkdownViewer';

export default function NewLabPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = Number(params.id);

  const [csrfToken, setCsrfToken] = useState('');
  const [labKey, setLabKey] = useState('');
  const [title, setTitle] = useState('');
  const [orderNum, setOrderNum] = useState(1);
  const [content, setContent] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.csrf_token || '');
      } catch {
        setError('Unable to initialize CSRF token. Please refresh the page.');
      }
    };

    fetchCsrf();
  }, []);

  const canSubmit = useMemo(() => {
    return Number.isInteger(classId) && !!labKey.trim() && !!title.trim() && !!content.trim() && !loading;
  }, [classId, labKey, title, content, loading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          class_id: classId,
          lab_key: labKey.trim(),
          title: title.trim(),
          content,
          order_num: orderNum,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to create lab' }));
        setError(data.message || 'Failed to create lab');
        return;
      }

      router.push(`/dashboard/classes/${classId}`);
      router.refresh();
    } catch {
      setError('Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#333]">Create New Lab</h1>
        <p className="text-sm text-[#828282] mt-1">Add a new markdown lab to this class.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-1">Lab Key</label>
            <input
              value={labKey}
              onChange={(e) => setLabKey(e.target.value)}
              placeholder="e.g. 1-1"
              className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
            />
            <p className="text-xs text-[#828282] mt-1">Must be unique across all labs</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#333] mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lab title"
              className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
            />
          </div>
        </div>

        <div className="w-full md:w-60">
          <label className="block text-sm font-semibold text-[#333] mb-1">Order Number</label>
          <input
            type="number"
            value={orderNum}
            onChange={(e) => setOrderNum(Number(e.target.value))}
            className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#333]">Content (Markdown)</label>
          <button
            type="button"
            onClick={() => setLivePreview((prev) => !prev)}
            className="text-sm font-semibold text-[#2D9CDB] hover:text-[#2789C2]"
          >
            {livePreview ? 'Hide Live Preview' : 'Show Live Preview'}
          </button>
        </div>

        {!livePreview && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-[#E0E6ED] px-3 py-3 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB] font-mono min-h-[400px]"
            placeholder="# Lab Title\n\nWrite lab markdown content here..."
          />
        )}

        {livePreview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[420px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-[#E0E6ED] px-3 py-3 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB] font-mono min-h-[400px]"
              placeholder="# Lab Title\n\nWrite lab markdown content here..."
            />
            <div className="rounded-lg border border-[#E0E6ED] bg-zinc-950 p-4 min-h-[400px] overflow-hidden">
              <MarkdownViewer content={content || '## Live Preview\n\nStart typing markdown on the left...'} />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/classes/${classId}`)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#E0E6ED] text-[#828282] hover:bg-[#F9FBFC]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Create Lab'}
          </button>
        </div>
      </form>
    </div>
  );
}
