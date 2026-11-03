import { useToast } from '@freeappstore/sdk/ui';
import { useState } from 'react';
import type { AssessStore } from '../../hooks/useAssessStore';
import { exportAssessJson } from '../../services/assess/storage';
import type { LevelOverride } from '../../services/assess/types';

const OVERRIDES: { value: LevelOverride; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

/** Settings for the assessment trainer: timer, difficulty override and sound. */
export function AssessSettingsPanel({ store }: { store: AssessStore }) {
  const { settings, results, updateSettings, clearResults } = store;
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  const download = (): void => {
    const blob = new Blob([exportAssessJson(results, settings)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantlab-assessment-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.show('Assessment history exported', { variant: 'success' });
  };

  return (
    <>
      <h2 className="mt-8 text-base font-semibold">Assessment trainer</h2>
      <section className="card mt-3 divide-y divide-border">
        <label className="flex cursor-pointer items-center justify-between gap-4 p-4">
          <span>
            <span className="block font-medium">Timer</span>
            <span className="block text-sm text-muted">Turn it off for study mode: no countdown, and nothing ends a run early.</span>
          </span>
          <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--accent-deep)]" checked={settings.timerOn} onChange={(e) => updateSettings({ timerOn: e.target.checked })} />
        </label>

        <div className="p-4">
          <div className="font-medium" id="override-label">
            Difficulty override
          </div>
          <div className="text-sm text-muted">Auto ramps up through each test. The others keep it within an easy, medium or hard band.</div>
          <div className="seg mt-3 flex-wrap" role="group" aria-labelledby="override-label">
            {OVERRIDES.map((o) => (
              <button key={o.value} type="button" aria-pressed={settings.override === o.value} onClick={() => updateSettings({ override: o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 p-4">
          <span>
            <span className="block font-medium">Sound effects</span>
            <span className="block text-sm text-muted">Short tones for right and wrong answers. Off by default.</span>
          </span>
          <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--accent-deep)]" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
        </label>
      </section>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={download} disabled={results.length === 0}>
          Export assessment history
        </button>
        {confirming ? (
          <>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearResults();
                setConfirming(false);
                toast.show('Assessment history deleted', { variant: 'success' });
              }}
            >
              Yes, delete assessment history
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)} disabled={results.length === 0}>
            Delete assessment history
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {results.length} assessment {results.length === 1 ? 'run' : 'runs'} saved in this browser.
      </p>
    </>
  );
}
