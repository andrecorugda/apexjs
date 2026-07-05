import { expect, test } from '@playwright/test'

// Client-side navigation: prove links swap the page in place (no full document
// reload), update history + <head>, and keep Alpine hydration working on the
// navigated-to page. The `__marker` set on the window survives only if the JS
// context was NOT torn down by a real navigation — that's the core proof.

test('SPA navigation swaps pages without a full reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Apex Base Camp')

  // Tag the live JS context. A full page load would wipe this.
  await page.evaluate(() => {
    ;(window as unknown as { __marker: string }).__marker = 'alive'
  })

  // Navigate to /about via a link click.
  await page.click('a[href="/about"]')
  await expect(page).toHaveURL('/about')
  await expect(page.locator('h1')).toHaveText('About Apex')

  // No reload → the marker (and thus the whole runtime) is still alive.
  const marker = await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)
  expect(marker).toBe('alive')

  // <head> merged: the about page's title is now live.
  await expect(page).toHaveTitle('About · Base Camp')
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    'The about page.',
  )
})

test('navigated-to page is fully hydrated (Alpine interactivity works)', async ({ page }) => {
  await page.goto('/about')
  await page.evaluate(() => {
    ;(window as unknown as { __marker: string }).__marker = 'alive'
  })

  // Go Home via client nav, then exercise a component that only exists there.
  await page.click('a[href="/"]')
  await expect(page).toHaveURL('/')
  expect(await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)).toBe(
    'alive',
  )

  const counter = page.locator('button.counter').first()
  await expect(counter).toHaveText('Clicks: 3')
  await counter.click()
  await expect(counter).toHaveText('Clicks: 4') // hydrated & reactive after nav
})

test('browser back/forward restores pages', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    ;(window as unknown as { __marker: string }).__marker = 'alive'
  })
  await page.click('a[href="/about"]')
  await expect(page.locator('h1')).toHaveText('About Apex')

  await page.goBack()
  await expect(page).toHaveURL('/')
  await expect(page.locator('h1')).toHaveText('Apex Base Camp')
  // Still the same JS context (no reload on back).
  expect(await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)).toBe(
    'alive',
  )

  await page.goForward()
  await expect(page).toHaveURL('/about')
  await expect(page.locator('h1')).toHaveText('About Apex')
})

test('the page-module hint and swap region are present', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#__apex[data-apex-root]')).toBeAttached()
  await expect(page.locator('meta[name="apex:page-module"]')).toHaveCount(1)
})
