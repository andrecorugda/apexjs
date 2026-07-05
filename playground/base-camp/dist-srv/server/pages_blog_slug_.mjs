function loader({ params }) {
  return { slug: params.slug };
}
const template = `
  <main>
    <h1 x-text="'Post: ' + slug"></h1>
    <p>Dynamic route from <code>pages/blog/[slug].alpine</code>.</p>
    <a href="/">\u2190 Home</a>
  </main>
`;
const rootXData = "";
const componentId = "c4970fc0f";
const scopeId = "data-apex-4970fc0f";
const css = "\n  main[data-apex-4970fc0f] { max-width: 40rem; margin: 3rem auto; font-family: system-ui, sans-serif; }\n  h1[data-apex-4970fc0f] { color: #7c3aed; }\n";

export { componentId, css, loader, rootXData, scopeId, template };
