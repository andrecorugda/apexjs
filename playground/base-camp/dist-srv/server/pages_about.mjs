function loader() {
  return { heading: "About Apex" };
}
function head() {
  return {
    title: "About \xB7 Base Camp",
    meta: [{ name: "description", content: "The about page." }]
  };
}
const template = '\n  <main>\n    <h1 x-text="heading"></h1>\n    <p>A static route at <code>pages/about.alpine</code>.</p>\n    <a href="/">\u2190 Home</a>\n  </main>\n';
const rootXData = "";
const componentId = "ccdc9f894";
const scopeId = "data-apex-cdc9f894";
const css = "\n  main[data-apex-cdc9f894] { max-width: 40rem; margin: 3rem auto; font-family: system-ui, sans-serif; }\n";

export { componentId, css, head, loader, rootXData, scopeId, template };
