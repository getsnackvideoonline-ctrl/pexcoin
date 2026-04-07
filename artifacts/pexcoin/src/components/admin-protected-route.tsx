import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminToken } from "@/lib/auth-utils";

function isAdminTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    // Token is plain base64-encoded JSON (not a JWT)
    const payload = JSON.parse(atob(token));
    if (payload.role !== "admin") return false;
    if (payload.exp && payload.exp < Date.now()) return false; // exp is in ms
    return true;
  } catch {
    return false;
  }
}

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    const ok = isAdminTokenValid(token);
    setValid(ok);
    setChecking(false);
    if (!ok) {
      setLocation("/admin");
    }
  }, [setLocation]);

  if (checking) {
    return (
      <div className="p-8 space-y-4 bg-[#0a0a0a] min-h-screen">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!valid) return null;

  return <>{children}</>;
}
