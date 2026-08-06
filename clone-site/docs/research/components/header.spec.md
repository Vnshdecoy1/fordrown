# Header Specification

- **Target file:** `src/components/Header.tsx`
- **Interaction model:** click/hover — dropdown panels on hover; mobile hamburger menu on click

## DOM Structure

```
header.sticky top-0 z-299 bg-[#080D1B] h-[54px]
  div (mx-auto flex h-[54px] max-w-[1460px] items-center justify-between bg-inherit px-[16px])
    div.flex.items-center
      div.w-[120px].mr-[8px]  → logo link (img /assets/logo/crypto-com.svg, 120x24)
      nav.desktop-only-flex.mx-[32px].items-center.visible
        a "Markets" (group, tracking-[0.14px], pt-[28px] pr-[32px] pb-[30px], text-[14px] leading-[20px] font-medium text-[#F7F9FA] hover:text-[#7B849B])
        div "Individuals" (same styles, cursor-default)
        div "Businesses" (same styles)
        div "Discover" (same styles)
    div.desktop-only.visible
      nav.flex.gap-[8px]
        div (search box area)
        a "Log In" — h-[32px] rounded-[24px] bg-[rgba(17,153,250,0.20)] px-[12px] text-[14px] leading-[20px] font-semibold text-[#92D1FF]
        a "Sign Up" — h-[32px] rounded-[72px] bg-[#1199FA] px-[12px] text-[14px] leading-[20px] font-semibold text-[#F7F9FA] hover:opacity-90
        div.relative (language selector)
        button (hamburger, h-[32px] w-[32px] rounded-[24px] border-[1.5px] border-[rgba(255,255,255,0.10)] hover:bg-white/10)
  div.relative.transition-opacity.opacity-0.invisible (dropdown panel, becomes opacity-100 visible on hover)
    div.absolute.top-0.left-0.z-299.h-auto.w-full.bg-[#080D1B].pt-[24px].pb-[96px]
      div.mx-auto.max-w-[1108px]
        div.flex.flex-wrap.gap-[24px]
          ...product cards + link columns...
```

## Styling Details

- Header: `position: sticky; top: 0; z-index: 299; background: #080D1B; height: 54px`
- Nav link: `font-size: 14px; line-height: 20px; font-weight: 500; color: #F7F9FA; padding: 28px 32px 30px 0; letter-spacing: 0.14px`
  - Hover: color → #7B849B
- Nav item is a `<div>` with `cursor: default` for dropdown items; mouseenter shows panel
- "Log In": `height: 32px; border-radius: 24px; background: rgba(17,153,250,0.20); padding: 0 12px; font: 600 14px/20px Inter; color: #92D1FF`
- "Sign Up": same size, `border-radius: 72px; background: #1199FA; color: #F7F9FA`; hover opacity ~0.9
- Dropdown panel: `position: absolute; top: 0; left: 0; z-index: 299; width: 100%; background: #080D1B; padding: 24px 0 96px; opacity: 0; visibility: hidden; transition: all`
  - On hover of nav item: `opacity: 1; visibility: visible`

### Dropdown panel content (all panels share one container; hover of each nav item shows its panel)

Panel inner: `max-width: 1108px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 24px`

**Product cards** (w-[238px]):
```
a.cursor-pointer (block)
  div.flex.gap-[12px]
    div.h-[40px].w-[40px]  → img 40x40 (logo icon)
    div.flex.flex-col.gap-[4px]
      span.text-[14px].leading-[20px].font-medium.text-[#F7F9FA]  (title e.g. "Crypto.com App")
      span.text-[12px].leading-[20px].font-medium.tracking-[0.12px].text-[#A0A9BE]  (subtitle e.g. "For everyday users")
  div.mt-[24px].mb-[18px].flex.items-center.gap-[8px]
    a.border-opacity-10.flex.h-[32px].items-center.justify-center.rounded-[24px].border.border-[#212532].p-[8px_12px]  (CTA e.g. "Get Started")
    div.relative (download icon btn: div.h-[32px].w-[32px].rounded-[24px].border-[1.5px].border-[rgba(255,255,255,0.10)] + img download.svg 16x16)
```

Cards in panel: **Crypto.com App** (main-app-default.svg, "For everyday users", CTA "Get Started"), **Exchange** (exchange-default.svg, "For advanced traders", CTA "Start Trading"), **Onchain** (onchain-default.svg, "For web3 enthusiasts", CTA "Go to Onchain"), **Pay** (pay-app-default.svg, "For merchants", CTA "Merchant Sign Up"), **Cronos** (cronos-app-default.svg, "EVM-Compatible Layer 1", CTA "Explore Cronos")

**Link columns** (w-[238px]):
```
div.w-[238px]
  div.block.h-[32px].text-[12px].leading-[16px].font-semibold.text-[#A0A9BE]  (column title, e.g. "Tokenized Stocks", "Trending", "Programs", "Crypto.com")
  a.block.text-[18px].leading-[32px].font-semibold.text-[#F7F9FA].hover:text-[#92D1FF]  (each link)
```

Column contents (verbatim from live site):

Markets panel (hover "Markets"): col1 links: All Coins, Baskets, Earn, Staking, Perpetuals (title above: "Crypto"); col2: All Tokenized Stocks (title "Tokenized Stocks"); col3: Sports, Financials, Elections, Economics (title "Predictions"); col4: Bitcoin, Ethereum, XRP, Dogecoin, Cronos (title "Trending")

Individuals panel: product cards Crypto.com App, Exchange, Onchain + card link lists: Crypto.com App card links: Crypto, Visa Prepaid Card, Level Up; Exchange card links: Spot Orderbook, Trading API, Perpetual Futures, CDCX CLI, TradingView; Onchain card links: Swap, Stake, Browse dApps

Businesses panel: product card Exchange (links: Institutions, Custody, API & FIX 4.4, TradingView, Predictions), Pay (links: Pay Terminal, Pay SDK, eCommerce Plugins), Cronos (links: Cronos PoS, Cronos EVM, Cronos zkEVM, AI Agent SDK), col "Programs": Affiliate, Market Maker, VIP Portal

Discover panel: col "Crypto.com": About Us, Company News, Product News, Events, Careers, Partners, Security, Licenses & Registration, MCP Servers, Trading Skill Repo; plus link columns: Learn, Research, Market Updates

## Mobile menu (below lg)

- Hamburger button visible only < lg (`lg:hidden` for burger, `desktop-only` = `hidden lg:flex` for nav/right side)
- On click opens full-screen overlay menu with nav groups (accordion lists)

## Assets
- Logo: `/assets/logo/crypto-com.svg`
- Product icons: `/assets/logo/main-app-default.svg`, `/assets/logo/exchange-default.svg`, `/assets/logo/onchain-default.svg`, `/assets/logo/pay-app-default.svg`, `/assets/logo/cronos-app-default.svg`
- Download icon: `/assets/logo/download.svg`; search: `/assets/logo/search.svg`; globe: `/assets/logo/globe-grey.svg`

## Responsive
- Desktop 1440: full nav visible
- <1024: nav hidden, hamburger visible, right side shows Sign Up + Log In (or burger only on <640)
