# Regression Test Specification — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Version:** Post-migration (UI5 Tooling)

---

## Before / After Migration Comparison

| Feature | Before (WebIDE 1.71.60) | After (UI5 Tooling 1.71.84) | Status |
|---|---|---|---|
| App bootstrap | `neo-app.json` + inline model init in `Component.js` | `manifest.json` + `ComponentSupport` | ✅ Equivalent |
| Routing | `sap.m.routing.RouteMatchedHandler` | Manifest-driven `sap.m.routing.Router` | ✅ Equivalent |
| OData service | `/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/` | Same — proxy via `ui5-gwq.yaml` | ✅ Equivalent |
| Model init | Inline in `Component.js` | Declarative in `manifest.json` | ✅ Equivalent |
| Fragment loading | `sap.ui.xmlfragment()` | `sap.ui.xmlfragment()` (retained) | ✅ Same |
| i18n bundle | `PO_MAINTENANCE.i18n.messageBundle` | Same in manifest | ✅ Equivalent |
| Error handling | `sap.ca.ui.message.showMessageBox` | `sap.m.MessageBox.error` | ✅ Improved |
| Amount format | `sap.ca.ui.model.format.AmountFormat` | `sap.ui.core.format.NumberFormat` | ✅ Equivalent |
| Route handler attach | `attachRoutePatternMatched` on router | `getRoute("main").attachPatternMatched` | ✅ Fixed |
| Barcode scan | `sap/ndc/BarcodeScanner` (sync require) | `sap.ui.require` lazy load | ✅ Improved |

---

## Test Scenarios

### 1. Routing

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| R-01 | App loads with `?apptype=C&ordertype=ZM17` | Master list renders, corrective filters visible | High |
| R-02 | App loads with `?apptype=P&ordertype=ZM16` | Master list renders, preventive filters visible | High |
| R-03 | Click order row in Master | Navigates to Details view with order context bound | High |
| R-04 | Press back in Details | Returns to Master list | High |
| R-05 | Direct URL to Details without Master | Graceful fallback or redirect | Medium |

### 2. CRUD Operations

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| C-01 | Load order items | `ORDERITEMSSet` read with Aufnr filter | High |
| C-02 | Confirm order (final) | `POST` to `ORDERLISTSet` with `Finconf=true` | High |
| C-03 | Save partial confirmation | OData batch submit with deferred group | High |
| C-04 | Delete stock output entry | `DELETE` on `GOODS_ISSUESet` entry | High |
| C-05 | Add goods issue | `POST` to `GOODS_ISSUESet` | Medium |
| C-06 | Update IATF counter | Batch update via `editIATF` deferred group | Medium |

### 3. Search & Filters

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| F-01 | Press Go with no filters | Full `ORDERLISTSet` loaded | High |
| F-02 | Filter by date range | `Date ge X and Date le Y` filter applied | High |
| F-03 | Filter by Function Category | `Codegruppe` filter; Function Code combo enabled | Medium |
| F-04 | Filter by Cause Category | `CAUSESet` filter; Cause Code combo enabled | Medium |
| F-05 | Press Reset | All filters cleared, list reset | High |
| F-06 | Search field | Client-side search on `Aufnr`, `Ktext` | Medium |

### 4. Value Helps

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| VH-01 | Functional Location value help | Dialog opens, search works, selection fills input | High |
| VH-02 | Equipment value help | Dialog opens, search works, selection fills input | High |
| VH-03 | Equipment barcode scan | Scanner opens, result fills equipment field | Medium |

### 5. Navigation

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| N-01 | FLP back navigation | `sap.ushell.Container.getService("CrossApplicationNavigation").backToPreviousApp()` | High |
| N-02 | No FLP present | `window.history.go(-1)` fallback | Medium |
| N-03 | Cross-app navigation | Intent `ZPMORDERCONF-DISPLAY_G` resolves | High |

### 6. Tables

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| T-01 | Master table multi-select | Rows selectable, assignment button enabled for admin | High |
| T-02 | Items table renders per order | `ORDERITEMSSet` filtered by `Aufnr` | High |
| T-03 | Stock output table | `GOODS_ISSUESet` filtered and rendered | Medium |
| T-04 | Sort by date | `DateSorter` dialog, sort applied | Low |

### 7. Dialogs & Fragments

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| D-01 | Add article dialog | Opens, barcode scan works, article added | Medium |
| D-02 | Confirm dialog | Press confirm, validation runs, OData submit | High |
| D-03 | Add comment dialog | Text input saved to order | Medium |
| D-04 | Pokayoke dialog | Code entry validated before confirm | High |
| D-05 | Attachment upload | File selected and uploaded | Medium |

### 8. Message Handling

| ID | Scenario | Expected | Priority |
|---|---|---|---|
| M-01 | OData error response | `MessageBox.error` with parsed backend message | High |
| M-02 | Validation failure | Inline `ValueState.Error` on input | High |
| M-03 | Success confirmation | `MessageToast` displayed | Medium |
