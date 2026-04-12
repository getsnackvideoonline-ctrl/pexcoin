import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTransaction, useGetMyBalance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Withdraw() {
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: balance } = useGetMyBalance();
  const createTx = useCreateTransaction();

  const currentBalance = balance ? (balance as any)[currency.toLowerCase()] : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    
    if (Number(amount) > currentBalance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    
    if (!address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }

    createTx.mutate({ 
      data: { 
        type: "withdrawal", 
        amount: Number(amount), 
        currency,
        address
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Withdrawal request submitted" });
        navigate("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Withdrawal failed", 
          description: error.error || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-8">
        <div className="w-full max-w-md mb-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Withdraw Crypto</CardTitle>
            <CardDescription>Send funds to external wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Coin</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select coin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT (Tether)</SelectItem>
                    <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                    <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-mono font-bold text-foreground">
                  {currentBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {currency}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Destination Address</Label>
                <Input 
                  id="address" 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder={`Enter ${currency} address`}
                  required 
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount">Amount</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setAmount(currentBalance.toString())}
                  >
                    Max
                  </Button>
                </div>
                <div className="relative">
                  <Input 
                    id="amount" 
                    type="number" 
                    step="any"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="0.00"
                    required 
                    className="font-mono pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    {currency}
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full font-bold" disabled={createTx.isPending}>
                {createTx.isPending ? "Processing..." : "Confirm Withdrawal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
