import { test, expect } from '@playwright/test'
test.use({ storageState: 'artifacts/restart-session.json' })
test('database session and record survive production process restart', async ({ page }) => {
  await page.goto('/notes')
  await expect(page).toHaveURL(/\/notes$/)
  await expect(page.getByText('Survives server restart', { exact: true })).toBeVisible()
})

test('EV booking and authenticated membership survive process restart', async ({ browser }) => {
  const { readFile } = await import('node:fs/promises')
  const saved = JSON.parse(await readFile('artifacts/charging-restart.json', 'utf8'))
  const context = await browser.newContext({
    baseURL: 'http://localhost:3334',
    storageState: 'artifacts/charging-session.json',
  })
  const page = await context.newPage()
  await page.goto(`/locations/${saved.location}?day=${saved.day}`)
  await expect(page.getByRole('heading', { name: /Cove EV/ })).toBeVisible()
  await expect(page.getByText('Your booking', { exact: false }).first()).toBeVisible()
  await context.close()
})
