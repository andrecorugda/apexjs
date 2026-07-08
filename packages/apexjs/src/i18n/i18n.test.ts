import { describe, expect, it } from 'vitest'
import { renderPage } from '../dev/renderPage.js'
import { createI18n, resolveLocale } from './index.js'

const messages = {
  en: { welcome: 'Welcome, {name}', nav: { home: 'Home' } },
  fr: { welcome: 'Bienvenue, {name}', nav: { home: 'Accueil' } },
}

describe('createI18n / t', () => {
  it('translates, resolves dotted keys, and interpolates', () => {
    const { t } = createI18n({ messages, locale: 'fr', defaultLocale: 'en' })
    expect(t('welcome', { name: 'Ada' })).toBe('Bienvenue, Ada')
    expect(t('nav.home')).toBe('Accueil')
  })

  it('falls back to the default locale, then to the key', () => {
    const { t } = createI18n({
      messages: { en: { only: 'EN only' }, fr: {} },
      locale: 'fr',
      defaultLocale: 'en',
    })
    expect(t('only')).toBe('EN only') // fallback to default locale
    expect(t('missing.everywhere')).toBe('missing.everywhere') // fallback to key
  })

  it('calls onMissingKey for a missing key (dev diagnostic)', () => {
    const missed: string[] = []
    const { t } = createI18n({
      messages: { en: {} },
      locale: 'en',
      onMissingKey: (k) => missed.push(k),
    })
    expect(t('foo.bar')).toBe('foo.bar')
    expect(missed).toEqual(['foo.bar'])
  })

  it('leaves unknown placeholders intact', () => {
    const { t } = createI18n({ messages: { en: { x: 'Hi {name} {other}' } }, locale: 'en' })
    expect(t('x', { name: 'A' })).toBe('Hi A {other}')
  })
})

describe('resolveLocale', () => {
  const base = { locales: ['en', 'fr'], defaultLocale: 'en' }

  it('prefers a /<locale> path prefix and strips it', () => {
    expect(resolveLocale({ ...base, path: '/fr/about' })).toEqual({ locale: 'fr', path: '/about' })
    expect(resolveLocale({ ...base, path: '/fr' })).toEqual({ locale: 'fr', path: '/' })
  })

  it('falls back to Accept-Language (base tag match)', () => {
    expect(
      resolveLocale({ ...base, path: '/about', acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' }),
    ).toEqual({ locale: 'fr', path: '/about' })
  })

  it('falls back to the default locale', () => {
    expect(resolveLocale({ ...base, path: '/about', acceptLanguage: 'de,es' })).toEqual({
      locale: 'en',
      path: '/about',
    })
    expect(resolveLocale({ ...base, path: '/about' })).toEqual({ locale: 'en', path: '/about' })
  })

  it('does not treat a non-locale first segment as a prefix', () => {
    expect(resolveLocale({ ...base, path: '/blog/hello' })).toEqual({
      locale: 'en',
      path: '/blog/hello',
    })
  })
})

describe('SSR integration (renderPage + locals.t + locale)', () => {
  it('a loader uses locals.t and the shell reflects the locale', async () => {
    const { t } = createI18n({ messages: { fr: { hi: 'Bonjour, {name}' } }, locale: 'fr' })
    const html = await renderPage({
      loadModule: async () => ({
        loader: ({ locals }) => ({
          greeting: (locals.t as (k: string, p?: Record<string, unknown>) => string)('hi', {
            name: 'Ada',
          }),
        }),
        template: '<p x-text="greeting"></p>',
        rootXData: null,
        componentId: 'c0',
        scopeId: 'data-apex-x',
        css: '',
      }),
      pageId: '/pages/index.alpine',
      url: '/',
      locale: 'fr',
      locals: { t, locale: 'fr' },
    })
    expect(html).toContain('Bonjour, Ada') // translated in the loader, rendered in SSR
    expect(html).toContain('<html lang="fr">') // shell reflects the active locale
    expect(html).toContain('window.__APEX_LOCALE__="fr"') // seeded to the client
  })
})
