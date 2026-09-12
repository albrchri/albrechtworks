import assert from "node:assert/strict";
import test from "node:test";
import {
  getDiagnosticConversionReport,
  processDiagnosticWebhook,
  reconcileDiagnosticConversions,
} from "./diagnostic-conversions";
import { pool } from "@workspace/db";

const paidDiagnosticSession = {
  id: "cs_paid_diagnostic",
  payment_status: "paid",
  status: "complete",
  amount_total: 49_500,
  currency: "usd",
  metadata: { offer: "operations_diagnostic" },
};

test("webhook records only sessions accepted by the shared diagnostic predicate", async () => {
  process.env.REPLIT_DOMAINS = "albrecht.example";
  const recorded: Array<{ id: string; completedAt?: Date }> = [];

  const accepted = await processDiagnosticWebhook(
    Buffer.from("{}"),
    "signature",
    {
      getStoredWebhook: async () => ({
        endpoint_id: "we_123",
        signing_secret: "secret",
      }),
      constructEvent: async () => ({
        type: "checkout.session.completed",
        created: 2_000_000_000,
        data: { object: paidDiagnosticSession },
      }),
      recordConversion: async (id, completedAt) => {
        recorded.push({ id, completedAt });
        return true;
      },
    },
  );

  assert.equal(accepted, true);
  assert.deepEqual(
    recorded.map(({ id, completedAt }) => [id, completedAt?.toISOString()]),
    [["cs_paid_diagnostic", "2033-05-18T03:33:20.000Z"]],
  );

  const rejected = await processDiagnosticWebhook(
    Buffer.from("{}"),
    "signature",
    {
      getStoredWebhook: async () => ({
        endpoint_id: "we_123",
        signing_secret: "secret",
      }),
      constructEvent: async () => ({
        type: "checkout.session.completed",
        created: 2_000_000_000,
        data: {
          object: { ...paidDiagnosticSession, amount_total: 49_499 },
        },
      }),
      recordConversion: async () => {
        throw new Error("mismatched session must not be recorded");
      },
    },
  );

  assert.equal(rejected, false);
  delete process.env.REPLIT_DOMAINS;
});

test("reconciles recent paid diagnostic sessions through the idempotent store", async () => {
  const calls: string[] = [];
  const recorded: Array<{ id: string; completedAt: Date }> = [];
  const infoLogs: unknown[][] = [];
  let clearedFailure = false;
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
    recordFailure: async () => {
      throw new Error("successful reconciliation must not record a failure");
    },
    sendAlert: async () => {
      throw new Error("successful reconciliation must not send an alert");
    },
    markAlertSent: async () => {
      throw new Error("successful reconciliation must not mark an alert sent");
    },
    clearFailure: async () => {
      clearedFailure = true;
    },
    log: {
      error: () => undefined,
      fatal: () => undefined,
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
  assert.equal(clearedFailure, true);
});

test("logs and rejects when Stripe cannot be reached", async () => {
  const errors: unknown[][] = [];
  const fatals: unknown[][] = [];
  const stripeError = new Error("connector unavailable");
  const failedAt = new Date("2026-09-12T12:00:00.000Z");

  await assert.rejects(
    reconcileDiagnosticConversions({
      createConnector: () => ({
        proxy: async () => {
          throw stripeError;
        },
      }),
      recordConversion: async () => false,
      recordFailure: async () => ({
        consecutiveFailures: 2,
        firstFailedAt: new Date("2026-09-12T11:45:00.000Z"),
        alertSent: false,
      }),
      sendAlert: async () => {
        throw new Error("a recent failure must not send an alert");
      },
      markAlertSent: async () => {
        throw new Error("a recent failure must not mark an alert sent");
      },
      clearFailure: async () => {
        throw new Error("failed reconciliation must not clear failure state");
      },
      log: {
        error: (...args: unknown[]) => {
          errors.push(args);
        },
        fatal: (...args: unknown[]) => {
          fatals.push(args);
        },
        info: () => undefined,
      } as never,
      now: () => failedAt,
    }),
    stripeError,
  );

  assert.equal(errors.length, 1);
  assert.deepEqual(errors[0]?.[0], {
    err: stripeError,
    consecutiveFailures: 2,
    firstFailedAt: "2026-09-12T11:45:00.000Z",
  });
  assert.equal(
    errors[0]?.[1],
    "Diagnostic conversion reconciliation could not reach Stripe",
  );
  assert.equal(fatals.length, 0);
});

test("alerts operators once continuous reconciliation failures pass one day", async () => {
  const fatals: unknown[][] = [];
  const stripeError = new Error("connector unavailable");
  let markedAlertSent = false;
  let sentAlert = false;

  await assert.rejects(
    reconcileDiagnosticConversions({
      createConnector: () => ({
        proxy: async () => {
          throw stripeError;
        },
      }),
      recordConversion: async () => false,
      recordFailure: async () => ({
        consecutiveFailures: 97,
        firstFailedAt: new Date("2026-09-11T11:59:00.000Z"),
        alertSent: false,
      }),
      sendAlert: async () => {
        sentAlert = true;
        return true;
      },
      markAlertSent: async () => {
        markedAlertSent = true;
      },
      clearFailure: async () => undefined,
      log: {
        error: () => undefined,
        fatal: (...args: unknown[]) => fatals.push(args),
        info: () => undefined,
      } as never,
      now: () => new Date("2026-09-12T12:00:00.000Z"),
    }),
    stripeError,
  );

  assert.equal(fatals.length, 1);
  assert.deepEqual(fatals[0]?.[0], {
    alert: "diagnostic_conversion_reconciliation_stalled",
    consecutiveFailures: 97,
    firstFailedAt: "2026-09-11T11:59:00.000Z",
    recoveryWindowDays: 7,
    action:
      "Restore the Stripe connection and confirm diagnostic reconciliation succeeds.",
  });
  assert.equal(sentAlert, true);
  assert.equal(markedAlertSent, true);
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
