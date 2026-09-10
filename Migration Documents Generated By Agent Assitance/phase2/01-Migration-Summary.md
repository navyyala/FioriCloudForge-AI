# Migration Summary — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17  
**Migration:** SAP Web IDE → BAS / VS Code + UI5 Tooling  
**Target UI5:** SAPUI5 1.71.84

---

## Objective

Execute the approved Phase 1 migration plan: convert the WebIDE project structure into a UI5 Tooling-compliant `webapp/` structure, modernize deprecated APIs, and prepare the app for BAS/VS Code development and ABAP deployment — without removing any existing business logic.

---

## Work Completed

### 1. Structure Migration
- Created `webapp/` folder with standard UI5 Tooling layout: `controller/`, `view/`, `view/fragment/`, `util/`, `i18n/`, `css/`, `localService/`, `test/`
- Created `manifest.json` as the single source of truth (routes, 13 models, datasource, `crossNavigation`)
- Created `package.json`, `ui5.yaml`, `ui5-local.yaml`, `ui5-gwq.yaml`, `ui5-deploy.yaml`
- Created `.gitignore`, `.vscode/settings.json`, `.vscode/launch.json`, `.vscode/tasks.json`
- Removed all legacy WebIDE root-level files/folders (`neo-app.json`, `flp-config.json`, `resources.json`, `Component-preload.js`, old `index.html`/`localIndex.html`, root `css/`, `i18n/`, `localService/`, `test/`, `util/`, `view/`)

### 2. UI5 Version Migration
- Target framework declared as SAPUI5 **1.71.84** in `ui5.yaml`
- Libraries declared explicitly: `sap.m`, `sap.ui.core`, `sap.ui.layout`, `sap.ndc`, optional `sap.ushell`, optional `themelib_sap_belize`
- Compatibility reviewed against UI5 1.71 API surface — no breaking changes expected for patch-level bump from 1.71.60

### 3. Source Code Modernization
- Removed `jQuery.sap.require` / `jQuery.sap.declare` / `jQuery.sap.getModulePath` / `jQuery.sap.startsWith` everywhere
- Converted `Component.js`, `Master.controller.js`, `Main.controller.js`, `Details.controller.js`, `messages.js` to `sap.ui.define` AMD modules with `"use strict"`
- Replaced `sap.ca.ui.message.showMessageBox` → `sap.m.MessageBox`/`MessageView`/`MessageItem`
- Replaced `sap.ca.ui.model.format.AmountFormat` → `sap.ui.core.format.NumberFormat`
- Replaced `sap.ui.component(sap.ui.core.Component.getOwnerIdFor(...))` → `this.getOwnerComponent()`
- Fixed `this.oView` (undefined) → `this.getView()` throughout `Details.controller.js`
- Removed global `var that;` from `Master.controller.js`

### 4. Controller Refactoring
- `Master.controller.js` fully rewritten with modern `sap.ui.define`, injected `Filter`/`FilterOperator`/`Sorter`/`Fragment`/`MessageToast`/`DateFormat`/`JSONModel` dependencies
- `Details.controller.js` (~3200 lines) modernized in place — hybrid loading removed, `this.oView` fixed, `NumberFormat` substituted — full split into sub-controllers deferred (documented in Known Limitations)
- `stockOutputHelper.js` mixin retained (already AMD) with JSDoc added

### 5. Formatter Optimization
- `formatTime`, `removeLeadingZeros`, `formatDate` retained as controller-bound formatters (no duplication found across Master/Details — shared logic already localized)

### 6. Model Optimization
- `useBatch: true` enabled for default and `orderitem` models (previously `false`)
- Deferred OData groups retained/declared explicitly in `Component.js`: `editIATF`, `OrderList`, `OrderItems`, `editMaintCounter`
- `orderitem` model set `preload: false` in manifest (loaded on demand)
- Global request-failed handler centralized in `Component.js` (`_onRequestFailed`)

### 7. Performance Improvements
- OData batch mode enabled (see Model Optimization)
- Async bootstrap (`data-sap-ui-async="true"`) in `index.html`
- Lazy-loaded `sap.ndc.BarcodeScanner` via `sap.ui.require`
- Fragment null-guard added to `onItemsLoaded` (found via runtime testing)

### 8. Accessibility Improvements
- `core:View` → `mvc:View` across all views
- Missing `xmlns:core` namespace added to `Master.view.xml` and `Details.view.xml` (was causing full view parse failure)

### 9. Documentation (JSDoc)
- Class-level JSDoc added to `Component.js`, `Master.controller.js`, `Details.controller.js`, `messages.js`, `stockOutputHelper.js`
- Method-level JSDoc added to public API methods, private helpers, and event handlers across all modernized files

### 10. Test Generation
- QUnit unit tests scaffolded: `Master.controller.js` (9 tests), `Details.controller.js` (11 tests), `messages.js` (5 tests)
- OPA5 integration test scaffolding created: page objects, navigation journey, filter journey, test runner HTML
- Test runner: `webapp/test/unit/unitTests.qunit.html` + `unitTests.qunit.js`

### 11. Regression Preparation
- FLP sandbox startup-parameter test scripts created in `package.json` for all 4 order types: `start-corrective` (ZM17), `start-preventive` (ZM16), `start-predictive` (ZM19), `start-maintenance` (ZM18)

---

## Runtime Issues Found & Fixed During Testing

| Issue | Root Cause | Fix |
|---|---|---|
| `this._oRouter.attachPatternMatched is not a function` | `attachPatternMatched` is a `Route` method, not a `Router` method | `this._oRouter.getRoute("main").attachPatternMatched(...)` |
| Master view parse failure | Missing `xmlns:core="sap.ui.core"` declaration | Namespace added |
| Details view parse failure | Missing `xmlns:core="sap.ui.core"` declaration | Namespace added |
| `Cannot read properties of undefined (reading 'getItems')` in `onItemsLoaded` | Fragment not yet attached when handler fired | Null-guard added before `.getItems()` call |

---

## Deliverables Index

1. This document — Migration Summary
2. [02-Changed-Files-Report.md](02-Changed-Files-Report.md)
3. [03-New-Files-Report.md](03-New-Files-Report.md)
4. [04-Modernization-Report.md](04-Modernization-Report.md)
5. [05-Performance-Optimization-Report.md](05-Performance-Optimization-Report.md)
6. [06-Test-Coverage-Report.md](06-Test-Coverage-Report.md)
7. [07-Known-Limitations.md](07-Known-Limitations.md)
