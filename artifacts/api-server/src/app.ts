import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { processDiagnosticWebhook } from "./lib/diagnostic-conversions";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!signature) {
      res.status(400).json({ error: "Missing Stripe signature." });
      return;
    }

    try {
      const recorded = await processDiagnosticWebhook(
        req.body as Buffer,
        signature,
      );
      req.log.info({ recorded }, "Processed Stripe webhook");
      res.json({ received: true });
    } catch (error) {
      req.log.error({ err: error }, "Could not process Stripe webhook");
      res.status(400).json({ error: "Invalid Stripe webhook." });
    }
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
