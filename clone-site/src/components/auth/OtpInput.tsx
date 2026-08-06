"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  error?: boolean;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
}

export function OtpInput({ length = 6, error, onComplete, autoFocus = true }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, length);
    const next = Array(length).fill("");
    cleaned.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    if (cleaned.length === length) {
      onComplete?.(cleaned);
    }
  };

  const borderClass = error
    ? "border-auth-danger"
    : focused || digits.some(Boolean)
      ? "border-blue-brand"
      : "border-[#a0a9be]";

  const activeIndex = focused ? digits.findIndex((d) => d === "") : -1;

  return (
    <div
      className="relative cursor-text select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <div
            key={index}
            className={cn(
              "relative flex h-14 w-[70px] items-center justify-center border-b-2 text-[48px] font-medium leading-[48px] text-white transition-colors duration-300",
              borderClass
            )}
          >
            {digit}
            {activeIndex === index && (
              <span className="animate-caret-blink absolute top-1/2 h-8 w-px -translate-y-1/2 bg-blue-brand" />
            )}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        autoComplete="one-time-code"
        value={digits.join("")}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={`${length}-digit verification code`}
        className="absolute inset-0 h-full w-full border-0 bg-transparent font-mono text-[56px] leading-none tracking-[-0.5em] text-transparent caret-transparent outline-none tabular-nums"
      />
    </div>
  );
}
