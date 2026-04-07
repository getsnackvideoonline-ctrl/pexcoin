import { ReactNode } from "react";
import { Header } from "./header";
import { ServerStatus } from "./server-status";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <ServerStatus />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row max-w-screen-2xl">
          <p className="text-balance text-center text-xs leading-loose text-muted-foreground md:text-left">
            &copy; 2024 PexCoin. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
