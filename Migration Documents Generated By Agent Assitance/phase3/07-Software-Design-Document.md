# Software Design Document — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Application:** Corrective Order Confirmation  
**Namespace:** `PO_MAINTENANCE`

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SAP Fiori Launchpad                 │
│         Intent: ZPMORDERCONF#DISPLAY_G               │
└───────────────────────┬─────────────────────────────┘
                        │ startup params: apptype, ordertype, orderID, technician
                        ▼
┌─────────────────────────────────────────────────────┐
│               SAPUI5 Component (PO_MAINTENANCE)      │
│               Component.js + manifest.json           │
├─────────────────────────────────────────────────────┤
│  Router (sap.m.routing.Router)                       │
│   ├── Route "main"          → Master view            │
│   └── Route "{entity}/:from:" → Details view         │
├──────────────┬──────────────────────────────────────┤
│  Master View │  Details View                         │
│  (Order List)│  (Order Confirmation)                 │
│              │   ├── 27 Fragments                    │
│              │   ├── stockOutputHelper mixin         │
│              │   └── messages utility                │
└──────┬───────┴──────────────┬──────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────────────────────────────────────────────┐
│           OData V2 Model (sap.ui.model.odata.v2)     │
│   Service: ZGPM_CONFIRM_ORDER_SRV                    │
│   Path: /sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/  │
│   Batch: true   Groups: editIATF, OrderList,         │
│                         OrderItems, editMaintCounter  │
└─────────────────────────────────────────────────────┤
                          │
                          ▼
              SAP Backend (ABAP / GWD)
```

---

## Components

| Component | File | Responsibility |
|---|---|---|
| `Component` | `webapp/Component.js` | Bootstrap, device model, display settings read |
| `Main.controller` | `webapp/controller/Main.controller.js` | Shell wrapper, compact mode |
| `Master.controller` | `webapp/controller/Master.controller.js` | Order list, filters, search, sort |
| `Details.controller` | `webapp/controller/Details.controller.js` | Order detail, items, attachments, confirmation |
| `messages` | `webapp/util/messages.js` | OData error parsing and display |
| `stockOutputHelper` | `webapp/util/stockOutputHelper.js` | Goods issue delete, barcode scan |

### Views
| View | Controller | Purpose |
|---|---|---|
| `App.view.xml` | `Main.controller` | Shell NavContainer |
| `Master.view.xml` | `Master.controller` | Order list + filter bar |
| `Details.view.xml` | `Details.controller` | Order confirmation form |
| `NotFound.view.xml` | `NotFound.controller` | 404 fallback |

### Fragments (27)
Located in `webapp/view/fragment/`. Key fragments:

| Fragment | Purpose |
|---|---|
| `addArticle` | Add spare part to goods issue |
| `addComments` | Add order comment |
| `addEditItem` | Edit order operation item |
| `attachments` | View/upload attachments |
| `condition` | Condition catalog picker |
| `ConfirmDialog` | Final confirmation dialog |
| `details` | Additional order detail fields |
| `FunctionalLocationValueHelp` | F4 for functional location |
| `hierarchyDialog` | Location/equipment hierarchy |
| `pokayokeCode` | Pokayoke validation entry |

---

## Models

| Model Name | Type | Purpose |
|---|---|---|
| *(default)* | `sap.ui.model.odata.v2.ODataModel` | Main OData service |
| `orderitem` | `JSONModel` | Order items local cache |
| `i18n` | `ResourceModel` | `PO_MAINTENANCE.i18n.messageBundle` |
| `device` | `JSONModel` | `sap.ui.Device` capabilities |
| `displaySettings` | `JSONModel` | `DISPLAY_SETTINGSSet` from backend |
| `userMode` | `JSONModel` | `{admin: false, edit: false}` |
| `messageModel` | `sap.ui.core.message.MessageModel` | OData message manager |
| `PokayokeModel` | `JSONModel` | Pokayoke codes state |
| `assignment` | `JSONModel` | Technician assignment state |
| `checkBoxModel` | `JSONModel` | Item checkbox states |
| `serialNumber` | `JSONModel` | Serial number entries |
| `external` | `JSONModel` | External reference data |
| `confirmText` | `JSONModel` | Confirmation text state |

---

## Services

| Service | Path | Version |
|---|---|---|
| `ZGPM_CONFIRM_ORDER_SRV` | `/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/` | OData V2 |

Key EntitySets: `ORDERLISTSet`, `ORDERITEMSSet`, `GOODS_ISSUESet`, `ATTACHSet`, `IATFCountersSet`, `MaintCountersSet`, `DISPLAY_SETTINGSSet`, `FUNCTIONSet`, `FUNCTIONCODESet`, `CAUSESet`, `CAUSECODESet`, `WORKGROUPSet`, `WORKTYPESet`, `OWNERSet`, `PRIORITYSet`, `WORKCENTERSet`, `STORAGE_LOCSet`, `SERIAL_NUMSet`

---

## Deployment Architecture

```
Developer Machine
      │
      │ npm run deploy
      ▼
UI5 CLI (deploy-to-abap)
      │
      │ HTTP PUT (BSP upload)
      ▼
GWD ABAP Server
  BSP App: ZGPM_ORDERCONF
  Package: ZGPM_PM
      │
      │ Transport
      ▼
Production ABAP Server
```
