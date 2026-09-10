# New Files Report — ZGPM_ORDERCONF (Phase 2)

**Date:** 2026-08-17

---

## Project Configuration

| File | Purpose |
|---|---|
| [package.json](../../package.json) | npm scripts: `start`, `start-local`, `start-gwq`, `start-corrective`, `start-preventive`, `start-predictive`, `start-maintenance`, `build`, `deploy`, `lint` |
| [ui5.yaml](../../ui5.yaml) | UI5 Tooling base config — SAPUI5 1.71.84, libraries declared |
| [ui5-local.yaml](../../ui5-local.yaml) | Local dev proxy → GWD (`http://sdctwd0024.ad.ponet:8000`) |
| [ui5-gwq.yaml](../../ui5-gwq.yaml) | Test system proxy → GWQ (`https://sdctwq0127.ad.ponet`) |
| [ui5-deploy.yaml](../../ui5-deploy.yaml) | ABAP deploy task — BSP `ZGPM_ORDERCONF`, package `ZGPM_PM`, target GWD |
| [.gitignore](../../.gitignore) | Excludes `node_modules/`, `dist/`, `Component-preload.js` |

## VS Code / BAS Integration

| File | Purpose |
|---|---|
| `.vscode/settings.json` | Editor formatting, XML/JS formatter associations |
| `.vscode/launch.json` | Chrome debug configs for GWD and GWQ |
| `.vscode/tasks.json` | Build/serve/deploy task definitions |

## Application Descriptor

| File | Purpose |
|---|---|
| `webapp/manifest.json` | Routes (`main`, `details`), 13 models, `mainService` datasource, FLP `crossNavigation` (`ZPMORDERCONF-DISPLAY_G`), resources |
| `webapp/index.html` | Standard UI5 Tooling async bootstrap with `ComponentSupport` |

## Test Infrastructure

| File | Purpose |
|---|---|
| `webapp/test/flpSandbox.html` | FLP sandbox entry point for `ZPMORDERCONF-DISPLAY_G` intent |
| `webapp/test/unit/unitTests.qunit.html` | QUnit test runner page |
| `webapp/test/unit/unitTests.qunit.js` | QUnit test module loader |
| `webapp/test/unit/controller/Master.controller.js` | 9 unit tests — formatters, filter building, assignment model state |
| `webapp/test/unit/controller/Details.controller.js` | 11 unit tests — model state, deferred groups, IATF filter construction |
| `webapp/test/unit/util/messages.js` | 5 unit tests — `_parseError`, `getErrorContent` |
| `webapp/test/integration/*` | OPA5 page objects and journeys (Navigation, Filter) |

## Documentation

| File | Purpose |
|---|---|
| `docs/phase1/*.md` | 9 Phase 1 discovery/assessment documents |
| `docs/phase2/*.md` | 7 Phase 2 implementation documents (this set) |
| `docs/phase3/*.md` | 8 Phase 3 validation/rollback/design documents |
