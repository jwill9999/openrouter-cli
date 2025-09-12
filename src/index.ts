#!/usr/bin/env node
import { main } from "./main.js";
import { logError } from "./shared/logger.js";

// Entrypoint
main().catch(async (err) => {
  await logError(err, 'unhandled');
  console.error('A technical issue occurred. Please try again.');
  process.exit(1);
});
