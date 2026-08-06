import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { PillButton, PillLink, pillTextClasses } from "@/components/PillButton";
import { ArrowRightIcon } from "@/components/icons";

const features = [
  {
    title: "BTC, ETH, CRO, and 400+ crypto",
    subtitle: "Buy, sell, and trade in your local currency",
  },
  {
    title: "Account Protection Programme",
    subtitle: "Up to US$250,000 against unauthorised transactions",
  },
  {
    title: "Near-zero trading fees",
    subtitle: "When you buy crypto with a credit/debit card",
  },
  {
    title: "Secure by design",
    subtitle: "Leading the industry in licences and certifications",
  },
];

const productCards = [
  {
    title: "Baskets",
    desc: "Thematic coins to instantly diversify your portfolio",
    cta: "Browse Baskets",
    image: "/cdc_productcard_baskets-1.webp",
    smallIcon: "/cdc_home_productcard_small_baskets.webp",
  },
  {
    title: "Earn",
    desc: "Generate passive income by putting idle assets to work",
    cta: "Start Earning",
    image: "/cdc_productcard_earn-1.webp",
    smallIcon: "/cdc_home_productcard_small_earn.webp",
  },
  {
    title: "Staking",
    desc: "On-chain staking earns you rewards for securing your favourite blockchain",
    cta: "Stake Now",
    image: "/cdc_productcard_staking-1.webp",
    smallIcon: "/cdc_home_productcard_small_staking.webp",
  },
  {
    title: "Pay",
    desc: "Spending crypto is easy with over 300,000 merchants worldwide",
    cta: "Explore Pay",
    image: "/cdc_productcard_pay-1.webp",
    smallIcon: "/cdc_home_productcard_small_pay.webp",
  },
];

export function AppSection() {
  return (
    <div className="z-10 w-full overflow-hidden rounded-[32px] bg-[radial-gradient(70.47%_70.32%_at_9.97%_-7.02%,#2A3E5C_0%,#0B1420_100%)] pt-[96px] lg:rounded-[64px] lg:pt-[128px]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-8 pb-8 lg:gap-8 lg:px-16 lg:pb-0">
        <Reveal className="flex flex-row items-center justify-center gap-2.5">
          <div className="h-[35px] w-[35px]">
            <Image src="/cdc_icon_mainapp.svg" alt="CDC Icon" width={35} height={35} className="h-[35px] w-[35px] object-fill" />
          </div>
          <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:text-[18px]">
            Crypto.com App
          </p>
        </Reveal>
        <Reveal className="flex max-w-[366px] flex-col items-center gap-1 lg:max-w-none" delay={100}>
          <h2 className="text-center text-[40px] leading-normal font-[550] tracking-[-0.2px] text-content-primary lg:text-[56px] lg:tracking-[-0.28px]">
            Your crypto journey starts here
          </h2>
          <h3 className="text-center text-[20px] leading-normal font-[600] text-content-secondary lg:text-[28px]">
            Trade with ease and the lowest fees
          </h3>
        </Reveal>
        <Reveal className="hidden flex-wrap items-center justify-center gap-4 lg:flex" delay={200}>
          <PillLink href="#" label="Create Account" trailingIcon={<ArrowRightIcon width={16} height={16} color="#F7F9FA" />} className={pillTextClasses} />
          <PillButton label="Get the app" />
        </Reveal>
        <div className="relative w-full max-w-[536px]">
          <Image
            src="/cdc_home_producthero_mainapp_usa_2x.webp"
            alt="Your crypto journey starts here"
            width={1006}
            height={1818}
            className="h-auto w-full object-fill"
          />
        </div>
      </div>
      <div className="flex w-full flex-col">
        <div className="mx-auto w-full px-8 py-8 transition-all lg:py-16">
          <div className="mx-auto grid grid-cols-2 gap-x-6 gap-y-8 lg:flex lg:max-w-[1100px] lg:gap-8">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-1">
                <p className="text-[18px] leading-normal font-[550] tracking-[-0.09px] text-content-primary lg:max-w-[300px] lg:text-[21px] lg:tracking-[-0.1px]">
                  {f.title}
                </p>
                <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:max-w-[300px] lg:text-[18px]">
                  {f.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-x-4 gap-y-6 px-4 py-10 md:gap-6 md:pt-16">
          <a className="col-span-2 block w-full">
            <div className="group relative z-10 flex h-[505px] w-full max-w-[1280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[32px] lg:h-[660px]">
              <video
                src="/us-credit-card-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 z-0 h-full w-full object-cover"
              />
              <div className="relative z-20 flex h-full w-full flex-col justify-between p-8">
                <div>
                  <h3 className="text-[24px] font-[600] text-white-text lg:text-[32px]">
                    Visa Card
                  </h3>
                  <p className="mt-2 text-[16px] font-[550] text-grey-200 lg:text-[18px]">
                    Get up to 5% in CRO rewards on all purchases
                  </p>
                </div>
                <a href="#" className="flex items-center gap-2 text-[16px] font-[600] text-white-text hover:text-blue-light">
                  Choose your card →<ArrowRightIcon width={16} height={16} color="#F7F9FA" />
                </a>
              </div>
            </div>
          </a>

          {productCards.map((card) => (
            <a key={card.title} className="col-span-1 block">
              <div className="group relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[16px] bg-[#151D32] p-4 md:p-8">
                <div className="relative z-10 flex w-full flex-row items-start justify-between px-4">
                  <Image
                    src={card.smallIcon}
                    alt={card.title}
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                </div>
                <Image
                  src={card.image}
                  alt={card.title}
                  width={1078}
                  height={540}
                  className="absolute top-0 right-0 z-0 hidden h-full w-auto max-w-none scale-95 object-center lg:block"
                />
                <div className="relative z-10 flex max-w-[230px] flex-col items-start gap-4">
                  <h3 className="text-[21px] leading-normal font-[550] tracking-[-0.1px] text-white-text">
                    {card.title}
                  </h3>
                  <p className="text-[16px] leading-normal font-[550] text-content-secondary lg:text-[18px]">
                    {card.desc}
                  </p>
                  <a href="#" className="flex items-center gap-1 text-[15px] font-semibold text-white-text transition-colors group-hover:text-blue-light">
                    {card.cta}
                    <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
                  </a>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 md:pb-24">
          <a className="block w-full">
            <div className="group relative z-10 flex h-full w-full cursor-pointer flex-col justify-center overflow-hidden rounded-[16px] p-4 lg:h-[305px] lg:p-8">
              <Image
                src="/level-up-desktop-banner.webp"
                alt="level up desktop banner"
                width={2560}
                height={580}
                className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black" />
              <div className="relative z-20 flex w-full flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-[24px] font-[600] text-white-text lg:text-[32px]">Level Up</h3>
                  <p className="mt-2 text-[16px] font-[550] text-grey-200 lg:text-[18px]">
                    Subscribe to industry leading rewards
                  </p>
                </div>
                <a href="#" className="flex items-center gap-2 text-[16px] font-[600] text-white-text hover:text-blue-light">
                  Learn More →
                </a>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
