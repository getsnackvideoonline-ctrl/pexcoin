import { useState } from "react";
import { useGetMyBalance, useGetMyTransactions, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Gift, TrendingUp, Users } from "lucide-react";

function InviteCard({ inviteCode, commissionEarned }: { inviteCode: string; commissionEarned: number }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const inviteLink = `${baseUrl}/register?ref=${inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Users className="h-3 w-3" /> Your Invite Code
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg tracking-widest text-primary">{inviteCode}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={handleCopyCode}
                title="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" /> Commission Earned
            </p>
            <span className="font-mono font-bold text-lg text-positive">
              ${commissionEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Your invite link</p>
          <div className="flex items-center gap-2 p-2 bg-black/30 rounded border border-border/50">
            <span className="font-mono text-xs text-muted-foreground truncate flex-1 select-all">
              {inviteLink}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 text-xs"
              onClick={handleCopy}
            >
              {copied ? <><Check className="h-3 w-3 mr-1 text-positive" />Copied!</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Earn <span className="text-primary font-semibold">5% commission</span> on every deposit your referrals make.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: balance, isLoading: loadingBalance } = useGetMyBalance();
  const { data: transactions, isLoading: loadingTransactions } = useGetMyTransactions();
  const { data: user } = useGetMe({ query: { retry: false } });

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">USDT Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBalance ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold font-mono">
                  {parseFloat(String(balance?.usdt ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
                </div>
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
                <div className="text-2xl font-bold font-mono">
                  {parseFloat(String(balance?.btc ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">BTC</span>
                </div>
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
                <div className="text-2xl font-bold font-mono">
                  {parseFloat(String(balance?.eth ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">ETH</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invite / Referral Card */}
        {user?.inviteCode && (
          <InviteCard
            inviteCode={user.inviteCode}
            commissionEarned={user.commissionEarned ?? 0}
          />
        )}

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
                No transactions yet.{" "}
                <Link href="/deposit" className="text-primary hover:underline">Make your first deposit</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
