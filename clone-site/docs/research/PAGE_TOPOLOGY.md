# crypto.com/en — Page Topology (Aug 2026)

Viewport: 1440x900, page height: ~16300px (settled after lazy load). Site: Next.js + Tailwind, font: Inter. Light theme with dark sections.

## Sections (top → bottom, settled positions)

| # | Name | top px | height | Interaction model |
|---|------|--------|--------|-------------------|
| 1 | Header (sticky nav, bg #080D1B) | 0 | 54 | click/hover dropdowns |
| 2 | Hero | 54 | 1253 | scroll fade-in; layered: text + phone mockup image + gradient bg + bottom fade |
| 3 | TrustedBy ("Built for wealth") | 1307 | 858 | scroll fade-in; store badges + 150m+ users stats |
| 4 | LivePrices | 2165 | 1101 | click tabs (Trending / Top Movers), Highcharts sparkline cards, horizontal scroll |
| 5 | AppSection ("Crypto.com App") | 3202 | 3380 | scroll fade-ins; big rounded panel (32/64px radii), app screenshots, feature bullets |
| 6 | LearnSection ("Crypto beyond trading") | 6582 | 854 | cards row (Learn/Security/Support) with arrow links, hover |
| 7 | AdvancedTrading (dark #000) | 7371 | 2897 | scroll fade-ins; 3 sub-features: Ultra-low latency / Automate trades / Advanced order types |
| 8 | OnchainWallet (bg #F0F5FF) | 10204 | 2229 | scroll fade-ins; Self-custody control + CTA |
| 9 | Partners | 12369 | 1002 | logo marquee/grid |
| 10 | WaysToTrade | 13308 | 900 | cards: Create an account / Advanced / ... |
| 11 | FAQ | 14208 | 840 | accordion (click) |
| 12 | Footer | 15048 | 1252 | static, links |

## Global behavior notes
- Scroll-reveal: elements with `transition-all duration-1200 ease-in-out translate-y-16 opacity-0` animate to `translate-y-0 opacity-100` (IntersectionObserver).
- Rounded transitions between light/dark sections: containers with `rounded-tl-[64px] rounded-tr-[64px]` and `rounded-bl-[64px] rounded-br-[64px]` (32px on mobile).
- Horizontal scroll containers with `.no-scrollbar` class.
- Charts: Highcharts 12.4.0 (canvas/SVG) — replicate with lightweight SVG sparklines.
