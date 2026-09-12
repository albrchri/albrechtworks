import { expect, test } from '@playwright/test';

test.describe('diagnostic checkout analytics', () => {
  test('tracks a verified paid return separately from the checkout click', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const events: Array<{
        name: string;
        data?: Record<string, string | number | boolean>;
      }> = [];

      window.umami = {
        track(name, data) {
          events.push({ name, data });
        },
      };
      Object.assign(window, { analyticsEvents: events });
    });

    await page.route('**/api/diagnostic-checkout/verify?**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          paid: true,
          offer: 'operations_diagnostic',
          value: 495,
          currency: 'usd',
        }),
      });
    });

    await page.goto('/?checkout=success&session_id=cs_test_verified123');

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as typeof window & {
            analyticsEvents: Array<{ name: string }>;
          }).analyticsEvents.map((event) => event.name),
        ),
      )
      .toEqual(['diagnostic_purchase_completed']);

    await expect(page).not.toHaveURL(/session_id|checkout=success/);

    const completionEvent = await page.evaluate(() =>
      (window as typeof window & {
        analyticsEvents: Array<{
          name: string;
          data?: Record<string, string | number | boolean>;
        }>;
      }).analyticsEvents[0],
    );
    expect(completionEvent).toEqual({
      name: 'diagnostic_purchase_completed',
      data: {
        offer: 'operations_diagnostic',
        value: 495,
        currency: 'usd',
        verification: 'stripe_session',
      },
    });

    const checkoutLink = page.getByRole('link', {
      name: 'Book the Diagnostic ($495)',
    });
    await expect(checkoutLink).toHaveAttribute(
      'href',
      'https://buy.stripe.com/5kQ00k8Hxc2Bcs7dpc1oI00',
    );
  });

  test('does not track completion when Stripe verification says unpaid', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const events: Array<{ name: string }> = [];
      window.umami = {
        track(name) {
          events.push({ name });
        },
      };
      Object.assign(window, { analyticsEvents: events });
    });

    await page.route('**/api/diagnostic-checkout/verify?**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ paid: false }),
      });
    });

    const verificationResponse = page.waitForResponse(
      '**/api/diagnostic-checkout/verify?**',
    );
    await page.goto('/?checkout=success&session_id=cs_test_unpaid123');
    await verificationResponse;

    const events = await page.evaluate(
      () =>
        (window as typeof window & {
          analyticsEvents: Array<{ name: string }>;
        }).analyticsEvents,
    );
    expect(events).toEqual([]);
  });
});