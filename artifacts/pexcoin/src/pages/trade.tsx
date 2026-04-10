import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCryptoPrices, useGetMyBalance } from "@workspace/api-client-react";
import { ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown, Wallet, ChevronRight, Star, BarChart2 } from "lucide-react";

const FAVORITES_DEFAULT = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"];

function formatLargeNumber(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrice(price: number): string {
  if (!price) return "—";
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.001) return price.toFixed(4);
  return price.toFixed(8);
}

export default function Trade() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>(FAVORITES_DEFAULT);
  const [sortBy, setSortBy] = useState<"default" | "change" | "volume" | "marketCap">("default");

  const { data: prices, isLoading } = useGetCryptoPrices({
    query: { refetchInterval: 15000 },
  });
  const { data: balance } = useGetMyBalance();

  const sorted = [...(prices ?? [])].sort((a, b) => {
    if (sortBy === "change") return (b.change ?? 0) - (a.change ?? 0);
    if (sortBy === "volume") return (b.volume ?? 0) - (a.volume ?? 0);
    if (sortBy === "marketCap") return (b.marketCap ?? 0) - (a.marketCap ?? 0);
    return 0;
  });

  const filtered = sorted.filter((p) => {
    const matchesSearch = !search || p.symbol.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFav = activeTab === "all" || favorites.includes(p.symbol);
    return matchesSearch && matchesFav;
  });

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]);
  };

  const totalBalance = (balance?.usdt ?? 0);

  const gainers = (prices ?? []).filter((p) => p.change > 0).sort((a, b) => b.change - a.change).slice(0, 4);
  const losers = (prices ?? []).filter((p) => p.change < 0).sort((a, b) => a.change - b.change).slice(0, 4);

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Markets</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-muted-foreground text-sm">
                Live data from CoinGecko · {prices?.length ?? 0} pairs
              </p>
            </div>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-2 px-4 flex items-center gap-3">
              <Wallet className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">USDT Balance</p>
                <p className="font-bold font-mono">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gainers & Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-1.5 text-green-500">
                <TrendingUp className="h-4 w-4" /> Top Gainers (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-3">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              )) : gainers.map((p) => (
                <div
                  key={p.symbol}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors"
                  onClick={() => navigate(`/trade/${encodeURIComponent(p.symbol)}`)}
                >
                  <div className="flex items-center gap-2">
                    {p.iconUrl
                      ? <img src={p.iconUrl} alt={p.name} className="w-6 h-6 rounded-full" />
                      : <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center"><span className="text-xs font-bold text-green-500">{p.symbol.split("/")[0].slice(0,2)}</span></div>
                    }
                    <div>
                      <span className="text-sm font-medium">{p.symbol.split("/")[0]}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">${formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-500">+{p.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-1.5 text-red-500">
                <TrendingDown className="h-4 w-4" /> Top Losers (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-3">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              )) : losers.map((p) => (
                <div
                  key={p.symbol}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors"
                  onClick={() => navigate(`/trade/${encodeURIComponent(p.symbol)}`)}
                >
                  <div className="flex items-center gap-2">
                    {p.iconUrl
                      ? <img src={p.iconUrl} alt={p.name} className="w-6 h-6 rounded-full" />
                      : <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center"><span className="text-xs font-bold text-red-500">{p.symbol.split("/")[0].slice(0,2)}</span></div>
                    }
                    <div>
                      <span className="text-sm font-medium">{p.symbol.split("/")[0]}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">${formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-500">{p.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Full Coin Table */}
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
                    {tab === "favorites" ? <><Star className="h-3 w-3 mr-1 fill-current" />Favorites</> : <><BarChart2 className="h-3 w-3 mr-1" />All Markets</>}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {/* Sort buttons */}
                <div className="hidden sm:flex gap-1 text-xs">
                  {(["default", "marketCap", "volume", "change"] as const).map((s) => (
                    <button
                      key={s}
                      className={`px-2.5 py-1 rounded border transition-colors ${sortBy === s ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setSortBy(s)}
                    >
                      {s === "default" ? "Default" : s === "marketCap" ? "Market Cap" : s === "volume" ? "Volume" : "24h %"}
                    </button>
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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-4 py-2.5 border-b border-border/40 bg-muted/20">
              <span className="col-span-1"></span>
              <span className="col-span-3">Coin</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">24h %</span>
              <span className="col-span-2 text-right hidden md:block">Market Cap</span>
              <span className="col-span-1 text-right hidden md:block">Volume</span>
              <span className="col-span-1 text-right"></span>
            </div>

            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-border/20 gap-2 items-center">
                  <div className="col-span-1"><Skeleton className="w-4 h-4" /></div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-10" /></div>
                  </div>
                  <div className="col-span-2 flex justify-end"><Skeleton className="h-4 w-20" /></div>
                  <div className="col-span-2 flex justify-end"><Skeleton className="h-5 w-16" /></div>
                  <div className="col-span-2 hidden md:flex justify-end"><Skeleton className="h-4 w-16" /></div>
                  <div className="col-span-1 hidden md:flex justify-end"><Skeleton className="h-4 w-12" /></div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No coins match your search</div>
            ) : (
              filtered.map((p) => {
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
                        className={`transition-colors ${isFav ? "text-yellow-500" : "text-muted-foreground/20 hover:text-yellow-500"}`}
                        onClick={(e) => toggleFavorite(p.symbol, e)}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFav ? "fill-yellow-500" : ""}`} />
                      </button>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      {p.iconUrl
                        ? <img src={p.iconUrl} alt={p.name} className="w-7 h-7 rounded-full shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{symbol.slice(0, 2)}</span>
                          </div>
                      }
                      <div>
                        <p className="font-semibold text-sm">{symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[80px]">{p.name}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-mono font-semibold text-sm">${formatPrice(p.price)}</p>
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
                    <div className="col-span-2 text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">{formatLargeNumber(p.marketCap)}</p>
                    </div>
                    <div className="col-span-1 text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">{formatLargeNumber(p.volume)}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground ml-auto transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground pb-2">
          Real-time market data provided by <span className="text-primary">CoinGecko API</span>
        </p>
      </div>
    </Layout>
  );
}
