import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import express from "express";
import { createDiagnosticCheckoutRouter } from "./diagnostic-checkout";

type ProxyCall = {
  connector: string;
  path: string;
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
};

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
  delete process.env.REPLIT_DOMAINS;
});

async function startRoute(responses: unknown[]) {
  const calls: ProxyCall[] = [];
  const conversions: string[] = [];
  const app = express();
  app.use((req, _res, next) => {
    req.log = {
      error: () => undefined,
    } as unknown as typeof req.log;
    next();
  });
  app.use(
    createDiagnosticCheckoutRouter({
      createConnector: () => ({
        proxy: async (connector, path, init) => {
          assert(init);
          calls.push({ connector, path, init });
          const response = responses.shift();
          return response instanceof Response ? response : Response.json(response);
        },
      }),
      recordConversion: async (sessionId) => {
        conversions.push(sessionId);
      },
    }),
  );

  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address === "object");

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    calls,
    conversions,
  };
}

const validSession = {
  payment_status: "paid",
  status: "complete",
  amount_total: 49_500,
  currency: "usd",
  metadata: { offer: "operations_diagnostic" },
};

test("verifies only a complete, paid $495 USD diagnostic session", async () => {
  const fixture = await startRoute([validSession]);
  const response = await fetch(
    `${fixture.baseUrl}/diagnostic-checkout/verify?session_id=cs_test_valid123`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    paid: true,
    offer: "operations_diagnostic",
    value: 495,
    currency: "usd",
  });
  assert.deepEqual(fixture.conversions, ["cs_test_valid123"]);
  assert.equal(
    fixture.calls[0]?.path,
    "/v1/checkout/sessions/cs_test_valid123",
  );
});

for (const [name, override] of [
  ["amount", { amount_total: 49_499 }],
  ["currency", { currency: "eur" }],
  ["metadata", { metadata: { offer: "another_offer" } }],
  ["payment status", { payment_status: "unpaid" }],
  ["session status", { status: "open" }],
] as const) {
  test(`fails closed when Stripe returns mismatched ${name}`, async () => {
    const fixture = await startRoute([{ ...validSession, ...override }]);
    const response = await fetch(
      `${fixture.baseUrl}/diagnostic-checkout/verify?session_id=cs_test_valid123`,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { paid: false });
    assert.deepEqual(fixture.conversions, []);
  });
}

for (const sessionId of [
  "",
  "pi_123",
  "cs_test_bad-value",
  "cs_test_bad/value",
]) {
  test(`rejects malformed session ID ${JSON.stringify(sessionId)}`, async () => {
    const fixture = await startRoute([]);
    const response = await fetch(
      `${fixture.baseUrl}/diagnostic-checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Invalid checkout session.",
    });
    assert.deepEqual(fixture.calls, []);
  });
}

test("creates checkout from the expected price, metadata, URLs, and redirect", async () => {
  process.env.REPLIT_DOMAINS = "albrecht.example,ignored.example";
  const fixture = await startRoute([
    { data: [{ id: "price_diagnostic" }] },
    { url: "https://checkout.stripe.com/c/pay/test" },
  ]);
  const response = await fetch(`${fixture.baseUrl}/diagnostic-checkout`, {
    redirect: "manual",
  });

  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    "https://checkout.stripe.com/c/pay/test",
  );
  assert.equal(fixture.calls.length, 2);
  assert.equal(fixture.calls[0]?.connector, "stripe");
  assert.equal(
    fixture.calls[0]?.path,
    "/v1/prices?active=true&lookup_keys[]=operations_diagnostic&limit=1",
  );
  assert.equal(fixture.calls[0]?.init.method, "GET");
  assert.equal(fixture.calls[1]?.path, "/v1/checkout/sessions");
  assert.equal(fixture.calls[1]?.init.method, "POST");

  const body = new URLSearchParams(String(fixture.calls[1]?.init.body));
  assert.deepEqual(Object.fromEntries(body), {
    mode: "payment",
    "line_items[0][price]": "price_diagnostic",
    "line_items[0][quantity]": "1",
    "metadata[offer]": "operations_diagnostic",
    success_url:
      "https://albrecht.example/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://albrecht.example/?checkout=cancelled#diagnostic",
  });
});

const checkoutUnavailableResponse = {
  error: "Checkout is temporarily unavailable.",
};

test("returns a safe temporary error when the diagnostic price is missing", async () => {
  const fixture = await startRoute([{ data: [] }]);
  const response = await fetch(`${fixture.baseUrl}/diagnostic-checkout`, {
    redirect: "manual",
  });

  assert.equal(response.status, 502);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(await response.json(), checkoutUnavailableResponse);
  assert.equal(fixture.calls.length, 1);
});

test("returns a safe temporary error when Stripe omits the checkout URL", async () => {
  process.env.REPLIT_DOMAINS = "albrecht.example";
  const fixture = await startRoute([
    { data: [{ id: "price_diagnostic" }] },
    { id: "cs_test_without_url" },
  ]);
  const response = await fetch(`${fixture.baseUrl}/diagnostic-checkout`, {
    redirect: "manual",
  });

  assert.equal(response.status, 502);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(await response.json(), checkoutUnavailableResponse);
  assert.equal(fixture.calls.length, 2);
});

test("does not expose Stripe error details when checkout creation fails", async () => {
  process.env.REPLIT_DOMAINS = "albrecht.example";
  const providerDetails = "No such price: price_diagnostic";
  const fixture = await startRoute([
    { data: [{ id: "price_diagnostic" }] },
    new Response(providerDetails, { status: 400 }),
  ]);
  const response = await fetch(`${fixture.baseUrl}/diagnostic-checkout`, {
    redirect: "manual",
  });
  const responseBody = await response.text();

  assert.equal(response.status, 502);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(JSON.parse(responseBody), checkoutUnavailableResponse);
  assert.equal(responseBody.includes(providerDetails), false);
  assert.equal(fixture.calls.length, 2);
});
