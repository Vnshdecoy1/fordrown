"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const baseClasses =
  "group relative flex h-10 min-w-16 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[24px] bg-btn-secondary-bg p-[8px_18px] transition-colors";

function Shine() {
  return (
    <>
      <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[100%]" />
      <span className="pointer-events-none absolute inset-[1px] rounded-[23px] bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <span className="absolute bottom-0 left-1/2 h-[1px] w-1/2 -translate-x-1/2 transform bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
    </>
  );
}

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  label?: string;
}

export function PillButton({ leadingIcon, trailingIcon, label, children, className, ...rest }: PillButtonProps) {
  return (
    <button className={cn(baseClasses, className)} {...rest}>
      <Shine />
      <span className="flex flex-row items-center justify-center gap-1">
        {leadingIcon}
        {label || children}
        {trailingIcon}
      </span>
    </button>
  );
}

interface PillLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  label?: string;
}

export function PillLink({ leadingIcon, trailingIcon, label, children, className, ...rest }: PillLinkProps) {
  return (
    <a className={cn(baseClasses, className)} {...rest}>
      <Shine />
      <span className="flex flex-row items-center justify-center gap-1">
        {leadingIcon}
        {label || children}
        {trailingIcon}
      </span>
    </a>
  );
}

export const pillTextClasses =
  "text-[15px] leading-normal font-medium tracking-[-0.28px] text-grey-50";
