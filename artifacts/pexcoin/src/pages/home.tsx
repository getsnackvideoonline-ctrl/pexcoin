import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetCryptoPrices, useGetMarketTicker, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowUpRight, ArrowDownRight, Shield, Zap, Bot, TrendingUp,
  Search, Globe, BarChart2, Star, ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: user } = useGetMe({ query: { retry: false } });

  const { data: prices, isLoading: loadingPrices } = useGetCryptoPrices({
    query: { refetchInterval: 5000 },
  });
  const { data: ticker } = useGetMarketTicker({
    query: { refetchInterval: 5000 },
  });

  const filtered = prices?.filter(
    (p) =>
      !search ||
      p.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const marketCapCoins = [
    { symbol: "BTC", name: "Bitcoin", desc: "The original cryptocurrency" },
    { symbol: "ETH", name: "Ethereum", desc: "Smart contract platform" },
    { symbol: "BNB", name: "BNB", desc: "Binance ecosystem token" },
    { symbol: "SOL", name: "Solana", desc: "High-speed blockchain" },
  ];

  return (
    <Layout>
      {/* Ticker Bar */}
      <div className="w-full bg-muted/30 border-b border-border/50 overflow-hidden py-2 flex items-center">
        <div className="flex items-center gap-8 px-4 animate-marquee whitespace-nowrap">
          {[...(ticker ?? []), ...(ticker ?? [])].map((t, i) => (
            <div key={`${t.pair}-${i}`} className="flex items-center gap-2 text-xs font-mono shrink-0">
              <span className="font-bold text-foreground">{t.pair}</span>
              <span className="text-muted-foreground">${t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              <span className={t.change >= 0 ? "text-green-500" : "text-red-500"}>
                {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary">
              <Zap className="h-3 w-3" /> World's Most Trusted Crypto Exchange
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Trade Crypto with{" "}
              <span className="text-primary">Confidence</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Buy, sell, and trade 24+ cryptocurrencies securely on PexCoin — AI-powered insights, institutional-grade security, and lightning-fast execution.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {user ? (
                <>
                  <Button size="lg" className="text-base font-bold gap-2" onClick={() => navigate("/trade")}>
                    <BarChart2 className="h-5 w-5" /> Start Trading
                  </Button>
                  <Button size="lg" variant="outline" className="text-base gap-2" onClick={() => navigate("/dashboard")}>
                    My Dashboard <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="text-base font-bold gap-2 w-full sm:w-auto">
                      Get Started Free <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="text-base w-full sm:w-auto">
                      Login to Trade
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-green-500" /> SSL Secured</div>
              <div className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-blue-500" /> 24/7 Trading</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-yellow-500" /> 5% Referral Bonus</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 border-y border-border/40 bg-muted/20">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="h-6 w-6 text-yellow-500" />, title: "Lightning Fast", desc: "Execute trades in milliseconds with our high-performance matching engine." },
              { icon: <Shield className="h-6 w-6 text-green-500" />, title: "Bank-Grade Security", desc: "Multi-layer security with 2FA, cold storage, and real-time fraud detection." },
              { icon: <Bot className="h-6 w-6 text-primary" />, title: "AI Trading Assistant", desc: "Get personalized market analysis and trading signals powered by GPT." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-xl border border-border/40 bg-background hover:border-primary/30 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">{f.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-12 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">Market Overview</h2>
              <p className="text-muted-foreground text-sm">Live prices across all trading pairs</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coins..."
                  className="pl-9 w-48 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 overflow-hidden">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-4 py-3 bg-muted/30 border-b border-border/40">
              <span className="col-span-1">#</span>
              <span className="col-span-3">Coin</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">24h %</span>
              <span className="col-span-2 text-right hidden md:block">Market Cap</span>
              <span className="col-span-1 text-right hidden md:block">Volume</span>
              <span className="col-span-1 text-right"></span>
            </div>

            {loadingPrices ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 px-4 py-3.5 border-b border-border/20 animate-pulse gap-2 items-center">
                  <div className="col-span-1 h-3 w-4 bg-muted rounded" />
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="col-span-2 h-4 w-20 bg-muted rounded ml-auto" />
                  <div className="col-span-2 h-4 w-14 bg-muted rounded ml-auto" />
                  <div className="col-span-2 h-4 w-16 bg-muted rounded ml-auto hidden md:block" />
                  <div className="col-span-1 h-4 w-12 bg-muted rounded ml-auto hidden md:block" />
                </div>
              ))
            ) : (
              (filtered ?? []).slice(0, 20).map((p, idx) => {
                const isUp = p.change >= 0;
                const symbol = p.symbol.replace("/USDT", "");
                const mcap = p.marketCap;
                const vol = p.volume;
                const fmtBig = (n: number | null | undefined) => {
                  if (!n) return "—";
                  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
                  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
                  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
                  return `$${n.toLocaleString()}`;
                };
                const fmtPrice = (price: number) => {
                  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  if (price >= 0.001) return price.toFixed(4);
                  return price.toFixed(8);
                };
                return (
                  <div
                    key={p.symbol}
                    className="grid grid-cols-12 px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group items-center"
                    onClick={() => user ? navigate(`/trade/${encodeURIComponent(p.symbol)}`) : navigate("/login")}
                  >
                    <span className="col-span-1 text-xs text-muted-foreground">{idx + 1}</span>
                    <div className="col-span-3 flex items-center gap-2">
                      {p.iconUrl
                        ? <img src={p.iconUrl} alt={p.name} className="w-7 h-7 rounded-full shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{symbol.slice(0, 2)}</span></div>
                      }
                      <div>
                        <p className="font-semibold text-sm">{symbol}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{p.name}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <p className="font-mono font-semibold text-sm">${fmtPrice(p.price)}</p>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <span className={`flex items-center justify-end gap-1 text-sm font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                        {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {isUp ? "+" : ""}{p.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-span-2 text-right self-center hidden md:block">
                      <p className="text-sm text-muted-foreground">{fmtBig(mcap)}</p>
                    </div>
                    <div className="col-span-1 text-right self-center hidden md:block">
                      <p className="text-xs text-muted-foreground">{fmtBig(vol)}</p>
                    </div>
                    <div className="col-span-1 text-right self-center hidden md:flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={(e) => { e.stopPropagation(); user ? navigate(`/trade/${encodeURIComponent(p.symbol)}`) : navigate("/login"); }}
                      >
                        Trade <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!user && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm mb-3">Sign up to start trading these assets</p>
              <Link to="/register">
                <Button className="gap-2 font-bold">
                  Create Free Account <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      {!user && (
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-primary/5 border-t border-border/40">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <h2 className="text-3xl font-bold">Ready to start trading?</h2>
            <p className="text-muted-foreground">Get an invitation from an existing member and join thousands of traders on PexCoin.</p>
            <Link to="/register">
              <Button size="lg" className="font-bold gap-2">
                Join PexCoin <TrendingUp className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}
