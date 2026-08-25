---
name: Resend sender verification
description: Resend delivery constraint for the site contact form sender identity.
---

The contact form must use Resend’s default verified sender until the branded domain is verified in the connected Resend account.

**Why:** Resend rejects unverified branded sender domains with a 403 validation error, even when the form recipient is valid.

**How to apply:** Once the domain is verified in Resend, change the contact form’s sender to the branded address and perform one end-to-end delivery check.