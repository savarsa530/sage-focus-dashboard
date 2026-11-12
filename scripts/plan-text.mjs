#!/usr/bin/env node
// Print a focus plan as the plain text the dashboard's Paste plan box reads.
//   node scripts/plan-text.mjs plan.json
// The output goes in an email to yourself; nothing is committed.
import { readFileSync } from "node:fs";
import { cleanPlan, parsePlanText, planToText } from "../src/planText.js";

const file = process.argv[2];
if (!file) { console.error("usage: node scripts/plan-text.mjs plan.json"); process.exit(1); }
const plan = cleanPlan(JSON.parse(readFileSync(file, "utf8")));
if (!plan) { console.error("No usable blocks in that plan"); process.exit(1); }
const text = planToText(plan);
const back = parsePlanText(text);
if (JSON.stringify(back) !== JSON.stringify(plan)) { console.error("The text doesn't read back the same; check the plan"); process.exit(1); }
process.stdout.write(text);
