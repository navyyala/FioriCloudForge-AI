# Test Coverage Report — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17

---

## Coverage Before Migration

| Test Type | Status |
|---|---|
| Unit Tests (QUnit) | **None** |
| OPA5 Integration Tests | **None** |
| Mock Server | **None** |
| FLP Sandbox | Basic (`test/fioriSandbox.html`), no automated assertions |

---

## Coverage After Migration (Scaffolded)

### Unit Tests (QUnit)

| File | Test Count | Coverage |
|---|---|---|
| `webapp/test/unit/controller/Master.controller.js` | 9 | `formatTime`, `removeLeadingZeros`, `Filter`/`FilterOperator` construction, assignment model state (technician, assigned/unassigned status mapping) |
| `webapp/test/unit/controller/Details.controller.js` | 11 | `userMode`/`displaySettings` model state, order entity property access, deferred group key validation, entity path parsing, IATF filter construction (with/without equipment) |
| `webapp/test/unit/util/messages.js` | 5 | `_parseError` (event-based and plain-response variants), `getErrorContent`, native `String.startsWith` verification (confirms `jQuery.sap.startsWith` removal) |
| **Total** | **25 tests** | |

### Runner Infrastructure
- `webapp/test/unit/unitTests.qunit.html` — QUnit 2 test page with `sap-ui-bootstrap`
- `webapp/test/unit/unitTests.qunit.js` — module loader referencing all 4 test suites

### OPA5 Integration Tests (Scaffolded)

| File | Purpose |
|---|---|
| `webapp/test/integration/pages/Master.js` | Page object — search, filter, select order actions/assertions |
| `webapp/test/integration/pages/Details.js` | Page object — confirm, save, navigate back actions/assertions |
| `webapp/test/integration/NavigationJourney.js` | Journey — Master → Details → Back |
| `webapp/test/integration/FilterJourney.js` | Journey — apply filters, press Go, press Reset |
| `webapp/test/integration/opaTests.qunit.html` | OPA5 test runner |

---

## Coverage Gaps (Not Yet Covered)

| Area | Gap |
|---|---|
| CRUD write operations (confirm, save, delete stock output) | No live OData mock server configured — write-path tests are structural only, not executed against real/mock backend |
| Value help dialogs (Functional Location, Equipment) | Page object scaffolding exists but full assertion coverage not yet written |
| Attachment upload | No test coverage |
| Barcode scan | No test coverage (requires device/browser API mocking) |
| Cross-app navigation (FLP) | Manual FLP sandbox testing only — no automated OPA5 journey for this |

---

## Recommendations

1. Add a UI5 Mock Server configuration (`localService/mockserver.js`) to enable full OPA5 CRUD journey execution without a live backend dependency.
2. Expand `Details.controller.js` unit tests to cover confirmation submission logic once mock server is available.
3. Add OPA5 journeys for value help dialogs and attachment upload as a follow-up increment.
4. Execute all scaffolded tests via `npm run start-local` + QUnit runner to establish a baseline pass/fail report (not yet executed in this migration cycle — requires running UI5 Tooling server).
