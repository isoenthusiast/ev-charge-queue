import { test, expect } from '@playwright/test'
test.use({ storageState: 'artifacts/restart-session.json' })
test('database session and record survive production process restart', async ({ page }) => {
  await page.goto('/notes')
  await expect(page).toHaveURL(/\/notes$/)
  await expect(page.getByText('Survives server restart', { exact: true })).toBeVisible()
})
