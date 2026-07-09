import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

// One consolidated end-to-end suite. It drives examples/showcase — the app that
// exercises every Apex feature — so these tests double as regression coverage for
// SSR, hydration, the data layer, auth, i18n, and MCP.

const GUESTBOOK = fileURLToPath(new URL('../../examples/showcase/pages/guestbook.alpine', import.meta.url))

test.describe('SSR + hydration', () => {
  // Real, indexable HTML in the raw response before any JS runs.
  test('server-renders page content', async ({ request }) => {
    const home = await (await request.get('/')).text()
    expect(home).toContain('apex-showcase')
    expect(home).toContain('Data &amp; models') // feature card, server-rendered

    const gb = await (await request.get('/guestbook')).text()
    expect(gb).toContain('Ada Lovelace') // seeded DB row, rendered on the server
    // The x-for list is SSR'd into real <li> clones (marked for atomic hydration).
    expect(gb).toContain('data-apex-ssr')
  })

  // With JS disabled, the SSR content is the first (and only) paint — no flash.
  test('SSR content is the first paint (JS disabled)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto('/guestbook')
    await expect(page.getByText('Ada Lovelace')).toBeVisible()
    await ctx.close()
  })

  // Islands hydrate and become interactive with no duplication of SSR clones.
  test('hydrates: the counter island is interactive', async ({ page }) => {
    await page.goto('/')
    const counter = page.getByRole('button', { name: /Clicks:/ })
    await expect(counter).toHaveText('Clicks: 0')
    await counter.click()
    await expect(counter).toHaveText('Clicks: 1')
    // No leftover SSR clones anywhere after boot.
    await expect(page.locator('[data-apex-ssr]')).toHaveCount(0)
  })
})

test.describe('data layer (models + DB + resource)', () => {
  test('a posted message round-trips through the DB', async ({ page }) => {
    await page.goto('/guestbook')
    const body = `e2e-${Date.now() % 100000}`
    await page.fill('input[name="author"]', 'E2E')
    await page.fill('textarea[name="body"]', body)
    await page.getByRole('button', { name: /Sign the guestbook/ }).click()
    // The form posts to /api/messages then reloads — the new row is SSR'd back.
    await expect(page.getByText(body)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('auth (sealed sessions)', () => {
  test('gated route + login flow', async ({ page, request }) => {
    // /api/whoami is 401 before logging in.
    expect((await request.get('/api/whoami')).status()).toBe(401)

    await page.goto('/account')
    await expect(page.getByText('You are not signed in.')).toBeVisible()
    await page.fill('input[placeholder="Your name"]', 'Grace')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText(/Signed in as/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Grace')).toBeVisible()
  })
})

test.describe('i18n', () => {
  test('server-side translation, locale from the path prefix', async ({ request }) => {
    expect(await (await request.get('/hello')).text()).toContain('Hello from Apex!')
    expect(await (await request.get('/fr/hello')).text()).toContain('Bonjour depuis Apex')
  })
})

test.describe('HMR', () => {
  test('an .alpine edit reflects without a manual reload', async ({ page }) => {
    await page.goto('/guestbook')
    await expect(page.getByRole('heading', { name: 'Guestbook' })).toBeVisible()

    const original = readFileSync(GUESTBOOK, 'utf8')
    try {
      writeFileSync(GUESTBOOK, original.replace('>Guestbook<', '>Guest Book HMR<'))
      await expect(page.getByRole('heading', { name: 'Guest Book HMR' })).toBeVisible({ timeout: 10_000 })
    } finally {
      // Restore the file on disk; the edit-reflected assertion above is the check.
      writeFileSync(GUESTBOOK, original)
    }
  })
})
