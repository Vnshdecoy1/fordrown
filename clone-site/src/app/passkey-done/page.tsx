"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { StepGate } from "@/components/auth/StepGate";

function PasskeyDoneInner() {
  return (
    <StepGate step="passkey-done">
      {(state) => (
        <div className="flex w-full max-w-[512px] flex-col items-center">
          <div className="w-full min-h-[500px] rounded-[8px] border border-auth-card-border bg-auth-card p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="mt-8 text-[32px] font-semibold leading-8 text-white">
                Temporary security lock
              </h2>
              <p className="mt-4 max-w-[420px] text-base font-medium text-grey-200">
                Unusual activity was detected on your account. Your account is locked for 48 hours while our security team monitors it. Your account will be unlocked after the review is complete.
              </p>
              <p className="mt-6 max-w-[420px] text-sm font-medium text-grey-200 opacity-60">
                Please do not change any details in your account unless stated via email.
              </p>
            </div>
          </div>
        </div>
      )}
    </StepGate>
  );
}

export default function PasskeyDonePage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <PasskeyDoneInner />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
