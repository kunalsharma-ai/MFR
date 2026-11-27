// Runs every API test file, one process each (each file starts its own app and database).
//   npm test                      all files
//   npm test -- teen engagement   only files whose name contains one of the words
// Needs MongoDB on 127.0.0.1:27017 (or MONGO_HOST=host:port). Exit code 1 when any file fails.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..");
fs.mkdirSync(path.join(root, "app/logs"), { recursive: true }); // the activity logger writes here (gitignored)

const words = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).filter((f) => !words.length || words.some((w) => f.includes(w))).sort();
const failed = [];
for (const f of files) {
    const file = path.join("tests", f);
    const usesRunner = /from "node:test"/.test(fs.readFileSync(path.join(dir, f), "utf-8"));
    const args = usesRunner ? ["--test", "--test-force-exit", "--test-reporter=dot", file] : [file];
    const t = Date.now();
    const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf-8", env: process.env, timeout: 5 * 60 * 1000 });
    const ok = r.status === 0;
    console.log(`${ok ? "pass" : "FAIL"}  ${f}  (${((Date.now() - t) / 1000).toFixed(1)}s)`);
    if (!ok) { failed.push(f); process.stdout.write(`${r.stdout || ""}${r.stderr || ""}\n`); }
}
console.log(`\n${files.length - failed.length}/${files.length} test files passed${failed.length ? `; failed: ${failed.join(", ")}` : ""}`);
process.exitCode = failed.length ? 1 : 0;
