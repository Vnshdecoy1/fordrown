import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STEP_FILE = path.join(process.cwd(), "data", "step.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(STEP_FILE, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ step: "login", ts: null });
  }
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
  const record = { ...(body as Record<string, unknown>), ts: new Date().toISOString() };
  fs.mkdirSync(path.dirname(STEP_FILE), { recursive: true });
  fs.writeFileSync(STEP_FILE, JSON.stringify(record, null, 2), "utf8");
  console.log("[auth-step] state:", JSON.stringify(record));
  return NextResponse.json({ ok: true });
}
