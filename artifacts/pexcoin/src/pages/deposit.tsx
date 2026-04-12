import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTransaction } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Deposit() {
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const createTx = useCreateTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    createTx.mutate({ 
      data: { 
        type: "deposit", 
        amount: Number(amount), 
        currency,
        note: `Deposit via ${currency} network`
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Deposit request submitted" });
        navigate("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Deposit failed", 
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
            <CardTitle className="text-2xl">Deposit Crypto</CardTitle>
            <CardDescription>Add funds to your PexCoin account</CardDescription>
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
              
              <div className="p-4 bg-muted/50 rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-2">Deposit Network</p>
                <div className="font-mono text-sm font-medium">
                  {currency === "USDT" ? "TRC20" : currency === "BTC" ? "Bitcoin" : "ERC20"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
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
                {createTx.isPending ? "Processing..." : "Confirm Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
