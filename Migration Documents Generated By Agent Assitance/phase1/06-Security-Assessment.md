# Security Assessment — ZGPM_ORDERCONF

**Date:** 2026-08-17

---

## OWASP-Aligned Review

| Risk Area | Finding | Severity |
|---|---|---|
| XSS (Cross-Site Scripting) | No `innerHTML`, `.html()`, or unsanitized `setHtmlText()` usage found in any controller | ✅ None found |
| Unsafe HTML usage | None found | ✅ None found |
| `eval()` / `new Function()` | None found | ✅ None found |
| Local storage / session storage | None found — no client-side sensitive data persistence | ✅ None found |
| Hardcoded service URL | `/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/` hardcoded in `Component.js`; also in attachments fragment `uploadUrl` | MEDIUM |
| CSRF token handling | `useBatch: false` (pre-migration) with direct OData calls — CSRF token behavior not explicitly verified in code | MEDIUM |
| Global variable pollution | `var that;` at module scope in `Master.controller.js` (pre-migration) | LOW |
| i18n binding literal misuse | `MessageToast.show("{i18n>scanned}: " + oResult.text)` — i18n binding syntax used as plain string literal, not resolved via ResourceBundle | LOW |
| Sensitive data exposure | No credentials, API keys, or tokens found in source | ✅ None found |
| Third-party library risk | `sap.ca.ui` — retired/unmaintained SAP library | MEDIUM |

---

## Fixes Applied in Phase 2

| Fix | Detail |
|---|---|
| Removed `sap.ca.ui.message` dependency | Eliminated retired/unmaintained library surface area |
| `useBatch: true` enabled | OData requests now batched — CSRF token handling delegated to standard `ODataModel` batch flow, which is SAP's supported CSRF pattern |
| Removed global `var that` | Controller state now scoped to `this` — reduces risk of cross-instance state leakage |

---

## Residual Risks (Not Addressed — Out of Scope)

| Risk | Recommendation |
|---|---|
| Hardcoded OData service URL in `uploadUrl` (attachments fragment) | Should be resolved dynamically from the model's service URL at runtime in a follow-up change |
| i18n binding string literal bug in `stockOutputHelper.js` (`MessageToast.show("{i18n>scanned}...")`) | Should be replaced with actual `getResourceBundle().getText(...)` call — functional bug, not a security defect, but flagged here since it was found during this review |

---

## Conclusion

No critical (High/Critical) OWASP Top 10 vulnerabilities were identified in the application. All findings are Medium or Low severity and relate to hardcoded configuration values and a retired library dependency, both addressed or documented for follow-up.
