# Modernization Report — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17

---

## Deprecated Controls / APIs — Before vs After

| Deprecated Item | Before | After |
|---|---|---|
| `jQuery.sap.declare()` | `Component.js`, `messages.js` | Removed — `sap.ui.define` |
| `jQuery.sap.require()` | `Component.js`, `Master.controller.js`, `Details.controller.js` (8+ calls) | Removed — AMD dependency arrays |
| `jQuery.sap.getModulePath()` | `Component.js` | Removed — not needed with manifest bootstrap |
| `jQuery.sap.startsWith()` | `messages.js` | Native `String.prototype.startsWith` |
| `sap.m.routing.RouteMatchedHandler` | `Component.js` | Removed — manifest-driven `sap.m.routing.Router` |
| `sap.ca.ui.message.showMessageBox` | `messages.js` | `sap.m.MessageBox` |
| `sap.ca.ui.model.format.AmountFormat` | `Details.controller.js` | `sap.ui.core.format.NumberFormat` |
| `sap.ui.view()` (sync) | `Component.js` | Removed — `rootView` in manifest |
| `sap.ui.component(sap.ui.core.Component.getOwnerIdFor(...))` | Both controllers | `this.getOwnerComponent()` |
| `attachRoutePatternMatched` (router-level misuse) | `Master.controller.js` | `getRoute("main").attachPatternMatched(...)` |
| `core:View` (untyped) | All 3 views | `mvc:View` (typed) |

## Retained (Not Modernized — Documented as Known Limitation)

| Item | Location | Reason |
|---|---|---|
| `sap.ui.xmlfragment()` (synchronous) | `Details.controller.js`, `Master.controller.js` (25+ call sites) | High regression risk without full test coverage; deferred |
| `sap.ui.getCore().byId()` | `Master.controller.js` (`shellAppTitle`, `homeBtn`) | No view-scoped alternative for shell-level controls |
| `sap.ui.core.Fragment.byId()` (global access pattern) | Both controllers | Functionally correct; flagged by linter as `no-globals` but not deprecated |

---

## Library Compatibility Review

| Library | Status on SAPUI5 1.71.84 |
|---|---|
| `sap.m` | ✅ Fully supported |
| `sap.ui.core` | ✅ Fully supported |
| `sap.ui.layout` | ✅ Fully supported |
| `sap.ndc` | ✅ Supported (BarcodeScanner) |
| `sap.ushell` | ✅ Supported, declared optional |
| `sap.ca.ui` | ❌ Removed from dependency tree entirely |
| `themelib_sap_belize` | ⚠️ Deprecated by linter (`no-deprecated-library`) but functional on 1.71 |

---

## Standards Adopted

- **`sap.ui.define`** AMD module pattern across all JS files
- **`"use strict"`** directive added to all modernized modules
- **Manifest-first** configuration (routes, models, FLP intents) — no inline JS configuration
- **JSDoc** documentation standard applied to all public/private methods
- Modern dependency injection pattern (`Filter`, `FilterOperator`, `Sorter`, `Fragment`, `MessageToast`, `MessageBox`, `NumberFormat`, `JSONModel` all injected via `sap.ui.define` array rather than accessed as globals)

---

## Obsolete Configurations Removed

| Configuration | Location | Status |
|---|---|---|
| `neo-app.json` (WebIDE routing/proxy config) | Root | Removed — replaced by `ui5.yaml`/`ui5-local.yaml`/`ui5-gwq.yaml` |
| `flp-config.json` (WebIDE FLP tile config) | Root | Removed — replaced by `manifest.json` `crossNavigation` |
| `resources.json` | Root | Removed — not used by UI5 Tooling |
| `Component-preload.js` (checked into source) | Root | Removed — now a build artifact, excluded via `.gitignore` |
| Inline `<script>` bootstrap + stray controller script tag in `index.html` | Root `index.html` | Removed — replaced by standard async `ComponentSupport` bootstrap |
