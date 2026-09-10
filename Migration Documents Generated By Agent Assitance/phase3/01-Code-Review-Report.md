# Code Review Report — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Reviewer:** GitHub Copilot (Automated)  
**Scope:** `webapp/` post-migration codebase

---

## Scores

| Category | Score | Grade |
|---|---|---|
| Security | 85 / 100 | B+ |
| Performance | 78 / 100 | B |
| Maintainability | 80 / 100 | B+ |
| Accessibility | 65 / 100 | C+ |

---

## Security

### ✅ Passed
- No `innerHTML` / `$.html()` / `sap.ui.getCore().byId(...).setHtmlText()` usage found
- No hardcoded credentials or API keys
- OData batch mode enabled (`useBatch: true`) — prevents individual request enumeration
- `sap.ca.ui` (deprecated, unmaintained) fully removed from `messages.js` and `Details.controller.js`
- No `eval()` or `new Function()` usage

### ⚠️ Warnings
| Location | Finding | Risk |
|---|---|---|
| `Details.controller.js` (multiple) | `sap.ui.core.Fragment.byId(...)` — global `sap` access | Low |
| `Details.controller.js:2656` | `sap.ui.xmlfragment(...)` — synchronous global API | Low |
| Fragment event handlers (XML views) | Non-prefixed event handlers (e.g. `press="onNavBack"`) | Low |

---

## Performance

### ✅ Passed
- `manifest.json` preload declarations present — enables UI5 preload optimisation
- `data-sap-ui-async="true"` in `index.html`
- `ComponentSupport` module used for lazy component init
- `sap/ndc/BarcodeScanner` loaded via lazy `sap.ui.require` in `Master.controller.js`
- OData batch enabled; deferred groups `editIATF`, `OrderList`, `OrderItems`, `editMaintCounter` batch mutations

### ⚠️ Warnings
| Location | Finding | Impact |
|---|---|---|
| `Details.controller.js` | `sap.ui.xmlfragment()` — synchronous fragment load (25+ calls) | Blocks UI thread on first render |
| Multiple fragments | `sap.ui.comp.smarttable` namespace declared in `Master.view.xml` but not used | Unnecessary library import |
| `Master.view.xml` | `growing="false"` on Table bound to `/ORDERLISTSet` — entire set loaded | Large datasets risk |

---

## Maintainability

### ✅ Passed
- `sap.ui.define` AMD modules throughout — no `jQuery.sap.declare` remaining
- `"use strict"` in all JS files
- `this.getOwnerComponent()` replaces fragile `sap.ui.component(sap.ui.core.Component.getOwnerIdFor(...))`
- `this.getView().byId()` replaces `this.oView.byId()` — no stale view reference
- JSDoc class headers on all controllers and utilities
- `messages.js` fully encapsulated as named export object

### ⚠️ Warnings
| Location | Finding |
|---|---|
| `Details.controller.js` | ~3200 lines — exceeds single-responsibility; candidate for splitting into sub-controllers |
| `Details.controller.js` | `var self = this` pattern used in callbacks — candidate for arrow functions on UI5 ≥1.86 |
| `stockOutputHelper.js` | Mixin pattern with `this` context — fragile; could be replaced with ES6 class mixin |
| Fragment files (27) | Unchanged from WebIDE source — no namespace prefix on IDs |

---

## Accessibility

### ✅ Passed
- `sap.m` controls used throughout — baseline ARIA roles provided by framework
- `sapUiSizeCompact` applied for non-touch devices in `Main.controller.js`
- `Label` elements paired with form inputs throughout views

### ⚠️ Warnings
| Location | Finding |
|---|---|
| `Master.view.xml` | Table `mode="MultiSelect"` — no accessible name on `ColumnListItem` |
| `Details.view.xml` | No `ariaLabelledBy` on dialogs opened via `sap.ui.xmlfragment` |
| `Master.view.xml` | `Button` with only `icon` set — missing `tooltip` on scan button `btn_scan` workaround needed |

---

## UI5 Lint Results Summary

**Tool:** `@ui5/linter v1.23.5`  
**Total Findings:** 586 (460 errors, 126 warnings)

| Rule | Count | Affected Area |
|---|---|---|
| `no-deprecated-api` | ~320 | Fragments — `ObjectListItem.markFavorite/markFlagged/showMarkers`, `List.select` |
| `no-globals` | ~140 | `Details.controller.js` — `sap.ui.xmlfragment`, `sap.ui.core.Fragment.byId`, `sap.ui.getCore` |
| `no-ambiguous-event-handler` | 126 | All XML views — event handlers missing `.` prefix |
| `no-deprecated-theme` | 2 | `flpSandbox.html` — `sap_belize` theme |
| `no-deprecated-library` | 2 | `flpSandbox.html` — `themelib_sap_belize` |

> **Note:** The 320 fragment errors relate to `ObjectListItem` marker properties that are deprecated but still functional on SAPUI5 1.71. The 140 `no-globals` errors in `Details.controller.js` relate to intentionally retained `sap.ui.xmlfragment` calls — changing these requires a larger refactor outside migration scope.
