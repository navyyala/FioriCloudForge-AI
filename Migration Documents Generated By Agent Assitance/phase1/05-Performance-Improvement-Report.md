# Performance Improvement Report — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Findings (Pre-Migration)

| Area | Finding | Risk |
|------|---------|------|
| OData batching | `useBatch: false` — every OData call is a discrete HTTP request | HIGH |
| `$select` usage | None — full entity payloads fetched on every read | MEDIUM |
| `$expand` usage | None — `TOITEMS`/`GOODS_ISSUESet` navigation loaded via separate calls | MEDIUM |
| Fragment loading | 8+ fragments loaded synchronously in `Details.controller.js onInit` | HIGH |
| Fragment lifecycle | Re-created without destroy checks in several dialog handlers | HIGH — memory leak risk |
| Table sizing | `sizeLimit(1000)` override in `Master.controller.js` | MEDIUM |
| Refresh strategy | `refresh(true)` forces full reload on every route match | MEDIUM |
| Tile polling | DynamicTile `refreshInterval: 10` (10s) polling `/ORDERLISTSet/$count` | LOW |
| Rendering | No lazy loading / pagination on order list table | MEDIUM |

---

## Improvements Applied in Phase 2

| Improvement | Detail | Impact |
|---|---|---|
| `useBatch: true` | Enabled in `manifest.json` for both default and `orderitem` models | Reduces individual HTTP calls; groups writes into deferred batch groups (`editIATF`, `OrderList`, `OrderItems`, `editMaintCounter`) |
| Async bootstrap | `data-sap-ui-async="true"` in `index.html` | Non-blocking resource loading at startup |
| Selective model preload | `orderitem` model set `preload: false` in manifest (loaded on demand) | Avoids loading order-item data before it's needed |
| Lazy barcode scanner | `sap.ui.require(["sap/ndc/BarcodeScanner"], ...)` instead of sync `jQuery.sap.require` | Scanner library only loaded when scan action triggered |
| Fragment null-guard | `onItemsLoaded` now checks fragment existence before calling `.getItems()` | Prevents runtime crash discovered during smoke testing |

---

## Deferred Improvements (Documented, Not Applied)

| Improvement | Reason for Deferral |
|---|---|
| Async fragment loading via `Fragment.load()` | 25+ call sites; requires full Promise-based refactor across Details/Master controllers — high regression risk |
| `$select` on `ORDERLISTSet`/`ORDERITEMSSet` reads | Requires backend team confirmation of all consumed fields across 27 fragments |
| Pagination/growing on Master order list table | `growing="false"` currently set; changing requires UX sign-off on infinite scroll vs. full load behavior |
| Replace `UploadCollection` with `UploadSet` | Not yet deprecated on UI5 1.71; low urgency |

---

## Recommended Follow-Up Monitoring

| Metric | Target |
|---|---|
| Number of discrete OData HTTP requests per Details page load | Should decrease after batch grouping takes effect |
| Time-to-interactive on Details view | Should improve slightly from async bootstrap; will not improve materially until fragment loading is made async |
| Memory usage across repeated Master ⇄ Details navigation | Monitor for leaks from fragment re-creation pattern (partially mitigated, not fully resolved) |
