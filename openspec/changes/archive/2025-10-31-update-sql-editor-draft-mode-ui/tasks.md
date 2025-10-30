## 1. Implementation

- [x] 1.1 Remove Validate button from status bar (lines 483-500 in sql-editor.tsx)
- [x] 1.2 Remove Save button from status bar (lines 517-521 in sql-editor.tsx)
- [x] 1.3 Add conditional icon-based Save and Publish buttons for draft mode only
- [x] 1.4 Add conditional icon-based "Move to Draft" and "Execute" buttons for published mode
- [x] 1.5 Set editor to read-only when procedure.status === 'published'
- [x] 1.6 Update button styling to use icons instead of text (save, rocket, edit, play icons)
- [x] 1.7 Ensure proper disabled states for validation/publish/execute conditions
- [x] 1.8 Update procedure explorer to use FileCode icon for all procedures
- [x] 1.9 Test UI behavior in draft vs published modes
- [x] 1.10 Verify automatic validation still works without manual trigger
- [x] 1.11 Update keyboard shortcuts and tooltips for new button actions
- [x] 1.12 Implement "Move to Draft" functionality to create/activate draft from published version
