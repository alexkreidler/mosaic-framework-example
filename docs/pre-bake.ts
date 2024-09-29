import * as vg from "@uwdata/vgplot";
import { DuckDB } from "@uwdata/mosaic-duckdb";
import { decodeIPC } from "@uwdata/mosaic-core";
import { Table, tableToIPC } from "@uwdata/flechette";

import { Spec, astToDOM, parseSpec } from "@uwdata/mosaic-spec";
import "global-jsdom/register";
import { nanoid } from "nanoid";
import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";

// Deps: @uwdata/vgplot @uwdata/mosaic-duckdb @uwdata/mosaic-core @uwdata/flechette @uwdata/mosaic-spec global-jsdom jsdom nanoid @types/node

// Otherwise, `new Event()` which is used by some Observable Plot code will use the Node.js Event class
// which causes errors because JSDom needs its own browser Event class.
global.Event = window.Event;

let queryMap = {};
let fileMap: Record<string, string | Uint8Array> = {};

// From https://github.com/uwdata/mosaic/blob/main/packages/core/test/util/node-connector.js
export function nodeConnector(db = new DuckDB()) {
  const query = async (query) => {
    const { type, sql } = query;
    switch (type) {
      case "exec":
        return db.exec(sql);
      case "arrow":
        return decodeIPC(await db.arrowBuffer(sql));
      case "json":
        return db.query(sql);
    }
  };

  const wrapSaveQueries = (func) => async (query) => {
    const id = nanoid(8);
    queryMap[query.sql] = { ...query, id };
    const out = await func(query);
    if (query.type !== "exec") {
      let fileOut;
      if (query.type === "json") {
        fileOut = JSON.stringify(out, null, 4);
      } else if (query.type === "arrow") {
        fileOut = tableToIPC(out, { format: "file" });
      }
      fileMap[id + "." + query.type] = fileOut;
    }
    return out;
  };

  return { query: wrapSaveQueries(query) };
}

async function writePrebakedData(dir: string) {
  await rm(dir, {recursive: true, force: true});
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "queries.json"), JSON.stringify(queryMap, null, 4));

  for (const [fileName, out] of Object.entries(fileMap)) {
    await writeFile(join(dir, fileName), out);
  }
}

export async function specToSVG(spec: Spec): Promise<string> {
  const coord = vg.coordinator();
  coord.databaseConnector(nodeConnector());
  // coord.manager.logQueries(true);
  const ast = parseSpec(spec);

  const { element } = await astToDOM(ast);
  // value is a reference to the @uwdata/mosaic-plot Plot instance
  const sync = element.value.synch;
  // wait for all queries to complete and the plot to re-render
  await sync.promise;
  return element.outerHTML;
}

async function main() {
  const spec = JSON.parse(await readFile("./docs/line.json", "utf8"));
  const html = await specToSVG(spec as any);
  
  await writePrebakedData("./docs/data/prebaked");
  console.log("Wrote prebaked data");
  // Need the dir to be created by above
  await writeFile("./docs/data/prebaked/out.html", html);
  console.log("Wrote SVG");
}

main().then(console.log).catch(console.error);
