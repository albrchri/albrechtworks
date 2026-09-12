import Stripe from "stripe";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { pool } from "@workspace/db";
import { logger } from "./logger";

const WEBHOOK_PATH = "/api/stripe/webhook";
export const DIAGNOSTIC_AMOUNT = 49_500;
export const DIAGNOSTIC_CURRENCY = "usd";
export const DIAGNOSTIC_OFFER = "operations_diagnostic";
const RECONCILIATION_INTERVAL_MS = 15 * 60 * 1000;
const RECONCILIATION_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;
const RECONCILIATION_ALERT_AFTER_MS = 24 * 60 * 60 * 1000;
const STRIPE_PAGE_SIZE = 100;
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;

type StoredWebhook = {
  endpoint_id: string;
  signing_secret: string;
};

type StripeWebhookEndpoint = {
  id: string;
  secret?: string;
};

export type DiagnosticStripeSession = {
  id: string;
  amount_total?: number | null;
  created?: number;
  currency?: string | null;
  metadata?: Record<string, string>;
  payment_status?: string;
  status?: string | null;
};

type DiagnosticWebhookEvent = {
  type: string;
  created: number;
  data: {
    object: DiagnosticStripeSession;
  };
};

type DiagnosticWebhookDependencies = {
  getStoredWebhook: (url: string) => Promise<StoredWebhook | undefined>;
  constructEvent: (
    payload: Buffer,
    signature: string,
    signingSecret: string,
  ) => Promise<DiagnosticWebhookEvent>;
  recordConversion: (
    checkoutSessionId: string,
    completedAt?: Date,
  ) => Promise<boolean>;
};

type StripeList<T> = {
  data: T[];
  has_more: boolean;
};

type StripeConnector = Pick<ReplitConnectors, "proxy">;

type ReconciliationLogger = Pick<typeof logger, "error" | "fatal" | "info">;

type ReconciliationFailureState = {
  consecutiveFailures: number;
  firstFailedAt: Date;
  alertSent: boolean;
};

type DiagnosticReconciliationDependencies = {
  createConnector: () => StripeConnector;
  recordConversion: (
    checkoutSessionId: string,
    completedAt?: Date,
  ) => Promise<boolean>;
  recordFailure: (failedAt: Date) => Promise<ReconciliationFailureState>;
  sendAlert: (failure: ReconciliationFailureState) => Promise<boolean>;
  markAlertSent: () => Promise<void>;
  clearFailure: () => Promise<void>;
  log: ReconciliationLogger;
  now: () => Date;
};

export type DiagnosticConversionReport = {
  diagnostic_checkout_clicked: number;
  paidDiagnostics: number;
};

const defaultReconciliationDependencies: DiagnosticReconciliationDependencies = {
  createConnector: () => new ReplitConnectors(),
  recordConversion: recordDiagnosticConversion,
  recordFailure: recordDiagnosticReconciliationFailure,
  sendAlert: sendDiagnosticReconciliationAlert,
  markAlertSent: markDiagnosticReconciliationAlertSent,
  clearFailure: clearDiagnosticReconciliationFailure,
  log: logger,
  now: () => new Date(),
};

const defaultWebhookDependencies: DiagnosticWebhookDependencies = {
  getStoredWebhook: async (url) => {
    const stored = await pool.query<StoredWebhook>(
      `SELECT endpoint_id, signing_secret
       FROM diagnostic_stripe_webhooks
       WHERE url = $1`,
      [url],
    );
    return stored.rows[0];
  },
  constructEvent: async (payload, signature, signingSecret) => {
    const stripe = new Stripe("sk_placeholder_for_webhook_verification");
    return stripe.webhooks.constructEventAsync(
      payload,
      signature,
      signingSecret,
    ) as Promise<DiagnosticWebhookEvent>;
  },
  recordConversion: recordDiagnosticConversion,
};

async function parseStripeResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const providerResponse = await response.text();
    throw new Error(
      `Stripe request failed (${response.status}): ${providerResponse.slice(0, 300)}`,
    );
  }

  return (await response.json()) as T;
}

function getWebhookUrl(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (!domain) {
    throw new Error("REPLIT_DOMAINS is required to configure Stripe webhooks");
  }

  return `https://${domain}${WEBHOOK_PATH}`;
}

