export async function submitAuthPayload(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // local demo: never block the UI flow if the endpoint is unreachable
  }
}
