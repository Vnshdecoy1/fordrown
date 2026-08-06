import type { ReactNode } from "react";
import Link from "next/link";
import { AuthLogo } from "./Logo";

const footerLinks = ["Privacy Notice", "Legal", "Status", "Terms and Conditions", "Cookie Preferences"];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-auth-bg text-white">
      <header className="shrink-0 px-6 py-4 md:px-20">
        <Link href="/" aria-label="Crypto.com" className="inline-block">
          <AuthLogo width={148} />
        </Link>
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-6 md:px-20">{children}</main>
      <footer className="shrink-0 px-6 pb-8 pt-0 md:px-20">
        <div className="mx-auto flex w-full max-w-[1140px] flex-col items-center justify-between gap-4 border-t border-auth-border py-4 md:flex-row">
          <p className="text-xs font-medium text-grey-300">
            Copyright&copy; 2018 - 2026 Crypto.com. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="text-xs font-medium text-grey-300 transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
