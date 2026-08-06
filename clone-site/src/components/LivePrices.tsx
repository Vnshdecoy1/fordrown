"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { Sparkline } from "@/components/Sparkline";
import { TrendingIcon, TopMoversIcon, ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

interface PriceCardData {
  name: string;
  symbol: string;
  icon: string;
  price: string;
  changePct: string;
  positive: boolean;
}

const trending: PriceCardData[] = [
  {
    name: "AgentFun.AI",
    symbol: "AGENTFUN",
    icon: "/token/icons/agentfun-ai/color_icon.png",
    price: "$0.874456",
    changePct: "+46.22%",
    positive: true,
  },
  {
    name: "CCap",
    symbol: "CAP",
    icon: "/token/icons/ccap/color_icon.png",
    price: "$0.02888214",
    changePct: "-28.68%",
    positive: false,
  },
  {
    name: "Eclipse",
    symbol: "ES",
    icon: "/token/icons/eclipse-xyz/color_icon.png",
    price: "$0.00142985",
    changePct: "+27.90%",
    positive: true,
  },
  {
    name: "Heima",
    symbol: "HEI",
    icon: "/token/icons/heima/color_icon.png",
    price: "$0.09606997",
    changePct: "+21.68%",
    positive: true,
  },
];

const topMovers: PriceCardData[] = [
  {
    name: "AgentFun.AI",
    symbol: "AGENTFUN",
    icon: "/token/icons/agentfun-ai/color_icon.png",
    price: "$0.874456",
    changePct: "+43.46%",
    positive: true,
  },
  {
    name: "VVS Finance",
    symbol: "VVS",
    icon: "/token/icons/vvs-finance/color_icon.png",
    price: "$0.00000062",
    changePct: "-33.80%",
    positive: false,
  },
  {
    name: "CCap",
    symbol: "CAP",
    icon: "/token/icons/ccap/color_icon.png",
    price: "$0.02888214",
    changePct: "-28.68%",
    positive: false,
  },
  {
    name: "Eclipse",
    symbol: "ES",
    icon: "/token/icons/eclipse-xyz/color_icon.png",
    price: "$0.00142985",
    changePct: "+27.90%",
    positive: true,
  },
];

function mockSparkline(seed: number, positive: boolean): number[] {
  const values: number[] = [];
  let v = 50;
  for (let i = 0; i < 28; i++) {
    v += Math.sin((i + seed) * 0.55) * 6 + ((seed * 7 + i * 3) % 9) - 4;
    values.push(v);
  }
  if (positive) {
    values[values.length - 1] = Math.max(...values) + 2;
  } else {
    values[values.length - 1] = Math.min(...values) - 2;
  }
  return values;
}

function PriceCard({ data, index }: { data: PriceCardData; index: number }) {
  const positive = data.positive;
  const changeColor = positive ? "#00A68C" : "#FF5C56";
  return (
    <div className="group flex h-[312px] w-[288px] shrink-0 cursor-pointer flex-col rounded-[32px] bg-[#0B1426] transition-colors hover:bg-[#1F283C] lg:h-[430px] lg:w-[410px] lg:rounded-[16px]">
      <div className="flex gap-2 p-[24px_24px_0px_24px] lg:gap-[17px] lg:p-[32px_32px_0px_32px]">
        <div className="h-10 w-10 rounded-[300px] lg:h-[50px] lg:w-[50px]">
          <Image
            src={data.icon}
            alt={data.name}
            width={50}
            height={50}
            className="h-10 w-10 rounded-[300px] object-fill lg:h-[50px] lg:w-[50px]"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-[18px] leading-normal font-[550] tracking-[-0.09px] text-[#F7F9FA] lg:text-[21px] lg:tracking-[-0.1px]">
            {data.name}
          </p>
          <p className="text-[16px] leading-normal font-[550] text-[#7B849B] lg:text-[18px]">
            {data.symbol}
          </p>
        </div>
        <Sparkline
          data={mockSparkline(index + 1, positive)}
          color={changeColor}
          className="absolute right-[24px] top-[88px] hidden h-[48px] w-[140px] lg:block lg:right-[32px]"
        />
      </div>
      <div className="mt-auto flex items-end justify-between p-[0px_18px_24px_18px] lg:p-[0px_28px_32px_28px]">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <p className="text-[20px] leading-normal font-[600] text-[#F7F9FA] lg:text-[28px]">
              {data.price}
            </p>
            <p className="text-[16px] leading-normal font-[550] text-[#A0A9BE] lg:text-[18px]">
              USD
            </p>
          </div>
          <div className="flex gap-1">
            <p
              className="text-[16px] leading-normal font-[550] whitespace-nowrap lg:text-[18px]"
              style={{ color: changeColor }}
            >
              {data.changePct}
            </p>
            <p className="text-[16px] leading-normal font-[550] whitespace-nowrap text-[#A0A9BE] lg:text-[18px]">
              24H
            </p>
          </div>
        </div>
        <span className="rounded-[10px] bg-[#1199FA]/20 p-[12px_24px] text-[12px] font-semibold whitespace-nowrap text-[#92D1FF] transition-colors duration-200 group-hover:bg-[#1199FA] group-hover:text-white">
          Buy
        </span>
      </div>
    </div>
  );
}

export function LivePrices() {
  const [tab, setTab] = useState<"trending" | "movers">("trending");
  const cards = tab === "trending" ? trending : topMovers;

  return (
    <div className="mb-[-32px] w-full bg-[linear-gradient(0deg,#F0F5FF_0%,#33517B_28.86%,#131A2A_59.87%,#080D1B_89.59%)] pb-[128px] lg:mb-[-64px] lg:pt-[128px] lg:pb-[160px]">
      <Reveal className="flex flex-col items-start px-4 lg:items-center">
        <h2 className="mb-7 text-[20px] leading-normal font-[600] text-[#A0A9BE] lg:mb-[44px] lg:text-center lg:text-[28px]">
          Stay up-to-date with <strong className="font-semibold text-[#F7F9FA]">live crypto prices</strong>
        </h2>
        <div className="mb-[24px] flex gap-4">
          <button
            className={cn(
              "flex h-8 w-[104px] items-center justify-center gap-1 rounded-[40px] border text-[12px] font-semibold transition-colors",
              tab === "trending"
                ? "border-[#1199FA] text-[#92D1FF]"
                : "border-white/10 bg-[#151D32] text-[#A0A9BE]"
            )}
            onClick={() => setTab("trending")}
          >
            <TrendingIcon color={tab === "trending" ? "#92D1FF" : "#A0A9BE"} />
            Trending
          </button>
          <button
            className={cn(
              "flex h-8 w-[116px] items-center justify-center gap-1 rounded-[40px] border text-[12px] font-semibold transition-colors",
              tab === "movers"
                ? "border-[#1199FA] text-[#92D1FF]"
                : "border-white/10 bg-[#151D32] text-[#A0A9BE]"
            )}
            onClick={() => setTab("movers")}
          >
            <TopMoversIcon color={tab === "movers" ? "#92D1FF" : "#A0A9BE"} />
            Top Movers
          </button>
        </div>
      </Reveal>
      <div className="relative">
        <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 lg:px-8">
          {cards.map((card, i) => (
            <PriceCard key={`${tab}-${card.symbol}`} data={card} index={i} />
          ))}
        </div>
        <button
          className="absolute top-1/2 left-2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-navy-800/80 text-white-text backdrop-blur transition-colors hover:border-white/30 lg:flex"
          aria-label="Previous"
          onClick={() => document.querySelector(".no-scrollbar")?.scrollBy({ left: -420, behavior: "smooth" })}
        >
          <ArrowLeftIcon width={16} height={16} color="#F7F9FA" />
        </button>
        <button
          className="absolute top-1/2 right-2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-navy-800/80 text-white-text backdrop-blur transition-colors hover:border-white/30 lg:flex"
          aria-label="Next"
          onClick={() => document.querySelector(".no-scrollbar")?.scrollBy({ left: 420, behavior: "smooth" })}
        >
          <ArrowRightIcon width={16} height={16} color="#F7F9FA" />
        </button>
      </div>
    </div>
  );
}
