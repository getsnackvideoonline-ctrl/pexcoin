import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCryptoPrices, useGetCoinChart, useGetMyBalance, usePlaceOrder } from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  BarChart2, Info, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Symbol → CoinGecko ID map
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",   ETH: "ethereum",  BNB: "binancecoin", SOL: "solana",
  ADA: "cardano",   XRP: "ripple",    DOGE: "dogecoin",   DOT: "polkadot",
  LTC: "litecoin",  AVAX: "avalanche-2", MATIC: "matic-network", LINK: "chainlink",
  SHIB: "shiba-inu",UNI: "uniswap",   ATOM: "cosmos",     BCH: "bitcoin-cash",
  ETC: "ethereum-classic", FIL: "filecoin", TON: "toncoin", XLM: "stellar",
  ALGO: "algorand", TRX: "tron",      USDC: "usd-coin",   ICP: "internet-computer",
  AAVE: "aave",     EOS: "eos",       FLOW: "flow",       THETA: "theta-network",
};

const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", BNB: "#f0b90b", SOL: "#9945ff",
  ADA: "#0033ad", XRP: "#00aae4", DOT: "#e6007a", DOGE: "#c2a633",
  AVAX: "#e84142", MATIC: "#8247e5", LINK: "#375bd2", LTC: "#345d9d",
  SHIB: "#e85f2a", UNI: "#ff007a", ATOM: "#2e3148", BCH: "#0ac18e",
  ETC: "#3ab83a",  FIL: "#0090ff", TON: "#0098ea", XLM: "#7d00ff",
  default: "hsl(var(--primary))",
};

const TIMEFRAME_DAYS: Record<string, string> = {
  "1H": "0.04", "4H": "0.17", "1D": "1", "1W": "7", "1M": "30", "3M": "90",
};

