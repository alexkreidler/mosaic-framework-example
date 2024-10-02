# Mosaic + Framework Examples

This site shares examples of integrating [Mosaic](https://idl.uw.edu/mosaic) and DuckDB into [Observable Framework](https://observablehq.com/framework).

**[View the deployed examples](https://idl.uw.edu/mosaic-framework-example)**

The examples demonstrate:

- Visualization and real-time interaction with massive data sets
- Using Mosaic and DuckDB-WASM within Framework pages
- Using DuckDB within a data loader and configuring GitHub Actions

## Proof-of-concept cached/pre-baked queries

```sh
npm install
tsx docs/pre-bake.ts
npm run dev
```

1. Install the dependencies
2. Run the server-side/NodeJS query caching script to generate the `data/prebaked` folder: `tsx docs/pre-bake.ts`
3. Run the dev script `npm run dev`
4. Open the example in the browser: http://127.0.0.1:3000/voting-cached
5. You should see the line chart, and the tooltip should work. It is served from the static arrow files. 
6. You can compare its loading speed to the the non-cached version: http://127.0.0.1:3000/voting-nocache using network throttling in DevTools

How to test the Mosaic bundle format
1. Install the deps
2. Run `node docs/duckdb-server.js` or any other of the 3 Mosaic DuckDB servers (Python, Rust, NodeJS). It should be serving a socket connection on `ws://localhost:3000`
3. Run `tsx docs/pre-bake.ts mosaic`
5. Run the observable frameowrk frontend `npm run dev`
6. Go to http://127.0.0.1:3000/voting-bundle

TODOs:
- Figure out whether this approach of caching at the connector level is the best option.
- Support multiple charts, figure out a file/directory format
- Actually wrap an existing connector like `socketConnector` or `wasmConnector` so 1. exec queries to load data are run but don't block the initial render, and 2. interaction queries that are not in the cache are served by te regular connector
- Investigate better integration with Observable Framework (e.g. identifying + extracting js code blocks that use the `vg` API, or having a package that provides a function like `renderSpec` in `voting-cached.md`)
- Test with other plots like flight delays, NYC taxi rides, etc.