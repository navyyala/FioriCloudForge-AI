# Technical Debt Report — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Summary

| Category | Count | Severity |
|---|---|---|
| Deprecated APIs | 12+ distinct patterns | HIGH |
| Architecture violations | 10 | HIGH |
| Dead / commented code blocks | Extensive (2 controllers) | LOW |
| Tight coupling issues | 3 | MEDIUM |

---

## Deprecated APIs

| API | File(s) | Occurrences | Replacement Applied |
|---|---|---|---|
| `jQuery.sap.declare()` | `Component.js`, `messages.js` | 2 | Removed — AMD via `sap.ui.define` |
| `jQuery.sap.require()` | `Component.js`, `Master.controller.js`, `Details.controller.js` | 8+ | Removed — dependency array in `sap.ui.define` |
| `jQuery.sap.getModulePath()` | `Component.js` | 1 | Removed — not needed with manifest-based bootstrap |
| `jQuery.sap.startsWith()` | `messages.js` | 1 | Replaced with native `String.prototype.startsWith` |
| `sap.m.routing.RouteMatchedHandler` | `Component.js` | 1 | Removed — manifest-driven router only |
| `sap.ca.ui.message.showMessageBox` | `messages.js` | 1 | Replaced with `sap.m.MessageBox` |
| `sap.ca.ui.model.format.AmountFormat` | `Details.controller.js` | 1 (import) | Replaced with `sap.ui.core.format.NumberFormat` |
| `sap.ui.view()` (sync) | `Component.js` | 1 | Removed — `rootView` declared in manifest |
| `sap.ui.xmlfragment()` (sync) | `Details.controller.js`, `Master.controller.js` | 25+ | **Retained** — async refactor deferred (see Known Limitations) |
| `sap.ui.component(sap.ui.core.Component.getOwnerIdFor(...))` | Both controllers | 2 | Replaced with `this.getOwnerComponent()` |
| `sap.ui.getCore().byId()` | `Master.controller.js` | 2 | Retained only where no view-scoped alternative exists (`shellAppTitle`, `homeBtn`) |
| `attachRoutePatternMatched` (router-level) | `Master.controller.js` | 1 | Fixed to `getRoute("main").attachPatternMatched()` |

---

## Architecture Violations

| Issue | File | Fix Applied |
|---|---|---|
| Mixed module loading (`jQuery.sap.require` + `sap.ui.define` in one file) | `Details.controller.js` | Header cleaned; single `sap.ui.define` block |
| Global variable `var that;` | `Master.controller.js` | Removed — replaced with `this` binding throughout rewrite |
| `this.oView` (undefined property, should be `this.getView()`) | `Details.controller.js` | Bulk-replaced via scripted regex fix |
| No `manifest.json` | Project root | Created |
| No `package.json` / `ui5.yaml` | Project root | Created |
| `Component-preload.js` committed to source | Project root | Removed; added to `.gitignore` |
| Inline bootstrap script + stray `<script>` tags in `index.html` | `index.html` | Rewritten to standard UI5 Tooling async bootstrap |
| `useBatch: false` | `Component.js` | Changed to `true` in manifest model settings |
| Fragment IDs manually concatenated from view ID | `Details.controller.js`, `Master.controller.js` | Retained (functional, low risk) |
| Fragment re-creation without destroy guard | `Details.controller.js` (`onItemsLoaded`) | Null-guard added after runtime error discovered in testing |

---

## Dead / Commented Code

- `Master.controller.js`: extensive commented-out filter logic (WorkGroup, Assigned combo, old table references)
- `Details.controller.js`: `// debugger;` statements, commented `sap.ui.table` references, disabled functional location combo logic
- **Decision:** Left in place per "do not remove code, only add/modify" instruction from Phase 2 prompt; can be cleaned in a dedicated tech-debt sprint

---

## Tight Coupling

| Issue | Impact |
|---|---|
| `Details.controller.js` is ~3200 lines | Single Responsibility Principle violated; hard to test in isolation |
| `stockOutputHelper.js` mixin assumes controller context (`this._frgIdAddArticleDialog`) | Cannot be reused outside `Details.controller.js` |
| Fragment ID string concatenation pattern (`this._oView.getId() + "-items"`) | Fragile; breaks if view ID changes |

**Recommendation:** Defer `Details.controller.js` splitting to a follow-up initiative — restructuring a 3200-line controller carries regression risk without a full test suite in place first (test scaffolding was added in Phase 2, but full coverage is still pending).
