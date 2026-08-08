'use client';

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/vn-ui';

type VmInfo = {
  topic: string;
  pid: string;
  socket: string;
  guestIp: string;
};

const TOPIC_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  linux: { label: 'Linux Lab', color: '#22c55e', icon: 'terminal' },
  docker: { label: 'Docker Lab', color: '#3b82f6', icon: 'deployed_code' },
};

export default function VmMonitorPage() {
  const [vms, setVms] = useState<VmInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoppingTopic, setStoppingTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchVms = useCallback(async () => {
    try {
      const res = await fetch('/api/vmm/list');
      if (!res.ok) throw new Error('Failed to fetch VMs');
      const data = await res.json() as { vms: VmInfo[] };
      setVms(data.vms || []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch VMs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVms();
    const interval = setInterval(() => { void fetchVms(); }, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchVms]);

  const handleStop = async (topicKey: string) => {
    setStoppingTopic(topicKey);
    try {
      await fetch('/api/vmm/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicKey }),
      });
      await fetchVms();
    } catch {
      setError('Failed to stop VM');
    } finally {
      setStoppingTopic(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold" style={{ color: '#111827' }}>
            VM Monitor
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#6b7280' }}>
            Firecracker microVM instances — shared across all active users
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="font-code text-[11px]" style={{ color: '#9ca3af' }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            id="btn-refresh-vms"
            onClick={() => { void fetchVms(); }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all hover:shadow-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: '#374151' }}
          >
            <Icon name="refresh" className="text-[15px]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
        >
          <Icon name="error" className="text-[16px] shrink-0" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Running VMs
          </div>
          <div className="mt-1 text-3xl font-bold font-code" style={{ color: '#111827' }}>
            {loading ? '—' : vms.length}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Topics Covered
          </div>
          <div className="mt-1 text-3xl font-bold font-code" style={{ color: '#111827' }}>
            {loading ? '—' : [...new Set(vms.map((v) => v.topic))].length}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Sharing Model
          </div>
          <div className="mt-1 text-[13px] font-semibold" style={{ color: '#22c55e' }}>
            Shared per Topic
          </div>
          <div className="text-[11px]" style={{ color: '#9ca3af' }}>
            1 VM per topic key
          </div>
        </div>
      </div>

      {/* VM List */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {/* Table Header */}
        <div
          className="grid grid-cols-[1fr_120px_140px_90px_80px] gap-3 px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', color: '#9ca3af' }}
        >
          <span>Topic / Label</span>
          <span>PID</span>
          <span>Guest IP</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center" style={{ color: '#9ca3af' }}>
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
            <p className="text-sm">Loading VM status...</p>
          </div>
        ) : vms.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: '#f3f4f6' }}
            >
              <Icon name="cloud_off" className="text-[24px]" style={{ color: '#9ca3af' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>
              No microVMs running
            </p>
            <p className="mt-1 text-[12px]" style={{ color: '#9ca3af' }}>
              VMs start automatically when a student opens a lab
            </p>
          </div>
        ) : (
          <div>
            {vms.map((vm, idx) => {
              const meta = TOPIC_LABELS[vm.topic] ?? { label: vm.topic, color: '#6b7280', icon: 'memory' };
              const isStopping = stoppingTopic === vm.topic;
              return (
                <div
                  key={`${vm.topic}-${idx}`}
                  className="grid grid-cols-[1fr_120px_140px_90px_80px] items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
                  style={{ borderBottom: idx < vms.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  {/* Topic */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${meta.color}18` }}
                    >
                      <Icon name={meta.icon} className="text-[16px]" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: '#111827' }}>
                        {meta.label}
                      </div>
                      <div className="font-code text-[11px]" style={{ color: '#9ca3af' }}>
                        {vm.socket}
                      </div>
                    </div>
                  </div>

                  {/* PID */}
                  <span className="font-code text-[12px]" style={{ color: '#374151' }}>
                    {vm.pid}
                  </span>

                  {/* Guest IP */}
                  <span className="font-code text-[12px]" style={{ color: '#374151' }}>
                    {vm.guestIp}
                  </span>

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e80' }}
                    />
                    <span className="text-[12px] font-medium" style={{ color: '#22c55e' }}>
                      Running
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      id={`btn-stop-vm-${vm.topic}`}
                      onClick={() => { void handleStop(vm.topic); }}
                      disabled={isStopping}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: '#6b7280' }}
                    >
                      {isStopping ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-gray-600" />
                      ) : (
                        <Icon name="stop_circle" className="text-[13px]" />
                      )}
                      Stop
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div
        className="rounded-xl border p-4 text-[13px]"
        style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}
      >
        <div className="flex items-start gap-2">
          <Icon name="info" className="text-[16px] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Shared VM Schema</p>
            <p className="mt-0.5 text-[12px]" style={{ color: '#15803d' }}>
              Each topic (e.g., <code>linux</code>, <code>docker</code>) has one Firecracker microVM.
              All users working on the same topic connect to the same VM instance —
              VMs are auto-started on first lab access and remain running for all concurrent users.
              Stopping a VM will disconnect all active sessions for that topic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
