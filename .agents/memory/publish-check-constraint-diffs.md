---
name: Publish CHECK constraint diffs
description: How to handle a generated Publish migration that incorrectly nests a PostgreSQL CHECK clause.
---

If a generated Publish migration contains `CHECK (CHECK (...))`, inspect the development constraint with `pg_get_constraintdef` and recompute the official schema diff. Repair the constraint only in the schema source of truth and development database; never patch production or add deployment-time DDL.

**Why:** A valid development constraint whose full PostgreSQL definition was `CHECK (singleton)` was wrapped again by the Publish diff generator, producing invalid SQL even though the development constraint itself was valid.

**How to apply:** If the constraint is redundant, remove it from the source definition and development schema after confirming the change. If it is required, replace it with an equivalent schema design that generates valid SQL. Restart the normal development service and verify the constraint does not return, then recompute the Publish diff before asking the user to retry.