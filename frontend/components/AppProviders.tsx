"use client";

import { MotiaClientProvider } from "@/components/MotiaClientProvider";
import { ClientProvider } from "@/components/ClientProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotiaClientProvider>
      <ClientProvider>{children}</ClientProvider>
    </MotiaClientProvider>
  );
}
