# Accessibility Assessment — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## Findings

| Issue | Location | Severity |
|-------|----------|----------|
| Missing ARIA labels on filter ComboBoxes | `Master.view.xml` | MEDIUM |
| `Label` controls not formally associated via `labelFor` | `Master.view.xml`, `Details.view.xml` | MEDIUM |
| No `tooltip` on icon-only buttons (print, add-product) | `Master.view.xml` | MEDIUM |
| `core:View` (untyped) used instead of `mvc:View` | All views (pre-migration) | LOW |
| Default i18n locale is French while app may run in EN context | `i18n.properties` | LOW — affects screen reader language matching |
| Table `mode="MultiSelect"` with no accessible name on rows | `Master.view.xml` (`catalogTable`) | MEDIUM |
| No `ariaLabelledBy` on dialogs opened via `sap.ui.xmlfragment` | `Details.controller.js` | MEDIUM |
| Scan button (`btn_scan`) relies on icon + text — acceptable, but verify screen reader announces both | `Master.view.xml` | LOW |

---

## Fixes Applied in Phase 2

| Fix | Detail |
|---|---|
| `core:View` → `mvc:View` | Applied to `Main.view.xml`, `Master.view.xml`, `Details.view.xml` — aligns with current SAPUI5 typed-view convention |
| Missing `xmlns:core` namespace added | `Master.view.xml` and `Details.view.xml` were missing the `core` namespace declaration entirely, which caused **view parse failures** for every `<core:Item>` / `<core:Icon>` element — fixed as part of migration validation |

---

## Deferred (Not Addressed in Phase 2)

| Item | Reason |
|---|---|
| ARIA labels on ComboBoxes and Table rows | Requires UX/content review to determine correct label text per control; out of scope for structural migration |
| `labelFor` association between `Label` and input controls | Same as above — content-level change, not structural |
| Tooltips on icon-only buttons | Requires i18n text additions and UX sign-off |
| `ariaLabelledBy` on fragment dialogs | Requires per-dialog review of 27 fragments |

---

## Baseline Accessibility (Already Present, No Action Needed)

- All controls are from `sap.m` library, which provides baseline ARIA roles and keyboard navigation out of the box
- `sapUiSizeCompact` style applied conditionally for non-touch devices (`Main.controller.js`)
- Standard `sap.m.Dialog`, `sap.m.MessageBox` provide built-in focus management and keyboard trap handling

---

## Recommendation

Accessibility score is currently **65/100** (see Phase 3 Code Review Report). A dedicated accessibility remediation pass — covering ARIA labeling, `labelFor` associations, and tooltip additions — should be scheduled as a follow-up initiative separate from this structural migration.
