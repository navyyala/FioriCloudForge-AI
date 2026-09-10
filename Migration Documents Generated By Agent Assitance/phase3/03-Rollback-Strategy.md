# Rollback Strategy — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Level 1 — Git Rollback

### Branch Backup
```bash
# Current state preserved on branch 'webide'
git checkout webide   # restores original WebIDE source

# Create a tagged snapshot of the migrated state before deploying
git tag v1.1.0-migrated
git push origin v1.1.0-migrated
```

### Revert to WebIDE source
```bash
git checkout webide
# The original files are at this commit: 248c2a1
git checkout 248c2a1 -- .
```

### Rollback working tree to last clean commit
```bash
git reset --hard HEAD
git clean -fd
```

---

## Level 2 — Transport Rollback

### Object Recovery via SE01/SE09 (GWD System)
1. Open **SE01** or **SE10** in GWD client 100
2. Locate transport request for BSP app `ZGPM_ORDERCONF` in package `ZGPM_PM`
3. Release reverse transport to restore previous BSP application content
4. Verify BSP app version in **SE80 → BSP Applications → ZGPM_ORDERCONF**

### Manual BSP Object Recovery
```
Transaction: SE80
Repository Browser → BSP Applications → ZGPM_ORDERCONF
Right-click → Display History → Restore previous version
```

---

## Level 3 — Deployment Rollback

### Snapshot Before Deploy
Before running `npm run deploy`, create a BSP snapshot:
```bash
# Tag current migrated state
git tag v1.1.0-pre-deploy-$(Get-Date -Format yyyyMMdd)
git push origin --tags
```

### Restore Previous Release
```bash
# If deployment to GWD fails or introduces regression:
git checkout webide
npm run build
ui5 deploy --config ui5-deploy.yaml --yes
# This redeploys the original WebIDE content from the 'webide' branch
```

---

## Rollback Validation Checklist

| Check | Responsible | Validation Method |
|---|---|---|
| ✅ Git tag `v1.1.0-migrated` created | Developer | `git tag -l` |
| ✅ Branch `webide` preserved with original source | Developer | `git branch -a` |
| ✅ BSP app `ZGPM_ORDERCONF` exists on GWD before deploy | Basis | SE80 |
| ✅ Transport request documented before production deploy | Basis | SE01 |
| ✅ Test user available on GWQ for smoke test post-deploy | QA | GWQ login |

---

## Recovery Procedure (Quick Reference)

```
Symptom: App broken after deploy
Step 1: git checkout webide
Step 2: npm install
Step 3: npm run build
Step 4: ui5 deploy --config ui5-deploy.yaml --yes
Step 5: Clear browser cache, retest on GWQ
Step 6: Notify Basis to reverse transport if BSP rollback needed
```
