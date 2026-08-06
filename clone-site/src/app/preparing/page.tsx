"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { StepGate } from "@/components/auth/StepGate";

function PreparingInner() {
  return (
    <StepGate step="preparing">
      {(state) => (
        <div className="flex w-full max-w-[512px] flex-col items-center">
          <div className="w-full min-h-[500px] rounded-[8px] border border-auth-card-border bg-auth-card p-6">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span
                aria-hidden="true"
                className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-[#e5e7eb]"
              />
              <h2 className="mt-8 text-[24px] font-semibold leading-8 text-white">
                Setting up your passkey
              </h2>
              <p className="mt-3 max-w-[420px] text-base font-medium text-grey-200">
                {state.message ?? "Logging you in securely..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </StepGate>
  );
}

export default function PreparingPage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <PreparingInner />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
