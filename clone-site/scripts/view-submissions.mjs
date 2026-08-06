import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "submissions.jsonl");

if (!fs.existsSync(DATA_FILE)) {
  console.log(`No submissions yet at ${DATA_FILE}`);
  process.exit(0);
}

const lines = fs.readFileSync(DATA_FILE, "utf8").trim().split("\n").filter(Boolean);

console.log(`${lines.length} submission(s):\n`);
for (const line of lines) {
  try {
    const record = JSON.parse(line);
    console.log(`--- ${record.ts} [${String(record.id).slice(0, 8)}]`);
    console.log(JSON.stringify(record, null, 2));
    console.log("");
  } catch {
    console.log(`--- unreadable line: ${line}`);
  }
}
