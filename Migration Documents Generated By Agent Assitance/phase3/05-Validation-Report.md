# Validation Report — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Tool:** @ui5/linter v1.23.5 + manual review

---

## Build Validation

| Step | Result | Notes |
|---|---|---|
| `npm install` | ✅ Pass | All devDependencies installed |
| `ui5 serve --config ui5-local.yaml` | ✅ Pass | Serves on localhost:8080 with GWD proxy |
| `ui5 serve --config ui5-gwq.yaml` | ✅ Pass | Serves on localhost:8080 with GWQ proxy |
| `ui5 build` | ⚠️ Partial | `@sapui5/distribution-metadata@1.71.84` not resolvable via npm — SAPUI5 <1.76 limitation |
| `ui5 deploy` config | ✅ Ready | `ui5-deploy.yaml` configured for GWD BSP `ZGPM_ORDERCONF` |

> Build via `ui5 build` is blocked due to SAP's npm CDN not publishing SAPUI5 distribution metadata below version 1.76. This is a known SAP limitation, not a migration defect. Runtime behaviour via `ui5 serve` with proxy is fully functional.

---

## UI5 Tooling Compatibility

| Feature | Status |
|---|---|
| `specVersion: "3.1"` in ui5.yaml | ✅ |
| Framework: SAPUI5 1.71.84 declared | ✅ |
| Libraries: sap.m, sap.ui.core, sap.ui.layout, sap.ndc | ✅ |
| sap.ushell declared as optional | ✅ |
| Middleware: simpleproxy for local/gwq | ✅ |
| Deploy task: deploy-to-abap | ✅ |

---

## BAS / VS Code Compatibility

| Feature | Status |
|---|---|
| `manifest.json` present in `webapp/` | ✅ |
| `ui5.yaml` at project root | ✅ |
| `package.json` with `ui5 serve` scripts | ✅ |
| `.vscode/launch.json` Chrome debug config | ✅ |
| `.vscode/tasks.json` build task | ✅ |
| No WebIDE-specific files (`neo-app.json`, `flp-config.json`) | ✅ Removed |

---

## Runtime Stability (Manual Review)

| Controller | Issues Fixed | Remaining |
|---|---|---|
| `Component.js` | `jQuery.sap.require`, `RouteMatchedHandler`, sync view | None |
| `Master.controller.js` | `sap.ui.component`, `attachPatternMatched` → `getRoute().attachPatternMatched` | None |
| `Details.controller.js` | `sap.ca.ui`, `this.oView`, `jQuery.sap.require` inline | `sap.ui.xmlfragment` (intentional) |
| `messages.js` | `sap.ca.ui.message`, `jQuery.sap.startsWith` | None |
| `stockOutputHelper.js` | Already used `sap.ui.define` | None |

---

## Test Validation

### Unit Tests (QUnit)
| File | Tests | Coverage Target |
|---|---|---|
| `test/unit/controller/Master.controller.js` | 9 tests | formatTime, removeLeadingZeros, filter building, model state |
| `test/unit/controller/Details.controller.js` | 11 tests | model state, deferred groups, IATF filter construction |
| `test/unit/util/messages.js` | 5 tests | `_parseError`, `getErrorContent`, native `startsWith` |
| `test/unit/unitTests.qunit.html` | Runner | All unit modules |

### OPA5 Integration Tests
| File | Journey | Coverage Target |
|---|---|---|
| `test/integration/pages/Master.js` | Page object | Search, filter, select order |
| `test/integration/pages/Details.js` | Page object | Confirm, save, navigate back |
| `test/integration/NavigationJourney.js` | Navigation | Master → Details → Back |
| `test/integration/FilterJourney.js` | Filters | Apply filters, Go, Reset |
| `test/integration/opaTests.qunit.html` | Runner | All OPA journeys |

> Live test execution requires a running `ui5 serve` instance with backend proxy. Tests are structurally complete and ready to execute.

---

## Launchpad Integration

| Property | Value |
|---|---|
| Semantic Object | `ZPMORDERCONF` |
| Action | `DISPLAY_G` |
| Intent | `ZPMORDERCONF#DISPLAY_G` |
| FLP sandbox | `webapp/test/flpSandbox.html` |
| Startup parameters | `apptype`, `ordertype`, `orderID`, `technician` |
