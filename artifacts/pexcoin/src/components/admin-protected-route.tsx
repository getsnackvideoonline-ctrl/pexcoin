import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminToken } from "@/lib/auth-utils";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setLocation("/admin");
      return;
    }
    
    if (!isLoading && (error || !user || user.role !== "admin")) {
      setLocation("/admin");
    }
  }, [isLoading, error, user, setLocation]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 bg-[#1a1a1a] min-h-screen">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !user || user.role !== "admin") {
    return null; 
  }

  return <>{children}</>;
}
