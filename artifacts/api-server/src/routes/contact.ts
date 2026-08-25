import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import {
  SubmitContactFormBody,
  SubmitContactFormResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactFormBody.safeParse(req.body);

  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.flatten() }, "Invalid contact form submission");
    res.status(400).json({ error: "Please check the form fields and try again." });
    return;
  }

  const { name, businessName, email, phone, message } = parsed.data;
  const emailBody = [
    `Name: ${name}`,
    `Business Name & Trade: ${businessName}`,
    `Email: ${email}`,
    `Phone: ${phone?.trim() || "Not provided"}`,
    `How can I help?: ${message?.trim() || "Not provided"}`,
  ].join("\n");

  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Albrecht Works <onboarding@resend.dev>",
        to: ["chris@albrechtworks.com"],
        reply_to: email,
        subject: `Operations Diagnostic request from ${name}`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const providerResponse = await response.text();
      req.log.error(
        { status: response.status, providerResponse: providerResponse.slice(0, 500) },
        "Resend contact form delivery failed",
      );
      res.status(502).json({ error: "Email delivery failed. Please try again." });
      return;
    }

    req.log.info({ status: response.status }, "Contact form email delivered");
    res.json(SubmitContactFormResponse.parse({ success: true }));
  } catch (error) {
    req.log.error({ err: error }, "Contact form email request failed");
    res.status(502).json({ error: "Email delivery failed. Please try again." });
  }
});

export default router;