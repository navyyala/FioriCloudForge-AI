# Migration Assessment Report — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Application:** ZGPM_ORDERCONF (Corrective Order Confirmation)  
**Internal Namespace:** `PO_MAINTENANCE`  
**OData Service:** `ZGPM_CONFIRM_ORDER_SRV`

---

## 1. Current Landscape

| Parameter | Value |
|-----------|-------|
| Current UI5 Version | **1.71** (`neo-app.json` pinned `1.71.60`) |
| Target UI5 Version | **1.71.84** |
| Component Declared Version | `1.28.15` (stale, in `Component.js` metadata) |
| OData Version | **OData V2** |
| Migration Target | BAS / VS Code |
| Deployment | ABAP Repository — BSP **GWD** |
| Test System | **GWQ** |
| Application Type | **Freestyle UI5** (Master-Detail, no Fiori Elements) |

---

## 2. Application Architecture (As-Is)

```
PO_MAINTENANCE (Component)
├── view/
│   ├── Main.view.xml          ← App shell (sap.m.App)
│   ├── Master.view.xml        ← Order list / filter page
│   ├── Details.view.xml       ← Order detail / confirmation page
│   └── fragment/ (27 fragments)
├── util/
│   ├── messages.js            ← Error dialog handler
│   └── stockOutputHelper.js   ← Barcode scan + stock output
├── css/fullScreenStyles.css
├── i18n/ (6 locales: default/en/fr/de/es/pt)
└── localService/metadata.xml  ← OData V2 mock metadata
```

**Routing:** Legacy `sap.m.routing.RouteMatchedHandler` (deprecated)  
**Routes:** `main` (Master), `details/{entity}/:from:` (Details)

---

## 3. OData Service Analysis

**Service:** `ZGPM_CONFIRM_ORDER_SRV` — OData V2

### Entity Sets Identified

| Entity Set | Key Fields | Purpose |
|-----------|-----------|---------|
| `ORDERLISTSet` | `Aufnr` | Work order list (master) |
| `ORDERITEMSSet` | `Aufnr`, `Uvorn`, `Vornr` | Order operations |
| `GOODS_ISSUESet` | `Aufnr`, `Matnr`, `Quantity`, `Lgort`, `Bwtar`, `Returns` | Stock issue |
| `ATTACHSet` | `DocNum`, `Tplnr`, `Aufnr`, `Equnr`, `Dktxt` | Attachments |
| `doclistSet` | — | Document list |
| `OWNERSet` | `Pernr` | Technician/owner |
| `FUNCTIONSet` / `FUNCTIONCODESet` | `Codegruppe` / `Code` | Function catalog |
| `WORKGROUPSet` / `WORKTYPESet` | `Codegruppe` / `Code` | Failure catalog |
| `CAUSESet` / `CAUSECODESet` | `Codegruppe` / `Code` | Cause catalog |
| `TAKEOVERSet` | `Aufnr` | Order takeover |
| `IATFCountersSet` / `MaintCountersSet` | — | IATF/Maintenance counters |
| `SERIAL_NUMSet` | `Matnr`, `Sernr` | Serial numbers |
| `STORAGE_LOCSet` | `Werks`, `Lgort` | Storage locations |
| `MRO_LISTSet` | `Matnr` | Spare parts |
| `FUNCLOCEQUI` | `Tplnr`, `Equnr`, `ObjectType` | Functional loc + equipment |
| `ACTTYPESet` / `PRIORITYSet` / `REQUESTERSet` | — | Reference data |
| `ASSIGNMENT` | `Pernr` | Technician assignment (found after metadata refresh) |
| `DISPLAY_SETTINGS` | `Field` | Field-level display config |
| `PRINT_FORM` | `Aufnr` | PDF print form (binary stream) |
| `WORKCENTER` | `Verwe`, `Werks`, `Arbpl` | Work center value help |
| `EQUIPMENT_F4` | `Equnr`, `Spras` | Equipment value help |
| `FUNCLEVEL` / `FUNCPARENT` | — | Functional location hierarchy |
| `ordlistpopup` | Composite key | Confirmation history popup |
| `attach_d` | Composite key | Document attachment download stream |

