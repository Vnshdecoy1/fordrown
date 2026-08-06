import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.jsonl");
const LISTENER_URL = "http://127.0.0.1:8765/submit";
const MAX_BODY_BYTES = 32 * 1024;

async function forwardToListener(record: Record<string, unknown>): Promise<void> {
  try {
    await fetch(LISTENER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // listener not running - the JSONL feed still captures everything
  }
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.slice(0, 1000);
  }
  if (typeof value === "boolean" || typeof value === "number" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map(sanitize);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
      out[key] = sanitize(entry);
    }
    return out;
  }
  return undefined;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "bad-body" }, { status: 400 });
  }
  const json = JSON.stringify(body);
  if (Buffer.byteLength(json, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "too-large" }, { status: 413 });
  }

  const record = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    ...(sanitize(body) as Record<string, unknown>),
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.appendFileSync(DATA_FILE, JSON.stringify(record) + "\n", "utf8");

  console.log("[auth-demo] stored:", JSON.stringify(record, null, 2));
  void forwardToListener(record);

  return NextResponse.json({ ok: true, id: record.id });
}
