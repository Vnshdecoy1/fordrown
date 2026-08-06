import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export function PrimaryButton({ children, className, loading, disabled, ...rest }: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "flex h-11 w-full items-center justify-center rounded bg-auth-btn text-sm font-semibold text-white transition-colors",
        "hover:bg-auth-btn-hover",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-auth-btn",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
      ) : (
        children
      )}
    </button>
  );
}
