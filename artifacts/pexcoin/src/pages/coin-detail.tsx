import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useGetCryptoPrices, useGetMyBalance } from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", BNB: "#f0b90b", SOL: "#9945ff",
  ADA: "#0033ad", XRP: "#00aae4", DOT: "#e6007a", DOGE: "#c2a633",
  AVAX: "#e84142", MATIC: "#8247e5", LINK: "#375bd2", LTC: "#345d9d",
  default: "hsl(var(--primary))",
};

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", BNB: "BNB", SOL: "Solana",
  ADA: "Cardano", XRP: "XRP", DOT: "Polkadot", DOGE: "Dogecoin",
  AVAX: "Avalanche", MATIC: "Polygon", LINK: "Chainlink", LTC: "Litecoin",
  USDT: "Tether", TRX: "TRON", UNI: "Uniswap", ATOM: "Cosmos",
  ALGO: "Algorand", VET: "VeChain", FIL: "Filecoin", ICP: "Internet Computer",
  AAVE: "Aave", EOS: "EOS", XLM: "Stellar", THETA: "THETA",
};

function generateChartData(basePrice: number, points = 48) {
  const data = [];
  let price = basePrice * 0.97;
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    price = price * (1 + (Math.random() - 0.48) * 0.02);
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: parseFloat(price.toFixed(price > 100 ? 2 : 4)),
    });
  }
  return data;
}

export default function CoinDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [timeframe, setTimeframe] = useState("1D");

  const { data: prices } = useGetCryptoPrices({ query: { refetchInterval: 5000 } });
  const { data: balance } = useGetMyBalance();

  const decodedSymbol = decodeURIComponent(symbol ?? "");
  const coin = prices?.find((p) => p.symbol === decodedSymbol);
  const coinSymbol = decodedSymbol.split("/")[0] ?? "BTC";
  const coinName = COIN_NAMES[coinSymbol] ?? coinSymbol;
  const coinColor = COIN_COLORS[coinSymbol] ?? COIN_COLORS.default;
  const currentPrice = coin?.price ?? 0;
  const priceChange = coin?.change ?? 0;
  const isUp = priceChange >= 0;

  const chartData = generateChartData(currentPrice);
  const total = amount && currentPrice ? parseFloat(amount) * currentPrice : 0;
  const effectivePrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || currentPrice);

  const handleTrade = (side: "buy" | "sell") => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Enter an amount", variant: "destructive" });
      return;
    }
    toast({
      title: `${side === "buy" ? "Buy" : "Sell"} Order Placed`,
      description: `${side === "buy" ? "Buying" : "Selling"} ${amount} ${coinSymbol} at $${effectivePrice.toLocaleString()}`,
    });
    setAmount("");
  };

  if (!coin && prices) {
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Header */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: `${coinColor}20`, color: coinColor }}>
                      {coinSymbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold">{coinName}</h1>
                        <Badge variant="outline" className="text-xs">{decodedSymbol}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-2xl font-bold font-mono">
                          ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: currentPrice > 100 ? 2 : 4 })}
                        </span>
                        <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
                          {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {isUp ? "+" : ""}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-right">
                      <p>24h High</p>
                      <p className="font-medium text-green-500">${(currentPrice * 1.03).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p>24h Low</p>
                      <p className="font-medium text-red-500">${(currentPrice * 0.97).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p>24h Volume</p>
                      <p className="font-medium">${(currentPrice * 24000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Timeframe selector */}
              <div className="px-6 pb-1">
                <div className="flex gap-1">
                  {["1H", "4H", "1D", "1W", "1M"].map((tf) => (
                    <button
                      key={tf}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCoin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={coinColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={coinColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={7} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]}
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="price" stroke={coinColor} strokeWidth={2} fill="url(#colorCoin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Coin Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Info className="h-4 w-4" /> About {coinName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Market Cap", value: `$${(currentPrice * 19000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { label: "Circulating Supply", value: `19M ${coinSymbol}` },
                    { label: "Max Supply", value: `21M ${coinSymbol}` },
                    { label: "All Time High", value: `$${(currentPrice * 1.35).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-sm font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Place Order — {decodedSymbol}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="market" className="flex-1 text-xs">Market</TabsTrigger>
                    <TabsTrigger value="limit" className="flex-1 text-xs">Limit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="market" className="mt-0">
                    <div className="text-center p-3 bg-muted/50 rounded-lg mb-4">
                      <p className="text-xs text-muted-foreground">Best available price</p>
                      <p className="font-bold font-mono">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="limit" className="mt-0">
                    <div className="mb-4">
                      <Label className="text-xs">Limit Price (USD)</Label>
                      <Input
                        type="number"
                        placeholder={currentPrice.toFixed(2)}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="mt-1.5 h-9 text-sm"
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
                      className="mt-1.5 h-9 text-sm"
                    />
                  </div>

                  {/* Quick fill */}
                  <div className="flex gap-1.5">
                    {["25%", "50%", "75%", "100%"].map((pct) => (
                      <button
                        key={pct}
                        className="flex-1 text-xs py-1 border rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const pctVal = parseInt(pct) / 100;
                          const maxUsdt = (balance?.usdt ?? 0) * pctVal;
                          setAmount((maxUsdt / currentPrice).toFixed(6));
                        }}
                      >
                        {pct}
                      </button>
                    ))}
                  </div>

                  {amount && (
                    <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground text-xs">Total</span>
                      <span className="font-medium text-xs">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 text-white gap-1 h-10" onClick={() => handleTrade("buy")}>
                      <ArrowUpRight className="h-4 w-4" /> Buy
                    </Button>
                    <Button variant="destructive" className="gap-1 h-10" onClick={() => handleTrade("sell")}>
                      <ArrowDownRight className="h-4 w-4" /> Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Available Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">USDT</span>
                  <span className="font-mono font-medium">${(balance?.usdt ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {coinSymbol === "BTC" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">BTC</span>
                    <span className="font-mono font-medium">{(balance?.btc ?? 0).toFixed(6)}</span>
                  </div>
                )}
                {coinSymbol === "ETH" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ETH</span>
                    <span className="font-mono font-medium">{(balance?.eth ?? 0).toFixed(6)}</span>
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
