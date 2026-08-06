import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { PillButton, PillLink } from "@/components/PillButton";
import { ArrowRightIcon } from "@/components/icons";

const stats = [
  { title: "Self-custody control", subtitle: "Maintain full control of your private keys and assets" },
  { title: "Multi-chain access", subtitle: "Bridge and transact seamlessly across multiple chains" },
  { title: "DeFi integration", subtitle: "Access hundreds of DApps and protocols in one place" },
];

export function OnchainWallet() {
  return (
    <div className="relative w-full overflow-hidden rounded-b-[32px] bg-lightblue pt-[96px] lg:rounded-b-[64px] lg:pt-[128px]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-4 px-8 pb-8 lg:gap-8 lg:px-16 lg:pb-0">
        <Reveal className="flex flex-row items-center justify-center gap-2.5">
          <div className="h-[35px] w-[35px]">
            <Image src="/cdc_icon_onchain.svg" alt="Onchain icon" width={35} height={35} className="h-[35px] w-[35px] object-fill" />
          </div>
          <p className="text-[16px] leading-normal font-[550] text-[#0B1420] lg:text-[18px]">
            Onchain Wallet
          </p>
        </Reveal>
        <Reveal className="flex max-w-[366px] flex-col items-center gap-1 lg:max-w-none" delay={100}>
          <h2 className="text-center text-[40px] leading-normal font-[550] tracking-[-0.2px] text-[#0B1420] lg:text-[56px] lg:tracking-[-0.28px]">
            Your Trusted Onchain Gateway
          </h2>
          <h3 className="text-center text-[20px] leading-normal font-[600] text-[#7B849B] lg:text-[28px]">
            Take private control of your crypto. Manage all your assets in one secure wallet -
            trusted by millions, powered by Crypto.com.
          </h3>
        </Reveal>
        <Reveal className="hidden flex-wrap items-center justify-center gap-4 lg:flex" delay={200}>
          <PillButton label="Download Extension" />
          <PillLink
            href="#"
            label="Learn More"
            trailingIcon={<ArrowRightIcon width={16} height={16} color="#0B1420" />}
            className="border border-black/10 text-[#0B1420] [&_.pill-label]:!text-[#0B1420]"
          />
          <PillButton label="Get the app" />
        </Reveal>
        <div className="relative w-full max-w-[536px]">
          <Image
            src="/cdc_producthero_onchain_global.webp"
            alt="Crypto.com Onchain Wallet"
            width={2241}
            height={3145}
            className="h-auto w-full object-fill"
          />
        </div>
      </div>

      <div className="mx-auto w-full px-8 py-8 transition-all lg:py-16">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 md:grid-cols-3 lg:gap-8">
          {stats.map((s) => (
            <div key={s.title} className="flex flex-col gap-4 border-t border-[#0B1420]/15 pt-4">
              <p className="text-[18px] leading-normal font-[550] tracking-[-0.09px] text-[#0B1420] lg:text-[21px] lg:tracking-[-0.1px]">
                {s.title}
              </p>
              <p className="text-[16px] leading-normal font-[550] text-[#7B849B] lg:text-[18px]">
                {s.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-[160px] md:mx-auto md:p-8">
        <a className="block w-full">
          <div className="group relative z-10 flex h-[380px] w-full max-w-[1280px] cursor-pointer flex-col items-start justify-end overflow-hidden rounded-[32px] p-8 lg:h-[520px] lg:justify-center lg:p-16">
            <Image
              src="/onchain-banner-desktop-1.webp"
              alt="Get the onchain wallet"
              width={2560}
              height={580}
              className="absolute inset-0 z-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="relative z-20 flex flex-col items-start gap-4">
              <h3 className="text-[32px] font-[600] text-white-text lg:text-[48px]">
                Get the onchain wallet
              </h3>
              <p className="text-[18px] font-[550] text-grey-200 lg:text-[21px]">
                Explore DeFi safely with Crypto.com
              </p>
              <a href="#" className="mt-2 flex items-center gap-2 text-[16px] font-[600] text-white-text hover:text-blue-light">
                Get Started
                <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
              </a>
            </div>
          </div>
        </a>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-b from-transparent to-lightblue" />
    </div>
  );
}
