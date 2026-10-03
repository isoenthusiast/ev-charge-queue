import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
async function login(page, email = process.env.TEST_EMAIL) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
  await page.goto('/notes')
}
test('private access, health, no public signup and CSRF rejection', async ({ page, request }) => {
  await page.goto('/notes')
  await expect(page).toHaveURL(/\/login$/)
  expect((await request.get('/health/ready')).status()).toBe(200)
  expect((await request.get('/signup')).status()).toBe(404)
  expect(
    (
      await request.post('/notes', {
        form: { title: 'forged' },
        headers: { accept: 'application/json' },
        maxRedirects: 0,
      })
    ).status()
  ).toBe(403)
})
test('invalid credentials cannot log in', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(process.env.TEST_EMAIL)
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('alert')).toBeVisible()
})
test('HTMX create, validation, ownership, update, delete, escaping and logout', async ({
  page,
  browser,
}) => {
  await login(page)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.getByLabel('New note').fill('My first private note')
  // HTMX must update the page without navigation.
  const navigations = []
  page.on('framenavigated', (frame) => navigations.push(frame.url()))
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.locator('.note-title')).toHaveText('My first private note')
  expect(navigations).toEqual([])
  const id = await page.locator('[data-note-id]').getAttribute('data-note-id')
  const cookie = (await page.context().cookies()).find((c) => c.name === 'adonis-session')
  expect(cookie.httpOnly).toBe(true)
  expect(cookie.secure).toBe(true)
  await page.getByLabel('New note').fill('   ')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.getByRole('alert').first()).toContainText('between 1 and 120')
  await expect(page.locator('.note-title')).toHaveCount(1)
  // A second real account cannot list or mutate the first user's record.
  const other = await browser.newContext({ baseURL: 'http://localhost:3334' })
  const otherPage = await other.newPage()
  await login(otherPage, process.env.TEST_OTHER_EMAIL)
  await expect(otherPage.locator('.note-title')).toHaveCount(0)
  const csrf = await otherPage.locator('input[name="_csrf"]').first().inputValue()
  for (const action of ['toggle', 'delete']) {
    const status = await otherPage.evaluate(
      async ({ id, action, csrf }) => {
        const response = await fetch(`/notes/${id}/${action}`, {
          method: 'POST',
          body: new URLSearchParams({ _csrf: csrf }),
          headers: { 'HX-Request': 'true' },
        })
        return response.status
      },
      { id, action, csrf }
    )
    expect(status).toBe(404)
  }
  await other.close()
  await page.getByRole('button', { name: 'Complete', exact: true }).click()
  await expect(page.locator('.note-title')).toHaveClass(/done/)
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.note-title')).toHaveCount(0)
  await page.getByLabel('New note').fill('<script>window.bad = true</script>')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.locator('.note-title')).toHaveText('<script>window.bad = true</script>')
  expect(await page.evaluate(() => window.bad)).toBeUndefined()
  await mkdir('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/notes-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'artifacts/notes-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  const expired = await page.request.post('/notes', {
    form: { title: 'expired', _csrf: csrf },
    headers: { 'HX-Request': 'true' },
  })
  expect([401, 403]).toContain(expired.status())
})
test('prepare persistent session and record for process restart', async ({ page }) => {
  await login(page)
  await page.getByLabel('New note').fill('Survives server restart')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.getByText('Survives server restart', { exact: true })).toBeVisible()
  await page.context().storageState({ path: 'artifacts/restart-session.json' })
})

test('login is rate limited', async ({ page }) => {
  await page.goto('/login')
  const statuses = await page.evaluate(async () => {
    const token = document.querySelector('input[name="_csrf"]').value
    const results = []
    for (let i = 0; i < 11; i++) {
      const r = await fetch('/login', {
        method: 'POST',
        body: new URLSearchParams({
          _csrf: token,
          email: 'throttle-' + Date.now() + '@example.test',
          password: 'invalid',
        }),
      })
      results.push(r.status)
    }
    return results
  })
  // Each request above has a different identity; separately exercise one bounded account.
  expect(statuses.every((s) => s < 500)).toBe(true)
  const email = `limited-${Date.now()}@example.test`
  const limited = await page.evaluate(async (email) => {
    const token = document.querySelector('input[name="_csrf"]').value
    let status
    for (let i = 0; i < 11; i++) {
      status = (
        await fetch('/login', {
          method: 'POST',
          body: new URLSearchParams({ _csrf: token, email, password: 'invalid' }),
        })
      ).status
    }
    return status
  }, email)
  expect(limited).toBe(429)
})
