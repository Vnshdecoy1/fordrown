"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const RESEND_SECONDS = 60;

export function ResendButton({
  onResend,
  className,
}: {
  onResend?: () => void;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(0);
  const enabled = seconds === 0;

  useEffect(() => {
    if (!enabled) {
      const timer = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [enabled]);

  const handleClick = () => {
    if (!enabled) return;
    setSeconds(RESEND_SECONDS);
    onResend?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!enabled}
      className={cn(
        "h-11 rounded text-sm font-normal text-blue-brand transition-opacity disabled:opacity-60",
        className
      )}
    >
      {enabled ? "Resend" : `Resend (${seconds}s)`}
    </button>
  );
}
