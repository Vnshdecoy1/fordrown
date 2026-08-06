"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";

interface ProductCardLink {
  icon: string;
  title: string;
  subtitle: string;
  cta: string;
  links?: string[];
}

interface ColumnGroup {
  title: string;
  links: string[];
}

interface PanelData {
  id: string;
  label: string;
  cards?: ProductCardLink[];
  columns: ColumnGroup[];
}

const navItems: { label: string; id: string }[] = [
  { label: "Markets", id: "markets" },
  { label: "Individuals", id: "individuals" },
  { label: "Businesses", id: "businesses" },
  { label: "Discover", id: "discover" },
];

const panels: PanelData[] = [
  {
    id: "markets",
    label: "Markets",
    columns: [
      { title: "Crypto", links: ["All Coins", "Baskets", "Earn", "Staking", "Perpetuals"] },
      { title: "Tokenized Stocks", links: ["All Tokenized Stocks"] },
      { title: "Predictions", links: ["Sports", "Financials", "Elections", "Economics"] },
      { title: "Trending", links: ["Bitcoin", "Ethereum", "XRP", "Dogecoin", "Cronos"] },
    ],
  },
  {
    id: "individuals",
    label: "Individuals",
    cards: [
      {
        icon: "/assets/logo/main-app-default.svg",
        title: "Crypto.com App",
        subtitle: "For everyday users",
        cta: "Get Started",
        links: ["Crypto", "Visa Prepaid Card", "Level Up"],
      },
      {
        icon: "/assets/logo/exchange-default.svg",
        title: "Exchange",
        subtitle: "For advanced traders",
        cta: "Start Trading",
        links: ["Spot Orderbook", "Trading API", "Perpetual Futures", "CDCX CLI", "TradingView"],
      },
      {
        icon: "/assets/logo/onchain-default.svg",
        title: "Onchain",
        subtitle: "For web3 enthusiasts",
        cta: "Go to Onchain",
        links: ["Swap", "Stake", "Browse dApps"],
      },
    ],
    columns: [],
  },
  {
    id: "businesses",
    label: "Businesses",
    cards: [
      {
        icon: "/assets/logo/exchange-default.svg",
        title: "Exchange",
        subtitle: "For advanced traders",
        cta: "Start Trading",
        links: ["Institutions", "Custody", "API & FIX 4.4", "TradingView", "Predictions"],
      },
      {
        icon: "/assets/logo/pay-app-default.svg",
        title: "Pay",
        subtitle: "For merchants",
        cta: "Merchant Sign Up",
        links: ["Pay Terminal", "Pay SDK", "eCommerce Plugins"],
      },
      {
        icon: "/assets/logo/cronos-app-default.svg",
        title: "Cronos",
        subtitle: "EVM-Compatible Layer 1",
        cta: "Explore Cronos",
        links: ["Cronos PoS", "Cronos EVM", "Cronos zkEVM", "AI Agent SDK"],
      },
    ],
    columns: [{ title: "Programs", links: ["Affiliate", "Market Maker", "VIP Portal"] }],
  },
  {
    id: "discover",
    label: "Discover",
    columns: [
      {
        title: "Crypto.com",
        links: [
          "About Us",
          "Company News",
          "Product News",
          "Events",
          "Careers",
          "Partners",
          "Security",
          "Licenses & Registration",
          "MCP Servers",
          "Trading Skill Repo",
        ],
      },
      { title: "Learn", links: ["Learn"] },
      { title: "Research", links: ["Research"] },
      { title: "Market Updates", links: ["Market Updates"] },
    ],
  },
];

const navLinkClasses =
  "pt-[28px] pr-[32px] pb-[30px] text-[14px] leading-[20px] font-medium tracking-[0.14px] text-white-text";