async function createWebhook(
  connectors: ReplitConnectors,
  url: string,
): Promise<StoredWebhook> {
  const body = new URLSearchParams({
    url,
    description: "Albrecht Works diagnostic purchase completion",
  });
  for (const event of WEBHOOK_EVENTS) {
    body.append("enabled_events[]", event);
  }

  const response = await connectors.proxy("stripe", "/v1/webhook_endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const endpoint = await parseStripeResponse<StripeWebhookEndpoint>(response);

  if (!endpoint.secret) {
    throw new Error("Stripe created a webhook endpoint without a signing secret");
  }

  return {
    endpoint_id: endpoint.id,
    signing_secret: endpoint.secret,
  };
}

export async function initializeDiagnosticConversions(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagnostic_stripe_webhooks (
      url TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      signing_secret TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS diagnostic_purchase_conversions (
      checkout_session_id TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS diagnostic_reconciliation_failure (
      singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
      consecutive_failures INTEGER NOT NULL,
      first_failed_at TIMESTAMPTZ NOT NULL,
      last_failed_at TIMESTAMPTZ NOT NULL,
      alert_sent BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  const url = getWebhookUrl();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`diagnostic-stripe-webhook:${url}`],
    );

    const existing = await client.query<StoredWebhook>(
      `SELECT endpoint_id, signing_secret
       FROM diagnostic_stripe_webhooks
       WHERE url = $1`,
      [url],
    );

    if (existing.rowCount === 0) {
      const webhook = await createWebhook(new ReplitConnectors(), url);
      await client.query(
        `INSERT INTO diagnostic_stripe_webhooks
           (url, endpoint_id, signing_secret)
         VALUES ($1, $2, $3)`,
        [url, webhook.endpoint_id, webhook.signing_secret],
      );
      logger.info({ endpointId: webhook.endpoint_id }, "Configured Stripe webhook");
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function processDiagnosticWebhook(
  payload: Buffer,
  signature: string,
  dependencies: DiagnosticWebhookDependencies = defaultWebhookDependencies,
): Promise<boolean> {
  const url = getWebhookUrl();
  const webhook = await dependencies.getStoredWebhook(url);

  if (!webhook) {
    throw new Error("Stripe webhook is not configured");
  }

  const event = await dependencies.constructEvent(
    payload,
    signature,
    webhook.signing_secret,
  );

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return false;
  }

  const session = event.data.object;
  if (!isPaidDiagnosticSession(session)) {
    return false;
  }

  return dependencies.recordConversion(
    session.id,
    new Date(event.created * 1000),
  );
}

export function isPaidDiagnosticSession(
  session: Omit<DiagnosticStripeSession, "id">,
): boolean {
  return (
    session.payment_status === "paid" &&
    session.status === "complete" &&
    session.amount_total === DIAGNOSTIC_AMOUNT &&
    session.currency === DIAGNOSTIC_CURRENCY &&
    session.metadata?.offer === DIAGNOSTIC_OFFER
  );
}

export async function reconcileDiagnosticConversions(
  dependencies: DiagnosticReconciliationDependencies = defaultReconciliationDependencies,
): Promise<{ examined: number; recorded: number }> {
  const connectors = dependencies.createConnector();
  const createdAfter = Math.floor(
    dependencies.now().getTime() / 1000 - RECONCILIATION_LOOKBACK_SECONDS,
  );
  let startingAfter: string | undefined;
  let examined = 0;
  let recorded = 0;

  try {
    do {
      const query = new URLSearchParams({
        status: "complete",
        limit: String(STRIPE_PAGE_SIZE),
        "created[gte]": String(createdAfter),
      });
      if (startingAfter) query.set("starting_after", startingAfter);

      const response = await connectors.proxy(
        "stripe",
        `/v1/checkout/sessions?${query.toString()}`,
        { method: "GET" },
      );
      const page =
        await parseStripeResponse<StripeList<DiagnosticStripeSession>>(response);

      for (const session of page.data) {
        examined += 1;
        if (
          isPaidDiagnosticSession(session) &&
          session.created !== undefined &&
          (await dependencies.recordConversion(
            session.id,
            new Date(session.created * 1000),
          ))
        ) {
          recorded += 1;
        }
      }

      startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
      if (page.has_more && !startingAfter) {
        throw new Error("Stripe returned an empty paginated Checkout Session list");
      }
    } while (startingAfter);
  } catch (error) {
    const failedAt = dependencies.now();
    const failure = await dependencies.recordFailure(failedAt);
    dependencies.log.error(
      {
        err: error,
        consecutiveFailures: failure.consecutiveFailures,
        firstFailedAt: failure.firstFailedAt.toISOString(),
      },
      "Diagnostic conversion reconciliation could not reach Stripe",
    );
    if (
      !failure.alertSent &&
      failedAt.getTime() - failure.firstFailedAt.getTime() >=
        RECONCILIATION_ALERT_AFTER_MS
    ) {
      dependencies.log.fatal(
        {
          alert: "diagnostic_conversion_reconciliation_stalled",
          consecutiveFailures: failure.consecutiveFailures,
          firstFailedAt: failure.firstFailedAt.toISOString(),
          recoveryWindowDays: 7,
          action:
            "Restore the Stripe connection and confirm diagnostic reconciliation succeeds.",
        },
        "Operator action required: diagnostic purchases are at risk of aging out of recovery",
      );
      if (await dependencies.sendAlert(failure)) {
        await dependencies.markAlertSent();
      } else {
        dependencies.log.error(
          { alert: "diagnostic_conversion_reconciliation_stalled" },
          "Diagnostic reconciliation operator alert email could not be delivered",
        );
      }
    }
    throw error;
  }

  await dependencies.clearFailure();
  dependencies.log.info(
    { examined, recorded },
    "Reconciled diagnostic purchase conversions",
  );
  return { examined, recorded };
}

async function recordDiagnosticReconciliationFailure(
  failedAt: Date,
): Promise<ReconciliationFailureState> {
  const result = await pool.query<{
    consecutive_failures: number;
    first_failed_at: Date;
    alert_sent: boolean;
  }>(
    `INSERT INTO diagnostic_reconciliation_failure
       (singleton, consecutive_failures, first_failed_at, last_failed_at)
     VALUES (TRUE, 1, $1, $1)
     ON CONFLICT (singleton) DO UPDATE SET
       consecutive_failures =
         diagnostic_reconciliation_failure.consecutive_failures + 1,
       last_failed_at = EXCLUDED.last_failed_at
     RETURNING consecutive_failures, first_failed_at, alert_sent`,
    [failedAt],
  );
  const state = result.rows[0];
  if (!state) throw new Error("Failed to persist reconciliation failure state");
  return {
    consecutiveFailures: state.consecutive_failures,
    firstFailedAt: state.first_failed_at,
    alertSent: state.alert_sent,
  };
}

async function markDiagnosticReconciliationAlertSent(): Promise<void> {
  await pool.query(
    `UPDATE diagnostic_reconciliation_failure
     SET alert_sent = TRUE
     WHERE singleton = TRUE`,
  );
}

async function sendDiagnosticReconciliationAlert(
  failure: ReconciliationFailureState,
): Promise<boolean> {
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Albrecht Works <onboarding@resend.dev>",
        to: ["chris@albrechtworks.com"],
        subject: "Action required: Stripe purchase recovery is stalled",
        text: [
          "Diagnostic purchase reconciliation has failed continuously for more than 24 hours.",
          "",
          `First failure: ${failure.firstFailedAt.toISOString()}`,
          `Consecutive failures: ${failure.consecutiveFailures}`,
          "",
          "Restore the Stripe connection and confirm the reconciliation job succeeds.",
          "Unrecovered purchases can only be found within the seven-day recovery window.",
        ].join("\n"),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function clearDiagnosticReconciliationFailure(): Promise<void> {
  await pool.query(
    "DELETE FROM diagnostic_reconciliation_failure WHERE singleton = TRUE",
  );
}

export function startDiagnosticConversionReconciliation(): NodeJS.Timeout {
  const run = (): void => {
    void reconcileDiagnosticConversions().catch(() => undefined);
  };

  run();
  const timer = setInterval(run, RECONCILIATION_INTERVAL_MS);
  timer.unref();
  return timer;
}

export async function recordDiagnosticConversion(
  checkoutSessionId: string,
  completedAt = new Date(),
): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO diagnostic_purchase_conversions
       (checkout_session_id, completed_at)
     VALUES ($1, $2)
     ON CONFLICT (checkout_session_id) DO NOTHING`,
    [checkoutSessionId, completedAt],
  );

  return result.rowCount === 1;
}

export async function getDiagnosticConversionReport(
  diagnosticCheckoutClicked: number,
): Promise<DiagnosticConversionReport> {
  const result = await pool.query<{ paid_diagnostics: string }>(
    `SELECT COUNT(*)::text AS paid_diagnostics
     FROM diagnostic_purchase_conversions`,
  );

  return {
    diagnostic_checkout_clicked: diagnosticCheckoutClicked,
    paidDiagnostics: Number(result.rows[0]?.paid_diagnostics ?? 0),
  };
}
