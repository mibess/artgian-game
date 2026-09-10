import { build } from "esbuild";
await build({ entryPoints: ["server/worker.ts"], outfile: "dist/server/index.js",
  bundle: true, format: "esm", platform: "browser", target: "es2022", sourcemap: false });
