# Migration Risks — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Risk Register

| Risk | Probability | Impact | Mitigation | Status |
|------|------------|--------|-----------|--------|
| `sap.ca.ui` library not available/supported on target system | HIGH | HIGH | Replaced with standard `sap.m` equivalents (`MessageBox`, `NumberFormat`) | ✅ Mitigated |
| `sap.m.routing.RouteMatchedHandler` removed/unsupported | HIGH | HIGH | Routing moved to `manifest.json`; standard `sap.m.routing.Router` used | ✅ Mitigated |
| Missing `manifest.json` causes FLP tile failure | HIGH | HIGH | Created `manifest.json` with full FLP `crossNavigation` config | ✅ Mitigated |
| Fragment memory leaks after migration | MEDIUM | MEDIUM | Partial — null-guard added to `onItemsLoaded`; full destroy-guard audit deferred | ⚠️ Partially mitigated |
| `Component-preload.js` conflicts with UI5 Tooling preload generation | HIGH | MEDIUM | Removed from source; added to `.gitignore` | ✅ Mitigated |
| `index.html` direct controller script injection (`<script src="view/Details.controller.js">`) | HIGH | HIGH | Removed; standard UI5 Tooling `ComponentSupport` bootstrap used | ✅ Mitigated |
| Test gap — zero automated tests pre-migration | HIGH | HIGH | QUnit + OPA5 scaffolding created; full coverage still pending | ⚠️ Partially mitigated |
| Startup parameters (`apptype`, `ordertype`) must continue working post-migration | MEDIUM | HIGH | Validated via FLP sandbox test scripts for all 4 order types (ZM16–ZM19) | ✅ Mitigated |
| Router API misuse (`attachPatternMatched` called on Router instead of Route) | MEDIUM | HIGH | Found during runtime testing; fixed to `getRoute("main").attachPatternMatched()` | ✅ Mitigated |
| Missing `xmlns:core` namespace causing view parse failure | MEDIUM | HIGH | Found during runtime testing on both Master and Details views; fixed | ✅ Mitigated |
| `sap.ui.xmlfragment()` synchronous calls remain (25+ call sites) | MEDIUM | MEDIUM | Documented as known limitation; deferred to avoid large-scale regression risk | ⚠️ Accepted risk |
| Backend metadata key changes (`MRO_LIST`, `STORAGE_LOC`) not reflected in frontend key construction | MEDIUM | MEDIUM | Documented in Migration Impact Analysis; requires coordinated follow-up | ⚠️ Accepted risk |
| SAPUI5 1.71.84 not resolvable via npm CDN for `ui5 build` | MEDIUM | LOW | `ui5 serve` with backend proxy works; `ui5 deploy` used for production releases instead of local build | ⚠️ Accepted risk |
| UI5 Linter reports 460 errors (mostly deprecated fragment APIs: `ObjectListItem.markFavorite/markFlagged/showMarkers`) | LOW | LOW | Fragments unchanged from production; functionally stable on SAPUI5 1.71 | ⚠️ Accepted risk |

---

## Risk Summary by Category

| Category | High | Medium | Low |
|---|---|---|---|
| Runtime stability | 4 (all mitigated) | 1 | 0 |
| Test coverage | 1 (partial) | 0 | 0 |
| Performance | 0 | 2 (accepted) | 0 |
| Tooling/Build | 0 | 1 (accepted) | 1 (accepted) |
| Data integrity (backend) | 0 | 1 (accepted) | 0 |

---

## Risks Discovered Post-Deployment (During Live Testing)

These risks were **not** identified during static Phase 1 analysis and were only found once the migrated app was run live:

1. **Router API misuse** — `this._oRouter.attachPatternMatched is not a function`. Root cause: `attachPatternMatched` belongs to `sap.ui.core.routing.Route`, not `Router`. Fixed by calling `.getRoute("main").attachPatternMatched(...)`.
2. **Missing `xmlns:core` namespace** — Both `Master.view.xml` and `Details.view.xml` used `<core:Item>`/`<core:Icon>` elements without declaring the `core` namespace, causing complete view parse failure. Fixed by adding `xmlns:core="sap.ui.core"`.
3. **`onItemsLoaded` null reference** — `sap.ui.core.Fragment.byId(...).getItems()` threw `TypeError: Cannot read properties of undefined` when the items fragment wasn't yet attached. Fixed with a null-guard.

**Lesson learned:** Static analysis alone does not catch all deprecated/misused APIs — live smoke testing across all four order-type startup parameter combinations (`ZM16`–`ZM19`) is essential before production deployment.
