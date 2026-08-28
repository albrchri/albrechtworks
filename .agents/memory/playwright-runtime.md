---
name: Playwright browser runtime
description: Local Chromium dependencies can be missing even when Playwright is installed.
---

On Replit, install Playwright browser binaries with `playwright install chromium` and provide Chromium's native runtime libraries through Nix. Do not use Playwright's `--with-deps` option.

**Why:** `--with-deps` attempts an apt/sudo install that Replit blocks. Downloading Chromium alone is also insufficient when libraries such as GLib or libgbm are absent.

**How to apply:** For release browser checks, commit the required Nix packages as workspace system dependencies, download the Playwright-managed Chromium build in the release test command, and verify that exact registered validation command.