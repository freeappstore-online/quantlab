# QuantLab

Free quant interview and exam prep: timed mental-maths drills (Arithmetic Sprint, 80 in 8, Number Sequences, Percentages & Estimation) with scores, history and trend lines. A standalone FreeAppStore app: localStorage only, no sign-in.

- Subdomain: `quantlab.freeappstore.online`
- Dev: `pnpm install && pnpm dev`
- Check: `pnpm typecheck && pnpm test && fas check`
- Build: `pnpm build`
- Deploy: `git push upstream main` (GitHub Actions)

Platform conventions (Shell, brand, mobile, PWA, SDK): read https://raw.githubusercontent.com/freeappstore-online/freeappstore/main/SKILLS.md before changing anything platform-related. See also https://freeappstore.online/skills.md.

## Repo-specific notes

- Screens: `web/src/components/`. Routes are pathname-based (`web/src/hooks/useRoute.ts`): `/`, `/play/:mode`, `/history[/:mode]`, `/settings`, `/about`.
- Question generators: `web/src/services/generators/`. Invariants are tested in `web/src/services/generators.test.ts`. Run `pnpm test` after touching a generator.
- Stored data (localStorage): `quantlab:v1:sessions` and `quantlab:v1:settings`, typed and validated in `web/src/services/storage.ts`. Bump the version in the key if the shape changes.
- The drill screen (`components/Drill.tsx`) must fit without scrolling from 320x568 portrait to 568x320 landscape. The `compact` and `short` Tailwind variants in `index.css` handle this.
