export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-headline-lg text-on-surface">Platform Settings</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Configure SSH templates, platform defaults, and critical session policies.</p>
      </header>

      <section className="panel overflow-hidden">
        <div className="border-b border-outline-variant px-5 py-4">
          <h2 className="font-headline text-headline-md text-on-surface">SSH Configuration</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-outline-variant bg-surface-container-high text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-5 py-4">Hostname</th>
                <th className="px-5 py-4">Port</th>
                <th className="px-5 py-4">Username</th>
                <th className="px-5 py-4">Auth</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['lab-node-01.internal', '22', 'student', 'Password'],
                ['lab-node-02.internal', '2222', 'trainer', 'SSH Key'],
              ].map(([host, port, user, auth]) => (
                <tr key={host} className="border-b border-outline-variant/60">
                  <td className="px-5 py-4 font-code text-code-md text-on-surface">{host}</td>
                  <td className="px-5 py-4 font-code text-code-md text-on-surface">{port}</td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">{user}</td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">{auth}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="button-secondary min-h-9 px-3 text-xs">Edit</button>
                      <button className="button-secondary min-h-9 px-3 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-headline text-headline-md text-on-surface">Platform Config</h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Session timeout</label>
              <input className="field" defaultValue="8 hours" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Max concurrent sessions</label>
              <input className="field" defaultValue="12" />
            </div>
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">Default lab server</label>
              <input className="field" defaultValue="lab-node-01.internal" />
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="font-headline text-headline-md text-on-surface">Danger Zone</h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">Use these controls carefully. These actions affect the entire active learning environment.</p>
          <div className="mt-6 rounded-lg border border-error/30 bg-error-container/10 p-4">
            <div className="font-body text-body-md text-on-surface">Reset All Sessions</div>
            <p className="mt-2 text-body-sm text-on-surface-variant">Disconnect all active SSH sessions and clear transient terminal state.</p>
            <button className="mt-4 rounded-sm border border-error/40 px-4 py-2 font-code text-code-md text-error">Reset Sessions</button>
          </div>
        </div>
      </section>
    </div>
  );
}
