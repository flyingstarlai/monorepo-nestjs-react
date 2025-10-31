## 1. Implementation

- [x] 1.1 Replace bottom panel calc-height with grid rows `[auto,1fr]` and move `TabsList` to row 1, `TabsContent` to row 2
- [x] 1.2 In each `TabsContent`, use `h-full overflow-hidden`; move scrolling to inner panel container
- [x] 1.3 Ensure each panel wrapper uses `flex flex-col h-full overflow-hidden` and list/table area uses `flex-1 min-h-0 overflow-auto`
- [x] 1.4 Keep outer bottom panel container `overflow-hidden` and resizer unchanged
- [x] 1.5 Light a11y pass: confirm tabpanels are reachable and scrollable via keyboard

## 2. Validation

- [x] 2.1 Console: push >30 messages; verify vertical scroll appears and page does not scroll
- [x] 2.2 Validation: show multiple warnings/errors; verify scroll
- [x] 2.3 Results: render >200 rows; verify table scrolls inside panel
- [x] 2.4 Resize bottom panel to very small and large heights; scrolling continues to work
- [x] 2.5 Switch tabs rapidly; ensure scroll containers remain functional

## 3. Non-Goals

- No changes to data models or API
- No sticky headers/virtualization in tables (future enhancement)

