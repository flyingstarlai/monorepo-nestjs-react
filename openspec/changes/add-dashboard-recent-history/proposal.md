## Why
Users need quick access to the screens they recently visited so they can resume work without re-navigating through menus. A "Recent History" card on the Dashboard improves efficiency and complements the existing Quick Actions and Recent Activity sections.

## What Changes
- Add a "Recent History" card to `apps/web/src/routes/_dashboard/dashboard.tsx` displaying up to 5 most recent, unique routes visited by the current user
- Record route visits on the client via TanStack Router navigation events; store per-user in `localStorage` under a namespaced key
- Deduplicate by path (update timestamp if revisited), keep order by most-recent-first, and prune to a max of 20 stored items (display top 5)
- Exclude auth/system routes (e.g., `login`, `/_dashboard/dashboard`, 404) and immediate duplicates
- Provide a "Clear" action to wipe history for the current user; graceful no-op if already empty
- Persist history across sessions; degrade gracefully if `localStorage` is unavailable
- Tests: hook unit tests and a dashboard integration test validating render, click-through, clear action, and persistence

## Impact
- Affected specs: `dashboard-recent-history` (new capability)
- Affected code:
  - apps/web/src/routes/_dashboard/dashboard.tsx (render the card/UI and consume history)
  - apps/web/src/hooks/use-recent-history.ts (new hook for recording and reading history)
  - apps/web/src/routes/__root.tsx (optional: attach a global navigation effect; otherwise record within the hook/UI)
- No backend changes; privacy stays client-only
