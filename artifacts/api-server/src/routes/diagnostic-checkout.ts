import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();

const DIAGNOSTIC_AMOUNT = 49_500;
const DIAGNOSTIC_CURRENCY = "usd";
const DIAGNOSTIC_OFFER = "operations_diagnostic";
const DIAGNOSTIC_PRICE_LOOKUP_KEY = "operations_diagnostic";

type StripeList<T> = {
  data: T[];
};

type StripePrice = {
  id: string;
};

type StripeCheckoutSession = {
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string>;
  payment_status?: string;
  status?: string | null;
  url?: string | null;
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

function getReturnOrigin(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (!domain) {
    throw new Error("REPLIT_DOMAINS is required to create Stripe return URLs");
  }

  return `https://${domain}`;
}

router.get("/diagnostic-checkout", async (req, res): Promise<void> => {
  try {
    const connectors = new ReplitConnectors();
    const pricesResponse = await connectors.proxy(
      "stripe",
      `/v1/prices?active=true&lookup_keys[]=${DIAGNOSTIC_PRICE_LOOKUP_KEY}&limit=1`,
      { method: "GET" },
    );
    const prices =
      await parseStripeResponse<StripeList<StripePrice>>(pricesResponse);
    const priceId = prices.data[0]?.id;

    if (!priceId) {
      req.log.error("Diagnostic Stripe price was not found");
      res.status(502).json({ error: "Checkout is temporarily unavailable." });
      return;
    }

    const returnOrigin = getReturnOrigin();
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[offer]": DIAGNOSTIC_OFFER,
      success_url: `${returnOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnOrigin}/?checkout=cancelled#diagnostic`,
    });
    const checkoutResponse = await connectors.proxy(
      "stripe",
      "/v1/checkout/sessions",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );
    const checkout =
      await parseStripeResponse<StripeCheckoutSession>(checkoutResponse);

    if (!checkout.url) {
      req.log.error("Stripe created a Checkout Session without a URL");
      res.status(502).json({ error: "Checkout is temporarily unavailable." });
      return;
    }

    res.redirect(303, checkout.url);
  } catch (error) {
    req.log.error({ err: error }, "Could not create diagnostic checkout");
    res.status(502).json({ error: "Checkout is temporarily unavailable." });
  }
});

router.get("/diagnostic-checkout/verify", async (req, res): Promise<void> => {
  const sessionId =
    typeof req.query.session_id === "string" ? req.query.session_id : "";

  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    res.status(400).json({ error: "Invalid checkout session." });
    return;
  }

  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy(
      "stripe",
      `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { method: "GET" },
    );
    const session = await parseStripeResponse<StripeCheckoutSession>(response);
    const paid =
      session.payment_status === "paid" &&
      session.status === "complete" &&
      session.amount_total === DIAGNOSTIC_AMOUNT &&
      session.currency === DIAGNOSTIC_CURRENCY &&
      session.metadata?.offer === DIAGNOSTIC_OFFER;

    res.json({
      paid,
      ...(paid
        ? {
            offer: DIAGNOSTIC_OFFER,
            value: DIAGNOSTIC_AMOUNT / 100,
            currency: DIAGNOSTIC_CURRENCY,
          }
        : {}),
    });
  } catch (error) {
    req.log.error({ err: error }, "Could not verify diagnostic checkout");
    res.status(502).json({ error: "Checkout verification is unavailable." });
  }
});

export default router;