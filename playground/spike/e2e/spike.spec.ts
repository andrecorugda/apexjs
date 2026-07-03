import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const PAGE = fileURLToPath(new URL('../pages/index.alpine', import.meta.url))

test.describe('Apex JS Phase 0 spike — go/no-go gates', () => {
  // Gate 1 — SSR / SEO: real HTML in the raw response, before any JS runs.
  test('gate 1: server-renders content into the HTML response', async ({ request }) => {
    const res = await request.get('/')
    const body = await res.text()
    expect(body).toContain('Hello from the loader')
    // Three server-rendered <li> clones present in the raw markup.
    const lis = body.match(/<li[^>]*data-apex-ssr[^>]*>/g) ?? []
    expect(lis).toHaveLength(3)
    // The <template x-for> marker is retained for Alpine.
    expect(body).toContain('x-for="(item, idx) in items"')
  })

  // Gate 3 — first paint is the SSR content (no blank flash), even with JS off.
  test('gate 3: SSR content is the first paint (JS disabled)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Hello from the loader')
    await expect(page.locator('#list li')).toHaveCount(3)
    await ctx.close()
  })

  // Gate 3b — the x-for list never goes empty during hydration (atomic swap).
  test('gate 3b: list never empties while Alpine boots', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as any).__sawEmptyList = false
      const attach = () => {
        const ul = document.querySelector('#list')
        if (!ul) return
        new MutationObserver(() => {
          if (ul.querySelectorAll('li').length === 0) (window as any).__sawEmptyList = true
        }).observe(ul, { childList: true })
      }
      document.addEventListener('DOMContentLoaded', attach)
    })
    await page.goto('/')
    // Wait for hydration (SSR clones removed, Alpine re-created live ones).
    await expect(page.locator('#list [data-apex-ssr]')).toHaveCount(0)
    await expect(page.locator('#list li')).toHaveCount(3)
    expect(await page.evaluate(() => (window as any).__sawEmptyList)).toBe(false)
  })

  // Gate 4 — hydration works and there is no boot duplication.
  test('gate 4: hydrates and stays interactive without duplication', async ({ page }) => {
    await page.goto('/')
    // After boot: exactly 3 items and zero leftover SSR clones (no duplication).
    await expect(page.locator('#list [data-apex-ssr]')).toHaveCount(0)
    await expect(page.locator('#list li')).toHaveCount(3)

    // Click increments reactive state.
    await page.locator('#like').click()
    await expect(page.locator('#like')).toHaveText('Likes: 4')

    // Adding an item pushes to the reactive array → exactly 4 (no dupes).
    await page.locator('#draft').fill('delta')
    await page.locator('#add').click()
    await expect(page.locator('#list li')).toHaveCount(4)
    await expect(page.locator('#list li').last()).toHaveText('3: delta')
  })

  // Gate 6 — x-show fidelity: server display matches the client after hydration.
  test('gate 6: x-show state matches after hydration', async ({ page }) => {
    await page.goto('/')
    // Banner is shown (showBanner=true) and carries the :class hot binding.
    const banner = page.locator('.banner')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveClass(/hot/)
  })

  // Gate 5 — HMR: editing the .alpine file updates the browser with no manual reload.
  test('gate 5: HMR reflects a .alpine edit', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#add')).toHaveText('Add item')

    const original = readFileSync(PAGE, 'utf8')
    try {
      writeFileSync(PAGE, original.replace('Add item', 'Append row'))
      // No page.reload() — the dev server pushes a full-reload over the Vite WS.
      await expect(page.locator('#add')).toHaveText('Append row', { timeout: 10_000 })
    } finally {
      writeFileSync(PAGE, original)
      await expect(page.locator('#add')).toHaveText('Add item', { timeout: 10_000 })
    }
  })
})
