import { PageHeader } from '@freeappstore/sdk/ui';

export function About() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <PageHeader
        title="About QuantLab"
        description="Free practice for the quick-fire maths that quant interviews and trading-firm online tests lean on. Part of FreeAppStore: free means no ads, no paywall, no tracking."
      />

      <h2 className="mt-6 text-base font-semibold">How scoring works</h2>
      <ul className="mt-2 space-y-2 text-sm">
        <li>
          <strong>Score</strong> is the number of correct answers. A wrong answer or a skip scores nothing and costs nothing, so skip anything you are stuck on.
        </li>
        <li>
          <strong>Accuracy</strong> is correct answers divided by questions attempted.
        </li>
        <li>
          <strong>Avg per correct</strong> is your mean time on the questions you got right.
        </li>
        <li>
          <strong>Estimates</strong> count as correct inside the tolerance shown under the question, for example within 5%.
        </li>
        <li>
          <strong>Trend lines</strong> compare runs at the same mode, so use the difficulty filter when you move up a level.
        </li>
        <li>The clock pauses while the tab is hidden.</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold">What is stored</h2>
      <p className="mt-2 text-sm">
        QuantLab keeps two entries in this browser's localStorage: <code className="font-mono">quantlab:v1:sessions</code> (score, accuracy, timing and per-category totals for your last 300 runs) and{' '}
        <code className="font-mono">quantlab:v1:settings</code> (your preferences). QuantLab sets no cookies, has no accounts and never sends your scores anywhere. Everything works offline after the first visit. Export or delete your history any time in Settings.
      </p>

      <h2 className="mt-6 text-base font-semibold">Open source</h2>
      <p className="mt-2 text-sm">
        Built for{' '}
        <a href="https://freeappstore.online" className="underline">
          freeappstore.online
        </a>
        . QuantLab is MIT licensed. It is built with React, TypeScript, Vite and Tailwind CSS, installs as a PWA and works offline after the first visit.
      </p>
    </div>
  );
}