export function Header() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeData = panels.find((p) => p.id === activePanel) ?? null;

  return (
    <header className="sticky top-0 z-299 h-[54px] bg-navy-900">
      <div className="mx-auto flex h-[54px] max-w-[1460px] items-center justify-between bg-inherit px-[16px]">
        <div className="flex items-center">
          <div className="mr-[8px] w-[120px]">
            <a href="/en" aria-label="Crypto.com home">
              <Image
                src="/assets/logo/crypto-com.svg"
                alt="Crypto.com Logo"
                width={120}
                height={24}
                priority
              />
            </a>
          </div>
          <nav className="hidden items-center lg:flex">
            {navItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  navLinkClasses,
                  activePanel === item.id ? "cursor-default" : "cursor-pointer"
                )}
                onMouseEnter={() => setActivePanel(item.id)}
                onMouseLeave={() => setActivePanel(null)}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-[8px] lg:flex">
          <div className="flex h-[32px] items-center rounded-[24px] bg-white/5 px-[12px]">
            <SearchIcon width={16} height={16} color="#A0A9BE" />
          </div>
          <a
            href="#"
            className="flex h-[32px] items-center rounded-[24px] bg-[rgba(17,153,250,0.20)] px-[12px] text-[14px] leading-[20px] font-semibold text-blue-light hover:bg-[rgba(17,153,250,0.30)]"
          >
            Log In
          </a>
          <a
            href="#"
            className="flex h-[32px] items-center rounded-[72px] bg-blue-brand px-[12px] text-[14px] leading-[20px] font-semibold text-white-text hover:opacity-90"
          >
            Sign Up
          </a>
          <div className="relative flex h-[32px] w-[32px] items-center justify-center">
            <Image
              src="/assets/logo/globe-grey.svg"
              alt="Language selector"
              width={20}
              height={21}
            />
          </div>
        </div>
        <button
          className="flex h-[32px] w-[32px] items-center justify-center rounded-[24px] border-[1.5px] border-white/10 hover:bg-white/10 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {mobileOpen ? (
              <path d="M4 4L12 12M12 4L4 12" stroke="#F7F9FA" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M2 5H14M2 8H14M2 11H14" stroke="#F7F9FA" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "relative transition-opacity duration-200",
          activePanel ? "visible opacity-100" : "invisible opacity-0"
        )}
        onMouseEnter={() => activePanel && setActivePanel(activePanel)}
        onMouseLeave={() => setActivePanel(null)}
      >
        <div className="absolute left-0 top-0 z-299 h-auto w-full bg-navy-900 pt-[24px] pb-[96px]">
          <div className="mx-auto max-w-[1108px]">
            <div className="flex flex-wrap gap-[24px]">
              {activeData?.cards?.map((card) => (
                <div key={card.title} className="w-[238px]">
                  <a href="#" className="block cursor-pointer">
                    <div className="flex gap-[12px]">
                      <div className="h-[40px] w-[40px]">
                        <Image src={card.icon} alt={card.title} width={40} height={40} />
                      </div>
                      <div className="flex flex-col gap-[4px]">
                        <span className="text-[14px] leading-[20px] font-medium text-white-text">
                          {card.title}
                        </span>
                        <span className="text-[12px] leading-[20px] font-medium tracking-[0.12px] text-grey-200">
                          {card.subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="mb-[18px] mt-[24px] flex items-center gap-[8px]">
                      <a
                        href="#"
                        className="flex h-[32px] items-center justify-center rounded-[24px] border border-[#212532] p-[8px_12px] text-[12px] font-medium text-white-text hover:border-white/30"
                      >
                        {card.cta}
                      </a>
                      <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[24px] border-[1.5px] border-white/10">
                        <Image
                          src="/assets/logo/download.svg"
                          alt="Download"
                          width={16}
                          height={16}
                        />
                      </div>
                    </div>
                  </a>
                  <div className="flex flex-col gap-[8px]">
                    {card.links?.map((link) => (
                      <a
                        key={link}
                        href="#"
                        className="text-[13px] leading-[20px] font-medium text-grey-200 hover:text-blue-light"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              {activeData?.columns.map((col) => (
                <div key={col.title} className="w-[238px]">
                  <div className="mb-[12px] block h-[32px] text-[12px] leading-[16px] font-semibold text-grey-200">
                    {col.title}
                  </div>
                  <div className="flex flex-col">
                    {col.links.map((link) => (
                      <a
                        key={link}
                        href="#"
                        className="block py-[3px] text-[18px] leading-[32px] font-semibold text-white-text hover:text-blue-light"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[54px] bottom-0 z-299 overflow-y-auto bg-navy-900 px-[16px] py-[24px] lg:hidden">
          {navItems.map((item) => (
            <div key={item.id} className="mb-[8px]">
              <div className="flex items-center justify-between border-b border-white/10 py-[16px]">
                <span className="text-[18px] font-semibold text-white-text">{item.label}</span>
                <ChevronDownIcon width={16} height={16} color="#A0A9BE" />
              </div>
            </div>
          ))}
          <div className="mt-[24px] flex flex-col gap-[8px]">
            <a
              href="#"
              className="flex h-[40px] items-center justify-center rounded-[24px] bg-[rgba(17,153,250,0.20)] text-[14px] font-semibold text-blue-light"
            >
              Log In
            </a>
            <a
              href="#"
              className="flex h-[40px] items-center justify-center rounded-[72px] bg-blue-brand text-[14px] font-semibold text-white-text"
            >
              Sign Up
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
