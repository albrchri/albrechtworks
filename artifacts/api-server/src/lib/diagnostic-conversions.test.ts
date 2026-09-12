import assert from "node:assert/strict";
import test from "node:test";
import {
  getDiagnosticConversionReport,
  reconcileDiagnosticConversions,
} from "./diagnostic-conversions";
import { pool } from "@workspace/db";

test("reconciles recent paid diagnostic sessions through the idempotent store", async () => {
  const calls: string[] = [];
  const recorded: Array<{ id: string; completedAt: Date }> = [];
  const infoLogs: unknown[][] = [];
  const pages = [
    {
      data: [
        {
          id: "cs_paid_diagnostic",
          created: 1_999_999_000,
          payment_status: "paid",
          status: "complete",
          amount_total: 49_500,
          currency: "usd",
          metadata: { offer: "operations_diagnostic" },
        },
        {
          id: "cs_other_offer",
          created: 1_999_999_100,
          payment_status: "paid",
          status: "complete",
          amount_total: 49_500,
          currency: "usd",
          metadata: { offer: "another_offer" },
        },
      ],
      has_more: true,
    },
    {
      data: [
        {
          id: "cs_existing_diagnostic",
          created: 1_999_999_200,
          payment_status: "paid",
          status: "complete",
          amount_total: 49_500,
          currency: "usd",
          metadata: { offer: "operations_diagnostic" },
        },
      ],
      has_more: false,
    },
  ];

  const result = await reconcileDiagnosticConversions({
    createConnector: () => ({
      proxy: async (_connector, path) => {
        calls.push(path);
        return Response.json(pages.shift());
      },
    }),
    recordConversion: async (id, completedAt = new Date()) => {
      recorded.push({ id, completedAt });
      return id !== "cs_existing_diagnostic";
    },
    log: {
      error: () => undefined,
      info: (...args: unknown[]) => {
        infoLogs.push(args);
      },
    } as never,
    now: () => new Date(2_000_000_000 * 1000),
  });

  assert.deepEqual(result, { examined: 3, recorded: 1 });
  assert.deepEqual(
    recorded.map(({ id, completedAt }) => [id, completedAt.toISOString()]),
    [
      ["cs_paid_diagnostic", "2033-05-18T03:16:40.000Z"],
      ["cs_existing_diagnostic", "2033-05-18T03:20:00.000Z"],
    ],
  );
  assert.match(calls[0] ?? "", /^\/v1\/checkout\/sessions\?/);
  assert.match(calls[0] ?? "", /status=complete/);
  assert.match(calls[0] ?? "", /created%5Bgte%5D=1999395200/);
  assert.match(calls[1] ?? "", /starting_after=cs_other_offer/);
  assert.deepEqual(infoLogs[0]?.[0], { examined: 3, recorded: 1 });
});

test("logs and rejects when Stripe cannot be reached", async () => {
  const errors: unknown[][] = [];
  const stripeError = new Error("connector unavailable");

  await assert.rejects(
    reconcileDiagnosticConversions({
      createConnector: () => ({
        proxy: async () => {
          throw stripeError;
        },
      }),
      recordConversion: async () => false,
      log: {
        error: (...args: unknown[]) => {
          errors.push(args);
        },
        info: () => undefined,
      } as never,
      now: () => new Date(),
    }),
    stripeError,
  );

  assert.equal(errors.length, 1);
  assert.deepEqual(errors[0]?.[0], { err: stripeError });
  assert.equal(
    errors[0]?.[1],
    "Diagnostic conversion reconciliation could not reach Stripe",
  );
});

test("reports only the aggregate authoritative paid diagnostic total", async (t) => {
  t.mock.method(pool, "query", async (query: unknown) => {
    assert.match(String(query), /COUNT\(\*\)/);
    assert.doesNotMatch(String(query), /checkout_session_id\s+AS/i);
    return { rows: [{ paid_diagnostics: "7" }] } as never;
  });

  const report = await getDiagnosticConversionReport(12);

  assert.deepEqual(report, {
    diagnostic_checkout_clicked: 12,
    paidDiagnostics: 7,
  });
});
