# Shared Components Specification

## 1. Reveal (scroll-in animation wrapper)

Target file: `src/components/Reveal.tsx`

- **Interaction model:** scroll-driven (IntersectionObserver)
- The site animates sections into view: elements start with classes `transition-all duration-1200 ease-in-out translate-y-16 opacity-0` and transition to `translate-y-0 opacity-100` when scrolled into view.
- Implementation: client component using IntersectionObserver with threshold ~0.15; applies `translate-y-16 opacity-0` initially and toggles to `translate-y-0 opacity-100` (or vice versa) with a 1200ms ease-in-out transition when visible.
- Props: `children`, `className`, `delayMs` (stagger, applied via `transitionDelay`).

## 2. Sparkline (SVG line chart)

Target file: `src/components/Sparkline.tsx`

- Used inside price cards (replaces Highcharts). Draws a smooth SVG polyline of ~28 mock points.
- Props: `points: number[]`, `width` (default 410 card width internal), `height` (~120), `positive: boolean`.
- Color: positive → #00C076-ish green, negative → #FF4D5E-ish red. (Extract real colors below.)
- `preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"`, stroke-width ~2, no fill.

## 3. PillButton / CTA buttons

Two variants used site-wide:

**Primary CTA** (blue):
- `bg-[#1199FA] text-[#F7F9FA]` rounded-[10px] (large) or rounded-full (some)
- text `text-[14px] font-[600] leading-[142%]`
- Hover: opacity ~0.95
- Large hero button: `h-[59px] p-[12px_24px] rounded-[10px]`

**Secondary pill** (glass):
- `bg-white/8` (rgba(255,255,255,0.08)) rounded-[24px], h-10, px-[18px] py-[8px]
- text: `text-[15px] leading-normal font-medium tracking-[-0.28px] text-[#F7F9FA]`
- Contains shine sweep overlay on hover: `absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent` animating to translate-x-[100%] on hover (group-hover)
- Bottom gradient line on hover: `absolute bottom-0 left-1/2 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100`
- Inner top border on hover: `absolute inset-[1px] rounded-[23px] bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100`
- Icons inside: 16px images (arrow-forward.svg / download.svg)

## 4. Colors / tokens (verified computed values)

- Page bg (light sections): #FFFFFF, hero gradient uses #080D1B → #273D5D → #A3B3CA → #EFEFEF
- Dark navy bg: `#080D1B` (header, footer, FAQ, parts)
- Panel navy: `#0B1420` (app section panels)
- Card navy: `#151D32` (product cards)
- White text: `#F7F9FA`
- Grey text secondary: `#A0A9BE`
- Grey text tertiary: `#7B849B`
- Blue brand: `#1199FA`; light blue: `#92D1FF`; blue soft bg: rgba(17,153,250,0.20)
- Border grey: `#323C52`; light border: `#212532`
- Light blue section bg: `#F0F5FF`
- FAQ answer text: `#C9CFDD`
- Green (price up): #00B86B (approx); Red (price down): #FF4D5E (approx — verify in card extraction below)
- Gradients:
  - LivePrices section bg: `linear-gradient(0deg, #F0F5FF 0%, #33517B 28.86%, #131A2A 59.8%, #080D1B 100%)`
  - App section radial: `radial-gradient(70.47% 70.32% at 9.97% -7.02%, #2A3E5C 0%, #0B1420 100%)`
  - Learn card image overlay: `linear-gradient(rgba(0,0,0,0) 50%, rgb(0,0,0) 100%)`
  - Advanced top panel: `linear-gradient(185deg, rgba(0,0,0,0) 10%, #000 90.38%), linear-gradient(rgb(0,0,0) 0%, rgb(0,0,0) 100%)` — plus image
  - Onchain panel: bg #F0F5FF with `linear-gradient(rgba(240,245,255,0) 69.42%, #F0F5FF 100%)` bottom fade
  - Partners section: same gradient as LivePrices: `linear-gradient(0deg, #F0F5FF 0%, #33517B 28.86%, #131A2A 59.8%, #080D1B 100%)`
  - WaysToTrade: bg #0B1420
  - FAQ: bg #080D1B
