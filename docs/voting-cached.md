---
title: Cached/pre-baked voter registration statistics
---


```js
import * as vgplot from "npm:@uwdata/vgplot";
import { decodeIPC } from "npm:@uwdata/mosaic-core";
import { parseSpec, astToDOM } from "npm:@uwdata/mosaic-spec";

const queries = await FileAttachment("data/prebaked/queries.json").json();
console.log("cached query map", queries)
function cacheConnector(cacheDir) {
  return {
    query: async (query) => {
      if (queries[query.sql] && queries[query.sql].type != "exec") {
        return await decodeIPC(await fetch(cacheDir + "/" + queries[query.sql].id + ".arrow").then((r) => r.arrayBuffer()));
      } else {
        console.warn("No cached query found for: " + query.sql);
      }
    },
  };
}

const coordinator = new vgplot.Coordinator();
coordinator.databaseConnector(cacheConnector("/_file/data/prebaked"));
const myVg = vgplot.createAPIContext({coordinator});

async function renderSpecCached(spec) {
    console.log("parsing spec:", spec)
  try {
    const ast = parseSpec(spec);
    let res = await astToDOM(ast, {api: myVg});
    console.log(res);
    return res.element;
  } catch (error) {
    console.error(error)
  }
};
```

```js
await renderSpecCached({
    "meta": {
        "title": "Voter registration in Orange County, NC"
    },
    "data": {
        "dates": {
            "file": "https://raw.githubusercontent.com/alexkreidler/nc-elections/main/data/voter_registration_orange.parquet"
        },
        "filtered": "SELECT * FROM dates WHERE registr_dt < '2025-01-01' AND registr_dt > '2020-01-01'"
    },
    "colorScheme": "Tableau10",
    "colorScale": "categorical",
    "plot": [
        {
            "mark": "lineY",
            "data": {
                "from": "filtered"
            },
            "x": {
                "dateMonth": "registr_dt"
            },
            "stroke": {
                "sql": "CAST(YEAR(registr_dt) AS STRING)"
            },
            "y": {
                "count": null
            },
            "tip": true
        },
        {
            "legend": "color",
            "label": "Color Swatch"
        }
    ],
    "width": 1000,
    "height": 200,
    "style": {
        "fontFamily": "Arial"
    }
})
```