function formatLargeNumber(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

export default function CoinDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [timeframe, setTimeframe] = useState("1D");

  const decodedSymbol = decodeURIComponent(symbol ?? "");
  const coinSymbol = decodedSymbol.split("/")[0] ?? "BTC";
  const coinGeckoId = SYMBOL_TO_ID[coinSymbol] ?? coinSymbol.toLowerCase();
  const coinColor = COIN_COLORS[coinSymbol] ?? COIN_COLORS.default;

  // Fetch live coin list for price + market data
  const { data: prices, isLoading: loadingPrices } = useGetCryptoPrices({
    query: { refetchInterval: 10000 },
  });

  // Fetch chart data from CoinGecko via backend
  const { data: chartData, isLoading: loadingChart } = useGetCoinChart(
    coinGeckoId,
    { days: TIMEFRAME_DAYS[timeframe] },
    { query: { staleTime: 60_000 } }
  );

  const { data: balance } = useGetMyBalance();
  const placeMutation = usePlaceOrder();

  const coin = prices?.find((p) => p.symbol === decodedSymbol);
  const coinName = coin?.name ?? coinSymbol;
  const currentPrice = coin?.price ?? 0;
  const priceChange = coin?.change ?? 0;
  const isUp = priceChange >= 0;

  // Format chart data for recharts
  const formattedChart = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return chartData.map((pt) => ({
      time: new Date(pt.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: pt.price,
      timestamp: pt.time,
    }));
  }, [chartData]);

  const total = amount && currentPrice ? parseFloat(amount) * currentPrice : 0;
  const effectivePrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || currentPrice);

  const handleTrade = (side: "buy" | "sell") => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Enter an amount", variant: "destructive" });
      return;
    }
    if (currentPrice <= 0) {
      toast({ title: "Price unavailable", description: "Cannot place order without a current price", variant: "destructive" });
      return;
    }

    const orderAmount = parseFloat(amount);
    const symbol = `${coinSymbol}USDT`;

    placeMutation.mutate(
      {
        symbol,
        side,
        type: orderType,
        amount: orderAmount,
        price: orderType === "limit" ? (parseFloat(limitPrice) || currentPrice) : undefined,
        total: orderType === "market" && side === "buy" ? orderAmount * currentPrice : undefined,
      },
      {
        onSuccess: (data) => {
          const filled = data.filledAmount ?? orderAmount;
          const atPrice = data.avgPrice ?? data.price ?? currentPrice;
          toast({
            title: `${side === "buy" ? "Buy" : "Sell"} Order ${data.status === "filled" ? "Filled" : "Placed"}`,
            description: `${side === "buy" ? "Bought" : "Sold"} ${Number(filled).toFixed(6)} ${coinSymbol} @ $${formatPrice(Number(atPrice))}`,
          });
          setAmount("");
          setLimitPrice("");
        },
        onError: (error: any) => {
          const msg = error?.data?.error ?? error?.message ?? "An error occurred";
          toast({ title: "Order failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  // Get X-axis interval based on timeframe
  const xAxisInterval = useMemo(() => {
    const len = formattedChart.length;
    if (len <= 24) return Math.floor(len / 6);
    if (len <= 168) return Math.floor(len / 7);
    return Math.floor(len / 8);
  }, [formattedChart]);

  if (!coin && !loadingPrices && prices) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Coin "{decodedSymbol}" not found.</p>
          <Link to="/trade"><Button>Back to Markets</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-muted-foreground" onClick={() => navigate("/trade")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Markets
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">{decodedSymbol}</span>
          <Badge variant="outline" className="text-xs ml-1">Live</Badge>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-0.5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {coin?.iconUrl ? (
                      <img src={coin.iconUrl} alt={coinName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: `${coinColor}20`, color: coinColor }}>
                        {coinSymbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold">{coinName}</h1>
                        <Badge variant="outline" className="text-xs font-mono">{decodedSymbol}</Badge>
                      </div>
                      {loadingPrices ? (
                        <Skeleton className="h-8 w-40 mt-1" />
                      ) : (
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-2xl font-bold font-mono">${formatPrice(currentPrice)}</span>
                          <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
                            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {isUp ? "+" : ""}{priceChange.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
                    <div className="text-right">
                      <p>24h High</p>
                      <p className="font-medium text-green-500">{coin?.high24h ? `$${formatPrice(coin.high24h)}` : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p>24h Low</p>
                      <p className="font-medium text-red-500">{coin?.low24h ? `$${formatPrice(coin.low24h)}` : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p>Volume 24h</p>
                      <p className="font-medium">{formatLargeNumber(coin?.volume)}</p>
                    </div>
                    <div className="text-right">
                      <p>Market Cap</p>
                      <p className="font-medium">{formatLargeNumber(coin?.marketCap)}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Timeframe selector */}
              <div className="px-6 pb-2">
                <div className="flex gap-1">
                  {Object.keys(TIMEFRAME_DAYS).map((tf) => (
                    <button
                      key={tf}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <CardContent className="pt-1">
                {loadingChart ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm">Loading chart from CoinGecko...</p>
                    </div>
                  </div>
                ) : formattedChart.length === 0 ? (
                  <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
                    <BarChart2 className="h-8 w-8 mr-2 opacity-40" />
                    Chart data unavailable
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={formattedChart} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id={`colorCoin-${coinSymbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={coinColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={coinColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        interval={xAxisInterval}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => (v >= 1 ? `$${v.toLocaleString()}` : `$${v.toFixed(4)}`)}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip
                        formatter={(v: number) => [`$${formatPrice(v)}`, coinSymbol]}
                        labelFormatter={(label) => `Time: ${label}`}
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={coinColor}
                        strokeWidth={2}
                        fill={`url(#colorCoin-${coinSymbol})`}
                        dot={false}
                        activeDot={{ r: 4, fill: coinColor }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Coin Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Info className="h-4 w-4" /> Market Statistics — {coinName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Market Cap", value: formatLargeNumber(coin?.marketCap) },
                    { label: "24h Volume", value: formatLargeNumber(coin?.volume) },
                    { label: "24h High", value: coin?.high24h ? `$${formatPrice(coin.high24h)}` : "—" },
                    { label: "24h Low",  value: coin?.low24h  ? `$${formatPrice(coin.low24h)}`  : "—" },
                    { label: "24h Change", value: `${isUp ? "+" : ""}${priceChange.toFixed(2)}%`, color: isUp ? "text-green-500" : "text-red-500" },
                    { label: "Symbol", value: coinSymbol },
                    { label: "Pair", value: decodedSymbol },
                    { label: "Source", value: "CoinGecko" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-sm font-semibold ${(stat as any).color ?? ""}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  Real-time data powered by CoinGecko API · Updates every 30s
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                    {coin?.iconUrl
                      ? <img src={coin.iconUrl} alt={coinSymbol} className="w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ background: `${coinColor}20`, color: coinColor }}>{coinSymbol.slice(0,2)}</div>
                    }
                  </div>
                  Trade {coinSymbol} / USDT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <TabsList className="w-full mb-4 h-9">
                    <TabsTrigger value="market" className="flex-1 text-xs">Market</TabsTrigger>
                    <TabsTrigger value="limit" className="flex-1 text-xs">Limit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="market" className="mt-0">
                    <div className="text-center p-3 bg-muted/50 rounded-lg mb-4">
                      <p className="text-xs text-muted-foreground">Current Market Price</p>
                      {loadingPrices ? <Skeleton className="h-6 w-28 mx-auto mt-1" /> : (
                        <p className="font-bold font-mono text-lg">${formatPrice(currentPrice)}</p>
                      )}
                      <p className={`text-xs mt-0.5 font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                        {isUp ? "↑" : "↓"} {isUp ? "+" : ""}{priceChange.toFixed(2)}% 24h
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="limit" className="mt-0">
                    <div className="mb-4 space-y-1.5">
                      <Label className="text-xs">Limit Price (USD)</Label>
                      <Input
                        type="number"
                        placeholder={currentPrice ? formatPrice(currentPrice) : "0.00"}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Amount ({coinSymbol})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1.5 h-9 text-sm font-mono"
                    />
                  </div>

                  {/* Quick fill */}
                  <div className="flex gap-1">
                    {["25%", "50%", "75%", "100%"].map((pct) => (
                      <button
                        key={pct}
                        className="flex-1 text-xs py-1 border rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const pctVal = parseInt(pct) / 100;
                          const maxUsdt = (balance?.usdt ?? 0) * pctVal;
                          if (currentPrice > 0) setAmount((maxUsdt / currentPrice).toFixed(6));
                        }}
                      >
                        {pct}
                      </button>
                    ))}
                  </div>

                  {amount && currentPrice > 0 && (
                    <div className="flex justify-between text-sm p-2 bg-muted/30 rounded border border-border/40">
                      <span className="text-muted-foreground text-xs">Total Cost</span>
                      <span className="font-medium text-xs font-mono">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-10 font-bold"
                      onClick={() => handleTrade("buy")}
                      disabled={placeMutation.isPending}
                    >
                      {placeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />} Buy
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5 h-10 font-bold"
                      onClick={() => handleTrade("sell")}
                      disabled={placeMutation.isPending}
                    >
                      {placeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownRight className="h-4 w-4" />} Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Available Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">$</span>
                    </div>
                    <span className="text-sm">USDT</span>
                  </div>
                  <span className="font-mono font-medium text-sm">${(balance?.usdt ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {["BTC", "ETH", "BNB", "SOL"].includes(coinSymbol) && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {coin?.iconUrl
                        ? <img src={coin.iconUrl} alt={coinSymbol} className="w-5 h-5 rounded-full" />
                        : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: `${coinColor}20`, color: coinColor }}>{coinSymbol.slice(0,2)}</div>
                      }
                      <span className="text-sm">{coinSymbol}</span>
                    </div>
                    <span className="font-mono font-medium text-sm">
                      {((balance as any)?.[coinSymbol.toLowerCase()] ?? 0).toFixed(6)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
