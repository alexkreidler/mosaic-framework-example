---
title: Non-cached voter registration statistics for comparison
---


```js
import * as vgplot from "npm:@uwdata/vgplot";
import { parseSpec, astToDOM } from "npm:@uwdata/mosaic-spec";

const wasmCoordinator = new vgplot.Coordinator();
wasmCoordinator.databaseConnector(vgplot.wasmConnector());
const wasmContext = vgplot.createAPIContext({coordinator: wasmCoordinator});


async function renderSpecNormal(spec) {
  console.log("parsing spec:", spec)
  try {
    const ast = parseSpec(spec);
    let res = await astToDOM(ast, {api: wasmContext});
    console.log(res);
    return res.element;
  } catch (error) {
    console.error(error)
  }
};
```

```js
await renderSpecNormal({
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