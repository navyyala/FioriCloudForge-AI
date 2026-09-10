# Changed Files Report — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17

---

For each modified file: name, change description, reason, risk, and migration impact.

---

### `webapp/Component.js`
- **Change:** Full rewrite from `jQuery.sap.declare`/`require` style to `sap.ui.define` AMD module; removed `sap.m.routing.RouteMatchedHandler`; model configuration moved to `manifest.json`; added centralized `_onRequestFailed` handler; added JSDoc.
- **Reason:** Deprecated API removal; manifest-first architecture required for BAS/Fiori Tools compatibility.
- **Risk:** LOW — behavior preserved; validated via live FLP sandbox testing.
- **Migration Impact:** HIGH — core bootstrap file; all downstream models/routing depend on this.

### `webapp/controller/Master.controller.js`
- **Change:** Full rewrite to `sap.ui.define`; removed global `var that`; replaced `sap.ui.component(...)` with `this.getOwnerComponent()`; fixed `attachPatternMatched` misuse (`getRoute("main").attachPatternMatched`); all `Filter`/`FilterOperator`/`Sorter`/`Fragment` calls converted from global `sap.ui.model.*` to injected AMD dependencies; JSDoc added to all public methods.
- **Reason:** Deprecated API removal, runtime bug fix (router API misuse discovered in testing).
- **Risk:** LOW — full behavioral parity verified against original filter/search/assignment/print logic.
- **Migration Impact:** HIGH — controls entire Master (order list) page behavior.

### `webapp/controller/Details.controller.js`
- **Change:** Removed `jQuery.sap.require` header lines; replaced `sap/ca/ui/model/format/AmountFormat` import with `sap/ui/core/format/NumberFormat`; fixed all `this.oView` references to `this.getView()`; added `"use strict"`; fixed `Controller.extend` call; added null-guard in `onItemsLoaded`; added class-level and method-level JSDoc.
- **Reason:** Deprecated API removal (`sap.ca.ui`), fragile reference fix, runtime crash fix.
- **Risk:** MEDIUM — largest file (~3200 lines); targeted edits only, no logic removed or restructured.
- **Migration Impact:** HIGH — controls entire Details (confirmation) page; most complex file in the app.

### `webapp/util/messages.js`
- **Change:** Full rewrite. Removed `jQuery.sap.declare`/`require`, `sap.ca.ui.message.showMessageBox`, `jQuery.sap.startsWith`. Replaced with `sap.ui.define`, `sap.m.MessageBox`/`MessageView`/`MessageItem`/`Dialog`/`Button`/`Bar`/`Text`, native `String.startsWith`.
- **Reason:** `sap.ca.ui` library retired/unmaintained.
- **Risk:** LOW — error display behavior functionally equivalent (dialog with message list on multi-error, `MessageBox.error` fallback on single message).
- **Migration Impact:** MEDIUM — used by `Component.js` as the global OData error handler.

### `webapp/view/Main.view.xml`
- **Change:** `core:View` → `mvc:View`; controller path updated to `PO_MAINTENANCE.controller.Main`.
- **Reason:** Standards compliance (typed view root element).
- **Risk:** NONE.
- **Migration Impact:** LOW — shell wrapper only.

### `webapp/view/Master.view.xml`
- **Change:** `core:View` → `mvc:View`; controller path updated to `PO_MAINTENANCE.controller.Master`; added missing `xmlns:core="sap.ui.core"` namespace declaration.
- **Reason:** Standards compliance + **critical bug fix** — the view failed to parse entirely without the `core` namespace since `<core:Item>` elements are used throughout.
- **Risk:** LOW (fix), but the *absence* of this fix was HIGH risk (total page failure).
- **Migration Impact:** HIGH — discovered via live runtime testing, not static analysis.

### `webapp/view/Details.view.xml`
- **Change:** `core:View` → `mvc:View`; controller path updated to `PO_MAINTENANCE.controller.Details`; removed unused `xmlns:ui="sap.ca.ui"` namespace; added missing `xmlns:core="sap.ui.core"`.
- **Reason:** Standards compliance + critical bug fix (same root cause as Master view).
- **Risk:** LOW (fix), same criticality note as above.
- **Migration Impact:** HIGH — discovered via live runtime testing.

### `webapp/manifest.json`
- **Change:** New file (see New Files Report) — but represents the single largest configuration change in the migration, consolidating what was previously scattered across `Component.js` metadata and `neo-app.json`.
- **Reason:** Required by UI5 Tooling / SAP Fiori Tools / BAS.
- **Risk:** MEDIUM — first-time authored file; validated by successful FLP sandbox load for all 4 order types.
- **Migration Impact:** HIGH.

### `package.json`
- **Change:** Added order-type-specific FLP sandbox test scripts (`start-corrective`, `start-preventive`, `start-predictive`, `start-maintenance`) alongside base `start`, `start-local`, `start-gwq`, `build`, `deploy`, `lint`.
- **Reason:** Enable one-command regression testing per order type as requested.
- **Risk:** NONE — additive scripts only.
- **Migration Impact:** LOW.
