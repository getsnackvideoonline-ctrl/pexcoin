import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetCryptoPrices,
  useGetMyBalance,
  useCreateTransaction,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COINS = [
  { value: "USDT", label: "USDT - Tether", color: "#26a17b" },
  { value: "BTC", label: "BTC - Bitcoin", color: "#f7931a" },
  { value: "ETH", label: "ETH - Ethereum", color: "#627eea" },
  { value: "SOL", label: "SOL - Solana", color: "#9945ff" },
  { value: "BNB", label: "BNB - BNB", color: "#f0b90b" },
];

function generateChartData(basePrice: number, points = 24) {
  const data = [];
  let price = basePrice;
  const now = new Date();

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    price = price * (1 + (Math.random() - 0.48) * 0.03);
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
}

export default function Trade() {
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const { data: prices } = useGetCryptoPrices();
  const { data: balance } = useGetMyBalance();
  const createTransaction = useCreateTransaction();

  const currentCoin = prices?.find(
    (p) => p.symbol === selectedCoin || p.symbol.startsWith(selectedCoin)
  );
  const currentPrice = currentCoin?.price ?? 0;
  const priceChange = currentCoin?.change ?? 0;
  const isPositive = priceChange >= 0;

  const chartData = generateChartData(currentPrice);

  const total = amount ? parseFloat(amount) * currentPrice : 0;

  const handleTrade = (side: "buy" | "sell") => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const currency = selectedCoin === "USDT" ? "USDT" :
      selectedCoin === "BTC" ? "BTC" : "ETH";

    toast({
      title: `${side === "buy" ? "Buy" : "Sell"} Order Placed`,
      description: `${side === "buy" ? "Buying" : "Selling"} ${amount} ${selectedCoin} at $${currentPrice.toLocaleString()}`,
    });
    setAmount("");
  };

  const coinColor = COINS.find((c) => c.value === selectedCoin)?.color ?? "#6366f1";

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Trade</h1>
            <p className="text-muted-foreground text-sm">Real-time crypto trading</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">USDT Balance</p>
              <p className="font-semibold">${balance?.usdt?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart & Market Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Coin Selector & Price */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COINS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <p className="text-2xl font-bold">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm flex items-center gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}{priceChange.toFixed(2)}% (24h)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div>
                      <p>24h High</p>
                      <p className="font-medium text-green-500">${(currentPrice * 1.03).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p>24h Low</p>
                      <p className="font-medium text-red-500">${(currentPrice * 0.97).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p>24h Vol</p>
                      <p className="font-medium">${(currentPrice * 18000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={coinColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={coinColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
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
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={coinColor}
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {prices?.slice(0, 6).map((p) => (
                    <div
                      key={p.symbol}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedCoin === p.symbol.replace("/USDT", "") ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        const coin = p.symbol.replace("/USDT", "");
                        if (COINS.find((c) => c.value === coin)) setSelectedCoin(coin);
                      }}
                    >
                      <p className="font-semibold text-xs">{p.symbol}</p>
                      <p className="text-sm font-bold">${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className={`text-xs ${p.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}%
                      </p>
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
                <CardTitle className="text-sm">Place Order</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
                    <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="market" className="space-y-4 mt-0">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Market Price</p>
                      <p className="font-bold">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="limit" className="space-y-4 mt-0">
                    <div>
                      <Label className="text-xs">Limit Price (USD)</Label>
                      <Input
                        type="number"
                        placeholder={currentPrice.toFixed(2)}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Amount ({selectedCoin})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {amount && (
                    <div className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      onClick={() => handleTrade("buy")}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Buy
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleTrade("sell")}
                    >
                      <ArrowDownRight className="h-4 w-4" />
                      Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#26a17b]/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-[#26a17b]">$</span>
                    </div>
                    <span className="text-sm font-medium">USDT</span>
                  </div>
                  <span className="text-sm font-medium">${balance?.usdt?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#f7931a]/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-[#f7931a]">₿</span>
                    </div>
                    <span className="text-sm font-medium">BTC</span>
                  </div>
                  <span className="text-sm font-medium">{balance?.btc?.toFixed(6) ?? "0.000000"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#627eea]/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-[#627eea]">Ξ</span>
                    </div>
                    <span className="text-sm font-medium">ETH</span>
                  </div>
                  <span className="text-sm font-medium">{balance?.eth?.toFixed(6) ?? "0.000000"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
