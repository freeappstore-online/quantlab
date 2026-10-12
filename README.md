# QuantLab

Free quant interview and exam prep in the browser. Short timed drills for the mental arithmetic, sequences, percentages and estimation that quant interviews and trading-firm online tests use. Scores, history and trend lines, all kept on your device.

- **Free.** No ads, no paywall, no account.
- **Private.** No cookies and no accounts. Scores never leave your device.
- **Offline.** Installable PWA that works without a connection after the first visit.
- **Open source.** MIT licensed.

A standalone [FreeAppStore](https://freeappstore.online) app, live at `quantlab.freeappstore.online` once published.

## Modes

| Mode | Format | Score |
| --- | --- | --- |
| Arithmetic Sprint | 120 s, open-ended, +, −, ×, ÷ | Correct answers |
| 80 in 8 | 80 mixed questions in 8 min, decimals and negatives on higher levels | Correct out of 80 |
| Number Sequences | 15 sequences in 5 min, exact next term, rule shown for every miss | Correct out of 15 |
| Percentages & Estimation | 20 questions in 5 min: percent change, reverse percentages, fractions, roots, compound growth, approximations | Correct out of 20 |

Each mode has Easy, Medium and Hard. Correct answers on exact-answer questions advance automatically (toggle in Settings). A wrong answer or skip scores 0 and costs nothing. Estimates are correct inside the tolerance shown under the question. The clock pauses while the tab is hidden.

History shows a score trend with a 5-session average and a worst-first table of the question types costing you points.

## Data stored in the browser

Two localStorage keys, written through `web/src/services/storage.ts`:

| Key | Contents |
| --- | --- |
| `quantlab:v1:sessions` | Last 300 runs: mode, difficulty, time, score, attempted, correct, average time per correct answer, best streak, per-category totals |
| `quantlab:v1:settings` | Auto-advance, keypad preference, last difficulty per mode |

Settings has Export as JSON and Delete history.

## Develop

Requires Node 22+ and pnpm 10.30+.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck
pnpm test         # question generator and scoring invariants
pnpm build        # type check, then production build with the PWA service worker
pnpm preview      # serve dist/ to test offline mode
fas check         # platform compliance
```

## Structure

```
web/src/
  App.tsx              SDK Shell, nav and screen routing
  index.css            platform tokens and fonts, plus QuantLab tokens and components
  types.ts             shared interfaces
  hooks/               useDrill (timer, input, scoring), useStore, useRoute (pathname routing)
  services/
    generators/        question generators for each mode
    modes.ts           mode configs and labels
    scoring.ts         correctness, session summary
    storage.ts         typed, validated localStorage adapter
  components/          Home, Drill, Keypad, Results, History, TrendChart, SettingsView, About, Link
```

## Ideas for later

- Optional leaderboard (needs the connected-app template; the app stays fully usable without it)
- Squares and cubes tables, fraction-decimal drills, expected-value and probability quick-fire
- A practice mode driven by the weak-spots table

## License

MIT
