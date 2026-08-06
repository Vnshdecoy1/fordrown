import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <path
        d="M14.94 11.66c-.02-2.38 1.95-3.52 2.04-3.58-1.11-1.62-2.84-1.85-3.45-1.87-1.47-.15-2.87.86-3.61.86-.75 0-1.9-.84-3.12-.82-1.61.02-3.09.93-3.92 2.37-1.67 2.9-.43 7.19 1.2 9.54.79 1.15 1.74 2.45 2.98 2.4 1.2-.05 1.65-.78 3.1-.78s1.86.78 3.12.75c1.29-.02 2.11-1.17 2.9-2.33.91-1.33 1.29-2.62 1.31-2.69-.03-.01-2.51-.96-2.55-3.85zM12.21 3.5c.66-.8 1.1-1.91.98-3.02-1.05.04-2.31.7-3.06 1.57-.61.71-1.14 1.84-1 2.92 1.06.08 2.15-.6 3.08-1.47z"
        fill="#0B1426"
      />
    </svg>
  );
}

const baseSocialClasses =
  "flex h-11 w-full items-center justify-center gap-3 rounded bg-white text-sm font-semibold text-[#0B1426] transition-colors hover:bg-auth-social-hover";

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={baseSocialClasses}>
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

export function AppleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(baseSocialClasses)}>
      <AppleIcon />
      Continue with Apple
    </button>
  );
}
