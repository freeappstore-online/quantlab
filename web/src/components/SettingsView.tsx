import { PageHeader, useToast } from '@freeappstore/sdk/ui';
import { useState } from 'react';
import { exportJson } from '../services/storage';
import type { Store } from '../hooks/useStore';
import type { KeypadSetting } from '../types';

const KEYPAD_OPTIONS: { value: KeypadSetting; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'on', label: 'Always' },
  { value: 'off', label: 'Never' },
];

export function SettingsView({ store }: { store: Store }) {
  const { settings, sessions, updateSettings, clearData } = store;
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  const download = () => {
    const blob = new Blob([exportJson(sessions, settings)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantlab-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.show('History exported', { variant: 'success' });
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <PageHeader title="Settings" />

      <section className="card mt-5 divide-y divide-border">
        <label className="flex cursor-pointer items-center justify-between gap-4 p-4">
          <span>
            <span className="block font-medium">Auto-advance on correct answers</span>
            <span className="block text-sm text-muted">Moves on the moment a typed answer is right. Applies to exact-answer questions.</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-[var(--accent-ink)]"
            checked={settings.autoAdvance}
            onChange={(e) => updateSettings({ autoAdvance: e.target.checked })}
          />
        </label>

        <div className="p-4">
          <div className="font-medium" id="keypad-label">
            On-screen keypad
          </div>
          <div className="text-sm text-muted">Auto shows it on touch devices and hides it when you have a keyboard.</div>
          <div className="seg mt-3" role="group" aria-labelledby="keypad-label">
            {KEYPAD_OPTIONS.map((o) => (
              <button key={o.value} type="button" aria-pressed={settings.keypad === o.value} onClick={() => updateSettings({ keypad: o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <h2 className="mt-8 text-base font-semibold">Your data</h2>
      <p className="mt-1 text-sm text-muted">
        {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} saved in this browser. Nothing is sent anywhere.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={download} disabled={sessions.length === 0}>
          Export as JSON
        </button>
        {confirming ? (
          <>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearData();
                setConfirming(false);
                toast.show('History deleted', { variant: 'success' });
              }}
            >
              Yes, delete everything
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)} disabled={sessions.length === 0}>
            Delete history
          </button>
        )}
      </div>
    </div>
  );
}
