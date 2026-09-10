import { mkdirSync } from "node:fs";
import type { Plugin } from "vite";
import { localDatabase } from "../server/local-db.ts";
import { handleApi } from "../server/worker.ts";

export function gameApi(): Plugin {
  return { name: "local-game-api", configureServer(server) {
    mkdirSync(".local", { recursive: true });
    const { db, sqlite } = localDatabase(".local/game.sqlite");
    server.httpServer?.once("close", () => sqlite.close());
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();
      try {
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers))
          if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        const parts: Buffer[] = []; let size = 0;
        for await (const part of req) {
          size += part.length;
          if (size > 8192) { res.writeHead(413); res.end(); return; }
          parts.push(part);
        }
        const request = new Request(`http://${req.headers.host}${req.url}`, {
          method: req.method, headers, body: req.method === "GET" ? undefined : Buffer.concat(parts),
        });
        const response = await handleApi(request, {
          DB: db, ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
          // Opt in separately to contacting the real store during local development.
          COUPON_GAME_API_KEY: process.env.GAME_ALLOW_STORE_REQUESTS === "1" ? process.env.COUPON_GAME_API_KEY : undefined,
        });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
      } catch { res.writeHead(503, { "Content-Type": "application/json" }); res.end('{"error":"Serviço indisponível."}'); }
    });
  } };
}
