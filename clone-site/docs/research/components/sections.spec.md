# Remaining Sections Specification (combined)

All sections live inside `main.bg-[#080D1B]`. Dark text on dark bg; light sections set own bg.

## Shared patterns
- PillButton (glass): `group relative flex h-10 min-w-16 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[24px] bg-white/8 p-[8px_18px]` with:
  - shine sweep: `pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[100%]`
  - bottom gradient line (hover): `absolute bottom-0 left-1/2 h-[1px] w-1/2 -translate-x-1/2 transform bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100`
  - text: `text-[15px] leading-normal font-medium tracking-[-0.28px] text-grey-50` (white), optional leading icon 16px or trailing icon 16px
- Primary pill (waystotrade): `bg-[#1199FA] rounded-full px-6 py-3 md:px-8 md:py-4 hover:opacity-95` + `text-sm font-semibold text-white md:text-base`
- Section header block: icon row (35px icon + label 16/18px #A0A9BE font-[550]) → h2 `text-[40px] lg:text-[56px] font-[550] leading-normal tracking-[-0.2px] lg:tracking-[-0.28px] text-center text-content-primary` → h3 `text-[20px] lg:text-[28px] font-[600] leading-normal text-content-secondary text-center`
- Feature stat rows: grid `grid-cols-2 gap-x-6 gap-y-8 lg:flex lg:max-w-[1100px] lg:gap-8 mx-auto px-8 lg:py-16 py-8`; each: `flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-1`; title `text-[18px] lg:text-[21px] font-[550] leading-normal tracking-[-0.09px] lg:tracking-[-0.1px] lg:max-w-[300px] text-content-primary`; desc `text-[16px] lg:text-[18px] font-[550] leading-normal lg:max-w-[300px] text-content-secondary`

## LivePrices (`src/components/LivePrices.tsx`)
- Root: `mb-[-32px] w-full pb-[128px] lg:mb-[-64px] lg:pt-[128px] lg:pb-[160px]` bg `linear-gradient(0deg, #F0F5FF 0%, #33517B 28.86%, #131A2A 59.87%, #080D1B 89.59%)`
- H2: `text-[20px] lg:text-[28px] font-[600] leading-normal mb-7 lg:mb-[44px] text-center text-[#A0A9BE]` inner strong `text-[#F7F9FA]`: "Stay up-to-date with **live crypto prices**"
- Tabs: 2 buttons `h-8 rounded-[40px] text-[12px] font-semibold px-4 border` — inactive `border-white/10 bg-white/8 text-content-secondary`, active `border-[#1199FA] bg-[#1199FA]/10 text-[#1199FA]`; gap-4
- Cards row: `flex gap-4 overflow-x-auto no-scrollbar` + prev/next arrow buttons (`flex h-10 w-10 items-center justify-center rounded-full border border-white/10` at corners); 4 cards visible per tab; each card:
  `flex w-[410px] shrink-0 cursor-pointer flex-col gap-2 p-4 lg:h-[430px] lg:gap-6 lg:p-6 rounded-[32px] lg:rounded-[32px] bg-[#0B1426] hover:bg-[#1F283C] transition-colors` (mobile w 288 rounded-16)
  - Row: icon 40x40 (token png) + name/abbr + badge row (price 24/550 #F7F9FA; change pill `rounded-[40px] px-3 py-1 text-[12px] font-semibold` bg `#00A68C1F` text `#00A68C` for pos, `#FF5C561F`/`#FF5C56` neg) + sparkline SVG (viewBox 0 0 100 40, polyline w/ stroke #00A68C or #FF5C56, strokeWidth 2, fill none, preserveAspectRatio none)
  - Bottom: "Buy" text-[14px] font-semibold text-content-tertiary + price change "0.87% 24H" style
- Data (from tab-trending.json / tab-movers.json):
  - Trending: AgentFun.AI (AGENTFUN, $0.874456 USD, +46.22%), CCap (CAP, $0.02888214, -28.68%), Eclipse (ES, $0.00142985, +27.90%), Heima (HEI, $0.09606997, +21.68%)
  - Top Movers: VVS Finance (VVS, $0.00000062, -33.80%) + others (4 cards)

## AppSection (`src/components/AppSection.tsx`)
- Root: `z-10 w-full overflow-hidden rounded-br-[32px] rounded-bl-[32px] lg:rounded-br-[64px] lg:rounded-bl-[64px] rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-[96px] lg:pt-[128px]` bg `radial-gradient(70.47% 70.32% at 9.97% -7.02%, #2A3E5C 0%, #0B1420 100%)`
- Badge row: cdc_icon_mainapp.svg 35px + "Crypto.com App"
- H2: "Your crypto journey starts here"; H3: "Trade with ease and the lowest fees"
- CTAs: "Create Account" (arrow-forward.svg 16px) + "Get the app" (download.svg 16px) — PillButtons
- Product image: `/cdc_home_producthero_mainapp_usa_2x.webp` (1006x1818) centered max-w-[536px]
- Feature stats (4): "BTC, ETH, CRO, and 400+ crypto"/"Buy, sell, and trade in your local currency" · "Account Protection Programme"/"Up to US$250,000 against unauthorised transactions" · "Near-zero trading fees"/"When you buy crypto with a credit/debit card" · "Secure by design"/"Leading the industry in licences and certifications"
- Product cards grid: `mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-x-4 gap-y-6 px-4 py-10 md:gap-6 md:pt-16`; card (2-col) `group rounded-4 relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden p-4 md:p-8` bg `#151D32` radius 16:
  - Video card: video `/us-credit-card-video.mp4` absolute cover; overlay content: badge "Visa Card" + "Choose your card →"
  - 4 image cards: Baskets ("Thematic coins to instantly diversify your portfolio", "Browse Baskets") · Earn ("Generate passive income by putting idle assets to work", "Start Earning") · Staking ("On-chain staking earns you rewards for securing your favourite blockchain", "Stake Now") · Pay ("Spending crypto is easy with over 300,000 merchants worldwide", "Explore Pay"); card img `/cdc_productcard_<slug>-1.webp` 1078x540 right side + small icon `cdc_home_productcard_small_<slug>.webp` mobile; icon 40x40 at top-left, title 21px white 550, desc 16px #A0A9BE, CTA 15px white + →
  - Level Up banner: full width `max-w-[1100px] h-[305px] rounded-[16px] overflow-hidden` img `/level-up-desktop-banner.webp` cover + bottom gradient `linear-gradient(rgba(0,0,0,0) 50%, #000 100%)`; text: "Level Up" / "Subscribe to industry leading rewards" / "Learn More →"
  - Disclaimer (below banner, centered 11px #7B849B): from payload-richtext (use: "Card benefits and rewards are subject to applicable terms. Rewards on eligible spend. Available in eligible regions.")

## Learn (`src/components/Learn.tsx`)
- Root: `mb-[-32px] w-full pb-[32px] lg:mb-[-64px] lg:pb-[64px]` + inner rounded-top panel `rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-[96px] lg:pt-[128px]` bg `#0B1426` (actually check: bg white? — set `bg-[#0B1426]`; verified in build phase)
- H2: "Crypto beyond trading" (56px pattern), H3: none (subtitle: "Explore a full ecosystem built around crypto")
- 3 cards grid `mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-4 px-4 py-8 md:grid-cols-3 lg:gap-6 md:pt-16`; card `group rounded-4 relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden p-4 md:p-8` bg #F5F7FA (light):
  - img top: `/cdc_home_beyondcrypto_developer_2x.webp` / `crypto-beyond-trading-security.webp` / `cdc_home_beyondcrypto_university_2x.webp`
  - badge + title: "Learn"/"Learn the fundamentals and master crypto knowledge" + → ; "Security"/"Leading the world in licences, registrations, and certifications" ; "AI Trading"/"Harness AI-driven analysis to execute smarter, faster trades."

## AdvancedTrading (`src/components/AdvancedTrading.tsx`)
- Root: `mb-[-32px] w-full pb-[32px] lg:mb-[-64px] lg:pb-[64px]`; inner panel `rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-[96px] lg:pt-[128px]` bg `linear-gradient(185deg, rgba(0,0,0,0) 10%, #000 90.38%), linear-gradient(#0B1426...)` → use `bg-[#0B1426]` with black overlay panel below (see stats part: bg `#000`)
- Badge: cdc_icon_exchange.svg + "Advanced Trading"
- H2 "Power meets precision"; H3 "Trade with institutional-grade speed and deeper liquidity"
- CTAs: PillButton "Create Account", PillButton "Download the app"
- Hero img: `/cdc_home_exchangehero_global(usd).webp` 5760x4222 full-width
- Stats (4, bg #000 section): "Ultra-low latency"/"Competitive pricing across multiple trading pairs" · "Competitive fees"/"Maker and taker fees as low as 0.08% / 0.18% - trade more, pay less" · "Deeper liquidity"/"Order-book depth across 400+ markets for tighter spreads" · "Pro-grade reliability"/"Trusted global infrastructure delivering 99.99% uptime worldwide"
- Banner: `max-w-[1280px] h-[505px] lg:h-[660px] rounded-[32px] overflow-hidden` img `/cdc_home_banner_exchange_web_usd.webp` (2560x1187) cover, overlay: "Automate your trades" + "Trade smarter with DCA, Grid, and TWAP bots" + PillButton "Get the app"
- Product cards (3, bg #000): `mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-16 md:flex-row md:gap-6 lg:pt-16 lg:pb-24`; card `group rounded-4 relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden p-4 md:p-8` bg `#0F0F0F` radius 16 height 272:
  - "Advanced Order Types"/"Access stop-loss, OCO, and iceberg orders with precision"/"Learn More" + img `/cdc_productcard_limitorders-1.webp`
  - "API Access"/"Connect via high-performance APIs for automated trading"/"Learn More" + img `/cdc_productcard_api-1.webp`
  - "Introducing Supercharger"/"Deposit CRO and earn rewards effortlessly"/"Learn More" + img `/cdc_productcard_supercharger-1.webp`

## OnchainWallet (`src/components/OnchainWallet.tsx`)
- Root: bg `#F0F5FF` (light) `rounded-b-[32px] lg:rounded-b-[64px]` + bottom fade `absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-b from-transparent to-[#F0F5FF]`
- Badge: cdc_icon_onchain.svg + "Onchain Wallet"
- H2 "Your Trusted Onchain Gateway" (dark text #080D1B); H3 "Take private control of your crypto. Manage all your assets in one secure wallet - trusted by millions, powered by Crypto.com." (dark #7B849B)
- CTAs (dark variants): PillButton dark "Download Extension" (download-black.svg), "Learn More" (arrow-forward-black.svg), "Get the app"
- Product image: `/cdc_producthero_onchain_global.webp` 2241x3145
- Feature stats (3): "Self-custody control"/"Maintain full control of your private keys and assets" · "Multi-chain access"/"Bridge and transact seamlessly across multiple chains" · "DeFi integration"/"Access hundreds of DApps and protocols in one place"
- Banner: `/onchain-banner-desktop-1.webp` 2560x580; content "Get the onchain wallet"/"Explore DeFi safely with Crypto.com"/"Get Started →"

## Partners (`src/components/Partners.tsx`)
- Root: bg `linear-gradient(0deg, #F0F5FF 0%, #33517B 28.86%, #131A2A 59.8%, #080D1B 100%)` `pt-[128px] pb-[64px]` centered
- H2 (white): "We work with world-class brands, institutions, and partners to put crypto in every wallet." max-w-[900px] center
- CTA: link "More about our Partners →" (white/blue)
- Video: `/cdc_dotcom_partner-sizzle-reel_desktop_low.mp4` full-width autoplay muted loop playsinline

## WaysToTrade (`src/components/WaysToTrade.tsx`)
- Root: inner panel `rounded-tl-[32px] rounded-tr-[32px] lg:rounded-tl-[64px] lg:rounded-tr-[64px] pt-[16px]` bg `#0B1426`
- H2 "One platform, multiple ways to trade" + primary pill "Create an account" (bg #1199FA rounded-full)
- 3 cards (desktop `hidden lg:flex h-[560px] max-w-[1200px] gap-[10px]`, mobile stacked `lg:hidden` h-[455px] max-w-[400px]); card `group rounded-4 relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden p-4 md:p-8` radius 16:
  - Card 1: bg gradient overlay + img `/cdc_home_moreways_exchange_global(usd).webp` 1600x2080; icon cdc_icon_exchange.svg; badge "Advanced Features"; title "Advanced Trading"; desc "Pro features for advanced traders"; CTA "Open the Exchange →"
  - Card 2: bg `#151D32` + bottom gradient; img `/cdc_home_multiplewaystotrade_mainapp_usd_2x.webp` 800x1040; icon cdc_icon_mainapp.svg; badge "Easy & Fast"; title "Crypto.com App"; desc "All-in-one platform built for everyday users"; CTA "Start Trading →"
  - Card 3: bg white + dark overlay; img `/cdc_home_multiplewaystotrade_onchain_usd_2x.webp`; icon cdc_icon_onchain.svg; badge "Explore Defi"; title "Onchain Wallet"; desc "Self-custody wallet built for Web3 users"; CTA "Download the App →"

## FAQ (`src/components/FAQ.tsx`)
- Root: `bg-[#080D1B]` `px-4 py-16 md:px-8 lg:px-16 lg:py-24` centered; H2 "FAQ" 56px white center
- Accordion: `mx-auto flex w-full max-w-[900px] flex-col gap-2` (max-w 900px); item: `rounded-[16px] bg-[#0B1426]`? (verify — earlier: bg-transparent with border); button row `flex w-full items-center justify-between gap-4 px-6 py-5 text-left`; Q `text-[16px] lg:text-[20px] font-[600] text-content-primary`; plus icon `24x24 /assets/cards/plus-sign.svg` rotate-45 when open; answer `px-6 pb-6 text-[14px] lg:text-[16px] font-normal leading-relaxed text-content-secondary` (#A0A9BE)
- 9 items from faq-full.json (full verbatim text there)
- Footer note: "Have more questions?" + "Contact Us" link (→ /contact-us? — use href="#")

## Footer (`src/components/Footer.tsx`)
- Root: `bg-[#080D1B] border-t border-white/5`? (verify: bg dark); disclaimer paragraphs (2) text 11px #7B849B max-w
- Region row: globe icon + "English" + "USD" pills
- Columns (6 groups, from footer-columns.json): Products (Crypto.com App, Advanced, Onchain, Level Up, Markets, Crypto, Features, Cards, Baskets, Earn, Staking, DeFi Staking, Pay, Prime, NFT), Businesses (Custody, Institutions, Trading API, Pay for Merchant, MM Programme, VIP Portal, Predictions), Developers (Cronos PoS, Cronos EVM, Cronos zkEVM, Pay SDK, AI Agent SDK), Resources (Research, Market Updates, Learn, BTC/USD Converter, Glossary, Price Widgets, Telegram Bot, Support), Company (About Us, Roadmap, Careers, Partners, Security, Proof of Reserves, Affiliate, Licenses & Registrations, Listing, Climate, Capital, Verify, Updates)
- Cert badges row: aicpa-soc 50x50, iso-27701 52x50, iso-22301 50x50, pci-dss 77x48
- Bottom: logo 120x24, tagline "Cryptocurrency in Every Wallet™", socials (Reddit, Discord, Instagram, Facebook, Linkedin, TradingView), copyright "Copyright © 2018 - 2026 Crypto.com. All rights reserved.", legal links (Privacy Notice, Status, Cookie Preferences, Location and Language)
- Column title: 12px #A0A9BE uppercase; links: text-[14px] lg:text-[16px] text-content-secondary hover:text-content-primary

## Notes for build verification
- Confirm FAQ item bg, footer structure, partners layout against live site after build via CDP DOM diff.
