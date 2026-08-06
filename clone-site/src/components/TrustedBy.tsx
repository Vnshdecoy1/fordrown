import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const stats = [
  {
    icon: "/globe.svg",
    title: ["150m+ users", "globally"],
    subtitle: "Trusted by investors around the world since 2016",
  },
  {
    icon: "/checkmark.svg",
    title: ["Sign up in", "minutes"],
    subtitle: "Set up your account and begin trading in a few steps",
  },
  {
    icon: "/fingerprint.svg",
    title: ["Zero-fee deposits"],
    subtitle: "Fund your wallet at no cost with major fiat currencies",
  },
];

export function TrustedBy() {
  return (
    <div className="flex flex-col items-center p-[16px_12px_88px_12px] lg:p-[64px_16px_128px_16px]">
      <Reveal className="flex flex-col items-center">
        <h2 className="mx-auto mt-0 mb-8 text-center text-[22px] leading-[24px] font-[550] tracking-[-0.12px] text-white-text lg:text-[40px] lg:leading-[40px] lg:tracking-[-0.2px]">
          Built for wealth, made for everyone
        </h2>
        <div className="mt-8 mb-16 grid w-full grid-cols-1 gap-2 lg:mb-[180px] lg:max-w-[614px] lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-row items-center gap-2 lg:gap-3">
            <div className="h-16 w-auto">
              <Image
                src="/cdc-app-store-rating.svg"
                alt="App Store Rating"
                width={70}
                height={54}
                className="h-16 w-auto"
              />
            </div>
            <p className="text-[18px] font-[550] tracking-[-0.09px] text-[#7B849B] lg:text-[21px] lg:tracking-[-0.1px]">
              App Store Rating
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 lg:gap-3">
            <div className="h-16 w-auto">
              <Image
                src="/cdc-google-play-rating.svg"
                alt="Google Play Rating"
                width={70}
                height={54}
                className="h-16 w-auto"
              />
            </div>
            <p className="text-[18px] font-[550] tracking-[-0.09px] text-[#7B849B] lg:text-[21px] lg:tracking-[-0.1px]">
              Google Play Rating
            </p>
          </div>
        </div>
      </Reveal>
      <div className="w-full">
        <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.icon}
              className="flex w-full flex-col rounded-[16px] bg-[linear-gradient(352deg,#0B1426_59.38%,#405898_235.63%)] p-8 md:w-[406px] lg:h-[350px] lg:max-w-[416px]"
              style={i === 2 ? { transform: "translateY(20px)" } : undefined}
            >
              <div className="mb-4 h-8 w-8">
                <Image src={stat.icon} alt="" width={32} height={32} className="mb-4 h-8 w-8 object-fill" />
              </div>
              <div className="mb-6 text-[20px] leading-normal font-[600] text-white-text lg:mb-0 lg:text-[28px]">
                {stat.title.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mt-auto text-[18px] leading-normal font-[550] tracking-[-0.09px] text-content-secondary opacity-54 lg:text-[21px] lg:tracking-[-0.1px]">
                {stat.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
