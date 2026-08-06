import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustedBy } from "@/components/TrustedBy";
import { LivePrices } from "@/components/LivePrices";
import { AppSection } from "@/components/AppSection";
import { Learn } from "@/components/Learn";
import { AdvancedTrading } from "@/components/AdvancedTrading";
import { OnchainWallet } from "@/components/OnchainWallet";
import { Partners } from "@/components/Partners";
import { WaysToTrade } from "@/components/WaysToTrade";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen w-full bg-[#080D1B]">
        <Hero />
        <TrustedBy />
        <LivePrices />
        <AppSection />
        <Learn />
        <AdvancedTrading />
        <OnchainWallet />
        <Partners />
        <WaysToTrade />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
