import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { removeToken } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Menu, X, BarChart2 } from "lucide-react";

export function Header() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        removeToken();
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
        setMobileOpen(false);
      },
      onSettled: () => {
        removeToken();
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
        setMobileOpen(false);
      }
    });
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      className={`transition-colors hover:text-foreground ${location === href ? "text-foreground font-semibold" : "text-foreground/60"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <span className="font-bold text-xl tracking-tight text-primary">PEXCOIN</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLink("/", "Markets")}
          {user && navLink("/dashboard", "Dashboard")}
          {user && navLink("/deposit", "Deposit")}
          {user && navLink("/withdraw", "Withdraw")}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-muted-foreground text-sm truncate max-w-[180px]">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-foreground/60 hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/98 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link href="/" onClick={() => setMobileOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors py-2 border-b border-border/30">
            Markets
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors py-2 border-b border-border/30">
                Dashboard
              </Link>
              <Link href="/deposit" onClick={() => setMobileOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors py-2 border-b border-border/30">
                Deposit
              </Link>
              <Link href="/withdraw" onClick={() => setMobileOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors py-2 border-b border-border/30">
                Withdraw
              </Link>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-3 truncate">{user.email}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
