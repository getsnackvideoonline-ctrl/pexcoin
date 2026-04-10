import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Gift, BarChart2, Eye, EyeOff } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");
  const [inviteReferrer, setInviteReferrer] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const register = useRegister();
  const { data: user } = useGetMe({ query: { retry: false } });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("invite");
    if (ref) setInviteCode(ref.toUpperCase());
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const validateInviteCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setInviteStatus("idle");
      setInviteReferrer(null);
      return;
    }
    setInviteStatus("checking");
    try {
      const res = await fetch(`${BASE}/api/auth/invite/validate?code=${encodeURIComponent(code.toUpperCase())}`);
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
    if (!inviteCode) { setInviteStatus("idle"); setInviteReferrer(null); return; }
    const t = setTimeout(() => validateInviteCode(inviteCode), 600);
    return () => clearTimeout(t);
  }, [inviteCode, validateInviteCode]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError(val && !val.toLowerCase().endsWith("@gmail.com") ? "Only Gmail addresses (@gmail.com) are accepted" : null);
  };

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      toast({ title: "Invalid email", description: "Only Gmail (@gmail.com) addresses are accepted", variant: "destructive" });
      return;
    }
    if (inviteStatus !== "valid") {
      toast({ title: "Invalid invite code", description: "Please enter a valid invitation code", variant: "destructive" });
      return;
    }
    register.mutate(
      { data: { name, email: email.toLowerCase(), password, phone: phone || undefined, inviteCode: inviteCode.toUpperCase() } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast({ title: "Account created!", description: "Welcome to PexCoin!" });
          navigate("/dashboard", { replace: true });
        },
        onError: (error: any) => {
          toast({ title: "Registration failed", description: error?.data?.error ?? error?.message ?? "An error occurred", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="flex-1 flex min-h-[calc(100vh-56px)]">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary/20 via-primary/5 to-background border-r border-border/40 flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative z-10 text-center space-y-5 max-w-xs">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BarChart2 className="h-9 w-9 text-primary" />
              <span className="text-3xl font-bold text-primary">PEXCOIN</span>
            </div>
            <h2 className="text-xl font-bold">Join the Platform</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You need an invitation from an existing member to join PexCoin. Get your invite link from someone you trust.
            </p>
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-left space-y-3 mt-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Why invitation-only?</p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /> Ensures a trusted community of traders</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /> Protect platform integrity and security</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /> Referrers earn 5% commission on deposits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-sm space-y-5 py-4">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:hidden gap-2 mb-5">
                <BarChart2 className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold text-primary">PEXCOIN</span>
              </div>
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-muted-foreground text-sm mt-1">Join PexCoin and start trading today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input id="name" autoComplete="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
                  Email <span className="text-muted-foreground text-xs">(Gmail only)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className={`h-10 ${emailError ? "border-destructive" : ""}`}
                />
                {emailError && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> {emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Phone <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-10 pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inviteCode" className="text-sm flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  Invitation Code <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MAJID00001"
                    required
                    className={`h-10 font-mono uppercase tracking-widest pr-10 ${
                      inviteStatus === "valid" ? "border-green-500/60" : inviteStatus === "invalid" ? "border-destructive/60" : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {inviteStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {inviteStatus === "valid" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {inviteStatus === "invalid" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                {inviteStatus === "valid" && inviteReferrer && (
                  <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Invited by <strong>{inviteReferrer}</strong></p>
                )}
                {inviteStatus === "invalid" && (
                  <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Invalid invitation code</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-base mt-2"
                disabled={register.isPending || inviteStatus !== "valid" || !!emailError}
              >
                {register.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</> : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
