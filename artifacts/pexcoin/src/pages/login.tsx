import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const login = useLogin();
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
    login.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Logged in successfully" });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.data?.error || error?.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Log in to your PexCoin account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <Link href="/register" className="contents">
                  <TabsTrigger value="register" asChild>
                    <span>Register</span>
                  </TabsTrigger>
                </Link>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        Forgot password?
                      </span>
                    </div>
                    <Input 
                      id="password" 
                      type="password"
                      autoComplete="current-password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={login.isPending} data-testid="button-login">
                    {login.isPending ? "Logging in..." : "Log In"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      Register
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
