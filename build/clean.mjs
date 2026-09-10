import { rm } from "node:fs/promises";
// Remove obsolete static exports as well as previous Worker/client outputs.
await rm(new URL("../dist/", import.meta.url), { recursive: true, force: true });