### Navigation Properties
- `ORDERLIST → GOODS_ISSUESet` (`ORDER2GOODS_ISSUE`)
- `ORDERLIST → ORDERITEMSSet` (`ORDER2ITEMS`)
- `ORDERITEMS → TOCOMMENTS` (`ORDER2ITEMS_POP`) — found after metadata refresh
- `ASSIGNMENT → TAKEOVER` (`ASSIGN2TAKEOVER`) — found after metadata refresh

### Metadata Integrity (validated against live GWD system)
- All entity properties marked `sap:creatable="false" sap:updatable="false" sap:sortable="false" sap:filterable="false"` — filtering/sorting handled client-side
- `useBatch: false` explicitly set in `Component.js` — no `$batch` grouping (performance risk)
- Live metadata refresh from GWD revealed **key changes** on `MRO_LIST` and `STORAGE_LOC` (see Migration Impact Analysis) not reflected in the local cached metadata

---

## 4. Application Type & Technical Options

| Item | Assessment |
|---|---|
| Application Type | Freestyle UI5 (not Fiori Elements) |
| Optimization Required | Yes — `useBatch`, async fragment loading |
| Performance Improvements Required | Yes — batch requests, `$select`, fragment lazy loading |
| Accessibility Improvements Required | Yes — missing ARIA labels, tooltips on icon buttons |

---

## 5. Launchpad Analysis

| Parameter | Value |
|---|---|
| Semantic Object | `ZPMORDERCONF` |
| Action | `DISPLAY_G` |
| Tile Type | DynamicTile |
| Dynamic Count URL | `/sap/fiori/pomaintenance/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/ORDERLISTSet/$count` |
| Startup Parameters | `apptype` (C/P), `ordertype` (ZM16–ZM19), `orderID`, `technician` |

**Issues found:**
- `intentSemanticObject`/`intentAction` not present in any `manifest.json` (none existed pre-migration)
- Dynamic tile service URL uses non-standard path prefix
- No `sap.app.crossNavigation` defined pre-migration

---

## 6. Compare Against Target Architecture

| File/Folder | Status Before Migration |
|---|---|
| `manifest.json` | **MISSING** |
| `package.json` | **MISSING** |
| `ui5.yaml` | **MISSING** |
| `ui5-deploy.yaml` | **MISSING** |
| `webapp/` structure | Not present — source at project root |
| `.gitignore` | **MISSING** |
| `test/unit/`, `test/integration/` | **MISSING** |
| Mock server config | **MISSING** |

---

## 7. Technical Debt Assessment

### Deprecated APIs (HIGH severity)

| Issue | Location |
|-------|----------|
| `jQuery.sap.declare()` | `Component.js`, `messages.js` |
| `jQuery.sap.require()` | `Component.js`, `Master.controller.js`, `Details.controller.js` |
| `jQuery.sap.getModulePath()` | `Component.js` |
| `jQuery.sap.startsWith()` | `messages.js` |
| `sap.m.routing.RouteMatchedHandler` | `Component.js` |
| `sap.ca.ui.message` / `sap.ca.ui.model.format.AmountFormat` | `messages.js`, controllers |
| `sap.ui.view()` (synchronous) | `Component.js` |
| `sap.ui.xmlfragment()` (synchronous, ~20 calls) | `Details.controller.js` |
| `sap.ui.component()` | Both controllers |
| `sap.ui.getCore().byId()` | `Master.controller.js` |
| `attachRoutePatternMatched` | Both controllers |

### Architecture Issues (HIGH severity)

