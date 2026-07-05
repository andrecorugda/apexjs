function loader() {
  return { title: "Apex Base Camp" };
}
const template = '\n  <main>\n    <h1 x-text="title"></h1>\n    <nav>\n      <a href="/about">About</a> \xB7\n      <a href="/blog/hello-world">A blog post</a>\n    </nav>\n\n    <p>Two embedded components, each with props, rendered on the server and hydrated:</p>\n    <Counter start="3" label="Clicks" />\n    <Counter start="10" label="Score" />\n  </main>\n';
const rootXData = "";
const componentId = "c58215431";
const scopeId = "data-apex-58215431";
const css = "\n  main[data-apex-58215431] { max-width: 40rem; margin: 3rem auto; font-family: system-ui, sans-serif; }\n  h1[data-apex-58215431] { color: #2563eb; }\n  nav[data-apex-58215431] { margin: 1rem 0; }\n";

export { componentId, css, loader, rootXData, scopeId, template };
