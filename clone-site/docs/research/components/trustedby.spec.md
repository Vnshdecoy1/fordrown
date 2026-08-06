# TrustedBy Specification

- **Target file:** `src/components/TrustedBy.tsx`
- **Interaction model:** scroll-driven (Reveal animation on heading)

## Context
- Page `main` has `bg-[#080D1B]` (dark navy) — this section is transparent → dark bg. Light-colored sections set their own bg.
- Heading is WHITE on dark bg.

## DOM Structure

```
section.flex.flex-col.items-center.p-[16px_12px_88px_12px].lg:p-[64px_16px_128px_16px]
  div (Reveal wrapper)
    h2 "Built for wealth, made for everyone"
      text-[22px] lg:text-[40px] font-[550] leading-[24px] lg:leading-[40px] tracking-[-0.12px] lg:tracking-[-0.2px] text-center text-[#F7F9FA] mb-8
    div.flex.mt-8.mb-16.w-full.flex-col.gap-2.lg:mb-[180px].lg:gap-10.lg:grid.lg:grid-cols-2.lg:max-w-[614px]
      div.flex.flex-row.items-center.gap-2.lg:gap-3
        div.h-16 → img /cdc-app-store-rating.svg (70x54)
        p "App Store Rating" — text-[18px] lg:text-[21px] font-[550] tracking-[-0.09px] lg:tracking-[-0.1px] text-[#7B849B]
      div (same) → /cdc-google-play-rating.svg + "Google Play Rating"
  div.w-full
    div.flex.w-full.flex-col.items-center.gap-4.lg:flex-row.lg:justify-center.lg:gap-6
      3x stat cards (below)
```

## Stat card (exact)

```
div.flex.w-full.flex-col.rounded-[16px].p-8.md:w-[406px].lg:h-[350px].lg:max-w-[416px]
  background: linear-gradient(352deg, rgb(11,20,38) 59.38%, rgb(64,88,152) 235.63%)
  border-radius: 16px; padding: 32px
  div.mb-4.h-8.w-8 → img 32x32 (icon)
  div.text-[20px].lg:text-[28px].font-[600].leading-normal.mb-6.text-[#F7F9FA].lg:mb-0
    p "150m+ users" / p "globally"   (two lines for card 1&2; single line for card 3 "Zero-fee deposits")
  p.text-[18px].lg:text-[21px].font-[550].tracking-[-0.09px].lg:tracking-[-0.1px].text-content-secondary.mt-auto.opacity-54
    "Trusted by investors around the world since 2016"
```

Third card has `transform: translateY(20px)` offset (staggered layout).

## Stats content (verbatim)

1. icon /globe.svg — "150m+ users" / "globally" — "Trusted by investors around the world since 2016"
2. icon /checkmark.svg — "Sign up in" / "minutes" — "Set up your account and begin trading in a few steps"
3. icon /fingerprint.svg — "Zero-fee deposits" — "Fund your wallet at no cost with major fiat currencies"

## Assets
- /cdc-app-store-rating.svg, /cdc-google-play-rating.svg, /globe.svg, /checkmark.svg, /fingerprint.svg

## Responsive
- Mobile: cards stack, title 20px, h2 22px; desktop: 3-col row, cards 350px tall
