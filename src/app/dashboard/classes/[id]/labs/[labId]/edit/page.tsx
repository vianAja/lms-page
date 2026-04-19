'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownViewer from '@/components/MarkdownViewer';

type LabDetail = {
  id: number;
  title: string;
  content: string;
  order_num: number;
  lab_key: string;
};

export default function EditLabPage() {
  const params = useParams<{ id: string; labId: string }>();
  const router = useRouter();

  const classId = Number(params.id);
  const labId = Number(params.labId);

  const [csrfToken, setCsrfToken] = useState('');
  const [title, setTitle] = useState('');
  const [orderNum, setOrderNum] = useState(1);
  const [content, setContent] = useState('');
  const [livePreview, setLivePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLab, setLoadingLab] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [labResponse, csrfResponse] = await Promise.all([
          fetch(`/api/labs/${labId}`),
          fetch('/api/csrf'),
        ]);

        if (!labResponse.ok) {
          const payload = await labResponse.json().catch(() => ({ message: 'Failed to load lab data' }));
          setError(payload.message || 'Failed to load lab data');
          setLoadingLab(false);
          return;
        }

        const labData = (await labResponse.json()) as LabDetail;
        setTitle(labData.title || '');
        setOrderNum(Number(labData.order_num ?? 1));
        setContent(labData.content || '');

        const csrfData = await csrfResponse.json();
        setCsrfToken(csrfData.csrf_token || '');
      } catch {
        setError('Failed to initialize editor');
      } finally {
        setLoadingLab(false);
      }
    };

    if (Number.isInteger(labId)) {
      init();
    } else {
      setError('Invalid lab id');
      setLoadingLab(false);
    }
  }, [labId]);

  const canSubmit = useMemo(() => {
    return Number.isInteger(classId) && Number.isInteger(labId) && !!title.trim() && !!content.trim() && !loading;
  }, [classId, labId, title, content, loading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          order_num: orderNum,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to update lab' }));
        setError(data.message || 'Failed to update lab');
        return;
      }

      router.push(`/dashboard/classes/${classId}`);
      router.refresh();
    } catch {
      setError('Failed to update lab');
    } finally {
      setLoading(false);
    }
  };

  if (loadingLab) {
    return (
      <div className="w-full bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-8 text-[#828282]">
        Loading lab editor...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#333]">Edit Lab</h1>
        <p className="text-sm text-[#828282] mt-1">Update metadata and markdown content for this lab.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lab title"
              className="w-full rounded-lg border border-[#E0E6ED] px-3 py-2.5 text-sm text-[#333] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
            />
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
            {loading ? 'Saving...' : 'Update Lab'}
          </button>
        </div>
      </form>
    </div>
  );
}
