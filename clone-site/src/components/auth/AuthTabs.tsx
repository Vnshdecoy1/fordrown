"use client";

import { cn } from "@/lib/utils";

export type AuthTab = "email" | "qr" | "passkey";

const tabs: { value: AuthTab; label: string }[] = [
  { value: "qr", label: "QR Code" },
  { value: "passkey", label: "Passkey" },
  { value: "email", label: "Email" },
];

export function AuthTabs({ value, onChange }: { value: AuthTab; onChange: (value: AuthTab) => void }) {
  return (
    <div className="flex h-[26px] items-center gap-3">
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "mr-3 h-full border-b-2 pb-2 text-base font-medium transition-colors",
              active
                ? "border-blue-brand text-white"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
