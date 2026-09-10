# Modernization Opportunities — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Applied in Phase 2

| Opportunity | Effort | Value | Status |
|---|---|---|---|
| Enable `useBatch: true` | LOW | HIGH — reduces HTTP requests significantly | ✅ Applied |
| Replace `sap.ca.ui.message` → `sap.m.MessageBox`/`MessageView` | LOW | MEDIUM — removes retired library dependency | ✅ Applied |
| Replace `sap.ca.ui.model.format.AmountFormat` → `sap.ui.core.format.NumberFormat` | LOW | MEDIUM | ✅ Applied |
| Move routing config to `manifest.json` | MEDIUM | HIGH — required for BAS/Fiori Tools compatibility | ✅ Applied |
| Replace `attachRoutePatternMatched` (router) → `getRoute().attachPatternMatched` | LOW | LOW — fixes runtime error | ✅ Applied |
| Add JSDoc to all controllers/utilities | LOW | MEDIUM — maintainability | ✅ Applied |
| Scaffold QUnit + OPA5 tests | MEDIUM | HIGH — previously zero coverage | ✅ Applied (scaffolding only) |
| Lazy-load `sap.ndc.BarcodeScanner` via `sap.ui.require` | LOW | LOW — avoids unnecessary sync dependency | ✅ Applied |

---

## Deferred (Out of Scope for Phase 2)

| Opportunity | Effort | Value | Reason for Deferral |
|---|---|---|---|
| Async fragment loading (`Fragment.load()` instead of `sap.ui.xmlfragment()`) | HIGH | HIGH — removes UI-thread blocking at init | 25+ call sites across Details/Master controllers; requires Promise-based refactor of every dialog handler — high regression risk without full test coverage first |
| Split `Details.controller.js` into sub-controllers/services | HIGH | MEDIUM — maintainability | 3200-line file; splitting requires behavior-preserving extraction validated by tests not yet fully built out |
| Add `$select` to reduce OData payloads | LOW | MEDIUM | Would change entity property list; deferred until backend team confirms all bound fields |
| Replace `sap.m.UploadCollection` → `sap.m.upload.UploadSet` | MEDIUM | MEDIUM | `UploadCollection` still valid in UI5 1.71, not yet deprecated until 1.88 |
| Fix `MRO_LIST` / `STORAGE_LOC` composite key usage in `stockOutputHelper.js` | MEDIUM | MEDIUM | Backend metadata changed (see Migration Impact Analysis); requires coordinated backend + frontend key logic review |
| Replace deprecated `ObjectListItem` marker properties (`markFavorite`, `markFlagged`, `showMarkers`) in fragments | LOW | LOW | Cosmetic; fragments otherwise functionally unchanged from production |
| Prefix all XML event handlers with `.` (fixes `no-ambiguous-event-handler` lint warnings) | LOW | LOW | 126 occurrences across all views/fragments; cosmetic, no runtime impact on UI5 1.71 |

---

## Future UI5 Version Upgrade Path

| Target | Consideration |
|---|---|
| SAPUI5 ≥ 1.108 | Enables `sap_horizon` theme, resolves `no-deprecated-theme`/`no-deprecated-library` lint findings |
| SAPUI5 ≥ 1.90 | `UploadCollection` deprecation becomes relevant — plan `UploadSet` migration |
| SAPUI5 ≥ 1.86 | Arrow function support in AMD callbacks fully stable — modernize `var self = this` patterns |
