import { expect, test } from '@playwright/test';

test.describe('footer privacy policy', () => {
  test('keeps the legal entry point and policy modal usable', async ({ page }) => {
    const footer = page.locator('footer');
    const privacyPolicyButton = footer.getByRole('button', {
      name: 'Privacy Policy',
    });
    const dialog = page.getByRole('dialog', { name: 'Privacy Policy' });
    let initialUrl = '';

    await test.step('footer exposes the privacy policy entry point', async () => {
      await page.goto('/');
      await expect(footer).toContainText('© 2026 Albrecht Works LLC. All rights reserved.');
      await expect(privacyPolicyButton).toBeVisible();
      initialUrl = page.url();
    });

    await test.step('privacy policy opens in a modal without navigating away', async () => {
      await privacyPolicyButton.click();
      await expect(page).toHaveURL(initialUrl);
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('heading', { name: 'Privacy Policy', level: 2 }),
      ).toBeVisible();
    });

    await test.step('privacy policy shows every required section', async () => {
      await expect(dialog).toContainText('Last updated: August 28, 2026');

      for (const section of [
        'Information I Collect',
        'How I Use This Information',
        'Data Retention',
        'Third-Party Services',
        'Your Rights',
        'Contact',
      ]) {
        await expect(
          dialog.getByRole('heading', { name: section, level: 3 }),
        ).toBeVisible();
      }
    });

    await test.step('privacy policy scrolls internally while the page stays locked', async () => {
      const scrollMetrics = await dialog.evaluate((element) => {
        const scrollable = element as HTMLElement;
        const initialPageScroll = document.documentElement.scrollTop;

        scrollable.scrollTop = scrollable.scrollHeight;

        return {
          dialogHasInternalOverflow: scrollable.scrollHeight > scrollable.clientHeight,
          dialogScrollTop: scrollable.scrollTop,
          pageScrollIsLocked: document.body.style.overflow === 'hidden',
          initialPageScroll,
          finalPageScroll: document.documentElement.scrollTop,
        };
      });

      expect(scrollMetrics.dialogHasInternalOverflow).toBe(true);
      expect(scrollMetrics.dialogScrollTop).toBeGreaterThan(0);
      expect(scrollMetrics.pageScrollIsLocked).toBe(true);
      expect(scrollMetrics.finalPageScroll).toBe(scrollMetrics.initialPageScroll);
    });

    await test.step('close button dismisses the privacy policy', async () => {
      await page.getByRole('button', { name: 'Close Privacy Policy' }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step('Escape dismisses the privacy policy', async () => {
      await privacyPolicyButton.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    });

    await test.step('backdrop dismisses the privacy policy without navigating away', async () => {
      await privacyPolicyButton.click();
      await expect(dialog).toBeVisible();
      const backdrop = page.locator('[role="presentation"]');
      await backdrop.click({ position: { x: 8, y: 8 } });
      await expect(dialog).toBeHidden();
      await expect(page).toHaveURL(initialUrl);
    });
  });
});
