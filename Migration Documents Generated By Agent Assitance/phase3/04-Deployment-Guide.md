# Deployment Guide — ZGPM_ORDERCONF

**Date:** 2026-08-17  
**Target System:** GWD — `http://sdctwd0024.ad.ponet:8000`, client 100  
**BSP App:** `ZGPM_ORDERCONF`  
**ABAP Package:** `ZGPM_PM`

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 LTS |
| npm | ≥ 9 |
| @ui5/cli | ^4.0.62 |
| @sap/ux-ui5-tooling | ^1.30.0 |
| Network access to GWD/GWQ | Required |

---

## Installation

```bash
cd "d:\Nagamani\CMMS code\ZGPM_ORDERCONF"
npm install
```

---

## Local Development (Mock / Proxy)

### Against GWD backend (recommended)
```bash
npm run start-local
# Opens: http://localhost:8080/index.html
# Proxy: /sap → http://sdctwd0024.ad.ponet:8000
```

### Against GWQ test system
```bash
npm run start-gwq
```

### Order-type specific test URLs
```bash
npm run start-corrective    # apptype=C, ordertype=ZM17
npm run start-preventive    # apptype=P, ordertype=ZM16
npm run start-predictive    # apptype=P, ordertype=ZM19
npm run start-maintenance   # apptype=P, ordertype=ZM18
```

---

## Build

```bash
npm run build
# Output: dist/
```

> **Note:** `ui5 build` requires `@sapui5/distribution-metadata` for version resolution.
> SAPUI5 1.71.84 is not available via npm CDN — the build command will fail in an offline/restricted environment.
> **Workaround:** Use `ui5 serve` with proxy for development; for production deployment use `ui5 deploy` which does not require a local build artefact.

---

## Deployment to GWD

```bash
npm run deploy
# Equivalent to: npm run build && ui5 deploy --config ui5-deploy.yaml --yes
```

### ui5-deploy.yaml configuration
```yaml
specVersion: "3.1"
metadata:
  name: zgpm-orderconf
type: application
builder:
  customTasks:
    - name: deploy-to-abap
      afterTask: generateVersionInfo
      configuration:
        target:
          url: http://sdctwd0024.ad.ponet:8000
          client: "100"
        app:
          name: ZGPM_ORDERCONF
          package: ZGPM_PM
          description: Corrective Order Confirmation
        credentials:
          username: env:FIORI_DEPLOY_USER
          password: env:FIORI_DEPLOY_PASSWORD
```

Set credentials as environment variables before deploying:
```powershell
$env:FIORI_DEPLOY_USER = "your_user"
$env:FIORI_DEPLOY_PASSWORD = "your_password"
npm run deploy
```

---

## Post-Deployment Verification

1. Open GWD Fiori Launchpad
2. Navigate to intent: `ZPMORDERCONF#DISPLAY_G`
3. Verify app loads with order list
4. Test corrective order (`?apptype=C&ordertype=ZM17`) and confirm navigation to details
5. Verify OData calls to `/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/` succeed (Network tab)

---

## Transport to Production

After GWD validation:
1. Release the transport request created during BSP deployment (SE01)
2. Import transport into GWP/GPD system via SE09/STMS
3. Repeat smoke test on production Fiori Launchpad
