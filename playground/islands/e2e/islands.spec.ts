import { expect, test } from '@playwright/test'

const isAlpineReq = (u: string) => /alpinejs/i.test(u)

test.describe('Apex JS islands — go/no-go gates', () => {
  // Gate 1 — SSR: static content + islands are server-rendered into the HTML.
  test('gate 1: content is server-rendered', async ({ request }) => {
    const body = await (await request.get('/')).text()
    expect(body).toContain('Apex JS Islands') // static heading from loader
    expect(body).toContain('data-apex-island') // islands marked
    expect(body).toContain('data-apex-client="visible"')
    expect(body).toContain('data-apex-client="none"')
  })

  // Gate 2 — ZERO framework JS on load: Alpine is not requested until an island
  // triggers. The only above-the-fold islands are none + below-fold visible.
  test('gate 2: ships zero Alpine JS until scroll', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => requests.push(r.url()))

    await page.goto('/', { waitUntil: 'networkidle' })

    expect(requests.some(isAlpineReq)).toBe(false) // no Alpine yet
    // The visible island is still inert (x-ignore, not hydrated).
    await expect(page.locator('#visible-island')).toHaveAttribute('x-ignore', '')
  })

  // Gate 3 — client:visible hydrates on scroll, loading Alpine at that moment.
  test('gate 3: island hydrates on scroll and becomes interactive', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => requests.push(r.url()))

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#visible-island').scrollIntoViewIfNeeded()

    // Alpine gets loaded now, and the island hydrates.
    await expect(page.locator('#visible-island')).toHaveAttribute('data-apex-hydrated', '', {
      timeout: 10_000,
    })
    expect(requests.some(isAlpineReq)).toBe(true)

    // Interactivity works.
    await page.locator('#visible-btn').click()
    await expect(page.locator('#visible-btn')).toHaveText('count: 1')
  })

  // Gate 4 — client:none is truly static: SSR-rendered, never hydrates, inert.
  test('gate 4: client:none never hydrates and stays inert', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const noneBtn = page.locator('#none-btn')
    await expect(noneBtn).toHaveText('count: 0') // SSR value
    await noneBtn.click({ force: true })
    await page.waitForTimeout(200)
    await expect(noneBtn).toHaveText('count: 0') // unchanged — no interactivity
  })
})
