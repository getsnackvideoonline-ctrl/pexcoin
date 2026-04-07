import { useGetMyBalance, useGetMyTransactions } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: balance, isLoading: loadingBalance } = useGetMyBalance();
  const { data: transactions, isLoading: loadingTransactions } = useGetMyTransactions();

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your assets and view transaction history</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/deposit">
              <Button variant="default" className="font-bold">Deposit</Button>
            </Link>
            <Link href="/withdraw">
              <Button variant="outline" className="font-bold">Withdraw</Button>
            </Link>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">USDT Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold font-mono">{balance?.usdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">USDT</span></div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">BTC Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold font-mono">{balance?.btc.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} <span className="text-sm font-normal text-muted-foreground">BTC</span></div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ETH Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold font-mono">{balance?.eth.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} <span className="text-sm font-normal text-muted-foreground">ETH</span></div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium capitalize">{tx.type}</TableCell>
                        <TableCell className="font-mono">
                          {tx.amount} {tx.currency}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            tx.status === "completed" ? "default" :
                            tx.status === "rejected" ? "destructive" : "secondary"
                          }>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                          {tx.address ? `To: ${tx.address}` : tx.note || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
