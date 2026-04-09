import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMyBalance, useGetCryptoPrices, useGetMyTransactions } from "@workspace/api-client-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Layers } from "lucide-react";

const COIN_COLORS: Record<string, string> = {
  USDT: "#26a17b",
  BTC: "#f7931a",
  ETH: "#627eea",
};

function generatePortfolioHistory(usdtVal: number, btcVal: number, ethVal: number, days = 30) {
  const data = [];
  let usdt = usdtVal;
  let btc = btcVal;
  let eth = ethVal;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    btc *= 1 + (Math.random() - 0.48) * 0.04;
    eth *= 1 + (Math.random() - 0.48) * 0.05;
    data.push({
      date: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      total: parseFloat((usdt + btc + eth).toFixed(2)),
      usdt: parseFloat(usdt.toFixed(2)),
      btc: parseFloat(btc.toFixed(2)),
      eth: parseFloat(eth.toFixed(2)),
    });
  }
  return data;
}

export default function Portfolio() {
  const { data: balance } = useGetMyBalance();
  const { data: prices } = useGetCryptoPrices();
  const { data: transactions } = useGetMyTransactions();

  const btcPrice = prices?.find((p) => p.symbol.startsWith("BTC"))?.price ?? 0;
  const ethPrice = prices?.find((p) => p.symbol.startsWith("ETH"))?.price ?? 0;

  const usdtValue = balance?.usdt ?? 0;
  const btcValue = (balance?.btc ?? 0) * btcPrice;
  const ethValue = (balance?.eth ?? 0) * ethPrice;
  const totalValue = usdtValue + btcValue + ethValue;

  const pieData = [
    { name: "USDT", value: usdtValue, color: COIN_COLORS.USDT },
    { name: "BTC", value: btcValue, color: COIN_COLORS.BTC },
    { name: "ETH", value: ethValue, color: COIN_COLORS.ETH },
  ].filter((d) => d.value > 0);

  const historyData = generatePortfolioHistory(usdtValue, btcValue, ethValue);

  const holdings = [
    {
      symbol: "USDT",
      name: "Tether",
      amount: balance?.usdt ?? 0,
      price: 1,
      value: usdtValue,
      change: 0,
      color: COIN_COLORS.USDT,
      icon: "$",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      amount: balance?.btc ?? 0,
      price: btcPrice,
      value: btcValue,
      change: prices?.find((p) => p.symbol.startsWith("BTC"))?.change ?? 0,
      color: COIN_COLORS.BTC,
      icon: "₿",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: balance?.eth ?? 0,
      price: ethPrice,
      value: ethValue,
      change: prices?.find((p) => p.symbol.startsWith("ETH"))?.change ?? 0,
      color: COIN_COLORS.ETH,
      icon: "Ξ",
    },
  ];

  const recentTx = (transactions as any[])?.slice(0, 5) ?? [];

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground text-sm">Track your crypto holdings and performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Total Portfolio Value</span>
              </div>
              <p className="text-3xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Bitcoin className="h-4 w-4 text-[#f7931a]" />
                <span className="text-sm text-muted-foreground font-medium">Bitcoin Holdings</span>
              </div>
              <p className="text-2xl font-bold">{(balance?.btc ?? 0).toFixed(6)} BTC</p>
              <p className="text-sm text-muted-foreground">${btcValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-[#627eea]" />
                <span className="text-sm text-muted-foreground font-medium">Ethereum Holdings</span>
              </div>
              <p className="text-2xl font-bold">{(balance?.eth ?? 0).toFixed(6)} ETH</p>
              <p className="text-sm text-muted-foreground">${ethValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Chart */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Portfolio Value (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Holdings Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holdings.map((h) => (
                    <div key={h.symbol} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: `${h.color}20`, color: h.color }}
                        >
                          {h.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{h.symbol}</p>
                          <p className="text-xs text-muted-foreground">{h.name}</p>
                        </div>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-sm font-medium">{h.amount.toFixed(h.symbol === "USDT" ? 2 : 6)}</p>
                        <p className="text-xs text-muted-foreground">@ ${h.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${h.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className={`text-xs flex items-center justify-end gap-0.5 ${h.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {h.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {h.change >= 0 ? "+" : ""}{h.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Pie + Recent Tx */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {totalValue > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                            <span>{d.name}</span>
                          </div>
                          <span className="font-medium">
                            {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No holdings yet. Deposit funds to get started.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTx.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentTx.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-xs font-medium capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">{tx.currency}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${tx.type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                            {tx.type === "deposit" ? "+" : "-"}{tx.amount} {tx.currency}
                          </p>
                          <Badge
                            variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                            className="text-xs px-1.5 py-0"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
