# {{name}}

An [Apex JS](https://github.com/andrecorugda/apexjs) app — a meta-framework for
Alpine.js that renders on the server and hydrates in the browser.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Islands mode

Ship interactive JavaScript only where you need it:

```bash
apex dev --islands
```

## Project structure

- `pages/*.alpine` — single-file components. The `<script server>` block runs on
  the server; its `loader()` return value becomes the Alpine `x-data` scope.
- `server/api/*.ts` — API routes defined with `defineApexRoute`.

## AI-native API

Every route in `server/api/*.ts` is a REST endpoint **and** an MCP tool at the
same time. Set `mcp: true` on a route (see `server/api/hello.ts`) and it is
automatically exposed to AI agents at the `/mcp` endpoint — no extra wiring.
