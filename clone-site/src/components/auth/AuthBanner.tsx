import Image from "next/image";

export function AuthBanner() {
  return (
    <div className="relative h-full min-h-[460px] w-full">
      <Image
        src="/assets/auth/banner-cdcweb.png"
        alt=""
        fill
        sizes="554px"
        className="rounded-[8px] object-cover"
        priority
      />
    </div>
  );
}
