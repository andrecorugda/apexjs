import { renderComponent } from '../packages/kit/dist/index.js'
export async function run() {
  const { html } = await renderComponent({
    template: '<main><h1 x-text="title"></h1><p x-show="ok">visible</p><ul><template x-for="n in items"><li x-text="n"></li></template></ul></main>',
    componentId: 'c0', scopeId: 'data-apex-x',
    loaderData: { title: 'Rendered on a bare JS engine', ok: true, items: ['alpha', 'beta', 'gamma'] },
  })
  return html
}
