---
name: Framer Motion animation typing
description: A TypeScript compatibility note for animated React pages in this workspace.
---

When a Framer Motion variant uses cubic-bezier values as a numeric array, type the shared variant as `Variants` so the current Motion type definitions preserve the easing shape.

**Why:** The installed Motion typings can infer an untyped easing array as `number[]`, which is rejected even though the runtime animation is valid.

**How to apply:** Add the `Variants` type at the variant declaration rather than weakening component props or casting each motion element.