| Issue | Location |
|-------|----------|
| Mixed module loading (`jQuery.sap.require` + `sap.ui.define` in same file) | `Details.controller.js` |
| Global variable `var that;` | `Master.controller.js` |
| `this.oView` used instead of `this.getView()` | `Details.controller.js` |
| No `manifest.json` / `package.json` / `ui5.yaml` | Root |
| `Component-preload.js` checked into source control | Root |
| Inline bootstrap script in `index.html` | `index.html` |
| `useBatch: false` | `Component.js` |
| `sizeLimit(1000)` override | `Master.controller.js` |
| Deep synchronous fragment loading at `onInit` (8+ fragments) | `Details.controller.js` |
| Fragment re-creation without destroy checks | `Details.controller.js` |

### Dead / Commented Code
- Extensive commented-out blocks in `Master.controller.js` and `Details.controller.js`
- Several `// debugger;` statements present

### Tight Coupling
- `Details.controller.js` is **~3200 lines** — single oversized controller
- Fragment IDs manually concatenated from view ID (fragile)
- `stockOutputHelper.js` assumes specific controller context (`this._frgIdAddArticleDialog`)

---

## 8. Validation Results

### UI5 Demo Kit Compliance
- MVC pattern followed, but controller size and mixed loading violate best practices
- Binding strategy mostly two-way OData — acceptable
- Fragment reuse present but instantiated synchronously

### SAP Fiori Guidelines
- UI Consistency: acceptable (`sap.m` controls throughout)
- Navigation Standards: legacy `RouteMatchedHandler` non-compliant
- Fiori UX: acceptable

### Security
- No `innerHTML`, `eval`, or `localStorage` usage found — clean
- Hardcoded OData service URL in `Component.js` + `uploadUrl` in attachments fragment
- No verified CSRF token handling with `useBatch: false`

### Accessibility
- Missing ARIA labels on filter ComboBoxes
- `Label` controls not associated via `labelFor`
- No tooltips on icon-only buttons (print, add-product)
- `core:View` used instead of typed `mvc:View`

---

## 9. Performance Assessment

| Area | Finding | Risk |
|------|---------|------|
| `useBatch: false` | Individual HTTP calls per OData operation | HIGH |
| No `$select` | Full payloads fetched | MEDIUM |
| No `$expand` optimization | `TOITEMS` navigation loaded separately | MEDIUM |
| 8 fragments loaded synchronously at `onInit` | Blocks UI thread at startup | HIGH |
| Fragment re-creation on navigation | No lazy load + no destroy | HIGH |
| `sizeLimit(1000)` | Forces 1000-row client-side data | MEDIUM |
| `refresh(true)` on route match | Always forces full reload | MEDIUM |
| DynamicTile polling every 10s | `refreshInterval: 10` | LOW |

---

## 10. Test Assessment

| Test Type | Status |
|-----------|--------|
| Unit Tests | **MISSING** |
| QUnit Tests | **MISSING** |
| OPA5 Integration Tests | **MISSING** |
| Mock Server | **MISSING** |
| FLP Sandbox | Present (`test/fioriSandbox.html`) — basic only |

**Gap:** Zero automated test coverage pre-migration.

---

## Deliverables Index

1. This document — Migration Assessment Report
2. [02-Migration-Impact-Analysis.md](02-Migration-Impact-Analysis.md)
3. [03-Technical-Debt-Report.md](03-Technical-Debt-Report.md)
4. [04-Modernization-Opportunities.md](04-Modernization-Opportunities.md)
5. [05-Performance-Improvement-Report.md](05-Performance-Improvement-Report.md)
6. [06-Security-Assessment.md](06-Security-Assessment.md)
7. [07-Accessibility-Assessment.md](07-Accessibility-Assessment.md)
8. [08-Migration-Risks.md](08-Migration-Risks.md)
9. [09-Manual-vs-Agent-Effort-Estimation.md](09-Manual-vs-Agent-Effort-Estimation.md)
