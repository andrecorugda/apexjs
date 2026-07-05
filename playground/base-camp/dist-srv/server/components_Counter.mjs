const loader = () => ({});
const template = `
  <button class="counter" @click="count++" x-text="label + ': ' + count"></button>
`;
const rootXData = "{ count: Number(start) }";
const componentId = "c1036fb0d";
const scopeId = "data-apex-1036fb0d";
const css = "\n  .counter[data-apex-1036fb0d] {\n    padding: 0.4rem 0.9rem;\n    border: 1px solid #2563eb;\n    border-radius: 0.5rem;\n    background: #eff6ff;\n    color: #1e3a8a;\n    cursor: pointer;\n    font: inherit;\n  }\n";

export { componentId, css, loader, rootXData, scopeId, template };
