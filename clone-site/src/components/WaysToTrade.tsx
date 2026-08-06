import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ArrowRightIcon } from "@/components/icons";

const cards = [
  {
    tag: "Advanced Features",
    title: "Advanced Trading",
    desc: "Pro features for advanced traders",
    cta: "Open the Exchange",
    icon: "/cdc_icon_exchange.svg",
    image: "/cdc_home_moreways_exchange_global(usd).webp",
    bg: "bg-transparent",
  },
  {
    tag: "Easy & Fast",
    title: "Crypto.com App",
    desc: "All-in-one platform built for everyday users",
    cta: "Start Trading",
    icon: "/cdc_icon_mainapp.svg",
    image: "/cdc_home_multiplewaystotrade_mainapp_usd_2x.webp",
    bg: "bg-[#151D32]",
  },
  {
    tag: "Explore Defi",
    title: "Onchain Wallet",
    desc: "Self-custody wallet built for Web3 users",
    cta: "Download the App",
    icon: "/cdc_icon_onchain.svg",
    image: "/cdc_home_multiplewaystotrade_onchain_usd_2x.webp",
    bg: "bg-white",
  },
];

export function WaysToTrade() {
  return (
    <div className="z-0 w-full">
      <div className="z-10 w-full overflow-hidden rounded-t-[32px] bg-[#0B1426] pt-[16px] lg:rounded-t-[64px]">
        <div className="flex w-full flex-col items-center px-4 py-[50px]">
          <Reveal className="flex flex-col items-center gap-8 pb-[68px] text-center">
            <h2 className="text-[40px] leading-normal font-[550] tracking-[-0.2px] text-content-primary lg:text-[56px] lg:tracking-[-0.28px]">
              One platform, multiple ways to trade
            </h2>
            <a
              href="#"
              className="cursor-pointer rounded-full bg-btn-primary-bg px-6 py-3 transition-colors hover:opacity-95 md:px-8 md:py-4"
            >
              <span className="text-sm font-semibold text-white md:text-base">
                Create an account
              </span>
            </a>
          </Reveal>
          <div className="mx-auto hidden h-[560px] w-full max-w-[1200px] flex-row items-center justify-center gap-[10px] lg:flex">
            {cards.map((card) => (
              <div key={card.title} className="h-[520px] flex-1 transition-all duration-300 ease-out">
                <a href="#" className="flex-1">
                  <div
                    className={`group relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[16px] p-4 md:p-8 ${card.bg}`}
                  >
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                    <Image
                      src={card.image}
                      alt={card.title}
                      width={1600}
                      height={2080}
                      className="absolute top-0 right-0 z-0 h-full w-auto max-w-none object-center"
                    />
                    <div className="relative z-10 flex w-full flex-row items-start justify-between px-4">
                      <div className="flex h-[35px] w-[35px] items-center justify-center rounded-[8px] bg-white/10">
                        <Image src={card.icon} alt="" width={24} height={24} className="h-6 w-6" />
                      </div>
                      <span className="rounded-[40px] border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.12px] text-white-text backdrop-blur">
                        {card.tag}
                      </span>
                    </div>
                    <div className="relative z-10 flex max-w-[300px] flex-col items-start gap-4">
                      <h3 className="text-[28px] leading-normal font-[600] text-white-text">
                        {card.title}
                      </h3>
                      <p className="text-[16px] leading-normal font-[550] text-grey-200 lg:text-[18px]">
                        {card.desc}
                      </p>
                      <a
                        href="#"
                        className="flex items-center gap-2 text-[16px] font-[600] text-white-text transition-colors group-hover:text-blue-light"
                      >
                        {card.cta}
                        <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
                      </a>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
          <div className="mx-auto flex w-full flex-col gap-[10px] lg:hidden">
            {cards.map((card) => (
              <div key={card.title} className="h-[455px] w-full md:mx-auto md:max-w-[400px]">
                <a href="#" className="flex-1">
                  <div
                    className={`group relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[16px] p-4 md:p-8 ${card.bg}`}
                  >
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                    <Image
                      src={card.image}
                      alt={card.title}
                      width={1600}
                      height={2080}
                      className="absolute top-0 right-0 z-0 h-full w-auto max-w-none object-center"
                    />
                    <div className="relative z-10 flex w-full flex-row items-start justify-between px-4">
                      <div className="flex h-[35px] w-[35px] items-center justify-center rounded-[8px] bg-white/10">
                        <Image src={card.icon} alt="" width={24} height={24} className="h-6 w-6" />
                      </div>
                      <span className="rounded-[40px] border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.12px] text-white-text backdrop-blur">
                        {card.tag}
                      </span>
                    </div>
                    <div className="relative z-10 flex max-w-[300px] flex-col items-start gap-4">
                      <h3 className="text-[28px] leading-normal font-[600] text-white-text">
                        {card.title}
                      </h3>
                      <p className="text-[16px] leading-normal font-[550] text-grey-200 lg:text-[18px]">
                        {card.desc}
                      </p>
                      <a
                        href="#"
                        className="flex items-center gap-2 text-[16px] font-[600] text-white-text transition-colors group-hover:text-blue-light"
                      >
                        {card.cta}
                        <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
                      </a>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
