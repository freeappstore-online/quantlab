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

## Game-Based Assessment Trainer

A second module at `/assess` with seven original practice games: Block Fit, Typo Hunt, Bubble Order, Sum Compare, Mirror Turn, Shortest Route and Workplace Judgement (30 scenarios plus a work-style questionnaire). Each has an intro, an untimed two-round tutorial, a timed test with rising difficulty, a results screen with a personal-best comparison and a tip, and a history chart. Full Assessment runs them all back to back. Settings: study mode (no timers), difficulty override, sound (off by default).

Round types vary within each game: Block Fit has classic grids, fixed silhouettes and trays with a spare piece (14 rounds); Typo Hunt has full, spelling-focus, wording-and-punctuation and careful-read passages (8 passages); Bubble Order mixes ascending and descending ordering with stream rounds where equations (all four operations) keep arriving, faster and in bigger waves, and you pop those equal to, below or above a target that changes every round; Workplace Judgement has 60 scenarios, including technology-workplace ones on learning from feedback, inclusion, customers, cross-team work, initiative and responsible data and AI, and a 54-statement work-style bank.

Puzzles are generated from a seeded RNG and checked for solvability. Add `?seed=123` to a game URL for a reproducible run. Colours come from a colour-blind-safe palette and every state also has a letter or symbol. Code lives in `web/src/services/assess/` (generators, banks, tests) and `web/src/components/assess/`.

## Data stored in the browser

Four localStorage keys, written through `web/src/services/storage.ts` and `web/src/services/assess/storage.ts`:

| Key | Contents |
| --- | --- |
| `quantlab:v1:sessions` | Last 300 runs: mode, difficulty, time, score, attempted, correct, average time per correct answer, best streak, per-category totals |
| `quantlab:v1:settings` | Auto-advance, keypad preference, last difficulty per mode |
| `quantlab:v1:assess-results` | Assessment results: game, score, accuracy, average time per item |
| `quantlab:v1:assess-settings` | Study mode, difficulty override, sound |

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
  services/assess/     assessment generators, text and scenario banks, storage
  components/assess/   assessment hub, game frame, the seven games
  components/          Home, Drill, Keypad, Results, History, TrendChart, SettingsView, About, Link
```

## Ideas for later

- Optional leaderboard (needs the connected-app template; the app stays fully usable without it)
- Squares and cubes tables, fraction-decimal drills, expected-value and probability quick-fire
- A practice mode driven by the weak-spots table

## License

MIT
