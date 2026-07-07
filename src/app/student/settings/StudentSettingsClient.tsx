'use client';

import { useState } from 'react';
import { Icon } from '@/components/vn-ui';

type Tab = 'Profile' | 'Account' | 'Notifications' | 'Security';

type Props = {
  initialName: string;
  initialUsername: string;
};

export default function StudentSettingsClient({ initialName, initialUsername }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [saved, setSaved] = useState(false);

  const tabs: Tab[] = ['Profile', 'Account', 'Notifications', 'Security'];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-[820px] space-y-6">
      <h1 className="font-headline text-[28px] font-bold" style={{ color: '#111827' }}>
        Settings
      </h1>

      {/* Tab bar */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-5 py-3 text-[14px] font-medium transition-colors"
            style={{
              color: activeTab === tab ? 'var(--green-500)' : '#6B7280',
              borderBottom: activeTab === tab ? '2px solid var(--green-500)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'Profile' && (
        <div className="space-y-5">
          {/* Avatar upload card */}
          <div
            className="card flex flex-col items-center gap-4 py-8"
          >
            <div className="relative">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-[32px] font-bold"
                style={{ background: 'var(--green-500)', color: '#fff' }}
              >
                {(name || initialUsername)[0]?.toUpperCase() || 'U'}
              </div>
              <button
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--green-500)', color: '#fff', border: '2px solid white' }}
              >
                <Icon name="upload" className="text-[14px]" />
              </button>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '7px 20px' }}
            >
              Change Photo
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>
              Full Name
            </label>
            <input
              type="text"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              className="field"
              defaultValue={`${initialUsername}@example.com`}
              placeholder="your@email.com"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>
              Bio
            </label>
            <textarea
              className="field"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          {/* Notification Preferences (inline in Profile tab) */}
          <div className="card p-5">
            <h3 className="font-headline text-[15px] font-semibold mb-4" style={{ color: '#111827' }}>
              Notification Preferences
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Email', state: emailNotif, set: setEmailNotif },
                { label: 'Push', state: pushNotif, set: setPushNotif },
                { label: 'SMS', state: smsNotif, set: setSmsNotif },
              ].map(({ label, state, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state}
                    onClick={() => set(!state)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                    style={{ background: state ? 'var(--green-500)' : '#D1D5DB' }}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: state ? 'translateX(24px)' : 'translateX(4px)' }}
                    />
                  </button>
                  <span className="text-[14px]" style={{ color: '#374151' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'Account' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-headline text-[16px] font-semibold" style={{ color: '#111827' }}>Account Information</h3>
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>Username</label>
            <input type="text" className="field" defaultValue={initialUsername} readOnly style={{ background: '#F9FAFB', cursor: 'default' }} />
          </div>
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>Role</label>
            <input type="text" className="field" value="Student" readOnly style={{ background: '#F9FAFB', cursor: 'default' }} />
          </div>
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <h4 className="font-semibold text-[14px] mb-3" style={{ color: '#DC2626' }}>Danger Zone</h4>
            <button className="btn-secondary text-red-600 border-red-200 hover:border-red-400" style={{ fontSize: '13px' }}>
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-headline text-[16px] font-semibold" style={{ color: '#111827' }}>Notification Preferences</h3>
          {[
            { label: 'Email Notifications', desc: 'Receive lab updates via email', state: emailNotif, set: setEmailNotif },
            { label: 'Push Notifications', desc: 'Browser push notifications', state: pushNotif, set: setPushNotif },
            { label: 'SMS Notifications', desc: 'Text message alerts', state: smsNotif, set: setSmsNotif },
          ].map(({ label, desc, state, set }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="text-[14px] font-medium" style={{ color: '#111827' }}>{label}</div>
                <div className="text-[12px]" style={{ color: '#9CA3AF' }}>{desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state}
                onClick={() => set(!state)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                style={{ background: state ? 'var(--green-500)' : '#D1D5DB' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: state ? 'translateX(24px)' : 'translateX(4px)' }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'Security' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-headline text-[16px] font-semibold" style={{ color: '#111827' }}>Change Password</h3>
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>Current Password</label>
            <input type="password" className="field" placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>New Password</label>
            <input type="password" className="field" placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block font-code text-[12px] font-semibold" style={{ color: '#374151' }}>Confirm New Password</label>
            <input type="password" className="field" placeholder="••••••••" />
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{ fontSize: '14px', padding: '10px 28px', minWidth: '140px' }}
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
