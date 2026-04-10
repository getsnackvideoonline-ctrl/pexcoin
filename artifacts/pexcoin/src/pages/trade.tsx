import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetCryptoPrices, useGetMyBalance } from "@workspace/api-client-react";
import { ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown, Wallet, ChevronRight, Star } from "lucide-react";

const FAVORITES = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"];

export default function Trade() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>(FAVORITES);

  const { data: prices, isLoading } = useGetCryptoPrices({ query: { refetchInterval: 5000 } });
  const { data: balance } = useGetMyBalance();

  const filtered = prices?.filter((p) => {
    const matchesSearch = !search || p.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesFav = activeTab === "all" || favorites.includes(p.symbol);
    return matchesSearch && matchesFav;
  });

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const totalBalance = (balance?.usdt ?? 0) +
    (balance?.btc ?? 0) * (prices?.find((p) => p.symbol.startsWith("BTC"))?.price ?? 65000) +
    (balance?.eth ?? 0) * (prices?.find((p) => p.symbol.startsWith("ETH"))?.price ?? 3200);

  const gainers = prices?.filter((p) => p.change > 0).sort((a, b) => b.change - a.change).slice(0, 3) ?? [];
  const losers = prices?.filter((p) => p.change < 0).sort((a, b) => a.change - b.change).slice(0, 3) ?? [];

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Markets</h1>
            <p className="text-muted-foreground text-sm">Click any coin to trade</p>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-2 px-4 flex items-center gap-3">
              <Wallet className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Value</p>
                <p className="font-bold font-mono">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gainers & Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-green-500">
                <TrendingUp className="h-4 w-4" /> Top Gainers (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gainers.map((p) => (
                <div key={p.symbol} className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded px-2 py-1 transition-colors" onClick={() => navigate(`/trade/${encodeURIComponent(p.symbol)}`)}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-500">{p.symbol.split("/")[0].slice(0, 2)}</span>
                    </div>
                    <span className="text-sm font-medium">{p.symbol}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">+{p.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-red-500">
                <TrendingDown className="h-4 w-4" /> Top Losers (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {losers.map((p) => (
                <div key={p.symbol} className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded px-2 py-1 transition-colors" onClick={() => navigate(`/trade/${encodeURIComponent(p.symbol)}`)}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-500">{p.symbol.split("/")[0].slice(0, 2)}</span>
                    </div>
                    <span className="text-sm font-medium">{p.symbol}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">{p.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Full Coin List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1">
                {(["all", "favorites"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "ghost"}
                    size="sm"
                    className="capitalize h-8 text-xs"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "favorites" ? <><Star className="h-3 w-3 mr-1" />Favorites</> : "All Markets"}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-8 w-40 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-4 py-2.5 border-b border-border/40 bg-muted/20">
              <span className="col-span-1"></span>
              <span className="col-span-3">Pair</span>
              <span className="col-span-3 text-right">Price</span>
              <span className="col-span-2 text-right">24h %</span>
              <span className="col-span-2 text-right hidden sm:block">Volume</span>
              <span className="col-span-1 text-right"></span>
            </div>

            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-border/20 animate-pulse">
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                  <div className="col-span-3 h-4 w-16 bg-muted rounded ml-auto" />
                  <div className="col-span-3 h-4 w-12 bg-muted rounded ml-auto" />
                </div>
              ))
            ) : filtered?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No coins match your search
              </div>
            ) : (
              filtered?.map((p) => {
                const isUp = p.change >= 0;
                const symbol = p.symbol.split("/")[0];
                const isFav = favorites.includes(p.symbol);

                return (
                  <div
                    key={p.symbol}
                    className="grid grid-cols-12 px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group items-center"
                    onClick={() => navigate(`/trade/${encodeURIComponent(p.symbol)}`)}
                  >
                    <div className="col-span-1">
                      <button
                        className={`transition-colors ${isFav ? "text-yellow-500" : "text-muted-foreground/30 hover:text-yellow-500"}`}
                        onClick={(e) => toggleFavorite(p.symbol, e)}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFav ? "fill-yellow-500" : ""}`} />
                      </button>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{symbol}</p>
                        <p className="text-xs text-muted-foreground">/ USDT</p>
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="font-mono font-semibold text-sm">${p.price.toLocaleString(undefined, { maximumFractionDigits: p.price > 100 ? 2 : 4 })}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge
                        variant="outline"
                        className={`text-xs ${isUp ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-red-500/30 text-red-500 bg-red-500/5"}`}
                      >
                        {isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {isUp ? "+" : ""}{p.change.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="col-span-2 text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">${(p.price * 18400).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground ml-auto transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
