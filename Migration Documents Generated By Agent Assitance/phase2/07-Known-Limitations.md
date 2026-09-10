# Known Limitations — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17

---

## 1. Synchronous Fragment Loading Retained

`sap.ui.xmlfragment()` is still used synchronously across `Details.controller.js` and `Master.controller.js` (25+ call sites). Converting to async `Fragment.load()` requires a Promise-based refactor of every dialog handler. This was deferred to avoid introducing regressions in a 3200-line controller without full test coverage in place first.

## 2. `Details.controller.js` Not Split

The Details controller remains a single ~3200-line file. Splitting into sub-controllers or service modules was identified as a modernization opportunity but deferred — the file handles order items, attachments, IATF/maintenance counters, stock output, takeover, and confirmation logic in a tightly interwoven manner that requires a dedicated refactoring initiative with full regression test coverage first.

## 3. Backend Metadata Key Changes Not Reflected in Frontend Logic

Live GWD metadata refresh revealed that `MRO_LIST` and `STORAGE_LOC` entity keys changed (additional composite key fields: `Bwtar`, `Matnr`, `Lgort`). The frontend `stockOutputHelper.js` key construction logic was **not** updated to reflect these changes, as this requires coordinated backend/frontend review outside the scope of a structural migration.

## 4. `ui5 build` Not Executable Offline

SAPUI5 1.71.84 framework metadata (`@sapui5/distribution-metadata`) is not resolvable via the npm registry for versions below 1.76. `ui5 build` fails in this environment. **Workaround:** use `ui5 serve` with the configured proxy middleware for development, and `ui5 deploy` (which does not require a local build) for ABAP deployment.

## 5. UI5 Linter Findings Not Fully Resolved

586 lint findings remain (460 errors, 126 warnings):
- **~320 `no-deprecated-api`** errors relate to `ObjectListItem` marker properties (`markFavorite`, `markFlagged`, `showMarkers`) and `List.select` in fragment XML — these are deprecated but functionally valid on SAPUI5 1.71 and were not modified since the fragments are otherwise unchanged production content.
- **~140 `no-globals`** errors relate to intentionally retained `sap.ui.xmlfragment()`/`sap.ui.core.Fragment.byId()` global access patterns (see Limitation #1).
- **126 `no-ambiguous-event-handler`** warnings relate to XML event handlers not prefixed with `.` (e.g. `press="onNavBack"` vs `press=".onNavBack"`) — cosmetic, no runtime impact on UI5 1.71, but should be fixed before upgrading past 1.71.
- **2 `no-deprecated-theme`/`no-deprecated-library`** findings relate to `sap_belize` theme in `flpSandbox.html` — functional on 1.71, but should be revisited if upgrading to `sap_horizon`.

## 5. No Load/Performance Testing Performed

Performance optimizations (batch mode, lazy loading) are structural/configuration changes. No formal load testing or before/after performance measurement was conducted as part of this migration.

## 6. Test Coverage Is Scaffolding, Not Full Coverage

25 QUnit unit tests and 5 OPA5 integration test files were created, but:
- No mock server exists, so CRUD/write-path tests cannot be executed against a simulated backend
- Value help dialogs, attachment upload, and barcode scan flows have no test coverage
- Tests have not yet been executed in a live `ui5 serve` session to produce a pass/fail baseline

## 7. Dead/Commented Code Retained

Per the explicit instruction "do not remove any code while migration, only add or modify," extensive commented-out code blocks in `Master.controller.js` and `Details.controller.js` were left in place rather than cleaned up.

## 8. Accessibility Remediation Not Performed

ARIA labels, `labelFor` associations, and tooltips on icon-only buttons were identified as gaps in Phase 1 but not addressed in Phase 2 — these require UX/content decisions outside the scope of a structural code migration.

## 9. i18n Binding Literal Bug Found But Not Fixed

`stockOutputHelper.js` contains `MessageToast.show("{i18n>scanned}: " + oResult.text)` — this is a pre-existing functional bug (i18n binding syntax used as a literal string instead of resolving via `getResourceBundle().getText(...)`). Documented in the Security Assessment but not fixed, as it predates this migration and is a functional defect rather than a migration-introduced issue.

---

## Summary

All limitations above are either (a) deliberately deferred to control regression risk in a large legacy controller, (b) environment/tooling constraints unrelated to code quality, or (c) pre-existing issues discovered during migration but outside the agreed scope of "structural migration without business logic changes." None block deployment to GWD/GWQ for functional testing.
