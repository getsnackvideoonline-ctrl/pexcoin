import { useState, useEffect, useCallback } from "react";
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
import { CheckCircle2, XCircle, Loader2, Gift } from "lucide-react";

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");
  const [inviteReferrer, setInviteReferrer] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const register = useRegister();
  const { data: user } = useGetMe({ query: { retry: false } });

  // Pre-fill invite code from URL ?ref=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setInviteCode(ref.toUpperCase());
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  // Live-validate invite code (debounced)
  const validateInviteCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setInviteStatus("idle");
      setInviteReferrer(null);
      return;
    }
    setInviteStatus("checking");
    try {
      const res = await fetch(`/api/auth/invite/validate?code=${encodeURIComponent(code.toUpperCase())}`);
      const data = await res.json();
      if (data.valid) {
        setInviteStatus("valid");
        setInviteReferrer(data.referrerName);
      } else {
        setInviteStatus("invalid");
        setInviteReferrer(null);
      }
    } catch {
      setInviteStatus("invalid");
      setInviteReferrer(null);
    }
  }, []);

  useEffect(() => {
    if (!inviteCode) {
      setInviteStatus("idle");
      setInviteReferrer(null);
      return;
    }
    const t = setTimeout(() => validateInviteCode(inviteCode), 600);
    return () => clearTimeout(t);
  }, [inviteCode, validateInviteCode]);

  // Gmail validation
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val && !val.toLowerCase().endsWith("@gmail.com")) {
      setEmailError("Only Gmail addresses (@gmail.com) are accepted");
    } else {
      setEmailError(null);
    }
  };

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      toast({ title: "Invalid email", description: "Only Gmail (@gmail.com) addresses are accepted", variant: "destructive" });
      return;
    }

    if (inviteStatus !== "valid") {
      toast({ title: "Invalid invite code", description: "Please enter a valid invitation code to register", variant: "destructive" });
      return;
    }

    register.mutate(
      { data: { name, email: email.toLowerCase(), password, phone: phone || undefined, inviteCode: inviteCode.toUpperCase() } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast({ title: "Account created!", description: "Welcome to PexCoin!" });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "Registration failed",
            description: error?.data?.error ?? error?.message ?? "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
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
                  <TabsTrigger value="login" asChild><span>Login</span></TabsTrigger>
                </Link>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email - Gmail only */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-xs text-muted-foreground">(Gmail only)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="yourname@gmail.com"
                      required
                      className={`font-mono text-sm ${emailError ? "border-destructive" : ""}`}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {emailError}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Invite Code */}
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode" className="flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5 text-primary" />
                      Invitation Code <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter 8-character invite code"
                        required
                        className={`font-mono uppercase pr-10 tracking-widest ${
                          inviteStatus === "valid"
                            ? "border-green-500/60 focus-visible:ring-green-500/30"
                            : inviteStatus === "invalid"
                            ? "border-destructive/60 focus-visible:ring-destructive/30"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {inviteStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {inviteStatus === "valid" && <CheckCircle2 className="h-4 w-4 text-positive" />}
                        {inviteStatus === "invalid" && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                    {inviteStatus === "valid" && inviteReferrer && (
                      <p className="text-xs text-positive flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Invited by <strong>{inviteReferrer}</strong>
                      </p>
                    )}
                    {inviteStatus === "invalid" && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Invalid invitation code
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You need a valid invitation code from an existing PexCoin member.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-bold"
                    disabled={register.isPending || inviteStatus !== "valid" || !!emailError}
                  >
                    {register.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                    ) : (
                      "Create Account"
                    )}
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
