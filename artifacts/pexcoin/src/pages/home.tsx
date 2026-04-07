import { useRef } from "react";
import { useGetCryptoPrices, useGetMarketTicker } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRightLeft, Headset, Shield, Zap, Globe } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: prices, isLoading: loadingPrices } = useGetCryptoPrices({
    query: { refetchInterval: 5000 }
  });
  
  const { data: ticker, isLoading: loadingTicker } = useGetMarketTicker({
    query: { refetchInterval: 5000 }
  });

  return (
    <Layout>
      {/* Ticker Bar */}
      <div className="w-full bg-muted/30 border-b border-border/50 overflow-hidden py-2 flex items-center">
        <div className="flex items-center gap-8 px-4 animate-marquee whitespace-nowrap">
          {loadingTicker ? (
            <span className="text-muted-foreground text-xs">Loading market data...</span>
          ) : (
            <>
              {[...(ticker ?? []), ...(ticker ?? [])].map((t, i) => (
                <div key={`${t.pair}-${i}`} className="flex items-center gap-2 text-xs font-mono shrink-0">
                  <span className="font-bold text-foreground">{t.pair}</span>
                  <span className="text-muted-foreground">${t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  <span className={t.change >= 0 ? "text-positive" : "text-negative"}>
                    {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="w-full bg-gradient-to-br from-background via-background to-sidebar py-16 px-4 border-b border-border/30">
        <div className="max-w-screen-xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Zap className="h-3 w-3" /> World's Most Trusted Crypto Exchange
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Trade Crypto with <span className="text-primary">Confidence</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Buy, sell, and trade 24+ cryptocurrencies securely on PexCoin — institutional-grade trading for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
            <Link href="/register">
              <Button size="lg" className="font-bold w-full sm:w-auto px-8">Start Trading</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="font-bold w-full sm:w-auto px-8">Login</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-screen-xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Link href="/deposit">
            <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/50 hover:bg-card group">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-2">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xs sm:text-sm">Deposit</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/withdraw">
            <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/50 hover:bg-card group">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-2">
                <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xs sm:text-sm">Withdraw</span>
              </CardContent>
            </Card>
          </Link>
          <Card className="hover:border-primary/50 transition-all cursor-pointer bg-card/50 hover:bg-card group">
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-2">
              <Headset className="h-6 w-6 sm:h-8 sm:w-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs sm:text-sm">Support</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market Table */}
      <div className="max-w-screen-xl mx-auto w-full px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Market Overview</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-positive animate-pulse"></span>
            Live
          </span>
        </div>
        
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 md:grid-cols-4 p-3 sm:p-4 text-xs font-medium text-muted-foreground border-b bg-muted/20">
            <div>Pair</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h Change</div>
            <div className="hidden md:block text-right">Action</div>
          </div>
          
          <div className="divide-y divide-border/40">
            {loadingPrices ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 md:grid-cols-4 p-3 sm:p-4 items-center gap-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto"></div>
                  <div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto"></div>
                  <div className="hidden md:flex h-8 w-16 bg-muted animate-pulse rounded ml-auto"></div>
                </div>
              ))
            ) : (
              prices?.map((coin) => (
                <div
                  key={coin.symbol}
                  className="grid grid-cols-3 md:grid-cols-4 p-3 sm:p-4 items-center hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0 text-primary">
                      {coin.symbol.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold font-mono text-xs sm:text-sm truncate">{coin.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate hidden sm:block">{coin.name}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs sm:text-sm">
                    ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                  <div className={`text-right flex items-center justify-end gap-0.5 font-mono text-xs sm:text-sm ${coin.change >= 0 ? "text-positive" : "text-negative"}`}>
                    {coin.change >= 0 ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />}
                    <span>{Math.abs(coin.change).toFixed(2)}%</span>
                  </div>
                  <div className="hidden md:flex justify-end">
                    <Link href="/login">
                      <Button variant="secondary" size="sm" className="font-bold text-xs h-8">Trade</Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-border/30 bg-muted/10 py-12 px-4">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Secure & Trusted</h3>
            <p className="text-sm text-muted-foreground">Industry-leading security protocols protect your assets 24/7.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">Execute trades in milliseconds with our high-performance engine.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Global Markets</h3>
            <p className="text-sm text-muted-foreground">Access 24+ crypto pairs with real-time prices from global markets.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
