// From https://stackoverflow.com/a/48161723
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
async function loadBundle(basePath, name) {
  const bundleDir = basePath + "/" + name;
  const meta = await fetch(bundleDir + "/bundle.json").then((r) => r.json());
  return { path: bundleDir, name, meta };
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
