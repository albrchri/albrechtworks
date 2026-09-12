import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import express from "express";
import { createDiagnosticReportRouter } from "./diagnostic-report";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

async function startRoute(paidDiagnostics: number): Promise<string> {
  const app = express();
  app.use(
    createDiagnosticReportRouter({
      getReport: async (diagnosticCheckoutClicked) => ({
        diagnostic_checkout_clicked: diagnosticCheckoutClicked,
        paidDiagnostics,
      }),
    }),
  );

  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  return `http://127.0.0.1:${address.port}`;
}

test("combines aggregate checkout clicks with authoritative paid diagnostics", async () => {
  const baseUrl = await startRoute(7);
  const response = await fetch(
    `${baseUrl}/diagnostic-report?diagnostic_checkout_clicked=12`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    diagnostic_checkout_clicked: 12,
    paidDiagnostics: 7,
  });
});

test("reports paid diagnostics safely when analytics has zero clicks", async () => {
  const baseUrl = await startRoute(3);
  const response = await fetch(
    `${baseUrl}/diagnostic-report?diagnostic_checkout_clicked=0`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    diagnostic_checkout_clicked: 0,
    paidDiagnostics: 3,
  });
});

test("rejects missing, negative, and fractional click counts", async () => {
  const baseUrl = await startRoute(3);

  for (const query of [
    "",
    "?diagnostic_checkout_clicked=-1",
    "?diagnostic_checkout_clicked=1.5",
  ]) {
    const response = await fetch(`${baseUrl}/diagnostic-report${query}`);
    assert.equal(response.status, 400);
  }
});