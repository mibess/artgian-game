import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { cp } from "node:fs/promises";
import { basename, relative } from "node:path";

export default defineConfig(({ command }) => ({
  // Export playable assets; keep raw animation frames and duplicate source sheets local.
  publicDir: command === "serve" ? "public" : false,
  plugins: [tailwindcss(), {
    name: "game-assets",
    apply: "build",
    async closeBundle() {
      await cp("public", "dist", { recursive: true, filter: source => {
        const name = basename(source);
        const path = relative("public", source).replaceAll("\\", "/");
        return name !== ".DS_Store" && !["mib-idle", "mib-walk", "mib-jump"].includes(name)
          && !/^assets\/giulinha_(idle|walk|jump)_sheet\.png$/.test(path);
      } });
    },
  }],
}));
