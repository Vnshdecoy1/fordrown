import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { PillButton, PillLink, pillTextClasses } from "@/components/PillButton";
import { ArrowRightIcon } from "@/components/icons";

const stats = [
  { title: "Ultra-low latency", subtitle: "Competitive pricing across multiple trading pairs" },
  {
    title: "Competitive fees",
    subtitle: "Maker and taker fees as low as 0.08% / 0.18% - trade more, pay less",
  },
  { title: "Deeper liquidity", subtitle: "Order-book depth across 400+ markets for tighter spreads" },
  {
    title: "Pro-grade reliability",
    subtitle: "Trusted global infrastructure delivering 99.99% uptime worldwide",
  },
];

const productCards = [
  {
    title: "Advanced Order Types",
    desc: "Access stop-loss, OCO, and iceberg orders with precision",
    image: "/cdc_productcard_limitorders-1.webp",
    smallIcon: "/cdc_home_productcard_small_advancedordertypes.webp",
  },
  {
    title: "API Access",
    desc: "Connect via high-performance APIs for automated trading",
    image: "/cdc_productcard_api-1.webp",
    smallIcon: "/cdc_home_productcard_small_api.webp",
  },
  {
    title: "Introducing Supercharger",
    desc: "Deposit CRO and earn rewards effortlessly",
    image: "/cdc_productcard_supercharger-1.webp",
    smallIcon: "/cdc_home_productcard_small_supercharger.webp",
  },
];

export function AdvancedTrading() {
  return (
    <div className="mb-[-32px] w-full pb-[32px] lg:mb-[-64px] lg:pb-[64px]">
      <div className="z-10 w-full overflow-hidden rounded-t-[32px] pt-[96px] lg:rounded-t-[64px] lg:pt-[128px]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-8 pb-8 lg:gap-8 lg:px-16 lg:pb-0">
          <Reveal className="flex flex-row items-center justify-center gap-2.5">
            <div className="h-[35px] w-[35px]">
              <Image src="/cdc_icon_exchange.svg" alt="Exchange icon" width={35} height={35} className="h-[35px] w-[35px] object-fill" />
            </div>
            <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:text-[18px]">
              Advanced Trading
            </p>
          </Reveal>
          <Reveal className="flex max-w-[366px] flex-col items-center gap-1 lg:max-w-none" delay={100}>
            <h2 className="text-center text-[40px] leading-normal font-[550] tracking-[-0.2px] text-content-primary lg:text-[56px] lg:tracking-[-0.28px]">
              Power meets precision
            </h2>
            <h3 className="text-center text-[20px] leading-normal font-[600] text-content-secondary lg:text-[28px]">
              Trade with institutional-grade speed and deeper liquidity
            </h3>
          </Reveal>
          <Reveal className="hidden flex-wrap items-center justify-center gap-4 lg:flex" delay={200}>
            <PillLink href="#" label="Create Account" trailingIcon={<ArrowRightIcon width={16} height={16} color="#F7F9FA" />} className={pillTextClasses} />
            <PillButton label="Download the app" />
          </Reveal>
          <div className="relative w-full">
            <Image
              src="/cdc_home_exchangehero_global(usd).webp"
              alt="Advanced trading platform"
              width={5760}
              height={4222}
              className="h-auto w-full object-fill"
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col bg-[#000]">
        <div className="mx-auto w-full px-8 py-8 transition-all lg:py-16">
          <div className="mx-auto grid grid-cols-2 gap-x-6 gap-y-8 lg:flex lg:max-w-[1100px] lg:gap-8">
            {stats.map((s) => (
              <div key={s.title} className="flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-1">
                <p className="text-[18px] leading-normal font-[550] tracking-[-0.09px] text-content-primary lg:max-w-[300px] lg:text-[21px] lg:tracking-[-0.1px]">
                  {s.title}
                </p>
                <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:max-w-[300px] lg:text-[18px]">
                  {s.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:p-8">
          <div className="flex flex-col items-center gap-[26px] lg:gap-8">
            <div className="group relative z-10 flex h-[505px] w-full max-w-[1280px] overflow-hidden rounded-[32px] lg:h-[660px]">
              <Image
                src="/cdc_home_banner_exchange_web_usd.webp"
                alt="Automate your trades"
                width={2560}
                height={1187}
                className="absolute inset-0 z-0 mt-[240px] h-auto w-full scale-120 object-cover md:top-auto md:scale-100"
              />
              <div className="relative z-20 flex h-full w-full flex-col items-start justify-center gap-4 p-8 lg:p-16">
                <h3 className="text-[32px] font-[600] text-white-text lg:text-[48px]">
                  Automate your trades
                </h3>
                <p className="text-[18px] font-[550] text-grey-200 lg:text-[21px]">
                  Trade smarter with DCA, Grid, and TWAP bots
                </p>
                <PillButton label="Get the app" className="mt-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-16 md:flex-row md:gap-6 lg:pt-16 lg:pb-24">
          {productCards.map((card) => (
            <a key={card.title} href="#" className="flex-1">
              <div className="group relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[16px] bg-[#0F0F0F] p-4 md:p-8">
                <div className="relative z-10 flex w-full flex-row items-start justify-between px-4">
                  <Image src={card.smallIcon} alt={card.title} width={40} height={40} className="h-10 w-10" />
                </div>
                <Image
                  src={card.image}
                  alt={card.title}
                  width={1078}
                  height={540}
                  className="absolute top-0 right-[-50px] z-0 hidden h-full w-auto max-w-none origin-top-right scale-98 object-center lg:block"
                />
                <div className="relative z-10 flex max-w-[230px] flex-col items-start gap-4">
                  <h3 className="text-[21px] leading-normal font-[550] tracking-[-0.1px] text-white-text">
                    {card.title}
                  </h3>
                  <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:text-[18px]">
                    {card.desc}
                  </p>
                  <a href="#" className="flex items-center gap-1 text-[15px] font-semibold text-white-text transition-colors group-hover:text-blue-light">
                    Learn More
                    <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
                  </a>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
