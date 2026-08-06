"use client";

import { useEffect, useState } from "react";

export interface StepState {
  step: string;
  email?: string;
  phone?: string;
  message?: string;
  error?: string;
  ts?: string | null;
}

export function useStepState(pollMs = 300): StepState | null {
  const [state, setState] = useState<StepState | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch("/api/step", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as StepState;
          if (alive) setState(data);
        }
      } catch {
        // site not ready yet - keep polling
      }
      if (alive) timer = setTimeout(poll, pollMs);
    };

    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [pollMs]);

  return state;
}
