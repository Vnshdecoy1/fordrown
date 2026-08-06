import Image from "next/image";
import { ArrowRightIcon } from "@/components/icons";

export function Hero() {
  return (
    <div className="relative h-auto w-full overflow-hidden bg-gradient-to-b from-navy-900 via-navy-500 to-[#EFEFEF]">
      <div className="absolute left-0 right-0 top-[64px] z-10 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="max-w-[900px] text-center text-[45px] leading-[100%] font-[550] tracking-[-1.44px] text-white-text lg:text-[84px] lg:leading-[110%] lg:tracking-[-1.68px]">
            The only crypto platform you need
          </h1>
          <p className="mb-6 px-4 text-center text-[20px] leading-normal font-[600] text-grey-200 lg:px-0 lg:text-[28px]">
            Trade BTC, ETH, CRO, and 400+ crypto in your local currency
          </p>
          <a
            href="#"
            className="relative flex h-[59px] items-center justify-center gap-2 rounded-[10px] bg-blue-brand p-[12px_24px] transition-opacity hover:opacity-90"
          >
            <p className="text-[14px] leading-[142%] font-[600] text-white-text">Get Started</p>
            <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
          </a>
        </div>
      </div>
      <div className="-mb-[140px] mt-[390px] flex px-4 md:-mb-[100px] md:mt-[340px] md:px-0 lg:-mb-[260px] lg:mt-[400px]">
        <div className="w-full object-contain">
          <Image
            src="/cdc_home_heroimage_desktop_highres_global(usd)_1_1x.webp"
            alt="Crypto.com platform overview"
            width={5770}
            height={4222}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[140px] bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
    </div>
  );
}
