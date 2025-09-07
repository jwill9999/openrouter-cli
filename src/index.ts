#!/usr/bin/env node
import { main } from "./main.js";

// Entrypoint
main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

