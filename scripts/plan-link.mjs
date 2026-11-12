#!/usr/bin/env node
// Build a plan link for the This block panel.
//   node scripts/plan-link.mjs plan.json [dashboard-url]
// Prints the dashboard address with #plan=<code>. The plan stays in the
// link and in the browser that opens it; nothing is committed.
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";

const [file, base = "https://savarsa530.github.io/sage-focus-dashboard/"] = process.argv.slice(2);
if (!file) { console.error("usage: node scripts/plan-link.mjs plan.json [dashboard-url]"); process.exit(1); }
const plan = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(plan.blocks)) { console.error("plan.json needs a blocks list"); process.exit(1); }
const code = "z." + deflateRawSync(Buffer.from(JSON.stringify(plan))).toString("base64url");
console.log(`${base.split("#")[0]}#plan=${code}`);
