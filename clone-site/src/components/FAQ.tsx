"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@/components/icons";

interface FAQItem {
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    question: "What is cryptocurrency and how does it work?",
    answer:
      "Cryptocurrency is a digital-first form of money designed to operate entirely independent of traditional banks or government control. Rather than relying on physical cash, it exists securely as digital data.Its value is driven by market supply and demand. You can use crypto to buy goods, transfer funds globally or trade on digital asset markets. Popular cryptocurrencies include Bitcoin (BTC), Ethereum (ETH) and CRO. Most crypto networks are secured by \u2018consensus mechanisms\u2019 like Proof of Work (PoW) or energy-efficient Proof of Stake (PoS).",
  },
  {
    question: "Where is the best place to buy crypto?",
    answer:
      "Crypto brokerages and apps: For example, the Crypto.com App (trusted by over 150 million users globally) offers a seamless way to buy and sell crypto directly from your mobile device.Cryptocurrency exchanges: Advanced platforms like the Crypto.com Exchange offer deeper liquidity, trading bots and more complex order types for experienced traders.DeFi and P2P marketplaces: Decentralized Finance (DeFi) platforms enable peer-to-peer trading. You can access these via self-custodial wallets like the Crypto.com Onchain Wallet.Always choose a heavily regulated and secure platform. Crypto.com currently holds the highest security and compliance ratings in the industry.",
  },
  {
    question: "How do I buy cryptocurrency safely?",
    answer:
      "Download the Crypto.com App from the Apple App Store or Google Play.Create your account and complete the standard 'Know Your Customer' (KYC) verification process.Fund your account via instant, zero-fee* deposits via bank transfer, debit/credit card or existing crypto wallet.Navigate to the 'Buy' section on the App, choose from over 400+ supported cryptocurrencies, enter your amount and confirm your transaction.* Other fees and spread may apply.",
  },
  {
    question: "How can I earn crypto rewards?",
    answer:
      "Staking and lockups: Help secure blockchain networks by staking your assets and earn potential rewards in return.Crypto.com Visa Card: Join our Level Up program and earn potential CRO and BTC rewards on your qualifying everyday spend.Onchain Earn: Access variable reward rates through the DeFi integrations in the Crypto.com Onchain App.",
  },
  {
    question: "Can I use AI to trade crypto?",
    answer:
      "Yes, Crypto.com supports automated, intelligent trading to help you optimize your strategy. You can use trading bots \u2013 such as Dollar Cost Averaging (DCA), Grid, and Time-Weighted Average Price (TWAP) bots \u2013 to automate your trades based on predefined market conditions.",
  },
  {
    question: "What is the Crypto.com AI Agent SDK?",
    answer:
      "For developers and advanced Web3 users, Crypto.com offers the AI Agent SDK on the Cronos chain. This enables developers to build, train and deploy AI-driven agents that can interact with smart contracts, execute complex trading strategies and navigate the DeFi ecosystem autonomously.",
  },
  {
    question: "Can I trade and invest in stocks on Crypto.com?",
    answer:
      "Yes, Crypto.com is an all-in-one financial hub. You can seamlessly manage and trade traditional equities alongside your crypto portfolio.12,000+ stocks and ETFs: Invest in your favorite publicly traded companies and exchange-traded funds.Whale Baskets: Diversify your portfolio by investing in curated thematic baskets modeled after top market movers.",
  },
  {
    question: "What are prediction markets and how do I trade them?",
    answer:
      "Prediction markets enable you to forecast the occurrence or non-occurence of real-world events and trade contracts based on those outcomes. On the Crypto.com App, users can leverage their market knowledge to take positions in the following categories:Sports: Predict the outcomes of major sporting events and tournaments.Financials: Trade on future market caps, stock price milestones or crypto market movements.Politics: Speculate on global political outcomes.Economics: Forecast macroeconomic shifts like inflation rates and central bank rate decisions.Culture: Anticipate the winners of major awards shows, box office successes and more.Prediction is an event contract that is a derivatives product. Trading involves risk and may not be appropriate for all. By trading you risk losing your cost to enter any transaction, including fees. You should carefully consider whether trading is appropriate for you in light of your investment experience and financial resources. Any trading decisions you make are solely your responsibility and at your own risk.",
  },
  {
    question: "Can I manage my crypto, stocks and prediction markets in one app?",
    answer:
      "Yes, the Crypto.com App is designed so that you can seamlessly manage your entire portfolio in one place. Whether you\u2019re buying the dip on Bitcoin, investing in a trending tech stock or taking a position on an upcoming election, you can execute your entire strategy from a single, secure dashboard.Plus, instead of waiting days for bank transfers to clear between different brokerages, you can use your instant, zero-fee* deposits to react quickly to global market movements.* Other fees and spread may apply.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full bg-transparent">
      <div className="z-0 w-full">
        <div className="z-10 w-full overflow-hidden rounded-t-[32px] bg-[#080D1B] pt-[96px] lg:rounded-t-[64px] lg:pt-[128px]">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-8 p-[64px_32px] text-[#F7F9FA] lg:gap-12">
            <p className="text-[18px] leading-normal font-[550] tracking-[-0.09px] lg:text-[21px] lg:tracking-[-0.1px]">
              FAQ
            </p>
            <div className="flex flex-col">
              {faqItems.map((item, i) => {
                const open = openIndex === i;
                return (
                  <div key={item.question} className="border-b border-[#323C52]">
                    <button
                      className="flex w-full items-center justify-between gap-4 py-3 pt-0 text-left hover:opacity-90 lg:py-4 lg:pl-4"
                      onClick={() => setOpenIndex(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span className="text-[16px] leading-normal font-[600] lg:text-[20px]">
                        {item.question}
                      </span>
                      <PlusIcon
                        width={24}
                        height={24}
                        color="#A0A9BE"
                        className={cn("shrink-0 transition-transform duration-300", open && "rotate-45")}
                      />
                    </button>
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        open ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="text-[14px] leading-relaxed font-normal text-content-secondary lg:text-[16px]">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="mt-8 text-[18px] leading-normal font-[550] tracking-[-0.09px] lg:pl-4 lg:text-[21px] lg:tracking-[-0.1px]">
                Have more questions?{" "}
                <a href="#" className="text-blue-light hover:opacity-80">
                  Contact Us
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
