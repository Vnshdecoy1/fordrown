"use client";

import { cn } from "@/lib/utils";

interface AuthSegmentedProps {
  value: "login" | "signup";
  onChange: (value: "login" | "signup") => void;
}

const options = [
  { value: "login", label: "Log In" },
  { value: "signup", label: "Sign Up" },
] as const;

export function AuthSegmented({ value, onChange }: AuthSegmentedProps) {
  return (
    <div className="flex h-[54px] w-full items-center gap-1 rounded-[8px] bg-auth-seg-bg p-[4px]">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[46px] flex-1 items-center justify-center rounded-[8px] px-5 text-[20px] font-medium transition-colors",
              active ? "bg-auth-seg-active text-white" : "text-[#B8B8B8] hover:text-white"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
