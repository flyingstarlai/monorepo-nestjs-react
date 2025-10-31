## MODIFIED Requirements

### Requirement: Bottom Results and Messages Panel

The system SHALL provide a bottom panel with tabs for Results and Messages, resizable with the editor.

#### Scenario: Show execution results

- WHEN a published procedure is executed successfully
- THEN results are displayed in the Results tab with row/column counts and the panel becomes visible if hidden

#### Scenario: Show messages and warnings

- WHEN validation or execution produces messages (errors/warnings/info)
- THEN the Messages tab lists them with timestamps and severity and the list can be cleared

#### Scenario: Resizable height persistence

- WHEN the splitter is dragged
- THEN the panel height adjusts and is remembered per workspace

#### Scenario: Scrollable tab content

- WHEN content in any bottom panel tab (Results or Messages) exceeds the visible panel height
- THEN the tab body SHALL be vertically scrollable within the bottom panel
- AND the page outside the SQL Editor SHALL NOT scroll as a result of the overflow
- AND there SHALL be exactly one primary scroll container per tab body to avoid nested scroll conflicts
- AND scrolling SHALL work with mouse wheel/trackpad and via keyboard when the tab body is focused
- AND resizing the bottom panel SHALL preserve scrollability without clipping content
