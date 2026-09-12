import Stripe from "stripe";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { pool } from "@workspace/db";
import { logger } from "./logger";

const WEBHOOK_PATH = "/api/stripe/webhook";
const DIAGNOSTIC_AMOUNT = 49_500;
const DIAGNOSTIC_CURRENCY = "usd";
const DIAGNOSTIC_OFFER = "operations_diagnostic";
const RECONCILIATION_INTERVAL_MS = 15 * 60 * 1000;
const RECONCILIATION_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;
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

type StripeCheckoutSession = {
  id: string;
  amount_total?: number | null;
  created: number;
  currency?: string | null;
  metadata?: Record<string, string>;
  payment_status?: string;
  status?: string | null;
};

type StripeList<T> = {
  data: T[];
  has_more: boolean;
};

type StripeConnector = Pick<ReplitConnectors, "proxy">;

type ReconciliationLogger = Pick<typeof logger, "error" | "info">;

type DiagnosticReconciliationDependencies = {
  createConnector: () => StripeConnector;
  recordConversion: (
    checkoutSessionId: string,
    completedAt?: Date,
  ) => Promise<boolean>;
  log: ReconciliationLogger;
  now: () => Date;
};

const defaultReconciliationDependencies: DiagnosticReconciliationDependencies = {
  createConnector: () => new ReplitConnectors(),
  recordConversion: recordDiagnosticConversion,
  log: logger,
  now: () => new Date(),
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
): Promise<boolean> {
  const url = getWebhookUrl();
  const stored = await pool.query<StoredWebhook>(
    `SELECT endpoint_id, signing_secret
     FROM diagnostic_stripe_webhooks
     WHERE url = $1`,
    [url],
  );
  const webhook = stored.rows[0];

  if (!webhook) {
    throw new Error("Stripe webhook is not configured");
  }

  const stripe = new Stripe("sk_placeholder_for_webhook_verification");
  const event = await stripe.webhooks.constructEventAsync(
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
  const isDiagnosticPurchase =
    session.payment_status === "paid" &&
    session.status === "complete" &&
    session.amount_total === DIAGNOSTIC_AMOUNT &&
    session.currency === DIAGNOSTIC_CURRENCY &&
    session.metadata?.offer === DIAGNOSTIC_OFFER;

  if (!isDiagnosticPurchase) {
    return false;
  }

  return recordDiagnosticConversion(
    session.id,
    new Date(event.created * 1000),
  );
}

function isPaidDiagnosticSession(session: StripeCheckoutSession): boolean {
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
        await parseStripeResponse<StripeList<StripeCheckoutSession>>(response);

      for (const session of page.data) {
        examined += 1;
        if (
          isPaidDiagnosticSession(session) &&
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
    dependencies.log.error(
      { err: error },
      "Diagnostic conversion reconciliation could not reach Stripe",
    );
    throw error;
  }

  dependencies.log.info(
    { examined, recorded },
    "Reconciled diagnostic purchase conversions",
  );
  return { examined, recorded };
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