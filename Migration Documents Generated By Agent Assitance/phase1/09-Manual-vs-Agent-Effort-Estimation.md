# Manual vs Agent Effort Estimation — Phase 1

**Date:** 2026-08-17

---

## Scope of Phase 1 Work

- Discovery across `manifest.json` (absent), `Component.js`, controllers, views, fragments, utilities, `localService`, `neo-app.json`, `package.json`, config files
- Live OData metadata retrieval and diff analysis against cached local metadata (GWD system)
- Deprecated API inventory (12+ patterns across `jQuery.sap.*`, `sap.ca.ui.*`, legacy routing)
- Technical debt, performance, security, and accessibility assessments
- Launchpad/FLP intent analysis
- Migration risk register and effort estimation

---

## Effort Comparison

| Task | Manual (Senior Dev) | Agent-Assisted |
|---|---|---|
| Manifest/component/controller/view discovery | 1 day | ~20 min |
| Live OData metadata retrieval + diffing | 0.5 day | ~5 min |
| Deprecated API inventory | 0.5 day | ~10 min |
| Technical debt / performance / security / accessibility assessment | 1 day | ~20 min |
| Launchpad/FLP analysis | 0.25 day | ~5 min |
| Risk register + effort estimation report | 0.5 day | ~10 min |
| **Total** | **~3.75 days** | **~1.2 hours (excl. human review)** |

> Add human review/approval gate time (~2 hours) per the standard workflow — actual Phase 1 elapsed time with review is approximately **0.5–1 day**.

---

## Effort Reduction

| Metric | Value |
|---|---|
| Manual Estimate | ~3.75 developer-days |
| Agent-Assisted (incl. human review) | ~0.5–1 day |
| Effort Reduction | **~75–85%** |

---

## Quality Observations

| Dimension | Manual | Agent-Assisted |
|---|---|---|
| Metadata freshness | Often relies on stale cached `metadata.xml` | Live GWD metadata pulled and diffed automatically |
| Deprecated API detection | Manual grep/search, easy to miss occurrences | Systematic regex-based search across entire codebase |
| Documentation completeness | Often abbreviated under time pressure | Full 9-document deliverable set produced in one pass |
