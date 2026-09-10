import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { cp } from "node:fs/promises";
import { basename, relative } from "node:path";
import { sites } from "./build/sites-vite-plugin";
import { gameApi } from "./build/game-api-plugin";

export default defineConfig(({ command }) => ({
  // Export playable assets; keep raw animation frames and duplicate source sheets local.
  publicDir: command === "serve" ? "public" : false,
  build: { outDir: "dist/client" },
  plugins: [sites(), gameApi(), tailwindcss(), {
    name: "game-assets",
    apply: "build",
    async closeBundle() {
      await cp("public", "dist/client", { recursive: true, filter: source => {
        const name = basename(source);
        const path = relative("public", source).replaceAll("\\", "/");
        return name !== ".DS_Store" && !["mib-idle", "mib-walk", "mib-jump"].includes(name)
          && !/^assets\/giulinha_(idle|walk|jump)_sheet\.png$/.test(path);
      } });
    },
  }],
}));
