import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ArrowRightIcon } from "@/components/icons";

const learnCards = [
  {
    tag: "Learn",
    title: "Learn the fundamentals and master crypto knowledge",
    image: "/cdc_home_beyondcrypto_developer_2x.webp",
  },
  {
    tag: "Security",
    title: "Leading the world in licences, registrations, and certifications",
    image: "/crypto-beyond-trading-security.webp",
  },
  {
    tag: "AI Trading",
    title: "Harness AI-driven analysis to execute smarter, faster trades.",
    image: "/cdc_home_beyondcrypto_university_2x.webp",
  },
];

export function Learn() {
  return (
    <div className="mb-[-32px] w-full pb-[32px] lg:mb-[-64px] lg:pb-[64px]">
      <div className="z-10 w-full overflow-hidden rounded-t-[32px] bg-[#0B1426] pt-[96px] lg:rounded-t-[64px] lg:pt-[128px]">
        <Reveal className="flex flex-col items-center px-4">
          <h2 className="text-center text-[40px] leading-normal font-[550] tracking-[-0.2px] text-content-primary lg:text-[56px] lg:tracking-[-0.28px]">
            Crypto beyond trading
          </h2>
          <h3 className="mt-1 text-center text-[20px] leading-normal font-[600] text-content-secondary lg:text-[28px]">
            Explore a full ecosystem built around crypto
          </h3>
        </Reveal>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-4 px-4 py-8 md:grid-cols-3 md:pt-16 lg:gap-6">
          {learnCards.map((card) => (
            <a key={card.tag} href="#" className="flex-1">
              <div className="group relative flex h-full w-full cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[16px] bg-[#F5F7FA] p-4 md:p-8">
                <Image
                  src={card.image}
                  alt={card.tag}
                  width={800}
                  height={800}
                  className="relative z-0 h-auto w-full rounded-[12px] object-cover"
                />
                <div className="relative z-10 flex flex-col items-start gap-2 pt-4">
                  <p className="text-[15px] font-semibold text-[#1199FA]">{card.tag}</p>
                  <h3 className="text-[21px] leading-normal font-[550] tracking-[-0.1px] text-[#0B1420]">
                    {card.title}
                  </h3>
                  <ArrowRightIcon width={16} height={16} color="#0B1420" className="mt-2" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
