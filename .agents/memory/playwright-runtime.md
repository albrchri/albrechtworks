---
name: Playwright browser runtime
description: Local Chromium dependencies can be missing even when Playwright is installed.
---

When adding browser checks, validate the user-facing flow with the browser testing environment even if local Playwright cannot launch because the container lacks native Chromium libraries.

**Why:** Playwright's npm package and browser download do not guarantee that every Linux runtime library is available in the shell environment; installing system dependencies can also mutate project configuration.

**How to apply:** Keep the committed test independent of temporary container setup, use the configured browser tester for end-to-end verification, and clean up any temporary runtime configuration before finishing.