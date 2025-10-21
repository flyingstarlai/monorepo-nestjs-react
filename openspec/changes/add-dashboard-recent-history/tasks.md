## 1. Implementation
- [ ] 1.1 Create hook `apps/web/src/hooks/use-recent-history.ts` to:
  - [ ] Read/write recent items from/to `localStorage` using key `recent-history:<userId>`
  - [ ] Provide `addEntry({ path, label, icon? })`, `clear()`, and `useRecentHistory()` interface
  - [ ] Enforce dedup by `path`, update timestamp on revisit, cap stored list to 20
  - [ ] Handle `localStorage` failures gracefully (try/catch, no-crash fallback)
- [ ] 1.2 Wire navigation recording
  - [ ] Option A: Add an effect in `apps/web/src/routes/__root.tsx` using TanStack Router to call `addEntry` on route changes (exclude auth/dashboard/404)
  - [ ] Option B: If not global, call `addEntry` from key screens as a minimal viable step
- [ ] 1.3 Dashboard UI
  - [ ] Add a new "Recent History" `<Card>` to `apps/web/src/routes/_dashboard/dashboard.tsx`
  - [ ] Show up to 5 items with label, path, and relative time (e.g., "5m ago"), clickable via `<Link to={path}>`
  - [ ] Add a small "Clear" button; confirm action via toast (optional)
  - [ ] Empty state: show muted text "No recent history yet"
- [ ] 1.4 Tests (web)
  - [ ] Hook unit tests: addEntry, dedup, prune, clear, localStorage failure path
  - [ ] Route integration test: render Dashboard with seeded history, ensure items render and Clear works
- [ ] 1.5 Quality gates
  - [ ] Run Biome format/lint for apps/web
  - [ ] Ensure CI `pnpm test` passes for web

## 2. Documentation
- [ ] 2.1 Update README (apps/web) or relevant docs to mention Recent History behavior, limits, and privacy (client-only)

## 3. Validation
- [ ] 3.1 Run `openspec validate add-dashboard-recent-history --strict`
- [ ] 3.2 Address any spec validation issues
