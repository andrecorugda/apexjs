import { expect, test } from '@playwright/test'

test.describe('Apex Base Camp — routing + components', () => {
  // Gate 1 — embedded components: SSR with props, then hydrate & stay interactive.
  test('gate 1: embedded components render with props and hydrate', async ({ page }) => {
    await page.goto('/')
    const clicks = page.getByRole('button', { name: /^Clicks:/ })
    const score = page.getByRole('button', { name: /^Score:/ })
    // Props applied server-side.
    await expect(clicks).toHaveText('Clicks: 3')
    await expect(score).toHaveText('Score: 10')
    // Each component has its own independent hydrated state.
    await clicks.click()
    await clicks.click()
    await score.click()
    await expect(clicks).toHaveText('Clicks: 5')
    await expect(score).toHaveText('Score: 11')
  })

  // Gate 1b — the component's SSR output is in the raw HTML (no-JS correctness).
  test('gate 1b: component is server-rendered into the response', async ({ request }) => {
    const body = await (await request.get('/')).text()
    expect(body).toContain('data-apex-component="Counter"')
    expect(body).toContain('Clicks: 3')
    expect(body).toContain('Score: 10')
  })

  // Gate 2 — static route.
  test('gate 2: static route /about', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1')).toHaveText('About Apex')
  })

  // Gate 3 — dynamic route param reaches the loader.
  test('gate 3: dynamic route /blog/[slug]', async ({ page }) => {
    await page.goto('/blog/hello-world')
    await expect(page.locator('h1')).toHaveText('Post: hello-world')
  })

  // Gate 4 — unknown route → 404.
  test('gate 4: unknown route returns 404', async ({ request }) => {
    const res = await request.get('/does-not-exist')
    expect(res.status()).toBe(404)
    expect(await res.text()).toContain('404')
  })
})
