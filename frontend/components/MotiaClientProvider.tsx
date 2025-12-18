"use client";

import { MotiaStreamProvider } from "@motiadev/stream-client-react";

export function MotiaClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotiaStreamProvider address="ws://localhost:3000">
      {children}
    </MotiaStreamProvider>
  );
}
