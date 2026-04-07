import { useState } from "react";
import { 
  useAdminGetStats, 
  useAdminGetUsers, 
  useAdminGetTransactions, 
  useAdminApproveTransaction, 
  useAdminRejectTransaction, 
  useAdminGetUser,
  useAdminUpdateUser,
  getAdminGetTransactionsQueryKey, 
  getAdminGetStatsQueryKey,
  getAdminGetUsersQueryKey,
  getAdminGetUserQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { removeAdminToken } from "@/lib/auth-utils";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, LogOut, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function EditUserDialog({ userId, open, onOpenChange }: { userId: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: user, isLoading } = useAdminGetUser(userId!, { query: { enabled: !!userId } });
  const updateUser = useAdminUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [status, setStatus] = useState<string>("active");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [btcBalance, setBtcBalance] = useState<string>("0");
  const [ethBalance, setEthBalance] = useState<string>("0");

  // Sync state when user data loads
  if (user && status === "active" && usdtBalance === "0" && !isLoading) {
    // Basic sync, ideally use a useEffect
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      setStatus(user.status);
      setUsdtBalance(user.usdtBalance.toString());
      setBtcBalance(user.btcBalance.toString());
      setEthBalance(user.ethBalance.toString());
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!userId) return;
    updateUser.mutate(
      { 
        id: userId, 
        data: { 
          status, 
          usdtBalance: Number(usdtBalance),
          btcBalance: Number(btcBalance),
          ethBalance: Number(ethBalance)
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "User updated successfully" });
          queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err.error, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#111] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Edit User #{userId}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>USDT Balance</Label>
              <Input type="number" value={usdtBalance} onChange={e => setUsdtBalance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>BTC Balance</Label>
              <Input type="number" value={btcBalance} onChange={e => setBtcBalance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ETH Balance</Label>
              <Input type="number" value={ethBalance} onChange={e => setEthBalance(e.target.value)} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminGetStats({ query: { refetchInterval: 10000 }});
  const { data: users, isLoading: loadingUsers } = useAdminGetUsers();
  const { data: transactions, isLoading: loadingTxs } = useAdminGetTransactions({ query: { refetchInterval: 10000 }});
  
  const approveTx = useAdminApproveTransaction();
  const rejectTx = useAdminRejectTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleLogout = () => {
    removeAdminToken();
    setLocation("/admin");
  };

  const handleApprove = (id: number) => {
    approveTx.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction approved" });
        queryClient.invalidateQueries({ queryKey: getAdminGetTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectTx.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminGetTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    });
  };

  const openEditUser = (id: number) => {
    setEditUserId(id);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-sans flex flex-col">
      <header className="border-b border-border/40 bg-[#111] py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-widest text-primary flex items-center gap-2">
          PEXCOIN <span className="text-muted-foreground text-sm font-normal tracking-normal border-l border-border/50 pl-2 ml-2">Admin Center</span>
        </h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-white">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#111] border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{stats?.activeUsers}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-positive">{stats?.totalDeposits}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold text-negative">{stats?.totalWithdrawals}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-border/50 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${stats?.pendingTransactions ? 'bg-primary' : 'bg-transparent'}`}></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pending TXs</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                <div className={`text-2xl font-bold ${stats?.pendingTransactions ? 'text-primary' : ''}`}>
                  {stats?.pendingTransactions}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-[#111] border-border/50 mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="m-0">
            <Card className="bg-[#111] border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Transaction Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTxs ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="rounded-md border border-border/40">
                    <Table>
                      <TableHeader className="bg-black/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((tx) => (
                          <TableRow key={tx.id} className="border-border/40">
                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                            <TableCell className="text-xs">{tx.userEmail}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={tx.type === "deposit" ? "text-positive border-positive/30" : "text-negative border-negative/30"}>
                                {tx.type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono font-bold">
                              {tx.amount} {tx.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                tx.status === "completed" ? "default" :
                                tx.status === "rejected" ? "destructive" : "secondary"
                              }>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {tx.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0 text-positive hover:text-positive hover:bg-positive/10 border-positive/30"
                                    onClick={() => handleApprove(tx.id)}
                                    disabled={approveTx.isPending || rejectTx.isPending}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0 text-negative hover:text-negative hover:bg-negative/10 border-negative/30"
                                    onClick={() => handleReject(tx.id)}
                                    disabled={approveTx.isPending || rejectTx.isPending}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <Card className="bg-[#111] border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="rounded-md border border-border/40">
                    <Table>
                      <TableHeader className="bg-black/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>USDT</TableHead>
                          <TableHead>BTC</TableHead>
                          <TableHead>ETH</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id} className="border-border/40">
                            <TableCell className="font-mono text-xs">{user.id}</TableCell>
                            <TableCell className="text-xs font-medium">{user.email}</TableCell>
                            <TableCell className="text-xs">{user.name}</TableCell>
                            <TableCell className="font-mono text-xs">{user.usdtBalance.toFixed(2)}</TableCell>
                            <TableCell className="font-mono text-xs">{user.btcBalance.toFixed(6)}</TableCell>
                            <TableCell className="font-mono text-xs">{user.ethBalance.toFixed(6)}</TableCell>
                            <TableCell>
                              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => openEditUser(user.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EditUserDialog userId={editUserId} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
