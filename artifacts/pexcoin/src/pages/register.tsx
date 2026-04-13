import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister, useGetMe } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Loader2, Gift, BarChart2,
  Eye, EyeOff, UserPlus, TrendingUp, Shield, Zap,
} from "lucide-react";

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
  const [codeFromUrl, setCodeFromUrl] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const register = useRegister();
  const { data: user } = useGetMe({ query: { retry: false } });

  // Auto-fill referral code from URL (?ref=CODE or ?invite=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("invite") || params.get("code");
    if (ref && ref.trim().length >= 6) {
      setInviteCode(ref.trim().toUpperCase());
      setCodeFromUrl(true);
    }
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Validate invite code with debounce
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
      setInviteStatus("idle");
      setInviteReferrer(null);
    }
  }, []);

  useEffect(() => {
    if (!inviteCode) {
      setInviteStatus("idle");
      setInviteReferrer(null);
      return;
    }
    const t = setTimeout(() => validateInviteCode(inviteCode), 500);
    return () => clearTimeout(t);
  }, [inviteCode, validateInviteCode]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast({ title: "Enter your full name", variant: "destructive" });
      return;
    }
    if (!email.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
      return;
    }
    // If user typed an invite code but it's invalid, warn them
    if (inviteCode.trim().length > 0 && inviteStatus === "invalid") {
      toast({
        title: "Invalid referral code",
        description: "Clear the referral code field to register without one, or fix the code.",
        variant: "destructive",
      });
      return;
    }

    register.mutate(
      {
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phone.trim() || undefined,
          inviteCode: inviteStatus === "valid" ? inviteCode.trim().toUpperCase() : undefined,
        },
      },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast({
            title: "Account created! 🎉",
            description: `Welcome to PexCoin, ${data.user.name}!`,
          });
          navigate("/dashboard", { replace: true });
        },
        onError: (error: any) => {
          toast({
            title: "Registration failed",
            description: error?.data?.error ?? error?.message ?? "An error occurred. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const canSubmit =
    name.trim().length >= 2 &&
    email.includes("@") &&
    password.length >= 6 &&
    !register.isPending &&
    (inviteCode.trim().length === 0 || inviteStatus === "valid" || inviteStatus === "idle");

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
            <h2 className="text-2xl font-bold">Start Trading Today</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Join thousands of traders on PexCoin. Free to register — no invite required.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { icon: <TrendingUp className="h-4 w-4 text-[#0ecb81]" />, text: "Trade 24+ crypto pairs" },
                { icon: <Zap className="h-4 w-4 text-[#F0B90B]" />, text: "Real-time prices & charts" },
                { icon: <Gift className="h-4 w-4 text-primary" />, text: "Earn 5% on referral deposits" },
                { icon: <Shield className="h-4 w-4 text-blue-400" />, text: "Secure & private trading" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border/30 text-left">
                  {icon}
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" /> Create Account
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Free to join — start trading in minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              {/* Phone (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Referral Code (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="inviteCode" className="text-sm font-medium flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  Referral Code
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  {codeFromUrl && inviteStatus !== "invalid" && (
                    <span className="text-xs text-[#0ecb81] font-medium">• From invite link</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      setCodeFromUrl(false);
                    }}
                    placeholder="Enter code (e.g. AB12CD34)"
                    className={`h-10 font-mono uppercase tracking-widest pr-10 ${
                      inviteStatus === "valid"
                        ? "border-[#0ecb81]/60 focus-visible:ring-[#0ecb81]/30"
                        : inviteStatus === "invalid"
                        ? "border-destructive/60 focus-visible:ring-destructive/30"
                        : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {inviteStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {inviteStatus === "valid" && <CheckCircle2 className="h-4 w-4 text-[#0ecb81]" />}
                    {inviteStatus === "invalid" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>

                {inviteStatus === "valid" && inviteReferrer && (
                  <p className="text-xs text-[#0ecb81] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Invited by <strong>{inviteReferrer}</strong> — you'll both earn rewards!
                  </p>
                )}
                {inviteStatus === "invalid" && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <XCircle className="h-3 w-3" />
                    This code doesn't exist. Clear it to register without a referral.
                  </p>
                )}
                {inviteStatus === "idle" && !inviteCode && (
                  <p className="text-xs text-muted-foreground">Have a referral link? Paste your code here.</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-base mt-2"
                disabled={!canSubmit}
              >
                {register.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
