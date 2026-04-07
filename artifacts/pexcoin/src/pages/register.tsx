import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useRegister, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const register = useRegister();
  const { data: user } = useGetMe({ query: { retry: false } });

  // Fix: use useEffect for redirect instead of calling setLocation during render
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ data: { name, email, password, phone: phone || undefined } }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Account created successfully" });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Registration failed", 
          description: error?.data?.error || error?.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Join PexCoin to start trading</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="register" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <Link href="/login" className="contents">
                  <TabsTrigger value="login" asChild>
                    <span>Login</span>
                  </TabsTrigger>
                </Link>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      autoComplete="name"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      autoComplete="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                      className="font-mono text-sm"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      autoComplete="tel"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      autoComplete="new-password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={register.isPending} data-testid="button-register">
                    {register.isPending ? "Creating account..." : "Register"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Login
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
