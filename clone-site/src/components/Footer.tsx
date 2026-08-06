import Image from "next/image";

const columns: { title: string; groups: { title?: string; links: string[] }[] }[] = [
  {
    title: "Products",
    groups: [{ links: ["Crypto.com App", "Advanced", "Onchain", "Level Up"] }],
  },
  {
    title: "Markets",
    groups: [
      { links: ["Crypto"] },
      {
        title: "Features",
        links: ["Cards", "Baskets", "Earn", "Staking", "DeFi Staking", "Pay", "Prime", "NFT"],
      },
    ],
  },
  {
    title: "Businesses",
    groups: [
      {
        links: [
          "Custody",
          "Institutions",
          "Trading API",
          "Pay for Merchant",
          "MM Programme",
          "VIP Portal",
          "Predictions",
        ],
      },
      { title: "Developers", links: ["Cronos PoS", "Cronos EVM", "Cronos zkEVM", "Pay SDK", "AI Agent SDK"] },
    ],
  },
  {
    title: "Resources",
    groups: [
      {
        links: [
          "Research",
          "Market Updates",
          "Learn",
          "BTC/USD Converter",
          "Glossary",
          "Price Widgets",
          "Telegram Bot",
          "Support",
        ],
      },
    ],
  },
  {
    title: "Company",
    groups: [
      {
        links: [
          "About Us",
          "Roadmap",
          "Careers",
          "Partners",
          "Security",
          "Proof of Reserves",
          "Affiliate",
          "Licenses & Registrations",
          "Listing",
          "Climate",
          "Capital",
          "Verify",
        ],
      },
    ],
  },
  {
    title: "Updates",
    groups: [
      {
        links: ["X", "Product News", "Events", "Reddit", "Discord", "Instagram", "Facebook", "Linkedin", "TradingView"],
      },
    ],
  },
];

const certBadges = [
  { src: "/assets/logo/aicpa-soc.svg", alt: "AICPA SOC", w: 50, h: 50 },
  { src: "/assets/logo/iso-27701.svg", alt: "ISO 27701", w: 52, h: 50 },
  { src: "/assets/logo/iso-22301.svg", alt: "ISO 22301", w: 50, h: 50 },
  { src: "/assets/logo/pci-dss.svg", alt: "PCI DSS", w: 77, h: 48 },
];

export function Footer() {
  return (
    <footer className="bg-[#080D1B]">
      <div className="mx-auto max-w-[1460px] p-[24px] lg:p-[80px]">
        <div className="flex flex-col gap-[16px] py-[40px] text-[12px] font-normal text-[#7B849B] lg:flex-row lg:items-start lg:justify-between lg:py-[80px]">
          <div className="max-w-[740px] text-[14px] font-normal leading-[21px] text-[#7B849B]">
            <p>
              The purpose of this website is solely to display information regarding the products
              and services available on the Crypto.com App. It is not intended to offer access to
              any of such products and services. You may obtain access to such products and
              services on the Crypto.com App.
            </p>
            <br />
            <p>
              Please note that the availability of the products and services on the Crypto.com App
              is subject to jurisdictional limitations. Crypto.com may not offer certain products,
              features and/or services on the Crypto.com App in certain jurisdictions due to
              potential or actual regulatory restrictions.
            </p>
          </div>
          <div className="flex gap-[16px]">
            {certBadges.map((b) => (
              <Image key={b.src} src={b.src} alt={b.alt} width={b.w} height={b.h} />
            ))}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <a href="/en">
            <Image
              src="/assets/logo/crypto-com.svg"
              alt="Crypto.com"
              width={194}
              height={38}
              className="h-[38px] w-[194px]"
            />
          </a>
          <div className="flex items-center justify-center gap-[8px] rounded-[40px] bg-transparent p-[8px_12px] text-[14px] font-medium tracking-[0.14px]">
            <button className="flex cursor-pointer items-center hover:underline">
              <span className="mr-[6px] flex items-center justify-center rounded-[24px] border-[1.5px] border-white/10 p-[5px]">
                <Image src="/assets/logo/globe-grey.svg" alt="" width={16} height={16} />
              </span>
              <span className="text-[14px] leading-[20px] font-medium tracking-[0.14px] text-white-text">
                English
              </span>
            </button>
            <span className="mx-[2px] text-[#7B849B]">|</span>
            <button className="cursor-pointer text-[14px] leading-[20px] font-medium tracking-[0.14px] text-white-text hover:underline">
              USD
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-[24px] gap-y-[48px] py-[40px] lg:py-[80px]">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-[40px]">
              {col.groups.map((group) => (
                <div key={group.title ?? col.title}>
                  {group.title && (
                    <span className="mb-[16px] block text-[14px] leading-[142.857%] font-medium tracking-[0.14px] text-[#858992]">
                      {group.title}
                    </span>
                  )}
                  <div className="flex flex-col gap-[16px]">
                    {group.links.map((link) => (
                      <a
                        key={link}
                        href="#"
                        className="block text-[16px] leading-[125%] font-medium text-white hover:text-[#92D1FF]"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-[16px]">
          <p className="text-left text-[16px] leading-[20px] font-bold text-[#7B849B]">
            Cryptocurrency in Every Wallet™
          </p>
          <div className="mt-[16px] flex flex-col items-start justify-between gap-[16px] lg:flex-row lg:items-center">
            <span className="text-[12px] font-normal text-[#7B849B]">
              Copyright © 2018 - 2026 Crypto.com. All rights reserved.
            </span>
            <div className="flex flex-wrap items-center justify-center">
              <a
                href="#"
                className="border-r border-[#212532] px-[8px] text-[12px] font-normal text-[#7B849B] hover:underline"
              >
                Privacy Notice
              </a>
              <a
                href="#"
                className="border-r border-[#212532] px-[8px] text-[12px] font-normal text-[#7B849B] hover:underline"
              >
                Status
              </a>
              <button className="cursor-pointer px-[8px] text-[12px] font-normal text-[#7B849B] hover:underline">
                Cookie Preferences
              </button>
              <a
                href="#"
                className="border-l border-[#212532] px-[8px] text-[12px] font-normal text-[#7B849B] hover:underline"
              >
                Location and Language
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
