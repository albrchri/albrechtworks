---
name: Phone input verification
description: Testing guidance for progressive phone formatting where separators include a trailing space.
---

Assert progressive phone-input values character-for-character, including the normal ASCII space after a completed three-digit area code.

**Why:** Visual screenshots and loosely formatted test output can hide or trim the required trailing separator even when the controlled input is correct.

**How to apply:** Use JSON.stringify(input.value), length, and character-code checks when validating intermediate phone values such as `(847) `.