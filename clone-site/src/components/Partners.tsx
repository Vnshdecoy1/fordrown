import { Reveal } from "@/components/Reveal";
import { ArrowRightIcon } from "@/components/icons";

export function Partners() {
  return (
    <div className="w-full bg-[linear-gradient(0deg,#F0F5FF_0%,#33517B_28.86%,#131A2A_59.8%,#080D1B_100%)] pt-[128px] pb-[64px]">
      <Reveal className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-8 px-4 text-center">
        <h2 className="text-[28px] leading-normal font-[600] text-white-text lg:text-[40px] lg:tracking-[-0.2px]">
          We work with world-class brands, institutions, and partners to put crypto in every
          wallet.
        </h2>
        <a
          href="#"
          className="flex items-center gap-2 text-[16px] font-[600] text-blue-light transition-colors hover:text-white-text"
        >
          More about our Partners
          <ArrowRightIcon width={16} height={16} color="#92D1FF" />
        </a>
      </Reveal>
      <div className="mt-[48px] w-full">
        <video
          src="/cdc_dotcom_partner-sizzle-reel_desktop_low.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
