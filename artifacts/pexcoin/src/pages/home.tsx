import { useGetCryptoPrices, useGetMarketTicker } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRightLeft, Headset } from "lucide-react";
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
      <div className="w-full bg-muted/50 border-b border-border overflow-hidden whitespace-nowrap py-2 flex items-center">
        <div className="flex animate-marquee space-x-8 px-4 text-xs font-mono">
          {loadingTicker ? (
            <span className="text-muted-foreground">Loading ticker...</span>
          ) : (
            ticker?.map((t) => (
              <div key={t.pair} className="flex items-center gap-2">
                <span className="font-bold">{t.pair}</span>
                <span>{t.price.toFixed(2)}</span>
                <span className={t.change >= 0 ? "text-positive" : "text-negative"}>
                  {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="w-full bg-gradient-to-r from-background to-sidebar py-16 px-4 md:px-8 border-b">
        <div className="max-w-screen-xl mx-auto flex flex-col items-center text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            The World's Most Trusted <span className="text-primary">Crypto Exchange</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Buy, sell, and trade over 100 cryptocurrencies securely. Institutional-grade trading platform for everyone.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="font-bold">Start Trading Now</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-screen-xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-3 gap-4">
          <Link href="/deposit">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
              <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                <Wallet className="h-8 w-8 text-primary" />
                <span className="font-bold text-sm">Deposit</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/withdraw">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
              <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                <ArrowRightLeft className="h-8 w-8 text-primary" />
                <span className="font-bold text-sm">Withdraw</span>
              </CardContent>
            </Card>
          </Link>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
              <Headset className="h-8 w-8 text-primary" />
              <span className="font-bold text-sm">Support</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market Data */}
      <div className="max-w-screen-xl mx-auto w-full px-4 py-8 flex-1">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          Market Trends
        </h2>
        
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="grid grid-cols-4 p-4 text-xs font-medium text-muted-foreground border-b bg-muted/20">
            <div>Pair</div>
            <div className="text-right">Last Price</div>
            <div className="text-right">24h Change</div>
            <div className="text-right">Action</div>
          </div>
          
          <div className="divide-y divide-border/50">
            {loadingPrices ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 p-4 items-center">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto"></div>
                  <div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto"></div>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto"></div>
                </div>
              ))
            ) : (
              prices?.map((coin) => (
                <div key={coin.symbol} className="grid grid-cols-4 p-4 items-center hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                      {coin.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold font-mono text-sm">{coin.symbol}</div>
                      <div className="text-xs text-muted-foreground">{coin.name}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm">
                    ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                  <div className={`text-right flex items-center justify-end gap-1 font-mono text-sm ${coin.change >= 0 ? "text-positive" : "text-negative"}`}>
                    {coin.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(coin.change).toFixed(2)}%
                  </div>
                  <div className="text-right">
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
    </Layout>
  );
}
