---
name: Diagnostic conversion authority
description: Defines which system is authoritative for paid diagnostic counts and why browser analytics is not.
---

Treat the idempotent server-side conversion store as the authoritative count of paid diagnostics. Keep the browser `diagnostic_purchase_completed` event for comparable funnel reporting, but do not use it as the purchase ledger.

**Why:** Replit-hosted website analytics has no documented trusted server-side custom-event ingestion API. Relaying webhook conversions through anonymous browsers cannot guarantee both delivery and at-most-once analytics emission.

**How to apply:** Build purchase totals and reconciliation from the server conversion records. Keep browser analytics payloads aggregate-only and do not relay Checkout Session identifiers or payment/customer details to analytics.