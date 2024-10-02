---
title: Cached/pre-baked voter registration statistics
---


```js
import * as vgplot from "npm:@uwdata/vgplot";
import { decodeIPC } from "npm:@uwdata/mosaic-core";
import { parseSpec, astToDOM } from "npm:@uwdata/mosaic-spec";
// From https://stackoverflow.com/a/48161723
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function cacheKey(hashable, type) {
    return await sha256(hashable) + '.' + type;
}

async function loadBundle(basePath, name) {
    const bundleDir = basePath + "/" + name
    const meta = await fetch(bundleDir + "/bundle.json").then((r) => r.json());
    return {path: bundleDir, name, meta};
}

async function getBundledFilename(queries, sql) {
  const hash = await sha256(sql);
  let out = queries.filter((q) => q.includes(hash));
  if (out.length > 0) {
    return out[0];
  }
  return null;
}

function cacheConnector(bundle) {
  return {
    query: async (query) => {
      const key = cacheKey(query.sql, query.type);
      const bundledFilename = await getBundledFilename(bundle.meta.queries, query.sql);
      if (bundledFilename) {
        switch (bundledFilename.split(".")[1]) {
          case "json":
            return await fetch(bundle.path + "/" + bundledFilename).then((r) => r.json());
            break;

          case "arrow":
            return await decodeIPC(await fetch(bundle.path + "/" + bundledFilename).then((r) => r.arrayBuffer()));
            break;

          default:
            break;
        }
      } else {
        console.warn("No cached query found for: " + query.sql);
      }
    },
  };
}

const coordinator = new vgplot.Coordinator();
const bundle = await loadBundle("/_file/data/bundle", "line-bundle");
console.log(bundle)
;coordinator.databaseConnector(cacheConnector(bundle));
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