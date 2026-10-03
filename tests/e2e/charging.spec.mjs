import { test, expect } from '@playwright/test'
import pg from 'pg'
import { mkdir, writeFile } from 'node:fs/promises'
let admin,
  member,
  adminPage,
  memberPage,
  sql,
  location,
  charger,
  charger2,
  car,
  otherCar,
  slot,
  booking,
  report
const stamp = Date.now().toString(36)
async function login(page, email) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
}
async function post(page, action, data) {
  return page.evaluate(
    async ({ action, data }) => {
      const csrf = document.querySelector('input[name="_csrf"]').value
      const r = await fetch('/actions/' + action, {
        method: 'POST',
        body: new URLSearchParams({ ...data, _csrf: csrf }),
      })
      return { status: r.status, url: r.url, text: await r.text() }
    },
    { action, data }
  )
}
test.describe.serial('mobile EV charging workflow', () => {
  test.beforeAll(async ({ browser }) => {
    admin = await browser.newContext({
      baseURL: 'http://localhost:3334',
      viewport: { width: 390, height: 844 },
    })
    member = await browser.newContext({
      baseURL: 'http://localhost:3334',
      viewport: { width: 390, height: 844 },
    })
    adminPage = await admin.newPage()
    memberPage = await member.newPage()
    await login(adminPage, process.env.TEST_EMAIL)
    await login(memberPage, process.env.TEST_OTHER_EMAIL)
    sql = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await sql.connect()
  })
  test.afterAll(async () => {
    await admin?.close()
    await member?.close()
    await sql?.end()
  })
  test('create location, cars, membership and multiple chargers on mobile', async () => {
    await adminPage.getByText('Create a location', { exact: true }).click()
    await adminPage.getByLabel('Location name').fill('Cove EV ' + stamp)
    await adminPage.getByRole('button', { name: 'Create location', exact: true }).click()
    await expect(adminPage.getByRole('heading', { name: 'Cove EV ' + stamp })).toBeVisible()
    location = Number(adminPage.url().match(/locations\/(\d+)/)[1])
    expect((await memberPage.goto('/locations/' + location)).status()).toBe(403)
    await memberPage.goto('/app')
    await adminPage.getByLabel('User email').fill(process.env.TEST_OTHER_EMAIL)
    await adminPage.getByRole('button', { name: 'Add / update member' }).click()
    await expect(adminPage.locator('.member-line')).toHaveCount(2)
    for (const name of ['Bay 01', 'Bay 02']) {
      await adminPage.getByLabel('Charger name').fill(name)
      await adminPage.getByRole('button', { name: 'Add charger', exact: true }).click()
      await expect(adminPage.getByRole('heading', { name, exact: true })).toBeVisible()
    }
    charger = Number(await adminPage.locator('[data-charger]').first().getAttribute('data-charger'))
    charger2 = Number(await adminPage.locator('[data-charger]').nth(1).getAttribute('data-charger'))
    for (const [page, plate] of [
      [adminPage, 'ADM' + stamp.toUpperCase()],
      [memberPage, 'MEM' + stamp.toUpperCase()],
    ]) {
      await page.goto('/app')
      await page.getByText('Add a car', { exact: true }).click()
      await page.getByLabel('Number plate').fill(plate)
      await page.getByLabel('Car name').fill('Family EV')
      await page.getByRole('button', { name: 'Add car', exact: true }).click()
      await expect(page.getByText(plate, { exact: true })).toBeVisible()
    }
    car = (
      await sql.query('SELECT c.id FROM cars c JOIN users u ON u.id=c.user_id WHERE u.email=$1', [
        process.env.TEST_EMAIL,
      ])
    ).rows[0].id
    otherCar = (
      await sql.query('SELECT c.id FROM cars c JOIN users u ON u.id=c.user_id WHERE u.email=$1', [
        process.env.TEST_OTHER_EMAIL,
      ])
    ).rows[0].id
    await adminPage.goto('/locations/' + location)
    await memberPage.goto('/locations/' + location)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await adminPage.getByLabel('Charging date').fill(tomorrow)
    await adminPage.getByRole('button', { name: 'Show slots' }).click()
    slot = await adminPage
      .locator('[data-charger]')
      .first()
      .locator('select[name="start"] option')
      .nth(20)
      .getAttribute('value')
    await adminPage
      .locator('[data-charger]')
      .first()
      .getByLabel('Half-hour slot')
      .selectOption(slot)
    await adminPage
      .locator('[data-charger]')
      .first()
      .getByRole('button', { name: 'Book slot', exact: true })
      .click()
    await expect(adminPage.locator('[data-booking]')).toHaveCount(1)
    booking = Number(await adminPage.locator('[data-booking]').getAttribute('data-booking'))
  })
  test('reject double bookings, foreign car ownership and unauthorized administration', async () => {
    expect((await post(memberPage, 'book', { charger, car: otherCar, start: slot })).status).toBe(
      409
    )
    expect((await post(memberPage, 'book', { charger: charger2, car, start: slot })).status).toBe(
      403
    )
    expect((await post(adminPage, 'book', { charger: charger2, car, start: slot })).status).toBe(
      409
    )
    for (const [action, data] of [
      ['release', { booking }],
      ['status', { charger, status: 'faulty', reason: 'Not an admin' }],
      ['member', { location, email: process.env.TEST_OTHER_EMAIL, role: 'admin' }],
      ['session', { booking, state: 'cancelled', reason: 'Unauthorized correction' }],
      ['charger', { location, name: 'Invalid charger', connector: 'CCS', power: 50 }],
    ])
      expect((await post(memberPage, action, data)).status).toBe(403)
    const past = new Date(Math.floor((Date.now() - 3600000) / 1800000) * 1800000).toISOString()
    expect((await post(adminPage, 'book', { charger, car, start: past })).status).toBe(422)
    expect(
      (
        await post(adminPage, 'book', {
          charger,
          car,
          start: new Date(new Date(slot).getTime() + 60000).toISOString(),
        })
      ).status
    ).toBe(422)
    expect(
      (await post(adminPage, 'member', { location, email: process.env.TEST_EMAIL, role: 'member' }))
        .status
    ).toBe(422)
  })
  test('release and concurrently rebook a slot with only one winner', async () => {
    expect((await post(adminPage, 'release', { booking })).status).toBe(200)
    const results = await Promise.all([
      post(adminPage, 'book', { charger, car, start: slot }),
      post(memberPage, 'book', { charger, car: otherCar, start: slot }),
    ])
    expect(results.map((x) => x.status).sort()).toEqual([200, 409])
    const rows = (
      await sql.query(
        "SELECT * FROM bookings WHERE charger_id=$1 AND slot_start=$2 AND state='booked'",
        [charger, slot]
      )
    ).rows
    expect(rows).toHaveLength(1)
    booking = rows[0].id
    expect(
      (
        await post(adminPage, 'session', {
          booking,
          state: 'cancelled',
          reason: 'Admin resolves booking conflict',
        })
      ).status
    ).toBe(200)
    expect((await post(memberPage, 'book', { charger, car: otherCar, start: slot })).status).toBe(
      200
    )
  })
  test('pending fault, verified fault cancellation, repair and isolated location access', async () => {
    expect(
      (
        await post(memberPage, 'report', {
          charger,
          description: 'Connector latch will not engage',
        })
      ).status
    ).toBe(200)
    report = (
      await sql.query('SELECT id FROM fault_reports WHERE charger_id=$1 ORDER BY id DESC', [
        charger,
      ])
    ).rows[0].id
    expect(
      (await sql.query('SELECT status FROM chargers WHERE id=$1', [charger])).rows[0].status
    ).toBe('available')
    expect(
      (await post(memberPage, 'review', { report, decision: 'verified', reason: 'Not authorized' }))
        .status
    ).toBe(403)
    expect(
      (
        await post(adminPage, 'review', {
          report,
          decision: 'verified',
          reason: 'Inspected and confirmed broken latch',
        })
      ).status
    ).toBe(200)
    expect(
      (await sql.query('SELECT status FROM chargers WHERE id=$1', [charger])).rows[0].status
    ).toBe('faulty')
    expect(
      (
        await sql.query(
          "SELECT count(*)::int AS count FROM bookings WHERE charger_id=$1 AND state IN ('booked','charging')",
          [charger]
        )
      ).rows[0].count
    ).toBe(0)
    expect((await post(memberPage, 'book', { charger, car: otherCar, start: slot })).status).toBe(
      409
    )
    expect(
      (
        await post(adminPage, 'status', {
          charger,
          status: 'available',
          reason: 'Latch replaced and charger tested',
        })
      ).status
    ).toBe(200)
    expect((await post(memberPage, 'book', { charger, car: otherCar, start: slot })).status).toBe(
      200
    )
    const otherLoc = await post(memberPage, 'location', { name: 'Other location ' + stamp })
    const otherId = Number(otherLoc.url.match(/locations\/(\d+)/)[1])
    expect((await adminPage.goto('/locations/' + otherId)).status()).toBe(403)
    expect(
      (
        await post(adminPage, 'member', {
          location: otherId,
          email: process.env.TEST_EMAIL,
          role: 'admin',
        })
      ).status
    ).toBe(403)
    await adminPage.goto('/locations/' + location)
  })
  test('actual session start/finish, manual correction, audit and mobile rendering', async () => {
    const user = (
      await sql.query('SELECT id FROM users WHERE email=$1', [process.env.TEST_OTHER_EMAIL])
    ).rows[0].id
    const current = new Date(Math.floor(Date.now() / 1800000) * 1800000)
    const currentBooking = (
      await sql.query(
        'INSERT INTO bookings(charger_id,car_id,user_id,slot_start) VALUES($1,$2,$3,$4) RETURNING id',
        [charger2, otherCar, user, current]
      )
    ).rows[0].id
    expect((await post(memberPage, 'start', { booking: currentBooking })).status).toBe(200)
    expect((await post(memberPage, 'finish', { booking: currentBooking })).status).toBe(200)
    const session = (await sql.query('SELECT * FROM bookings WHERE id=$1', [currentBooking]))
      .rows[0]
    expect(session.state).toBe('completed')
    expect(session.ended_at >= session.started_at).toBe(true)
    expect(
      (
        await post(adminPage, 'session', {
          booking: currentBooking,
          state: 'completed',
          started: '2026-01-02T12:00',
          ended: '2026-01-01T12:00',
          reason: 'Invalid time order',
        })
      ).status
    ).toBe(422)
    expect(
      (
        await post(adminPage, 'session', {
          booking: currentBooking,
          state: 'completed',
          started: '2026-01-01T12:00',
          ended: '2026-01-01T12:30',
          reason: 'Corrected from operator session record',
        })
      ).status
    ).toBe(200)
    expect(
      (
        await sql.query(
          "SELECT count(*)::int AS count FROM charging_audit WHERE location_id=$1 AND action='session_corrected'",
          [location]
        )
      ).rows[0].count
    ).toBeGreaterThan(0)
    await adminPage.goto('/locations/' + location)
    await mkdir('artifacts', { recursive: true })
    await adminPage.screenshot({ path: 'artifacts/ev-queue-mobile.png', fullPage: true })
    expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    )
    await adminPage.setViewportSize({ width: 1280, height: 900 })
    await adminPage.screenshot({ path: 'artifacts/ev-queue-desktop.png', fullPage: true })
    await memberPage.goto(
      '/locations/' + location + '?day=' + new Date(slot).toISOString().slice(0, 10)
    )
    await member.storageState({ path: 'artifacts/charging-session.json' })
    await writeFile(
      'artifacts/charging-restart.json',
      JSON.stringify({ location, day: new Date(slot).toISOString().slice(0, 10) })
    )
  })
})
