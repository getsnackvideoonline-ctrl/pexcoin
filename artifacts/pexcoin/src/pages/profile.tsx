import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetMe, useGetMyBalance, useGetMyTransactions } from "@workspace/api-client-react";
import {
  User, Mail, Phone, Shield, Crown, Copy, Check, Key,
  TrendingUp, Wallet, Clock, LogOut, ChevronRight
} from "lucide-react";
import { removeToken } from "@/lib/auth-utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: balance } = useGetMyBalance();
  const { data: transactions } = useGetMyTransactions();

  const [copiedCode, setCopiedCode] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  const inviteLink = user?.inviteCode
    ? `${window.location.origin}${BASE}/register?ref=${user.inviteCode}`
    : "";

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({ title: "Invite link copied!" });
  };

  const handleLogout = () => {
    removeToken();
    queryClient.setQueryData(getGetMeQueryKey(), null);
    navigate("/login");
  };

  const completedTx = (transactions as any[])?.filter((t: any) => t.status === "completed").length ?? 0;
  const totalDeposits = (transactions as any[])?.filter((t: any) => t.type === "deposit" && t.status === "completed")
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) ?? 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" /> Logout
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                style={{ background: isSuperAdmin ? "rgba(234,179,8,0.15)" : "hsl(var(--primary)/0.15)", color: isSuperAdmin ? "#eab308" : "hsl(var(--primary))" }}>
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold truncate">{user?.name ?? "User"}</h2>
                  {isSuperAdmin ? (
                    <Badge className="gap-1 bg-yellow-500/15 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/15">
                      <Crown className="h-3 w-3" /> Super Admin
                    </Badge>
                  ) : isAdmin ? (
                    <Badge className="gap-1 bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/15">
                      <Shield className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Trader</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Wallet className="h-4 w-4 text-primary" />, label: "USDT Balance", value: `$${(balance?.usdt ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { icon: <TrendingUp className="h-4 w-4 text-green-500" />, label: "Total Deposited", value: `$${totalDeposits.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { icon: <Clock className="h-4 w-4 text-blue-500" />, label: "Transactions", value: `${completedTx}` },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-sm">{user?.name ?? "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-medium text-sm">{user?.email ?? "—"}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            </div>
            <Separator />
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-medium text-sm">{(user as any)?.phone ?? "Not provided"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Account Role</p>
                <p className="font-medium text-sm capitalize">{user?.role?.replace("_", " ") ?? "user"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite Link */}
        {user?.inviteCode && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/40">
                <code className="text-xs text-muted-foreground flex-1 truncate select-all">{inviteLink}</code>
                <Button size="sm" variant="outline" className="shrink-0 h-7 gap-1 text-xs" onClick={copyCode}>
                  {copiedCode ? <><Check className="h-3 w-3 text-green-500" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your code: <span className="font-mono font-bold text-foreground">{user.inviteCode}</span></span>
                <span className="text-primary font-medium">Earn 5% per referral deposit</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4" /> Security</CardTitle>
          </CardHeader>
          <CardContent>
            {!editingPassword ? (
              <Button variant="outline" className="w-full gap-2 justify-between" onClick={() => setEditingPassword(true)}>
                <span className="flex items-center gap-2"><Key className="h-4 w-4" /> Change Password</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-9 text-sm"
                    onClick={() => {
                      if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
                      if (newPw.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
                      toast({ title: "Password change not yet implemented", description: "Contact support to change your password." });
                      setEditingPassword(false);
                      setCurrentPw(""); setNewPw(""); setConfirmPw("");
                    }}
                  >
                    Update Password
                  </Button>
                  <Button variant="outline" className="h-9 text-sm" onClick={() => { setEditingPassword(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Link */}
        {isAdmin && (
          <Card className={`border-${isSuperAdmin ? "yellow" : "blue"}-500/20`}>
            <CardContent className="pt-4 pb-4">
              <Button
                variant="outline"
                className={`w-full gap-2 justify-between ${isSuperAdmin ? "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" : "border-blue-500/30 text-blue-500 hover:bg-blue-500/10"}`}
                onClick={() => navigate("/admin")}
              >
                <span className="flex items-center gap-2">
                  {isSuperAdmin ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  {isSuperAdmin ? "Super Admin Panel" : "Admin Dashboard"}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
