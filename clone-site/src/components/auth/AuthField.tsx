import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function AuthField({ label, hint, error, className, id, ...rest }: AuthFieldProps) {
  return (
    <div className="flex w-full flex-col">
      {(label || hint) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-grey-200">
              {label}
            </label>
          )}
          {hint && <span className="text-sm font-medium text-grey-200">{hint}</span>}
        </div>
      )}
      <input
        id={id}
        className={cn(
          "h-13 w-full rounded border bg-auth-card px-4 text-sm font-medium text-white transition-colors placeholder:text-white/40",
          "focus:border-blue-brand focus:outline-none focus:ring-2 focus:ring-blue-soft",
          error ? "border-auth-danger" : "border-auth-input-border",
          className
        )}
        {...rest}
      />
      {error && <p className="mt-2 text-xs font-medium text-auth-danger">{error}</p>}
    </div>
  );
}
