---
name: Footer link hover styling
description: Why the footer privacy link uses an explicit CSS hover rule instead of a Tailwind utility.
---

Keep the footer Privacy Policy control’s inherited typography and hover underline in an explicit CSS rule rather than replacing it with Tailwind text-decoration utilities.

**Why:** The generated development CSS contained the expected utility selector, but the browser’s active stylesheet did not apply it even while the element matched `:hover`. Removing competing utilities did not resolve the issue; an explicit rule did.

**How to apply:** When adjusting this footer control, preserve inherited color and font properties, no underline at rest, and a direct `:hover` underline rule. Verify computed styles after a full page reload.